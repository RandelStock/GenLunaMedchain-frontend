// frontend/src/components/consultation/ConsultationCalendar.jsx
import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaUserMd, FaUserNurse, FaVideo, FaPhone, FaEnvelope, FaMapMarkerAlt, FaEye, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import API_BASE_URL from '../../config.js';

const STATUS_COLORS = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-orange-100 text-orange-800'
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadConsultations();
  }, [selectedDate]);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      const wallet = localStorage.getItem('connectedWalletAddress') || '';
      const response = await fetch(`${API_BASE_URL}/consultations?date_from=${selectedDate}&date_to=${selectedDate}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            'x-wallet-address': wallet
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setConsultations(data.data || []);
      }
    } catch (error) {
      console.error('Error loading consultations:', error);
      setError('Failed to load consultations');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (consultationId, newStatus) => {
    try {
      setUpdating(true);
      const response = await fetch(`${API_URL}/consultations/${consultationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update consultation status');
      }

      await loadConsultations();
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error updating consultation:', error);
      setError(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleViewDetails = (consultation) => {
    setSelectedConsultation(consultation);
    setShowDetailModal(true);
  };

  const getConsultationsForTime = (time) => {
    // Compare directly using 24-hour time strings stored in DB
    return consultations.filter(c => c.scheduled_time === time);
  };

  const renderTimeSlot = (time) => {
    const consultationsForTime = getConsultationsForTime(time);
    
    return (
      <div key={time} className="border-b border-gray-200 p-4 min-h-[120px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FaClock className="text-gray-500" />
            <span className="font-medium text-gray-900">{formatTo12Hour(time)}</span>
          </div>
          <span className="text-sm text-gray-500">
            {consultationsForTime.length} consultation{consultationsForTime.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="space-y-2">
          {consultationsForTime.map((consultation) => (
            <div
              key={consultation.consultation_id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors hover:shadow-md ${
                consultation.status === 'COMPLETED' 
                  ? 'bg-gray-50 border-gray-200' 
                  : consultation.status === 'CANCELLED'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-white border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => handleViewDetails(consultation)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {consultation.assigned_doctor_id ? (
                      <FaUserMd className="text-blue-600" />
                    ) : (
                      <FaUserNurse className="text-green-600" />
                    )}
                    <span className="font-medium text-gray-900">
                      {consultation.patient_name}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {consultation.chief_complaint.length > 50 
                      ? `${consultation.chief_complaint.substring(0, 50)}...` 
                      : consultation.chief_complaint}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FaMapMarkerAlt />
                    <span>{consultation.patient_barangay.replace(/_/g, ' ')}</span>
                    <FaPhone />
                    <span>{consultation.patient_phone}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[consultation.status]}`}>
                    {STATUS_LABELS[consultation.status]}
                  </span>
                  {consultation.meeting_link && (
                    <a
                      href={consultation.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-blue-600 hover:text-blue-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FaVideo />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {consultationsForTime.length === 0 && (
            <div className="text-center text-gray-400 py-4">
              <FaCalendarAlt className="mx-auto mb-2" />
              <p className="text-sm">No consultations scheduled</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!selectedConsultation) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Consultation Details
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Patient Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{selectedConsultation.patient_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{selectedConsultation.patient_phone}</p>
                </div>
                {selectedConsultation.patient_email && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedConsultation.patient_email}</p>
                  </div>
                )}
                {selectedConsultation.patient_age && (
                  <div>
                    <p className="text-sm text-gray-600">Age</p>
                    <p className="font-medium text-gray-900">{selectedConsultation.patient_age} years</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Gender</p>
                  <p className="font-medium text-gray-900">{selectedConsultation.patient_gender}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Barangay</p>
                  <p className="font-medium text-gray-900">{selectedConsultation.patient_barangay.replace(/_/g, ' ')}</p>
                </div>
              </div>
              {selectedConsultation.patient_address && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium text-gray-900">{selectedConsultation.patient_address}</p>
                </div>
              )}
            </div>

            {/* Consultation Details */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Consultation Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date & Time</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedConsultation.scheduled_date).toLocaleDateString()} at {formatTo12Hour(selectedConsultation.scheduled_time)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selectedConsultation.status]}`}>
                    {STATUS_LABELS[selectedConsultation.status]}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium text-gray-900">{selectedConsultation.consultation_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Provider</p>
                  <p className="font-medium text-gray-900">
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

            {/* Medical Information */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Chief Complaint</p>
                  <p className="font-medium text-gray-900">{selectedConsultation.chief_complaint}</p>
                </div>
                {selectedConsultation.symptoms && (
                  <div>
                    <p className="text-sm text-gray-600">Symptoms</p>
                    <p className="font-medium text-gray-900">{selectedConsultation.symptoms}</p>
                  </div>
                )}
                {selectedConsultation.medical_history && (
                  <div>
                    <p className="text-sm text-gray-600">Medical History</p>
                    <p className="font-medium text-gray-900">{selectedConsultation.medical_history}</p>
                  </div>
                )}
                {selectedConsultation.current_medications && (
                  <div>
                    <p className="text-sm text-gray-600">Current Medications</p>
                    <p className="font-medium text-gray-900">{selectedConsultation.current_medications}</p>
                  </div>
                )}
                {selectedConsultation.allergies && (
                  <div>
                    <p className="text-sm text-gray-600">Allergies</p>
                    <p className="font-medium text-gray-900">{selectedConsultation.allergies}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Consultation Notes */}
            {(selectedConsultation.consultation_notes || selectedConsultation.diagnosis || selectedConsultation.prescription) && (
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Consultation Notes</h3>
                <div className="space-y-4">
                  {selectedConsultation.consultation_notes && (
                    <div>
                      <p className="text-sm text-gray-600">Notes</p>
                      <p className="font-medium text-gray-900">{selectedConsultation.consultation_notes}</p>
                    </div>
                  )}
                  {selectedConsultation.diagnosis && (
                    <div>
                      <p className="text-sm text-gray-600">Diagnosis</p>
                      <p className="font-medium text-gray-900">{selectedConsultation.diagnosis}</p>
                    </div>
                  )}
                  {selectedConsultation.prescription && (
                    <div>
                      <p className="text-sm text-gray-600">Prescription</p>
                      <p className="font-medium text-gray-900">{selectedConsultation.prescription}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Meeting Details */}
            {selectedConsultation.meeting_link && (
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Meeting</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Meeting Link</p>
                  <a
                    href={selectedConsultation.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <FaVideo />
                    Join Meeting
                  </a>
                  {selectedConsultation.meeting_id && (
                    <div>
                      <p className="text-sm text-gray-600">Meeting ID</p>
                      <p className="font-medium text-gray-900">{selectedConsultation.meeting_id}</p>
                    </div>
                  )}
                  {selectedConsultation.meeting_password && (
                    <div>
                      <p className="text-sm text-gray-600">Password</p>
                      <p className="font-medium text-gray-900">{selectedConsultation.meeting_password}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              {selectedConsultation.status === 'SCHEDULED' && (
                <button
                  onClick={() => handleStatusUpdate(selectedConsultation.consultation_id, 'CONFIRMED')}
                  disabled={updating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <FaCheck />
                  Confirm
                </button>
              )}
              {['SCHEDULED', 'CONFIRMED'].includes(selectedConsultation.status) && (
                <button
                  onClick={() => handleStatusUpdate(selectedConsultation.consultation_id, 'CANCELLED')}
                  disabled={updating}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <FaTimes />
                  Cancel
                </button>
              )}
              {selectedConsultation.status === 'CONFIRMED' && (
                <button
                  onClick={() => handleStatusUpdate(selectedConsultation.consultation_id, 'IN_PROGRESS')}
                  disabled={updating}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
                >
                  Start Consultation
                </button>
              )}
              {selectedConsultation.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => handleStatusUpdate(selectedConsultation.consultation_id, 'COMPLETED')}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  Complete
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Consultation Calendar</h1>
          <p className="text-gray-600">Manage telemedicine consultations and appointments</p>
        </div>

        {/* Date Selector */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={loadConsultations}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <FaCalendarAlt />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Consultations for {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading consultations...</p>
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
