import { useState, useEffect } from 'react';
import API_BASE_URL from '../../config.js';

const BARANGAYS = [
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

const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' }
];

const API_URL = API_BASE_URL;

const AddResidentForm = ({ onSuccess, onCancel, editData = null }) => {
  const isEditMode = !!editData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [forceSave, setForceSave] = useState(false);

  const [formData, setFormData] = useState({
    first_name: editData?.first_name || '',
    middle_name: editData?.middle_name || '',
    last_name: editData?.last_name || '',
    date_of_birth: editData?.date_of_birth ? new Date(editData.date_of_birth).toISOString().split('T')[0] : '',
    gender: editData?.gender || 'MALE',
    barangay: editData?.barangay || '',
    zone: editData?.zone || '',
    household_no: editData?.household_no || '',
    family_no: editData?.family_no || '',
    address: editData?.address || '',
    phone: editData?.phone || '',
    emergency_contact: editData?.emergency_contact || '',
    emergency_phone: editData?.emergency_phone || '',
    medical_conditions: editData?.medical_conditions || '',
    allergies: editData?.allergies || '',
    is_4ps_member: editData?.is_4ps_member || false,
    is_philhealth_member: editData?.is_philhealth_member || false,
    philhealth_number: editData?.philhealth_number || '',
    is_pregnant: editData?.is_pregnant || false,
    is_senior_citizen: editData?.is_senior_citizen || false,
    is_birth_registered: editData?.is_birth_registered || false,
    other_program: editData?.other_program || '',
    pregnancy_due_date: editData?.pregnancy_due_date ? new Date(editData.pregnancy_due_date).toISOString().split('T')[0] : '',
    pregnancy_notes: editData?.pregnancy_notes || '',
    birth_registry_date: editData?.birth_registry_date ? new Date(editData.birth_registry_date).toISOString().split('T')[0] : '',
    birth_certificate_no: editData?.birth_certificate_no || ''
  });

  const [formErrors, setFormErrors] = useState({});

  // Enhanced duplicate checking - checks on multiple fields
  useEffect(() => {
    if (!isEditMode && formData.first_name && formData.last_name) {
      const timer = setTimeout(() => {
        checkForDuplicates();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [formData.first_name, formData.last_name, formData.date_of_birth, formData.phone, isEditMode]);

  const checkForDuplicates = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) return;

    setCheckingDuplicate(true);
    try {
      const response = await fetch(`${API_URL}/residents/check-duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          middle_name: formData.middle_name,
          date_of_birth: formData.date_of_birth,
          phone: formData.phone
        })
      });

      const data = await response.json();
      
      if (data.duplicateFound && data.duplicates.length > 0) {
        setDuplicates(data.duplicates);
        setShowDuplicateWarning(true);
      } else {
        setDuplicates([]);
        setShowDuplicateWarning(false);
      }
    } catch (err) {
      console.error('Error checking duplicates:', err);
      // Fallback: check locally in resident list
      await checkLocalDuplicates();
    } finally {
      setCheckingDuplicate(false);
    }
  };

  // Fallback duplicate check by fetching resident list
  const checkLocalDuplicates = async () => {
    try {
      const response = await fetch(`${API_URL}/residents?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      const residents = data.data || data.residents || [];

      const potentialDuplicates = residents.filter(resident => {
        const nameMatch = 
          resident.first_name?.toLowerCase() === formData.first_name.toLowerCase() &&
          resident.last_name?.toLowerCase() === formData.last_name.toLowerCase();
        
        const dobMatch = formData.date_of_birth && 
          resident.date_of_birth &&
          new Date(resident.date_of_birth).toISOString().split('T')[0] === formData.date_of_birth;
        
        const phoneMatch = formData.phone && 
          resident.phone &&
          resident.phone.replace(/\D/g, '') === formData.phone.replace(/\D/g, '');

        return nameMatch || dobMatch || phoneMatch;
      });

      if (potentialDuplicates.length > 0) {
        setDuplicates(potentialDuplicates);
        setShowDuplicateWarning(true);
      }
    } catch (err) {
      console.error('Error checking local duplicates:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }

    // Reset force save when user makes changes
    if (showDuplicateWarning) {
      setForceSave(false);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.first_name.trim()) errors.first_name = 'First name is required';
    if (!formData.last_name.trim()) errors.last_name = 'Last name is required';
    
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      errors.phone = 'Invalid phone format';
    }
    
    if (formData.is_pregnant && !formData.pregnancy_due_date) {
      errors.pregnancy_due_date = 'Due date required for pregnant residents';
    }
    
    if (formData.is_birth_registered && !formData.birth_registry_date) {
      errors.birth_registry_date = 'Registry date required';
    }

    if (formData.is_philhealth_member && !formData.philhealth_number.trim()) {
      errors.philhealth_number = 'PhilHealth number required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Show duplicate warning if duplicates found and user hasn't confirmed
    if (!isEditMode && showDuplicateWarning && !forceSave) {
      alert('Potential duplicate residents found! Please review the warning below or click "Save Anyway" to proceed.');
      return;
    }

    try {
      setLoading(true);
      
      const submissionData = {
        ...formData,
        full_name: `${formData.first_name} ${formData.middle_name ? formData.middle_name + ' ' : ''}${formData.last_name}`.trim(),
        age: formData.date_of_birth ? calculateAge(formData.date_of_birth) : null,
        date_of_birth: formData.date_of_birth 
          ? new Date(formData.date_of_birth + 'T00:00:00.000Z').toISOString()
          : null,
        pregnancy_due_date: formData.pregnancy_due_date && formData.is_pregnant
          ? new Date(formData.pregnancy_due_date + 'T00:00:00.000Z').toISOString()
          : null,
        birth_registry_date: formData.birth_registry_date && formData.is_birth_registered
          ? new Date(formData.birth_registry_date + 'T00:00:00.000Z').toISOString()
          : null,
        skip_duplicate_check: forceSave
      };

      const url = isEditMode 
        ? `${API_URL}/residents/${editData.resident_id}`
        : `${API_URL}/residents`;
      
      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle duplicate error from backend
        if (response.status === 409 && errorData.duplicateFound) {
          setDuplicates([errorData.duplicate]);
          setShowDuplicateWarning(true);
          alert('This resident already exists! Please review the duplicate information below.');
          setLoading(false);
          return;
        }
        
        throw new Error(errorData.message || 'Failed to save resident');
      }

      alert(isEditMode ? 'Resident updated successfully!' : 'Resident added successfully!');
      onSuccess?.();
    } catch (err) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleForceSave = () => {
    setForceSave(true);
    setShowDuplicateWarning(false);
  };

  const getBarangayLabel = (value) => {
    return BARANGAYS.find(b => b.value === value)?.label || value;
  };

  const getDuplicateMatchReason = (dup) => {
    const reasons = [];
    
    const nameMatch = 
      dup.first_name?.toLowerCase() === formData.first_name.toLowerCase() &&
      dup.last_name?.toLowerCase() === formData.last_name.toLowerCase();
    
    if (nameMatch) reasons.push('Same Name');
    
    if (formData.date_of_birth && dup.date_of_birth &&
        new Date(dup.date_of_birth).toISOString().split('T')[0] === formData.date_of_birth) {
      reasons.push('Same Birth Date');
    }
    
    if (formData.phone && dup.phone &&
        dup.phone.replace(/\D/g, '') === formData.phone.replace(/\D/g, '')) {
      reasons.push('Same Phone');
    }

    return reasons.join(', ') || 'Similar Info';
  };

  const currentAge = formData.date_of_birth ? calculateAge(formData.date_of_birth) : null;

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-300 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h1 className="text-xl font-normal text-black">
            {isEditMode ? 'Edit Resident' : 'Add Resident'}
          </h1>
          {checkingDuplicate && (
            <span className="text-xs text-blue-600 animate-pulse flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Checking for duplicates...
            </span>
          )}
        </div>
        <button
          onClick={onCancel || (() => window.history.back())}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Enhanced Duplicate Warning */}
      {showDuplicateWarning && duplicates.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 px-6 py-4">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-800 mb-2">
                ⚠️ Duplicate Resident Detected!
              </h3>
              <p className="text-xs text-red-700 mb-3">
                {duplicates.length} resident{duplicates.length > 1 ? 's' : ''} with matching information already exist{duplicates.length === 1 ? 's' : ''} in the system. Please verify this is not a duplicate entry.
              </p>
              {duplicates.map((dup, idx) => (
                <div key={idx} className="bg-white rounded-lg border-2 border-red-300 p-4 mb-3 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded">
                        EXISTING RESIDENT #{dup.resident_id}
                      </span>
                      <span className="ml-2 text-xs text-red-600">
                        Match: {getDuplicateMatchReason(dup)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs mt-3">
                    <div>
                      <span className="font-semibold text-gray-700">Full Name:</span>
                      <span className="ml-1 text-gray-900 font-medium">{dup.full_name}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Gender:</span>
                      <span className="ml-1 text-gray-900">{dup.gender}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Date of Birth:</span>
                      <span className="ml-1 text-gray-900">
                        {dup.date_of_birth ? new Date(dup.date_of_birth).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Age:</span>
                      <span className="ml-1 text-gray-900">{dup.age} years</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Barangay:</span>
                      <span className="ml-1 text-gray-900">{getBarangayLabel(dup.barangay)}</span>
                    </div>
                    {dup.phone && (
                      <div>
                        <span className="font-semibold text-gray-700">Phone:</span>
                        <span className="ml-1 text-gray-900">{dup.phone}</span>
                      </div>
                    )}
                    {dup.address && (
                      <div className="col-span-2">
                        <span className="font-semibold text-gray-700">Address:</span>
                        <span className="ml-1 text-gray-900">{dup.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setShowDuplicateWarning(false);
                    setForceSave(false);
                  }}
                  className="text-xs px-4 py-2 bg-white border-2 border-red-500 text-red-700 rounded hover:bg-red-50 font-semibold"
                >
                  ← Review & Edit Form
                </button>
                <button
                  onClick={handleForceSave}
                  className="text-xs px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
                >
                  ✓ Confirm - This is a Different Person
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6">
          {/* Personal Information Section */}
          <div className="mb-8">
            <div className="mb-6">
              <label className="block text-sm text-black mb-1">First Name *</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border-b-2 border-gray-300 text-black focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
              {formErrors.first_name && (
                <p className="text-red-600 text-xs mt-1">{formErrors.first_name}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm text-black mb-1">Last Name *</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border-b-2 border-gray-300 text-black focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
              {formErrors.last_name && (
                <p className="text-red-600 text-xs mt-1">{formErrors.last_name}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm text-black mb-1">Middle Name</label>
              <input
                type="text"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border-b-2 border-gray-300 text-black focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-black mb-1">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border-b-2 border-gray-300 text-black focus:outline-none focus:border-blue-500 transition-colors"
              />
              {currentAge !== null && (
                <p className="text-xs text-blue-600 mt-1">Age: {currentAge} years</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm text-black mb-1">Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border-b-2 border-gray-300 text-black focus:outline-none focus:border-blue-500 transition-colors"
              >
                {GENDERS.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-black mb-1">Personal Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border-b-2 border-gray-300 text-black focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="+63 XXX XXX XXXX"
              />
              {formErrors.phone && (
                <p className="text-red-600 text-xs mt-1">{formErrors.phone}</p>
              )}
            </div>
          </div>

          {/* Address Info Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <h3 className="text-base font-normal text-black">Address Info</h3>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-black mb-1">Barangay *</label>
              <select
                name="barangay"
                value={formData.barangay}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border-b-2 border-gray-300 text-black focus:outline-none focus:border-blue-500 transition-colors"
                required
              >
                <option value="">Select Barangay</option>
                {BARANGAYS.map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-black mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border-b-2 border-gray-300 text-black focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-black mb-1">Zone/Purok</label>
              <input
                type="text"
                name="zone"
                value={formData.zone}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border-b-2 border-gray-300 text-black focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Household Details Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <h3 className="text-base font-normal text-black">Household Details</h3>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-black mb-1">Household Number</label>
              <input
                type="text"
                name="household_no"
                value={formData.household_no}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border-b-2 border-gray-300 text-black focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-black mb-1">Family Number</label>
              <input
                type="text"
                name="family_no"
                value={formData.family_no}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border-b-2 border-gray-300 text-black focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Program Membership Section - Enhanced with PhilHealth */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3 className="text-base font-normal text-black">Program Membership</h3>
            </div>

            {/* 4Ps Member */}
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_4ps_member"
                  checked={formData.is_4ps_member}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-black font-medium">4Ps Member (Pantawid Pamilyang Pilipino Program)</span>
              </label>
            </div>

            {/* PhilHealth Member */}
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_philhealth_member"
                  checked={formData.is_philhealth_member}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-black font-medium">PhilHealth Member</span>
              </label>
            </div>

            {formData.is_philhealth_member && (
              <div className="ml-6 pl-4 border-l-2 border-green-300 mb-4">
                <div className="mb-4">
                  <label className="block text-sm text-black mb-1">PhilHealth Number *</label>
                  <input
                    type="text"
                    name="philhealth_number"
                    value={formData.philhealth_number}
                    onChange={handleChange}
                    placeholder="XX-XXXXXXXXX-X"
                    className="w-full px-3 py-2 bg-white border-b-2 border-gray-300 text-black focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {formErrors.philhealth_number && (
                    <p className="text-red-600 text-xs mt-1">{formErrors.philhealth_number}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Enter the 12-digit PhilHealth ID number</p>
                </div>
              </div>
            )}

            {/* Senior Citizen */}
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_senior_citizen"
                  checked={formData.is_senior_citizen}
                  onChange={handleChange}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-black font-medium">Senior Citizen (60 years old and above)</span>
              </label>
            </div>

            {/* Pregnant */}
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_pregnant"
                  checked={formData.is_pregnant}
                  onChange={handleChange}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className="text-sm text-black font-medium">Pregnant</span>
              </label>
            </div>

            {formData.is_pregnant && (
              <div className="ml-6 pl-4 border-l-2 border-pink-300 mb-4">
                <div className="mb-4">
                  <label className="block text-sm text-black mb-1">Expected Due Date *</label>
                  <input
                    type="date"
                    name="pregnancy_due_date"
                    value={formData.pregnancy_due_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border-b-2 border-gray-300 text-black focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {formErrors.pregnancy_due_date && (
                    <p className="text-red-600 text-xs mt-1">{formErrors.pregnancy_due_date}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-black mb-1">Pregnancy Notes</label>
                  <textarea
                    name="pregnancy_notes"
                    value={formData.pregnancy_notes}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border-b-2 border-gray-300 text-black focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    rows="2"
                    placeholder="Any special notes about the pregnancy..."
                  />
                </div>
              </div>
            )}

            {/* Birth Registered */}
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_birth_registered"
                  checked={formData.is_birth_registered}
                  onChange={handleChange}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-black font-medium">Birth Registered</span>
              </label>
            </div>

            {formData.is_birth_registered && (
              <div className="ml-6 pl-4 border-l-2 border-orange-300 mb-4">
                <div className="mb-4">
                  <label className="block text-sm text-black mb-1">Registry Date *</label>
                  <input
                    type="date"
                    name="birth_registry_date"
                    value={formData.birth_registry_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border-b-2 border-gray-300 text-black focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {formErrors.birth_registry_date && (
                    <p className="text-red-600 text-xs mt-1">{formErrors.birth_registry_date}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-black mb-1">Birth Certificate Number</label>
                  <input
                    type="text"
                    name="birth_certificate_no"
                    value={formData.birth_certificate_no}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border-b-2 border-gray-300 text-black focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Enter birth certificate number"
                  />
                </div>
              </div>
            )}

            {/* Other Program/Membership */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <label className="block text-sm text-black mb-1 font-medium">Other Programs/Memberships</label>
              <input
                type="text"
                name="other_program"
                value={formData.other_program}
                onChange={handleChange}
                placeholder="e.g., PWD ID, Solo Parent, Indigenous People, etc."
                className="w-full px-3 py-2 bg-white border-b-2 border-gray-300 text-black focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">Enter any other government programs or special categories</p>
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              <h3 className="text-base font-normal text-black">Emergency Contact</h3>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-black mb-1">Contact Person</label>
              <input
                type="text"
                name="emergency_contact"
                value={formData.emergency_contact}
                onChange={handleChange}
                placeholder="Full name of emergency contact"
                className="w-full px-3 py-2 bg-white border-b-2 border-gray-300 text-black focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-black mb-1">Emergency Phone</label>
              <input
                type="tel"
                name="emergency_phone"
                value={formData.emergency_phone}
                onChange={handleChange}
                placeholder="+63 XXX XXX XXXX"
                className="w-full px-3 py-2 bg-white border-b-2 border-gray-300 text-black focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Medical Information Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <h3 className="text-base font-normal text-black">Medical Information</h3>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-black mb-1">Medical Conditions</label>
              <textarea
                name="medical_conditions"
                value={formData.medical_conditions}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border-b-2 border-gray-300 text-black focus:outline-none focus:border-blue-500 transition-colors resize-none"
                rows="2"
                placeholder="List any known medical conditions (e.g., Hypertension, Diabetes, Asthma)"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-black mb-1">Known Allergies</label>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border-b-2 border-gray-300 text-black focus:outline-none focus:border-blue-500 transition-colors resize-none"
                rows="2"
                placeholder="List any known allergies (e.g., Penicillin, Shellfish, Peanuts)"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="bg-gray-50 border-t border-gray-300 px-6 py-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel || (() => window.history.back())}
          className="px-6 py-2 bg-white border border-gray-300 text-black text-sm hover:bg-gray-50 transition-colors"
        >
          CANCEL
        </button>
        {showDuplicateWarning && !forceSave && (
          <button
            type="button"
            onClick={handleForceSave}
            className="px-6 py-2 bg-amber-600 text-white text-sm hover:bg-amber-700 transition-colors flex items-center gap-2 font-semibold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            SAVE ANYWAY
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              SAVING...
            </>
          ) : (
            <>
              SAVE
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AddResidentForm;