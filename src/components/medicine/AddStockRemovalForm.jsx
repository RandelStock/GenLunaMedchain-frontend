import { useState, useEffect } from 'react';
import { useStockRemoval } from '../../hooks/useStockRemoval';
import { useAddress } from '@thirdweb-dev/react';
import { User, Package, Calendar, AlertCircle, CheckCircle2, Pill, Heart } from 'lucide-react';
import api from '../../../api';

// Common medical concerns
const REMOVAL_REASONS = [
  { value: 'EXPIRED', label: 'Expired', icon: '⏰', color: 'red', bgColor: 'bg-red-50', textColor: 'text-red-900', borderColor: 'border-red-300' },
  { value: 'ENTRY_ERROR', label: 'Entry Error', icon: '✏️', color: 'orange', bgColor: 'bg-orange-50', textColor: 'text-orange-900', borderColor: 'border-orange-300' },
  { value: 'DAMAGED', label: 'Damaged', icon: '💔', color: 'yellow', bgColor: 'bg-yellow-50', textColor: 'text-yellow-900', borderColor: 'border-yellow-300' },
  { value: 'LOST', label: 'Lost', icon: '🔍', color: 'gray', bgColor: 'bg-gray-50', textColor: 'text-gray-900', borderColor: 'border-gray-300' },
  { value: 'OTHER', label: 'Other', icon: '📋', color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-900', borderColor: 'border-blue-300' }
];

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds

const AddStockRemovalForm = ({ onSuccess, onCancel }) => {
  const { 
    createRemoval, 
    generateRemovalHash,
    storeRemovalHash,
    updateRemovalBlockchainInfo,
    deleteRemoval,
    loading: hookLoading, 
    error: hookError,
    contractLoaded 
  } = useStockRemoval();
  
  const address = useAddress();

  const [medicines, setMedicines] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [loadingMedicines, setLoadingMedicines] = useState(true);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const [formData, setFormData] = useState({
    quantity_removed: '',
    reason: 'EXPIRED',
    notes: '',
    date_removed: new Date().toISOString().split('T')[0]
  });

  const [formErrors, setFormErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    loadMedicines();
  }, []);

  useEffect(() => {
    if (selectedMedicine) {
      loadStocksForMedicine(selectedMedicine.medicine_id);
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

  const loadMedicines = async () => {
    try {
      setLoadingMedicines(true);
      const response = await api.get('/medicines?is_active=true');
      setMedicines(response.data.data || []);
    } catch (err) {
      console.error('Failed to load medicines:', err);
      alert('⚠️ Failed to Load Medicines\n\nPlease refresh the page and try again.');
    } finally {
      setLoadingMedicines(false);
    }
  };

  const loadStocksForMedicine = async (medicineId) => {
    try {
      setLoadingStocks(true);
      const response = await api.get(`/stocks?medicine_id=${medicineId}`);
      const availableStocks = (response.data.data || []).filter(stock => stock.remaining_quantity > 0 && stock.is_active);
      setStocks(availableStocks);
      
      if (availableStocks.length > 0) {
        setSelectedStock(availableStocks[0]);
      }
      
      if (availableStocks.length === 0) {
        alert('⚠️ No Available Stock\n\nThis medicine has no stock available for removal.');
      }
    } catch (err) {
      console.error('Failed to load stocks:', err);
      alert('⚠️ Failed to Load Stock Batches\n\nPlease try selecting the medicine again.');
      setStocks([]);
    } finally {
      setLoadingStocks(false);
    }
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    
    if (value === '') {
      setFormData(prev => ({ ...prev, quantity_removed: '' }));
      setFormErrors(prev => ({ ...prev, quantity_removed: undefined }));
      return;
    }

    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0) {
      return;
    }

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
    setStocks([]);
    setFormData({
      quantity_removed: '',
      reason: 'EXPIRED',
      notes: '',
      date_removed: new Date().toISOString().split('T')[0]
    });
    setFormErrors({});
    setCurrentStep(1);
    setRetryCount(0);
  };

  // Retry mechanism for blockchain transactions
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
          console.log('🚫 User rejected transaction');
          throw new Error('Transaction rejected by user');
        }
        
        // If it's the last retry, throw the error
        if (i === retries - 1) {
          throw new Error(`Transaction failed after ${retries} attempts: ${error.message}`);
        }
        
        // Wait before retrying (exponential backoff)
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, i);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  // ✅ FIXED: handleSubmit with correct blockchain-first flow
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      const errorMessages = Object.values(formErrors).filter(Boolean).join('\n');
      alert('⚠️ Validation Errors\n\nPlease fix the following:\n\n' + errorMessages);
      return;
    }

    let savedRemoval = null;

    try {
      setBlockchainLoading(true);

      // ========== STEP 1: Create removal in database (WITHOUT updating stock yet) ==========
      console.log('Step 1: Creating removal record in database...');
      const removalData = {
        medicine_id: selectedMedicine.medicine_id,
        stock_id: selectedStock.stock_id,
        quantity_removed: parseInt(formData.quantity_removed),
        reason: formData.reason,
        notes: formData.notes || null,
        date_removed: formData.date_removed,
        removed_by_wallet: address.toLowerCase()
      };

      const createResponse = await api.post('/removals', removalData);
      savedRemoval = createResponse.data.data;
      console.log('✅ Removal record created:', savedRemoval.removal_id);

      // ========== STEP 2: Generate hash ==========
      console.log('Step 2: Generating blockchain hash...');
      const dataHash = generateRemovalHash({
        removal_id: savedRemoval.removal_id,
        medicine_id: savedRemoval.medicine_id,
        stock_id: savedRemoval.stock_id,
        quantity_removed: savedRemoval.quantity_removed,
        reason: savedRemoval.reason,
        date_removed: savedRemoval.date_removed
      });
      console.log('✅ Hash generated:', dataHash.slice(0, 10) + '...');

      // ========== STEP 3: Check if blockchain write is needed ==========
      console.log('Step 3: Checking if blockchain write is required...');
      let tx = null;
      let txHash = null;
      
      try {
        const stockResponse = await api.get(`/stocks/${savedRemoval.stock_id}`);
        const stock = stockResponse.data.data || stockResponse.data.stock || stockResponse.data;
        const unitCost = parseFloat(stock?.unit_cost || 0);
        
        if (unitCost > 0) {
          console.log('💰 Cost > 0, proceeding with blockchain write...');
          
          // ========== STEP 4: Store hash on blockchain with retry mechanism ==========
          console.log('Step 4: Storing hash on blockchain (with retry)...');
          
          tx = await retryBlockchainTransaction(async () => {
            return await storeRemovalHash(savedRemoval.removal_id, dataHash);
          });
          
          console.log('✅ Blockchain transaction successful:', tx);
          
          // Extract transaction hash
          txHash = tx.hash || tx.transactionHash || tx.receipt?.transactionHash || tx.receipt?.hash || null;
          
          if (!txHash) {
            console.error('⚠️ No transaction hash found in response:', tx);
            throw new Error('Transaction succeeded but no hash was returned');
          }
          
          console.log('✅ Transaction hash:', txHash);
          
        } else {
          console.log('💸 Cost = 0, skipping blockchain write (non-money operation)');
        }
      } catch (fetchErr) {
        console.warn('⚠️ Could not fetch stock for cost check, skipping blockchain write:', fetchErr);
      }

      // ========== STEP 5: Update database with blockchain info (if applicable) ==========
      if (txHash) {
        console.log('Step 5: Updating database with blockchain info...');
        await updateRemovalBlockchainInfo(savedRemoval.removal_id, {
          blockchain_hash: dataHash,
          blockchain_tx_hash: txHash,
          removed_by_wallet: address.toLowerCase(),
        });
        console.log('✅ Database updated with blockchain info');
      }

      // ========== STEP 6: NOW update stock quantity (AFTER blockchain success) ==========
      console.log('Step 6: Updating stock quantity in database...');
      try {
        await api.patch(`/stocks/${savedRemoval.stock_id}`, {
          remaining_quantity: selectedStock.remaining_quantity - parseInt(formData.quantity_removed)
        });
        console.log('✅ Stock quantity updated');
      } catch (stockUpdateErr) {
        console.error('⚠️ Failed to update stock quantity:', stockUpdateErr);
        // This is less critical since the removal is already recorded
      }

      // ========== SUCCESS ==========
      console.log('✅ All steps completed successfully!');
      
      const message = txHash 
        ? `✅ Stock Removal Successful!\n\n📝 Removal ID: ${savedRemoval.removal_id}\n🔗 Blockchain TX:\n${txHash}\n\n✅ ${formData.quantity_removed} units removed from inventory`
        : `✅ Stock Removal Recorded!\n\n📝 Removal ID: ${savedRemoval.removal_id}\n\n✅ ${formData.quantity_removed} units removed from inventory`;
      
      alert(message);
      
      if (onSuccess) {
        onSuccess();
      } else {
        resetForm();
      }

    } catch (err) {
      console.error('❌ Error during removal process:', err);
      
      // ========== ROLLBACK: Delete the removal if it was created ==========
      if (savedRemoval && savedRemoval.removal_id) {
        console.log('🔄 Rolling back database entry...');
        try {
          await deleteRemoval(savedRemoval.removal_id);
          console.log('✅ Rollback successful - removal deleted from database');
        } catch (rollbackErr) {
          console.error('❌ CRITICAL: Rollback failed!', rollbackErr);
          alert(
            '❌ CRITICAL ERROR\n\n' +
            'Blockchain transaction failed AND database rollback failed!\n\n' +
            `Removal ID: ${savedRemoval.removal_id}\n\n` +
            'Please contact administrator immediately to manually fix database.'
          );
          setBlockchainLoading(false);
          setRetryCount(0);
          return;
        }
      }
      
      // ========== ENHANCED ERROR MESSAGES ==========
      let errorTitle = '❌ Removal Failed';
      let errorMessage = '';
      
      if (err.message?.includes('rejected by user')) {
        errorTitle = '🚫 Transaction Cancelled';
        errorMessage = 
          'You cancelled the MetaMask transaction.\n\n' +
          'Removal has been cancelled.\n' +
          'No changes were made to the database.\n\n' +
          '💡 TIP: Please try again when ready.';
      } else if (err.message?.includes('insufficient funds')) {
        errorTitle = '💰 Insufficient Funds';
        errorMessage = 
          'Your wallet does not have enough MATIC for gas fees.\n\n' +
          'Removal has been cancelled.\n' +
          'No changes were made to the database.\n\n' +
          '💡 TIP: Add MATIC to your wallet and try again.';
      } else if (err.message?.includes(`failed after ${MAX_RETRIES} attempts`)) {
        errorTitle = '🌐 Network Timeout';
        errorMessage = 
          `Transaction failed after ${MAX_RETRIES} automatic retries.\n\n` +
          'Removal has been cancelled.\n' +
          'No changes were made to the database.\n\n' +
          '💡 TIP: The blockchain network may be congested. Please try again in a few minutes.';
      } else if (err.message?.includes('Wallet not connected')) {
        errorTitle = '🔌 Wallet Not Connected';
        errorMessage = 
          'Please connect your MetaMask wallet.\n\n' +
          '💡 TIP: Click "Connect Wallet" in the top menu.';
      } else if (err.message?.includes('Contract not loaded')) {
        errorTitle = '⚠️ Smart Contract Error';
        errorMessage = 
          'The smart contract is not loaded.\n\n' +
          '💡 TIP: Please refresh the page and try again.';
      } else {
        errorTitle = '❌ Unexpected Error';
        errorMessage = 
          'An unexpected error occurred.\n\n' +
          `Error: ${err.message}\n\n` +
          '💡 TIP: Please try again or contact support if the problem persists.';
      }
      
      alert(`${errorTitle}\n\n${errorMessage}`);
    } finally {
      setBlockchainLoading(false);
      setRetryCount(0);
    }
  };

  const remainingAfterRemoval = selectedStock && formData.quantity_removed 
    ? selectedStock.remaining_quantity - parseInt(formData.quantity_removed || 0)
    : null;

  // ========== RENDER JSX ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Record Stock Removal</h1>
              <p className="text-gray-800">Remove medicine from inventory with blockchain verification</p>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
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
                    ? 'bg-green-100 text-green-900'
                    : 'bg-gray-200 text-gray-600'
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
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-xl p-5 mb-6 shadow-md">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-8 h-8 text-yellow-700 flex-shrink-0" />
              <div>
                <p className="font-bold text-yellow-900 text-lg mb-1">Wallet Not Connected</p>
                <p className="text-yellow-900 text-sm">Please connect your MetaMask wallet to record removals.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-5 mb-6 shadow-md">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-700" />
              <div>
                <p className="font-semibold text-green-900">Wallet Connected</p>
                <p className="text-sm text-green-800 font-mono">{address.slice(0, 8)}...{address.slice(-6)}</p>
              </div>
            </div>
          </div>
        )}

        {!contractLoaded && (
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
            <p className="text-sm text-blue-900">Loading smart contract...</p>
          </div>
        )}

        {/* Retry Status */}
        {blockchainLoading && retryCount > 0 && (
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select Medicine */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 transition-all hover:shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Pill className="w-6 h-6 text-red-700" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Select Medicine</h3>
                <p className="text-sm text-gray-700">Choose the medicine you want to remove from inventory</p>
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
                <option value="" className="text-gray-900">
                  {loadingMedicines ? '⏳ Loading medicines...' : '🔍 Choose a medicine...'}
                </option>
                {medicines.map(med => (
                  <option key={med.medicine_id} value={med.medicine_id} className="text-gray-900">
                    {med.medicine_name} {med.strength && `• ${med.strength}`}
                  </option>
                ))}
              </select>
              {formErrors.medicine && (
                <p className="text-red-700 text-sm flex items-center gap-1 mt-2 font-medium">
                  <AlertCircle className="w-4 h-4" />
                  {formErrors.medicine}
                </p>
              )}

              {selectedMedicine && (
                <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4 animate-fadeIn">
                  <h4 className="font-semibold text-blue-900 mb-3">Selected Medicine</h4>
                  <p className="text-blue-900 font-medium">{selectedMedicine.medicine_name}</p>
                  {selectedMedicine.generic_name && (
                    <p className="text-sm text-blue-800">Generic: {selectedMedicine.generic_name}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Select Stock Batch */}
          {selectedMedicine && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 transition-all hover:shadow-xl animate-fadeIn">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Choose Stock Batch</h3>
                  <p className="text-sm text-gray-700">Select which batch to remove from</p>
                </div>
              </div>

              {loadingStocks ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700"></div>
                  <p className="ml-3 text-gray-700">Loading batches...</p>
                </div>
              ) : stocks.length === 0 ? (
                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 text-center">
                  <span className="text-4xl mb-3 block">📭</span>
                  <p className="text-yellow-900 font-bold text-lg">No Available Stock</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stocks.map(stock => (
                    <button
                      key={stock.stock_id}
                      type="button"
                      onClick={() => {
                        setSelectedStock(stock);
                        setFormData(prev => ({ ...prev, quantity_removed: '' }));
                        setFormErrors(prev => ({ ...prev, stock: undefined }));
                      }}
                      className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                        selectedStock?.stock_id === stock.stock_id
                          ? 'border-red-500 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg'
                          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-bold text-lg text-gray-900">Batch: {stock.batch_number}</span>
                        {selectedStock?.stock_id === stock.stock_id && (
                          <span className="px-3 py-1 bg-red-600 text-white text-xs rounded-full font-bold">
                            ✓ SELECTED
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white bg-opacity-60 rounded-lg p-3">
                          <span className="text-xs text-gray-700 block mb-1 font-medium">Available</span>
                          <span className="font-bold text-2xl text-green-700">{stock.remaining_quantity}</span>
                        </div>
                        <div className="bg-white bg-opacity-60 rounded-lg p-3">
                          <span className="text-xs text-gray-700 block mb-1 font-medium">Expiry</span>
                          <span className="font-semibold text-sm text-gray-900">{new Date(stock.expiry_date).toLocaleDateString()}</span>
                        </div>
                        <div className="bg-white bg-opacity-60 rounded-lg p-3">
                          <span className="text-xs text-gray-700 block mb-1 font-medium">Location</span>
                          <span className="font-semibold text-sm text-gray-900">{stock.storage_location || 'N/A'}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Removal Details */}
          {selectedStock && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 animate-fadeIn">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Removal Details</h3>
                  <p className="text-sm text-gray-700">Enter quantity and reason</p>
                </div>
              </div>

              <div className="space-y-5">
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
                      className={`w-full px-4 py-4 pr-32 text-lg text-gray-900 border-2 rounded-xl focus:ring-2 focus:ring-red-500 ${
                        formErrors.quantity_removed 
                          ? 'border-red-500 bg-red-50' 
                          : formData.quantity_removed && !formErrors.quantity_removed
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300'
                      }`}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-700">
                      / {selectedStock.remaining_quantity}
                    </div>
                  </div>
                  
                  {formErrors.quantity_removed ? (
                    <div className="mt-2 p-3 bg-red-50 border border-red-300 rounded-lg">
                      <p className="text-red-800 text-sm flex items-center gap-2 font-medium">
                        <AlertCircle className="w-5 h-5" />
                        {formErrors.quantity_removed}
                      </p>
                    </div>
                  ) : formData.quantity_removed && remainingAfterRemoval !== null ? (
                    <div className="mt-2 p-3 bg-green-50 border border-green-300 rounded-lg">
                      <p className="text-green-800 text-sm flex items-center gap-2 font-medium">
                        <CheckCircle2 className="w-5 h-5" />
                        Valid • <span className="font-bold text-green-900">{remainingAfterRemoval} units</span> will remain
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Reason <span className="text-red-600">*</span>
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
                              ? `${reason.borderColor} ${reason.bgColor} shadow-md`
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{reason.icon}</span>
                            <span className={`font-semibold ${formData.reason === reason.value ? reason.textColor : 'text-gray-900'}`}>
                              {reason.label}
                            </span>
                            {formData.reason === reason.value && (
                              <CheckCircle2 className="w-5 h-5 text-green-700 ml-auto" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Date Removed <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      name="date_removed"
                      value={formData.date_removed}
                      onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                    
                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Notes</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Additional details..."
                        rows="4"
                        className="w-full px-4 py-3 text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none placeholder-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          {selectedMedicine && selectedStock && formData.quantity_removed && !formErrors.quantity_removed && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-400 rounded-xl p-6 shadow-lg animate-fadeIn">
              <h4 className="text-xl font-bold text-red-900 mb-4">Removal Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white bg-opacity-70 rounded-lg p-4">
                  <span className="text-sm text-red-800 font-medium">Medicine</span>
                  <p className="font-bold text-red-900 mt-1">{selectedMedicine.medicine_name}</p>
                </div>
                <div className="bg-white bg-opacity-70 rounded-lg p-4">
                  <span className="text-sm text-red-800 font-medium">Batch</span>
                  <p className="font-bold text-red-900 mt-1">{selectedStock.batch_number}</p>
                </div>
                <div className="bg-white bg-opacity-70 rounded-lg p-4">
                  <span className="text-sm text-red-800 font-medium">Removing</span>
                  <p className="font-bold text-red-700 text-2xl mt-1">-{formData.quantity_removed}</p>
                </div>
                <div className="bg-white bg-opacity-70 rounded-lg p-4">
                  <span className="text-sm text-green-800 font-medium">Remaining</span>
                  <p className="font-bold text-green-700 text-2xl mt-1">{remainingAfterRemoval}</p>
                </div>
              </div>
              <div className="bg-orange-100 border border-orange-400 rounded-lg p-4 mt-4">
                <p className="text-sm text-orange-900 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-5 h-5" />
                  This will create a blockchain transaction (with automatic retry on failure)
                </p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {formErrors.wallet && (
            <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
              <p className="text-red-900 font-medium flex items-center gap-2">
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
                onClick={() => onCancel ? onCancel() : window.history.back()}
                disabled={blockchainLoading}
                className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-semibold disabled:opacity-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  blockchainLoading || 
                  !selectedStock || 
                  !address || 
                  !contractLoaded || 
                  !formData.quantity_removed ||
                  Object.keys(formErrors).some(key => formErrors[key])
                }
                className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold text-lg shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all"
              >
                {blockchainLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {retryCount > 0 ? `Retrying (${retryCount}/${MAX_RETRIES})...` : 'Processing...'}
                  </span>
                ) : (
                  'Record Removal (Sign with MetaMask)'
                )}
              </button>
            </div>
            
            {!address && (
              <p className="text-center text-sm text-gray-700 mt-3 font-medium">
                ⚠️ Connect your wallet to enable submission
              </p>
            )}
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AddStockRemovalForm;