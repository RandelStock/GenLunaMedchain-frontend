import React, { useState, useEffect } from 'react';
import { useMedicineInventory } from '../../hooks/useMedicineData';
import { useContract, useAddress } from "@thirdweb-dev/react";
import { CONTRACT_ADDRESS } from "../../config";
import { ethers } from "ethers";

// Correct way to calculate DEFAULT_ADMIN_ROLE
const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

export default function EditMedicineForm({ medicineIndex, initialData, onClose }) {
  const address = useAddress(); // Current wallet address
  const { contract } = useContract(CONTRACT_ADDRESS);
  const { updateMedicine } = useMedicineInventory();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Check admin role when component mounts or address/contract changes
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!address || !contract) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      try {
        setCheckingAdmin(true);
        console.log("Checking admin role for address:", address);
        console.log("Contract:", contract);
        
        // Try multiple ways to check admin role
        let adminStatus = false;
        
        try {
          // Method 1: Check DEFAULT_ADMIN_ROLE (0x00...)
          adminStatus = await contract.call("hasRole", [DEFAULT_ADMIN_ROLE, address]);
          console.log("DEFAULT_ADMIN_ROLE check result:", adminStatus);
        } catch (err1) {
          console.log("DEFAULT_ADMIN_ROLE check failed:", err1);
          
          try {
            // Method 2: Check if the contract was deployed by this address
            const owner = await contract.call("owner");
            adminStatus = owner.toLowerCase() === address.toLowerCase();
            console.log("Owner check result:", adminStatus, "Owner:", owner);
          } catch (err2) {
            console.log("Owner check failed:", err2);
            
            try {
              // Method 3: Check using keccak256 hash
              const adminRoleHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("DEFAULT_ADMIN_ROLE"));
              adminStatus = await contract.call("hasRole", [adminRoleHash, address]);
              console.log("Keccak256 admin role check result:", adminStatus);
            } catch (err3) {
              console.log("Keccak256 admin role check failed:", err3);
            }
          }
        }
        
        setIsAdmin(adminStatus);
        
        if (!adminStatus) {
          setError("🚨 Access Denied: Only administrators can edit medicine records. Please contact your system administrator if you believe this is an error.");
        } else {
          setError(null); // Clear any previous error if user is admin
        }
      } catch (err) {
        console.error("Error checking admin role:", err);
        setIsAdmin(false);
        setError("❌ Unable to verify admin permissions. Please check your wallet connection.");
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminRole();
  }, [address, contract]);

  // Function to manually grant admin role (for debugging)
  const grantAdminRole = async () => {
    if (!contract || !address) return;
    
    try {
      setLoading(true);
      console.log("Attempting to grant admin role to:", address);
      
      // Try to grant admin role to current address
      const tx = await contract.call("grantRole", [DEFAULT_ADMIN_ROLE, address]);
      console.log("Grant role transaction:", tx);
      
      // Recheck admin status
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err) {
      console.error("Failed to grant admin role:", err);
      setError("❌ Failed to grant admin role. You might not have permission to do this.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if user is connected and is admin
    if (!address) {
      setError("🔗 Please connect your wallet first.");
      return;
    }

    if (!contract) {
      setError("🔗 Contract connection failed. Please refresh and try again.");
      return;
    }

    // Validate index early
    const safeIndex = parseInt(medicineIndex);
    if (isNaN(safeIndex) || safeIndex < 0) {
      setError("❌ Invalid or missing medicine index.");
      return;
    }

    const formData = new FormData(e.target);
    const name = formData.get("name");  
    const batchNumber = formData.get("batchNumber");
    const notes = formData.get("notes");
    const location = formData.get("location");
    const quantity = parseInt(formData.get("quantity"));
    const expirationDate = Math.floor(new Date(formData.get("expirationDate")).getTime() / 1000);

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 🛑 Final admin check before proceeding
      let currentAdminStatus = false;
      try {
        currentAdminStatus = await contract.call("hasRole", [DEFAULT_ADMIN_ROLE, address]);
      } catch {
        // Try alternative method
        try {
          const adminRoleHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("DEFAULT_ADMIN_ROLE"));
          currentAdminStatus = await contract.call("hasRole", [adminRoleHash, address]);
        } catch {
          currentAdminStatus = false;
        }
      }

      if (!currentAdminStatus) {
        setError("🚨 Access Denied: You do not have administrator privileges to edit medicine records!");
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // ✅ Proceed with the medicine update
      await updateMedicine(safeIndex, {
        name,
        batchNumber,
        notes,
        quantity,
        expirationDate,
        location,
      });

      setSuccess(`✅ Medicine "${name}" (Batch: ${batchNumber}) updated successfully!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error updating medicine:", err);
      
      // Handle specific error types
      if (err.message?.includes("AccessControl")) {
        setError("🚨 Access Control Error: You don't have permission to perform this action.");
      } else if (err.message?.includes("Batch number already exists")) {
        setError("⚠️ This batch number already exists for this medicine. Please use a unique batch number.");
      } else if (err.message?.includes("user rejected")) {
        setError("❌ Transaction was cancelled by user.");
      } else {
        setError(`❌ Failed to update medicine: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking admin status
  if (checkingAdmin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Verifying administrator permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show wallet connection prompt if no address
  if (!address) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-yellow-800">Wallet Connection Required</h3>
                <p className="text-yellow-700 mt-1">Please connect your wallet to edit medicine records.</p>
              </div>
            </div>
            <div className="mt-4">
              <button 
                onClick={onClose}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">✏️ Edit Medicine</h2>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isAdmin 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {isAdmin ? '✅ Admin' : '🚫 Not Admin'}
            </span>
            <span className="text-sm text-gray-500">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}
            </span>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

       

        {/* Admin Access Denied Alert */}
        {!isAdmin && address && (
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">Access Restricted</h3>
                <div className="text-red-700 mt-2">
                  <p>Only system administrators can edit medicine records.</p>
                  <p className="mt-1 text-sm">If you believe you should have access, please contact your system administrator.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg mb-6">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{success}</span>
            </div>
          </div>  
        )}

        {/* Medicine Form - Only show if user is admin */}
        {isAdmin ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-600 block mb-2 font-medium">Medicine Name</label>
                <input 
                  type="text" 
                  name="name" 
                  defaultValue={initialData.name} 
                  required 
                  className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black" 
                />
              </div>

              <div>
                <label className="text-gray-600 block mb-2 font-medium">Batch Number</label>
                <input 
                  type="text" 
                  name="batchNumber" 
                  defaultValue={initialData.batchNumber} 
                  required 
                  className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black" 
                />
              </div>

              <div>
                <label className="text-gray-600 block mb-2 font-medium">Quantity</label>
                <input 
                  type="number" 
                  name="quantity" 
                  defaultValue={initialData.quantity} 
                  required 
                  min="1"
                  className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black" 
                />
              </div>

              <div>
                <label className="text-gray-600 block mb-2 font-medium">Expiration Date</label>
                <input 
                  type="date" 
                  name="expirationDate" 
                  defaultValue={initialData.expirationDate} 
                  required 
                  className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-gray-600 block mb-2 font-medium">Location</label>
                <input 
                  type="text" 
                  name="location" 
                  defaultValue={initialData.location} 
                  required 
                  className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-gray-600 block mb-2 font-medium">Notes</label>
                <textarea 
                  name="notes" 
                  defaultValue={initialData.notes} 
                  className="border border-gray-300 p-3 rounded-lg w-full h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Enter any additional notes about the medicine..."
                />
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <button 
                type="button" 
                onClick={onClose} 
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading || !isAdmin}
                className={`px-8 py-3 rounded-lg text-white font-medium transition-colors ${
                  loading || !isAdmin
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }`}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Access Required</h3>
              <p className="text-gray-500 mb-4">You need administrator privileges to edit medicine records.</p>
              <button 
                onClick={onClose}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}