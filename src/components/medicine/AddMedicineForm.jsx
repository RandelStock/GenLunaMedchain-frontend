import React, { useState, useEffect } from 'react';
import { useAddress } from "@thirdweb-dev/react";
import { useMedicineInventory } from "../../hooks/useMedicineData";
import api from "../../../api.js";
import { useRole } from "../auth/RoleProvider";


// Enable blockchain for medicine additions
const ENABLE_BLOCKCHAIN_FOR_MEDICINE = true;

// Dropdown options
const MEDICINE_TYPES = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Suspension',
  'Ointment',
  'Cream',
  'Drops',
  'Powder',
  'Solution'
];

const DOSAGE_FORMS = [
  '500mg',
  '250mg',
  '100mg',
  '50mg',
  '10ml',
  '5ml',
  '1mg',
  '2mg',
  '5mg',
  '10mg',
  '20mg',
  '100ml',
  '200ml'
];

const STRENGTHS = [
  'Low',
  'Medium',
  'High',
  '100mg',
  '200mg',
  '250mg',
  '500mg',
  '1g',
  '2g'
];

const MANUFACTURERS = [
  'Unilab',
  'Biogesic',
  'Pfizer',
  'GSK (GlaxoSmithKline)',
  'Novartis',
  'Astra Zeneca',
  'Johnson & Johnson',
  'Merck',
  'Sanofi',
  'Abbott',
  'Roche',
  'Bayer',
  'Generic Pharma'
];

const CATEGORIES = [
  'Antibiotic',
  'Analgesic',
  'Antipyretic',
  'Anti-inflammatory',
  'Antihypertensive',
  'Antidiabetic',
  'Antihistamine',
  'Antacid',
  'Vitamin',
  'Supplement',
  'Antiseptic',
  'Antiparasitic'
];

const STORAGE_REQUIREMENTS = [
  'Store in cool, dry place',
  'Refrigerate (2-8°C)',
  'Room temperature (15-30°C)',
  'Protect from light',
  'Keep away from moisture',
  'Store below 25°C',
  'Do not freeze'
];

const SUPPLIERS = [
  'Good Shepherd Pharmacy',
  'B.R. Galang Drugstore',
  'Sam\'s Pharmacy & Grocery',
  'Peninsula Pharmacy (branch)',
  'Valuemed Generics',
  'Medicament Pharma and Medical Supplies Distribution',
  'Carlos Superdrug',
  'South Star Drug',
  'Mercury Drug'
];

const STORAGE_LOCATIONS = [
  { value: 'MUNICIPAL', label: 'Municipal/RHU' },
  { value: 'BACONG_IBABA', label: 'Bacong Ibaba' },
  { value: 'BACONG_ILAYA', label: 'Bacong Ilaya' },
  { value: 'BARANGAY_1_POBLACION', label: 'Barangay 1 (Poblacion)' },
  { value: 'BARANGAY_2_POBLACION', label: 'Barangay 2 (Poblacion)' },
  { value: 'BARANGAY_3_POBLACION', label: 'Barangay 3 (Poblacion)' },
  { value: 'BARANGAY_4_POBLACION', label: 'Barangay 4 (Poblacion)' },
  { value: 'BARANGAY_5_POBLACION', label: 'Barangay 5 (Poblacion)' },
  { value: 'BARANGAY_6_POBLACION', label: 'Barangay 6 (Poblacion)' },
  { value: 'BARANGAY_7_POBLACION', label: 'Barangay 7 (Poblacion)' },
  { value: 'BARANGAY_8_POBLACION', label: 'Barangay 8 (Poblacion)' },
  { value: 'BARANGAY_9_POBLACION', label: 'Barangay 9 (Poblacion)' },
  { value: 'LAVIDES', label: 'Lavides' },
  { value: 'MAGSAYSAY', label: 'Magsaysay' },
  { value: 'MALAYA', label: 'Malaya' },
  { value: 'NIEVA', label: 'Nieva' },
  { value: 'RECTO', label: 'Recto' },
  { value: 'SAN_IGNACIO_IBABA', label: 'San Ignacio Ibaba' },
  { value: 'SAN_IGNACIO_ILAYA', label: 'San Ignacio Ilaya' },
  { value: 'SAN_ISIDRO_IBABA', label: 'San Isidro Ibaba' },
  { value: 'SAN_ISIDRO_ILAYA', label: 'San Isidro Ilaya' },
  { value: 'SAN_JOSE', label: 'San Jose' },
  { value: 'SAN_NICOLAS', label: 'San Nicolas' },
  { value: 'SAN_VICENTE', label: 'San Vicente' },
  { value: 'SANTA_MARIA_IBABA', label: 'Santa Maria Ibaba' },
  { value: 'SANTA_MARIA_ILAYA', label: 'Santa Maria Ilaya' },
  { value: 'SUMILANG', label: 'Sumilang' },
  { value: 'VILLARICA', label: 'Villarica' }
];

