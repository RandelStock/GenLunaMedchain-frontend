import React, { useState, useEffect } from 'react';
import { FaCheck } from 'react-icons/fa';
import API_BASE_URL from '../../config.js'; // ✅ FIXED: Import from config

const API_URL = API_BASE_URL; // ✅ FIXED: Use real API URL

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

const CONSULTATION_TYPES = [
  { value: 'GENERAL', label: 'General Consultation' },
  { value: 'FOLLOW_UP', label: 'Follow-up Visit' },
  { value: 'EMERGENCY', label: 'Emergency Consultation' },
  { value: 'PREVENTIVE', label: 'Preventive Care' },
  { value: 'SPECIALIST', label: 'Specialist Consultation' }
];

const ConsultationBookingForm = ({ 
  onSuccess, 
  onCancel, 
  prefilledData,
  initialDate,
  initialTime,
  initialProviderType,
  initialProviderId,
  initialProviderName
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_email: '',
    patient_phone: '',
    patient_age: '',
    patient_gender: 'MALE',
    patient_barangay: '',
    patient_address: '',
    chief_complaint: '',
    symptoms: '',
    medical_history: '',
    current_medications: '',
    allergies: '',
    consultation_type: 'GENERAL',
    scheduled_date: '',
    scheduled_time: '',
    provider_type: 'doctor',
    assigned_doctor_id: '',
    assigned_nurse_id: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    if (prefilledData) {
      console.log('Prefilled data received:', prefilledData);
      setFormData(prev => ({
        ...prev,
        scheduled_date: prefilledData.date || '',
        scheduled_time: prefilledData.time || '',
        provider_type: prefilledData.providerType || 'doctor',
        assigned_doctor_id: prefilledData.providerType === 'doctor' ? (prefilledData.providerId || '') : '',
        assigned_nurse_id: prefilledData.providerType === 'nurse' ? (prefilledData.providerId || '') : ''
      }));
    } else if (initialDate || initialTime) {
      console.log('Initial data received:', { initialDate, initialTime, initialProviderType, initialProviderId, initialProviderName });
      setFormData(prev => ({
        ...prev,
        scheduled_date: initialDate || '',
        scheduled_time: initialTime || '',
        provider_type: initialProviderType || 'doctor',
        assigned_doctor_id: initialProviderType === 'doctor' ? (initialProviderId || '') : '',
        assigned_nurse_id: initialProviderType === 'nurse' ? (initialProviderId || '') : ''
      }));
    }
  }, [prefilledData, initialDate, initialTime, initialProviderType, initialProviderId, initialProviderName]);

  useEffect(() => {
    if (formData.scheduled_date && (formData.assigned_doctor_id || formData.assigned_nurse_id)) {
      loadAvailableSlots();
    }
  }, [formData.scheduled_date, formData.assigned_doctor_id, formData.assigned_nurse_id]);

  // ✅ ENHANCED: Better error handling for API calls
  const loadProviders = async () => {
    try {
      console.log('Loading providers from:', API_URL); // ✅ Debug log
      
      const [doctorsRes, nursesRes] = await Promise.all([
        fetch(`${API_URL}/consultations/available-doctors`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        }),
        fetch(`${API_URL}/consultations/available-nurses`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        })
      ]);
      
      // ✅ Check for HTTP errors
      if (!doctorsRes.ok) {
        throw new Error(`Failed to load doctors: ${doctorsRes.status} ${doctorsRes.statusText}`);
      }
      if (!nursesRes.ok) {
        throw new Error(`Failed to load nurses: ${nursesRes.status} ${nursesRes.statusText}`);
      }
      
      const doctorsData = await doctorsRes.json();
      const nursesData = await nursesRes.json();
      
      console.log('Doctors loaded:', doctorsData.data?.length || 0);
      console.log('Nurses loaded:', nursesData.data?.length || 0);
      
      setDoctors(doctorsData.data || []);
      setNurses(nursesData.data || []);
    } catch (error) {
      console.error('Error loading providers:', error);
      // ✅ Show user-friendly error
      setError(`Failed to load healthcare providers. Please check your connection and try again. (${error.message})`);
    }
  };

  const loadAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      setError(null); // ✅ Clear previous errors
      
      const params = new URLSearchParams({ date: formData.scheduled_date });
      
      if (formData.provider_type === 'doctor' && formData.assigned_doctor_id) {
        params.append('doctor_id', formData.assigned_doctor_id);
      } else if (formData.provider_type === 'nurse' && formData.assigned_nurse_id) {
        params.append('nurse_id', formData.assigned_nurse_id);
      }
      
      console.log('Loading slots:', params.toString());
      const response = await fetch(`${API_URL}/consultations/available-slots?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      // ✅ Check for HTTP errors
      if (!response.ok) {
        throw new Error(`Failed to load time slots: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('Slots response:', data);
      setAvailableSlots(data.success ? (data.data || []) : []);
    } catch (error) {
      console.error('Error loading slots:', error);
      setAvailableSlots([]);
      // ✅ Show user-friendly error for slots
      setError(`Failed to load available time slots. ${error.message}`);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'assigned_doctor_id' || name === 'assigned_nurse_id') {
      setAvailableSlots([]);
      setFormData(prev => ({ ...prev, scheduled_time: '' }));
    }
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateStep = (stepNumber) => {
    const errors = {};
    
    if (stepNumber === 1) {
      if (!formData.scheduled_date) errors.scheduled_date = 'Date is required';
      if (!formData.scheduled_time) errors.scheduled_time = 'Time slot is required';
      if (formData.provider_type === 'doctor' && !formData.assigned_doctor_id) {
        errors.assigned_doctor_id = 'Doctor selection is required';
      }
      if (formData.provider_type === 'nurse' && !formData.assigned_nurse_id) {
        errors.assigned_nurse_id = 'Nurse selection is required';
      }
    } else if (stepNumber === 2) {
      if (!formData.patient_name.trim()) errors.patient_name = 'Patient name is required';
      if (!formData.patient_phone.trim()) errors.patient_phone = 'Phone number is required';
      if (!formData.patient_barangay) errors.patient_barangay = 'Barangay is required';
      if (formData.patient_email && !/\S+@\S+\.\S+/.test(formData.patient_email)) {
        errors.patient_email = 'Invalid email format';
      }
    } else if (stepNumber === 3) {
      if (!formData.chief_complaint.trim()) errors.chief_complaint = 'Chief complaint is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      setError(null); // ✅ Clear errors when moving to next step
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
    setError(null); // ✅ Clear errors when going back
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      alert('Please complete all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const submissionData = {
        ...formData,
        patient_age: formData.patient_age ? parseInt(formData.patient_age) : null,
        assigned_doctor_id: formData.provider_type === 'doctor' ? formData.assigned_doctor_id : null,
        assigned_nurse_id: formData.provider_type === 'nurse' ? formData.assigned_nurse_id : null
      };
      
      console.log('Submitting consultation:', submissionData); // ✅ Debug log
      
      const response = await fetch(`${API_URL}/consultations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to schedule consultation (${response.status})`);
      }

      const result = await response.json();
      console.log('Consultation created:', result); // ✅ Debug log
      
      alert('✅ Consultation scheduled successfully!');
      onSuccess?.(result.data);
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-lg sm:text-xl font-semibold text-black mb-3 sm:mb-4">Schedule Consultation</h3>
            
            {/* ✅ Show connection error at top of form */}
            {error && (
              <div className="bg-red-50 border-2 border-red-400 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-bold text-red-900 text-sm">{error}</p>
                    <button
                      onClick={loadProviders}
                      className="mt-2 text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
                    >
                      Retry Connection
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {(prefilledData || initialDate) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <FaCheck className="text-green-600 flex-shrink-0" />
                  <p className="font-semibold text-green-900 text-sm sm:text-base">Time Slot Selected</p>
                </div>
                <p className="text-xs sm:text-sm text-green-800">
                  {new Date(prefilledData?.date || initialDate).toLocaleDateString()} at {prefilledData?.time || initialTime}
                  {(prefilledData?.providerName || initialProviderName) && ` with ${prefilledData?.providerName || initialProviderName}`}
                </p>
                <p className="text-xs text-green-700 mt-1">You can change these details below if needed</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Consultation Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="scheduled_date"
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                />
                {formErrors.scheduled_date && <p className="text-red-500 text-xs mt-1">{formErrors.scheduled_date}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Provider Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="provider_type"
                  value={formData.provider_type}
                  onChange={(e) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      provider_type: e.target.value,
                      assigned_doctor_id: '',
                      assigned_nurse_id: '',
                      scheduled_time: ''
                    }));
                    setAvailableSlots([]);
                  }}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                </select>
              </div>
            </div>
            {formData.provider_type === 'doctor' && (
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Select Doctor <span className="text-red-500">*</span>
                </label>
                <select
                  name="assigned_doctor_id"
                  value={formData.assigned_doctor_id}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map(doctor => {
                    const spec = doctor.provider_specializations?.[0];
                    const specText = spec ? `${spec.specialization}${spec.years_experience ? ` (${spec.years_experience} years)` : ''}` : 'General Medicine';
                    return (
                      <option key={doctor.user_id} value={doctor.user_id}>
                        Dr. {doctor.full_name} - {specText} ({doctor.assigned_barangay || 'Municipal'})
                      </option>
                    );
                  })}
                </select>
                {formErrors.assigned_doctor_id && <p className="text-red-500 text-xs mt-1">{formErrors.assigned_doctor_id}</p>}
              </div>
            )}
            {formData.provider_type === 'nurse' && (
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Select Nurse <span className="text-red-500">*</span>
                </label>
                <select
                  name="assigned_nurse_id"
                  value={formData.assigned_nurse_id}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  <option value="">Select Nurse</option>
                  {nurses.map(nurse => {
                    const spec = nurse.provider_specializations?.[0];
                    const specText = spec ? `${spec.specialization}${spec.years_experience ? ` (${spec.years_experience} years)` : ''}` : 'General Nursing';
                    return (
                      <option key={nurse.user_id} value={nurse.user_id}>
                        {nurse.full_name} - {specText} ({nurse.assigned_barangay || 'Municipal'})
                      </option>
                    );
                  })}
                </select>
                {formErrors.assigned_nurse_id && <p className="text-red-500 text-xs mt-1">{formErrors.assigned_nurse_id}</p>}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Available Time Slots <span className="text-red-500">*</span>
              </label>
              {loadingSlots ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-black mt-2 text-sm">Loading available slots...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-300">
                  <p className="text-black text-sm font-medium">No available time slots for the selected date and provider.</p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">Please select a different date or provider.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, scheduled_time: slot.time }))}
                      disabled={!slot.available}
                      className={`p-2 sm:p-3 text-xs sm:text-sm rounded-lg border transition-colors font-medium ${
                        slot.available
                          ? formData.scheduled_time === slot.time
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-black border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                          : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
              {formErrors.scheduled_time && <p className="text-red-500 text-xs mt-1">{formErrors.scheduled_time}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-lg sm:text-xl font-semibold text-black mb-3 sm:mb-4">Patient Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-black mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="patient_name"
                  value={formData.patient_name}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Enter your full name"
                />
                {formErrors.patient_name && <p className="text-red-500 text-xs mt-1">{formErrors.patient_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="patient_phone"
                  value={formData.patient_phone}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="09XXXXXXXXX"
                />
                {formErrors.patient_phone && <p className="text-red-500 text-xs mt-1">{formErrors.patient_phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Email</label>
                <input
                  type="email"
                  name="patient_email"
                  value={formData.patient_email}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="your.email@example.com"
                />
                {formErrors.patient_email && <p className="text-red-500 text-xs mt-1">{formErrors.patient_email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Age</label>
                <input
                  type="number"
                  name="patient_age"
                  value={formData.patient_age}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Age"
                  min="0"
                  max="120"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Gender</label>
                <select
                  name="patient_gender"
                  value={formData.patient_gender}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  {GENDERS.map(gender => (
                    <option key={gender.value} value={gender.value}>{gender.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-black mb-2">
                  Barangay <span className="text-red-500">*</span>
                </label>
                <select
                  name="patient_barangay"
                  value={formData.patient_barangay}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  <option value="">Select Barangay</option>
                  {BARANGAYS.map(barangay => (
                    <option key={barangay.value} value={barangay.value}>{barangay.label}</option>
                  ))}
                </select>
                {formErrors.patient_barangay && <p className="text-red-500 text-xs mt-1">{formErrors.patient_barangay}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Address</label>
              <textarea
                name="patient_address"
                value={formData.patient_address}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Enter your complete address"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-lg sm:text-xl font-semibold text-black mb-3 sm:mb-4">Medical Information</h3>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Chief Complaint <span className="text-red-500">*</span>
              </label>
              <textarea
                name="chief_complaint"
                value={formData.chief_complaint}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Describe your main concern or symptoms"
              />
              {formErrors.chief_complaint && <p className="text-red-500 text-xs mt-1">{formErrors.chief_complaint}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Symptoms</label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Describe any symptoms you're experiencing"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Medical History</label>
              <textarea
                name="medical_history"
                value={formData.medical_history}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Any relevant medical history or previous conditions"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Current Medications</label>
              <textarea
                name="current_medications"
                value={formData.current_medications}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="List any medications you're currently taking"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Allergies</label>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="List any allergies or adverse reactions"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Consultation Type</label>
              <select
                name="consultation_type"
                value={formData.consultation_type}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              >
                {CONSULTATION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 4:
        const selectedProvider = formData.provider_type === 'doctor'
          ? doctors.find(d => d.user_id === formData.assigned_doctor_id)
          : nurses.find(n => n.user_id === formData.assigned_nurse_id);
        
        return (
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-lg sm:text-xl font-semibold text-black mb-3 sm:mb-4">Confirm Your Consultation</h3>
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-black mb-2 text-sm sm:text-base">Patient Information</h4>
                  <div className="space-y-1 text-xs sm:text-sm text-black">
                    <p><strong>Name:</strong> {formData.patient_name}</p>
                    <p><strong>Phone:</strong> {formData.patient_phone}</p>
                    {formData.patient_email && <p><strong>Email:</strong> {formData.patient_email}</p>}
                    {formData.patient_age && <p><strong>Age:</strong> {formData.patient_age}</p>}
                    <p><strong>Gender:</strong> {GENDERS.find(g => g.value === formData.patient_gender)?.label}</p>
                    <p><strong>Barangay:</strong> {BARANGAYS.find(b => b.value === formData.patient_barangay)?.label}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-black mb-2 text-sm sm:text-base">Consultation Details</h4>
                  <div className="space-y-1 text-xs sm:text-sm text-black">
                    <p><strong>Date:</strong> {new Date(formData.scheduled_date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {formData.scheduled_time}</p>
                    <p><strong>Type:</strong> {CONSULTATION_TYPES.find(t => t.value === formData.consultation_type)?.label}</p>
                    <p><strong>Provider Type:</strong> {formData.provider_type === 'doctor' ? 'Doctor' : 'Nurse'}</p>
                    {selectedProvider && (
                      <p><strong>Provider:</strong> {formData.provider_type === 'doctor' ? 'Dr. ' : ''}{selectedProvider.full_name}</p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-black mb-2 text-sm sm:text-base">Chief Complaint</h4>
                <p className="text-xs sm:text-sm text-black bg-white p-3 rounded border">
                  {formData.chief_complaint}
                </p>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                  <p className="text-red-800 text-xs sm:text-sm font-semibold">{error}</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-2xl font-bold text-black">Schedule Online Consultation</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl font-bold leading-none">×</button>
        </div>
      </div>
      
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-center mb-6 sm:mb-8 overflow-x-auto">
          <div className="flex items-center min-w-max">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                  step >= stepNumber ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`w-12 sm:w-16 h-1 mx-1 sm:mx-2 ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {renderStepContent()}
        
        <div className="flex justify-between mt-6 sm:mt-8 gap-2 sm:gap-0">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="px-4 sm:px-6 py-2 text-sm sm:text-base border border-gray-300 rounded-lg text-black hover:bg-gray-50 transition-colors font-medium"
              >
                Previous
              </button>
            )}
          </div>
          <div>
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <span className="whitespace-nowrap">{loading ? 'Scheduling...' : 'Confirm & Schedule'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationBookingForm;