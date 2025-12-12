import React, { useEffect, useState, useMemo } from "react";
import { useContract, useAddress } from "@thirdweb-dev/react";
import { CONTRACT_ADDRESS } from "../../config";
import api from "../../../api.js";
import { ethers } from "ethers";

const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
const STAFF_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("STAFF_ROLE"));

export default function MedicineList() {
  const address = useAddress();
  const { contract } = useContract(CONTRACT_ADDRESS);

  const [medicines, setMedicines] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contractAdmin, setContractAdmin] = useState(false);
  const [contractStaff, setContractStaff] = useState(false);
  const [dbAdmin, setDbAdmin] = useState(false);
  const [dbStaff, setDbStaff] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const isAdmin = useMemo(() => contractAdmin || dbAdmin, [contractAdmin, dbAdmin]);
  const isStaff = useMemo(() => contractStaff || dbStaff, [contractStaff, dbStaff]);

  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [barangayFilter, setBarangayFilter] = useState("all");
  const [barangays, setBarangays] = useState([]);
  const [userBarangay, setUserBarangay] = useState(null);

  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteStatus, setDeleteStatus] = useState(null);

  // MetaMask confirmation helper
  const confirmWithMetaMask = async (action, details) => {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed");
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = await provider.getSigner();
    const walletAddress = await signer.getAddress();
    const timestamp = new Date().toISOString();
    const message = `GenLunaMedChain\nAction: ${action}\nUser: ${walletAddress}\nWhen: ${timestamp}\nDetails: ${details}`;
    try {
      await signer.signMessage(message);
      return walletAddress;
    } catch (err) {
      if (String(err?.message || "").toLowerCase().includes("user rejected")) {
        throw new Error("User rejected MetaMask confirmation");
      }
      throw err;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const medRes = await api.get("/medicines");
      const medicinesData = medRes.data.data || [];
      setMedicines(medicinesData);
      
      const uniqueBarangays = [...new Set(
        medicinesData
          .map(med => med.barangay)
          .filter(brgy => brgy && brgy.toUpperCase() !== 'RHU')
      )].sort();
      setBarangays(uniqueBarangays);
      
      const allStocks = medicinesData.flatMap(med => 
        (med.medicine_stocks || []).map(stock => ({
          ...stock,
          medicine_id: med.medicine_id
        }))
      );
      setStocks(allStocks);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Could not load medicines/stocks");
      setLoading(false);
    }
  };

  const checkAdmin = async () => {
    if (!contract || !address) {
      setContractAdmin(false);
      setContractStaff(false);
      setCheckingAdmin(false);
      return;
    }
    try {
      setCheckingAdmin(true);
      let adminStatus = false;
      let staffStatus = false;
      try {
        adminStatus = await contract.call("hasRole", [DEFAULT_ADMIN_ROLE, address]);
      } catch {
        try {
          const owner = await contract.call("owner");
          adminStatus = owner.toLowerCase() === address.toLowerCase();
        } catch {
          adminStatus = false;
        }
      }
      try {
        staffStatus = await contract.call("hasRole", [STAFF_ROLE, address]);
      } catch {
        staffStatus = false;
      }
      setContractAdmin(adminStatus);
      setContractStaff(staffStatus);
    } catch (err) {
      console.error("Admin check failed:", err);
      setContractAdmin(false);
      setContractStaff(false);
    } finally {
      setCheckingAdmin(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    checkAdmin();
  }, [address, contract]);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const { data } = await api.get('/users/me');
        const role = data?.user?.role;
        const barangay = data?.user?.barangay;
        
        if (role) {
          setDbAdmin(role === 'ADMIN' || role === 'MUNICIPAL_STAFF');
          setDbStaff(role === 'STAFF' || role === 'PHARMACIST');
        } else {
          setDbAdmin(false);
          setDbStaff(false);
        }
        
        if (barangay) {
          setUserBarangay(barangay);
          if (role !== 'ADMIN' && role !== 'MUNICIPAL_STAFF') {
            setBarangayFilter(barangay);
          }
        }
      } catch (_) {
        setDbAdmin(false);
        setDbStaff(false);
      }
    };
    fetchMe();
  }, [address]);

  const getTotalStock = (medId) => {
    return stocks
      .filter((s) => s.medicine_id === medId)
      .reduce((sum, s) => sum + (s.remaining_quantity || 0), 0);
  };

  const filteredAndSortedMedicines = medicines
    .filter((med) => {
      const matchesSearch =
        med.medicine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (med.medicine_stocks && med.medicine_stocks.some(stock => 
          stock.batch_number?.toLowerCase().includes(searchQuery.toLowerCase())
        ));
      
      // Modified barangay filter logic for staff
      let matchesBarangay = false;
      
      if (barangayFilter === "all") {
        // If filter is "all", staff sees their barangay + MUNICIPAL
        if (userBarangay && !dbAdmin) {
          matchesBarangay = med.barangay === userBarangay || med.barangay === 'MUNICIPAL';
        } else {
          // Admin sees everything
          matchesBarangay = true;
        }
      } else if (barangayFilter === "MUNICIPAL") {
        // Show only municipal medicines
        matchesBarangay = med.barangay === "MUNICIPAL";
      } else {
        // Show specific barangay
        matchesBarangay = med.barangay === barangayFilter;
      }
      
      const hasExpiredStock = med.medicine_stocks?.some(stock => 
        new Date(stock.expiry_date) < new Date()
      );
      
      if (filter === "all") return matchesSearch && matchesBarangay;
      if (filter === "active") return matchesSearch && matchesBarangay && !hasExpiredStock;
      if (filter === "expired") return matchesSearch && matchesBarangay && hasExpiredStock;
      return false;
    })
    .sort((a, b) => {
      const getEarliestExpiry = (med) => {
        if (!med.medicine_stocks || med.medicine_stocks.length === 0) return new Date();
        return Math.min(...med.medicine_stocks.map(s => new Date(s.expiry_date).getTime()));
      };
      
      const dateA = getEarliestExpiry(a);
      const dateB = getEarliestExpiry(b);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  const totalPages = Math.ceil(filteredAndSortedMedicines.length / itemsPerPage);
  const paginatedMedicines = filteredAndSortedMedicines.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const ViewModal = () => {
    if (!showViewModal || !selectedMedicine) return null;
    const totalStock = getTotalStock(selectedMedicine.medicine_id);
    const stocks = selectedMedicine.medicine_stocks || [];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-white border-b border-gray-300 p-3 sm:p-6 flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Medicine Details</h2>
            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={async () => {
                  await fetchData();
                  const updatedMed = medicines.find(m => m.medicine_id === selectedMedicine.medicine_id);
                  if (updatedMed) setSelectedMedicine(updatedMed);
                }}
                className="px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs sm:text-sm font-medium text-gray-900 transition-colors"
              >
                Refresh
              </button>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-900 text-2xl w-8 h-8 flex items-center justify-center">×</button>
            </div>
          </div>
          
          <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4 pb-2 border-b border-gray-300">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="col-span-1 sm:col-span-2 bg-gray-50 p-3 sm:p-4 rounded border border-gray-300">
                  <label className="text-xs font-semibold text-gray-900">Medicine Name</label>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 mt-1">{selectedMedicine.medicine_name}</p>
                </div>
                
                {selectedMedicine.barangay && (
                  <div className="col-span-1 sm:col-span-2 bg-gray-50 p-3 sm:p-4 rounded border border-gray-300">
                    <label className="text-xs font-semibold text-gray-900">Location</label>
                    <p className="text-sm sm:text-base font-medium text-gray-900 mt-1">{selectedMedicine.barangay}</p>
                  </div>
                )}
                
                <div className="bg-gray-50 p-3 rounded border border-gray-300">
                  <label className="text-xs font-semibold text-gray-900">Generic Name</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedMedicine.generic_name || 'N/A'}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded border border-gray-300">
                  <label className="text-xs font-semibold text-gray-900">Medicine Type</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedMedicine.medicine_type || 'N/A'}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded border border-gray-300">
                  <label className="text-xs font-semibold text-gray-900">Dosage Form</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedMedicine.dosage_form || 'N/A'}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded border border-gray-300">
                  <label className="text-xs font-semibold text-gray-900">Strength</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedMedicine.strength || 'N/A'}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded border border-gray-300">
                  <label className="text-xs font-semibold text-gray-900">Category</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedMedicine.category || 'N/A'}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded border border-gray-300">
                  <label className="text-xs font-semibold text-gray-900">Manufacturer</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedMedicine.manufacturer || 'N/A'}</p>
                </div>
                
                <div className="col-span-1 sm:col-span-2 bg-gray-50 p-3 rounded border border-gray-300">
                  <label className="text-xs font-semibold text-gray-900">Description</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedMedicine.description || 'N/A'}</p>
                </div>
                
                <div className="col-span-1 sm:col-span-2 bg-gray-50 p-3 rounded border border-gray-300">
                  <label className="text-xs font-semibold text-gray-900">Storage Requirements</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedMedicine.storage_requirements || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2 border-b border-gray-300">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">Stock Information</h3>
                <div className="text-base sm:text-lg font-semibold text-gray-900">{totalStock} units</div>
              </div>
              
              {stocks.length > 0 ? (
                <div className="space-y-3">
                  {stocks.map((stock, idx) => {
                    const isExpired = new Date(stock.expiry_date) < new Date();
                    return (
                      <div key={idx} className={`p-3 sm:p-4 rounded border ${isExpired ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="text-xs font-semibold text-gray-900">Batch Number</label>
                            <p className="text-sm font-medium text-gray-900 mt-1 break-all">{stock.batch_number}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-900">Quantity</label>
                            <p className="text-sm font-medium text-gray-900 mt-1">{stock.remaining_quantity} / {stock.quantity}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-900">Expiry Date</label>
                            <p className="text-sm font-medium text-gray-900 mt-1">{new Date(stock.expiry_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-900">Status</label>
                            <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${
                              isExpired ? 'bg-red-200 text-red-900' : 'bg-green-200 text-green-900'
                            }`}>
                              {isExpired ? 'Expired' : 'Active'}
                            </span>
                          </div>
                          {stock.storage_location && (
                            <div className="col-span-2">
                              <label className="text-xs font-semibold text-gray-900">Storage Location</label>
                              <p className="text-sm text-gray-900 mt-1">{stock.storage_location}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-gray-50 p-6 sm:p-8 rounded text-center border border-gray-300">
                  <p className="text-gray-900 font-medium text-sm sm:text-base">No stock batches available</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-300 p-3 sm:p-4 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <button onClick={() => setShowViewModal(false)} className="w-full sm:w-auto px-4 py-2 bg-white text-gray-900 font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors">
              Close
            </button>
            {(isAdmin || isStaff) && (
              <>
                <button 
                  onClick={() => {
                    setShowViewModal(false);
                    setShowEditModal(true);
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
                <button 
                  onClick={() => {
                    setShowViewModal(false);
                    setShowDeleteModal(true);
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white font-medium rounded hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const EditModal = () => {
    if (!showEditModal || !selectedMedicine) return null;

    const handleEditSubmit = async (e) => {
      e.preventDefault();
      if (!isAdmin) {
        setEditError("Only administrators can edit medicines");
        return;
      }

      setEditLoading(true);
      setEditError("");
      setEditSuccess("");

      const formData = new FormData(e.target);
      
      try {
        // MetaMask confirmation before backend update
        const confirmDetails = `Edit medicine ${selectedMedicine.medicine_id} - ${selectedMedicine.medicine_name}`;
        const walletAddress = await confirmWithMetaMask("EDIT_MEDICINE", confirmDetails);

        const medicineData = {
          medicine_name: formData.get("medicine_name"),
          medicine_type: formData.get("medicine_type"),
          description: formData.get("description"),
          generic_name: formData.get("generic_name"),
          dosage_form: formData.get("dosage_form"),
          strength: formData.get("strength"),
          manufacturer: formData.get("manufacturer"),
          category: formData.get("category"),
          storage_requirements: formData.get("storage_requirements"),
          wallet_address: walletAddress
        };

        await api.put(`/medicines/${selectedMedicine.medicine_id}`, medicineData);

        setEditSuccess("Medicine updated successfully!");
        setTimeout(() => {
          setShowEditModal(false);
          setEditSuccess("");
          fetchData();
        }, 1500);
      } catch (err) {
        console.error("Update failed:", err);
        setEditError(err.message || "Failed to update medicine");
      } finally {
        setEditLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-white border-b border-gray-300 p-3 sm:p-6 flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Edit Medicine</h2>
            <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-900 text-2xl w-8 h-8 flex items-center justify-center">×</button>
          </div>

          <form onSubmit={handleEditSubmit} className="p-3 sm:p-6">
            {editError && (
              <div className="mb-4 bg-red-50 border border-red-300 text-red-900 p-3 sm:p-4 rounded font-medium text-sm">
                {editError}
              </div>
            )}
            
            {editSuccess && (
              <div className="mb-4 bg-green-50 border border-green-300 text-green-900 p-3 sm:p-4 rounded font-medium text-sm">
                {editSuccess}
              </div>
            )}

            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4 pb-2 border-b border-gray-300">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">Medicine Name *</label>
                    <input
                      type="text"
                      name="medicine_name"
                      defaultValue={selectedMedicine.medicine_name}
                      required
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-1">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">Generic Name</label>
                    <input
                      type="text"
                      name="generic_name"
                      defaultValue={selectedMedicine.generic_name}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-1">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">Medicine Type</label>
                    <input
                      type="text"
                      name="medicine_type"
                      defaultValue={selectedMedicine.medicine_type}
                      placeholder="e.g., Tablet, Capsule, Syrup"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-1">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">Dosage Form</label>
                    <input
                      type="text"
                      name="dosage_form"
                      defaultValue={selectedMedicine.dosage_form}
                      placeholder="e.g., 500mg, 10ml"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-1">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">Strength</label>
                    <input
                      type="text"
                      name="strength"
                      defaultValue={selectedMedicine.strength}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-1">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">Category</label>
                    <input
                      type="text"
                      name="category"
                      defaultValue={selectedMedicine.category}
                      placeholder="e.g., Analgesic, Antibiotic"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-1">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">Manufacturer</label>
                    <input
                      type="text"
                      name="manufacturer"
                      defaultValue={selectedMedicine.manufacturer}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">Description</label>
                    <textarea
                      name="description"
                      defaultValue={selectedMedicine.description}
                      rows="3"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">Storage Requirements</label>
                    <textarea
                      name="storage_requirements"
                      defaultValue={selectedMedicine.storage_requirements}
                      rows="2"
                      placeholder="e.g., Store in cool, dry place"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-300 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-full sm:w-auto px-4 py-2 bg-white text-gray-900 font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading || !isAdmin}
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const DeleteModal = () => {
    if (!showDeleteModal || !selectedMedicine) return null;

    const handleDelete = async () => {
      setDeleteLoading(true);
      setDeleteError("");
      setDeleteStatus(null);

      try {
        // MetaMask confirmation before backend delete
        const confirmDetails = `Delete medicine ${selectedMedicine.medicine_id} - ${selectedMedicine.medicine_name}`;
        const walletAddress = await confirmWithMetaMask("DELETE_MEDICINE", confirmDetails);

        const res = await api.delete(`/medicines/${selectedMedicine.medicine_id}`, {
          headers: { 'x-wallet-address': walletAddress }
        });
        const txHash = res?.data?.blockchain_tx_hash || null;

        // Refresh underlying list immediately; keep modal open to show status
        fetchData();

        if (txHash) {
          setDeleteStatus({
            type: 'success',
            title: 'Blockchain delete confirmed',
            description: 'Server recorded the transaction. Database delete completed.',
            txHash
          });
        } else {
          setDeleteStatus({
            type: 'warning',
            title: 'Blockchain delete not confirmed',
            description: 'Server attempted blockchain delete but could not confirm. Database delete completed.',
            txHash: null
          });
        }
      } catch (err) {
        const msg = err?.message || "";
        console.error("Delete failed:", err);
        setDeleteStatus({
          type: 'error',
          title: 'Delete failed',
          description: msg || 'Unexpected error while deleting.'
        });
      } finally {
        setDeleteLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 shadow-2xl">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Confirm Deletion</h2>
          
          {deleteStatus && (
            <div
              className={`mb-4 p-3 sm:p-4 rounded border font-medium text-sm ${
                deleteStatus.type === 'success' ? 'bg-green-50 border-green-300 text-green-900' :
                deleteStatus.type === 'warning' ? 'bg-yellow-50 border-yellow-300 text-yellow-900' :
                'bg-red-50 border-red-300 text-red-900'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{deleteStatus.title}</div>
                  <div className="text-sm mt-1">{deleteStatus.description}</div>
                  {deleteStatus.txHash && (
                    <div className="text-xs mt-2">
                      Tx: <span className="font-mono bg-white/50 px-2 py-0.5 rounded border border-current break-all">{deleteStatus.txHash.slice(0, 10)}…{deleteStatus.txHash.slice(-8)}</span>
                      <a href="/blockchain" className="ml-2 underline">View</a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {deleteError && (
            <div className="mb-4 bg-red-50 border border-red-300 text-red-900 p-3 sm:p-4 rounded font-medium text-sm">
              {deleteError}
            </div>
          )}

          <p className="text-sm sm:text-base text-gray-900 mb-6">
            Are you sure you want to delete <strong>{selectedMedicine.medicine_name}</strong>? This action cannot be undone.
          </p>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
              className="w-full sm:w-auto px-4 py-2 bg-white text-gray-900 font-medium rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {deleteStatus ? 'Close' : 'Cancel'}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteLoading || !(isAdmin || isStaff) || !!deleteStatus}
              className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white font-medium rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">Medicine Inventory</h1>
          <p className="text-xs sm:text-sm text-gray-600">Manage and track your medicine stock</p>
        </div>

        {/* Wallet Info */}
        {address && (
          <div className="bg-white rounded-lg border border-gray-300 p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-900">Wallet:</span>
                  <span className="text-xs font-mono bg-gray-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-gray-900 border border-gray-300">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </div>
                <div className="hidden sm:block h-5 w-px bg-gray-300"></div>
                <span className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs font-semibold border ${
                  checkingAdmin
                    ? "bg-yellow-50 text-yellow-900 border-yellow-300"
                    : isAdmin || isStaff
                      ? "bg-green-50 text-green-900 border-green-300"
                      : "bg-gray-50 text-gray-900 border-gray-300"
                }`}>
                  {checkingAdmin ? "Checking Role..." : isAdmin ? "Admin Access" : isStaff ? "Staff Access" : "View Only"}
                </span>
                {userBarangay && !dbAdmin && (
                  <>
                    <div className="hidden sm:block h-5 w-px bg-gray-300"></div>
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs font-semibold bg-purple-50 text-purple-900 border border-purple-300">
                      {userBarangay}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-300 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">Search Medicine</label>
              <input
                type="text"
                placeholder="Search by name or batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">Filter by Location</label>
              <select
                value={barangayFilter}
                onChange={(e) => { setBarangayFilter(e.target.value); setCurrentPage(1); }}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {userBarangay && !dbAdmin ? (
                  <>
                    <option value="all">{userBarangay} + Municipal</option>
                    <option value={userBarangay}>{userBarangay}</option>
                    <option value="MUNICIPAL">Municipal</option>
                  </>
                ) : (
                  <>
                    <option value="all">All Locations</option>
                    {/* <option value="MUNICIPAL"> </option> */}
                    {barangays.map((brgy) => (
                      <option key={brgy} value={brgy}>{brgy}</option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">Filter by Status</label>
              <select
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Medicines</option>
                <option value="active">Active Only</option>
                <option value="expired">Expired Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">Sort by Expiry</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="asc">Oldest First</option>
                <option value="desc">Newest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg border border-gray-300 p-3 sm:p-4">
            <div className="text-xs font-semibold text-gray-600 mb-1">
              Total Medicines {barangayFilter !== "all" && `(${barangayFilter})`}
            </div>
            <div className="text-xl sm:text-2xl font-semibold text-gray-900">{filteredAndSortedMedicines.length}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-300 p-3 sm:p-4">
            <div className="text-xs font-semibold text-gray-600 mb-1">
              Active Medicines {barangayFilter !== "all" && `(${barangayFilter})`}
            </div>
            <div className="text-xl sm:text-2xl font-semibold text-green-600">
              {filteredAndSortedMedicines.filter(m => {
                const hasExpiredStock = m.medicine_stocks?.some(s => new Date(s.expiry_date) < new Date());
                return !hasExpiredStock;
              }).length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-300 p-3 sm:p-4">
            <div className="text-xs font-semibold text-gray-600 mb-1">
              With Expired Batches {barangayFilter !== "all" && `(${barangayFilter})`}
            </div>
            <div className="text-xl sm:text-2xl font-semibold text-red-600">
              {filteredAndSortedMedicines.filter(m => {
                const hasExpiredStock = m.medicine_stocks?.some(s => new Date(s.expiry_date) < new Date());
                return hasExpiredStock;
              }).length}
            </div>
          </div>
        </div>

        {/* Medicine Table */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-300 p-8 sm:p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 sm:h-10 w-8 sm:w-10 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-xs sm:text-sm text-gray-900">Loading medicines...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg border border-red-300 p-8 sm:p-12 text-center">
            <p className="text-xs sm:text-sm text-red-600 font-medium">{error}</p>
          </div>
        ) : filteredAndSortedMedicines.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-300 p-8 sm:p-12 text-center">
            <p className="text-xs sm:text-sm text-gray-900">No medicines found</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View - Shows on small screens */}
            <div className="block lg:hidden space-y-3">
              {paginatedMedicines.map((med) => {
                const totalStock = getTotalStock(med.medicine_id);
                const hasExpiredStock = med.medicine_stocks?.some(
                  (s) => new Date(s.expiry_date) < new Date()
                );
                
                const getEarliestExpiry = () => {
                  if (!med.medicine_stocks || med.medicine_stocks.length === 0) return null;
                  const dates = med.medicine_stocks.map(s => new Date(s.expiry_date));
                  const earliest = new Date(Math.min(...dates));
                  return earliest;
                };
                
                const earliestExpiry = getEarliestExpiry();
                const isExpired = earliestExpiry && earliestExpiry < new Date();
                
                return (
                  <div key={med.medicine_id} className="bg-white rounded-lg border border-gray-300 p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-base mb-1">{med.medicine_name}</h3>
                        <p className="text-sm text-gray-600">{med.generic_name || "N/A"}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-xs text-gray-600">Category:</span>
                          <p className="font-medium text-gray-900">{med.category || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-600">Type:</span>
                          <p className="font-medium text-gray-900">{med.medicine_type || "N/A"}</p>
                        </div>
                        {med.barangay && (
                          <div>
                            <span className="text-xs text-gray-600">Location:</span>
                            <p className="mt-1">
                              <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-900">
                                {med.barangay}
                              </span>
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="text-xs text-gray-600">Stock:</span>
                          <p className="mt-1">
                            <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-900">
                              {totalStock} units
                            </span>
                          </p>
                        </div>
                        {earliestExpiry && (
                          <div>
                            <span className="text-xs text-gray-600">Expiry:</span>
                            <p className={`font-medium mt-1 ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                              {earliestExpiry.toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="text-xs text-gray-600">Status:</span>
                          <p className="mt-1">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                hasExpiredStock
                                  ? "bg-red-100 text-red-900"
                                  : "bg-green-100 text-green-900"
                              }`}
                            >
                              {hasExpiredStock ? "Expired" : "Active"}
                            </span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setSelectedMedicine(med);
                            setShowViewModal(true);
                          }}
                          className="flex-1 text-center py-2 text-blue-600 hover:text-blue-800 font-medium text-sm border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                        >
                          View
                        </button>
                        {(isAdmin || isStaff) && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedMedicine(med);
                                setShowEditModal(true);
                              }}
                              className="flex-1 text-center py-2 text-yellow-600 hover:text-yellow-800 font-medium text-sm border border-yellow-600 rounded hover:bg-yellow-50 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setSelectedMedicine(med);
                                setShowDeleteModal(true);
                              }}
                              className="flex-1 text-center py-2 text-red-600 hover:text-red-800 font-medium text-sm border border-red-600 rounded hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View - Shows on large screens */}
            <div className="hidden lg:block bg-white rounded-lg border border-gray-300 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Medicine</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Generic Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Expiry Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedMedicines.map((med) => {
                      const totalStock = getTotalStock(med.medicine_id);
                      const hasExpiredStock = med.medicine_stocks?.some(
                        (s) => new Date(s.expiry_date) < new Date()
                      );
                      
                      const getEarliestExpiry = () => {
                        if (!med.medicine_stocks || med.medicine_stocks.length === 0) return null;
                        const dates = med.medicine_stocks.map(s => new Date(s.expiry_date));
                        const earliest = new Date(Math.min(...dates));
                        return earliest;
                      };
                      
                      const earliestExpiry = getEarliestExpiry();
                      const isExpired = earliestExpiry && earliestExpiry < new Date();
                      
                      return (
                        <tr key={med.medicine_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {med.medicine_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {med.generic_name || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {med.category || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {med.medicine_type || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {med.barangay && (
                              <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-900">
                                {med.barangay}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-900">
                              {totalStock} units
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-black">
                            {earliestExpiry ? (
                              <span className={`font-medium ${isExpired ? 'text-red-600' : 'text-black'}`}>
                                {earliestExpiry.toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-black">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                hasExpiredStock
                                  ? "bg-red-100 text-red-900"
                                  : "bg-green-100 text-green-900"
                              }`}
                            >
                              {hasExpiredStock ? "Expired" : "Active"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedMedicine(med);
                                  setShowViewModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                View
                              </button>
                              {(isAdmin || isStaff) && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedMedicine(med);
                                      setShowEditModal(true);
                                    }}
                                    className="text-yellow-600 hover:text-yellow-800 font-medium"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedMedicine(med);
                                      setShowDeleteModal(true);
                                    }}
                                    className="text-red-600 hover:text-red-800 font-medium"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-4 bg-white rounded-lg border border-gray-300 px-3 sm:px-4 py-3 gap-3">
                <div className="text-xs sm:text-sm text-gray-900">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modals */}
        {ViewModal()}
        {EditModal()}
        {DeleteModal()}
      </div>
    </div>
  );
}