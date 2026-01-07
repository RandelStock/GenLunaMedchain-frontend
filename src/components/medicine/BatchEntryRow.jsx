import React, { useState, useEffect } from 'react';
import { Trash2, Copy, Plus, AlertCircle, Package, Shield, CheckCircle } from 'lucide-react';
import api from '../../../api';

const SUPPLIERS = [
  'Good Shepherd Pharmacy', 'B.R. Galang Drugstore',
  'Sam\'s Pharmacy & Grocery', 'Peninsula Pharmacy (branch)',
  'Valuemed Generics', 'Medicament Pharma and Medical Supplies Distribution',
  'Carlos Superdrug', 'South Star Drug', 'Mercury Drug'
];

/**
 * BatchEntryRow - Single row component for batch entry WITH BLOCKCHAIN SUPPORT
 * Enhanced with dark text visibility and interactive error handling
 */
export default function BatchEntryRow({
  index,
  data,
  medicines,
  onUpdate,
  onRemove,
  onDuplicate,
  onAddNewMedicine,
  canRemove = true,
  errors = {},
  showBlockchainIndicator = true
}) {
  const [localData, setLocalData] = useState(data);
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [selectedBatchInfo, setSelectedBatchInfo] = useState(null);
  const [isNewBatch, setIsNewBatch] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});

  // Get minimum expiry date (tomorrow)
  const getMinExpiryDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Update local data when prop changes
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  // Load batches when medicine changes
  useEffect(() => {
    if (localData.medicine_id) {
      const medicine = medicines.find(m => m.medicine_id === parseInt(localData.medicine_id));
      setSelectedMedicine(medicine);
      loadBatches(localData.medicine_id);
    } else {
      setSelectedMedicine(null);
      setBatches([]);
      setSelectedBatchInfo(null);
      setIsNewBatch(false);
    }
  }, [localData.medicine_id, medicines]);

  // Check if batch is new or existing
  useEffect(() => {
    if (localData.batch_number && batches.length > 0) {
      const existingBatch = batches.find(b => b.batch_number === localData.batch_number);
      setSelectedBatchInfo(existingBatch || null);
      setIsNewBatch(!existingBatch);
    } else if (localData.batch_number) {
      setIsNewBatch(true);
      setSelectedBatchInfo(null);
    } else {
      setIsNewBatch(false);
      setSelectedBatchInfo(null);
    }
  }, [localData.batch_number, batches]);

  const loadBatches = async (medicineId) => {
    try {
      setLoadingBatches(true);
      const response = await api.get(`/stocks?medicine_id=${medicineId}&is_active=true`);
      const stocksData = response.data.data || [];
      
      const activeBatches = Array.isArray(stocksData) 
        ? stocksData
            .filter(stock => stock.is_active && stock.quantity > 0)
            .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
        : [];
      
      setBatches(activeBatches);
    } catch (err) {
      console.error('Error fetching batches:', err);
      setBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleChange = (field, value) => {
    const updatedData = { ...localData, [field]: value };
    setLocalData(updatedData);
    onUpdate(index, updatedData);
    setTouchedFields({ ...touchedFields, [field]: true });
  };

  const handleMedicineChange = (medicineId) => {
    const updatedData = {
      ...localData,
      medicine_id: medicineId,
      batch_number: '',
      quantity: '',
      expiry_date: '',
      supplier_name: '',
      date_received: new Date().toISOString().split('T')[0]
    };
    setLocalData(updatedData);
    onUpdate(index, updatedData);
    setTouchedFields({ ...touchedFields, medicine_id: true });
  };

  const handleBatchSelect = (batchNumber) => {
    const selectedBatch = batches.find(b => b.batch_number === batchNumber);
    
    if (selectedBatch) {
      const updatedData = {
        ...localData,
        batch_number: batchNumber,
        expiry_date: selectedBatch.expiry_date.split('T')[0],
        supplier_name: selectedBatch.supplier_name || localData.supplier_name
      };
      setLocalData(updatedData);
      onUpdate(index, updatedData);
    } else {
      handleChange('batch_number', batchNumber);
    }
    setTouchedFields({ ...touchedFields, batch_number: true });
  };

  const calculateNewTotal = () => {
    if (selectedBatchInfo && localData.quantity) {
      return parseInt(selectedBatchInfo.remaining_quantity) + parseInt(localData.quantity);
    }
    return localData.quantity ? parseInt(localData.quantity) : 0;
  };

  const hasError = (field) => touchedFields[field] && errors[field];

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-700" />
          </div>
          <span className="font-bold text-gray-900">Entry #{index + 1}</span>
          
          {/* Blockchain Indicator */}
          {showBlockchainIndicator && (
            <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 rounded-md">
              <Shield className="w-3 h-3 text-purple-700" />
              <span className="text-xs text-purple-900 font-medium">Blockchain</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onDuplicate(index)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Duplicate this entry"
          >
            <Copy className="w-4 h-4" />
          </button>
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove this entry"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Medicine Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Medicine <span className="text-red-600">*</span>
          </label>
          <div className="flex gap-2">
            <select
              value={localData.medicine_id || ''}
              onChange={(e) => handleMedicineChange(e.target.value)}
              onBlur={() => setTouchedFields({ ...touchedFields, medicine_id: true })}
              className={`flex-1 px-3 py-2 border-2 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                hasError('medicine_id') ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="" className="text-gray-500">Select medicine...</option>
              {medicines.map(med => (
                <option key={med.medicine_id} value={med.medicine_id} className="text-gray-900">
                  {med.medicine_name} {med.strength && `• ${med.strength}`}
                </option>
              ))}
            </select>
            
            <button
              type="button"
              onClick={() => onAddNewMedicine(index)}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors whitespace-nowrap shadow-sm"
              title="Add a new medicine to the system (requires MetaMask)"
            >
              <Plus className="w-4 h-4" />
              New Medicine
            </button>
          </div>
          {hasError('medicine_id') && (
            <div className="mt-2 p-2 bg-red-50 border border-red-300 rounded-lg">
              <p className="text-sm text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">{errors.medicine_id}</span>
              </p>
            </div>
          )}
        </div>

        {/* Show medicine details if selected */}
        {selectedMedicine && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-blue-700" />
              <span className="text-sm font-bold text-blue-900">Selected Medicine</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-blue-800 font-semibold">Type:</span>
                <span className="text-gray-900 ml-2 font-medium">{selectedMedicine.medicine_type || 'N/A'}</span>
              </div>
              <div>
                <span className="text-blue-800 font-semibold">Dosage:</span>
                <span className="text-gray-900 ml-2 font-medium">{selectedMedicine.dosage_form || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Batch Selection */}
        {localData.medicine_id && (
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Batch Number <span className="text-red-600">*</span>
            </label>
            {loadingBatches ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-2 border-gray-300 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-900 font-medium">Loading batches...</span>
              </div>
            ) : batches.length === 0 ? (
              <div className="px-3 py-3 bg-amber-50 border-2 border-amber-300 rounded-lg">
                <p className="text-sm text-amber-900 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>No existing batches found. Enter a new batch number below.</span>
                </p>
              </div>
            ) : (
              <select
                value={localData.batch_number || ''}
                onChange={(e) => handleBatchSelect(e.target.value)}
                onBlur={() => setTouchedFields({ ...touchedFields, batch_number: true })}
                className={`w-full px-3 py-2 border-2 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  hasError('batch_number') ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="" className="text-gray-500">Select existing batch or enter new...</option>
                {batches.map(batch => (
                  <option key={batch.stock_id} value={batch.batch_number} className="text-gray-900">
                    {batch.batch_number} (Stock: {batch.remaining_quantity} • Exp: {new Date(batch.expiry_date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            )}
            
            {/* Manual batch entry */}
            <input
              type="text"
              value={localData.batch_number || ''}
              onChange={(e) => handleChange('batch_number', e.target.value)}
              onBlur={() => setTouchedFields({ ...touchedFields, batch_number: true })}
              placeholder="Or enter new batch number..."
              className={`w-full mt-2 px-3 py-2 border-2 rounded-lg text-gray-900 bg-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                hasError('batch_number') ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            
            {hasError('batch_number') && (
              <div className="mt-2 p-2 bg-red-50 border border-red-300 rounded-lg">
                <p className="text-sm text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{errors.batch_number}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Show batch status indicator */}
        {selectedBatchInfo && (
          <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-purple-700" />
              <p className="text-sm text-purple-900 font-bold">
                Adding to EXISTING batch (MetaMask required)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-purple-800 font-semibold">Current Stock:</span>
                <span className="text-gray-900 font-bold ml-2">{selectedBatchInfo.remaining_quantity}</span>
              </div>
              <div>
                <span className="text-purple-800 font-semibold">Location:</span>
                <span className="text-gray-900 ml-2">{selectedBatchInfo.storage_location || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {isNewBatch && localData.batch_number && (
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-700" />
              <p className="text-sm text-green-900 font-bold">
                Creating NEW batch (MetaMask required)
              </p>
            </div>
          </div>
        )}

        {/* Quantity, Expiry, Supplier */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quantity */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Quantity <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={localData.quantity || ''}
              onChange={(e) => handleChange('quantity', e.target.value)}
              onBlur={() => setTouchedFields({ ...touchedFields, quantity: true })}
              placeholder="Enter quantity"
              className={`w-full px-3 py-2 border-2 rounded-lg text-gray-900 bg-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                hasError('quantity') ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {hasError('quantity') && (
              <p className="mt-1 text-xs text-red-800 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.quantity}
              </p>
            )}
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Expiry Date <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              min={getMinExpiryDate()}
              value={localData.expiry_date || ''}
              onChange={(e) => handleChange('expiry_date', e.target.value)}
              onBlur={() => setTouchedFields({ ...touchedFields, expiry_date: true })}
              className={`w-full px-3 py-2 border-2 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                hasError('expiry_date') ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {hasError('expiry_date') && (
              <p className="mt-1 text-xs text-red-800 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.expiry_date}
              </p>
            )}
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Supplier <span className="text-red-600">*</span>
            </label>
            <select
              value={localData.supplier_name || ''}
              onChange={(e) => handleChange('supplier_name', e.target.value)}
              onBlur={() => setTouchedFields({ ...touchedFields, supplier_name: true })}
              className={`w-full px-3 py-2 border-2 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                hasError('supplier_name') ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="" className="text-gray-500">Select supplier...</option>
              {SUPPLIERS.map(supplier => (
                <option key={supplier} value={supplier} className="text-gray-900">{supplier}</option>
              ))}
            </select>
            {hasError('supplier_name') && (
              <p className="mt-1 text-xs text-red-800 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.supplier_name}
              </p>
            )}
          </div>
        </div>

        {/* Date Received */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Date Received
          </label>
          <input
            type="date"
            max={new Date().toISOString().split('T')[0]}
            value={localData.date_received || new Date().toISOString().split('T')[0]}
            onChange={(e) => handleChange('date_received', e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Summary if filled */}
        {localData.medicine_id && localData.quantity && localData.batch_number && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-green-700 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-green-900 font-bold mb-2">
                  {isNewBatch ? '🆕 Creating New Batch' : '➕ Adding to Existing Batch'}
                </p>
                <div className="text-sm text-gray-900 space-y-1">
                  <p><span className="text-green-800 font-semibold">Medicine:</span> <span className="font-bold">{selectedMedicine?.medicine_name}</span></p>
                  <p><span className="text-green-800 font-semibold">Batch:</span> <span className="font-bold">{localData.batch_number}</span></p>
                  <p><span className="text-green-800 font-semibold">Adding:</span> <span className="font-bold">{localData.quantity} units</span>
                  {selectedBatchInfo && (
                    <> → <span className="text-green-800 font-semibold">New Total:</span> <span className="font-bold">{calculateNewTotal()} units</span></>
                  )}
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-green-300">
                  <p className="text-xs text-gray-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-700" />
                    <span className="font-semibold">This will trigger MetaMask confirmation (with 3 automatic retries)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}