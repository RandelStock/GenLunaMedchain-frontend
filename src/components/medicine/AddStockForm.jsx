import { useState, useEffect } from 'react';
import { Plus, Package, AlertCircle, CheckCircle2, Layers } from 'lucide-react';
import { useStockManagement } from '../../hooks/useStockManagement';
import { useMedicineInventory } from '../../hooks/useMedicineData';
import { useAddress } from '@thirdweb-dev/react';
import { useRole } from '../auth/RoleProvider';
import api from '../../../api';
import BatchEntryRow from './BatchEntryRow'; // ✅ FIXED: Correct import path
import AddNewMedicineModal from './AddNewMedicineModal'; // ✅ FIXED: Correct import path

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds

export default function AddStockForm({ onSuccess, onCancel }) {
  const {
    generateStockHash,
    storeStockHash,
    updateStockBlockchainInfo,
    contractLoaded: stockContractLoaded
  } = useStockManagement();

  const {
    storeMedicineHash,
    generateMedicineHash,
    contractLoaded: medicineContractLoaded
  } = useMedicineInventory();

  const { userRole, userProfile } = useRole?.() || {};
  const address = useAddress();

  // State
  const [mode, setMode] = useState('single'); // 'single' or 'bulk'
  const [medicines, setMedicines] = useState([]);
  const [loadingMedicines, setLoadingMedicines] = useState(true);
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Modal state
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [currentRowIndex, setCurrentRowIndex] = useState(null);

  // Batch entries for bulk mode
  const [batchEntries, setBatchEntries] = useState([{
    medicine_id: '',
    batch_number: '',
    quantity: '',
    expiry_date: '',
    supplier_name: '',
    date_received: new Date().toISOString().split('T')[0]
  }]);

  const [batchErrors, setBatchErrors] = useState([{}]);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoadingMedicines(true);
      const response = await api.get('/medicines?is_active=true');
      const medicinesData = response.data.data || response.data;
      setMedicines(Array.isArray(medicinesData) ? medicinesData.filter(med => med.is_active) : []);
    } catch (err) {
      console.error('Error fetching medicines:', err);
      setError('Failed to load medicines. Please refresh the page.');
    } finally {
      setLoadingMedicines(false);
    }
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

  // Add new batch entry row
  const addBatchEntry = () => {
    if (batchEntries.length >= 20) {
      alert('⚠️ Maximum 20 entries allowed at once.\n\nPlease submit current entries first.');
      return;
    }
    
    setBatchEntries([...batchEntries, {
      medicine_id: '',
      batch_number: '',
      quantity: '',
      expiry_date: '',
      supplier_name: '',
      date_received: new Date().toISOString().split('T')[0]
    }]);
    setBatchErrors([...batchErrors, {}]);
  };

  // Remove batch entry row
  const removeBatchEntry = (index) => {
    if (batchEntries.length === 1) {
      alert('⚠️ Cannot remove the last entry.\n\nAt least one entry is required.');
      return;
    }
    setBatchEntries(batchEntries.filter((_, i) => i !== index));
    setBatchErrors(batchErrors.filter((_, i) => i !== index));
  };

  // Duplicate batch entry row
  const duplicateBatchEntry = (index) => {
    if (batchEntries.length >= 20) {
      alert('⚠️ Maximum 20 entries allowed at once.\n\nPlease submit current entries first.');
      return;
    }
    
    const entryToDuplicate = { ...batchEntries[index] };
    setBatchEntries([...batchEntries, entryToDuplicate]);
    setBatchErrors([...batchErrors, {}]);
  };

  // Update batch entry
  const updateBatchEntry = (index, data) => {
    const newEntries = [...batchEntries];
    newEntries[index] = data;
    setBatchEntries(newEntries);
  };

  // Open "Add New Medicine" modal
  const handleAddNewMedicine = (rowIndex) => {
    setCurrentRowIndex(rowIndex);
    setShowMedicineModal(true);
  };

  // ✅ FIXED: Handle new medicine submission from modal (modal handles blockchain internally)
  const handleMedicineSubmit = async (medicineData) => {
    try {
      console.log('Medicine added successfully:', medicineData);
      
      // Refresh medicines list
      await fetchMedicines();

      // If modal was opened from a row, auto-select the new medicine
      if (currentRowIndex !== null) {
        const newEntries = [...batchEntries];
        newEntries[currentRowIndex] = {
          ...newEntries[currentRowIndex],
          medicine_id: medicineData.medicine_id
        };
        setBatchEntries(newEntries);
      }

      setShowMedicineModal(false);
      setCurrentRowIndex(null);
      
      // Success message with blockchain info
      const successMsg = medicineData.txHash
        ? `✅ Medicine "${medicineData.medicine_name}" added successfully!\n\n🔗 Blockchain TX: ${medicineData.txHash.slice(0, 10)}...${medicineData.txHash.slice(-8)}\n\nYou can now select it in the form.`
        : `✅ Medicine "${medicineData.medicine_name}" added successfully!\n\nYou can now select it in the form.`;
      
      alert(successMsg);

    } catch (err) {
      console.error('Error in medicine submission callback:', err);
      setError(`Medicine submission error: ${err.message}`);
    }
  };

  // Validate batch entries
  const validateBatchEntries = () => {
    const errors = batchEntries.map(entry => {
      const rowErrors = {};
      
      if (!entry.medicine_id) {
        rowErrors.medicine_id = 'Medicine is required';
      }
      if (!entry.batch_number || entry.batch_number.trim().length < 3) {
        rowErrors.batch_number = 'Valid batch number is required (min 3 characters)';
      }
      if (!entry.quantity || parseInt(entry.quantity) < 1) {
        rowErrors.quantity = 'Quantity must be at least 1';
      }
      if (!entry.expiry_date) {
        rowErrors.expiry_date = 'Expiry date is required';
      } else {
        const expiry = new Date(entry.expiry_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (expiry <= today) {
          rowErrors.expiry_date = 'Expiry date must be in the future';
        }
      }
      if (!entry.supplier_name) {
        rowErrors.supplier_name = 'Supplier is required';
      }

      return rowErrors;
    });

    setBatchErrors(errors);
    return errors.every(rowError => Object.keys(rowError).length === 0);
  };

  // Process single stock addition with blockchain
  const processSingleStockAddition = async (entry, medicine) => {
    try {
      // Check if batch exists
      const stocksResponse = await api.get(`/stocks?medicine_id=${entry.medicine_id}`);
      const existingStocks = stocksResponse.data.data || [];
      const existingBatch = existingStocks.find(
        s => s.batch_number === entry.batch_number && s.is_active
      );

      if (existingBatch) {
        // Add to existing batch
        const originalQuantity = existingBatch.quantity;
        const originalRemainingQuantity = existingBatch.remaining_quantity;
        const quantityToAdd = parseInt(entry.quantity);
        const newQuantity = originalQuantity + quantityToAdd;
        const newRemainingQuantity = originalRemainingQuantity + quantityToAdd;

        const updateResponse = await api.patch(`/stocks/${existingBatch.stock_id}`, {
          quantity: newQuantity,
          remaining_quantity: newRemainingQuantity,
          date_received: entry.date_received
        });

        const updatedStock = updateResponse.data.stock || updateResponse.data.data || updateResponse.data;

        // Generate hash
        const dataHash = generateStockHash({
          stock_id: updatedStock.stock_id,
          medicine_id: updatedStock.medicine_id,
          batch_number: updatedStock.batch_number,
          quantity: updatedStock.quantity,
          expiry_date: updatedStock.expiry_date
        });

        // Store hash on blockchain with retry
        let tx = null;
        const unitCost = parseFloat(existingBatch.unit_cost || 0);
        
        if (unitCost > 0) {
          tx = await retryBlockchainTransaction(async () => {
            return await storeStockHash(updatedStock.stock_id, dataHash);
          });
        }

        const txHash = tx ? (tx.hash || tx.transactionHash || tx.receipt?.transactionHash) : null;

        if (txHash) {
          await updateStockBlockchainInfo(updatedStock.stock_id, {
            blockchain_hash: dataHash,
            blockchain_tx_hash: txHash,
            added_by_wallet: address.toLowerCase()
          });
        }

        // Create transaction history
        try {
          await api.post('/stock-transactions', {
            stock_id: updatedStock.stock_id,
            transaction_type: 'ADDITION',
            quantity_changed: quantityToAdd,
            quantity_before: originalRemainingQuantity,
            quantity_after: newRemainingQuantity,
            transaction_date: entry.date_received,
            performed_by_wallet: address.toLowerCase(),
            blockchain_tx_hash: txHash || null,
            notes: `Added ${quantityToAdd} units to batch ${entry.batch_number}`
          });
        } catch (historyErr) {
          console.error('Failed to create transaction history:', historyErr);
        }

        return {
          success: true,
          message: `Added ${quantityToAdd} units to existing batch ${entry.batch_number}`,
          txHash,
          medicine: medicine.medicine_name,
          batch: entry.batch_number,
          quantity: quantityToAdd,
          newTotal: newRemainingQuantity
        };

      } else {
        // Create new batch (create new stock record)
        const stockData = {
          medicine_id: entry.medicine_id,
          batch_number: entry.batch_number,
          quantity: parseInt(entry.quantity),
          remaining_quantity: parseInt(entry.quantity),
          expiry_date: entry.expiry_date,
          supplier_name: entry.supplier_name,
          date_received: entry.date_received,
          storage_location: medicine.storage_location || 'MUNICIPAL',
          unit_cost: 0, // Free for RHU
          is_active: true
        };

        const createResponse = await api.post('/stocks', stockData);
        const newStock = createResponse.data.stock || createResponse.data.data || createResponse.data;

        // Generate hash
        const dataHash = generateStockHash({
          stock_id: newStock.stock_id,
          medicine_id: newStock.medicine_id,
          batch_number: newStock.batch_number,
          quantity: newStock.quantity,
          expiry_date: newStock.expiry_date
        });

        // Store hash on blockchain with retry
        let tx = null;
        tx = await retryBlockchainTransaction(async () => {
          return await storeStockHash(newStock.stock_id, dataHash);
        });

        const txHash = tx ? (tx.hash || tx.transactionHash || tx.receipt?.transactionHash) : null;

        if (txHash) {
          await updateStockBlockchainInfo(newStock.stock_id, {
            blockchain_hash: dataHash,
            blockchain_tx_hash: txHash,
            added_by_wallet: address.toLowerCase()
          });
        }

        return {
          success: true,
          message: `Created new batch ${entry.batch_number}`,
          txHash,
          medicine: medicine.medicine_name,
          batch: entry.batch_number,
          quantity: parseInt(entry.quantity),
          newTotal: parseInt(entry.quantity)
        };
      }
    } catch (err) {
      console.error('Error processing stock addition:', err);
      throw err;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!address) {
      setError('Please connect your MetaMask wallet');
      alert('⚠️ Wallet Required\n\nPlease connect your MetaMask wallet to continue.');
      return;
    }

    if (!stockContractLoaded) {
      setError('Stock contract not loaded. Please refresh and try again.');
      alert('⚠️ Contract Not Loaded\n\nPlease refresh the page and try again.');
      return;
    }

    if (!validateBatchEntries()) {
      setError('Please fix all validation errors before submitting.');
      alert('⚠️ Validation Errors\n\nPlease fix all highlighted errors before submitting.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setBlockchainLoading(true);
      setError('');
      
      const results = [];
      let successCount = 0;
      let failCount = 0;

      // Process each batch entry
      for (let i = 0; i < batchEntries.length; i++) {
        const entry = batchEntries[i];
        const medicine = medicines.find(m => m.medicine_id === parseInt(entry.medicine_id));
        
        try {
          const result = await processSingleStockAddition(entry, medicine);
          results.push(result);
          successCount++;
        } catch (err) {
          console.error(`Failed to process entry ${i + 1}:`, err);
          failCount++;
          
          // ✅ ENHANCED: Better error messages
          let errorMsg = err.message;
          if (err.message.includes('rejected by user')) {
            errorMsg = 'User cancelled transaction';
          } else if (err.message.includes('insufficient funds')) {
            errorMsg = 'Insufficient MATIC for gas fees';
          } else if (err.message.includes(`failed after ${MAX_RETRIES} attempts`)) {
            errorMsg = `Network timeout (${MAX_RETRIES} retries failed)`;
          }
          
          results.push({
            success: false,
            message: errorMsg,
            medicine: medicine?.medicine_name || 'Unknown',
            batch: entry.batch_number
          });
        }
      }

      // Show summary
      const successMessage = results
        .filter(r => r.success)
        .map(r => `✅ ${r.medicine} - Batch ${r.batch}: +${r.quantity} units (Total: ${r.newTotal})`)
        .join('\n');

      const failMessage = results
        .filter(r => !r.success)
        .map(r => `❌ ${r.medicine} - Batch ${r.batch}: ${r.message}`)
        .join('\n');

      const summary = `
📦 Restock Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Successful: ${successCount}
${failCount > 0 ? `❌ Failed: ${failCount}` : ''}

${successMessage}
${failMessage ? `\n${failMessage}` : ''}
      `.trim();

      alert(summary);

      if (successCount > 0) {
        setSuccess(true);
        
        if (onSuccess) {
          onSuccess();
        } else {
          // Reset form
          setBatchEntries([{
            medicine_id: '',
            batch_number: '',
            quantity: '',
            expiry_date: '',
            supplier_name: '',
            date_received: new Date().toISOString().split('T')[0]
          }]);
          setBatchErrors([{}]);
        }

        setTimeout(() => setSuccess(false), 3000);
      }

      if (failCount === batchEntries.length) {
        setError('All entries failed. Please check the errors and try again.');
      }

    } catch (err) {
      console.error('Error during restock:', err);
      
      // ✅ ENHANCED: Better error messages
      let errorMessage = err.message;
      if (err.message.includes('rejected by user')) {
        errorMessage = 'Transaction was rejected in MetaMask. Restock has been cancelled.';
      } else if (err.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient MATIC for gas fees. Please add MATIC to your wallet.';
      } else if (err.message.includes(`failed after ${MAX_RETRIES} attempts`)) {
        errorMessage = `Network congestion - transaction failed after ${MAX_RETRIES} automatic retries. Please try again in a few minutes.`;
      }
      
      setError(errorMessage);
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setBlockchainLoading(false);
      setRetryCount(0);
    }
  };

  const contractLoaded = stockContractLoaded && medicineContractLoaded;

  // RENDER - ✅ ALL TEXT DARK (text-gray-900, text-gray-800, text-gray-700)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                🏥 Restock Medicines
              </h1>
              <p className="text-gray-800">Add medicines to inventory or increase existing stock quantities</p>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                disabled={blockchainLoading}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
                title="Cancel and go back"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Mode Toggle */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-900">Entry Mode:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('single')}
                  disabled={blockchainLoading}
                  className={`px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 ${
                    mode === 'single'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Package className="w-4 h-4 inline mr-2" />
                  Single Entry
                </button>
                <button
                  type="button"
                  onClick={() => setMode('bulk')}
                  disabled={blockchainLoading}
                  className={`px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 ${
                    mode === 'bulk'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Layers className="w-4 h-4 inline mr-2" />
                  Bulk Entry ({batchEntries.length})
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-700 mt-2">
              {mode === 'single' 
                ? '📦 Add one medicine at a time' 
                : '📚 Add multiple medicines in one submission (up to 20 entries)'}
            </p>
          </div>
        </div>

        {/* Wallet Status */}
        {!address ? (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-xl p-5 mb-6 shadow-md">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-8 h-8 text-yellow-700 flex-shrink-0" />
              <div>
                <p className="font-bold text-yellow-900 text-lg mb-1">Wallet Not Connected</p>
                <p className="text-yellow-800 text-sm">Please connect your MetaMask wallet to restock medicines.</p>
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
            <p className="text-sm text-blue-900">Loading smart contracts...</p>
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

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl shadow-lg animate-fadeIn">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-700" />
              <p className="text-green-900 font-bold text-lg">Restock completed successfully!</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-5 bg-red-50 border-2 border-red-400 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-700" />
              <p className="text-red-900 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Batch Entry Rows */}
          <div className="space-y-4">
            {batchEntries.map((entry, index) => (
              <BatchEntryRow
                key={index}
                index={index}
                data={entry}
                medicines={medicines}
                onUpdate={updateBatchEntry}
                onRemove={removeBatchEntry}
                onDuplicate={duplicateBatchEntry}
                onAddNewMedicine={handleAddNewMedicine}
                canRemove={batchEntries.length > 1}
                errors={batchErrors[index] || {}}
                showBlockchainIndicator={true}
              />
            ))}
          </div>

          {/* Add More Button (Bulk Mode) */}
          {mode === 'bulk' && batchEntries.length < 20 && (
            <button
              type="button"
              onClick={addBatchEntry}
              disabled={blockchainLoading}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
            >
              <Plus className="w-6 h-6" />
              Add Another Medicine Entry
            </button>
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
                disabled={blockchainLoading}
                className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={
                  blockchainLoading || 
                  !address || 
                  !contractLoaded ||
                  batchEntries.length === 0
                }
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all"
              >
                {blockchainLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {retryCount > 0 ? `Retrying (${retryCount}/${MAX_RETRIES})...` : `Processing ${batchEntries.length} ${batchEntries.length === 1 ? 'entry' : 'entries'}...`}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Package className="w-6 h-6" />
                    Restock {batchEntries.length} {batchEntries.length === 1 ? 'Medicine' : 'Medicines'} (Sign with MetaMask)
                  </span>
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

        {/* Info Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 mt-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3">💡 How Restocking Works</h3>
          <ul className="space-y-2 text-sm text-blue-900">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <span>Select an existing medicine OR click <span className="font-bold">"+ New Medicine"</span> to add a new one (with blockchain verification)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <span>If the batch exists, quantity will be added to it. If not, a new batch is created</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              <span>Each entry is recorded on the blockchain with automatic retry (up to 3 attempts)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">4.</span>
              <span>Use <span className="font-bold">Bulk Mode</span> to add up to 20 medicines at once</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Add New Medicine Modal */}
      <AddNewMedicineModal
        isOpen={showMedicineModal}
        onClose={() => {
          setShowMedicineModal(false);
          setCurrentRowIndex(null);
        }}
        onSubmit={handleMedicineSubmit}
      />

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