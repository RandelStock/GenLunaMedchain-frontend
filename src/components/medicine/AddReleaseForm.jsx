import { useState, useEffect } from 'react';
import { useMedicineRelease } from '../../hooks/useMedicineRelease';
import api from '../../../api';

const AddReleaseForm = ({ onSuccess, onCancel }) => {
  
  const [formData, setFormData] = useState({
    medicine_id: '',
    stock_id: '',
    resident_id: '',
    resident_name: '',
    resident_age: '',
    concern: '',
    quantity_released: '',
    notes: '',
    date_released: new Date().toISOString().split('T')[0],
    prescription_number: '',
    prescribing_doctor: '',
    dosage_instructions: ''
  });

  const { createRelease } = useMedicineRelease(); // ✅ ADD THIS LINE
  const [medicines, setMedicines] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [residents, setResidents] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch medicines
  useEffect(() => {
    fetchMedicines();
    fetchResidents();
  }, []);

  // Fetch stocks when medicine is selected
  useEffect(() => {
    if (formData.medicine_id) {
      fetchStocks(formData.medicine_id);
    } else {
      setStocks([]);
      setSelectedStock(null);
    }
  }, [formData.medicine_id]);

  const fetchMedicines = async () => {
    try {
      const { data } = await api.get('/medicines?is_active=true');
      setMedicines(data.data || []);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const fetchStocks = async (medicineId) => {
    try {
      const { data } = await api.get(`/stocks/medicine/${medicineId}`);
      const stocks = data || [];
      // Keep only active, with remaining > 0, and sort by expiry ascending for a nicer dropdown
      const filtered = stocks
        .filter(s => s.is_active && s.remaining_quantity > 0)
        .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
      setStocks(filtered);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    }
  };

  const fetchResidents = async () => {
    try {
      const { data } = await api.get('/residents');
      const residents = data.data || data || [];
      setResidents(residents.filter(r => r.is_active));
    } catch (error) {
      console.error('Error fetching residents:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }

    if (name === 'stock_id') {
      const stock = stocks.find(s => s.stock_id === parseInt(value));
      setSelectedStock(stock);
    }

    if (name === 'resident_id') {
      const resident = residents.find(r => r.resident_id === parseInt(value));
      if (resident) {
        setFormData(prev => ({
          ...prev,
          resident_name: resident.full_name || `${resident.first_name} ${resident.last_name}`,
          resident_age: resident.age || ''
        }));
      }
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.medicine_id) errors.medicine_id = 'Medicine is required';
    if (!formData.stock_id) errors.stock_id = 'Stock batch is required';
    if (!formData.resident_name.trim()) errors.resident_name = 'Resident name is required';
    if (!formData.quantity_released || formData.quantity_released <= 0) {
      errors.quantity_released = 'Valid quantity is required';
    }
    if (selectedStock && formData.quantity_released > selectedStock.remaining_quantity) {
      errors.quantity_released = `Cannot exceed available quantity (${selectedStock.remaining_quantity})`;
    }
    if (!formData.date_released) errors.date_released = 'Release date is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await createRelease({
        medicine_id: parseInt(formData.medicine_id),
        stock_id: parseInt(formData.stock_id),
        resident_id: formData.resident_id ? parseInt(formData.resident_id) : null,
        resident_name: formData.resident_name,
        resident_age: formData.resident_age ? parseInt(formData.resident_age) : null,
        concern: formData.concern || null,
        quantity_released: parseInt(formData.quantity_released),
        notes: formData.notes || null,
        date_released: new Date(formData.date_released).toISOString(),
        prescription_number: formData.prescription_number || null,
        prescribing_doctor: formData.prescribing_doctor || null,
        dosage_instructions: formData.dosage_instructions || null
      });

      // Handle blockchain sync status
      if (result.blockchainError) {
        alert('Release created but blockchain sync failed. It will remain pending.\n\nError: ' + result.blockchainError);
      } else {
        alert('Medicine released and synced to blockchain successfully!');
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error creating release:', error);
      alert('Failed to release medicine. Please try again.\n\nError: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Release Medicine</h1>
          <p className="text-gray-600 mt-1">Distribute medicine to residents</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Medicine Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Medicine & Batch</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medicine <span className="text-red-500">*</span>
                </label>
                <select
                  name="medicine_id"
                  value={formData.medicine_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Select Medicine</option>
                  {medicines.map(med => (
                    <option key={med.medicine_id} value={med.medicine_id}>
                      {med.medicine_name} {med.generic_name && `(${med.generic_name})`}
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
                  disabled={!formData.medicine_id}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-gray-900"
                >
                  <option value="">Select Batch</option>
                  {stocks.map(stock => (
                    <option key={stock.stock_id} value={stock.stock_id}>
                      {stock.batch_number} - Available: {stock.remaining_quantity}
                    </option>
                  ))}
                </select>
                {formErrors.stock_id && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.stock_id}</p>
                )}
              </div>
            </div>

            {selectedStock && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Available:</span>
                    <span className="ml-1 text-gray-900">{selectedStock.remaining_quantity} units</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Expires:</span>
                    <span className="ml-1 text-gray-900">
                      {new Date(selectedStock.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <span className="ml-1 text-gray-900">{selectedStock.storage_location || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resident Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Resident Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Resident (Optional)
                </label>
                <select
                  name="resident_id"
                  value={formData.resident_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Select from directory or enter manually</option>
                  {residents.map(resident => (
                    <option key={resident.resident_id} value={resident.resident_id}>
                      {resident.full_name || `${resident.first_name} ${resident.last_name}`}
                      {resident.age && ` (${resident.age} years old)`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resident Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="resident_name"
                    value={formData.resident_name}
                    onChange={handleChange}
                    placeholder="Enter resident name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                  />
                  {formErrors.resident_name && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.resident_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    name="resident_age"
                    value={formData.resident_age}
                    onChange={handleChange}
                    placeholder="Age"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medical Concern</label>
                <input
                  type="text"
                  name="concern"
                  value={formData.concern}
                  onChange={handleChange}
                  placeholder="e.g., Headache, Fever, Pain"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Release Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Release Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity to Release <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="quantity_released"
                  value={formData.quantity_released}
                  onChange={handleChange}
                  placeholder="Enter quantity"
                  min="1"
                  max={selectedStock?.remaining_quantity || 999999}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                />
                {formErrors.quantity_released && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.quantity_released}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Released <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date_released"
                  value={formData.date_released}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional details about the release..."
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Prescription Details (Optional) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Prescription Details (Optional)</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prescription Number</label>
                <input
                  type="text"
                  name="prescription_number"
                  value={formData.prescription_number}
                  onChange={handleChange}
                  placeholder="RX-12345"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prescribing Doctor</label>
                <input
                  type="text"
                  name="prescribing_doctor"
                  value={formData.prescribing_doctor}
                  onChange={handleChange}
                  placeholder="Dr. Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dosage Instructions</label>
              <textarea
                name="dosage_instructions"
                value={formData.dosage_instructions}
                onChange={handleChange}
                placeholder="e.g., Take 1 tablet twice daily after meals"
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Releasing...' : 'Release Medicine'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReleaseForm;