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

  const fetchData = async () => {
    try {
      setLoading(true);
      const medRes = await api.get("/medicines");
      const medicinesData = medRes.data.data || [];
      setMedicines(medicinesData);
      
      // Extract unique barangays from medicines (excluding RHU)
      const uniqueBarangays = [...new Set(
        medicinesData
          .map(med => med.barangay)
          .filter(brgy => brgy && brgy.toUpperCase() !== 'RHU')
      )].sort();
      setBarangays(uniqueBarangays);
      
      // Extract all stocks from nested medicine_stocks
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
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
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
      
      const matchesBarangay = barangayFilter === "all" || med.barangay === barangayFilter;
      
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
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Medicine Details</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={async () => {
                  await fetchData();
                  const updatedMed = medicines.find(m => m.medicine_id === selectedMedicine.medicine_id);
                  if (updatedMed) setSelectedMedicine(updatedMed);
                }}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-medium transition-all"
              >
                🔄 Refresh
              </button>
              <button onClick={() => setShowViewModal(false)} className="text-white hover:bg-white/20 rounded-lg w-8 h-8 flex items-center justify-center text-2xl transition-all">×</button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <label className="text-sm font-semibold text-blue-900">Medicine Name</label>
                  <p className="text-xl font-bold text-gray-900 mt-1">{selectedMedicine.medicine_name}</p>
                </div>
                
                {selectedMedicine.barangay && (
                  <div className="col-span-2 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                    <label className="text-sm font-semibold text-purple-900">📍 Location</label>
                    <p className="text-lg font-bold text-gray-900 mt-1">{selectedMedicine.barangay}</p>
                  </div>
                )}
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="text-sm font-semibold text-gray-900">Generic Name</label>
                  <p className="text-gray-900 mt-1">{selectedMedicine.generic_name || 'N/A'}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="text-sm font-semibold text-gray-900">Medicine Type</label>
                  <p className="text-gray-900 mt-1">{selectedMedicine.medicine_type || 'N/A'}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="text-sm font-semibold text-gray-900">Dosage Form</label>
                  <p className="text-gray-900 mt-1">{selectedMedicine.dosage_form || 'N/A'}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="text-sm font-semibold text-gray-900">Strength</label>
                  <p className="text-gray-900 mt-1">{selectedMedicine.strength || 'N/A'}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="text-sm font-semibold text-gray-900">Category</label>
                  <p className="text-gray-900 mt-1">{selectedMedicine.category || 'N/A'}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="text-sm font-semibold text-gray-900">Manufacturer</label>
                  <p className="text-gray-900 mt-1">{selectedMedicine.manufacturer || 'N/A'}</p>
                </div>
                
                <div className="col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="text-sm font-semibold text-gray-900">Description</label>
                  <p className="text-gray-900 mt-1">{selectedMedicine.description || 'N/A'}</p>
                </div>
                
                <div className="col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="text-sm font-semibold text-gray-900">Storage Requirements</label>
                  <p className="text-gray-900 mt-1">{selectedMedicine.storage_requirements || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Stock Information */}
            <div>
              <div className="flex items-center justify-between mb-4 border-b-2 border-green-500 pb-2">
                <h3 className="text-lg font-bold text-gray-900">Stock Information</h3>
                <div className="text-2xl font-bold text-green-600">{totalStock} units</div>
              </div>
              
              {stocks.length > 0 ? (
                <div className="space-y-3">
                  {stocks.map((stock, idx) => {
                    const isExpired = new Date(stock.expiry_date) < new Date();
                    return (
                      <div key={idx} className={`p-4 rounded-lg border-l-4 ${isExpired ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'}`}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-gray-900">Batch Number</label>
                            <p className="text-sm font-bold text-gray-900 mt-1">{stock.batch_number}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-900">Quantity</label>
                            <p className="text-sm font-bold text-gray-900 mt-1">{stock.remaining_quantity} / {stock.quantity}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-900">Expiry Date</label>
                            <p className="text-sm font-bold text-gray-900 mt-1">{new Date(stock.expiry_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-900">Status</label>
                            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${
                              isExpired ? 'bg-red-200 text-red-900' : 'bg-green-200 text-green-900'
                            }`}>
                              {isExpired ? '❌ Expired' : '✅ Active'}
                            </span>
                          </div>
                          {stock.storage_location && (
                            <div className="col-span-2 md:col-span-4">
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
                <div className="bg-gray-100 p-8 rounded-lg text-center">
                  <p className="text-gray-900 font-semibold">No stock batches available</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="sticky bottom-0 bg-gray-100 border-t border-gray-300 p-4 flex justify-end gap-3">
            <button onClick={() => setShowViewModal(false)} className="px-6 py-2 bg-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-400 transition-all">
              Close
            </button>
            {(isAdmin || isStaff) && (
              <>
                <button 
                  onClick={() => {
                    setShowViewModal(false);
                    setShowEditModal(true);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                  ✏️ Edit
                </button>
                <button 
                  onClick={() => {
                    setShowViewModal(false);
                    setShowDeleteModal(true);
                  }}
                  className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg"
                >
                  🗑️ Delete
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
        const medicineData = {
          medicine_name: formData.get("medicine_name"),
          medicine_type: formData.get("medicine_type"),
          description: formData.get("description"),
          generic_name: formData.get("generic_name"),
          dosage_form: formData.get("dosage_form"),
          strength: formData.get("strength"),
          manufacturer: formData.get("manufacturer"),
          category: formData.get("category"),
          storage_requirements: formData.get("storage_requirements")
        };

        await api.put(`/medicines/${selectedMedicine.medicine_id}`, medicineData);

        const dataString = JSON.stringify(medicineData);
        const encoder = new TextEncoder();
        const data = encoder.encode(dataString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const tx = await contract.call("updateMedicineHash", [
          selectedMedicine.medicine_id,
          hashHex
        ]);

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
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold">✏️ Edit Medicine</h2>
            <button onClick={() => setShowEditModal(false)} className="text-white hover:bg-white/20 rounded-lg w-8 h-8 flex items-center justify-center text-2xl transition-all">×</button>
          </div>

          <form onSubmit={handleEditSubmit} className="p-6">
            {editError && (
              <div className="mb-4 bg-red-100 border-l-4 border-red-600 text-red-900 p-4 rounded-lg font-semibold">
                ❌ {editError}
              </div>
            )}
            
            {editSuccess && (
              <div className="mb-4 bg-green-100 border-l-4 border-green-600 text-green-900 p-4 rounded-lg font-semibold">
                ✅ {editSuccess}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-2">Medicine Name *</label>
                    <input
                      type="text"
                      name="medicine_name"
                      defaultValue={selectedMedicine.medicine_name}
                      required
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Generic Name</label>
                    <input
                      type="text"
                      name="generic_name"
                      defaultValue={selectedMedicine.generic_name}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Medicine Type</label>
                    <input
                      type="text"
                      name="medicine_type"
                      defaultValue={selectedMedicine.medicine_type}
                      placeholder="e.g., Tablet, Capsule, Syrup"
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Dosage Form</label>
                    <input
                      type="text"
                      name="dosage_form"
                      defaultValue={selectedMedicine.dosage_form}
                      placeholder="e.g., 500mg, 10ml"
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Strength</label>
                    <input
                      type="text"
                      name="strength"
                      defaultValue={selectedMedicine.strength}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Category</label>
                    <input
                      type="text"
                      name="category"
                      defaultValue={selectedMedicine.category}
                      placeholder="e.g., Analgesic, Antibiotic"
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Manufacturer</label>
                    <input
                      type="text"
                      name="manufacturer"
                      defaultValue={selectedMedicine.manufacturer}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-2">Description</label>
                    <textarea
                      name="description"
                      defaultValue={selectedMedicine.description}
                      rows="3"
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-2">Storage Requirements</label>
                    <textarea
                      name="storage_requirements"
                      defaultValue={selectedMedicine.storage_requirements}
                      rows="2"
                      placeholder="e.g., Store in cool, dry place"
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-gray-300 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-6 py-3 bg-gray-300 text-gray-900 font-bold rounded-lg hover:bg-gray-400 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading || !isAdmin}
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {editLoading ? "Saving..." : "💾 Save Changes"}
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
      if (!isAdmin) {
        setDeleteError("Only administrators can delete medicines");
        return;
      }

      setDeleteLoading(true);
      setDeleteError("");

      try {
        const tx = await contract.call("deleteMedicineHash", [
          selectedMedicine.medicine_id
        ]);
        
        await api.delete(`/medicines/${selectedMedicine.medicine_id}`);
        
        setTimeout(() => {
          setShowDeleteModal(false);
          fetchData();
        }, 1500);
      } catch (err) {
        console.error("Delete failed:", err);
        setDeleteError(err.message || "Failed to delete medicine");
        setDeleteLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🗑️ Confirm Deletion</h2>
          
          {deleteError && (
            <div className="mb-4 bg-red-100 border-l-4 border-red-600 text-red-900 p-4 rounded-lg font-semibold">
              ❌ {deleteError}
            </div>
          )}

          <p className="text-gray-900 mb-6 font-medium">
            Are you sure you want to delete <strong className="text-red-600">{selectedMedicine.medicine_name}</strong>? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
              className="px-6 py-3 bg-gray-300 text-gray-900 font-bold rounded-lg hover:bg-gray-400 disabled:opacity-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteLoading || !isAdmin}
              className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {deleteLoading ? "Deleting..." : "🗑️ Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">💊 Medicine Inventory</h1>
          <p className="text-lg text-gray-900">Manage and track your medicine stock</p>
        </div>

        {/* Wallet Info Card */}
        {address && (
          <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-5 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4 flex-wrap gap-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-gray-900">🔗 Wallet:</span>
                  <span className="text-sm font-mono bg-blue-100 px-4 py-2 rounded-lg text-gray-900 font-semibold border border-blue-300">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </div>
                <div className="h-6 w-px bg-gray-400"></div>
                <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold border-2 ${
                  checkingAdmin
                    ? "bg-yellow-100 text-yellow-900 border-yellow-400"
                    : isAdmin || isStaff
                      ? "bg-green-100 text-green-900 border-green-400"
                      : "bg-gray-100 text-gray-900 border-gray-400"
                }`}>
                  {checkingAdmin ? "⏳ Checking Role..." : isAdmin ? "👑 Admin Access" : isStaff ? "👤 Staff Access" : "👁️ View Only"}
                </span>
                {userBarangay && !dbAdmin && (
                  <>
                    <div className="h-6 w-px bg-gray-400"></div>
                    <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold bg-purple-100 text-purple-900 border-2 border-purple-400">
                      📍 {userBarangay}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters Card */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <label className="block text-sm font-bold text-gray-900 mb-2">🔍 Search Medicine</label>
              <input
                type="text"
                placeholder="Search by name or batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">📍 Filter by Location</label>
              <select
                value={barangayFilter}
                onChange={(e) => { setBarangayFilter(e.target.value); setCurrentPage(1); }}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Locations</option>
                <option value="MUNICIPAL">Municipal</option>
                {barangays.map((brgy) => (
                  <option key={brgy} value={brgy}>{brgy}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">📊 Filter by Status</label>
              <select
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Medicines</option>
                <option value="active">Active Only</option>
                <option value="expired">Expired Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">📅 Sort by Expiry</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="asc">Oldest First</option>
                <option value="desc">Newest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-sm font-bold mb-2 opacity-90">
              📦 Total Medicines {barangayFilter !== "all" && `(${barangayFilter})`}
            </div>
            <div className="text-4xl font-bold">{filteredAndSortedMedicines.length}</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-sm font-bold mb-2 opacity-90">
              ✅ Active Medicines {barangayFilter !== "all" && `(${barangayFilter})`}
            </div>
            <div className="text-4xl font-bold">
              {filteredAndSortedMedicines.filter(m => {
                const hasExpiredStock = m.medicine_stocks?.some(s => new Date(s.expiry_date) < new Date());
                return !hasExpiredStock;
              }).length}
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-sm font-bold mb-2 opacity-90">
              ⚠️ With Expired Batches {barangayFilter !== "all" && `(${barangayFilter})`}
            </div>
            <div className="text-4xl font-bold">
              {filteredAndSortedMedicines.filter(m => {
                const hasExpiredStock = m.medicine_stocks?.some(s => new Date(s.expiry_date) < new Date());
                return hasExpiredStock;
              }).length}
            </div>
          </div>
        </div>

        {/* Medicine List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-6 text-xl text-gray-900 font-semibold">Loading medicines...</p>
          </div>
                    
        ) : error ? (
          <div className="bg-white rounded-xl shadow-lg border-2 border-red-300 p-16 text-center">
            <p className="text-xl text-red-600 font-bold">❌ {error}</p>
          </div>
        ) : filteredAndSortedMedicines.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-16 text-center">
            <p className="text-xl text-gray-900 font-semibold">No medicines found</p>
          </div>
        ) : (
          <>
            {/* Medicine Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedMedicines.map((med) => {
                const totalStock = getTotalStock(med.medicine_id);
                const hasExpiredStock = med.medicine_stocks?.some(
                  (s) => new Date(s.expiry_date) < new Date()
                );
                return (
                  <div
                    key={med.medicine_id}
                    className="bg-white border-2 border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-5 flex flex-col justify-between"
                  >
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {med.medicine_name}
                      </h3>
                      <p className="text-sm text-gray-900 font-medium mb-3">
                        {med.generic_name || "No generic name"}
                      </p>

                      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              hasExpiredStock
                                ? "bg-red-200 text-red-900 border-2 border-red-400"
                                : "bg-green-200 text-green-900 border-2 border-green-400"
                            }`}
                          >
                            {hasExpiredStock ? "❌ Expired" : "✅ Active"}
                          </span>
                          {med.barangay && (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-purple-200 text-purple-900 border-2 border-purple-400">
                              📍 {med.barangay}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-900 font-bold bg-blue-100 px-3 py-1 rounded-full border-2 border-blue-300">
                          {totalStock} units
                        </span>
                      </div>

                      <div className="text-sm text-gray-900 space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="font-semibold"><span className="text-blue-600">Category:</span> {med.category || "N/A"}</p>
                        <p className="font-semibold"><span className="text-blue-600">Manufacturer:</span> {med.manufacturer || "N/A"}</p>
                        <p className="font-semibold"><span className="text-blue-600">Type:</span> {med.medicine_type || "N/A"}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedMedicine(med);
                          setShowViewModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                      >
                        👁️ View
                      </button>
                      {(isAdmin || isStaff) && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedMedicine(med);
                              setShowEditModal(true);
                            }}
                            className="px-4 py-2 bg-yellow-500 text-white font-bold rounded-lg text-sm hover:bg-yellow-600 transition-all shadow-md hover:shadow-lg"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMedicine(med);
                              setShowDeleteModal(true);
                            }}
                            className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg text-sm hover:bg-red-700 transition-all shadow-md hover:shadow-lg"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.max(p - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  ← Previous
                </button>
                <span className="text-base text-gray-900 font-bold bg-white px-6 py-3 rounded-lg border-2 border-gray-300 shadow-md">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  Next →
                </button>
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