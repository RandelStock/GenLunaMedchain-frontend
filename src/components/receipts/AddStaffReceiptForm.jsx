import React, { useState, useEffect } from "react";
import { useMedicineInventory } from "../../hooks/useMedicineData";
import { useContract, useAddress } from "@thirdweb-dev/react";
import { CONTRACT_ADDRESS } from "../../config";
import { ethers } from "ethers";

// Define role constants
const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
const STAFF_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("STAFF_ROLE"));

export default function AddStaffReceiptForm() {
  const address = useAddress(); // Current wallet address
  const { contract } = useContract(CONTRACT_ADDRESS);
  const { addStaffReceipt } = useMedicineInventory();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [, setReloadTrigger] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  // Check staff and admin roles when component mounts or address/contract changes
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
        console.log("Checking user roles for address:", address);
        
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
            
            try {
              // Method 3: Check using keccak256 hash for admin
              const adminRoleHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("DEFAULT_ADMIN_ROLE"));
              adminStatus = await contract.call("hasRole", [adminRoleHash, address]);
              console.log("Keccak256 admin role check result:", adminStatus);
            } catch (err3) {
              console.log("Keccak256 admin role check failed:", err3);
            }
          }
        }
        
        setIsStaff(staffStatus);
        setIsAdmin(adminStatus);
        
        // Staff can add receipts, admins can also add receipts
        if (!staffStatus && !adminStatus) {
          setError("🚨 Access Denied: Only authorized staff members or administrators can issue medicine receipts. Please contact your system administrator if you believe this is an error.");
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Double-check connection and role before submitting
    if (!address) {
      setError("🔗 Please connect your wallet first.");
      return;
    }

    if (!contract) {
      setError("🔗 Contract connection failed. Please refresh and try again.");
      return;
    }

    const formData = new FormData(e.target);
    const patientName = formData.get("patientName");
    const staffName = formData.get("staffName");
    const medicineName = formData.get("medicineName");
    const quantity = parseInt(formData.get("quantity"));
    const notes = formData.get("notes");

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 🛑 Final role check before proceeding
      let currentStaffStatus = false;
      let currentAdminStatus = false;
      
      try {
        currentStaffStatus = await contract.call("hasRole", [STAFF_ROLE, address]);
        currentAdminStatus = await contract.call("hasRole", [DEFAULT_ADMIN_ROLE, address]);
      } catch {
        // Fallback check for admin via owner or alternative methods
        try {
          const owner = await contract.call("owner");
          currentAdminStatus = owner.toLowerCase() === address.toLowerCase();
        } catch {
          try {
            const adminRoleHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("DEFAULT_ADMIN_ROLE"));
            currentAdminStatus = await contract.call("hasRole", [adminRoleHash, address]);
          } catch {
            currentAdminStatus = false;
          }
        }
      }

      if (!currentStaffStatus && !currentAdminStatus) {
        setError("🚨 Access Denied: You do not have staff or administrator privileges to issue medicine receipts!");
        setIsStaff(false);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // ✅ Proceed with adding the receipt
      console.log("Adding receipt with data:", { patientName, staffName, medicineName, quantity, notes });
      const tx = await addStaffReceipt({
        patientName,
        staffName,
        medicineName,
        quantity,
        notes,
      });

      setSuccess(`✅ Receipt successfully issued for patient "${patientName}" (Medicine: ${medicineName}, Quantity: ${quantity})!`);
      e.target.reset();

      // 🔄 Refresh receipts list
      setReloadTrigger((prev) => !prev);

    } catch (err) {
      console.error("Error adding receipt:", err);
      
      // Handle specific error types
      if (err.message?.includes("AccessControl")) {
        setError("🚨 Access Control Error: You don't have permission to issue receipts.");
      } else if (err.message?.includes("user rejected")) {
        setError("❌ Transaction was cancelled by user.");
      } else {
        setError(`❌ Failed to issue receipt: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking roles
  if (checkingRole) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Verifying staff permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show wallet connection prompt if no address
  if (!address) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-yellow-800">Wallet Connection Required</h3>
                <p className="text-yellow-700 mt-1">Please connect your wallet to access the receipt system.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Issue Medicine Receipt</h2>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isAdmin 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : isStaff 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {isAdmin ? '✅ Admin' : isStaff ? '✅ Staff' : '🚫 No Access'}
            </span>
            <span className="text-sm text-gray-500">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}
            </span>
          </div>
        </div>

        {/* Access Denied Alert */}
        {!isStaff && !isAdmin && address && (
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
                  <p>Only authorized staff members or administrators can issue medicine receipts.</p>
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
              <span className="text-lg">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg mb-6">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-lg">{success}</span>
            </div>
          </div>  
        )}

        {/* Receipt Form - Only show if user has proper role */}
        {(isStaff || isAdmin) ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-gray-700 block mb-2 text-lg font-medium">Patient Name</label>
                <input 
                  type="text" 
                  name="patientName" 
                  required 
                  className="border border-gray-300 p-4 rounded-lg w-full text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black" 
                />
              </div>

              <div>
                <label className="text-gray-700 block mb-2 text-lg font-medium">Staff Name</label>
                <input 
                  type="text" 
                  name="staffName" 
                  required 
                  className="border border-gray-300 p-4 rounded-lg w-full text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black" 
                />
              </div>

              <div>
                <label className="text-gray-700 block mb-2 text-lg font-medium">Medicine Name</label>
                <input 
                  type="text" 
                  name="medicineName" 
                  required 
                  className="border border-gray-300 p-4 rounded-lg w-full text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black" 
                />
              </div>

              <div>
                <label className="text-gray-700 block mb-2 text-lg font-medium">Quantity</label>
                <input 
                  type="number" 
                  name="quantity" 
                  required 
                  min="1" 
                  className="border border-gray-300 p-4 rounded-lg w-full text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-gray-700 block mb-2 text-lg font-medium">Notes</label>
                <textarea 
                  name="notes" 
                  className="border border-gray-300 p-4 rounded-lg w-full h-32 text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Enter any additional notes about the receipt..."
                ></textarea>
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <button 
                type="submit" 
                disabled={loading || (!isStaff && !isAdmin)} 
                className={`px-12 py-4 rounded-lg text-white text-lg font-semibold transition-colors ${
                  loading || (!isStaff && !isAdmin)
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }`}
              >
                {loading ? "Issuing..." : "Issue Receipt"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Staff Access Required</h3>
              <p className="text-gray-500">You need staff or administrator privileges to issue medicine receipts.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}