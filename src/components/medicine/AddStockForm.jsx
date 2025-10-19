import { useState, useEffect } from 'react';
import { Plus, Package, Calendar, DollarSign, Truck, MapPin, Hash, AlertCircle } from 'lucide-react';
import { useStockManagement } from '../../hooks/useStockManagement';
import { useAddress } from '@thirdweb-dev/react';
import api from '../../../api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loadingMedicines, setLoadingMedicines] = useState(true);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [blockchainLoading, setBlockchainLoading] = useState(false);

  const [formData, setFormData] = useState({
    medicine_id: '',
    stock_batch_id: '', // Changed to use existing batch
    quantity_to_add: '', // Renamed for clarity
    date_received: new Date().toISOString().split('T')[0]
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchMedicines();
  }, []);

  // Fetch batches when medicine is selected
  useEffect(() => {
    if (formData.medicine_id) {
      fetchBatches(formData.medicine_id);
    } else {
      setBatches([]);
      setFormData(prev => ({ ...prev, stock_batch_id: '' }));
    }
  }, [formData.medicine_id]);

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
      
      // Filter active batches and sort by expiry date
      const activeBatches = Array.isArray(stocksData) 
        ? stocksData
            .filter(stock => stock.is_active && stock.quantity > 0)
            .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
        : [];
      
      setBatches(activeBatches);
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError('Failed to load batches');
      setBatches([]);
    } finally {
      setLoadingBatches(false);
    }
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
    if (!formData.medicine_id) errors.medicine_id = 'Medicine is required';
    if (!formData.stock_batch_id) errors.stock_batch_id = 'Batch is required';
    if (!formData.quantity_to_add || formData.quantity_to_add <= 0) {
      errors.quantity_to_add = 'Valid quantity is required';
    }

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

    const selectedBatch = batches.find(b => b.stock_id === parseInt(formData.stock_batch_id));
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
          remaining_quantity: newRemainingQuantity, // Update both fields
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
      } else {
        console.log('Skipping blockchain write: non-money operation (unit_cost <= 0)');
      }
      
      console.log('Blockchain transaction successful:', tx);

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
            quantity_before: originalRemainingQuantity, // Use remaining_quantity for history
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
      alert('Stock added successfully!\n\n' + 
            `Medicine: ${selectedMedicine?.medicine_name}\n` +
            `Batch: ${selectedBatch.batch_number}\n` +
            `Quantity Added: ${quantityToAdd} units\n` +
            `New Total: ${newRemainingQuantity} units\n` +
            `Transaction Hash: ${txHash}`);
      
      if (onSuccess) {
        onSuccess();
      } else {
        setFormData({
          medicine_id: '',
          stock_batch_id: '',
          quantity_to_add: '',
          date_received: new Date().toISOString().split('T')[0]
        });
        setBatches([]);
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
          alert('Critical Error: Failed to rollback. Please contact administrator.');
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
      alert(`Error: ${errorMessage}`);
    } finally {
      setBlockchainLoading(false);
      setLoading(false);
    }
  };

  const selectedMedicine = medicines.find(m => m.medicine_id === parseInt(formData.medicine_id));
  const selectedBatch = batches.find(b => b.stock_id === parseInt(formData.stock_batch_id));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Stock to Existing Batch</h1>
          <p className="text-gray-600">Increase quantities for existing medicine batches</p>
        </div>

        {/* Wallet Status */}
        {!address ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">⚠️ Wallet Not Connected</p>
                <p className="text-sm">Please connect your MetaMask wallet to add stock</p>
              </div>
            </div>
          </div>
        ) : (
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

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">✓ Stock added successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {(error || hookError) && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">✗ {error || hookError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Medicine & Batch Selection */}
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
                  required
                  disabled={loadingMedicines}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">
                    {loadingMedicines ? 'Loading medicines...' : 'Select a medicine...'}
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
                  name="stock_batch_id"
                  value={formData.stock_batch_id}
                  onChange={handleChange}
                  required
                  disabled={!formData.medicine_id || loadingBatches || batches.length === 0}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">
                    {!formData.medicine_id 
                      ? 'Select a medicine first...' 
                      : loadingBatches 
                        ? 'Loading batches...'
                        : batches.length === 0
                          ? 'No active batches available'
                          : 'Select a batch...'}
                  </option>
                  {batches.map(batch => (
                    <option key={batch.stock_id} value={batch.stock_id}>
                      Batch: {batch.batch_number} - Total: {batch.quantity} units | Remaining: {batch.remaining_quantity} units (Exp: {new Date(batch.expiry_date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                {formErrors.stock_batch_id && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.stock_batch_id}</p>
                )}
              </div>
            </div>

            {selectedMedicine && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {selectedMedicine.medicine_type || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Dosage:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {selectedMedicine.dosage_form || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Manufacturer:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {selectedMedicine.manufacturer || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedBatch && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-purple-900 mb-2">Selected Batch Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-purple-800">
                  <div><span className="font-medium">Batch Number:</span> {selectedBatch.batch_number}</div>
                  <div><span className="font-medium">Current Quantity:</span> {selectedBatch.quantity} units</div>
                  <div><span className="font-medium">Expiry Date:</span> {new Date(selectedBatch.expiry_date).toLocaleDateString()}</div>
                  <div><span className="font-medium">Storage:</span> {selectedBatch.storage_location || 'N/A'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Stock Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Addition Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="w-4 h-4 inline mr-1" />
                  Quantity to Add <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="quantity_to_add"
                  value={formData.quantity_to_add}
                  onChange={handleChange}
                  placeholder="0"
                  min="1"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                {formErrors.quantity_to_add && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.quantity_to_add}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date Received
                </label>
                <input
                  type="date"
                  name="date_received"
                  value={formData.date_received}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Stock Addition Summary */}
          {selectedMedicine && selectedBatch && formData.quantity_to_add && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Addition Summary</h4>
              <div className="text-sm text-green-800 space-y-1">
                <p>
                  <span className="font-medium">Medicine:</span> {selectedMedicine.medicine_name}
                </p>
                <p>
                  <span className="font-medium">Batch:</span> {selectedBatch.batch_number}
                </p>
                <p>
                  <span className="font-medium">Current Stock:</span> {selectedBatch.quantity} units
                </p>
                <p>
                  <span className="font-medium">Adding:</span> {formData.quantity_to_add} units
                </p>
                <p>
                  <span className="font-medium">New Total:</span> {selectedBatch.quantity + parseInt(formData.quantity_to_add || 0)} units
                </p>
                <p className="text-xs text-green-600 mt-2">
                  ⚠️ This will create a blockchain transaction requiring MetaMask confirmation.
                </p>
              </div>
            </div>
          )}

          {formErrors.wallet && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {formErrors.wallet}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <button
              type="submit"
              disabled={loading || blockchainLoading || !address || !contractLoaded}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {blockchainLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing Blockchain Transaction...
                </>
              ) : loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add Stock (Sign with MetaMask)
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={onCancel || (() => window.history.back())}
              disabled={loading || blockchainLoading}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}