import React, { useState, useEffect } from 'react';
import { useAddress } from "@thirdweb-dev/react";
import { useMedicineInventory } from "../../hooks/useMedicineData";
import api from "../../../api.js";
import { useRole } from "../auth/RoleProvider";

// Enable blockchain for medicine additions
const ENABLE_BLOCKCHAIN_FOR_MEDICINE = true;

export default function AddMedicineForm() {
  const { userRole, userProfile } = useRole?.() || {};
  const [medicines, setMedicines] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const address = useAddress();
  const { 
    storeMedicineHash, 
    generateMedicineHash,
    contractLoaded,
    hasAccess,
    checkingAccess
  } = useMedicineInventory();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Debug logging
  useEffect(() => {
    console.log("AddMedicineForm State:", {
      address,
      contractLoaded,
      hasAccess,
      checkingAccess
    });
  }, [address, contractLoaded, hasAccess, checkingAccess]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [medRes, stockRes] = await Promise.all([
          api.get("/medicines"),
          api.get("/stocks")
        ]);
        setMedicines(medRes.data.data || []); // Extract nested data
        setStocks(stockRes.data.data || []); // Extract nested data
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (success) {
      setTimeout(async () => {
        try {
          const [medRes, stockRes] = await Promise.all([
            api.get("/medicines"),
            api.get("/stocks")
          ]);
          setMedicines(medRes.data.data || []); // Extract nested data
          setStocks(stockRes.data.data || []); // Extract nested data
        } catch (err) {
          console.error("Failed to refresh data:", err);
        }
      }, 1000);
    }
  }, [success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!address) {
      setError("Please connect your wallet first.");
      return;
    }

    if (!contractLoaded) {
      setError("Contract not loaded. Please refresh and try again.");
      return;
    }

    if (!hasAccess) {
      setError("Access denied. You don't have permission to add medicines. Please contact your administrator to grant you the STAFF role.");
      return;
    }

    const formData = new FormData(e.target);
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const medicineData = {
        medicine_name: formData.get("medicine_name"),
        medicine_type: formData.get("medicine_type") || "General",
        description: formData.get("description"),
        generic_name: formData.get("generic_name"),
        dosage_form: formData.get("dosage_form"),
        strength: formData.get("strength"),
        manufacturer: formData.get("manufacturer"),
        category: formData.get("category"),
        storage_requirements: formData.get("storage_requirements"),
        batch_number: formData.get("batch_number"),
        quantity: parseInt(formData.get("quantity")),
        unit_cost: parseFloat(formData.get("unit_cost")) || 0,
        supplier_name: formData.get("supplier_name"),
        date_received: new Date().toISOString(),
        expiry_date: formData.get("expiry_date"),
        storage_location: formData.get("storage_location") || "Main Storage",
        wallet_address: address,
        barangay: (userRole === 'Admin' || userRole === 'MUNICIPAL_STAFF')
          ? 'MUNICIPAL'
          : (userProfile?.barangay || userProfile?.assigned_barangay || null)
      };

      const dbResponse = await api.post("/medicines", medicineData);
      const { medicine, stock } = dbResponse.data;

      const expiryTimestamp = Math.floor(new Date(medicineData.expiry_date).getTime() / 1000);
      const hashData = {
        name: medicineData.medicine_name,
        batchNumber: medicineData.batch_number,
        quantity: medicineData.quantity,
        expirationDate: expiryTimestamp,
        location: medicineData.storage_location,
        timestamp: Date.now()
      };

      if (ENABLE_BLOCKCHAIN_FOR_MEDICINE) {
        const dataHash = generateMedicineHash(hashData);
        const tx = await storeMedicineHash(medicine.medicine_id, dataHash);
        const txHash = tx.receipt?.transactionHash || tx.hash || tx.transactionHash;

        await api.patch(`/medicines/${medicine.medicine_id}`, {
          blockchain_hash: dataHash,
          blockchain_tx_hash: txHash,
          transaction_hash: txHash
        });

        await api.patch(`/stocks/${stock.stock_id}`, {
          blockchain_hash: dataHash,
          blockchain_tx_hash: txHash
        });
      }

      setSuccess(
        `Medicine "${medicineData.medicine_name}" (Batch: ${medicineData.batch_number}) successfully added!\n` +
        `Database ID: ${medicine.medicine_id}\n` +
        `${ENABLE_BLOCKCHAIN_FOR_MEDICINE ? 'Blockchain: enabled' : 'Blockchain: skipped (non-money)'}`
      );
      
      e.target.reset();

    } catch (err) {
      console.error("Error adding medicine:", err);
      
      if (err.message?.includes("AccessControl") || err.message?.includes("Access denied")) {
        setError("Access Control Error: You don't have permission to perform this action. Please contact your administrator.");
      } else if (err.message?.includes("already exists")) {
        setError("This batch number already exists. Please use a unique batch number.");
      } else if (err.message?.includes("user rejected")) {
        setError("Transaction was cancelled by user.");
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(`Failed to add medicine: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking access OR contract is loading
  if (checkingAccess || !contractLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">
              {!contractLoaded ? "Loading contract..." : "Verifying permissions..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <svg className="h-10 w-10 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="ml-3 text-lg font-semibold text-yellow-900">Wallet Required</h3>
          </div>
          <p className="text-yellow-800">Please connect your wallet to add medicines to the inventory.</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start mb-4">
            <svg className="h-10 w-10 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-red-900">Access Denied</h3>
              <p className="text-red-800 mt-2">You don't have permission to add medicines to the inventory.</p>
              <p className="text-red-700 mt-2 text-sm">Please contact your system administrator to grant you the STAFF role.</p>
              <p className="text-gray-600 mt-3 text-xs font-mono">Your wallet: {address.slice(0, 10)}...{address.slice(-8)}</p>
            </div>
          </div>
          <button
            onClick={() => window.history.back()}
            className="mt-4 w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Medicine</h1>
          <p className="text-gray-600">Enter complete medicine information and stock details</p>
          <div className="mt-2 flex items-center space-x-2">
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full border border-green-200">
              Access Granted
            </span>
            <span className="text-xs text-gray-500">
              Wallet: {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-red-800 whitespace-pre-line">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-green-800 whitespace-pre-line">{success}</span>
            </div>
          </div>  
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Medicine Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medicine Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="medicine_name" 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medicine Type</label>
                <input 
                  type="text" 
                  name="medicine_type" 
                  placeholder="Tablet, Capsule, Syrup"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Generic Name</label>
                <input 
                  type="text" 
                  name="generic_name" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dosage Form</label>
                <input 
                  type="text" 
                  name="dosage_form" 
                  placeholder="500mg, 10ml"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Strength</label>
                <input 
                  type="text" 
                  name="strength" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                <input 
                  type="text" 
                  name="manufacturer" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input 
                  type="text" 
                  name="category" 
                  placeholder="Antibiotic, Analgesic"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Storage Requirements</label>
                <input 
                  type="text" 
                  name="storage_requirements" 
                  placeholder="Store in cool, dry place"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea 
                  name="description" 
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Enter medicine description..."
                ></textarea>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Stock Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Number <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="batch_number" 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  name="quantity" 
                  required 
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit Cost</label>
                <input 
                  type="number" 
                  name="unit_cost" 
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name</label>
                <input 
                  type="text" 
                  name="supplier_name" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date" 
                  name="expiry_date" 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Storage Location</label>
                <input 
                  type="text" 
                  name="storage_location" 
                  placeholder="Main Storage"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" 
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Adding Medicine...</span>
                </>
              ) : (
                <span>Add Medicine</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}