import React, { useEffect, useState } from "react";
import { useMedicineInventory } from "../../hooks/useMedicineData";
import { useContract, useAddress } from "@thirdweb-dev/react";
import { CONTRACT_ADDRESS } from "../../config";
import { ethers } from "ethers";
import EditStaffReceiptForm from "./EditReceiptForm";

// Define role constants
const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
const STAFF_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("STAFF_ROLE"));

export const useReceiptCount = () => {
  const { getReceiptCount, contractLoaded } = useMedicineInventory();
  const [receiptCount, setReceiptCount] = useState(0);

  useEffect(() => {
    if (!contractLoaded) return;

    const fetchReceiptCount = async () => {
      try {
        const count = await getReceiptCount();
        setReceiptCount(count);
      } catch (err) {
        console.error("Error fetching receipt count:", err);
      }
    };

    fetchReceiptCount();
  }, [contractLoaded]);

  return receiptCount;
};

export default function ReceiptList() {
  const address = useAddress(); // Current wallet address
  const { contract } = useContract(CONTRACT_ADDRESS);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isStaff, setIsStaff] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  const itemsPerPage = 5;

  const { getReceiptCount, getReceipt, removeStaffReceipt, contractLoaded } =
    useMedicineInventory();

  const [receipts, setReceipts] = useState([]);

  // Check staff and admin roles when component mounts
  useEffect(() => {
    const checkUserRoles = async () => {
      if (!address || !contract) {
        setIsStaff(false);
        setIsAdmin(false);
        setCheckingRole(false);
        return;
      }

      try {
        setCheckingRole(true);
        console.log("Checking user roles for receipt list - address:", address);
        
        let staffStatus = false;
        let adminStatus = false;
        
        try {
          // Check STAFF_ROLE
          staffStatus = await contract.call("hasRole", [STAFF_ROLE, address]);
          console.log("STAFF_ROLE check result:", staffStatus);
          
          // Check ADMIN_ROLE
          adminStatus = await contract.call("hasRole", [DEFAULT_ADMIN_ROLE, address]);
          console.log("ADMIN_ROLE check result:", adminStatus);
        } catch (err1) {
          console.log("Role check failed:", err1);
          
          try {
            // Alternative method: Check if owner
            const owner = await contract.call("owner");
            adminStatus = owner.toLowerCase() === address.toLowerCase();
            console.log("Owner check result:", adminStatus);
          } catch (err2) {
            console.log("Owner check failed:", err2);
          }
        }
        
        setIsStaff(staffStatus);
        setIsAdmin(adminStatus);
        
      } catch (err) {
        console.error("Error checking user roles:", err);
        setIsStaff(false);
        setIsAdmin(false);
      } finally {
        setCheckingRole(false);
      }
    };

    checkUserRoles();
  }, [address, contract]);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const count = await getReceiptCount();
      if (count === 0) {
        setReceipts([]);
        return;
      }

      const receiptData = await Promise.all(
        Array.from({ length: count }, (_, i) => getReceipt(i))
      );

      setReceipts(receiptData);
    } catch (err) {
      console.error("Failed to load receipts:", err);
      setError("Failed to load receipts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!contractLoaded) return;

    loadReceipts();

    const interval = setInterval(() => {
      if (receipts.length === 0) loadReceipts();
    }, 10000);

    return () => clearInterval(interval);
  }, [contractLoaded, receipts.length]);

  // Filter receipts
  const filteredAndSortedReceipts = receipts
    .filter((r) => {
      const matchesSearch =
        r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.medicineName.toLowerCase().includes(searchQuery.toLowerCase());

      if (filter === "all") return matchesSearch;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const receiptDate = new Date(r.timestamp * 1000);
      receiptDate.setHours(0, 0, 0, 0);

      if (filter === "today")
        return matchesSearch && receiptDate.getTime() === todayStart.getTime();

      if (filter === "older")
        return matchesSearch && receiptDate.getTime() < todayStart.getTime();

      return false;
    })
    .sort((a, b) => {
      const timeA = a.timestamp;
      const timeB = b.timestamp;
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedReceipts.length / itemsPerPage);
  const paginatedReceipts = filteredAndSortedReceipts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleDelete = async (index) => {
    // Check if user is connected
    if (!address) {
      setError("🔗 Please connect your wallet first.");
      return;
    }

    if (!contract) {
      setError("🔗 Contract connection failed. Please refresh and try again.");
      return;
    }

    // Check if user has staff or admin role
    if (!isStaff && !isAdmin) {
      setError("🚨 Access Denied: Only authorized staff members can delete medicine receipts.");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this receipt?");
    if (!confirmDelete) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Final role check before proceeding
      let currentStaffStatus = false;
      let currentAdminStatus = false;
      
      try {
        currentStaffStatus = await contract.call("hasRole", [STAFF_ROLE, address]);
        currentAdminStatus = await contract.call("hasRole", [DEFAULT_ADMIN_ROLE, address]);
      } catch {
        // Fallback check for admin via owner
        try {
          const owner = await contract.call("owner");
          currentAdminStatus = owner.toLowerCase() === address.toLowerCase();
        } catch {
          currentAdminStatus = false;
        }
      }

      if (!currentStaffStatus && !currentAdminStatus) {
        setError("🚨 Access Denied: You do not have staff privileges to delete medicine receipts!");
        setIsStaff(false);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Proceed with deleting the receipt
      await removeStaffReceipt(index);
      setSuccess("✅ Receipt deleted successfully!");
      await loadReceipts();
    } catch (err) {
      console.error("Error deleting receipt:", err);
      
      // Handle specific error types
      if (err.message?.includes("AccessControl")) {
        setError("🚨 Access Control Error: You don't have permission to delete receipts.");
      } else if (err.message?.includes("user rejected")) {
        setError("❌ Transaction was cancelled by user.");
      } else {
        setError(`❌ Failed to delete receipt: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (index) => {
    // Check if user has staff or admin role before allowing edit
    if (!isStaff && !isAdmin) {
      setError("🚨 Access Denied: Only authorized staff members can edit medicine receipts.");
      return;
    }
    
    setEditingIndex(index);
    setEditingReceipt(receipts[index]);
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditingReceipt(null);
  };

  const handleUpdateSubmit = async () => {
    try {
      setLoading(true);
      setSuccess(null);
      setError(null);

      setSuccess("✅ Receipt updated successfully!");
      await loadReceipts();
      handleCancel();
    } catch (err) {
      setError(`❌ Update failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking roles
  if (checkingRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Verifying staff permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Role Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-800">📋 Staff Issued Medicine Receipts</h2>
            {address && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Connected as:</span>
                <span className="text-sm font-mono text-gray-800">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isAdmin 
                    ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                    : isStaff 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {isAdmin ? '👑 Admin' : isStaff ? '👨‍⚕️ Staff' : '👁️ Read Only'}
                </span>
              </div>
            )}
          </div>
          
          {/* Access Control Info */}
          {address && (!isStaff && !isAdmin) && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ℹ️ You are viewing receipts in read-only mode. Only staff and admin users can edit or delete receipts.
              </p>
            </div>
          )}
          
          {!address && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                🔗 Connect your wallet to access editing and deletion features (if you have staff privileges).
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="flex flex-col">
            <label htmlFor="search" className="text-gray-700 mb-2 font-medium">Search:</label>
            <input
              id="search"
              type="text"
              placeholder="Patient, Staff, or Medicine"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-black"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="flex flex-col">
            <label htmlFor="filter" className="text-gray-700 mb-2 font-medium">Show:</label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            >
              <option value="all">All Receipts</option>
              <option value="today">Today Only</option>
              <option value="older">Older than Today</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex flex-col">
            <label htmlFor="sort" className="text-gray-700 mb-2 font-medium">Sort By:</label>
            <select
              id="sort"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            >
              <option value="asc">Oldest First</option>
              <option value="desc">Newest First</option>
            </select>
          </div>

          {/* Refresh Button */}
          <div className="flex flex-col justify-end">
            <button 
              onClick={loadReceipts} 
              disabled={loading} 
              className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg mb-6">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 p-4 rounded-lg mb-6">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Receipt Table */}
        {paginatedReceipts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg">No receipts found matching your filters.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-4 text-left font-semibold text-gray-700">Patient Name</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Staff Name</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Medicine Name</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Quantity</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Notes</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Timestamp</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReceipts.map((receipt, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-gray-800">{receipt.patientName}</td>
                      <td className="p-4 text-gray-800">{receipt.staffName}</td>
                      <td className="p-4 text-gray-800">{receipt.medicineName}</td>
                      <td className="p-4 text-gray-800">{receipt.quantity}</td>
                      <td className="p-4 text-gray-800">{receipt.notes || "N/A"}</td>
                      <td className="p-4 text-gray-800">{receipt.timestamp}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {(isStaff || isAdmin) ? (
                            <>
                              <button 
                                onClick={() => handleEditClick(idx)} 
                                disabled={loading} 
                                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors text-sm disabled:bg-gray-400"
                                title="Edit Receipt"
                              >
                                ✏️ Edit
                              </button>
                              <button 
                                onClick={() => handleDelete(idx)} 
                                disabled={loading} 
                                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors text-sm disabled:bg-gray-400"
                                title="Delete Receipt"
                              >
                                ❌ Delete
                              </button>
                            </>
                          ) : (
                            <div className="flex gap-2">
                              <button 
                                disabled 
                                className="bg-gray-300 text-gray-500 px-3 py-1 rounded text-sm cursor-not-allowed"
                                title="Staff access required"
                              >
                                ✏️ Edit
                              </button>
                              <button 
                                disabled 
                                className="bg-gray-300 text-gray-500 px-3 py-1 rounded text-sm cursor-not-allowed"
                                title="Staff access required"
                              >
                                ❌ Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
              <button 
                onClick={goToPrevPage} 
                disabled={currentPage === 1} 
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-gray-700 font-medium">
                Page {currentPage} of {totalPages} ({filteredAndSortedReceipts.length} receipts)
              </span>
              <button 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages} 
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </>
        )}

        {editingIndex !== null && editingReceipt && (
          <EditStaffReceiptForm 
            receiptIndex={editingIndex} 
            initialData={editingReceipt} 
            onSubmit={handleUpdateSubmit}
            onClose={handleCancel} 
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};