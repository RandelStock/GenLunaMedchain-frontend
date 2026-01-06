import React, { useState, useEffect } from 'react';
import { useAddress } from "@thirdweb-dev/react";
import { useMedicineInventory } from "../../hooks/useMedicineData";
import api from "../../../api.js"; // ✅ USE CONFIGURED API INSTANCE
import { useRole } from "../auth/RoleProvider";

// Enable blockchain for medicine additions
const ENABLE_BLOCKCHAIN_FOR_MEDICINE = true;

// ✅ NEW: Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds

// Dropdown options
const MEDICINE_TYPES = [
  { value: 'Tablet', label: 'Tablet' },
  { value: 'Capsule', label: 'Capsule' },
  { value: 'Syrup', label: 'Syrup' },
  { value: 'Injection', label: 'Injection' },
  { value: 'Suspension', label: 'Suspension' },
  { value: 'Ointment', label: 'Ointment' },
  { value: 'Cream', label: 'Cream' },
  { value: 'Drops', label: 'Drops' },
  { value: 'Powder', label: 'Powder' },
  { value: 'Solution', label: 'Solution' }
];

const DOSAGE_FORMS = [
  '500mg', '250mg', '100mg', '50mg', '10ml', '5ml',
  '1mg', '2mg', '5mg', '10mg', '20mg', '100ml', '200ml'
];

const STRENGTHS = [
  'Low', 'Medium', 'High', '100mg', '200mg',
  '250mg', '500mg', '1g', '2g'
];

const MANUFACTURERS = [
  'Unilab', 'Biogesic', 'Pfizer', 'GSK (GlaxoSmithKline)',
  'Novartis', 'Astra Zeneca', 'Johnson & Johnson', 'Merck',
  'Sanofi', 'Abbott', 'Roche', 'Bayer', 'Generic Pharma'
];

const CATEGORIES = [
  { value: 'Antibiotic', label: 'Antibiotic' },
  { value: 'Analgesic', label: 'Analgesic (Pain Relief)' },
  { value: 'Antipyretic', label: 'Antipyretic (Fever Reducer)' },
  { value: 'Anti-inflammatory', label: 'Anti-inflammatory' },
  { value: 'Antihypertensive', label: 'Antihypertensive (Blood Pressure)' },
  { value: 'Antidiabetic', label: 'Antidiabetic' },
  { value: 'Antihistamine', label: 'Antihistamine (Allergy)' },
  { value: 'Antacid', label: 'Antacid' },
  { value: 'Vitamin', label: 'Vitamin' },
  { value: 'Supplement', label: 'Supplement' },
  { value: 'Antiseptic', label: 'Antiseptic' },
  { value: 'Antiparasitic', label: 'Antiparasitic' }
];

const STORAGE_REQUIREMENTS = [
  { value: 'cool_dry', label: 'Store in cool, dry place' },
  { value: 'refrigerate', label: 'Refrigerate (2-8°C)' },
  { value: 'room_temp', label: 'Room temperature (15-30°C)' },
  { value: 'protect_light', label: 'Protect from light' },
  { value: 'away_moisture', label: 'Keep away from moisture' },
  { value: 'below_25', label: 'Store below 25°C' },
  { value: 'no_freeze', label: 'Do not freeze' }
];

