import React, { useState, useEffect } from "react";
import { useMedicineInventory } from "../../hooks/useMedicineData";
import { useContract, useAddress } from "@thirdweb-dev/react";
import { CONTRACT_ADDRESS } from "../../config";
import { ethers } from "ethers";

// Define role constants
const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
const STAFF_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("STAFF_ROLE"));

export default function EditStaffReceiptForm({
  receiptIndex,
  initialData,
  onSubmit,
  onClose,
  loading,
}) {
  const address = useAddress(); // Current wallet address
  const { contract } = useContract(CONTRACT_ADDRESS);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isStaff, setIsStaff] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const { updateStaffReceipt } = useMedicineInventory();

  const [formData, setFormData] = useState(initialData);

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
        console.log("Checking user roles for editing receipt - address:", address);
        
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
        
        // Staff can edit receipts, admins can also edit receipts
        if (!staffStatus && !adminStatus) {
          setError("🚨 Access Denied: Only authorized staff members can edit medicine receipts. Please contact your administrator to request staff access.");
        } else {
          setError(null); // Clear any previous error if user has proper role
        }
      } catch (err) {
        console.error("Error checking user roles:", err);
        setIsStaff(false);
        setIsAdmin(false);
        setError("❌ Unable to verify staff permissions. Please check your wallet connection.");
      } finally {
        setCheckingRole(false);
      }
    };

    checkUserRoles();
  }, [address, contract]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      setError("🚨 Access Denied: Only authorized staff members can edit medicine receipts.");
      return;
    }

    const safeIndex = parseInt(receiptIndex);
    if (isNaN(safeIndex) || safeIndex < 0) {
      setError("Invalid or missing receipt index.");
      return;
    }

    setLoading(true);
    setError(null);

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
        setError("🚨 Access Denied: You do not have staff privileges to edit medicine receipts!");
        setIsStaff(false);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Proceed with updating the receipt
      await updateStaffReceipt(safeIndex, formData);
      alert("✅ Receipt updated successfully!");
      onSubmit();
    } catch (err) {
      console.error("Error updating receipt:", err);
      
      // Handle specific error types
      if (err.message?.includes("AccessControl")) {
        setError("🚨 Access Control Error: You don't have permission to edit receipts.");
      } else if (err.message?.includes("user rejected")) {
        setError("❌ Transaction was cancelled by user.");
      } else {
        setError(`❌ Failed to update receipt: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking roles
  if (checkingRole) {
    return (
      <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded mt-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Verifying staff permissions...</p>
        </div>
      </div>
    );
  }

  // Show access denied if user doesn't have proper role
  if (!isStaff && !isAdmin) {
    return (
      <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded mt-6">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">Access Denied</h3>
              <p className="text-red-700 mt-1">Only authorized staff members can edit medicine receipts. Please contact your administrator to request staff access.</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button 
            onClick={onClose} 
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded mt-6">
      {/* Header with Role Status */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-700">✏️ Edit Medicine Receipt</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          isAdmin 
            ? 'bg-purple-100 text-purple-800 border border-purple-200' 
            : 'bg-green-100 text-green-800 border border-green-200'
        }`}>
          {isAdmin ? '👑 Admin' : '👨‍⚕️ Staff'}
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg mb-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-gray-600 block mb-1">Patient Name</label>
          <input 
            name="patientName" 
            value={formData.patientName} 
            onChange={handleChange} 
            required 
            className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 text-black" 
          />
        </div>

        <div>
          <label className="text-gray-600 block mb-1">Staff Name</label>
          <input 
            name="staffName" 
            value={formData.staffName} 
            onChange={handleChange} 
            required 
            className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 text-black" 
          />
        </div>

        <div>
          <label className="text-gray-600 block mb-1">Medicine Name</label>
          <input 
            name="medicineName" 
            value={formData.medicineName} 
            onChange={handleChange} 
            required 
            className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 text-black" 
          />
        </div>

        <div>
          <label className="text-gray-600 block mb-1">Quantity</label>
          <input 
            name="quantity" 
            type="number" 
            value={formData.quantity} 
            onChange={handleChange} 
            min={0} 
            required 
            className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 text-black" 
          />
        </div>

        <div>
          <label className="text-gray-600 block mb-1">Notes</label>
          <textarea 
            name="notes" 
            value={formData.notes} 
            onChange={handleChange} 
            className="border p-2 rounded w-full h-20 focus:ring-2 focus:ring-blue-500 text-black" 
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-between mt-4">
          <button 
            type="submit" 
            disabled={isLoading || (!isStaff && !isAdmin)} 
            className={`px-4 py-2 rounded text-white ${
              isLoading || (!isStaff && !isAdmin)
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isLoading ? "Updating..." : "Update Receipt"}
          </button>
          <button 
            type="button" 
            onClick={onClose} 
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}