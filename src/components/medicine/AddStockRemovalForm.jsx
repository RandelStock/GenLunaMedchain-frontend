import { useState, useEffect } from 'react';
import { useStockRemoval } from '../../hooks/useStockRemoval';
import { useAddress } from '@thirdweb-dev/react';
import api from '../../../api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const REMOVAL_REASONS = [
  { value: 'EXPIRED', label: 'Expired', icon: '⏰', color: 'red' },
  { value: 'ENTRY_ERROR', label: 'Entry Error', icon: '✏️', color: 'orange' },
  { value: 'DAMAGED', label: 'Damaged', icon: '💔', color: 'yellow' },
  { value: 'LOST', label: 'Lost', icon: '🔍', color: 'gray' },
  { value: 'OTHER', label: 'Other', icon: '📋', color: 'blue' }
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
  const [selectedStock, setSelectedStock] = useState(null);
  const [loadingMedicines, setLoadingMedicines] = useState(true);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [blockchainLoading, setBlockchainLoading] = useState(false);

  const [formData, setFormData] = useState({
    medicine_id: '',
    stock_id: '',
    quantity_removed: '',
    reason: 'EXPIRED',
    notes: '',
    date_removed: new Date().toISOString().split('T')[0]
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadMedicines();
  }, []);

  useEffect(() => {
    if (formData.medicine_id) {
      loadStocks(formData.medicine_id);
    } else {
      setAvailableStocks([]);
      setSelectedStock(null);
    }
  }, [formData.medicine_id]);

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
      
      if (activeStocks.length === 0) {
        alert('No available stock for this medicine');
      }
    } catch (err) {
      console.error('Failed to load stocks:', err);
      alert('Error loading stocks: ' + err.message);
      setAvailableStocks([]);
    } finally {
      setLoadingStocks(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }

    if (name === 'stock_id') {
      const stock = availableStocks.find(s => s.stock_id === parseInt(value));
      setSelectedStock(stock);
      setFormData(prev => ({ ...prev, quantity_removed: '' }));
    }

    if (name === 'medicine_id') {
      setFormData(prev => ({ 
        ...prev, 
        stock_id: '', 
        quantity_removed: '' 
      }));
      setSelectedStock(null);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!address) {
      errors.wallet = 'Please connect your MetaMask wallet';
    }
    if (!formData.medicine_id) errors.medicine_id = 'Medicine is required';
    if (!formData.stock_id) errors.stock_id = 'Stock batch is required';
    if (!formData.quantity_removed || formData.quantity_removed <= 0) {
      errors.quantity_removed = 'Valid quantity is required';
    }
    if (selectedStock && formData.quantity_removed > selectedStock.remaining_quantity) {
      errors.quantity_removed = `Cannot exceed available quantity (${selectedStock.remaining_quantity})`;
    }
    if (!formData.reason) errors.reason = 'Reason is required';
    if (!formData.date_removed) errors.date_removed = 'Date is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const errorMessages = Object.values(formErrors).join('\n');
      alert('Please fix the following errors:\n\n' + errorMessages);
      return;
    }

    let savedRemoval = null;

    try {
      setBlockchainLoading(true);

      // Step 1: Create removal in database first (to get removal_id)
      console.log('Step 1: Creating removal in database...');
      savedRemoval = await createRemoval({
        ...formData,
        medicine_id: parseInt(formData.medicine_id),
        stock_id: parseInt(formData.stock_id),
        quantity_removed: parseInt(formData.quantity_removed),
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
        } else {
          console.log('Skipping blockchain write: non-money operation (unit_cost <= 0)');
        }
      } catch (fetchErr) {
        console.warn('Could not fetch stock for cost check, skipping blockchain write:', fetchErr);
      }
      
      console.log('Blockchain transaction successful:', tx);

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
        alert('Stock removal recorded successfully!\n\nTransaction Hash: ' + txHash);
      } else {
        alert('Stock removal recorded successfully!');
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        // Reset form
        setFormData({
          medicine_id: '',
          stock_id: '',
          quantity_removed: '',
          reason: 'EXPIRED',
          notes: '',
          date_removed: new Date().toISOString().split('T')[0]
        });
        setSelectedStock(null);
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
          alert('Critical Error: Failed to rollback database changes. Please contact administrator.');
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
      
      alert(`Error: ${errorMessage}`);
    } finally {
      setBlockchainLoading(false);
    }
  };

  const selectedReason = REMOVAL_REASONS.find(r => r.value === formData.reason);
  const selectedMedicine = medicines.find(m => m.medicine_id === parseInt(formData.medicine_id));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Record Stock Removal</h1>
          <p className="text-gray-600">Remove medicine from inventory (expired, damaged, or other reasons)</p>
        </div>

        {!address && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
            <p className="font-medium">⚠️ Wallet Not Connected</p>
            <p className="text-sm">Please connect your MetaMask wallet to record removals on the blockchain.</p>
          </div>
        )}

        {address && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
            <p className="text-sm">
              ✅ Connected: <span className="font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
            </p>
          </div>
        )}

        {!contractLoaded && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-4">
            <p className="text-sm">Loading smart contract...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Select Medicine & Batch
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medicine <span className="text-red-500">*</span>
                </label>
                <select
                  name="medicine_id"
                  value={formData.medicine_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  disabled={loadingMedicines}
                  required
                >
                  <option value="">
                    {loadingMedicines ? 'Loading medicines...' : 'Select Medicine'}
                  </option>
                  {medicines.map(med => (
                    <option key={med.medicine_id} value={med.medicine_id}>
                      {med.medicine_name} {med.strength && `(${med.strength})`}
                    </option>
                  ))}
                </select>
                {formErrors.medicine_id && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.medicine_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Batch <span className="text-red-500">*</span>
                </label>
                <select
                  name="stock_id"
                  value={formData.stock_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  disabled={!formData.medicine_id || loadingStocks}
                  required
                >
                  <option value="">
                    {loadingStocks ? 'Loading batches...' : 'Select Batch'}
                  </option>
                  {availableStocks.map(stock => (
                    <option key={stock.stock_id} value={stock.stock_id}>
                      Batch: {stock.batch_number} - Available: {stock.remaining_quantity} units
                      {stock.expiry_date && ` (Exp: ${new Date(stock.expiry_date).toLocaleDateString()})`}
                    </option>
                  ))}
                </select>
                {formErrors.stock_id && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.stock_id}</p>
                )}
                {formData.medicine_id && !loadingStocks && availableStocks.length === 0 && (
                  <p className="text-yellow-600 text-xs mt-1">No stock available for this medicine</p>
                )}
              </div>
            </div>

            {selectedStock && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Available:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {selectedStock.remaining_quantity} units
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Expires:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {new Date(selectedStock.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {selectedStock.storage_location || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Removal Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity to Remove <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="quantity_removed"
                  value={formData.quantity_removed}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  min="1"
                  max={selectedStock?.remaining_quantity || 999999}
                  placeholder="Enter quantity"
                  disabled={!selectedStock}
                  required
                />
                {formErrors.quantity_removed && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.quantity_removed}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <select
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                >
                  {REMOVAL_REASONS.map(reason => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Removed <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date_removed"
                  value={formData.date_removed}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                rows="4"
                placeholder="Additional details about the removal..."
              />
            </div>
          </div>

          {selectedMedicine && formData.quantity_removed && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2">Removal Summary</h4>
              <div className="text-sm text-orange-800 space-y-1">
                <p>
                  <span className="font-medium">Medicine:</span> {selectedMedicine.medicine_name}
                </p>
                <p>
                  <span className="font-medium">Action:</span> Removing {formData.quantity_removed} units
                </p>
                <p>
                  <span className="font-medium">Reason:</span> {selectedReason?.label}
                </p>
                <p className="text-xs text-orange-600 mt-2">
                  ⚠️ This will create a blockchain transaction requiring MetaMask confirmation.
                </p>
              </div>
            </div>
          )}

          {(error || formErrors.wallet) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {formErrors.wallet || error}
            </div>
          )}

          <div className="flex gap-3 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <button
              type="submit"
              disabled={loading || blockchainLoading || !selectedStock || !address || !contractLoaded}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {blockchainLoading ? 'Processing Blockchain Transaction...' : 
               loading ? 'Saving...' : 
               'Record Removal (Sign with MetaMask)'}
            </button>
            <button
              type="button"
              onClick={onCancel || (() => window.history.back())}
              disabled={loading || blockchainLoading}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStockRemovalForm;