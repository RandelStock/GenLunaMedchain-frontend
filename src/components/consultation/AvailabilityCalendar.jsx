import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaCheck, FaTimes, FaUserMd, FaUserNurse } from 'react-icons/fa';
import API_BASE_URL from '../../config.js';

const AvailabilityCalendar = ({ onTimeSlotSelect }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [providerType, setProviderType] = useState('doctor');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    if (selectedProviderId) {
      loadAvailability();
    }
  }, [selectedDate, selectedProviderId]);

  const loadProviders = async () => {
    try {
      const [doctorsRes, nursesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/consultations/available-doctors`),
        fetch(`${API_BASE_URL}/consultations/available-nurses`)
      ]);
      
      const doctorsData = await doctorsRes.json();
      const nursesData = await nursesRes.json();
      
      const doctorsList = doctorsData.data || [];
      const nursesList = nursesData.data || [];
      
      setDoctors(doctorsList);
      setNurses(nursesList);
      
      // Auto-select first doctor
      if (doctorsList.length > 0) {
        setSelectedProviderId(doctorsList[0].user_id);
      }
    } catch (error) {
      console.error('Error loading providers:', error);
    }
  };

  const loadAvailability = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        date: selectedDate
      });
      
      if (providerType === 'doctor' && selectedProviderId) {
        params.append('doctor_id', selectedProviderId);
      } else if (providerType === 'nurse' && selectedProviderId) {
        params.append('nurse_id', selectedProviderId);
      }
      
      const response = await fetch(`${API_BASE_URL}/consultations/available-slots?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load availability');
      }

      const data = await response.json();
      
      if (data.success) {
        setAvailability(data.data || []);
      } else {
        setAvailability([]);
      }
    } catch (error) {
      console.error('Error loading availability:', error);
      setError('Failed to load availability. Please try again.');
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (days) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    const newDate = currentDate.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    if (newDate >= today) {
      setSelectedDate(newDate);
    }
  };

  const handleProviderTypeChange = (type) => {
    setProviderType(type);
    setSelectedProviderId('');
    setAvailability([]);
    
    // Auto-select first provider of the new type
    if (type === 'doctor' && doctors.length > 0) {
      setSelectedProviderId(doctors[0].user_id);
    } else if (type === 'nurse' && nurses.length > 0) {
      setSelectedProviderId(nurses[0].user_id);
    }
  };

  const handleTimeSlotClick = (slot) => {
    if (slot.available && onTimeSlotSelect) {
      const selectedProvider = providerType === 'doctor' 
        ? doctors.find(d => d.user_id === selectedProviderId)
        : nurses.find(n => n.user_id === selectedProviderId);
      
      onTimeSlotSelect({
        date: selectedDate,
        time: slot.time,
        providerType: providerType,
        providerId: selectedProviderId,
        providerName: selectedProvider?.full_name || ''
      });
    }
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const isPast = new Date(selectedDate) < new Date(new Date().toISOString().split('T')[0]);

  const currentProviders = providerType === 'doctor' ? doctors : nurses;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">Check Availability</h2>
          <FaCalendarAlt className="text-2xl sm:text-3xl opacity-80" />
        </div>
        <p className="text-sm sm:text-base text-blue-100">
          Find the perfect time for your consultation
        </p>
      </div>

      {/* Provider Selection */}
      <div className="border-b border-gray-200 p-4 sm:p-6 bg-gray-50">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3">Select Healthcare Provider</h3>
        
        {/* Provider Type Toggle */}
        <div className="flex gap-2 mb-3 sm:mb-4">
          <button
            onClick={() => handleProviderTypeChange('doctor')}
            className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-medium transition-all flex items-center justify-center gap-2 ${
              providerType === 'doctor'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FaUserMd className="text-sm sm:text-base" />
            <span className="hidden xs:inline">Doctor</span>
            <span className="xs:hidden">Doc</span>
          </button>
          <button
            onClick={() => handleProviderTypeChange('nurse')}
            className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-medium transition-all flex items-center justify-center gap-2 ${
              providerType === 'nurse'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FaUserNurse className="text-sm sm:text-base" />
            Nurse
          </button>
        </div>

        {/* Provider Selection Dropdown */}
        <select
          value={selectedProviderId}
          onChange={(e) => setSelectedProviderId(e.target.value)}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-900"
        >
          <option value="">Select {providerType === 'doctor' ? 'Doctor' : 'Nurse'}</option>
          {currentProviders.map(provider => {
            const primarySpecialization = provider.provider_specializations?.[0];
            const specializationText = primarySpecialization 
              ? `${primarySpecialization.specialization}${primarySpecialization.years_experience ? ` (${primarySpecialization.years_experience} years)` : ''}`
              : providerType === 'doctor' ? 'General Medicine' : 'General Nursing';
            
            return (
              <option key={provider.user_id} value={provider.user_id}>
                {providerType === 'doctor' ? 'Dr. ' : ''}{provider.full_name} - {specializationText} ({provider.assigned_barangay || 'Municipal'})
              </option>
            );
          })}
        </select>
      </div>

      {/* Date Navigation */}
      <div className="border-b border-gray-200 p-4 sm:p-6 bg-gray-50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <button
            onClick={() => handleDateChange(-1)}
            disabled={isPast}
            className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-black"
          >
            ← Previous
          </button>
          
          <div className="text-center w-full sm:w-auto">
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-900"
            />
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          <button
            onClick={() => handleDateChange(1)}
            className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-black"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="border-b border-gray-200 p-3 sm:p-4 bg-gray-50">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded"></div>
            <span className="text-gray-700">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-300 rounded"></div>
            <span className="text-gray-700">Unavailable</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="m-4 sm:m-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <p className="text-sm sm:text-base text-red-800">{error}</p>
        </div>
      )}

      {/* Time Slots Grid */}
      <div className="p-4 sm:p-6">
        {!selectedProviderId ? (
          <div className="text-center py-8 sm:py-12">
            <FaUserMd className="text-gray-400 text-4xl sm:text-5xl mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-600 px-4">Please select a healthcare provider to view available time slots</p>
          </div>
        ) : loading ? (
          <div className="text-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
            <p className="text-sm sm:text-base text-gray-600">Loading availability...</p>
          </div>
        ) : availability.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <FaClock className="text-gray-400 text-4xl sm:text-5xl mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-600 mb-2 px-4">No available time slots for the selected date and provider</p>
            <p className="text-xs sm:text-sm text-gray-500 px-4">Please select a different date or provider</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {availability.map((slot, index) => {
              const isUnavailable = !slot.available;
              
              return (
                <button
                  key={index}
                  onClick={() => handleTimeSlotClick(slot)}
                  disabled={isUnavailable}
                  className={`
                    relative p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all text-left
                    ${isUnavailable 
                      ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60' 
                      : 'bg-green-50 border-green-300 hover:border-green-400 hover:shadow-lg active:scale-95 sm:hover:scale-105 cursor-pointer'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <FaClock className={`text-sm sm:text-base
                      ${isUnavailable ? 'text-gray-400' : 'text-green-600'}
                    `} />
                    {isUnavailable ? (
                      <FaTimes className="text-red-500 text-sm sm:text-base" />
                    ) : (
                      <FaCheck className="text-green-600 text-sm sm:text-base" />
                    )}
                  </div>
                  
                  <div className={`font-bold text-base sm:text-lg mb-0.5 sm:mb-1 ${
                    isUnavailable ? 'text-gray-600' : 'text-green-900'
                  }`}>
                    {slot.time}
                  </div>
                  
                  <div className={`text-xs font-medium ${
                    isUnavailable ? 'text-gray-500' : 'text-green-700'
                  }`}>
                    {isUnavailable ? 'Unavailable' : 'Available'}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="border-t border-gray-200 bg-blue-50 p-4 sm:p-6">
        <div className="flex items-start gap-2 sm:gap-3">
          <FaUserMd className="text-blue-600 text-lg sm:text-xl mt-0.5 sm:mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-1">How it works</h3>
            <p className="text-xs sm:text-sm text-gray-700">
              Select a healthcare provider, choose a date, then click on an available time slot to proceed with booking your consultation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;