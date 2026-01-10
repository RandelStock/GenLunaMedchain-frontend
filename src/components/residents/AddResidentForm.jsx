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

const API_URL = API_BASE_URL;

// ✅ Success Notification Modal
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
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Success!</h3>
          <p className="text-gray-800 text-center text-lg font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

// ✅ Loading Overlay
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
          <h3 className="text-xl font-bold text-gray-900 mb-2">{message}</h3>
          <p className="text-gray-700 text-center font-medium">Please wait...</p>
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
    is_pwd: editData?.is_pwd || false, // ✅ NEW: PWD separate
    is_birth_registered: editData?.is_birth_registered || false,
    other_program: editData?.other_program || '',
    pregnancy_due_date: editData?.pregnancy_due_date ? new Date(editData.pregnancy_due_date).toISOString().split('T')[0] : '',
    pregnancy_notes: editData?.pregnancy_notes || '',
    birth_registry_date: editData?.birth_registry_date ? new Date(editData.birth_registry_date).toISOString().split('T')[0] : '',
    birth_certificate_no: editData?.birth_certificate_no || ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [ageInfo, setAgeInfo] = useState(null); // ✅ NEW: Auto-calculated age info

  // ✅ ENHANCED: Calculate age and life stage automatically
  const calculateAgeAndStage = (dob) => {
    if (!dob) return null;
    
    try {
      const today = new Date();
      const birthDate = new Date(dob);
      
      // Validate date
      if (isNaN(birthDate.getTime()) || birthDate > today) {
        return { error: 'Invalid or future date' };
      }

      // Calculate age in years and months
      let years = today.getFullYear() - birthDate.getFullYear();
      let months = today.getMonth() - birthDate.getMonth();
      
      if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
        years--;
        months += 12;
      }

      const totalMonths = years * 12 + months;

      // ✅ Determine life stage
      let stage = '';
      let stageColor = '';
      let stageIcon = '';

      if (totalMonths <= 36) {
        stage = 'Infant/Toddler';
        stageColor = 'bg-pink-100 text-pink-900 border-pink-300';
        stageIcon = '👶';
      } else if (years >= 4 && years <= 12) {
        stage = 'Child';
        stageColor = 'bg-blue-100 text-blue-900 border-blue-300';
        stageIcon = '🧒';
      } else if (years >= 13 && years <= 17) {
        stage = 'Teen';
        stageColor = 'bg-purple-100 text-purple-900 border-purple-300';
        stageIcon = '👦';
      } else if (years >= 18 && years <= 59) {
        stage = 'Adult';
        stageColor = 'bg-green-100 text-green-900 border-green-300';
        stageIcon = '👨';
      } else if (years >= 60) {
        stage = 'Senior Citizen';
        stageColor = 'bg-orange-100 text-orange-900 border-orange-300';
        stageIcon = '👴';
      }

      // ✅ Auto-check senior citizen
      if (years >= 60 && !formData.is_senior_citizen) {
        setFormData(prev => ({ ...prev, is_senior_citizen: true }));
      } else if (years < 60 && formData.is_senior_citizen) {
        setFormData(prev => ({ ...prev, is_senior_citizen: false }));
      }

      return {
        years,
        months,
        totalMonths,
        stage,
        stageColor,
        stageIcon,
        isSenior: years >= 60,
        isInfant: totalMonths <= 36
      };
    } catch (err) {
      console.error('Error calculating age:', err);
      return { error: 'Calculation error' };
    }
  };

  // ✅ Update age info when DOB changes
  useEffect(() => {
    if (formData.date_of_birth) {
      const info = calculateAgeAndStage(formData.date_of_birth);
      setAgeInfo(info);
      
      // Clear DOB error if valid
      if (info && !info.error) {
        setFormErrors(prev => ({ ...prev, date_of_birth: undefined }));
      }
    } else {
      setAgeInfo(null);
    }
  }, [formData.date_of_birth]);

  // ✅ Duplicate check (existing logic)
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
    
    // Clear field error
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
    
    if (showDuplicateWarning) {
      setForceSave(false);
    }
  };

  // ✅ ENHANCED: Validation with better error messages
  const validateForm = () => {
    const errors = {};

    // Required fields
    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
    } else if (formData.first_name.trim().length < 2) {
      errors.first_name = 'First name must be at least 2 characters';
    }

    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    } else if (formData.last_name.trim().length < 2) {
      errors.last_name = 'Last name must be at least 2 characters';
    }

    if (!formData.barangay) {
      errors.barangay = 'Barangay is required';
    }

    // Date of birth validation
    if (formData.date_of_birth) {
      const dob = new Date(formData.date_of_birth);
      const today = new Date();
      
      if (dob > today) {
        errors.date_of_birth = 'Date of birth cannot be in the future';
      } else if (dob < new Date('1900-01-01')) {
        errors.date_of_birth = 'Please enter a valid date of birth';
      }
    }

    // Phone validation
    if (formData.phone && formData.phone.trim()) {
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        errors.phone = 'Phone number must be at least 10 digits';
      } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
        errors.phone = 'Invalid phone format';
      }
    }

    // Conditional validations
    if (formData.is_pregnant && !formData.pregnancy_due_date) {
      errors.pregnancy_due_date = 'Due date required for pregnant residents';
    }

    if (formData.is_pregnant && formData.pregnancy_due_date) {
      const dueDate = new Date(formData.pregnancy_due_date);
      const today = new Date();
      if (dueDate <= today) {
        errors.pregnancy_due_date = 'Due date must be in the future';
      }
    }

    if (formData.is_birth_registered && !formData.birth_registry_date) {
      errors.birth_registry_date = 'Registry date required when birth is registered';
    }

    if (formData.is_philhealth_member && !formData.philhealth_number.trim()) {
      errors.philhealth_number = 'PhilHealth number required';
    } else if (formData.is_philhealth_member) {
      const digits = formData.philhealth_number.replace(/\D/g, '');
      if (digits.length !== 12) {
        errors.philhealth_number = 'PhilHealth number must be 12 digits';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const errorList = Object.entries(formErrors)
        .map(([field, msg]) => `• ${msg}`)
        .join('\n');
      alert(`⚠️ Please fix the following errors:\n\n${errorList}`);
      return;
    }

    if (!isEditMode && showDuplicateWarning && !forceSave) {
      alert('⚠️ Potential duplicate residents found!\n\nPlease review the warning below or click "Save Anyway" to proceed.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const submissionData = {
        ...formData,
        full_name: `${formData.first_name} ${formData.middle_name ? formData.middle_name + ' ' : ''}${formData.last_name}`.trim(),
        age: ageInfo?.years || null,
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
          alert('⚠️ This resident already exists!\n\nPlease review the duplicate information below.');
          setLoading(false);
          return;
        }
        throw new Error(errorData.message || 'Failed to save resident');
      }

      setSuccessMessage(isEditMode ? 'Resident updated successfully!' : 'Resident added successfully!');
      setShowSuccessNotification(true);
      
      // Reset form after add (not edit)
      if (!isEditMode) {
        setFormData({
          first_name: '',
          middle_name: '',
          last_name: '',
          date_of_birth: '',
          gender: 'MALE',
          barangay: '',
          zone: '',
          household_no: '',
          family_no: '',
          address: '',
          phone: '',
          emergency_contact: '',
          emergency_phone: '',
          medical_conditions: '',
          allergies: '',
          is_4ps_member: false,
          is_philhealth_member: false,
          philhealth_number: '',
          is_pregnant: false,
          is_senior_citizen: false,
          is_pwd: false,
          is_birth_registered: false,
          other_program: '',
          pregnancy_due_date: '',
          pregnancy_notes: '',
          birth_registry_date: '',
          birth_certificate_no: ''
        });
        setFormErrors({});
        setDuplicates([]);
        setShowDuplicateWarning(false);
        setForceSave(false);
        setAgeInfo(null);
      }
      
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
      
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleForceSave = () => {
    setForceSave(true);
    setShowDuplicateWarning(false);
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

  // ✅ RENDER START - COMPACT 2-COLUMN LAYOUT
  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
      `}</style>

      <LoadingOverlay show={loading} message={isEditMode ? "Updating resident..." : "Adding resident..."} />
      <SuccessNotification 
        show={showSuccessNotification} 
        message={successMessage}
        onClose={() => setShowSuccessNotification(false)}
      />

      <div className="h-screen bg-gray-50 flex flex-col">
        {/* ✅ COMPACT HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {isEditMode ? 'Edit Resident' : 'Add New Resident'}
              </h1>
              {checkingDuplicate && (
                <span className="text-xs text-blue-100 font-medium flex items-center gap-1">
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking for duplicates...
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onCancel || (() => window.history.back())}
            className="text-white hover:bg-blue-800 p-2 rounded-lg transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ✅ DUPLICATE WARNING - IMPROVED */}
        {showDuplicateWarning && duplicates.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-600 px-6 py-3 shadow-lg">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-red-900 mb-2">
                  ⚠️ Potential Duplicate Found!
                </h3>
                {duplicates.map((dup, idx) => (
                  <div key={idx} className="bg-white rounded-lg border-2 border-red-400 p-3 mb-2 shadow-sm">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><span className="font-bold text-gray-900">Name:</span> <span className="text-gray-800">{dup.full_name}</span></div>
                      <div><span className="font-bold text-gray-900">DOB:</span> <span className="text-gray-800">{dup.date_of_birth ? new Date(dup.date_of_birth).toLocaleDateString() : 'N/A'}</span></div>
                      <div><span className="font-bold text-gray-900">Match:</span> <span className="text-red-700 font-semibold">{getDuplicateMatchReason(dup)}</span></div>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => { setShowDuplicateWarning(false); setForceSave(false); }}
                    className="text-xs px-3 py-1.5 bg-white border border-red-600 text-red-700 rounded hover:bg-red-50 font-bold"
                  >
                    Review
                  </button>
                  <button
                    onClick={handleForceSave}
                    className="text-xs px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 font-bold"
                  >
                    Different Person - Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ MAIN FORM - COMPACT 2-COLUMN GRID */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="max-w-7xl mx-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* ========== LEFT COLUMN ========== */}
              <div className="space-y-4">
                
                {/* ✅ SECTION 1: PERSONAL INFO - COMPACT */}
                <div className="bg-white rounded-lg shadow-md border-2 border-gray-300 p-4">
                  <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2 pb-2 border-b-2 border-gray-300">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* First Name */}
                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-1">First Name *</label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 text-sm bg-white border-2 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.first_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Juan"
                      />
                      {formErrors.first_name && (
                        <p className="text-red-700 text-xs mt-1 font-bold">{formErrors.first_name}</p>
                      )}
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-1">Last Name *</label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 text-sm bg-white border-2 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.last_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Dela Cruz"
                      />
                      {formErrors.last_name && (
                        <p className="text-red-700 text-xs mt-1 font-bold">{formErrors.last_name}</p>
                      )}
                    </div>

                    {/* Middle Name */}
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-900 mb-1">Middle Name</label>
                      <input
                        type="text"
                        name="middle_name"
                        value={formData.middle_name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Santos (optional)"
                      />
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        max={new Date().toISOString().split('T')[0]}
                        className={`w-full px-3 py-2 text-sm bg-white border-2 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.date_of_birth ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.date_of_birth && (
                        <p className="text-red-700 text-xs mt-1 font-bold">{formErrors.date_of_birth}</p>
                      )}
                    </div>

                    {/* ✅ AUTO AGE DISPLAY */}
                    {ageInfo && !ageInfo.error && (
                      <div>
                        <label className="block text-xs font-bold text-gray-900 mb-1">Age & Life Stage</label>
                        <div className={`px-3 py-2 rounded-lg border-2 text-sm font-bold ${ageInfo.stageColor}`}>
                          {ageInfo.stageIcon} {ageInfo.years} yrs {ageInfo.months > 0 && `${ageInfo.months} mos`} - {ageInfo.stage}
                        </div>
                      </div>
                    )}

                    {/* Phone */}
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-900 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 text-sm bg-white border-2 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="+63 912 345 6789"
                      />
                      {formErrors.phone && (
                        <p className="text-red-700 text-xs mt-1 font-bold">{formErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* ✅ GENDER - CHECKBOX STYLE */}
                  <div className="mt-3 pt-3 border-t-2 border-gray-300">
                    <label className="block text-xs font-bold text-gray-900 mb-2">Gender *</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'MALE', label: 'Male', icon: '👨' },
                        { value: 'FEMALE', label: 'Female', icon: '👩' },
                        { value: 'OTHER', label: 'Other', icon: '⚧️' }
                      ].map(g => (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, gender: g.value }))}
                          className={`flex-1 px-3 py-2 text-sm font-bold rounded-lg border-2 transition-all ${
                            formData.gender === g.value
                              ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                              : 'bg-white text-gray-900 border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          {g.icon} {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>


                {/* ✅ SECTION 2: ADDRESS - COMPACT */}
                <div className="bg-white rounded-lg shadow-md border-2 border-gray-300 p-4">
                  <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2 pb-2 border-b-2 border-gray-300">
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Address Information
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Barangay */}
                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-1">Barangay *</label>
                      <select
                        name="barangay"
                        value={formData.barangay}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 text-sm bg-white border-2 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.barangay ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select Barangay</option>
                        {BARANGAYS.map(b => (
                          <option key={b.value} value={b.value}>{b.label}</option>
                        ))}
                      </select>
                      {formErrors.barangay && (
                        <p className="text-red-700 text-xs mt-1 font-bold">{formErrors.barangay}</p>
                      )}
                    </div>

                    {/* Address & Zone */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-900 mb-1">Street/House No.</label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          className="w-full px-3 py-2 text-sm bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="123 Main St"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-900 mb-1">Zone/Purok</label>
                        <input
                          type="text"
                          name="zone"
                          value={formData.zone}
                          onChange={handleChange}
                          className="w-full px-3 py-2 text-sm bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Zone 1"
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* ✅ SECTION 3: EMERGENCY CONTACT - COMPACT */}
                <div className="bg-white rounded-lg shadow-md border-2 border-gray-300 p-4">
                  <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2 pb-2 border-b-2 border-gray-300">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    Emergency Contact
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-1">Contact Person</label>
                      <input
                        type="text"
                        name="emergency_contact"
                        value={formData.emergency_contact}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-1">Emergency Phone</label>
                      <input
                        type="tel"
                        name="emergency_phone"
                        value={formData.emergency_phone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+63 912 345 6789"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ========== RIGHT COLUMN ========== */}
              <div className="space-y-4">
                
                {/* ✅ SECTION 4: PROGRAMS - SEPARATED WITH CHECKBOXES */}
                <div className="bg-white rounded-lg shadow-md border-2 border-gray-300 p-4">
                  <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2 pb-2 border-b-2 border-gray-300">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Programs & Benefits
                  </h3>
                  
                  <div className="space-y-2">
                    {/* 4Ps */}
                    <label className="flex items-center gap-2 p-2 rounded-lg border-2 border-blue-200 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-all">
                      <input
                        type="checkbox"
                        name="is_4ps_member"
                        checked={formData.is_4ps_member}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-bold text-gray-900">4Ps Member</span>
                    </label>

                    {/* PhilHealth */}
                    <label className="flex items-center gap-2 p-2 rounded-lg border-2 border-green-200 bg-green-50 cursor-pointer hover:bg-green-100 transition-all">
                      <input
                        type="checkbox"
                        name="is_philhealth_member"
                        checked={formData.is_philhealth_member}
                        onChange={handleChange}
                        className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                      />
                      <span className="text-sm font-bold text-gray-900">PhilHealth Member</span>
                    </label>

                    {formData.is_philhealth_member && (
                      <div className="ml-6 pl-4 border-l-4 border-green-400 py-2">
                        <label className="block text-xs font-bold text-gray-900 mb-1">PhilHealth Number *</label>
                        <input
                          type="text"
                          name="philhealth_number"
                          value={formData.philhealth_number}
                          onChange={handleChange}
                          placeholder="XX-XXXXXXXXX-X"
                          className={`w-full px-3 py-2 text-sm bg-white border-2 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            formErrors.philhealth_number ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        {formErrors.philhealth_number && (
                          <p className="text-red-700 text-xs mt-1 font-bold">{formErrors.philhealth_number}</p>
                        )}
                      </div>
                    )}

                    {/* Birth Registered */}
                    <label className="flex items-center gap-2 p-2 rounded-lg border-2 border-amber-200 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-all">
                      <input
                        type="checkbox"
                        name="is_birth_registered"
                        checked={formData.is_birth_registered}
                        onChange={handleChange}
                        className="w-4 h-4 text-amber-600 rounded focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="text-sm font-bold text-gray-900">Birth Registered</span>
                    </label>

                    {formData.is_birth_registered && (
                      <div className="ml-6 pl-4 border-l-4 border-amber-400 py-2 space-y-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-900 mb-1">Registry Date *</label>
                          <input
                            type="date"
                            name="birth_registry_date"
                            value={formData.birth_registry_date}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 text-sm bg-white border-2 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                              formErrors.birth_registry_date ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                          />
                          {formErrors.birth_registry_date && (
                            <p className="text-red-700 text-xs mt-1 font-bold">{formErrors.birth_registry_date}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-900 mb-1">Certificate No.</label>
                          <input
                            type="text"
                            name="birth_certificate_no"
                            value={formData.birth_certificate_no}
                            onChange={handleChange}
                            className="w-full px-3 py-2 text-sm bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="Certificate number"
                          />
                        </div>
                      </div>
                    )}

                    {/* Other Programs */}
                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-1">Other Programs</label>
                      <input
                        type="text"
                        name="other_program"
                        value={formData.other_program}
                        onChange={handleChange}
                        placeholder="Solo Parent, Indigenous People, etc."
                        className="w-full px-3 py-2 text-sm bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* ✅ SECTION 5: HEALTH STATUS - SEPARATED */}
                <div className="bg-white rounded-lg shadow-md border-2 border-gray-300 p-4">
                  <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2 pb-2 border-b-2 border-gray-300">
                    <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    Health Status
                  </h3>
                  
                  <div className="space-y-2">
                    {/* ✅ Senior Citizen - Auto-checked if 60+ */}
                    <label className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all ${
                      ageInfo?.isSenior 
                        ? 'border-orange-400 bg-orange-100 cursor-not-allowed' 
                        : 'border-orange-200 bg-orange-50 hover:bg-orange-100'
                    }`}>
                      <input
                        type="checkbox"
                        name="is_senior_citizen"
                        checked={formData.is_senior_citizen}
                        onChange={handleChange}
                        disabled={ageInfo?.isSenior}
                        className="w-4 h-4 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                      />
                      <span className="text-sm font-bold text-gray-900">
                        Senior Citizen (60+)
                        {ageInfo?.isSenior && <span className="ml-2 text-xs text-orange-700">(Auto-detected)</span>}
                      </span>
                    </label>

                    {/* ✅ PWD - Separate */}
                    <label className="flex items-center gap-2 p-2 rounded-lg border-2 border-indigo-200 bg-indigo-50 cursor-pointer hover:bg-indigo-100 transition-all">
                      <input
                        type="checkbox"
                        name="is_pwd"
                        checked={formData.is_pwd}
                        onChange={handleChange}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-bold text-gray-900">Person with Disability (PWD)</span>
                    </label>

                    {/* ✅ Pregnant - Separate with due date */}
                    <label className="flex items-center gap-2 p-2 rounded-lg border-2 border-pink-200 bg-pink-50 cursor-pointer hover:bg-pink-100 transition-all">
                      <input
                        type="checkbox"
                        name="is_pregnant"
                        checked={formData.is_pregnant}
                        onChange={handleChange}
                        className="w-4 h-4 text-pink-600 rounded focus:ring-2 focus:ring-pink-500"
                      />
                      <span className="text-sm font-bold text-gray-900">Pregnant</span>
                    </label>

                    {formData.is_pregnant && (
                      <div className="ml-6 pl-4 border-l-4 border-pink-400 py-2 space-y-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-900 mb-1">Due Date *</label>
                          <input
                            type="date"
                            name="pregnancy_due_date"
                            value={formData.pregnancy_due_date}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            className={`w-full px-3 py-2 text-sm bg-white border-2 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                              formErrors.pregnancy_due_date ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                          />
                          {formErrors.pregnancy_due_date && (
                            <p className="text-red-700 text-xs mt-1 font-bold">{formErrors.pregnancy_due_date}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-900 mb-1">Pregnancy Notes</label>
                          <textarea
                            name="pregnancy_notes"
                            value={formData.pregnancy_notes}
                            onChange={handleChange}
                            className="w-full px-3 py-2 text-sm bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                            rows="2"
                            placeholder="Special notes..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ✅ SECTION 6: MEDICAL INFO - COMPACT */}
                <div className="bg-white rounded-lg shadow-md border-2 border-gray-300 p-4">
                  <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2 pb-2 border-b-2 border-gray-300">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L11 4.323V3a1 1 0 011-1h-2zM5.5 8H7a1 1 0 010 2H5.5a1 1 0 010-2zm0 4H7a1 1 0 010 2H5.5a1 1 0 010-2z" />
                    </svg>
                    Medical Information
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-1">Medical Conditions</label>
                      <textarea
                        name="medical_conditions"
                        value={formData.medical_conditions}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows="2"
                        placeholder="Hypertension, Diabetes, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-1">Known Allergies</label>
                      <textarea
                        name="allergies"
                        value={formData.allergies}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows="2"
                        placeholder="Penicillin, Shellfish, etc."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ ERROR MESSAGE */}
            {error && (
              <div className="mt-4 px-4 py-3 bg-red-100 border-2 border-red-500 text-red-900 text-sm rounded-lg font-bold">
                ⚠️ {error}
              </div>
            )}
          </form>
        </div>

        {/* ✅ FOOTER ACTIONS - STICKY */}
        <div className="bg-white border-t-2 border-gray-300 shadow-lg px-6 py-3 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel || (() => window.history.back())}
            className="px-6 py-2 bg-white border-2 border-gray-400 text-gray-900 text-sm font-bold hover:bg-gray-100 transition-all rounded-lg shadow-sm"
          >
            CANCEL
          </button>
          {showDuplicateWarning && !forceSave && (
            <button
              type="button"
              onClick={handleForceSave}
              className="px-6 py-2 bg-amber-600 text-white text-sm hover:bg-amber-700 transition-all flex items-center gap-2 font-bold rounded-lg shadow-md"
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
            className="px-6 py-2 bg-blue-600 text-white text-sm hover:bg-blue-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-bold rounded-lg shadow-md"
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
                SAVE RESIDENT
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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