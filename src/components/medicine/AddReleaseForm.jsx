import { useState, useEffect } from 'react';
import { useMedicineRelease } from '../../hooks/useMedicineRelease';
import { useAddress } from '@thirdweb-dev/react';
import { User, Package, Calendar, AlertCircle, CheckCircle2, Pill, Heart } from 'lucide-react';
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
  const [currentStep, setCurrentStep] = useState(1); // 1: Medicine, 2: Resident, 3: Details

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
      
      // Auto-select if only one stock available
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const errorMessages = Object.values(formErrors).filter(Boolean).join('\n');
      alert('Please fix the following errors:\n\n' + errorMessages);
      return;
    }

    setLoading(true);
    try {
      const concernString = getConcernString();
      
      const result = await createRelease({
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
      alert('❌ Failed to release medicine. Please try again.\n\nError: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const remainingAfterRelease = selectedStock && formData.quantity_released
    ? selectedStock.remaining_quantity - parseInt(formData.quantity_released || 0)
    : null;
  // RENDER - Continues from Part 1
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-emerald-50">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-2">
                Release Medicine
              </h1>
              <p className="text-gray-600">Distribute medicine to residents with complete documentation</p>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
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
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep === step.num ? 'bg-white text-green-600' : ''
                  }`}>
                    {currentStep > step.num ? '✓' : step.num}
                  </div>
                  <span className="font-medium text-sm">{step.label}</span>
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
              <AlertCircle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-yellow-900 text-lg mb-1">Wallet Not Connected</p>
                <p className="text-yellow-800 text-sm">Please connect your MetaMask wallet to release medicine with blockchain verification.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5 mb-6 shadow-md">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Wallet Connected</p>
                <p className="text-sm text-green-700 font-mono">{address.slice(0, 8)}...{address.slice(-6)}</p>
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
                <p className="text-sm text-gray-600">Choose the medicine and batch to release</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
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
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                    formErrors.medicine ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={loadingMedicines}
                >
                  <option value="">
                    {loadingMedicines ? '⏳ Loading...' : '🔍 Select Medicine'}
                  </option>
                  {medicines.map(med => (
                    <option key={med.medicine_id} value={med.medicine_id}>
                      {med.medicine_name} {med.generic_name && `(${med.generic_name})`}
                    </option>
                  ))}
                </select>
                {formErrors.medicine && (
                  <p className="text-red-600 text-sm flex items-center gap-1 mt-2">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.medicine}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
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
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all disabled:bg-gray-100 ${
                    formErrors.stock ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">
                    {!selectedMedicine ? 'Select medicine first' : loadingStocks ? '⏳ Loading...' : '🔍 Select Batch'}
                  </option>
                  {stocks.map(stock => (
                    <option key={stock.stock_id} value={stock.stock_id}>
                      Batch: {stock.batch_number} - Available: {stock.remaining_quantity} units
                    </option>
                  ))}
                </select>
                {formErrors.stock && (
                  <p className="text-red-600 text-sm flex items-center gap-1 mt-2">
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
                    <span className="text-blue-700 font-medium">Available Stock:</span>
                    <span className="ml-2 font-bold text-blue-900 text-lg">{selectedStock.remaining_quantity} units</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Expires:</span>
                    <span className="ml-2 font-semibold text-blue-900">
                      {new Date(selectedStock.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Location:</span>
                    <span className="ml-2 font-semibold text-blue-900">{selectedStock.storage_location || 'N/A'}</span>
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
                  <p className="text-sm text-gray-600">Select from directory or enter manually</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Select from Directory (Optional)
                  </label>
                  <select
                    name="resident_id"
                    value={formData.resident_id}
                    onChange={handleChange}
                    disabled={loadingResidents}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  >
                    <option value="">
                      {loadingResidents ? '⏳ Loading residents...' : '👤 Select resident or enter manually below'}
                    </option>
                    {residents.map(resident => (
                      <option key={resident.resident_id} value={resident.resident_id}>
                        {resident.full_name || `${resident.first_name} ${resident.last_name}`}
                        {resident.age && ` • ${resident.age} years old`}
                        {resident.barangay && ` • ${resident.barangay}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Resident Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="resident_name"
                      value={formData.resident_name}
                      onChange={handleChange}
                      placeholder="Enter resident name"
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                        formErrors.resident_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.resident_name && (
                      <p className="text-red-600 text-sm mt-1">{formErrors.resident_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Age</label>
                    <input
                      type="number"
                      name="resident_age"
                      value={formData.resident_age}
                      onChange={handleChange}
                      placeholder="Age"
                      min="0"
                      max="150"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                  </div>
                </div>

                {/* Medical Concerns with Checkboxes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
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
                          <span className={`text-sm font-medium ${
                            formData.selected_concerns.includes(concern.value) ? 'text-green-900' : 'text-gray-700'
                          }`}>
                            {concern.label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {formErrors.concern && (
                    <p className="text-red-600 text-sm flex items-center gap-1 mt-2">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.concern}
                    </p>
                  )}
                </div>

                {/* Other Concern Input (shows if OTHER is selected) */}
                {formData.selected_concerns.includes('OTHER') && (
                  <div className="animate-fadeIn">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Specify Other Concern <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="other_concern"
                      value={formData.other_concern}
                      onChange={handleChange}
                      placeholder="e.g., Skin infection, Respiratory issue"
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                        formErrors.other_concern ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.other_concern && (
                      <p className="text-red-600 text-sm mt-1">{formErrors.other_concern}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Step 3: Release Details */}
          {selectedStock && formData.resident_name && formData.selected_concerns.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 transition-all hover:shadow-xl animate-fadeIn">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Release Details</h3>
                  <p className="text-sm text-gray-600">Enter quantity and additional information</p>
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Quantity Input with Real-time Validation */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
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
                        className={`w-full px-4 py-4 pr-20 text-lg border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                          formErrors.quantity_released 
                            ? 'border-red-500 bg-red-50' 
                            : formData.quantity_released && !formErrors.quantity_released
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300'
                        }`}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                        / {selectedStock.remaining_quantity}
                      </div>
                    </div>
                    
                    {formErrors.quantity_released ? (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          <span className="font-medium">{formErrors.quantity_released}</span>
                        </p>
                      </div>
                    ) : formData.quantity_released && !formErrors.quantity_released && remainingAfterRelease !== null ? (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-700 text-sm flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                          <span className="font-medium">
                            Valid • <span className="text-green-800 font-bold">{remainingAfterRelease} units</span> will remain
                          </span>
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {/* Date Released */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Date Released <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      name="date_released"
                      value={formData.date_released}
                      onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                        formErrors.date_released ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.date_released && (
                      <p className="text-red-600 text-sm mt-1">{formErrors.date_released}</p>
                    )}
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Additional Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Additional details about the release..."
                    rows="3"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
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
                  <p className="text-sm text-gray-600">Add prescription information if applicable</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Prescription Number</label>
                    <input
                      type="text"
                      name="prescription_number"
                      value={formData.prescription_number}
                      onChange={handleChange}
                      placeholder="RX-12345"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Prescribing Doctor</label>
                    <input
                      type="text"
                      name="prescribing_doctor"
                      value={formData.prescribing_doctor}
                      onChange={handleChange}
                      placeholder="Dr. Juan Dela Cruz"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Dosage Instructions</label>
                  <textarea
                    name="dosage_instructions"
                    value={formData.dosage_instructions}
                    onChange={handleChange}
                    placeholder="e.g., Take 1 tablet twice daily after meals"
                    rows="2"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
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
                  <span className="text-sm text-green-700 font-medium block mb-2">Medicine</span>
                  <p className="font-bold text-green-900 text-lg">{selectedMedicine.medicine_name}</p>
                  {selectedMedicine.generic_name && (
                    <p className="text-sm text-green-700">({selectedMedicine.generic_name})</p>
                  )}
                </div>
                
                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <span className="text-sm text-green-700 font-medium block mb-2">Batch Number</span>
                  <p className="font-bold text-green-900 text-lg">{selectedStock.batch_number}</p>
                </div>
                
                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <span className="text-sm text-green-700 font-medium block mb-2">Resident</span>
                  <p className="font-bold text-green-900 text-lg">{formData.resident_name}</p>
                  {formData.resident_age && (
                    <p className="text-sm text-green-700">{formData.resident_age} years old</p>
                  )}
                </div>
                
                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <span className="text-sm text-green-700 font-medium block mb-2">Medical Concern</span>
                  <p className="font-semibold text-green-900">{getConcernString()}</p>
                </div>
                
                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <span className="text-sm text-blue-700 font-medium block mb-2">Current Stock</span>
                  <p className="font-bold text-blue-600 text-3xl">{selectedStock.remaining_quantity}</p>
                  <p className="text-sm text-blue-700">units</p>
                </div>
                
                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <span className="text-sm text-orange-700 font-medium block mb-2">Releasing</span>
                  <p className="font-bold text-orange-600 text-3xl">-{formData.quantity_released}</p>
                  <p className="text-sm text-orange-700">units</p>
                </div>
                
                <div className="bg-white bg-opacity-60 rounded-lg p-4 md:col-span-2">
                  <span className="text-sm text-purple-700 font-medium block mb-2">Remaining After Release</span>
                  <p className="font-bold text-purple-600 text-4xl">{remainingAfterRelease}</p>
                  <p className="text-sm text-purple-700">units</p>
                </div>
              </div>
              
              <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                <p className="text-sm text-green-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">
                    This action will create a blockchain transaction requiring MetaMask confirmation
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {formErrors.wallet && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <p className="text-red-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {formErrors.wallet}
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
                disabled={loading}
                className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={
                  loading || 
                  !selectedStock || 
                  !address || 
                  !formData.resident_name.trim() ||
                  formData.selected_concerns.length === 0 ||
                  !formData.quantity_released ||
                  Object.keys(formErrors).some(key => formErrors[key])
                }
                className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-xl font-bold text-lg shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Releasing Medicine...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-6 h-6" />
                    Release Medicine (Sign with MetaMask)
                  </span>
                )}
              </button>
            </div>
            
            {!address && (
              <p className="text-center text-sm text-gray-500 mt-3">
                ⚠️ Connect your wallet to enable submission
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