// frontend/src/components/consultation/AddProviderForm.jsx
import React, { useState } from 'react';
import { FaUserMd, FaUserNurse, FaSave, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import API_BASE_URL from '../../config.js';

const API_URL = API_BASE_URL;

const BARANGAYS = [
  { value: 'MUNICIPAL', label: 'Municipal' },
  { value: 'BACONG_IBABA', label: 'Bacong Ibaba' },
  { value: 'BACONG_ILAYA', label: 'Bacong Ilaya' },
  { value: 'BARANGAY_1_POBLACION', label: 'Barangay 1 (Poblacion)' },
  { value: 'BARANGAY_2_POBLACION', label: 'Barangay 2 (Poblacion)' },
  { value: 'BARANGAY_3_POBLACION', label: 'Barangay 3 (Poblacion)' },
  { value: 'BARANGAY_4_POBLACION', label: 'Barangay 4 (Poblacion)' },
  { value: 'BARANGAY_5_POBLACION', label: 'Barangay 5 (Poblacion)' },
  { value: 'BARANGAY_6_POBLACION', label: 'Barangay 6 (Poblacion)' },
  { value: 'BARANGAY_7_POBLACION', label: 'Barangay 7 (Poblacion)' },
  { value: 'BARANGAY_8_POBLACION', label: 'Barangay 8 (Poblacion)' },
  { value: 'BARANGAY_9_POBLACION', label: 'Barangay 9 (Poblacion)' },
  { value: 'LAVIDES', label: 'Lavides' },
  { value: 'MAGSAYSAY', label: 'Magsaysay' },
  { value: 'MALAYA', label: 'Malaya' },
  { value: 'NIEVA', label: 'Nieva' },
  { value: 'RECTO', label: 'Recto' },
  { value: 'SAN_IGNACIO_IBABA', label: 'San Ignacio Ibaba' },
  { value: 'SAN_IGNACIO_ILAYA', label: 'San Ignacio Ilaya' },
  { value: 'SAN_ISIDRO_IBABA', label: 'San Isidro Ibaba' },
  { value: 'SAN_ISIDRO_ILAYA', label: 'San Isidro Ilaya' },
  { value: 'SAN_JOSE', label: 'San Jose' },
  { value: 'SAN_NICOLAS', label: 'San Nicolas' },
  { value: 'SAN_VICENTE', label: 'San Vicente' },
  { value: 'SANTA_MARIA_IBABA', label: 'Santa Maria Ibaba' },
  { value: 'SANTA_MARIA_ILAYA', label: 'Santa Maria Ilaya' },
  { value: 'SUMILANG', label: 'Sumilang' },
  { value: 'VILLARICA', label: 'Villarica' }
];

const SPECIALIZATIONS = [
  'General Medicine',
  'Pediatrics',
  'Internal Medicine',
  'Emergency Medicine',
  'Family Medicine',
  'Geriatrics',
  'Cardiology',
  'Dermatology',
  'Psychiatry',
  'Obstetrics & Gynecology',
  'Nursing Care',
  'Emergency Nursing',
  'Community Health Nursing',
  'Medical-Surgical Nursing'
];

const AddProviderForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    wallet_address: '',
    full_name: '',
    email: '',
    phone: '',
    role: 'ADMIN', // Default to doctor
    assigned_barangay: '',
    specializations: [{ specialization: '', description: '', years_experience: '' }]
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSpecializationChange = (index, field, value) => {
    const updatedSpecializations = [...formData.specializations];
    updatedSpecializations[index][field] = value;
    setFormData(prev => ({
      ...prev,
      specializations: updatedSpecializations
    }));
  };

  const addSpecialization = () => {
    setFormData(prev => ({
      ...prev,
      specializations: [...prev.specializations, { specialization: '', description: '', years_experience: '' }]
    }));
  };

  const removeSpecialization = (index) => {
    if (formData.specializations.length > 1) {
      const updatedSpecializations = formData.specializations.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        specializations: updatedSpecializations
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate required fields
      if (!formData.wallet_address || !formData.full_name || !formData.role) {
        throw new Error('Wallet address, full name, and role are required');
      }
      
      // Validate specializations
      const validSpecializations = formData.specializations.filter(spec => 
        spec.specialization && spec.specialization.trim() !== ''
      );
      
      if (validSpecializations.length === 0) {
        throw new Error('At least one specialization is required');
      }
      
      const response = await fetch(`${API_URL}/provider-profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          specializations: validSpecializations
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        onSuccess?.(data.data);
        
        // Reset form
        setFormData({
          wallet_address: '',
          full_name: '',
          email: '',
          phone: '',
          role: 'ADMIN',
          assigned_barangay: '',
          specializations: [{ specialization: '', description: '', years_experience: '' }]
        });
      } else {
        throw new Error(data.message || 'Failed to create provider');
      }
    } catch (error) {
      console.error('Error creating provider:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {formData.role === 'ADMIN' ? (
                <FaUserMd className="text-2xl text-blue-600" />
              ) : (
                <FaUserNurse className="text-2xl text-green-600" />
              )}
              <div>
                <h2 className="text-2xl font-bold text-black">
                  Add New {formData.role === 'ADMIN' ? 'Doctor' : 'Nurse'}
                </h2>
                <p className="text-black">Create a new healthcare provider profile</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-black text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Provider Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    required
                  >
                    <option value="ADMIN">Doctor</option>
                    <option value="MUNICIPAL_STAFF">Nurse</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Wallet Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="wallet_address"
                    value={formData.wallet_address}
                    onChange={handleInputChange}
                    placeholder="0x..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    required
                  />
                  <p className="text-xs text-black mt-1">Blockchain wallet address for authentication</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Dr. John Smith"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="doctor@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+63 912 345 6789"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Assigned Barangay
                  </label>
                  <select
                    name="assigned_barangay"
                    value={formData.assigned_barangay}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  >
                    <option value="">Select Barangay</option>
                    {BARANGAYS.map(barangay => (
                      <option key={barangay.value} value={barangay.value}>
                        {barangay.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Specializations */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-black">Specializations</h3>
                <button
                  type="button"
                  onClick={addSpecialization}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                >
                  <FaPlus />
                  Add Specialization
                </button>
              </div>

              <div className="space-y-4">
                {formData.specializations.map((spec, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-black">Specialization {index + 1}</h4>
                      {formData.specializations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSpecialization(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Specialization <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={spec.specialization}
                          onChange={(e) => handleSpecializationChange(index, 'specialization', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                          required
                        >
                          <option value="">Select Specialization</option>
                          {SPECIALIZATIONS.map(specialization => (
                            <option key={specialization} value={specialization}>
                              {specialization}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={spec.years_experience}
                          onChange={(e) => handleSpecializationChange(index, 'years_experience', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                          placeholder="5"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Description
                        </label>
                        <input
                          type="text"
                          value={spec.description}
                          onChange={(e) => handleSpecializationChange(index, 'description', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                          placeholder="Additional details..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 text-black rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <FaTimes />
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <FaSave />
                {loading ? 'Creating...' : 'Create Provider'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProviderForm;
