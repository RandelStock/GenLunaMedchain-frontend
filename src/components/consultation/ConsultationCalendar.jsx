import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaUserMd, FaUserNurse, FaVideo, FaPhone, FaMapMarkerAlt, FaCheck, FaTimes, FaEnvelope, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import API_BASE_URL from '../../config.js';
import ConsultationNotifications from './ConsultationNotifications';
import { useSearchParams } from 'react-router-dom';


const STATUS_COLORS = {
  SCHEDULED: 'bg-blue-500',
  CONFIRMED: 'bg-green-500',
  IN_PROGRESS: 'bg-yellow-500',
  COMPLETED: 'bg-gray-500',
  CANCELLED: 'bg-red-500',
  NO_SHOW: 'bg-orange-500'
};

const STATUS_LABELS = {
  SCHEDULED: 'Scheduled',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show'
};

const formatTo12Hour = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${minutes} ${ampm}`;
};

const ConsultationCalendar = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Combined useEffect for URL params and loading consultations
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam && dateParam !== selectedDate) {
      setSelectedDate(dateParam);
      return; // Exit early, let the next render load consultations
    }
    
    loadConsultations();
  }, [selectedDate, searchParams]);

  // Auto-open consultation from notification
  useEffect(() => {
    const consultationParam = searchParams.get('consultation');
    
    if (consultationParam && consultations.length > 0) {
      const consultation = consultations.find(
        c => c.consultation_id === parseInt(consultationParam)
      );
      
      if (consultation) {
        setSelectedConsultation(consultation);
        setShowDetailModal(true);
        
        // Clear the URL parameter after opening
        setSearchParams({});
      }
    }
  }, [consultations, searchParams, setSearchParams]);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      setError(null);
      const wallet = localStorage.getItem('connectedWalletAddress') || '';
      const token = localStorage.getItem('token') || '';
      
      const response = await fetch(
        `${API_BASE_URL}/consultations?date_from=${selectedDate}&date_to=${selectedDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-wallet-address': wallet
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to load consultations');
      }
      
      const data = await response.json();
      if (data.success) {
        setConsultations(data.data || []);
      } else {
        setConsultations([]);
      }
    } catch (error) {
      console.error('Error loading consultations:', error);
      setError('Failed to load consultations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (consultationId, newStatus) => {
    try {
      setUpdating(true);
      setError(null);
      setSuccessMessage(null);
      
      const token = localStorage.getItem('token') || '';
      const wallet = localStorage.getItem('connectedWalletAddress') || '';
      
      const response = await fetch(`${API_BASE_URL}/consultations/${consultationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-wallet-address': wallet
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update consultation status');
      }

      let message = 'Consultation updated successfully!';
      if (newStatus === 'CONFIRMED') {
        message = '✅ Consultation confirmed! Email sent to patient.';
      } else if (newStatus === 'CANCELLED') {
        message = '❌ Consultation cancelled. Email sent to patient.';
      } else if (newStatus === 'COMPLETED') {
        message = '✅ Consultation completed!';
      }
      
      setSuccessMessage(message);
      await loadConsultations();
      
      setTimeout(() => {
        setShowDetailModal(false);
        setSuccessMessage(null);
      }, 2000);
      
    } catch (error) {
      console.error('Error updating consultation:', error);
      setError(error.message || 'Failed to update consultation');
    } finally {
      setUpdating(false);
    }
  };

  const handlePreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const getConsultationsForTime = (time) => {
    return consultations.filter(c => c.scheduled_time === time);
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const renderDetailModal = () => {
    if (!selectedConsultation) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 z-10 rounded-t-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Consultation Details</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center text-2xl transition-colors"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {successMessage && (
              <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-3 flex items-center gap-2">
                <FaCheck className="text-green-600 text-base flex-shrink-0" />
                <p className="text-green-900 font-semibold text-sm">{successMessage}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 flex items-center gap-2">
                <FaTimes className="text-red-600 text-base flex-shrink-0" />
                <p className="text-red-900 font-semibold text-sm">{error}</p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Patient Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Name</p>
                  <p className="text-sm font-bold text-gray-900">{selectedConsultation.patient_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Phone</p>
                  <p className="text-sm font-bold text-gray-900">{selectedConsultation.patient_phone}</p>
                </div>
                {selectedConsultation.patient_email && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Email</p>
                    <p className="text-sm font-bold text-gray-900">{selectedConsultation.patient_email}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Gender</p>
                  <p className="text-sm font-bold text-gray-900">{selectedConsultation.patient_gender}</p>
                </div>
                {selectedConsultation.patient_age && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Age</p>
                    <p className="text-sm font-bold text-gray-900">{selectedConsultation.patient_age} years</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Barangay</p>
                  <p className="text-sm font-bold text-gray-900">{selectedConsultation.patient_barangay.replace(/_/g, ' ')}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Consultation Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Chief Complaint</p>
                  <p className="text-sm font-bold text-gray-900">{selectedConsultation.chief_complaint}</p>
                </div>
                {selectedConsultation.symptoms && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Symptoms</p>
                    <p className="text-sm font-bold text-gray-900">{selectedConsultation.symptoms}</p>
                  </div>
                )}
                {selectedConsultation.allergies && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Allergies ⚠️</p>
                    <p className="text-sm font-bold text-red-600">{selectedConsultation.allergies}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white ${STATUS_COLORS[selectedConsultation.status]}`}>
                    {STATUS_LABELS[selectedConsultation.status]}
                  </span>
                </div>
              </div>
            </div>

            {selectedConsultation.meeting_link && (
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FaVideo className="text-purple-600" />
                  Video Meeting
                </h3>
                <a
                  href={selectedConsultation.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-semibold transition-colors text-sm"
                >
                  <FaVideo />
                  Join Meeting
                </a>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-3 border-t-2 border-gray-200">
              {selectedConsultation.status === 'SCHEDULED' && (
                <button
                  onClick={() => handleStatusUpdate(selectedConsultation.consultation_id, 'CONFIRMED')}
                  disabled={updating}
                  className="flex-1 min-w-[140px] px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold transition-colors text-sm"
                >
                  {updating ? 'Confirming...' : (
                    <>
                      <FaCheck />
                      Confirm
                    </>
                  )}
                </button>
              )}
              {['SCHEDULED', 'CONFIRMED'].includes(selectedConsultation.status) && (
                <button
                  onClick={() => {
                    if (window.confirm('Cancel this consultation?')) {
                      handleStatusUpdate(selectedConsultation.consultation_id, 'CANCELLED');
                    }
                  }}
                  disabled={updating}
                  className="flex-1 min-w-[140px] px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold transition-colors text-sm"
                >
                  {updating ? 'Cancelling...' : (
                    <>
                      <FaTimes />
                      Cancel
                    </>
                  )}
                </button>
              )}
              {selectedConsultation.status === 'CONFIRMED' && (
                <button
                  onClick={() => handleStatusUpdate(selectedConsultation.consultation_id, 'IN_PROGRESS')}
                  disabled={updating}
                  className="flex-1 min-w-[140px] px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 font-semibold transition-colors text-sm"
                >
                  {updating ? 'Starting...' : 'Start'}
                </button>
              )}
              {selectedConsultation.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => handleStatusUpdate(selectedConsultation.consultation_id, 'COMPLETED')}
                  disabled={updating}
                  className="flex-1 min-w-[140px] px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors text-sm"
                >
                  {updating ? 'Completing...' : 'Complete'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Consultation Calendar</h1>
              <p className="text-gray-600 text-sm">Manage your appointments</p>
            </div>
            <ConsultationNotifications />
          </div>
        </div>
    
        {error && !showDetailModal && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 rounded-lg p-3">
            <p className="text-red-900 font-semibold text-sm">{error}</p>
          </div>
        )}

        {successMessage && !showDetailModal && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 rounded-lg p-3">
            <p className="text-green-900 font-semibold text-sm">{successMessage}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePreviousDay}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg p-2 transition-all"
                >
                  <FaChevronLeft className="text-lg" />
                </button>
                
                <div className="text-center">
                  <h2 className="text-xl font-bold text-white mb-1">
                    {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {consultations.length} {consultations.length === 1 ? 'appointment' : 'appointments'}
                  </p>
                </div>

                <button
                  onClick={handleNextDay}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg p-2 transition-all"
                >
                  <FaChevronRight className="text-lg" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleToday}
                  className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-4 py-2 rounded-lg transition-all text-sm"
                >
                  Today
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border-2 border-white rounded-lg font-semibold text-gray-900 bg-white text-sm"
                />
              </div>
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-900 font-semibold text-base">Loading...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {timeSlots.map((time) => {
                  const consultationsForTime = getConsultationsForTime(time);
                  const hasConsultations = consultationsForTime.length > 0;
                  
                  return (
                    <div
                      key={time}
                      className={`rounded-lg border-2 p-3 transition-all ${
                        hasConsultations 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FaClock className="text-gray-700 text-sm" />
                          <span className="font-bold text-gray-900 text-base">{formatTo12Hour(time)}</span>
                        </div>
                        {hasConsultations && (
                          <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                            {consultationsForTime.length}
                          </span>
                        )}
                      </div>
                      
                      {hasConsultations ? (
                        <div className="space-y-2">
                          {consultationsForTime.map((consultation) => (
                            <div
                              key={consultation.consultation_id}
                              onClick={() => {
                                setSelectedConsultation(consultation);
                                setShowDetailModal(true);
                              }}
                              className="bg-white rounded-lg p-3 cursor-pointer hover:shadow-md transition-all border-l-4 border-blue-500"
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  {consultation.assigned_doctor_id ? (
                                    <FaUserMd className="text-blue-600 text-base" />
                                  ) : (
                                    <FaUserNurse className="text-green-600 text-base" />
                                  )}
                                  <span className="font-bold text-gray-900 text-sm">{consultation.patient_name}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${STATUS_COLORS[consultation.status]}`}>
                                  {STATUS_LABELS[consultation.status]}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-2 font-medium text-sm">{consultation.chief_complaint}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-600">
                                <div className="flex items-center gap-1">
                                  <FaMapMarkerAlt />
                                  <span className="font-medium">{consultation.patient_barangay.replace(/_/g, ' ')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <FaPhone />
                                  <span className="font-medium">{consultation.patient_phone}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500 text-sm font-medium">No appointments</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {showDetailModal && renderDetailModal()}
      </div>
    </div>
  );
};

export default ConsultationCalendar;