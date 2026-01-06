import { useState, useEffect } from 'react';
import { Plus, Package, Calendar, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { useStockManagement } from '../../hooks/useStockManagement';
import { useAddress } from '@thirdweb-dev/react';
import api from '../../../api';
import API_BASE_URL from '../../config.js';

const API_URL = API_BASE_URL;

export default function AddStockForm({ onSuccess, onCancel }) {
  const {
    generateStockHash,
    storeStockHash,
    updateStockBlockchainInfo,
    loading: hookLoading,
    error: hookError,
    contractLoaded
  } = useStockManagement();

  const address = useAddress();

  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loadingMedicines, setLoadingMedicines] = useState(true);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [blockchainLoading, setBlockchainLoading] = useState(false);

  const [formData, setFormData] = useState({
    quantity_to_add: '',
    date_received: new Date().toISOString().split('T')[0]
  });

  const [formErrors, setFormErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1); // 1: Medicine, 2: Batch, 3: Details

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    if (selectedMedicine) {
      fetchBatches(selectedMedicine.medicine_id);
      setCurrentStep(2);
    } else {
      setBatches([]);
      setSelectedBatch(null);
      setCurrentStep(1);
    }
  }, [selectedMedicine]);

  useEffect(() => {
    if (selectedBatch) {
      setCurrentStep(3);
    }
  }, [selectedBatch]);

  const fetchMedicines = async () => {
    try {
      setLoadingMedicines(true);
      const { data: json } = await api.get(`/medicines?is_active=true`);
      const medicinesData = json.data || json;
      setMedicines(Array.isArray(medicinesData) ? medicinesData.filter(med => med.is_active) : []);
    } catch (err) {
      console.error('Error fetching medicines:', err);
      setError('Failed to load medicines');
    } finally {
      setLoadingMedicines(false);
    }
  };

  const fetchBatches = async (medicineId) => {
    try {
      setLoadingBatches(true);
      const { data: json } = await api.get(`/stocks?medicine_id=${medicineId}&is_active=true`);
      const stocksData = json.data || [];
      
      // Filter active batches that have quantity > 0
      const activeBatches = Array.isArray(stocksData) 
        ? stocksData
            .filter(stock => stock.is_active && stock.quantity > 0)
            .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
        : [];
      
      setBatches(activeBatches);
      
      // Auto-select if only one batch available
      if (activeBatches.length === 1) {
        setSelectedBatch(activeBatches[0]);
      }

      if (activeBatches.length === 0) {
        alert('⚠️ No active batches available for this medicine. Please create a new batch first.');
      }
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError('Failed to load batches');
      setBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    
    // Allow empty string for clearing
    if (value === '') {
      setFormData(prev => ({ ...prev, quantity_to_add: '' }));
      setFormErrors(prev => ({ ...prev, quantity_to_add: undefined }));
      return;
    }

    // Only allow positive integers
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0) {
      return; // Don't update if invalid
    }

    if (numValue === 0) {
      setFormErrors(prev => ({
        ...prev,
        quantity_to_add: 'Quantity must be at least 1'
      }));
    } else {
      setFormErrors(prev => ({ ...prev, quantity_to_add: undefined }));
    }

    setFormData(prev => ({ ...prev, quantity_to_add: value }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
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
    if (!selectedBatch) {
      errors.batch = 'Stock batch is required';
    }
    if (!formData.quantity_to_add || formData.quantity_to_add <= 0) {
      errors.quantity_to_add = 'Valid quantity is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setSelectedMedicine(null);
    setSelectedBatch(null);
    setBatches([]);
    setFormData({
      quantity_to_add: '',
      date_received: new Date().toISOString().split('T')[0]
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

    if (!selectedBatch) {
      alert('Selected batch not found');
      return;
    }

    // Get the CURRENT quantities from the database first
    const originalQuantity = selectedBatch.quantity;
    const originalRemainingQuantity = selectedBatch.remaining_quantity;
    const quantityToAdd = parseInt(formData.quantity_to_add);

    // Calculate NEW quantities
    const newQuantity = originalQuantity + quantityToAdd;
    const newRemainingQuantity = originalRemainingQuantity + quantityToAdd;

    console.log('Original quantity:', originalQuantity);
    console.log('Original remaining:', originalRemainingQuantity);
    console.log('Adding:', quantityToAdd);
    console.log('New quantity:', newQuantity);
    console.log('New remaining:', newRemainingQuantity);

    try {
      setBlockchainLoading(true);
      setError('');

      // Step 1: Update stock quantity in database
      console.log('Step 1: Updating stock quantity in database...');
      
      const updateResponse = await fetch(`${API_URL}/stocks/${selectedBatch.stock_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          quantity: newQuantity,
          remaining_quantity: newRemainingQuantity,
          date_received: formData.date_received
        })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.message || 'Failed to update stock');
      }

      const updateJson = await updateResponse.json();
      const updatedStock = updateJson.stock || updateJson.data || updateJson;
      console.log('Stock updated in database:', updatedStock);

      // Verify the update was correct
      if (updatedStock.quantity !== newQuantity || updatedStock.remaining_quantity !== newRemainingQuantity) {
        console.error('Database update mismatch!');
        console.error('Expected:', { quantity: newQuantity, remaining_quantity: newRemainingQuantity });
        console.error('Got:', { quantity: updatedStock.quantity, remaining_quantity: updatedStock.remaining_quantity });
      }

      // Step 2: Generate hash from updated stock data
      console.log('Step 2: Generating hash...');
      const dataHash = generateStockHash({
        stock_id: updatedStock.stock_id,
        medicine_id: updatedStock.medicine_id,
        batch_number: updatedStock.batch_number,
        quantity: updatedStock.quantity,
        expiry_date: updatedStock.expiry_date
      });

      console.log('Generated hash:', dataHash);

      // Step 3: Store hash on blockchain (only if cost > 0)
      const unitCost = parseFloat(selectedBatch.unit_cost || updatedStock.unit_cost || 0);
      let tx = null;
      if (unitCost > 0) {
        console.log('Step 3: Storing hash on blockchain...');
        tx = await storeStockHash(updatedStock.stock_id, dataHash);
        console.log('Blockchain transaction successful:', tx);
      } else {
        console.log('Skipping blockchain write: non-money operation (unit_cost <= 0)');
      }

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
        await updateStockBlockchainInfo(updatedStock.stock_id, {
          blockchain_hash: dataHash,
          blockchain_tx_hash: txHash,
          added_by_wallet: address.toLowerCase()
        });
      }

      // Step 5: Create transaction history record
      console.log('Step 5: Creating transaction history...');
      try {
        await fetch(`${API_URL}/stock-transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            stock_id: updatedStock.stock_id,
            transaction_type: 'ADDITION',
            quantity_changed: quantityToAdd,
            quantity_before: originalRemainingQuantity,
            quantity_after: newRemainingQuantity,
            transaction_date: formData.date_received,
            performed_by_wallet: address.toLowerCase(),
            blockchain_tx_hash: txHash || null,
            notes: `Added ${quantityToAdd} units to batch ${selectedBatch.batch_number}`
          })
        });
      } catch (historyErr) {
        console.error('Failed to create transaction history:', historyErr);
      }

      setSuccess(true);
      const message = txHash 
        ? `✅ Stock added successfully!\n\n📦 Medicine: ${selectedMedicine?.medicine_name}\n🏷️ Batch: ${selectedBatch.batch_number}\n➕ Quantity Added: ${quantityToAdd} units\n📊 New Total: ${newRemainingQuantity} units\n🔗 Transaction Hash:\n${txHash}`
        : `✅ Stock added successfully!\n\n📦 Medicine: ${selectedMedicine?.medicine_name}\n🏷️ Batch: ${selectedBatch.batch_number}\n➕ Quantity Added: ${quantityToAdd} units\n📊 New Total: ${newRemainingQuantity} units`;
      
      alert(message);
      
      if (onSuccess) {
        onSuccess();
      } else {
        resetForm();
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error during stock addition:', err);
      
      // ROLLBACK
      if (err.message && !err.message.includes('Transaction succeeded')) {
        try {
          console.log('Rolling back quantity change...');
          await fetch(`${API_URL}/stocks/${selectedBatch.stock_id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              quantity: originalQuantity,
              remaining_quantity: originalRemainingQuantity
            })
          });
          console.log('Rollback successful');
        } catch (rollbackErr) {
          console.error('Rollback failed:', rollbackErr);
          alert('❌ Critical Error: Failed to rollback. Please contact administrator.');
        }
      }
      
      let errorMessage = err.message;
      if (err.message.includes('user rejected')) {
        errorMessage = 'Transaction was rejected in MetaMask. Stock addition has been cancelled.';
      } else if (err.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fees. Stock addition has been cancelled.';
      } else if (err.message.includes('Wallet not connected')) {
        errorMessage = 'Please connect your MetaMask wallet';
      }
      
      setError(errorMessage);
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setBlockchainLoading(false);
      setLoading(false);
    }
  };

  const newTotalQuantity = selectedBatch && formData.quantity_to_add 
    ? selectedBatch.remaining_quantity + parseInt(formData.quantity_to_add || 0)
    : null;
  // RENDER - Continues from Part 1
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Add Stock to Existing Batch
              </h1>
              <p className="text-gray-600">Increase quantities for existing medicine batches with blockchain verification</p>
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
              { num: 3, label: 'Enter Quantity' }
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 flex-1 px-4 py-2 rounded-lg transition-all ${
                  currentStep === step.num 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : currentStep > step.num
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep === step.num ? 'bg-white text-blue-600' : ''
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
                <p className="text-yellow-800 text-sm">Please connect your MetaMask wallet to add stock with blockchain verification.</p>
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

        {!contractLoaded && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-800">Loading smart contract...</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-lg animate-fadeIn">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <p className="text-green-900 font-bold text-lg">Stock added successfully!</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {(error || hookError) && (
          <div className="mb-6 p-5 bg-red-50 border-2 border-red-300 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <p className="text-red-800 font-medium">{error || hookError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select Medicine */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 transition-all hover:shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Select Medicine</h3>
                <p className="text-sm text-gray-600">Choose the medicine you want to add stock for</p>
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
                  setSelectedBatch(null);
                  setFormData(prev => ({ ...prev, quantity_to_add: '' }));
                  setFormErrors({});
                }}
                className={`w-full px-4 py-3 border-2 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
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
                  <AlertCircle className="w-4 h-4" />
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
                      <span className="text-blue-700 font-medium">Type:</span>
                      <p className="text-blue-900 font-semibold mt-1">{selectedMedicine.medicine_type || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Dosage:</span>
                      <p className="text-blue-900 font-semibold mt-1">{selectedMedicine.dosage_form || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Manufacturer:</span>
                      <p className="text-blue-900 font-semibold mt-1">{selectedMedicine.manufacturer || 'N/A'}</p>
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
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Choose Stock Batch</h3>
                  <p className="text-sm text-gray-600">Select which batch to add stock to</p>
                </div>
              </div>

              {loadingBatches ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                  <p className="ml-3 text-gray-600">Loading stock batches...</p>
                </div>
              ) : batches.length === 0 ? (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center">
                  <span className="text-4xl mb-3 block">📭</span>
                  <p className="text-yellow-900 font-bold text-lg mb-1">No Active Batches Available</p>
                  <p className="text-yellow-700 text-sm">Please create a new batch for this medicine first</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {batches.map(batch => (
                    <button
                      key={batch.stock_id}
                      type="button"
                      onClick={() => {
                        setSelectedBatch(batch);
                        setFormData(prev => ({ ...prev, quantity_to_add: '' }));
                        setFormErrors(prev => ({ ...prev, batch: undefined, quantity_to_add: undefined }));
                      }}
                      className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                        selectedBatch?.stock_id === batch.stock_id
                          ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg transform scale-[1.02]'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="font-bold text-lg text-gray-900">
                              Batch: {batch.batch_number}
                            </span>
                            {selectedBatch?.stock_id === batch.stock_id && (
                              <span className="px-3 py-1 bg-purple-500 text-white text-xs rounded-full font-bold shadow-md animate-pulse">
                                ✓ SELECTED
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white bg-opacity-60 rounded-lg p-3">
                              <span className="text-xs text-gray-600 block mb-1">Current Stock</span>
                              <span className="font-bold text-2xl text-blue-600 block">
                                {batch.remaining_quantity}
                              </span>
                              <span className="text-xs text-gray-500">units</span>
                            </div>
                            <div className="bg-white bg-opacity-60 rounded-lg p-3">
                              <span className="text-xs text-gray-600 block mb-1">Total Quantity</span>
                              <span className="font-bold text-xl text-gray-900 block">
                                {batch.quantity}
                              </span>
                              <span className="text-xs text-gray-500">units</span>
                            </div>
                            <div className="bg-white bg-opacity-60 rounded-lg p-3">
                              <span className="text-xs text-gray-600 block mb-1">Expiry Date</span>
                              <span className="font-semibold text-sm text-gray-900 block">
                                {new Date(batch.expiry_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {batch.storage_location && (
                            <div className="mt-3 text-sm text-gray-600">
                              📍 Location: <span className="font-medium text-gray-900">{batch.storage_location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {formErrors.batch && (
                <p className="mt-3 text-red-600 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {formErrors.batch}
                </p>
              )}
            </div>
          )}
          {/* Step 3: Addition Details */}
          {selectedBatch && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 transition-all hover:shadow-xl animate-fadeIn">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Addition Details</h3>
                  <p className="text-sm text-gray-600">Enter the quantity to add to this batch</p>
                </div>
              </div>
              
              <div className="space-y-5">
                {/* Quantity Input with Enhanced Validation */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    <Package className="w-4 h-4 inline mr-1" />
                    Quantity to Add <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.quantity_to_add}
                      onChange={handleQuantityChange}
                      min="1"
                      placeholder="Enter quantity to add"
                      className={`w-full px-4 py-4 text-lg border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        formErrors.quantity_to_add 
                          ? 'border-red-500 bg-red-50' 
                          : formData.quantity_to_add && !formErrors.quantity_to_add
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300'
                      }`}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                      units
                    </div>
                  </div>
                  
                  {formErrors.quantity_to_add ? (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{formErrors.quantity_to_add}</span>
                      </p>
                    </div>
                  ) : formData.quantity_to_add && !formErrors.quantity_to_add && newTotalQuantity !== null ? (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-700 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">
                          Valid quantity • New total will be <span className="text-green-800 font-bold">{newTotalQuantity} units</span>
                        </span>
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* Date Received */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date Received
                  </label>
                  <input
                    type="date"
                    name="date_received"
                    value={formData.date_received}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Stock Addition Summary */}
          {selectedMedicine && selectedBatch && formData.quantity_to_add && !formErrors.quantity_to_add && (
            <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-2 border-green-300 rounded-xl p-6 shadow-lg animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-bold text-green-900">Addition Summary - Please Review</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <span className="text-sm text-green-700 font-medium block mb-2">Medicine</span>
                  <p className="font-bold text-green-900 text-lg">{selectedMedicine.medicine_name}</p>
                  <p className="text-sm text-green-700">{selectedMedicine.strength}</p>
                </div>
                
                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <span className="text-sm text-green-700 font-medium block mb-2">Batch Number</span>
                  <p className="font-bold text-green-900 text-lg">{selectedBatch.batch_number}</p>
                </div>
                
                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <span className="text-sm text-blue-700 font-medium block mb-2">Current Stock</span>
                  <p className="font-bold text-blue-600 text-3xl">{selectedBatch.remaining_quantity}</p>
                  <p className="text-sm text-blue-700">units</p>
                </div>
                
                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <span className="text-sm text-green-700 font-medium block mb-2">Adding</span>
                  <p className="font-bold text-green-600 text-3xl">+{formData.quantity_to_add}</p>
                  <p className="text-sm text-green-700">units</p>
                </div>
                
                <div className="bg-white bg-opacity-60 rounded-lg p-4 md:col-span-2">
                  <span className="text-sm text-purple-700 font-medium block mb-2">New Total Stock</span>
                  <p className="font-bold text-purple-600 text-4xl">{newTotalQuantity}</p>
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

          {/* Submit Buttons */}
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
                  !selectedBatch || 
                  !address || 
                  !contractLoaded || 
                  !formData.quantity_to_add ||
                  Object.keys(formErrors).some(key => formErrors[key])
                }
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
              >
                {blockchainLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing Blockchain Transaction...
                  </span>
                ) : loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Plus className="w-6 h-6" />
                    Add Stock (Sign with MetaMask)
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
}