import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaUserMd, FaUserNurse, FaVideo, FaPhone, FaMapMarkerAlt, FaCheck, FaTimes, FaEnvelope } from 'react-icons/fa';
import API_BASE_URL from '../../config.js';

const STATUS_COLORS = {
  SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-300',
  CONFIRMED: 'bg-green-100 text-green-800 border-green-300',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  COMPLETED: 'bg-gray-100 text-gray-800 border-gray-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300',
  NO_SHOW: 'bg-orange-100 text-orange-800 border-orange-300'
};

const STATUS_LABELS = {
  SCHEDULED: 'Scheduled',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show'
};

// Convert 24-hour time to 12-hour format
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

      const result = await response.json();

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

  const handleViewDetails = (consultation) => {
    setSelectedConsultation(consultation);
    setShowDetailModal(true);
    setError(null);
    setSuccessMessage(null);
  };

  const getConsultationsForTime = (time) => {
    return consultations.filter(c => c.scheduled_time === time);
  };

  const renderTimeSlot = (time) => {
    const consultationsForTime = getConsultationsForTime(time);
    const hasConsultations = consultationsForTime.length > 0;
    
    return (
      <div key={time} className={`p-4 border-b border-gray-200 ${hasConsultations ? 'bg-blue-50' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FaClock className="text-gray-700 text-sm" />
            <span className="font-semibold text-gray-900 text-base">{formatTo12Hour(time)}</span>
          </div>
          {hasConsultations && (
            <span className="text-xs font-medium text-gray-700 bg-white px-3 py-1 rounded-full border border-gray-300">
              {consultationsForTime.length} {consultationsForTime.length === 1 ? 'appointment' : 'appointments'}
            </span>
          )}
        </div>
        
        {hasConsultations ? (
          <div className="space-y-2 mt-3">
            {consultationsForTime.map((consultation) => (
              <div
                key={consultation.consultation_id}
                onClick={() => handleViewDetails(consultation)}
                className="bg-white border-l-4 border-blue-500 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {consultation.assigned_doctor_id ? (
                        <FaUserMd className="text-blue-600 text-lg" />
                      ) : (
                        <FaUserNurse className="text-green-600 text-lg" />
                      )}
                      <span className="font-bold text-gray-900 text-base">{consultation.patient_name}</span>
                      {consultation.patient_email && (
                        <FaEnvelope className="text-blue-500 text-xs" title="Email enabled" />
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">{consultation.chief_complaint}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
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
                  
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[consultation.status]}`}>
                      {STATUS_LABELS[consultation.status]}
                    </span>
                    {consultation.meeting_link && (
                      <a
                        href={consultation.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={(e) => e.stopPropagation()}
                        title="Join video meeting"
                      >
                        <FaVideo className="text-lg" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="text-sm text-gray-500">No appointments</p>
          </div>
        )}
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!selectedConsultation) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 z-10 rounded-t-xl">
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
          
          <div className="p-6 space-y-4">
            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 flex items-center gap-3">
                <FaCheck className="text-green-600 text-xl flex-shrink-0" />
                <p className="text-green-900 font-medium">{successMessage}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-center gap-3">
                <FaTimes className="text-red-600 text-xl flex-shrink-0" />
                <p className="text-red-900 font-medium">{error}</p>
              </div>
            )}

            {/* Email Status */}
            {selectedConsultation.patient_email ? (
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 flex items-center gap-3">
                <FaEnvelope className="text-blue-600 text-xl flex-shrink-0" />
                <div>
                  <p className="text-blue-900 font-bold">Email Notifications Enabled</p>
                  <p className="text-blue-700 text-sm">Patient will receive emails on status changes</p>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4 flex items-center gap-3">
                <FaEnvelope className="text-yellow-600 text-xl flex-shrink-0" />
                <div>
                  <p className="text-yellow-900 font-bold">No Email Provided</p>
                  <p className="text-yellow-700 text-sm">Patient will not receive email notifications</p>
                </div>
              </div>
            )}

            {/* Patient Information */}
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaUserMd className="text-blue-600" />
                Patient Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Name</p>
                  <p className="font-bold text-gray-900 text-base">{selectedConsultation.patient_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Phone</p>
                  <p className="font-bold text-gray-900 text-base">{selectedConsultation.patient_phone}</p>
                </div>
                {selectedConsultation.patient_email && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Email</p>
                    <p className="font-bold text-gray-900 text-base">{selectedConsultation.patient_email}</p>
                  </div>
                )}
                {selectedConsultation.patient_age && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Age</p>
                    <p className="font-bold text-gray-900 text-base">{selectedConsultation.patient_age} years</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Gender</p>
                  <p className="font-bold text-gray-900 text-base">{selectedConsultation.patient_gender}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Barangay</p>
                  <p className="font-bold text-gray-900 text-base">{selectedConsultation.patient_barangay.replace(/_/g, ' ')}</p>
                </div>
              </div>
            </div>

            {/* Consultation Info */}
            <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaCalendarAlt className="text-blue-600" />
                Consultation Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Date & Time</p>
                  <p className="font-bold text-gray-900 text-base">
                    {new Date(selectedConsultation.scheduled_date).toLocaleDateString('en-US', { 
                      month: 'short', day: 'numeric', year: 'numeric' 
                    })} at {formatTo12Hour(selectedConsultation.scheduled_time)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${STATUS_COLORS[selectedConsultation.status]}`}>
                    {STATUS_LABELS[selectedConsultation.status]}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Type</p>
                  <p className="font-bold text-gray-900 text-base">{selectedConsultation.consultation_type}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Provider</p>
                  <p className="font-bold text-gray-900 text-base">
                    {selectedConsultation.assigned_doctor ? 
                      `Dr. ${selectedConsultation.assigned_doctor.full_name}` :
                      selectedConsultation.assigned_nurse ? 
                      `Nurse ${selectedConsultation.assigned_nurse.full_name}` :
                      'Not assigned'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Medical Info */}
            <div className="bg-yellow-50 rounded-lg p-5 border border-yellow-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Medical Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Chief Complaint</p>
                  <p className="font-bold text-gray-900 text-base">{selectedConsultation.chief_complaint}</p>
                </div>
                {selectedConsultation.symptoms && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Symptoms</p>
                    <p className="font-bold text-gray-900 text-base">{selectedConsultation.symptoms}</p>
                  </div>
                )}
                {selectedConsultation.allergies && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Allergies ⚠️</p>
                    <p className="font-bold text-red-600 text-base">{selectedConsultation.allergies}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Meeting Link */}
            {selectedConsultation.meeting_link && (
              <div className="bg-purple-50 rounded-lg p-5 border border-purple-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FaVideo className="text-purple-600" />
                  Video Meeting
                </h3>
                <a
                  href={selectedConsultation.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-bold transition-colors"
                >
                  <FaVideo />
                  Join Meeting
                </a>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-gray-200">
              {selectedConsultation.status === 'SCHEDULED' && (
                <button
                  onClick={() => handleStatusUpdate(selectedConsultation.consultation_id, 'CONFIRMED')}
                  disabled={updating}
                  className="flex-1 min-w-[200px] px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold transition-colors"
                >
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Confirming...
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      Confirm & Send Email
                    </>
                  )}
                </button>
              )}
              {['SCHEDULED', 'CONFIRMED'].includes(selectedConsultation.status) && (
                <button
                  onClick={() => {
                    if (window.confirm('Cancel this consultation and notify patient?')) {
                      handleStatusUpdate(selectedConsultation.consultation_id, 'CANCELLED');
                    }
                  }}
                  disabled={updating}
                  className="flex-1 min-w-[200px] px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold transition-colors"
                >
                  {updating ? 'Cancelling...' : (
                    <>
                      <FaTimes />
                      Cancel & Notify
                    </>
                  )}
                </button>
              )}
              {selectedConsultation.status === 'CONFIRMED' && (
                <button
                  onClick={() => handleStatusUpdate(selectedConsultation.consultation_id, 'IN_PROGRESS')}
                  disabled={updating}
                  className="flex-1 min-w-[200px] px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 font-bold transition-colors"
                >
                  {updating ? 'Starting...' : 'Start Consultation'}
                </button>
              )}
              {selectedConsultation.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => handleStatusUpdate(selectedConsultation.consultation_id, 'COMPLETED')}
                  disabled={updating}
                  className="flex-1 min-w-[200px] px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-bold transition-colors"
                >
                  {updating ? 'Completing...' : 'Complete Consultation'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Consultation Calendar</h1>
          <p className="text-gray-700 font-medium">Manage telemedicine consultations and appointments</p>
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm font-bold text-gray-900 uppercase">Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-gray-900 bg-white"
              style={{ colorScheme: 'light' }}
            />
            <button
              onClick={loadConsultations}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-bold transition-colors"
            >
              <FaCalendarAlt />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && !showDetailModal && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
            <p className="text-red-900 font-bold">{error}</p>
          </div>
        )}

        {successMessage && !showDetailModal && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
            <p className="text-green-900 font-bold">{successMessage}</p>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5">
            <h2 className="text-xl font-bold">
              {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
          </div>
          
          <div>
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-900 font-bold text-lg">Loading consultations...</p>
              </div>
            ) : (
              generateTimeSlots().map(renderTimeSlot)
            )}
          </div>
        </div>

        {/* Detail Modal */}
        {showDetailModal && renderDetailModal()}
      </div>
    </div>
  );
};

export default ConsultationCalendar;