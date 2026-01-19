import { useState, useEffect } from 'react';
import { useMedicineRelease } from '../../hooks/useMedicineRelease';
import { useAddress } from '@thirdweb-dev/react';
import { User, Package, Calendar, AlertCircle, CheckCircle2, Pill, Heart, Clock, Shield, Plus, Trash2, ShoppingCart } from 'lucide-react';
import api from '../../../api';

// Common medical concerns
const MEDICAL_CONCERNS = [
  { value: 'FEVER', label: 'Fever', icon: '🌡️' },
  { value: 'HEADACHE', label: 'Headache', icon: '🤕' },
  { value: 'COUGH_COLD', label: 'Cough/Cold', icon: '🤧' },
  { value: 'HYPERTENSION', label: 'Hypertension', icon: '❤️' },
  { value: 'DIABETES', label: 'Diabetes', icon: '💉' },
  { value: 'PAIN', label: 'Pain', icon: '😣' },
  { value: 'ALLERGY', label: 'Allergy', icon: '🤒' },
  { value: 'WOUND', label: 'Wound/Injury', icon: '🩹' },
  { value: 'OTHER', label: 'Other', icon: '📋' }
];

// Release frequency restrictions
const RESTRICTION_PERIODS = {
  WEEKLY: { value: 'WEEKLY', label: 'Weekly (7 days)', days: 7 },
  BIWEEKLY: { value: 'BIWEEKLY', label: 'Bi-Weekly (14 days)', days: 14 },
  MONTHLY: { value: 'MONTHLY', label: 'Monthly (30 days)', days: 30 }
};

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;

