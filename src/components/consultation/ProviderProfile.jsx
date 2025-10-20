// frontend/src/components/consultation/ProviderProfile.jsx
import React, { useState, useEffect } from 'react';
import { FaUserMd, FaUserNurse, FaClock, FaCalendarAlt, FaEdit, FaSave, FaTimes, FaPlus, FaTrash, FaStar } from 'react-icons/fa';
import API_BASE_URL from '../../config.js';

const API_URL = API_BASE_URL;

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

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00'
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

const ProviderProfile = ({ providerId, onClose }) => {
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    assigned_barangay: '',
    is_active: true
  });
  
  const [availabilityForm, setAvailabilityForm] = useState({
    day_of_week: 1,
    start_time: '08:00',
    end_time: '17:00',
    break_start_time: '',
    break_end_time: '',
    slot_duration: 30,
    max_consultations: 10
  });
  
  const [specializationForm, setSpecializationForm] = useState({
    specialization: '',
    description: '',
    years_experience: '',
    is_primary: false
  });

  useEffect(() => {
    if (providerId) {
      loadProvider();
    }
  }, [providerId]);

  const loadProvider = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/provider-profiles/${providerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setProvider(data.data);
        setProfileForm({
          full_name: data.data.full_name || '',
          email: data.data.email || '',
          phone: data.data.phone || '',
          assigned_barangay: data.data.assigned_barangay || '',
          is_active: data.data.is_active
        });
      }
    } catch (error) {
      console.error('Error loading provider:', error);
      setError('Failed to load provider profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/provider-profiles/${providerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profileForm)
      });
      
      const data = await response.json();
      if (data.success) {
        setProvider(data.data);
        alert('Profile updated successfully!');
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvailabilitySubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/provider-profiles/${providerId}/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(availabilityForm)
      });
      
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        loadProvider(); // Reload to get updated availability
        setAvailabilityForm({
          day_of_week: 1,
          start_time: '08:00',
          end_time: '17:00',
          break_start_time: '',
          break_end_time: '',
          slot_duration: 30,
          max_consultations: 10
        });
      } else {
        throw new Error(data.message || 'Failed to update availability');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAvailability = async (dayOfWeek) => {
    if (!confirm('Are you sure you want to remove availability for this day?')) {
      return;
    }
    
    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/provider-profiles/${providerId}/availability/${dayOfWeek}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        loadProvider();
      }
    } catch (error) {
      console.error('Error removing availability:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSpecialization = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/provider-profiles/${providerId}/specializations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(specializationForm)
      });
      
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        loadProvider();
        setSpecializationForm({
          specialization: '',
          description: '',
          years_experience: '',
          is_primary: false
        });
      }
    } catch (error) {
      console.error('Error adding specialization:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSpecialization = async (specializationId) => {
    if (!confirm('Are you sure you want to remove this specialization?')) {
      return;
    }
    
    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/provider-profiles/${providerId}/specializations/${specializationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        loadProvider();
      }
    } catch (error) {
      console.error('Error removing specialization:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const getDayAvailability = (dayOfWeek) => {
    return provider?.provider_availability?.find(av => av.day_of_week === dayOfWeek && av.is_active);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading provider profile...</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <p className="text-red-600">Provider not found</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {provider.role === 'ADMIN' ? (
                <FaUserMd className="text-2xl text-blue-600" />
              ) : (
                <FaUserNurse className="text-2xl text-green-600" />
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {provider.role === 'ADMIN' ? 'Doctor' : 'Nurse'} Profile
                </h2>
                <p className="text-gray-600">{provider.full_name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'profile', label: 'Profile', icon: FaEdit },
              { id: 'availability', label: 'Availability', icon: FaClock },
              { id: 'specializations', label: 'Specializations', icon: FaStar }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
              
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned Barangay
                    </label>
                    <select
                      value={profileForm.assigned_barangay}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, assigned_barangay: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={profileForm.is_active}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Active Provider
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <FaSave />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Availability Tab */}
          {activeTab === 'availability' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Weekly Availability Schedule</h3>
              </div>

              {/* Add New Availability */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">Add/Update Availability</h4>
                <form onSubmit={handleAvailabilitySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Day of Week
                      </label>
                      <select
                        value={availabilityForm.day_of_week}
                        onChange={(e) => setAvailabilityForm(prev => ({ ...prev, day_of_week: parseInt(e.target.value) }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        {DAYS_OF_WEEK.map(day => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                      </label>
                      <select
                        value={availabilityForm.start_time}
                        onChange={(e) => setAvailabilityForm(prev => ({ ...prev, start_time: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        {TIME_SLOTS.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <select
                        value={availabilityForm.end_time}
                        onChange={(e) => setAvailabilityForm(prev => ({ ...prev, end_time: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        {TIME_SLOTS.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Break Start
                      </label>
                      <select
                        value={availabilityForm.break_start_time}
                        onChange={(e) => setAvailabilityForm(prev => ({ ...prev, break_start_time: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">No Break</option>
                        {TIME_SLOTS.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Break End
                      </label>
                      <select
                        value={availabilityForm.break_end_time}
                        onChange={(e) => setAvailabilityForm(prev => ({ ...prev, break_end_time: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">No Break</option>
                        {TIME_SLOTS.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Slot Duration (min)
                      </label>
                      <select
                        value={availabilityForm.slot_duration}
                        onChange={(e) => setAvailabilityForm(prev => ({ ...prev, slot_duration: parseInt(e.target.value) }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>60 minutes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Consultations/Day
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={availabilityForm.max_consultations}
                        onChange={(e) => setAvailabilityForm(prev => ({ ...prev, max_consultations: parseInt(e.target.value) }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <FaPlus />
                    {saving ? 'Saving...' : 'Save Availability'}
                  </button>
                </form>
              </div>

              {/* Current Availability */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Current Schedule</h4>
                <div className="space-y-3">
                  {DAYS_OF_WEEK.map(day => {
                    const availability = getDayAvailability(day.value);
                    return (
                      <div key={day.value} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-20 font-medium text-gray-900">{day.label}</div>
                          {availability ? (
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <FaClock />
                                {availability.start_time} - {availability.end_time}
                              </span>
                              {availability.break_start_time && availability.break_end_time && (
                                <span className="text-orange-600">
                                  Break: {availability.break_start_time} - {availability.break_end_time}
                                </span>
                              )}
                              <span>{availability.slot_duration}min slots</span>
                              <span>Max: {availability.max_consultations}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not available</span>
                          )}
                        </div>
                        {availability && (
                          <button
                            onClick={() => handleRemoveAvailability(day.value)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Specializations Tab */}
          {activeTab === 'specializations' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Specializations</h3>
              </div>

              {/* Add Specialization */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">Add Specialization</h4>
                <form onSubmit={handleAddSpecialization} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specialization
                      </label>
                      <select
                        value={specializationForm.specialization}
                        onChange={(e) => setSpecializationForm(prev => ({ ...prev, specialization: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Specialization</option>
                        {SPECIALIZATIONS.map(spec => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={specializationForm.years_experience}
                        onChange={(e) => setSpecializationForm(prev => ({ ...prev, years_experience: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={specializationForm.description}
                      onChange={(e) => setSpecializationForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Additional details about this specialization..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_primary_spec"
                      checked={specializationForm.is_primary}
                      onChange={(e) => setSpecializationForm(prev => ({ ...prev, is_primary: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="is_primary_spec" className="text-sm font-medium text-gray-700">
                      Primary Specialization
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <FaPlus />
                    {saving ? 'Adding...' : 'Add Specialization'}
                  </button>
                </form>
              </div>

              {/* Current Specializations */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Current Specializations</h4>
                {provider.provider_specializations && provider.provider_specializations.length > 0 ? (
                  <div className="space-y-3">
                    {provider.provider_specializations.map(spec => (
                      <div key={spec.specialization_id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium text-gray-900">{spec.specialization}</h5>
                            {spec.is_primary && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center gap-1">
                                <FaStar />
                                Primary
                              </span>
                            )}
                          </div>
                          {spec.description && (
                            <p className="text-sm text-gray-600 mt-1">{spec.description}</p>
                          )}
                          {spec.years_experience && (
                            <p className="text-sm text-gray-500 mt-1">
                              {spec.years_experience} years of experience
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveSpecialization(spec.specialization_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No specializations added yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderProfile;
