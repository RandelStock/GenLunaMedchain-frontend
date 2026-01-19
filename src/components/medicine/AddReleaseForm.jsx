import { useState, useEffect } from 'react';
import { useMedicineRelease } from '../../hooks/useMedicineRelease';
import { useAddress } from '@thirdweb-dev/react';
import { User, Package, Calendar, AlertCircle, CheckCircle2, Pill, Heart, Clock, Shield } from 'lucide-react';
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

// ✅ NEW: Release frequency restrictions
const RESTRICTION_PERIODS = {
  WEEKLY: { value: 'WEEKLY', label: 'Weekly (7 days)', days: 7 },
  BIWEEKLY: { value: 'BIWEEKLY', label: 'Bi-Weekly (14 days)', days: 14 },
  MONTHLY: { value: 'MONTHLY', label: 'Monthly (30 days)', days: 30 }
};

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds

const AddReleaseForm = ({ onSuccess, onCancel }) => {
  const { createRelease } = useMedicineRelease();
  const address = useAddress();

  const [formData, setFormData] = useState({
    medicine_id: '',
    stock_id: '',
    resident_id: '',
    resident_name: '',
    resident_age: '',
    selected_concerns: [],
    other_concern: '',
    quantity_released: '',
    notes: '',
    date_released: new Date().toISOString().split('T')[0],
    prescription_number: '',
    prescribing_doctor: '',
    dosage_instructions: ''
  });

  const [medicines, setMedicines] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [residents, setResidents] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedResident, setSelectedResident] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingMedicines, setLoadingMedicines] = useState(true);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [loadingResidents, setLoadingResidents] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // ✅ NEW: Frequency restriction states
  const [restrictionPeriod, setRestrictionPeriod] = useState('WEEKLY'); // Default to weekly
  const [checkingRestriction, setCheckingRestriction] = useState(false);
  const [restrictionViolation, setRestrictionViolation] = useState(null);
  const [lastReleaseInfo, setLastReleaseInfo] = useState(null);
  const [overrideRestriction, setOverrideRestriction] = useState(false);

  useEffect(() => {
    fetchMedicines();
    fetchResidents();
  }, []);

  useEffect(() => {
    if (selectedMedicine) {
      fetchStocks(selectedMedicine.medicine_id);
      setCurrentStep(2);
    } else {
      setStocks([]);
      setSelectedStock(null);
      setCurrentStep(1);
    }
  }, [selectedMedicine]);

  useEffect(() => {
    if (selectedStock) {
      setCurrentStep(3);
    }
  }, [selectedStock]);

  // ✅ NEW: Check restriction when resident and medicine are selected
  useEffect(() => {
    if (selectedMedicine && formData.resident_name.trim()) {
      checkReleaseRestriction();
    } else {
      setRestrictionViolation(null);
      setLastReleaseInfo(null);
    }
  }, [selectedMedicine, formData.resident_name, formData.resident_id, restrictionPeriod]);

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

  const fetchStocks = async (medicineId) => {
    try {
      setLoadingStocks(true);
      const { data } = await api.get(`/stocks/medicine/${medicineId}`);
      const stocks = data || [];
      const filtered = stocks
        .filter(s => s.is_active && s.remaining_quantity > 0)
        .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
      
      setStocks(filtered);
      
      if (filtered.length === 1) {
        setSelectedStock(filtered[0]);
      }

      if (filtered.length === 0) {
        alert('⚠️ No available stock for this medicine');
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
    } finally {
      setLoadingStocks(false);
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

  // ✅ NEW: Check if resident has received this medicine recently
  const checkReleaseRestriction = async () => {
    if (!selectedMedicine || !formData.resident_name.trim()) {
      setRestrictionViolation(null);
      setLastReleaseInfo(null);
      return;
    }

    try {
      setCheckingRestriction(true);
      setRestrictionViolation(null);
      setLastReleaseInfo(null);
      setOverrideRestriction(false);

      const period = RESTRICTION_PERIODS[restrictionPeriod];
      const daysAgo = period.days;
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - daysAgo);

      // Build query parameters
      const params = new URLSearchParams({
        medicine_id: selectedMedicine.medicine_id.toString(),
        date_from: dateFrom.toISOString().split('T')[0]
      });

      // Add resident filter - either by ID or by name
      if (formData.resident_id) {
        params.append('resident_id', formData.resident_id);
      } else if (formData.resident_name.trim()) {
        params.append('resident_name', formData.resident_name.trim());
      }

      console.log('🔍 Checking release restriction:', {
        medicine: selectedMedicine.medicine_name,
        resident: formData.resident_name,
        period: period.label,
        dateFrom: dateFrom.toISOString().split('T')[0]
      });

      const { data } = await api.get(`/releases?${params.toString()}`);
      const releases = data.data || data || [];

      console.log(`📊 Found ${releases.length} recent releases`);

      if (releases.length > 0) {
        const lastRelease = releases[0]; // Most recent
        const lastReleaseDate = new Date(lastRelease.date_released);
        const daysSince = Math.floor((new Date() - lastReleaseDate) / (1000 * 60 * 60 * 24));
        const daysUntilAllowed = daysAgo - daysSince;

        setLastReleaseInfo({
          date: lastReleaseDate.toLocaleDateString(),
          quantity: lastRelease.quantity_released,
          daysSince,
          daysUntilAllowed,
          releaseId: lastRelease.release_id
        });

        setRestrictionViolation({
          message: `This resident received ${selectedMedicine.medicine_name} ${daysSince} day${daysSince !== 1 ? 's' : ''} ago`,
          severity: 'error',
          period: period.label,
          lastRelease: lastRelease
        });

        console.log('❌ Restriction violation detected:', {
          daysSince,
          daysUntilAllowed,
          lastRelease: lastReleaseDate.toLocaleDateString()
        });
      } else {
        console.log('✅ No restriction violation - resident can receive medicine');
      }
    } catch (error) {
      console.error('Error checking release restriction:', error);
      // Don't block on error - allow the release to proceed
    } finally {
      setCheckingRestriction(false);
    }
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    
    if (value === '') {
      setFormData(prev => ({ ...prev, quantity_released: '' }));
      setFormErrors(prev => ({ ...prev, quantity_released: undefined }));
      return;
    }

    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0) {
      return;
    }

    if (selectedStock && numValue > selectedStock.remaining_quantity) {
      setFormErrors(prev => ({
        ...prev,
        quantity_released: `Maximum ${selectedStock.remaining_quantity} units available`
      }));
    } else if (numValue === 0) {
      setFormErrors(prev => ({
        ...prev,
        quantity_released: 'Quantity must be at least 1'
      }));
    } else {
      setFormErrors(prev => ({ ...prev, quantity_released: undefined }));
    }

    setFormData(prev => ({ ...prev, quantity_released: value }));
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
    if (!selectedMedicine) {
      errors.medicine = 'Medicine is required';
    }
    if (!selectedStock) {
      errors.stock = 'Stock batch is required';
    }
    if (!formData.resident_name.trim()) {
      errors.resident_name = 'Resident name is required';
    }
    if (formData.selected_concerns.length === 0) {
      errors.concern = 'Please select at least one medical concern';
    }
    if (formData.selected_concerns.includes('OTHER') && !formData.other_concern.trim()) {
      errors.other_concern = 'Please specify other concern';
    }
    if (!formData.quantity_released || formData.quantity_released <= 0) {
      errors.quantity_released = 'Valid quantity is required';
    }
    if (selectedStock && parseInt(formData.quantity_released) > selectedStock.remaining_quantity) {
      errors.quantity_released = `Cannot exceed available quantity (${selectedStock.remaining_quantity})`;
    }
    if (!formData.date_released) {
      errors.date_released = 'Release date is required';
    }

    // ✅ NEW: Check restriction violation (if not overridden)
    if (restrictionViolation && !overrideRestriction) {
      errors.restriction = `Frequency restriction: ${restrictionViolation.message}`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setSelectedMedicine(null);
    setSelectedStock(null);
    setSelectedResident(null);
    setStocks([]);
    setFormData({
      medicine_id: '',
      stock_id: '',
      resident_id: '',
      resident_name: '',
      resident_age: '',
      selected_concerns: [],
      other_concern: '',
      quantity_released: '',
      notes: '',
      date_released: new Date().toISOString().split('T')[0],
      prescription_number: '',
      prescribing_doctor: '',
      dosage_instructions: ''
    });
    setFormErrors({});
    setCurrentStep(1);
    setRetryCount(0);
    setRestrictionViolation(null);
    setLastReleaseInfo(null);
    setOverrideRestriction(false);
  };

  // Retry mechanism for blockchain transactions
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
          console.log('User rejected transaction');
          throw new Error('Transaction rejected by user');
        }
        
        if (i === retries - 1) {
          throw new Error(`Transaction failed after ${retries} attempts: ${error.message}`);
        }
        
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, i);
        console.log(`Waiting ${delay}ms before retry...`);
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
      
      const result = await retryBlockchainTransaction(async () => {
        return await createRelease({
          medicine_id: selectedMedicine.medicine_id,
          stock_id: selectedStock.stock_id,
          resident_id: formData.resident_id ? parseInt(formData.resident_id) : null,
          resident_name: formData.resident_name.trim(),
          resident_age: formData.resident_age ? parseInt(formData.resident_age) : null,
          concern: concernString,
          quantity_released: parseInt(formData.quantity_released),
          notes: formData.notes.trim() || null,
          date_released: new Date(formData.date_released).toISOString(),
          prescription_number: formData.prescription_number.trim() || null,
          prescribing_doctor: formData.prescribing_doctor.trim() || null,
          dosage_instructions: formData.dosage_instructions.trim() || null
        });
      });

      if (result.blockchainError) {
        alert('✅ Release created but blockchain sync failed. It will remain pending.\n\n⚠️ Error: ' + result.blockchainError);
      } else {
        alert('✅ Medicine released and synced to blockchain successfully!');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        resetForm();
      }
    } catch (error) {
      console.error('Error creating release:', error);
      
      let errorMessage = error.message;
      if (error.message.includes('rejected by user')) {
        errorMessage = 'Transaction was rejected in MetaMask. Release has been cancelled.';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fees. Release has been cancelled.';
      }
      
      alert('❌ Failed to release medicine. Please try again.\n\nError: ' + errorMessage);
    } finally {
      setLoading(false);
      setBlockchainLoading(false);
      setRetryCount(0);
    }
  };

  const remainingAfterRelease = selectedStock && formData.quantity_released
    ? selectedStock.remaining_quantity - parseInt(formData.quantity_released || 0)
    : null;

  // ========== PART 2 OF 3 - JSX RENDER START ==========

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-emerald-50">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Release Medicine
              </h1>
              <p className="text-gray-800 font-medium">Distribute medicine to residents with frequency monitoring</p>
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
              { num: 1, label: 'Medicine & Stock' },
              { num: 2, label: 'Resident Info' },
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
                <p className="text-yellow-900 text-sm font-medium">Please connect your MetaMask wallet to release medicine with blockchain verification.</p>
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

        {/* ✅ NEW: Frequency Restriction Period Selector */}
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

        {/* ✅ NEW: Restriction Checking Status */}
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

        {/* ✅ NEW: Restriction Violation Warning */}
        {restrictionViolation && !overrideRestriction && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-400 rounded-xl p-5 mb-6 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-8 h-8 text-red-700 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-red-900 text-lg">⚠️ Frequency Restriction Violation</h3>
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                
                <div className="bg-white bg-opacity-80 rounded-lg p-4 mb-3 border border-red-300">
                  <p className="font-bold text-red-900 mb-2">{restrictionViolation.message}</p>
                  {lastReleaseInfo && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-red-800 font-medium">Last Release:</span>
                        <span className="ml-2 font-bold text-red-900">{lastReleaseInfo.date}</span>
                      </div>
                      <div>
                        <span className="text-red-800 font-medium">Quantity:</span>
                        <span className="ml-2 font-bold text-red-900">{lastReleaseInfo.quantity} units</span>
                      </div>
                      <div>
                        <span className="text-red-800 font-medium">Days Since:</span>
                        <span className="ml-2 font-bold text-red-900">{lastReleaseInfo.daysSince} days ago</span>
                      </div>
                      <div>
                        <span className="text-red-800 font-medium">Available In:</span>
                        <span className="ml-2 font-bold text-orange-700">{lastReleaseInfo.daysUntilAllowed} days</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2 bg-yellow-100 border border-yellow-400 rounded-lg p-3 mb-3">
                  <AlertCircle className="w-5 h-5 text-yellow-800 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-900 font-medium">
                    This resident already received this medicine within the <strong>{RESTRICTION_PERIODS[restrictionPeriod].label.toLowerCase()}</strong> restriction period.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOverrideRestriction(true)}
                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Shield className="w-5 h-5" />
                    Override & Continue (Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMedicine(null);
                      setSelectedStock(null);
                    }}
                    className="px-4 py-2 bg-white border-2 border-gray-400 text-gray-900 font-bold rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Cancel Release
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ NEW: Override Active Notice */}
        {overrideRestriction && (
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-400 rounded-xl p-4 mb-6 shadow-md">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-orange-700" />
              <div>
                <p className="font-bold text-orange-900">Admin Override Active</p>
                <p className="text-sm text-orange-800 font-medium">Frequency restriction has been bypassed. Proceed with caution.</p>
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
          {/* Step 1: Select Medicine & Batch */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 transition-all hover:shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Pill className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Select Medicine & Stock Batch</h3>
                <p className="text-sm text-gray-800 font-medium">Choose the medicine and batch to release</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Medicine <span className="text-red-600">*</span>
                </label>
                <select
                  value={selectedMedicine?.medicine_id || ''}
                  onChange={(e) => {
                    const med = medicines.find(m => m.medicine_id === parseInt(e.target.value));
                    setSelectedMedicine(med || null);
                    setSelectedStock(null);
                    setFormData(prev => ({ ...prev, medicine_id: e.target.value, stock_id: '', quantity_released: '' }));
                    setFormErrors(prev => ({ ...prev, medicine: undefined, stock: undefined }));
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                    formErrors.medicine ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={loadingMedicines}
                >
                  <option value="" className="text-gray-900">
                    {loadingMedicines ? '⏳ Loading...' : '🔍 Select Medicine'}
                  </option>
                  {medicines.map(med => (
                    <option key={med.medicine_id} value={med.medicine_id} className="text-gray-900">
                      {med.medicine_name} {med.generic_name && `(${med.generic_name})`}
                    </option>
                  ))}
                </select>
                {formErrors.medicine && (
                  <p className="text-red-700 text-sm font-bold flex items-center gap-1 mt-2">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.medicine}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Stock Batch <span className="text-red-600">*</span>
                </label>
                <select
                  value={selectedStock?.stock_id || ''}
                  onChange={(e) => {
                    const stock = stocks.find(s => s.stock_id === parseInt(e.target.value));
                    setSelectedStock(stock || null);
                    setFormData(prev => ({ ...prev, stock_id: e.target.value, quantity_released: '' }));
                    setFormErrors(prev => ({ ...prev, stock: undefined, quantity_released: undefined }));
                  }}
                  disabled={!selectedMedicine || loadingStocks}
                  className={`w-full px-4 py-3 border-2 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all disabled:bg-gray-100 ${
                    formErrors.stock ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="" className="text-gray-900">
                    {!selectedMedicine ? 'Select medicine first' : loadingStocks ? '⏳ Loading...' : '🔍 Select Batch'}
                  </option>
                  {stocks.map(stock => (
                    <option key={stock.stock_id} value={stock.stock_id} className="text-gray-900">
                      Batch: {stock.batch_number} - Available: {stock.remaining_quantity} units
                    </option>
                  ))}
                </select>
                {formErrors.stock && (
                  <p className="text-red-700 text-sm font-bold flex items-center gap-1 mt-2">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.stock}
                  </p>
                )}
              </div>
            </div>

            {selectedStock && (
              <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-800 font-bold">Available Stock:</span>
                    <span className="ml-2 font-bold text-blue-900 text-lg">{selectedStock.remaining_quantity} units</span>
                  </div>
                  <div>
                    <span className="text-blue-800 font-bold">Expires:</span>
                    <span className="ml-2 font-bold text-blue-900">
                      {new Date(selectedStock.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-800 font-bold">Location:</span>
                    <span className="ml-2 font-bold text-blue-900">{selectedStock.storage_location || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Resident Information */}
          {selectedStock && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 transition-all hover:shadow-xl animate-fadeIn">
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

                {/* Medical Concerns with Checkboxes */}
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
          )}

          // ========== PART 3 OF 3 - FINAL JSX SECTIONS ==========

          {/* Step 3: Release Details */}
          {selectedStock && formData.resident_name && formData.selected_concerns.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 transition-all hover:shadow-xl animate-fadeIn">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Release Details</h3>
                  <p className="text-sm text-gray-800 font-medium">Enter quantity and additional information</p>
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Quantity to Release <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.quantity_released}
                        onChange={handleQuantityChange}
                        min="1"
                        max={selectedStock.remaining_quantity}
                        placeholder="Enter quantity"
                        className={`w-full px-4 py-4 pr-20 text-lg text-gray-900 font-bold placeholder-gray-500 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                          formErrors.quantity_released 
                            ? 'border-red-500 bg-red-50' 
                            : formData.quantity_released && !formErrors.quantity_released
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300'
                        }`}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-800">
                        / {selectedStock.remaining_quantity}
                      </div>
                    </div>
                    
                    {formErrors.quantity_released ? (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm font-bold flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          <span>{formErrors.quantity_released}</span>
                        </p>
                      </div>
                    ) : formData.quantity_released && !formErrors.quantity_released && remainingAfterRelease !== null ? (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 text-sm font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                          <span>
                            Valid • <span className="text-green-900">{remainingAfterRelease} units</span> will remain
                          </span>
                        </p>
                      </div>
                    ) : null}
                  </div>

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

          {/* Prescription Details (Optional) */}
          {selectedStock && formData.resident_name && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 transition-all hover:shadow-xl animate-fadeIn">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Prescription Details (Optional)</h3>
                  <p className="text-sm text-gray-800 font-medium">Add prescription information if applicable</p>
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
                    placeholder="e.g., Take 1 tablet twice daily after meals"
                    rows="2"
                    className="w-full px-4 py-3 border-2 border-gray-300 text-gray-900 font-medium placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Release Summary */}
          {selectedMedicine && selectedStock && formData.resident_name && formData.quantity_released && !formErrors.quantity_released && (
            <div className="bg-gradient-to-r from-green-50 via-teal-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 shadow-lg animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-bold text-green-900">Release Summary - Please Review</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <span className="text-sm text-green-800 font-bold block mb-2">Medicine</span>
                  <p className="font-bold text-green-900 text-lg">{selectedMedicine.medicine_name}</p>
                  {selectedMedicine.generic_name && (
                    <p className="text-sm text-green-800 font-medium">({selectedMedicine.generic_name})</p>
                  )}
                </div>
                
                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <span className="text-sm text-green-800 font-bold block mb-2">Batch Number</span>
                  <p className="font-bold text-green-900 text-lg">{selectedStock.batch_number}</p>
                </div>
                
                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <span className="text-sm text-green-800 font-bold block mb-2">Resident</span>
                  <p className="font-bold text-green-900 text-lg">{formData.resident_name}</p>
                  {formData.resident_age && (
                    <p className="text-sm text-green-800 font-medium">{formData.resident_age} years old</p>
                  )}
                </div>
                
                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <span className="text-sm text-green-800 font-bold block mb-2">Medical Concern</span>
                  <p className="font-bold text-green-900">{getConcernString()}</p>
                </div>
                
                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <span className="text-sm text-blue-800 font-bold block mb-2">Current Stock</span>
                  <p className="font-bold text-blue-900 text-3xl">{selectedStock.remaining_quantity}</p>
                  <p className="text-sm text-blue-800 font-medium">units</p>
                </div>
                
                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <span className="text-sm text-orange-800 font-bold block mb-2">Releasing</span>
                  <p className="font-bold text-orange-700 text-3xl">-{formData.quantity_released}</p>
                  <p className="text-sm text-orange-800 font-medium">units</p>
                </div>
                
                <div className="bg-white bg-opacity-60 rounded-lg p-4 md:col-span-2">
                  <span className="text-sm text-purple-800 font-bold block mb-2">Remaining After Release</span>
                  <p className="font-bold text-purple-700 text-4xl">{remainingAfterRelease}</p>
                  <p className="text-sm text-purple-800 font-medium">units</p>
                </div>

                {/* ✅ NEW: Show restriction info in summary */}
                {lastReleaseInfo && (
                  <div className="bg-white bg-opacity-60 rounded-lg p-4 md:col-span-2 border-2 border-orange-300">
                    <span className="text-sm text-orange-800 font-bold block mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Frequency Status
                    </span>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-orange-800 font-medium">Last Received:</span>
                        <span className="ml-2 font-bold text-orange-900">{lastReleaseInfo.date}</span>
                      </div>
                      <div>
                        <span className="text-orange-800 font-medium">Days Ago:</span>
                        <span className="ml-2 font-bold text-orange-900">{lastReleaseInfo.daysSince} days</span>
                      </div>
                    </div>
                    {overrideRestriction && (
                      <div className="mt-2 flex items-center gap-2 text-orange-700">
                        <Shield className="w-4 h-4" />
                        <span className="text-xs font-bold">Admin Override Active</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                <p className="text-sm text-green-900 font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>
                    This action will create a blockchain transaction (with automatic retry on failure)
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

          {/* ✅ NEW: Restriction Error Display */}
          {formErrors.restriction && !overrideRestriction && (
            <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
              <p className="text-red-900 font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {formErrors.restriction}
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
                  !selectedStock || 
                  !address || 
                  !formData.resident_name.trim() ||
                  formData.selected_concerns.length === 0 ||
                  !formData.quantity_released ||
                  Object.keys(formErrors).some(key => formErrors[key]) ||
                  (restrictionViolation && !overrideRestriction)
                }
                className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-xl font-bold text-lg shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
              >
                {blockchainLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {retryCount > 0 ? `Retrying (${retryCount}/${MAX_RETRIES})...` : 'Releasing Medicine...'}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-6 h-6" />
                    {restrictionViolation && overrideRestriction ? 'Override & Release (Sign with MetaMask)' : 'Release Medicine (Sign with MetaMask)'}
                  </span>
                )}
              </button>
            </div>
            
            {!address && (
              <p className="text-center text-sm text-gray-800 font-bold mt-3">
                ⚠️ Connect your wallet to enable submission
              </p>
            )}

            {/* ✅ NEW: Restriction warning on button */}
            {restrictionViolation && !overrideRestriction && (
              <p className="text-center text-sm text-red-700 font-bold mt-3 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Frequency restriction active - Override required to proceed
              </p>
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

  