const AddReleaseForm = ({ onSuccess, onCancel }) => {
  const { createRelease } = useMedicineRelease();
  const address = useAddress();

  // ✅ NEW: Multi-medicine state
  const [medicineItems, setMedicineItems] = useState([
    {
      id: Date.now(),
      medicine_id: '',
      stock_id: '',
      quantity_released: '',
      selectedMedicine: null,
      selectedStock: null,
      stocks: [],
      loadingStocks: false,
      errors: {},
      restrictionViolation: null,
      lastReleaseInfo: null
    }
  ]);

  const [formData, setFormData] = useState({
    resident_id: '',
    resident_name: '',
    resident_age: '',
    selected_concerns: [],
    other_concern: '',
    notes: '',
    date_released: new Date().toISOString().split('T')[0],
    prescription_number: '',
    prescribing_doctor: '',
    dosage_instructions: ''
  });

  const [medicines, setMedicines] = useState([]);
  const [residents, setResidents] = useState([]);
  const [selectedResident, setSelectedResident] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingMedicines, setLoadingMedicines] = useState(true);
  const [loadingResidents, setLoadingResidents] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Frequency restriction states
  const [restrictionPeriod, setRestrictionPeriod] = useState('WEEKLY');
  const [checkingRestriction, setCheckingRestriction] = useState(false);
  const [overrideRestriction, setOverrideRestriction] = useState(false);

  useEffect(() => {
    fetchMedicines();
    fetchResidents();
  }, []);

  useEffect(() => {
    // Update step based on completion
    const hasResident = formData.resident_name.trim();
    const hasMedicines = medicineItems.some(item => item.selectedMedicine);
    const hasQuantities = medicineItems.every(item => 
      !item.selectedMedicine || (item.quantity_released && !item.errors.quantity_released)
    );

    if (hasResident && hasMedicines && hasQuantities) {
      setCurrentStep(3);
    } else if (hasResident && hasMedicines) {
      setCurrentStep(2);
    } else if (hasResident) {
      setCurrentStep(2);
    } else {
      setCurrentStep(1);
    }
  }, [medicineItems, formData.resident_name]);

  // Check restriction when resident and any medicine changes
  useEffect(() => {
    if (formData.resident_name.trim()) {
      medicineItems.forEach((item, index) => {
        if (item.selectedMedicine) {
          checkReleaseRestriction(index);
        }
      });
    }
  }, [formData.resident_name, formData.resident_id, restrictionPeriod]);

  const fetchMedicines = async () => {
    try {
      setLoadingMedicines(true);
      const { data } = await api.get('/medicines?is_active=true');
      setMedicines(data.data || []);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    } finally {
      setLoadingMedicines(false);
    }
  };

  const fetchStocks = async (medicineId, itemIndex) => {
    try {
      setMedicineItems(prev => prev.map((item, idx) => 
        idx === itemIndex ? { ...item, loadingStocks: true } : item
      ));

      const { data } = await api.get(`/stocks/medicine/${medicineId}`);
      const stocks = data || [];
      const filtered = stocks
        .filter(s => s.is_active && s.remaining_quantity > 0)
        .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));

      setMedicineItems(prev => prev.map((item, idx) => {
        if (idx === itemIndex) {
          return {
            ...item,
            stocks: filtered,
            loadingStocks: false,
            selectedStock: filtered.length === 1 ? filtered[0] : null,
            stock_id: filtered.length === 1 ? filtered[0].stock_id : ''
          };
        }
        return item;
      }));

      if (filtered.length === 0) {
        alert('⚠️ No available stock for this medicine');
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
      setMedicineItems(prev => prev.map((item, idx) => 
        idx === itemIndex ? { ...item, loadingStocks: false } : item
      ));
    }
  };

  const fetchResidents = async () => {
    try {
      setLoadingResidents(true);
      const { data } = await api.get('/residents');
      const residents = data.data || data || [];
      setResidents(residents.filter(r => r.is_active));
    } catch (error) {
      console.error('Error fetching residents:', error);
    } finally {
      setLoadingResidents(false);
    }
  };

  // ✅ NEW: Check restriction for specific medicine item
  const checkReleaseRestriction = async (itemIndex) => {
    const item = medicineItems[itemIndex];
    
    if (!item.selectedMedicine || !formData.resident_name.trim()) {
      setMedicineItems(prev => prev.map((med, idx) => 
        idx === itemIndex 
          ? { ...med, restrictionViolation: null, lastReleaseInfo: null } 
          : med
      ));
      return;
    }

    try {
      setCheckingRestriction(true);

      const period = RESTRICTION_PERIODS[restrictionPeriod];
      const daysAgo = period.days;
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - daysAgo);

      const params = new URLSearchParams({
        medicine_id: item.selectedMedicine.medicine_id.toString(),
        date_from: dateFrom.toISOString().split('T')[0]
      });

      if (formData.resident_id) {
        params.append('resident_id', formData.resident_id);
      } else if (formData.resident_name.trim()) {
        params.append('resident_name', formData.resident_name.trim());
      }

      console.log('🔍 Checking restriction for:', item.selectedMedicine.medicine_name);

      const { data } = await api.get(`/releases?${params.toString()}`);
      const releases = data.data || data || [];

      if (releases.length > 0) {
        const lastRelease = releases[0];
        const lastReleaseDate = new Date(lastRelease.date_released);
        const daysSince = Math.floor((new Date() - lastReleaseDate) / (1000 * 60 * 60 * 24));
        const daysUntilAllowed = daysAgo - daysSince;

        setMedicineItems(prev => prev.map((med, idx) => 
          idx === itemIndex 
            ? {
                ...med,
                lastReleaseInfo: {
                  date: lastReleaseDate.toLocaleDateString(),
                  quantity: lastRelease.quantity_released,
                  daysSince,
                  daysUntilAllowed,
                  releaseId: lastRelease.release_id
                },
                restrictionViolation: {
                  message: `Last received ${daysSince} day${daysSince !== 1 ? 's' : ''} ago`,
                  severity: 'error',
                  period: period.label,
                  lastRelease: lastRelease
                }
              }
            : med
        ));

        console.log('❌ Restriction violation:', daysSince, 'days ago');
      } else {
        setMedicineItems(prev => prev.map((med, idx) => 
          idx === itemIndex 
            ? { ...med, restrictionViolation: null, lastReleaseInfo: null }
            : med
        ));
        console.log('✅ No restriction violation');
      }
    } catch (error) {
      console.error('Error checking restriction:', error);
    } finally {
      setCheckingRestriction(false);
    }
  };

  // ✅ NEW: Add medicine item
  const addMedicineItem = () => {
    setMedicineItems(prev => [...prev, {
      id: Date.now(),
      medicine_id: '',
      stock_id: '',
      quantity_released: '',
      selectedMedicine: null,
      selectedStock: null,
      stocks: [],
      loadingStocks: false,
      errors: {},
      restrictionViolation: null,
      lastReleaseInfo: null
    }]);
  };

  // ✅ NEW: Remove medicine item
  const removeMedicineItem = (index) => {
    if (medicineItems.length === 1) {
      alert('⚠️ At least one medicine is required');
      return;
    }
    setMedicineItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // ✅ NEW: Update medicine item
  const updateMedicineItem = (index, field, value) => {
    setMedicineItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        const updated = { ...item, [field]: value };

        // Clear errors for this field
        if (item.errors[field]) {
          updated.errors = { ...item.errors, [field]: undefined };
        }

        return updated;
      }
      return item;
    }));
  };

  // ✅ NEW: Handle medicine selection
  const handleMedicineSelect = (index, medicineId) => {
    const medicine = medicines.find(m => m.medicine_id === parseInt(medicineId));
    
    setMedicineItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return {
          ...item,
          medicine_id: medicineId,
          selectedMedicine: medicine || null,
          selectedStock: null,
          stock_id: '',
          quantity_released: '',
          stocks: [],
          errors: {}
        };
      }
      return item;
    }));

    if (medicine) {
      fetchStocks(medicine.medicine_id, index);
      if (formData.resident_name.trim()) {
        setTimeout(() => checkReleaseRestriction(index), 500);
      }
    }
  };

  // ✅ NEW: Handle stock selection
  const handleStockSelect = (index, stockId) => {
    const item = medicineItems[index];
    const stock = item.stocks.find(s => s.stock_id === parseInt(stockId));
    
    updateMedicineItem(index, 'selectedStock', stock || null);
    updateMedicineItem(index, 'stock_id', stockId);
    updateMedicineItem(index, 'quantity_released', '');
  };

  // ✅ NEW: Handle quantity change
  const handleQuantityChange = (index, value) => {
    if (value === '') {
      updateMedicineItem(index, 'quantity_released', '');
      return;
    }

    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0) {
      return;
    }

    const item = medicineItems[index];
    const newErrors = { ...item.errors };

    if (item.selectedStock && numValue > item.selectedStock.remaining_quantity) {
      newErrors.quantity_released = `Max ${item.selectedStock.remaining_quantity} units`;
    } else if (numValue === 0) {
      newErrors.quantity_released = 'Must be at least 1';
    } else {
      delete newErrors.quantity_released;
    }

    setMedicineItems(prev => prev.map((med, idx) => 
      idx === index 
        ? { ...med, quantity_released: value, errors: newErrors }
        : med
    ));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }

    if (name === 'resident_id') {
      const resident = residents.find(r => r.resident_id === parseInt(value));
      if (resident) {
        setSelectedResident(resident);
        setFormData(prev => ({
          ...prev,
          resident_name: resident.full_name || `${resident.first_name} ${resident.last_name}`,
          resident_age: resident.age?.toString() || ''
        }));
        setFormErrors(prev => ({ 
          ...prev, 
          resident_name: undefined, 
          resident_age: undefined 
        }));
      } else {
        setSelectedResident(null);
      }
    }
  };

  const handleConcernToggle = (concernValue) => {
    setFormData(prev => {
      const isSelected = prev.selected_concerns.includes(concernValue);
      const newConcerns = isSelected
        ? prev.selected_concerns.filter(c => c !== concernValue)
        : [...prev.selected_concerns, concernValue];
      
      return { ...prev, selected_concerns: newConcerns };
    });
    
    if (formErrors.concern) {
      setFormErrors(prev => ({ ...prev, concern: undefined }));
    }
  };

  const getConcernString = () => {
    const concerns = [...formData.selected_concerns];
    if (formData.other_concern && concerns.includes('OTHER')) {
      const index = concerns.indexOf('OTHER');
      concerns[index] = formData.other_concern;
    }
    return concerns.map(c => {
      const concern = MEDICAL_CONCERNS.find(mc => mc.value === c);
      return concern ? concern.label : c;
    }).join(', ');
  };

  const validateForm = () => {
    const errors = {};

    if (!address) {
      errors.wallet = 'Please connect your MetaMask wallet';
    }

    // Validate resident
    if (!formData.resident_name.trim()) {
      errors.resident_name = 'Resident name is required';
    }
    if (formData.selected_concerns.length === 0) {
      errors.concern = 'Please select at least one medical concern';
    }
    if (formData.selected_concerns.includes('OTHER') && !formData.other_concern.trim()) {
      errors.other_concern = 'Please specify other concern';
    }
    if (!formData.date_released) {
      errors.date_released = 'Release date is required';
    }

    // ✅ NEW: Validate all medicine items
    let medicineErrors = false;
    const validatedItems = medicineItems.map(item => {
      const itemErrors = {};

      if (!item.selectedMedicine) {
        itemErrors.medicine = 'Medicine is required';
        medicineErrors = true;
      }
      if (!item.selectedStock) {
        itemErrors.stock = 'Stock batch is required';
        medicineErrors = true;
      }
      if (!item.quantity_released || item.quantity_released <= 0) {
        itemErrors.quantity_released = 'Valid quantity is required';
        medicineErrors = true;
      }
      if (item.selectedStock && parseInt(item.quantity_released) > item.selectedStock.remaining_quantity) {
        itemErrors.quantity_released = `Cannot exceed ${item.selectedStock.remaining_quantity}`;
        medicineErrors = true;
      }

      // Check restriction violation
      if (item.restrictionViolation && !overrideRestriction) {
        itemErrors.restriction = item.restrictionViolation.message;
        medicineErrors = true;
      }

      return { ...item, errors: itemErrors };
    });

    if (medicineErrors) {
      setMedicineItems(validatedItems);
      errors.medicines = 'Please fix medicine item errors';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setMedicineItems([{
      id: Date.now(),
      medicine_id: '',
      stock_id: '',
      quantity_released: '',
      selectedMedicine: null,
      selectedStock: null,
      stocks: [],
      loadingStocks: false,
      errors: {},
      restrictionViolation: null,
      lastReleaseInfo: null
    }]);
    
    setSelectedResident(null);
    setFormData({
      resident_id: '',
      resident_name: '',
      resident_age: '',
      selected_concerns: [],
      other_concern: '',
      notes: '',
      date_released: new Date().toISOString().split('T')[0],
      prescription_number: '',
      prescribing_doctor: '',
      dosage_instructions: ''
    });
    setFormErrors({});
    setCurrentStep(1);
    setRetryCount(0);
    setOverrideRestriction(false);
  };

  const retryBlockchainTransaction = async (transactionFn, retries = MAX_RETRIES) => {
    for (let i = 0; i < retries; i++) {
      try {
        setRetryCount(i + 1);
        console.log(`Blockchain attempt ${i + 1}/${retries}...`);
        
        const result = await transactionFn();
        console.log('Blockchain transaction successful');
        setRetryCount(0);
        return result;
      } catch (error) {
        console.error(`Blockchain attempt ${i + 1} failed:`, error);
        
        if (error.message && (
          error.message.includes('user rejected') || 
          error.message.includes('User denied') ||
          error.code === 4001
        )) {
          throw new Error('Transaction rejected by user');
        }
        
        if (i === retries - 1) {
          throw new Error(`Transaction failed after ${retries} attempts: ${error.message}`);
        }
        
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const errorMessages = Object.values(formErrors).filter(Boolean).join('\n');
      alert('Please fix the following errors:\n\n' + errorMessages);
      return;
    }

    setLoading(true);
    setBlockchainLoading(true);
    
    try {
      const concernString = getConcernString();
      const results = [];
      
      // ✅ NEW: Create release for each medicine
      for (const item of medicineItems) {
        console.log(`📦 Releasing ${item.selectedMedicine.medicine_name}...`);
        
        const result = await retryBlockchainTransaction(async () => {
          return await createRelease({
            medicine_id: item.selectedMedicine.medicine_id,
            stock_id: item.selectedStock.stock_id,
            resident_id: formData.resident_id ? parseInt(formData.resident_id) : null,
            resident_name: formData.resident_name.trim(),
            resident_age: formData.resident_age ? parseInt(formData.resident_age) : null,
            concern: concernString,
            quantity_released: parseInt(item.quantity_released),
            notes: formData.notes.trim() || null,
            date_released: new Date(formData.date_released).toISOString(),
            prescription_number: formData.prescription_number.trim() || null,
            prescribing_doctor: formData.prescribing_doctor.trim() || null,
            dosage_instructions: formData.dosage_instructions.trim() || null
          });
        });

        results.push({
          medicine: item.selectedMedicine.medicine_name,
          success: !result.blockchainError,
          error: result.blockchainError
        });
      }

      // Show summary
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        alert(`✅ Successfully released ${successCount} medicine${successCount > 1 ? 's' : ''} and synced to blockchain!`);
      } else if (successCount === 0) {
        alert(`❌ Failed to sync ${failCount} medicine${failCount > 1 ? 's' : ''} to blockchain. They will remain pending.`);
      } else {
        alert(`⚠️ Mixed results:\n✅ ${successCount} succeeded\n❌ ${failCount} failed (will remain pending)`);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        resetForm();
      }
    } catch (error) {
      console.error('Error creating releases:', error);
      
      let errorMessage = error.message;
      if (error.message.includes('rejected by user')) {
        errorMessage = 'Transaction was rejected in MetaMask. Releases cancelled.';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fees. Releases cancelled.';
      }
      
      alert('❌ Failed to release medicines.\n\nError: ' + errorMessage);
    } finally {
      setLoading(false);
      setBlockchainLoading(false);
      setRetryCount(0);
    }
  };

  // ========== PART 2 OF 3 - JSX RENDER START ==========

  // Calculate totals for summary
  const totalItems = medicineItems.filter(item => item.selectedMedicine).length;
  const hasRestrictionViolations = medicineItems.some(item => item.restrictionViolation && !overrideRestriction);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-emerald-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                Release Medicine
                {totalItems > 1 && (
                  <span className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full">
                    {totalItems} Items
                  </span>
                )}
              </h1>
              <p className="text-gray-800 font-medium">
                {totalItems > 1 
                  ? 'Distribute multiple medicines to a resident with frequency monitoring'
                  : 'Distribute medicine to residents with frequency monitoring'
                }
              </p>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-800 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2">
            {[
              { num: 1, label: 'Resident Info' },
              { num: 2, label: `Medicine${totalItems > 1 ? 's' : ''} & Stock` },
              { num: 3, label: 'Release Details' }
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 flex-1 px-4 py-2 rounded-lg transition-all ${
                  currentStep === step.num 
                    ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg' 
                    : currentStep > step.num
                    ? 'bg-green-100 text-green-900'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep === step.num ? 'bg-white text-green-600' : ''
                  }`}>
                    {currentStep > step.num ? '✓' : step.num}
                  </div>
                  <span className="font-bold text-sm">{step.label}</span>
                </div>
                {idx < 2 && (
                  <svg className="w-4 h-4 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Wallet Status */}
        {!address ? (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-5 mb-6 shadow-md">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-8 h-8 text-yellow-700 flex-shrink-0" />
              <div>
                <p className="font-bold text-yellow-900 text-lg mb-1">Wallet Not Connected</p>
                <p className="text-yellow-900 text-sm font-medium">Please connect your MetaMask wallet to release medicine.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5 mb-6 shadow-md">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-700" />
              <div>
                <p className="font-bold text-green-900">Wallet Connected</p>
                <p className="text-sm text-green-800 font-mono">{address.slice(0, 8)}...{address.slice(-6)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Frequency Restriction Period Selector */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-300 p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Release Frequency Restriction</h3>
              <p className="text-sm text-gray-800 font-medium">Prevent duplicate releases within time period</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            {Object.values(RESTRICTION_PERIODS).map(period => (
              <button
                key={period.value}
                type="button"
                onClick={() => setRestrictionPeriod(period.value)}
                className={`flex-1 px-4 py-3 rounded-lg border-2 font-bold transition-all ${
                  restrictionPeriod === period.value
                    ? 'bg-indigo-600 border-indigo-700 text-white shadow-md'
                    : 'bg-white border-gray-300 text-gray-900 hover:border-indigo-400'
                }`}
              >
                <div className="text-sm">{period.label}</div>
                <div className="text-xs mt-1 opacity-90">({period.days} days)</div>
              </button>
            ))}
          </div>
        </div>

        {/* Restriction Checking Status */}
        {checkingRestriction && (
          <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-5 mb-6 shadow-md animate-pulse">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
              <div>
                <p className="font-bold text-blue-900">Checking Release History...</p>
                <p className="text-sm text-blue-800 font-medium">Verifying frequency restrictions</p>
              </div>
            </div>
          </div>
        )}

        {/* Global Restriction Violations Warning */}
        {hasRestrictionViolations && !overrideRestriction && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-400 rounded-xl p-5 mb-6 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-8 h-8 text-red-700 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-red-900 text-lg">⚠️ Frequency Restriction Violations Detected</h3>
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                
                <div className="bg-white bg-opacity-80 rounded-lg p-4 mb-3 border border-red-300">
                  <p className="font-bold text-red-900 mb-2">
                    {medicineItems.filter(item => item.restrictionViolation).length} medicine(s) have recent releases
                  </p>
                  <ul className="space-y-1 text-sm text-red-800">
                    {medicineItems.map((item, idx) => 
                      item.restrictionViolation ? (
                        <li key={idx} className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium">
                            {item.selectedMedicine?.medicine_name}: {item.restrictionViolation.message}
                          </span>
                        </li>
                      ) : null
                    )}
                  </ul>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOverrideRestriction(true)}
                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Shield className="w-5 h-5" />
                    Override All & Continue (Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Remove items with violations
                      setMedicineItems(prev => prev.filter(item => !item.restrictionViolation));
                    }}
                    className="px-4 py-2 bg-white border-2 border-gray-400 text-gray-900 font-bold rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Remove Restricted Items
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Override Active Notice */}
        {overrideRestriction && hasRestrictionViolations && (
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-400 rounded-xl p-4 mb-6 shadow-md">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-orange-700" />
              <div>
                <p className="font-bold text-orange-900">Admin Override Active</p>
                <p className="text-sm text-orange-800 font-medium">Frequency restrictions bypassed. Proceed with caution.</p>
              </div>
            </div>
          </div>
        )}

        {/* Retry Status */}
        {blockchainLoading && retryCount > 0 && (
          <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-5 mb-6 shadow-md animate-pulse">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
              <div>
                <p className="font-bold text-blue-900">Blockchain Transaction Retry</p>
                <p className="text-sm text-blue-800 font-medium">
                  Attempt {retryCount} of {MAX_RETRIES} - Please confirm in MetaMask
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Resident Information */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 transition-all hover:shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Resident Information</h3>
                <p className="text-sm text-gray-800 font-medium">Select from directory or enter manually</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Select from Directory (Optional)
                </label>
                <select
                  name="resident_id"
                  value={formData.resident_id}
                  onChange={handleChange}
                  disabled={loadingResidents}
                  className="w-full px-4 py-3 border-2 border-gray-300 text-gray-900 font-medium rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                >
                  <option value="" className="text-gray-900">
                    {loadingResidents ? '⏳ Loading residents...' : '👤 Select resident or enter manually below'}
                  </option>
                  {residents.map(resident => (
                    <option key={resident.resident_id} value={resident.resident_id} className="text-gray-900">
                      {resident.full_name || `${resident.first_name} ${resident.last_name}`}
                      {resident.age && ` • ${resident.age} years old`}
                      {resident.barangay && ` • ${resident.barangay}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Resident Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="resident_name"
                    value={formData.resident_name}
                    onChange={handleChange}
                    placeholder="Enter resident name"
                    className={`w-full px-4 py-3 border-2 rounded-lg text-gray-900 font-medium placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                      formErrors.resident_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.resident_name && (
                    <p className="text-red-700 text-sm font-bold mt-1">{formErrors.resident_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Age</label>
                  <input
                    type="number"
                    name="resident_age"
                    value={formData.resident_age}
                    onChange={handleChange}
                    placeholder="Age"
                    min="0"
                    max="150"
                    className="w-full px-4 py-3 border-2 border-gray-300 text-gray-900 font-medium placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
              </div>

              {/* Medical Concerns */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Medical Concern <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {MEDICAL_CONCERNS.map(concern => (
                    <button
                      key={concern.value}
                      type="button"
                      onClick={() => handleConcernToggle(concern.value)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        formData.selected_concerns.includes(concern.value)
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          formData.selected_concerns.includes(concern.value)
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}>
                          {formData.selected_concerns.includes(concern.value) && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className="text-xl">{concern.icon}</span>
                        <span className={`text-sm font-bold ${
                          formData.selected_concerns.includes(concern.value) ? 'text-green-900' : 'text-gray-900'
                        }`}>
                          {concern.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                {formErrors.concern && (
                  <p className="text-red-700 text-sm font-bold flex items-center gap-1 mt-2">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.concern}
                  </p>
                )}
              </div>

              {/* Other Concern Input */}
              {formData.selected_concerns.includes('OTHER') && (
                <div className="animate-fadeIn">
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Specify Other Concern <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="other_concern"
                    value={formData.other_concern}
                    onChange={handleChange}
                    placeholder="e.g., Skin infection, Respiratory issue"
                    className={`w-full px-4 py-3 border-2 rounded-lg text-gray-900 font-medium placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                      formErrors.other_concern ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.other_concern && (
                    <p className="text-red-700 text-sm font-bold mt-1">{formErrors.other_concern}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Medicine Items */}
          {formData.resident_name && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Medicines to Release</h3>
                    <p className="text-sm text-gray-800 font-medium">
                      {totalItems} medicine{totalItems !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={addMedicineItem}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all flex items-center gap-2 shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Add Medicine
                </button>
              </div>

              {/* Medicine Items List */}
              {medicineItems.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 transition-all hover:shadow-xl animate-fadeIn"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">
                        {item.selectedMedicine?.medicine_name || 'Select Medicine'}
                      </h4>
                    </div>
                    
                    {medicineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicineItem(index)}
                        className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Individual Item Restriction Warning */}
                  {item.restrictionViolation && !overrideRestriction && (
                    <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-700 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-bold text-orange-900 text-sm mb-2">{item.restrictionViolation.message}</p>
                          {item.lastReleaseInfo && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-orange-800">Last: </span>
                                <span className="font-bold text-orange-900">{item.lastReleaseInfo.date}</span>
                              </div>
                              <div>
                                <span className="text-orange-800">Qty: </span>
                                <span className="font-bold text-orange-900">{item.lastReleaseInfo.quantity} units</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Medicine Selection */}
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Medicine <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={item.medicine_id}
                        onChange={(e) => handleMedicineSelect(index, e.target.value)}
                        className={`w-full px-3 py-2 border-2 rounded-lg text-gray-900 font-medium text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                          item.errors.medicine ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        disabled={loadingMedicines}
                      >
                        <option value="">🔍 Select</option>
                        {medicines.map(med => (
                          <option key={med.medicine_id} value={med.medicine_id}>
                            {med.medicine_name}
                          </option>
                        ))}
                      </select>
                      {item.errors.medicine && (
                        <p className="text-red-700 text-xs font-bold mt-1">{item.errors.medicine}</p>
                      )}
                    </div>

                    {/* Stock Selection */}
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Batch <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={item.stock_id}
                        onChange={(e) => handleStockSelect(index, e.target.value)}
                        disabled={!item.selectedMedicine || item.loadingStocks}
                        className={`w-full px-3 py-2 border-2 rounded-lg text-gray-900 font-medium text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all disabled:bg-gray-100 ${
                          item.errors.stock ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      >
                        <option value="">
                          {!item.selectedMedicine ? 'Select medicine first' : item.loadingStocks ? '⏳ Loading...' : '🔍 Select'}
                        </option>
                        {item.stocks.map(stock => (
                          <option key={stock.stock_id} value={stock.stock_id}>
                            {stock.batch_number} ({stock.remaining_quantity})
                          </option>
                        ))}
                      </select>
                      {item.errors.stock && (
                        <p className="text-red-700 text-xs font-bold mt-1">{item.errors.stock}</p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Quantity <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={item.quantity_released}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          min="1"
                          max={item.selectedStock?.remaining_quantity}
                          placeholder="Qty"
                          className={`w-full px-3 py-2 pr-16 border-2 rounded-lg text-gray-900 font-bold text-sm placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                            item.errors.quantity_released 
                              ? 'border-red-500 bg-red-50' 
                              : item.quantity_released && !item.errors.quantity_released
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-300'
                          }`}
                        />
                        {item.selectedStock && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-700">
                            /{item.selectedStock.remaining_quantity}
                          </div>
                        )}
                      </div>
                      {item.errors.quantity_released && (
                        <p className="text-red-700 text-xs font-bold mt-1">{item.errors.quantity_released}</p>
                      )}
                    </div>
                  </div>

                  {/* Stock Info */}
                  {item.selectedStock && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-blue-800 font-medium">Available:</span>
                          <span className="ml-1 font-bold text-blue-900">{item.selectedStock.remaining_quantity}</span>
                        </div>
                        <div>
                          <span className="text-blue-800 font-medium">Expires:</span>
                          <span className="ml-1 font-bold text-blue-900">
                            {new Date(item.selectedStock.expiry_date).toLocaleDateString()}
                          </span>
                        </div>
                        {item.quantity_released && !item.errors.quantity_released && (
                          <div>
                            <span className="text-green-800 font-medium">Remaining:</span>
                            <span className="ml-1 font-bold text-green-900">
                              {item.selectedStock.remaining_quantity - parseInt(item.quantity_released)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          // ========== PART 3 OF 3 - FINAL JSX SECTIONS ==========

          {/* Step 3: Release Details */}
          {formData.resident_name && medicineItems.some(item => item.selectedMedicine) && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 transition-all hover:shadow-xl animate-fadeIn">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Release Details</h3>
                  <p className="text-sm text-gray-800 font-medium">Common details for all medicines</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date Released <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    name="date_released"
                    value={formData.date_released}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 border-2 text-gray-900 font-bold rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                      formErrors.date_released ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.date_released && (
                    <p className="text-red-700 text-sm font-bold mt-1">{formErrors.date_released}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Additional Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Additional details about the release..."
                    rows="3"
                    className="w-full px-4 py-3 border-2 border-gray-300 text-gray-900 font-medium placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Prescription Details */}
          {formData.resident_name && medicineItems.some(item => item.selectedMedicine) && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 transition-all hover:shadow-xl animate-fadeIn">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Prescription Details (Optional)</h3>
                  <p className="text-sm text-gray-800 font-medium">Applies to all medicines</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Prescription Number</label>
                    <input
                      type="text"
                      name="prescription_number"
                      value={formData.prescription_number}
                      onChange={handleChange}
                      placeholder="RX-12345"
                      className="w-full px-4 py-3 border-2 border-gray-300 text-gray-900 font-medium placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Prescribing Doctor</label>
                    <input
                      type="text"
                      name="prescribing_doctor"
                      value={formData.prescribing_doctor}
                      onChange={handleChange}
                      placeholder="Dr. Juan Dela Cruz"
                      className="w-full px-4 py-3 border-2 border-gray-300 text-gray-900 font-medium placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Dosage Instructions</label>
                  <textarea
                    name="dosage_instructions"
                    value={formData.dosage_instructions}
                    onChange={handleChange}
                    placeholder="e.g., Take medications as directed after meals"
                    rows="2"
                    className="w-full px-4 py-3 border-2 border-gray-300 text-gray-900 font-medium placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Release Summary */}
          {formData.resident_name && 
           medicineItems.every(item => !item.selectedMedicine || (item.quantity_released && !item.errors.quantity_released)) &&
           medicineItems.some(item => item.selectedMedicine) && (
            <div className="bg-gradient-to-r from-green-50 via-teal-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 shadow-lg animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-bold text-green-900">Release Summary - Please Review</h4>
              </div>
              
              {/* Resident Info */}
              <div className="bg-white bg-opacity-60 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <User className="w-5 h-5 text-purple-600" />
                  <h5 className="font-bold text-purple-900">Resident</h5>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-700 font-medium">Name:</span>
                    <span className="ml-2 font-bold text-gray-900">{formData.resident_name}</span>
                  </div>
                  {formData.resident_age && (
                    <div>
                      <span className="text-gray-700 font-medium">Age:</span>
                      <span className="ml-2 font-bold text-gray-900">{formData.resident_age} years</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-700 font-medium">Concern:</span>
                    <span className="ml-2 font-bold text-gray-900">{getConcernString()}</span>
                  </div>
                </div>
              </div>

              {/* Medicines List */}
              <div className="bg-white bg-opacity-60 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Pill className="w-5 h-5 text-green-600" />
                    <h5 className="font-bold text-green-900">Medicines ({totalItems})</h5>
                  </div>
                  <div className="text-sm font-bold text-green-900">
                    Total Items: {totalItems}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {medicineItems.filter(item => item.selectedMedicine).map((item, index) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-3 border-l-4 border-green-500">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="font-bold text-gray-900">{item.selectedMedicine.medicine_name}</span>
                          {item.restrictionViolation && (
                            <span className="px-2 py-0.5 bg-orange-200 text-orange-900 text-xs font-bold rounded-full">
                              ⚠️ Restricted
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-green-700 text-lg">{item.quantity_released} units</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-700">Batch:</span>
                          <span className="ml-1 font-bold text-gray-900">{item.selectedStock?.batch_number}</span>
                        </div>
                        <div>
                          <span className="text-gray-700">Available:</span>
                          <span className="ml-1 font-bold text-blue-900">{item.selectedStock?.remaining_quantity}</span>
                        </div>
                        <div>
                          <span className="text-gray-700">Remaining:</span>
                          <span className="ml-1 font-bold text-purple-900">
                            {item.selectedStock?.remaining_quantity - parseInt(item.quantity_released)}
                          </span>
                        </div>
                      </div>

                      {item.lastReleaseInfo && (
                        <div className="mt-2 pt-2 border-t border-gray-300">
                          <div className="flex items-center gap-2 text-xs text-orange-800">
                            <Clock className="w-3 h-3" />
                            <span className="font-medium">
                              Last received {item.lastReleaseInfo.daysSince} days ago ({item.lastReleaseInfo.date})
                            </span>
                            {overrideRestriction && (
                              <span className="ml-auto px-2 py-0.5 bg-orange-600 text-white font-bold rounded">
                                OVERRIDE
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Blockchain Notice */}
              <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                <p className="text-sm text-green-900 font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>
                    This will create {totalItems} blockchain transaction{totalItems > 1 ? 's' : ''} (with automatic retry on failure)
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {formErrors.wallet && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <p className="text-red-800 font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {formErrors.wallet}
              </p>
            </div>
          )}

          {formErrors.medicines && (
            <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
              <p className="text-red-900 font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {formErrors.medicines} - Check each medicine item above
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 sticky bottom-6">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  if (onCancel) {
                    onCancel();
                  } else {
                    window.history.back();
                  }
                }}
                disabled={loading || blockchainLoading}
                className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={
                  loading || 
                  blockchainLoading ||
                  !address || 
                  !formData.resident_name.trim() ||
                  formData.selected_concerns.length === 0 ||
                  !medicineItems.some(item => item.selectedMedicine) ||
                  medicineItems.some(item => 
                    item.selectedMedicine && (!item.quantity_released || item.errors.quantity_released)
                  ) ||
                  (hasRestrictionViolations && !overrideRestriction)
                }
                className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-xl font-bold text-lg shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
              >
                {blockchainLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {retryCount > 0 
                      ? `Retrying (${retryCount}/${MAX_RETRIES})...` 
                      : `Releasing ${totalItems} Medicine${totalItems > 1 ? 's' : ''}...`
                    }
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-6 h-6" />
                    {hasRestrictionViolations && overrideRestriction 
                      ? `Override & Release ${totalItems} Item${totalItems > 1 ? 's' : ''} (MetaMask)` 
                      : `Release ${totalItems} Medicine${totalItems > 1 ? 's' : ''} (Sign with MetaMask)`
                    }
                  </span>
                )}
              </button>
            </div>
            
            {!address && (
              <p className="text-center text-sm text-gray-800 font-bold mt-3">
                ⚠️ Connect your wallet to enable submission
              </p>
            )}

            {hasRestrictionViolations && !overrideRestriction && (
              <p className="text-center text-sm text-red-700 font-bold mt-3 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Frequency restrictions active - Override required to proceed
              </p>
            )}

            {blockchainLoading && (
              <div className="mt-3 bg-blue-50 border border-blue-300 rounded-lg p-3">
                <p className="text-sm text-blue-900 font-medium text-center">
                  ⏳ Processing {totalItems} transaction{totalItems > 1 ? 's' : ''}... Please confirm each one in MetaMask
                </p>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Add CSS animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AddReleaseForm;