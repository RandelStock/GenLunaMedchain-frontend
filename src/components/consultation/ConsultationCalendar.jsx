import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaUserMd, FaUserNurse, FaVideo, FaPhone, FaMapMarkerAlt, FaCheck, FaTimes, FaEnvelope, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import API_BASE_URL from '../../config.js';

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

  useEffect(() => {
    loadConsultations();
  }, [selectedDate]);

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
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 z-10 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Consultation Details</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-10 h-10 flex items-center justify-center text-2xl transition-colors"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {successMessage && (
              <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 flex items-center gap-3">
                <FaCheck className="text-green-600 text-xl flex-shrink-0" />
                <p className="text-green-900 font-medium">{successMessage}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-center gap-3">
                <FaTimes className="text-red-600 text-xl flex-shrink-0" />
                <p className="text-red-900 font-medium">{error}</p>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Patient Information</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Name</p>
                  <p className="text-lg font-bold text-gray-900">{selectedConsultation.patient_name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Phone</p>
                  <p className="text-lg font-bold text-gray-900">{selectedConsultation.patient_phone}</p>
                </div>
                {selectedConsultation.patient_email && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Email</p>
                    <p className="text-lg font-bold text-gray-900">{selectedConsultation.patient_email}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Gender</p>
                  <p className="text-lg font-bold text-gray-900">{selectedConsultation.patient_gender}</p>
                </div>
                {selectedConsultation.patient_age && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Age</p>
                    <p className="text-lg font-bold text-gray-900">{selectedConsultation.patient_age} years</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Barangay</p>
                  <p className="text-lg font-bold text-gray-900">{selectedConsultation.patient_barangay.replace(/_/g, ' ')}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 space-y-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Consultation Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Chief Complaint</p>
                  <p className="text-lg font-bold text-gray-900">{selectedConsultation.chief_complaint}</p>
                </div>
                {selectedConsultation.symptoms && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Symptoms</p>
                    <p className="text-lg font-bold text-gray-900">{selectedConsultation.symptoms}</p>
                  </div>
                )}
                {selectedConsultation.allergies && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Allergies ⚠️</p>
                    <p className="text-lg font-bold text-red-600">{selectedConsultation.allergies}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Status</p>
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold text-white ${STATUS_COLORS[selectedConsultation.status]}`}>
                    {STATUS_LABELS[selectedConsultation.status]}
                  </span>
                </div>
              </div>
            </div>

            {selectedConsultation.meeting_link && (
              <div className="bg-purple-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FaVideo className="text-purple-600" />
                  Video Meeting
                </h3>
                <a
                  href={selectedConsultation.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-bold transition-colors text-lg"
                >
                  <FaVideo />
                  Join Meeting
                </a>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-gray-200">
              {selectedConsultation.status === 'SCHEDULED' && (
                <button
                  onClick={() => handleStatusUpdate(selectedConsultation.consultation_id, 'CONFIRMED')}
                  disabled={updating}
                  className="flex-1 min-w-[180px] px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 font-bold transition-colors text-lg"
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
                  className="flex-1 min-w-[180px] px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 font-bold transition-colors text-lg"
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
                  className="flex-1 min-w-[180px] px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 font-bold transition-colors text-lg"
                >
                  {updating ? 'Starting...' : 'Start'}
                </button>
              )}
              {selectedConsultation.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => handleStatusUpdate(selectedConsultation.consultation_id, 'COMPLETED')}
                  disabled={updating}
                  className="flex-1 min-w-[180px] px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-bold transition-colors text-lg"
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Consultation Calendar</h1>
          <p className="text-gray-600 text-lg">Manage your appointments</p>
        </div>

        {error && !showDetailModal && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
            <p className="text-red-900 font-bold text-lg">{error}</p>
          </div>
        )}

        {successMessage && !showDetailModal && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
            <p className="text-green-900 font-bold text-lg">{successMessage}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePreviousDay}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg p-3 transition-all"
                >
                  <FaChevronLeft className="text-xl" />
                </button>
                
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white mb-1">
                    {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </h2>
                  <p className="text-blue-100 text-lg">
                    {consultations.length} {consultations.length === 1 ? 'appointment' : 'appointments'}
                  </p>
                </div>

                <button
                  onClick={handleNextDay}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg p-3 transition-all"
                >
                  <FaChevronRight className="text-xl" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleToday}
                  className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-6 py-3 rounded-lg transition-all text-lg"
                >
                  Today
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-3 border-2 border-white rounded-lg font-bold text-gray-900 bg-white text-lg"
                />
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-900 font-bold text-xl">Loading...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {timeSlots.map((time) => {
                  const consultationsForTime = getConsultationsForTime(time);
                  const hasConsultations = consultationsForTime.length > 0;
                  
                  return (
                    <div
                      key={time}
                      className={`rounded-xl border-2 p-4 transition-all ${
                        hasConsultations 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FaClock className="text-gray-700 text-lg" />
                          <span className="font-bold text-gray-900 text-xl">{formatTo12Hour(time)}</span>
                        </div>
                        {hasConsultations && (
                          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                            {consultationsForTime.length}
                          </span>
                        )}
                      </div>
                      
                      {hasConsultations ? (
                        <div className="space-y-3">
                          {consultationsForTime.map((consultation) => (
                            <div
                              key={consultation.consultation_id}
                              onClick={() => {
                                setSelectedConsultation(consultation);
                                setShowDetailModal(true);
                              }}
                              className="bg-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-all border-l-4 border-blue-500"
                            >
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-center gap-2">
                                  {consultation.assigned_doctor_id ? (
                                    <FaUserMd className="text-blue-600 text-xl" />
                                  ) : (
                                    <FaUserNurse className="text-green-600 text-xl" />
                                  )}
                                  <span className="font-bold text-gray-900 text-lg">{consultation.patient_name}</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${STATUS_COLORS[consultation.status]}`}>
                                  {STATUS_LABELS[consultation.status]}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-3 font-medium text-base">{consultation.chief_complaint}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
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
                        <div className="text-center py-6">
                          <p className="text-gray-500 text-base font-medium">No appointments</p>
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