const SUPPLIERS = [
  'Good Shepherd Pharmacy', 'B.R. Galang Drugstore',
  'Sam\'s Pharmacy & Grocery', 'Peninsula Pharmacy (branch)',
  'Valuemed Generics', 'Medicament Pharma and Medical Supplies Distribution',
  'Carlos Superdrug', 'South Star Drug', 'Mercury Drug'
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

const PACKAGING_UNITS = [
  { value: 'piece', label: 'Per Piece', multiplier: 1 },
  { value: 'box_10', label: 'Box of 10', multiplier: 10 },
  { value: 'box_20', label: 'Box of 20', multiplier: 20 },
  { value: 'box_50', label: 'Box of 50', multiplier: 50 },
  { value: 'box_100', label: 'Box of 100', multiplier: 100 },
  { value: 'bottle', label: 'Per Bottle', multiplier: 1 },
  { value: 'strip_10', label: 'Strip of 10', multiplier: 10 }
];

export default function AddMedicineForm() {
  const { userRole, userProfile, isLoading: roleLoading } = useRole?.() || {};
  
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
  const [retryCount, setRetryCount] = useState(0); // ✅ NEW: Track retry attempts

  // Form state with validation
  const [formData, setFormData] = useState({
    medicine_name: '',
    medicine_types: [],
    generic_name: '',
    dosage_form: '',
    strength: '',
    manufacturer: '',
    categories: [],
    storage_requirements: [],
    description: '',
    batch_number: '',
    quantity: '',
    packaging_unit: 'piece',
    cost_per_unit: '',
    supplier_name: '',
    expiry_date: '',
    storage_location: ''
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Get minimum date (tomorrow)
  const getMinExpiryDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Enhanced logging for debugging
  useEffect(() => {
    console.log("🔍 AddMedicineForm Access Check:", {
      address,
      userRole,
      userProfile,
      contractLoaded,
      hasAccess,
      checkingAccess,
      roleLoading
    });
  }, [address, userRole, userProfile, contractLoaded, hasAccess, checkingAccess, roleLoading]);

  // Fetch data on mount - ✅ ALREADY USING API
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

  // Refresh data after success - ✅ ALREADY USING API
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

  const canAddMedicine = userRole === 'ADMIN' || 
                         userRole === 'MUNICIPAL_STAFF' || 
                         userRole === 'STAFF';

  // Validation functions (unchanged)
  const validateField = (name, value) => {
    let errorMsg = '';

    switch (name) {
      case 'medicine_name':
        if (!value || value.trim().length === 0) {
          errorMsg = 'Medicine name is required';
        } else if (value.trim().length < 3) {
          errorMsg = 'Medicine name must be at least 3 characters';
        } else if (value.trim().length > 100) {
          errorMsg = 'Medicine name must not exceed 100 characters';
        }
        break;

      case 'medicine_types':
        if (!value || value.length === 0) {
          errorMsg = 'Please select at least one medicine type';
        }
        break;

      case 'generic_name':
        if (value && value.trim().length > 0 && value.trim().length < 2) {
          errorMsg = 'Generic name must be at least 2 characters';
        }
        break;

      case 'dosage_form':
        if (!value) {
          errorMsg = 'Dosage form is required';
        }
        break;

      case 'strength':
        if (!value) {
          errorMsg = 'Strength is required';
        }
        break;

      case 'manufacturer':
        if (!value) {
          errorMsg = 'Manufacturer is required';
        }
        break;

      case 'categories':
        if (!value || value.length === 0) {
          errorMsg = 'Please select at least one category';
        }
        break;

      case 'storage_requirements':
        if (!value || value.length === 0) {
          errorMsg = 'Please select at least one storage requirement';
        }
        break;

      case 'batch_number':
        if (!value || value.trim().length === 0) {
          errorMsg = 'Batch number is required';
        } else if (value.trim().length < 3) {
          errorMsg = 'Batch number must be at least 3 characters';
        } else if (!/^[A-Za-z0-9-_]+$/.test(value)) {
          errorMsg = 'Batch number can only contain letters, numbers, hyphens, and underscores';
        }
        break;

      case 'quantity':
        const qty = parseInt(value);
        if (!value || value === '') {
          errorMsg = 'Quantity is required';
        } else if (isNaN(qty) || qty < 1) {
          errorMsg = 'Quantity must be at least 1';
        } else if (qty > 1000000) {
          errorMsg = 'Quantity seems unusually high. Please verify.';
        }
        break;

      case 'cost_per_unit':
        const cost = parseFloat(value);
        if (!value || value === '') {
          errorMsg = 'Cost per unit is required';
        } else if (isNaN(cost) || cost < 0) {
          errorMsg = 'Cost must be a positive number';
        } else if (cost > 100000) {
          errorMsg = 'Cost seems unusually high. Please verify.';
        }
        break;

      case 'supplier_name':
        if (!value) {
          errorMsg = 'Supplier name is required';
        }
        break;

      case 'expiry_date':
        if (!value) {
          errorMsg = 'Expiry date is required';
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (selectedDate <= today) {
            errorMsg = 'Expiry date must be in the future';
          }
          
          const twoYearsFromNow = new Date();
          twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 10);
          if (selectedDate > twoYearsFromNow) {
            errorMsg = 'Expiry date seems too far in the future (max 10 years)';
          }
        }
        break;

      case 'storage_location':
        if (!value) {
          errorMsg = 'Storage location is required';
        }
        break;

      default:
        break;
    }

    return errorMsg;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setFieldErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleCheckboxChange = (name, value) => {
    setFormData(prev => {
      const currentValues = prev[name] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return { ...prev, [name]: newValues };
    });

    if (touched[name]) {
      const currentValues = formData[name] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      const error = validateField(name, newValues);
      setFieldErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Calculate unit cost based on packaging
  const calculateUnitCost = () => {
    const packagingUnit = PACKAGING_UNITS.find(u => u.value === formData.packaging_unit);
    const costPerUnit = parseFloat(formData.cost_per_unit) || 0;
    
    if (packagingUnit && costPerUnit > 0) {
      return (costPerUnit / packagingUnit.multiplier).toFixed(2);
    }
    return '0.00';
  };

  // ✅ NEW: Retry mechanism for blockchain transactions
  const retryBlockchainTransaction = async (transactionFn, retries = MAX_RETRIES) => {
    for (let i = 0; i < retries; i++) {
      try {
        setRetryCount(i + 1);
        console.log(`📤 Blockchain Attempt ${i + 1}/${retries}...`);
        
        const result = await transactionFn();
        console.log('✅ Blockchain transaction successful');
        setRetryCount(0);
        return result;
      } catch (error) {
        console.error(`❌ Blockchain attempt ${i + 1} failed:`, error);
        
        // Check if user rejected the transaction
        if (error.message && (
          error.message.includes('user rejected') || 
          error.message.includes('User denied') ||
          error.code === 4001
        )) {
          console.log('User rejected transaction');
          throw new Error('Transaction rejected by user');
        }
        
        // If it's the last retry, throw the error
        if (i === retries - 1) {
          throw new Error(`Transaction failed after ${retries} attempts: ${error.message}`);
        }
        
        // Wait before retrying (exponential backoff)
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, i);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const errors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) errors[key] = error;
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      setError('Please fix all validation errors before submitting.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!address) {
      setError("Please connect your wallet first.");
      return;
    }

    if (!contractLoaded) {
      setError("Contract not loaded. Please refresh and try again.");
      return;
    }

    if (!canAddMedicine) {
      setError("Access denied. You need STAFF or ADMIN role to perform this action.");
      return;
    }

    if (ENABLE_BLOCKCHAIN_FOR_MEDICINE && !hasAccess) {
      setError(
        "⚠️ Blockchain Access Required\n\n" +
        "Your database role is: " + userRole + " ✅\n" +
        "But you don't have blockchain permissions.\n\n" +
        "Your wallet: " + address + "\n\n" +
        "Please contact your administrator to grant blockchain access."
      );
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const unitCost = parseFloat(calculateUnitCost());
      
      const medicineData = {
        medicine_name: formData.medicine_name.trim(),
        medicine_type: formData.medicine_types.join(', '),
        description: formData.description.trim(),
        generic_name: formData.generic_name.trim(),
        dosage_form: formData.dosage_form,
        strength: formData.strength,
        manufacturer: formData.manufacturer,
        category: formData.categories.join(', '),
        storage_requirements: formData.storage_requirements.map(req => {
          const found = STORAGE_REQUIREMENTS.find(r => r.value === req);
          return found ? found.label : req;
        }).join(', '),
        batch_number: formData.batch_number.trim(),
        quantity: parseInt(formData.quantity),
        unit_cost: unitCost,
        supplier_name: formData.supplier_name,
        date_received: new Date().toISOString(),
        expiry_date: formData.expiry_date,
        storage_location: formData.storage_location,
        wallet_address: address,
        barangay: (userRole === 'ADMIN' || userRole === 'MUNICIPAL_STAFF')
          ? 'MUNICIPAL'
          : (userProfile?.barangay || userProfile?.assigned_barangay || null)
      };

      // ✅ ALREADY USING API - Create medicine in database
      const dbResponse = await api.post("/medicines", medicineData);
      const { medicine, stock } = dbResponse.data;

      if (ENABLE_BLOCKCHAIN_FOR_MEDICINE) {
        try {
          console.log("Checking blockchain for ID:", medicine.medicine_id);
          const existingHash = await getMedicineHash(medicine.medicine_id);

          if (existingHash && existingHash.exists) {
            // ✅ ALREADY USING API - Rollback
            await api.delete(`/medicines/${medicine.medicine_id}`);
            
            setError(
              `⚠️ Medicine ID ${medicine.medicine_id} already exists on blockchain!\n` +
              `Database entry was rolled back.\n\n` +
              `Added by: ${existingHash.addedBy}\n` +
              `Hash: ${existingHash.dataHash}`
            );
            setLoading(false);
            return;
          }

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
          
          // ✅ NEW: Use retry mechanism for blockchain transaction
          let txHash = null;
          
          try {
            const tx = await retryBlockchainTransaction(async () => {
              return await storeMedicineHash(medicine.medicine_id, dataHash);
            });
            
            txHash = tx.receipt?.transactionHash || tx.hash || tx.transactionHash;
            
            if (!txHash) {
              throw new Error('Transaction succeeded but no hash was returned');
            }
            
            console.log('✅ Transaction successful:', txHash);
            
          } catch (txError) {
            console.error('Blockchain transaction failed:', txError);
            throw txError;
          }

          // ✅ ALREADY USING API - Update medicine with blockchain info
          await api.patch(`/medicines/${medicine.medicine_id}`, {
            blockchain_hash: dataHash,
            blockchain_tx_hash: txHash,
            transaction_hash: txHash
          });

          // ✅ ALREADY USING API - Update stock with blockchain info
          await api.patch(`/stocks/${stock.stock_id}`, {
            blockchain_hash: dataHash,
            blockchain_tx_hash: txHash
          });

          setSuccess(
            `✅ Medicine "${medicineData.medicine_name}" successfully added!\n\n` +
            `📦 Batch: ${medicineData.batch_number}\n` +
            `🆔 Database ID: ${medicine.medicine_id}\n` +
            `💰 Unit Cost: ₱${unitCost}\n` +
            `⛓️ Blockchain TX: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`
          );

        } catch (blockchainErr) {
          console.error("Blockchain operation failed:", blockchainErr);
          
          // ✅ ALREADY USING API - Rollback on blockchain failure
          await api.delete(`/medicines/${medicine.medicine_id}`);
          
          let errorMessage = 'Medicine was created in database but blockchain storage failed.\nDatabase entry has been rolled back.\n\n';
          
          if (blockchainErr.message?.includes('user rejected') || 
              blockchainErr.message?.includes('User denied') ||
              blockchainErr.message?.includes('rejected by user')) {
            errorMessage += 'Reason: Transaction was cancelled.\n\nPlease try again when ready.';
          } else if (blockchainErr.message?.includes('insufficient funds')) {
            errorMessage += 'Reason: Insufficient MATIC for gas fees.\n\nPlease add MATIC to your wallet.';
          } else if (blockchainErr.message?.includes(`failed after ${MAX_RETRIES} attempts`)) {
            errorMessage += `Reason: Network congestion - failed after ${MAX_RETRIES} automatic retries.\n\nPlease try again in a few minutes.`;
          } else {
            errorMessage += `Error: ${blockchainErr.message}`;
          }
          
          setError(errorMessage);
          setLoading(false);
          return;
        }
      } else {
        setSuccess(
          `✅ Medicine "${medicineData.medicine_name}" successfully added!\n\n` +
          `📦 Batch: ${medicineData.batch_number}\n` +
          `🆔 Database ID: ${medicine.medicine_id}\n` +
          `💰 Unit Cost: ₱${unitCost}\n` +
          `⛓️ Blockchain: disabled`
        );
      }

      // Reset form
      setFormData({
        medicine_name: '',
        medicine_types: [],
        generic_name: '',
        dosage_form: '',
        strength: '',
        manufacturer: '',
        categories: [],
        storage_requirements: [],
        description: '',
        batch_number: '',
        quantity: '',
        packaging_unit: 'piece',
        cost_per_unit: '',
        supplier_name: '',
        expiry_date: '',
        storage_location: ''
      });
      setFieldErrors({});
      setTouched({});

    } catch (err) {
      console.error("Error adding medicine:", err);
      
      if (err.message?.includes("AccessControl")) {
        setError("Access Control Error: You don't have permission to perform this action.");
      } else if (err.message?.includes("already exists")) {
        setError("This batch number already exists. Please use a unique batch number.");
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(`Failed to add medicine: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
      setRetryCount(0);
    }
  };

  // LOADING STATES - ✅ FIXED: All text now dark (text-gray-900)
  if (checkingAccess || roleLoading || !contractLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-900 font-medium">
              {roleLoading ? "Loading user role..." : 
               !contractLoaded ? "Loading contract..." : 
               "Verifying permissions..."}
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
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Wallet Required</h3>
          </div>
          <p className="text-gray-800">Please connect your wallet to add medicines to the inventory.</p>
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
              <h3 className="text-lg font-semibold text-gray-900">Access Denied</h3>
              <p className="text-gray-800 mt-2">You don't have permission to add medicines.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // MAIN FORM RENDER - ✅ FIXED: All text now dark and visible
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Medicine</h1>
          <p className="text-gray-800 text-sm">Enter complete medicine information and stock details</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              Access Granted
            </span>
            <span className="text-xs text-gray-900 font-mono">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </div>
        </div>

        {/* ✅ NEW: Retry Status Indicator */}
        {loading && retryCount > 0 && (
          <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-5 mb-6 shadow-md animate-pulse">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
              <div>
                <p className="font-semibold text-blue-900">Blockchain Transaction Retry</p>
                <p className="text-sm text-blue-800">
                  Attempt {retryCount} of {MAX_RETRIES} - Please confirm in MetaMask
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-gray-900 whitespace-pre-line">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-gray-900 whitespace-pre-line">{success}</span>
            </div>
          </div>  
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Medicine Information Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Medicine Information</h3>
            <div className="space-y-4">
              {/* Medicine Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Medicine Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="medicine_name" 
                  value={formData.medicine_name}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    fieldErrors.medicine_name && touched.medicine_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter medicine name"
                />
                {fieldErrors.medicine_name && touched.medicine_name && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.medicine_name}</p>
                )}
              </div>

              {/* Medicine Types - Checkboxes */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Medicine Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {MEDICINE_TYPES.map(type => (
                    <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.medicine_types.includes(type.value)}
                        onChange={() => handleCheckboxChange('medicine_types', type.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900">{type.label}</span>
                    </label>
                  ))}
                </div>
                {fieldErrors.medicine_types && touched.medicine_types && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.medicine_types}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Generic Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Generic Name</label>
                  <input 
                    type="text" 
                    name="generic_name" 
                    value={formData.generic_name}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 py-2 border rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.generic_name && touched.generic_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter generic name"
                  />
                  {fieldErrors.generic_name && touched.generic_name && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.generic_name}</p>
                  )}
                </div>

                {/* Dosage Form */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Dosage Form <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="dosage_form"
                    value={formData.dosage_form}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 py-2 border rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.dosage_form && touched.dosage_form ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select dosage</option>
                    {DOSAGE_FORMS.map(form => (
                      <option key={form} value={form}>{form}</option>
                    ))}
                  </select>
                  {fieldErrors.dosage_form && touched.dosage_form && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.dosage_form}</p>
                  )}
                </div>

                {/* Strength */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Strength <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="strength"
                    value={formData.strength}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 py-2 border rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.strength && touched.strength ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select strength</option>
                    {STRENGTHS.map(strength => (
                      <option key={strength} value={strength}>{strength}</option>
                    ))}
                  </select>
                  {fieldErrors.strength && touched.strength && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.strength}</p>
                  )}
                </div>

                {/* Manufacturer */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Manufacturer <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 py-2 border rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.manufacturer && touched.manufacturer ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select manufacturer</option>
                    {MANUFACTURERS.map(manufacturer => (
                      <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
                    ))}
                  </select>
                  {fieldErrors.manufacturer && touched.manufacturer && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.manufacturer}</p>
                  )}
                </div>
              </div>

              {/* Categories - Checkboxes */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CATEGORIES.map(category => (
                    <label key={category.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category.value)}
                        onChange={() => handleCheckboxChange('categories', category.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900">{category.label}</span>
                    </label>
                  ))}
                </div>
                {fieldErrors.categories && touched.categories && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.categories}</p>
                )}
              </div>

              {/* Storage Requirements - Checkboxes */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Storage Requirements <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {STORAGE_REQUIREMENTS.map(req => (
                    <label key={req.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.storage_requirements.includes(req.value)}
                        onChange={() => handleCheckboxChange('storage_requirements', req.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900">{req.label}</span>
                    </label>
                  ))}
                </div>
                {fieldErrors.storage_requirements && touched.storage_requirements && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.storage_requirements}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">Description</label>
                <textarea 
                  name="description" 
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter medicine description..."
                ></textarea>
              </div>
            </div>
          </div>

          {/* Stock Information Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Stock Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Batch Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Batch Number <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="batch_number" 
                    value={formData.batch_number}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 py-2 border rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.batch_number && touched.batch_number ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter batch number"
                  />
                  {fieldErrors.batch_number && touched.batch_number && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.batch_number}</p>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    name="quantity" 
                    value={formData.quantity}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    min="1"
                    className={`w-full px-3 py-2 border rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.quantity && touched.quantity ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter quantity"
                  />
                  {fieldErrors.quantity && touched.quantity && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.quantity}</p>
                  )}
                </div>

                {/* Packaging Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Packaging Unit <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="packaging_unit"
                    value={formData.packaging_unit}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {PACKAGING_UNITS.map(unit => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-700">
                    Select how the medicine is packaged
                  </p>
                </div>

                {/* Cost Per Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Cost Per {PACKAGING_UNITS.find(u => u.value === formData.packaging_unit)?.label || 'Unit'} <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    name="cost_per_unit" 
                    value={formData.cost_per_unit}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    step="0.01"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.cost_per_unit && touched.cost_per_unit ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {fieldErrors.cost_per_unit && touched.cost_per_unit && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.cost_per_unit}</p>
                  )}
                  {formData.cost_per_unit && parseFloat(formData.cost_per_unit) > 0 && (
                    <p className="mt-1 text-xs text-green-700 font-medium">
                      💡 Unit Cost: ₱{calculateUnitCost()} per piece
                    </p>
                  )}
                </div>

                {/* Supplier Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Supplier Name <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="supplier_name"
                    value={formData.supplier_name}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 py-2 border rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.supplier_name && touched.supplier_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select supplier</option>
                    {SUPPLIERS.map(supplier => (
                      <option key={supplier} value={supplier}>{supplier}</option>
                    ))}
                  </select>
                  {fieldErrors.supplier_name && touched.supplier_name && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.supplier_name}</p>
                  )}
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="date" 
                    name="expiry_date" 
                    value={formData.expiry_date}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    min={getMinExpiryDate()}
                    className={`w-full px-3 py-2 border rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.expiry_date && touched.expiry_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.expiry_date && touched.expiry_date && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.expiry_date}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-700">
                    Must be a future date
                  </p>
                </div>

                {/* Storage Location */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Storage Location <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="storage_location"
                    value={formData.storage_location}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 py-2 border rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.storage_location && touched.storage_location ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select location</option>
                    {STORAGE_LOCATIONS.map(location => (
                      <option key={location.value} value={location.value}>{location.label}</option>
                    ))}
                  </select>
                  {fieldErrors.storage_location && touched.storage_location && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.storage_location}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              disabled={loading}
              className="px-6 py-2.5 border border-gray-300 rounded-md text-gray-900 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <span>{retryCount > 0 ? `Retrying (${retryCount}/${MAX_RETRIES})...` : 'Adding Medicine...'}</span>
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