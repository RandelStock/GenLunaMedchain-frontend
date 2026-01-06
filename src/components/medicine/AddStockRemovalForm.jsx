import { useState, useEffect } from 'react';
import { useStockRemoval } from '../../hooks/useStockRemoval';
import { useAddress } from '@thirdweb-dev/react';
import api from '../../../api';
import API_BASE_URL from '../../config.js';

const API_URL = API_BASE_URL;

const REMOVAL_REASONS = [
  { value: 'EXPIRED', label: 'Expired', icon: '⏰', color: 'red', bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' },
  { value: 'ENTRY_ERROR', label: 'Entry Error', icon: '✏️', color: 'orange', bgColor: 'bg-orange-50', textColor: 'text-orange-700', borderColor: 'border-orange-200' },
  { value: 'DAMAGED', label: 'Damaged', icon: '💔', color: 'yellow', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' },
  { value: 'LOST', label: 'Lost', icon: '🔍', color: 'gray', bgColor: 'bg-gray-50', textColor: 'text-gray-700', borderColor: 'border-gray-200' },
  { value: 'OTHER', label: 'Other', icon: '📋', color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' }
];

const AddStockRemovalForm = ({ onSuccess, onCancel }) => {
  const { 
    createRemoval, 
    generateRemovalHash,
    storeRemovalHash,
    updateRemovalBlockchainInfo,
    deleteRemoval,
    loading, 
    error,
    contractLoaded 
  } = useStockRemoval();
  
  const address = useAddress();

  const [medicines, setMedicines] = useState([]);
  const [availableStocks, setAvailableStocks] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [loadingMedicines, setLoadingMedicines] = useState(true);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [blockchainLoading, setBlockchainLoading] = useState(false);

  const [formData, setFormData] = useState({
    quantity_removed: '',
    reason: 'EXPIRED',
    notes: '',
    date_removed: new Date().toISOString().split('T')[0]
  });

  const [formErrors, setFormErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1); // 1: Medicine, 2: Stock, 3: Details

  useEffect(() => {
    loadMedicines();
  }, []);

  useEffect(() => {
    if (selectedMedicine) {
      loadStocks(selectedMedicine.medicine_id);
      setCurrentStep(2);
    } else {
      setAvailableStocks([]);
      setSelectedStock(null);
      setCurrentStep(1);
    }
  }, [selectedMedicine]);

  useEffect(() => {
    if (selectedStock) {
      setCurrentStep(3);
    }
  }, [selectedStock]);

  const loadMedicines = async () => {
    try {
      setLoadingMedicines(true);
      const { data: json } = await api.get(`/medicines?is_active=true`);
      setMedicines(json.data || []);
    } catch (err) {
      console.error('Failed to load medicines:', err);
      alert('Error loading medicines: ' + err.message);
    } finally {
      setLoadingMedicines(false);
    }
  };

  const loadStocks = async (medicineId) => {
    try {
      setLoadingStocks(true);
      const { data: json } = await api.get(`/stocks?medicine_id=${medicineId}`);
      const stocks = json.data || [];
      const activeStocks = stocks.filter(s => s.remaining_quantity > 0 && s.is_active);
      setAvailableStocks(activeStocks);
      
      // Auto-select first stock if only one available
      if (activeStocks.length === 1) {
        setSelectedStock(activeStocks[0]);
      }
      
      if (activeStocks.length === 0) {
        alert('⚠️ No available stock for this medicine');
      }
    } catch (err) {
      console.error('Failed to load stocks:', err);
      alert('Error loading stocks: ' + err.message);
      setAvailableStocks([]);
    } finally {
      setLoadingStocks(false);
    }
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    
    // Allow empty string for clearing
    if (value === '') {
      setFormData(prev => ({ ...prev, quantity_removed: '' }));
      setFormErrors(prev => ({ ...prev, quantity_removed: undefined }));
      return;
    }

    // Only allow positive integers
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0) {
      return; // Don't update if invalid
    }

    // Real-time validation against available stock
    if (selectedStock && numValue > selectedStock.remaining_quantity) {
      setFormErrors(prev => ({
        ...prev,
        quantity_removed: `Maximum ${selectedStock.remaining_quantity} units available`
      }));
    } else if (numValue === 0) {
      setFormErrors(prev => ({
        ...prev,
        quantity_removed: 'Quantity must be at least 1'
      }));
    } else {
      setFormErrors(prev => ({ ...prev, quantity_removed: undefined }));
    }

    setFormData(prev => ({ ...prev, quantity_removed: value }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
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
    if (!formData.quantity_removed || formData.quantity_removed <= 0) {
      errors.quantity_removed = 'Valid quantity is required';
    }
    if (selectedStock && parseInt(formData.quantity_removed) > selectedStock.remaining_quantity) {
      errors.quantity_removed = `Cannot exceed available quantity (${selectedStock.remaining_quantity})`;
    }
    if (!formData.reason) {
      errors.reason = 'Reason is required';
    }
    if (!formData.date_removed) {
      errors.date_removed = 'Date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setSelectedMedicine(null);
    setSelectedStock(null);
    setAvailableStocks([]);
    setFormData({
      quantity_removed: '',
      reason: 'EXPIRED',
      notes: '',
      date_removed: new Date().toISOString().split('T')[0]
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

    let savedRemoval = null;

    try {
      setBlockchainLoading(true);

      // Step 1: Create removal in database first (to get removal_id)
      console.log('Step 1: Creating removal in database...');
      savedRemoval = await createRemoval({
        medicine_id: selectedMedicine.medicine_id,
        stock_id: selectedStock.stock_id,
        quantity_removed: parseInt(formData.quantity_removed),
        reason: formData.reason,
        notes: formData.notes,
        date_removed: formData.date_removed,
        removed_by_wallet: address.toLowerCase()
      });

      console.log('Removal saved to database:', savedRemoval);

      // Step 2: Generate hash from removal data
      console.log('Step 2: Generating hash...');
      const dataHash = generateRemovalHash({
        removal_id: savedRemoval.removal_id,
        medicine_id: savedRemoval.medicine_id,
        stock_id: savedRemoval.stock_id,
        quantity_removed: savedRemoval.quantity_removed,
        reason: savedRemoval.reason,
        date_removed: savedRemoval.date_removed
      });

      console.log('Generated hash:', dataHash);

      // Step 3: Store hash on blockchain only if the related stock has unit_cost > 0
      let tx = null;
      try {
        const stockResp = await fetch(`${API_URL}/stocks/${savedRemoval.stock_id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const stockJson = await stockResp.json();
        const stock = stockJson.data || stockJson.stock || stockJson;
        const unitCost = parseFloat(stock?.unit_cost || 0);
        
        if (unitCost > 0) {
          console.log('Step 3: Storing hash on blockchain (MetaMask confirmation required)...');
          tx = await storeRemovalHash(savedRemoval.removal_id, dataHash);
          console.log('Blockchain transaction successful:', tx);
        } else {
          console.log('Skipping blockchain write: non-money operation (unit_cost <= 0)');
        }
      } catch (fetchErr) {
        console.warn('Could not fetch stock for cost check, skipping blockchain write:', fetchErr);
      }

      // Extract transaction hash - handle different response structures
      const txHash = tx ? (tx.hash || tx.transactionHash || tx.receipt?.transactionHash || tx.receipt?.hash) : null;
      if (tx) {
        if (!txHash) {
          console.error('No transaction hash found in response:', tx);
          throw new Error('Transaction succeeded but no hash was returned');
        }
        console.log('Transaction hash:', txHash);
      }

      // Step 4: Update database with blockchain info
      console.log('Step 4: Updating database with blockchain info...');
      if (txHash) {
        await updateRemovalBlockchainInfo(savedRemoval.removal_id, {
          blockchain_hash: dataHash,
          blockchain_tx_hash: txHash,
          removed_by_wallet: address.toLowerCase(),
        });
      }

      if (txHash) {
        alert('✅ Stock removal recorded successfully!\n\n📝 Transaction Hash:\n' + txHash);
      } else {
        alert('✅ Stock removal recorded successfully!');
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        resetForm();
      }
    } catch (err) {
      console.error('Error during removal:', err);
      
      // ROLLBACK: Delete the removal if blockchain failed
      if (savedRemoval && savedRemoval.removal_id) {
        try {
          console.log('Rolling back database entry...');
          await deleteRemoval(savedRemoval.removal_id);
          console.log('Rollback successful - removal deleted from database');
        } catch (rollbackErr) {
          console.error('Rollback failed:', rollbackErr);
          alert('❌ Critical Error: Failed to rollback database changes. Please contact administrator.');
        }
      }
      
      // Provide more specific error messages
      let errorMessage = err.message;
      if (err.message.includes('user rejected')) {
        errorMessage = 'Transaction was rejected in MetaMask. Removal has been cancelled.';
      } else if (err.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fees. Removal has been cancelled.';
      } else if (err.message.includes('Wallet not connected')) {
        errorMessage = 'Please connect your MetaMask wallet';
      } else if (err.message.includes('Transaction succeeded but no hash')) {
        errorMessage = 'Blockchain transaction completed but hash extraction failed. Please check the blockchain explorer and contact support.';
      }
      
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setBlockchainLoading(false);
    }
  };

  const selectedReason = REMOVAL_REASONS.find(r => r.value === formData.reason);
  const remainingAfterRemoval = selectedStock && formData.quantity_removed 
    ? selectedStock.remaining_quantity - parseInt(formData.quantity_removed || 0)
    : null;
  // RENDER - Continues from Part 1
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Record Stock Removal</h1>
              <p className="text-gray-600">Remove medicine from inventory with blockchain verification</p>
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
              { num: 1, label: 'Select Medicine' },
              { num: 2, label: 'Choose Batch' },
              { num: 3, label: 'Enter Details' }
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 flex-1 px-4 py-2 rounded-lg transition-all ${
                  currentStep === step.num 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg' 
                    : currentStep > step.num
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep === step.num ? 'bg-white text-red-600' : ''
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
              <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <p className="font-bold text-yellow-900 text-lg mb-1">Wallet Not Connected</p>
                <p className="text-yellow-800 text-sm">Please connect your MetaMask wallet to record removals on the blockchain.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5 mb-6 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-semibold text-green-900">Wallet Connected</p>
                <p className="text-sm text-green-700 font-mono">{address.slice(0, 8)}...{address.slice(-6)}</p>
              </div>
            </div>
          </div>
        )}

        {!contractLoaded && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-800">Loading smart contract...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select Medicine */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 transition-all hover:shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">💊</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Select Medicine</h3>
                <p className="text-sm text-gray-600">Choose the medicine you want to remove from inventory</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                Medicine <span className="text-red-600">*</span>
              </label>
              <select
                value={selectedMedicine?.medicine_id || ''}
                onChange={(e) => {
                  const med = medicines.find(m => m.medicine_id === parseInt(e.target.value));
                  setSelectedMedicine(med || null);
                  setSelectedStock(null);
                  setFormData(prev => ({ ...prev, quantity_removed: '' }));
                  setFormErrors({});
                }}
                className={`w-full px-4 py-3 border-2 rounded-lg text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${
                  formErrors.medicine ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                disabled={loadingMedicines}
              >
                <option value="">
                  {loadingMedicines ? '⏳ Loading medicines...' : '🔍 Choose a medicine...'}
                </option>
                {medicines.map(med => (
                  <option key={med.medicine_id} value={med.medicine_id}>
                    {med.medicine_name} {med.strength && `• ${med.strength}`} {med.dosage_form && `• ${med.dosage_form}`}
                  </option>
                ))}
              </select>
              {formErrors.medicine && (
                <p className="text-red-600 text-sm flex items-center gap-1 mt-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {formErrors.medicine}
                </p>
              )}

              {/* Medicine Details Card */}
              {selectedMedicine && (
                <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 animate-fadeIn">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <span className="text-lg">ℹ️</span>
                    Selected Medicine Details
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Generic:</span>
                      <p className="text-blue-900 font-semibold mt-1">{selectedMedicine.generic_name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Category:</span>
                      <p className="text-blue-900 font-semibold mt-1">{selectedMedicine.category || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Form:</span>
                      <p className="text-blue-900 font-semibold mt-1">{selectedMedicine.dosage_form || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Select Stock Batch */}
          {selectedMedicine && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 transition-all hover:shadow-xl animate-fadeIn">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📦</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Choose Stock Batch</h3>
                  <p className="text-sm text-gray-600">Select which batch you want to remove from</p>
                </div>
              </div>

              {loadingStocks ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                  <p className="ml-3 text-gray-600">Loading stock batches...</p>
                </div>
              ) : availableStocks.length === 0 ? (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center">
                  <span className="text-4xl mb-3 block">📭</span>
                  <p className="text-yellow-900 font-bold text-lg mb-1">No Available Stock</p>
                  <p className="text-yellow-700 text-sm">All batches for this medicine are either depleted or inactive</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableStocks.map(stock => (
                    <button
                      key={stock.stock_id}
                      type="button"
                      onClick={() => {
                        setSelectedStock(stock);
                        setFormData(prev => ({ ...prev, quantity_removed: '' }));
                        setFormErrors(prev => ({ ...prev, stock: undefined, quantity_removed: undefined }));
                      }}
                      className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                        selectedStock?.stock_id === stock.stock_id
                          ? 'border-red-500 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg transform scale-[1.02]'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="font-bold text-lg text-gray-900">
                              Batch: {stock.batch_number}
                            </span>
                            {selectedStock?.stock_id === stock.stock_id && (
                              <span className="px-3 py-1 bg-red-500 text-white text-xs rounded-full font-bold shadow-md animate-pulse">
                                ✓ SELECTED
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white bg-opacity-60 rounded-lg p-3">
                              <span className="text-xs text-gray-600 block mb-1">Available Stock</span>
                              <span className="font-bold text-2xl text-green-600 block">
                                {stock.remaining_quantity}
                              </span>
                              <span className="text-xs text-gray-500">units</span>
                            </div>
                            <div className="bg-white bg-opacity-60 rounded-lg p-3">
                              <span className="text-xs text-gray-600 block mb-1">Expiry Date</span>
                              <span className="font-semibold text-sm text-gray-900 block">
                                {new Date(stock.expiry_date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="bg-white bg-opacity-60 rounded-lg p-3">
                              <span className="text-xs text-gray-600 block mb-1">Location</span>
                              <span className="font-semibold text-sm text-gray-900 block truncate">
                                {stock.storage_location || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {formErrors.stock && (
                <p className="mt-3 text-red-600 text-sm flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {formErrors.stock}
                </p>
              )}
            </div>
          )}
          {/* Step 3: Removal Details */}
          {selectedStock && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 transition-all hover:shadow-xl animate-fadeIn">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📝</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Removal Details</h3>
                  <p className="text-sm text-gray-600">Enter the quantity and reason for removal</p>
                </div>
              </div>
              
              <div className="space-y-5">
                {/* Quantity Input with Enhanced Validation */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Quantity to Remove <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.quantity_removed}
                      onChange={handleQuantityChange}
                      min="1"
                      max={selectedStock.remaining_quantity}
                      placeholder="Enter quantity"
                      className={`w-full px-4 py-4 pr-32 text-lg border-2 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${
                        formErrors.quantity_removed 
                          ? 'border-red-500 bg-red-50' 
                          : formData.quantity_removed && !formErrors.quantity_removed
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300'
                      }`}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                      / {selectedStock.remaining_quantity} max
                    </div>
                  </div>
                  
                  {formErrors.quantity_removed ? (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{formErrors.quantity_removed}</span>
                      </p>
                    </div>
                  ) : formData.quantity_removed && !formErrors.quantity_removed && remainingAfterRemoval !== null ? (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-700 text-sm flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">
                          Valid quantity • <span className="text-green-800 font-bold">{remainingAfterRemoval} units</span> will remain in stock
                        </span>
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Reason Selector with Visual Cards */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Reason for Removal <span className="text-red-600">*</span>
                    </label>
                    <div className="space-y-2">
                      {REMOVAL_REASONS.map(reason => (
                        <button
                          key={reason.value}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, reason: reason.value }));
                            setFormErrors(prev => ({ ...prev, reason: undefined }));
                          }}
                          className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                            formData.reason === reason.value
                              ? `${reason.borderColor} ${reason.bgColor} shadow-md transform scale-[1.02]`
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{reason.icon}</span>
                            <div className="flex-1">
                              <span className={`font-semibold ${
                                formData.reason === reason.value ? reason.textColor : 'text-gray-700'
                              }`}>
                                {reason.label}
                              </span>
                            </div>
                            {formData.reason === reason.value && (
                              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date Removed */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Date Removed <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      name="date_removed"
                      value={formData.date_removed}
                      onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${
                        formErrors.date_removed ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.date_removed && (
                      <p className="text-red-600 text-sm mt-2">{formErrors.date_removed}</p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Add any additional details about this removal..."
                    rows="4"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none text-gray-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Summary Card - Shows before submission */}
          {selectedMedicine && selectedStock && formData.quantity_removed && !formErrors.quantity_removed && (
            <div className="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 border-2 border-red-300 rounded-xl p-6 shadow-lg animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">⚠️</span>
                </div>
                <h4 className="text-xl font-bold text-red-900">Removal Summary - Please Review</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <span className="text-sm text-red-700 font-medium block mb-2">Medicine</span>
                  <p className="font-bold text-red-900 text-lg">{selectedMedicine.medicine_name}</p>
                  <p className="text-sm text-red-700">{selectedMedicine.strength}</p>
                </div>
                
                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <span className="text-sm text-orange-700 font-medium block mb-2">Batch Number</span>
                  <p className="font-bold text-orange-900 text-lg">{selectedStock.batch_number}</p>
                </div>
                
                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <span className="text-sm text-red-700 font-medium block mb-2">Removing</span>
                  <p className="font-bold text-red-600 text-3xl">-{formData.quantity_removed}</p>
                  <p className="text-sm text-red-700">units</p>
                </div>
                
                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <span className="text-sm text-green-700 font-medium block mb-2">Remaining After</span>
                  <p className="font-bold text-green-600 text-3xl">{remainingAfterRemoval}</p>
                  <p className="text-sm text-green-700">units</p>
                </div>
                
                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <span className="text-sm text-orange-700 font-medium block mb-2">Reason</span>
                  <p className="font-semibold text-orange-900">{selectedReason?.icon} {selectedReason?.label}</p>
                </div>
                
                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <span className="text-sm text-orange-700 font-medium block mb-2">Date</span>
                  <p className="font-semibold text-orange-900">
                    {new Date(formData.date_removed).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="bg-orange-100 border border-orange-300 rounded-lg p-4">
                <p className="text-sm text-orange-800 flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">
                    This action will create a blockchain transaction requiring MetaMask confirmation
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {(error || formErrors.wallet) && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <p className="text-red-700 font-medium">{formErrors.wallet || error}</p>
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
                className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                  !contractLoaded || 
                  !formData.quantity_removed ||
                  Object.keys(formErrors).some(key => formErrors[key])
                }
                className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold text-lg shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
              >
                {blockchainLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Blockchain Transaction...
                  </span>
                ) : loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Record Removal (Sign with MetaMask)
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

export default AddStockRemovalForm;