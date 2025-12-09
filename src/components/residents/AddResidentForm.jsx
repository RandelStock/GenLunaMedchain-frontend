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

// Success Notification Modal Component
const SuccessNotification = ({ show, message, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 animate-slideUp">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-scaleIn">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Success!</h3>
          <p className="text-gray-700 text-center text-lg">{message}</p>
        </div>
      </div>
    </div>
  );
};

// Loading Overlay Component
const LoadingOverlay = ({ show, message = "Saving resident..." }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{message}</h3>
          <p className="text-gray-600 text-center">Please wait...</p>
        </div>
      </div>
    </div>
  );
};

const AddResidentForm = ({ onSuccess, onCancel, editData = null }) => {
  const isEditMode = !!editData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [forceSave, setForceSave] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [focusedField, setFocusedField] = useState(null);

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
    } finally {
      setCheckingDuplicate(false);
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
        if (response.status === 409 && errorData.duplicateFound) {
          setDuplicates([errorData.duplicate]);
          setShowDuplicateWarning(true);
          alert('This resident already exists! Please review the duplicate information below.');
          setLoading(false);
          return;
        }
        throw new Error(errorData.message || 'Failed to save resident');
      }

      setSuccessMessage(isEditMode ? 'Resident updated successfully!' : 'Resident added successfully!');
      setShowSuccessNotification(true);
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
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
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>

      <LoadingOverlay show={loading} message={isEditMode ? "Updating resident..." : "Adding resident..."} />
      <SuccessNotification 
        show={showSuccessNotification} 
        message={successMessage}
        onClose={() => setShowSuccessNotification(false)}
      />

      <div className="h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b-2 border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isEditMode ? 'Edit Resident' : 'Add New Resident'}
            </h1>
            {checkingDuplicate && (
              <span className="text-sm text-blue-600 font-semibold animate-pulse flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking duplicates...
              </span>
            )}
          </div>
          <button
            onClick={onCancel || (() => window.history.back())}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Duplicate Warning */}
        {showDuplicateWarning && duplicates.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-600 px-6 py-4 shadow-lg">
            <div className="flex items-start">
              <svg className="w-7 h-7 text-red-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-base font-bold text-red-900 mb-2">
                  ⚠️ Duplicate Resident Detected!
                </h3>
                <p className="text-sm text-red-800 mb-3 font-medium">
                  {duplicates.length} resident{duplicates.length > 1 ? 's' : ''} with matching information already exist{duplicates.length === 1 ? 's' : ''}.
                </p>
                {duplicates.map((dup, idx) => (
                  <div key={idx} className="bg-white rounded-lg border-2 border-red-400 p-4 mb-3 shadow-md">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-bold text-red-800 bg-red-200 px-3 py-1 rounded-md">
                        EXISTING #{dup.resident_id}
                      </span>
                      <span className="text-sm text-red-700 font-semibold">
                        {getDuplicateMatchReason(dup)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-bold text-gray-700">Name:</span>
                        <span className="ml-2 text-gray-900">{dup.full_name}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700">Gender:</span>
                        <span className="ml-2 text-gray-900">{dup.gender}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700">DOB:</span>
                        <span className="ml-2 text-gray-900">
                          {dup.date_of_birth ? new Date(dup.date_of_birth).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700">Age:</span>
                        <span className="ml-2 text-gray-900">{dup.age} yrs</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      setShowDuplicateWarning(false);
                      setForceSave(false);
                    }}
                    className="text-sm px-5 py-2.5 bg-white border-2 border-red-600 text-red-700 rounded-lg hover:bg-red-50 font-bold transition-all"
                  >
                    ← Review Form
                  </button>
                  <button
                    onClick={handleForceSave}
                    className="text-sm px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition-all shadow-md"
                  >
                    ✓ Different Person - Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
              {/* First Name */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-800 mb-2">First Name *</label>
                <div className={`relative ${focusedField === 'first_name' ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('first_name')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="Enter first name"
                    required
                  />
                </div>
                {formErrors.first_name && (
                  <p className="text-red-600 text-sm mt-1 font-semibold">{formErrors.first_name}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-800 mb-2">Last Name *</label>
                <div className={`relative ${focusedField === 'last_name' ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('last_name')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="Enter last name"
                    required
                  />
                </div>
                {formErrors.last_name && (
                  <p className="text-red-600 text-sm mt-1 font-semibold">{formErrors.last_name}</p>
                )}
              </div>

              {/* Middle Name */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-800 mb-2">Middle Name</label>
                <div className={`relative ${focusedField === 'middle_name' ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}>
                  <input
                    type="text"
                    name="middle_name"
                    value={formData.middle_name}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('middle_name')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="Enter middle name (optional)"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-800 mb-2">Date of Birth</label>
                <div className={`relative ${focusedField === 'date_of_birth' ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('date_of_birth')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                {currentAge !== null && (
                  <p className="text-sm text-blue-700 mt-2 font-bold bg-blue-50 inline-block px-3 py-1 rounded-md">
                    Age: {currentAge} years old
                  </p>
                )}
              </div>

              {/* Gender */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-800 mb-2">Gender *</label>
                <div className={`relative ${focusedField === 'gender' ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('gender')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                  >
                    {GENDERS.map(g => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-800 mb-2">Personal Phone</label>
                <div className={`relative ${focusedField === 'phone' ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="+63 XXX XXX XXXX"
                  />
                </div>
                {formErrors.phone && (
                  <p className="text-red-600 text-sm mt-1 font-semibold">{formErrors.phone}</p>
                )}
              </div>
            </div>

            {/* Address Info Section */}
            <div className="mb-8 bg-white rounded-xl shadow-md p-6 border-2 border-gray-200">
              <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-gray-300">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Address Information</h3>
              </div>

              {/* Barangay */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-800 mb-2">Barangay *</label>
                <div className={`relative ${focusedField === 'barangay' ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}>
                  <select
                    name="barangay"
                    value={formData.barangay}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('barangay')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Select Barangay</option>
                    {BARANGAYS.map(b => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-800 mb-2">Address</label>
                <div className={`relative ${focusedField === 'address' ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('address')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="Street, Building, House No."
                  />
                </div>
              </div>

              {/* Zone */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-800 mb-2">Zone/Purok</label>
                <div className={`relative ${focusedField === 'zone' ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}>
                  <input
                    type="text"
                    name="zone"
                    value={formData.zone}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('zone')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="Zone or Purok number"
                  />
                </div>
              </div>
            </div>

            {/* Household Details Section */}
            <div className="mb-8 bg-white rounded-xl shadow-md p-6 border-2 border-gray-200">
              <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-gray-300">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Household Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Household Number</label>
                  <input
                    type="text"
                    name="household_no"
                    value={formData.household_no}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="Enter household number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Family Number</label>
                  <input
                    type="text"
                    name="family_no"
                    value={formData.family_no}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="Enter family number"
                  />
                </div>
              </div>
            </div>

            {/* Program Membership Section */}
            <div className="mb-8 bg-white rounded-xl shadow-md p-6 border-2 border-gray-200">
              <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-gray-300">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Program Membership</h3>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-all">
                  <input
                    type="checkbox"
                    name="is_4ps_member"
                    checked={formData.is_4ps_member}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900 font-bold">4Ps Member (Pantawid Pamilya)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-all">
                  <input
                    type="checkbox"
                    name="is_philhealth_member"
                    checked={formData.is_philhealth_member}
                    onChange={handleChange}
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-900 font-bold">PhilHealth Member</span>
                </label>

                {formData.is_philhealth_member && (
                  <div className="ml-8 pl-6 border-l-4 border-green-400 py-2">
                    <div className="mb-4">
                      <label className="block text-sm font-bold text-gray-800 mb-2">PhilHealth Number *</label>
                      <input
                        type="text"
                        name="philhealth_number"
                        value={formData.philhealth_number}
                        onChange={handleChange}
                        placeholder="XX-XXXXXXXXX-X"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:border-green-500 transition-all"
                      />
                      {formErrors.philhealth_number && (
                        <p className="text-red-600 text-sm mt-1 font-semibold">{formErrors.philhealth_number}</p>
                      )}
                      <p className="text-xs text-gray-600 mt-1 font-medium">12-digit PhilHealth ID</p>
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-3 cursor-pointer p-3 bg-purple-50 border-2 border-purple-200 rounded-lg hover:bg-purple-100 transition-all">
                  <input
                    type="checkbox"
                    name="is_senior_citizen"
                    checked={formData.is_senior_citizen}
                    onChange={handleChange}
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-900 font-bold">Senior Citizen (60+)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 bg-pink-50 border-2 border-pink-200 rounded-lg hover:bg-pink-100 transition-all">
                  <input
                    type="checkbox"
                    name="is_pregnant"
                    checked={formData.is_pregnant}
                    onChange={handleChange}
                    className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="text-sm text-gray-900 font-bold">Pregnant</span>
                </label>

                {formData.is_pregnant && (
                  <div className="ml-8 pl-6 border-l-4 border-pink-400 py-2">
                    <div className="mb-4">
                      <label className="block text-sm font-bold text-gray-800 mb-2">Expected Due Date *</label>
                      <input
                        type="date"
                        name="pregnancy_due_date"
                        value={formData.pregnancy_due_date}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:border-pink-500 transition-all"
                      />
                      {formErrors.pregnancy_due_date && (
                        <p className="text-red-600 text-sm mt-1 font-semibold">{formErrors.pregnancy_due_date}</p>
                      )}
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-bold text-gray-800 mb-2">Pregnancy Notes</label>
                      <textarea
                        name="pregnancy_notes"
                        value={formData.pregnancy_notes}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:border-pink-500 transition-all resize-none"
                        rows="3"
                        placeholder="Any special notes..."
                      />
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-3 cursor-pointer p-3 bg-amber-50 border-2 border-amber-200 rounded-lg hover:bg-amber-100 transition-all">
                  <input
                    type="checkbox"
                    name="is_birth_registered"
                    checked={formData.is_birth_registered}
                    onChange={handleChange}
                    className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-900 font-bold">Birth Registered</span>
                </label>

                {formData.is_birth_registered && (
                  <div className="ml-8 pl-6 border-l-4 border-amber-400 py-2">
                    <div className="mb-4">
                      <label className="block text-sm font-bold text-gray-800 mb-2">Registry Date *</label>
                      <input
                        type="date"
                        name="birth_registry_date"
                        value={formData.birth_registry_date}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:border-amber-500 transition-all"
                      />
                      {formErrors.birth_registry_date && (
                        <p className="text-red-600 text-sm mt-1 font-semibold">{formErrors.birth_registry_date}</p>
                      )}
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-bold text-gray-800 mb-2">Birth Certificate Number</label>
                      <input
                        type="text"
                        name="birth_certificate_no"
                        value={formData.birth_certificate_no}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:border-amber-500 transition-all"
                        placeholder="Certificate number"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t-2 border-gray-200">
                  <label className="block text-sm font-bold text-gray-800 mb-2">Other Programs/Memberships</label>
                  <input
                    type="text"
                    name="other_program"
                    value={formData.other_program}
                    onChange={handleChange}
                    placeholder="e.g., PWD ID, Solo Parent, Indigenous People"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:border-blue-500 transition-all"
                  />
                  <p className="text-xs text-gray-600 mt-1 font-medium">Enter other government programs</p>
                </div>
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div className="mb-8 bg-white rounded-xl shadow-md p-6 border-2 border-gray-200">
              <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-gray-300">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Emergency Contact</h3>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-800 mb-2">Contact Person</label>
                <input
                  type="text"
                  name="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={handleChange}
                  placeholder="Full name of emergency contact"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-800 mb-2">Emergency Phone</label>
                <input
                  type="tel"
                  name="emergency_phone"
                  value={formData.emergency_phone}
                  onChange={handleChange}
                  placeholder="+63 XXX XXX XXXX"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Medical Information Section */}
            <div className="mb-8 bg-white rounded-xl shadow-md p-6 border-2 border-gray-200">
              <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-gray-300">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Medical Information</h3>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-800 mb-2">Medical Conditions</label>
                <textarea
                  name="medical_conditions"
                  value={formData.medical_conditions}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:border-blue-500 transition-all resize-none"
                  rows="3"
                  placeholder="e.g., Hypertension, Diabetes, Asthma"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-800 mb-2">Known Allergies</label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:border-blue-500 transition-all resize-none"
                  rows="3"
                  placeholder="e.g., Penicillin, Shellfish, Peanuts"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 px-5 py-4 bg-red-100 border-2 border-red-500 text-red-800 text-sm rounded-lg font-bold">
                ⚠️ {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t-2 border-gray-300 shadow-lg px-6 py-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel || (() => window.history.back())}
            className="px-8 py-3 bg-white border-2 border-gray-400 text-gray-700 text-sm font-bold hover:bg-gray-100 transition-all rounded-lg shadow-sm"
          >
            CANCEL
          </button>
          {showDuplicateWarning && !forceSave && (
            <button
              type="button"
              onClick={handleForceSave}
              className="px-8 py-3 bg-amber-600 text-white text-sm hover:bg-amber-700 transition-all flex items-center gap-2 font-bold rounded-lg shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              SAVE ANYWAY
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white text-sm hover:bg-blue-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-bold rounded-lg shadow-md"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                SAVING...
              </>
            ) : (
              <>
                SAVE RESIDENT
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default AddResidentForm;