export default function AddMedicineForm() {
  const { userRole, userProfile } = useRole?.() || {};
  const [medicines, setMedicines] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const address = useAddress();
  const { 
    storeMedicineHash, 
    generateMedicineHash,
    getMedicineHash,
    contractLoaded,
    hasAccess,
    checkingAccess
  } = useMedicineInventory();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
        setMedicines(medRes.data.data || []);
        setStocks(stockRes.data.data || []);
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
          setMedicines(medRes.data.data || []);
          setStocks(stockRes.data.data || []);
        } catch (err) {
          console.error("Failed to refresh data:", err);
        }
      }, 1000);
    }
  }, [success]);

  const canAddMedicine = hasAccess || userRole === 'Admin' || userRole === 'MUNICIPAL_STAFF' || userRole === 'STAFF';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!address) {
      setError("Please connect your wallet first.");
      return;
    }

    // Only require contract if user has blockchain access
    if (hasAccess && !contractLoaded) {
      setError("Contract not loaded. Please refresh and try again.");
      return;
    }

    if (!canAddMedicine) {
      setError("Access denied. You don't have permission to add medicines. Please contact your administrator.");
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

      if (ENABLE_BLOCKCHAIN_FOR_MEDICINE) {
        try {
          // Check if exists on blockchain
          console.log("Checking blockchain for ID:", medicine.medicine_id);
          const existingHash = await getMedicineHash(medicine.medicine_id);
          console.log("Existing blockchain entry:", existingHash);

          if (existingHash && existingHash.exists) {
            // Delete the medicine we just created since blockchain failed
            await api.delete(`/medicines/${medicine.medicine_id}`);
            
            setError(
              `⚠️ Medicine ID ${medicine.medicine_id} already exists on blockchain!\n` +
              `Database entry was rolled back.\n\n` +
              `Added by: ${existingHash.addedBy}\n` +
              `Hash: ${existingHash.dataHash}\n\n` +
              `You need to clean up test data on blockchain first.`
            );
            setLoading(false);
            return;
          }

          // Generate and store hash with RETRY LOGIC
          const expiryTimestamp = Math.floor(new Date(medicineData.expiry_date).getTime() / 1000);
          const hashData = {
            name: medicineData.medicine_name,
            batchNumber: medicineData.batch_number,
            quantity: medicineData.quantity,
            expirationDate: expiryTimestamp,
            location: medicineData.storage_location,
            timestamp: Date.now()
          };

          const dataHash = generateMedicineHash(hashData);
          
          // 🚀 NEW: Enhanced transaction with automatic retry
          const maxRetries = 3;
          let txHash = null;
          let lastError = null;
          
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              console.log(`📤 Blockchain Attempt ${attempt}/${maxRetries}...`);
              
              // Add delay between retries
              if (attempt > 1) {
                console.log(`⏱️ Waiting 2 seconds before retry ${attempt}...`);
                setError(`Network issue detected. Retrying transaction (${attempt}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
              
              // Send transaction with explicit gas limit
              const tx = await storeMedicineHash(medicine.medicine_id, dataHash);
              txHash = tx.receipt?.transactionHash || tx.hash || tx.transactionHash;
              
              if (txHash) {
                console.log('✅ Transaction successful:', txHash);
                break; // Success! Exit retry loop
              }
              
            } catch (txError) {
              lastError = txError;
              console.warn(`❌ Attempt ${attempt} failed:`, txError.message);
              
              // Check if user cancelled (don't retry)
              if (txError.message?.includes('user rejected') || 
                  txError.message?.includes('User denied')) {
                throw new Error('Transaction cancelled by user');
              }
              
              // Check if it's a transient error that we should retry
              const isTransientError = 
                txError.message?.includes('Internal JSON-RPC error') ||
                txError.message?.includes('timeout') ||
                txError.message?.includes('network') ||
                txError.message?.includes('nonce') ||
                txError.message?.includes('gas');
              
              // If not transient and first attempt, throw immediately
              if (!isTransientError && attempt === 1) {
                throw txError;
              }
              
              // If last attempt, throw the error
              if (attempt === maxRetries) {
                throw lastError || txError;
              }
              
              // Continue to next retry
            }
          }
          
          // If we got here without a txHash, something went wrong
          if (!txHash) {
            throw lastError || new Error('Transaction failed after multiple attempts');
          }

          // Update database with blockchain info
          await api.patch(`/medicines/${medicine.medicine_id}`, {
            blockchain_hash: dataHash,
            blockchain_tx_hash: txHash,
            transaction_hash: txHash
          });

          await api.patch(`/stocks/${stock.stock_id}`, {
            blockchain_hash: dataHash,
            blockchain_tx_hash: txHash
          });

          setSuccess(
            `✅ Medicine "${medicineData.medicine_name}" successfully added!\n\n` +
            `📦 Batch: ${medicineData.batch_number}\n` +
            `🆔 Database ID: ${medicine.medicine_id}\n` +
            `⛓️ Blockchain TX: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`
          );

        } catch (blockchainErr) {
          console.error("Blockchain operation failed:", blockchainErr);
          
          // Delete the medicine we just created since blockchain failed
          await api.delete(`/medicines/${medicine.medicine_id}`);
          
          // Provide user-friendly error messages
          let errorMessage = 'Medicine was created in database but blockchain storage failed.\nDatabase entry has been rolled back.\n\n';
          
          if (blockchainErr.message?.includes('user rejected') || 
              blockchainErr.message?.includes('User denied') ||
              blockchainErr.message?.includes('cancelled by user')) {
            errorMessage += 'Reason: Transaction was cancelled.\n\nPlease try again when ready.';
          } else if (blockchainErr.message?.includes('insufficient funds')) {
            errorMessage += 'Reason: Insufficient MATIC for gas fees.\n\nPlease add MATIC to your wallet.';
          } else if (blockchainErr.message?.includes('Internal JSON-RPC error') ||
                    blockchainErr.message?.includes('network')) {
            errorMessage += 'Reason: Network congestion on Polygon Amoy testnet.\n\nThis is common on testnets. Please try again in a moment.';
          } else {
            errorMessage += `Error: ${blockchainErr.message}`;
          }
          
          setError(errorMessage);
          setLoading(false);
          return;
        }
      } else {
        // Blockchain disabled
        setSuccess(
          `✅ Medicine "${medicineData.medicine_name}" successfully added!\n\n` +
          `📦 Batch: ${medicineData.batch_number}\n` +
          `🆔 Database ID: ${medicine.medicine_id}\n` +
          `⛓️ Blockchain: disabled`
        );
      }

      e.target.reset();

    } catch (err) {
      console.error("Error adding medicine:", err);
      
      if (err.message?.includes("AccessControl") || err.message?.includes("Access denied")) {
        setError("Access Control Error: You don't have permission to perform this action. Please contact your administrator.");
      } else if (err.message?.includes("already exists")) {
        setError("This batch number already exists. Please use a unique batch number.");
      } else if (err.message?.includes("user rejected") || err.message?.includes("cancelled by user")) {
        setError("Transaction was cancelled.");
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(`Failed to add medicine: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingAccess || !contractLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-black">
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
            <h3 className="ml-3 text-lg font-semibold text-black">Wallet Required</h3>
          </div>
          <p className="text-black">Please connect your wallet to add medicines to the inventory.</p>
        </div>
      </div>
    );
  }

  if (!canAddMedicine) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start mb-4">
            <svg className="h-10 w-10 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-black">Access Denied</h3>
              <p className="text-black mt-2">You don't have permission to add medicines to the inventory!</p>
              <p className="text-black mt-2 text-sm">Please contact your system administrator to grant you blockchain access (STAFF role).</p>
              <p className="text-black mt-3 text-xs font-mono">Your wallet: {address.slice(0, 10)}...{address.slice(-8)}</p>
              <p className="text-black mt-2 text-xs">Current role: {userRole || 'None'}</p>
              <p className="text-black mt-2 text-xs">Blockchain access: {hasAccess ? '✅ Yes' : '❌ No'}</p>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Add New Medicine</h1>
          <p className="text-black text-sm">Enter complete medicine information and stock details</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              Access Granted
            </span>
            <span className="text-xs text-black">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-black whitespace-pre-line">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-black whitespace-pre-line">{success}</span>
            </div>
          </div>  
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-black mb-6">Medicine Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1.5">
                    Medicine Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="medicine_name" 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    placeholder="Enter medicine name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1.5">
                    Medicine Type <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="medicine_type" 
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select type</option>
                    {MEDICINE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1.5">Generic Name</label>
                  <input 
                    type="text" 
                    name="generic_name" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    placeholder="Enter generic name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1.5">
                    Dosage Form <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="dosage_form"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select dosage</option>
                    {DOSAGE_FORMS.map(form => (
                      <option key={form} value={form}>{form}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1.5">
                    Strength <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="strength"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select strength</option>
                    {STRENGTHS.map(strength => (
                      <option key={strength} value={strength}>{strength}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1.5">
                    Manufacturer <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="manufacturer"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select manufacturer</option>
                    {MANUFACTURERS.map(manufacturer => (
                      <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="category"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1.5">
                    Storage Requirements <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="storage_requirements"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select storage requirement</option>
                    {STORAGE_REQUIREMENTS.map(req => (
                      <option key={req} value={req}>{req}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1.5">Description</label>
                <textarea 
                  name="description" 
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter medicine description..."
                ></textarea>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-black mb-6">Stock Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1.5">
                    Batch Number <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="batch_number" 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    placeholder="Enter batch number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1.5">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    name="quantity" 
                    required 
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    placeholder="Enter quantity"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1.5">Unit Cost</label>
                  <input 
                    type="number" 
                    name="unit_cost" 
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1.5">
                    Supplier Name <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="supplier_name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select supplier</option>
                    {SUPPLIERS.map(supplier => (
                      <option key={supplier} value={supplier}>{supplier}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1.5">
                    Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="date" 
                    name="expiry_date" 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1.5">
                    Storage Location <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="storage_location"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select location</option>
                    {STORAGE_LOCATIONS.map(location => (
                      <option key={location.value} value={location.value}>{location.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-2.5 border border-gray-300 rounded-md text-black font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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