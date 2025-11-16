import { X, Users, Activity, Pill, Calendar, FileText } from "lucide-react";

const BARANGAYS = [
  { value: '', label: 'All Barangays' },
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

const getBarangayLabel = (value) => {
  return BARANGAYS.find(b => b.value === value)?.label || value;
};

const formatTime12Hour = (time24) => {
  if (!time24) return '';
  try {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  } catch {
    return time24;
  }
};

const ResidentProfileModal = ({ 
  resident, 
  residentDetails, 
  detailsLoading, 
  onClose, 
  onEdit 
}) => {
  if (!resident) return null;

  // Check if resident has any program status
  const hasPrograms = resident.is_4ps_member || 
                     resident.is_philhealth_member || 
                     resident.is_pregnant || 
                     resident.is_senior_citizen || 
                     resident.is_birth_registered || 
                     resident.other_program;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-[#2b3e50] px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Resident Profile</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-[#3d5569] rounded p-1 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {detailsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading details...</p>
            </div>
          ) : (
            <>
              {/* Personal Information */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Users size={20} className="text-blue-600" />
                    Personal Information
                  </h3>
                  {!resident.is_profile_complete && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                      ⚠️ Incomplete Profile
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-700 mb-1">Full Name</p>
                    <p className="text-sm font-medium text-gray-900">{resident.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-700 mb-1">Gender</p>
                    <p className="text-sm font-medium text-gray-900">{resident.gender}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-700 mb-1">Date of Birth</p>
                    <p className="text-sm font-medium text-gray-900">
                      {resident.date_of_birth 
                        ? new Date(resident.date_of_birth).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-700 mb-1">Age</p>
                    <p className="text-sm font-medium text-gray-900">{resident.age} years</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-700 mb-1">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{resident.phone || 'N/A'}</p>
                  </div>
                  {resident.barangay && (
                    <div>
                      <p className="text-xs font-bold text-gray-700 mb-1">Barangay</p>
                      <p className="text-sm font-medium text-gray-900">{getBarangayLabel(resident.barangay)}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-xs font-bold text-gray-700 mb-1">Address</p>
                    <p className="text-sm font-medium text-gray-900">{resident.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Program Status - Only show if has programs */}
              {hasPrograms && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
                    <Activity size={20} className="text-green-600" />
                    Program Status
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {resident.is_4ps_member && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <p className="text-sm text-green-900 font-semibold">4Ps Member</p>
                      </div>
                    )}
                    {resident.is_philhealth_member && (
                      <div className="bg-teal-50 border border-teal-200 rounded-md p-3">
                        <p className="text-sm text-teal-900 font-semibold">PhilHealth Member</p>
                        {resident.philhealth_number && (
                          <p className="text-xs text-teal-800 mt-1 font-mono">
                            {resident.philhealth_number}
                          </p>
                        )}
                      </div>
                    )}
                    {resident.is_pregnant && (
                      <div className="bg-pink-50 border border-pink-200 rounded-md p-3">
                        <p className="text-sm text-pink-900 font-semibold">Pregnant</p>
                        {resident.pregnancy_due_date && (
                          <p className="text-xs text-pink-800 mt-1">
                            Due: {new Date(resident.pregnancy_due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                    {resident.is_senior_citizen && (
                      <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                        <p className="text-sm text-purple-900 font-semibold">Senior Citizen</p>
                      </div>
                    )}
                    {resident.is_birth_registered && (
                      <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                        <p className="text-sm text-orange-900 font-semibold">Birth Registered</p>
                      </div>
                    )}
                    {resident.other_program && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3 col-span-2">
                        <p className="text-xs text-indigo-700 font-semibold mb-1">Other Programs</p>
                        <p className="text-sm text-indigo-900 font-medium">{resident.other_program}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Consultation History */}
              {residentDetails?.consultations && residentDetails.consultations.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
                    <Calendar size={20} className="text-blue-600" />
                    Consultation History ({residentDetails.consultations.length})
                  </h3>
                  <div className="space-y-3">
                    {residentDetails.consultations.map((consultation) => (
                      <div 
                        key={consultation.consultation_id} 
                        className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900 mb-1">
                              {consultation.chief_complaint || 'General Consultation'}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar size={12} />
                                <span>{new Date(consultation.scheduled_date).toLocaleDateString()}</span>
                              </div>
                              <span>•</span>
                              <span>{formatTime12Hour(consultation.scheduled_time)}</span>
                              {consultation.consultation_type && (
                                <>
                                  <span>•</span>
                                  <span className="px-2 py-0.5 bg-white rounded text-gray-700 font-medium">
                                    {consultation.consultation_type}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap ml-2 ${
                            consultation.status === 'COMPLETED' ? 'bg-green-500' :
                            consultation.status === 'CANCELLED' ? 'bg-red-500' :
                            consultation.status === 'IN_PROGRESS' ? 'bg-yellow-500' :
                            consultation.status === 'CONFIRMED' ? 'bg-teal-500' :
                            'bg-blue-500'
                          }`}>
                            {consultation.status}
                          </span>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 gap-2">
                          {consultation.symptoms && (
                            <div className="bg-white rounded p-2">
                              <span className="text-xs font-semibold text-gray-600">Symptoms:</span>
                              <p className="text-xs text-gray-900 mt-0.5">{consultation.symptoms}</p>
                            </div>
                          )}
                          
                          {consultation.diagnosis && (
                            <div className="bg-white rounded p-2">
                              <span className="text-xs font-semibold text-gray-600">Diagnosis:</span>
                              <p className="text-xs text-gray-900 mt-0.5">{consultation.diagnosis}</p>
                            </div>
                          )}

                          {consultation.prescription && (
                            <div className="bg-white rounded p-2">
                              <span className="text-xs font-semibold text-gray-600">Prescription:</span>
                              <p className="text-xs text-gray-900 mt-0.5">{consultation.prescription}</p>
                            </div>
                          )}

                          {/* Provider Info */}
                          {(consultation.assigned_doctor || consultation.assigned_nurse) && (
                            <div className="flex items-center gap-2 text-xs text-gray-700 pt-1 border-t border-blue-200">
                              <Users size={12} />
                              <span className="font-medium">Provider:</span>
                              <span>
                                {consultation.assigned_doctor 
                                  ? `Dr. ${consultation.assigned_doctor.full_name}`
                                  : consultation.assigned_nurse 
                                  ? `Nurse ${consultation.assigned_nurse.full_name}`
                                  : 'Not assigned'}
                              </span>
                            </div>
                          )}

                          {/* Follow-up Info */}
                          {consultation.follow_up_required && consultation.follow_up_date && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-1">
                              <div className="flex items-center gap-1 text-xs font-semibold text-yellow-900">
                                <Calendar size={12} />
                                <span>Follow-up Required:</span>
                                <span>{new Date(consultation.follow_up_date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {consultation.consultation_notes && (
                          <div className="mt-2 pt-2 border-t border-blue-200">
                            <span className="text-xs font-semibold text-gray-600">Notes:</span>
                            <p className="text-xs text-gray-700 mt-0.5 italic">
                              {consultation.consultation_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medicine Release History */}
              {residentDetails?.medicine_releases && residentDetails.medicine_releases.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
                    <Pill size={20} className="text-purple-600" />
                    Medicine Release History ({residentDetails.medicine_releases.length})
                  </h3>
                  <div className="space-y-3">
                    {residentDetails.medicine_releases.map((release) => (
                      <div key={release.release_id} className="bg-purple-50 border border-purple-200 rounded-md p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-semibold text-gray-900">
                                {release.medicine?.medicine_name || 'Unknown Medicine'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {release.medicine?.dosage_form} {release.medicine?.strength}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                              <div>
                                <span className="font-medium text-gray-600">Date:</span>
                                <span className="ml-1 text-gray-900">
                                  {new Date(release.date_released).toLocaleDateString()}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Quantity:</span>
                                <span className="ml-1 text-gray-900">{release.quantity_released}</span>
                              </div>
                              {release.concern && (
                                <div className="col-span-2">
                                  <span className="font-medium text-gray-600">Concern:</span>
                                  <span className="ml-1 text-gray-900">{release.concern}</span>
                                </div>
                              )}
                              {release.prescribing_doctor && (
                                <div className="col-span-2">
                                  <span className="font-medium text-gray-600">Doctor:</span>
                                  <span className="ml-1 text-gray-900">{release.prescribing_doctor}</span>
                                </div>
                              )}
                              {release.dosage_instructions && (
                                <div className="col-span-2">
                                  <span className="font-medium text-gray-600">Instructions:</span>
                                  <span className="ml-1 text-gray-900">{release.dosage_instructions}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {release.blockchain_tx_hash && (
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex-shrink-0">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medical Information */}
              {(resident.medical_conditions || resident.allergies) && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
                    <FileText size={20} className="text-red-600" />
                    Medical Information
                  </h3>
                  <div className="space-y-3">
                    {resident.medical_conditions && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-xs font-semibold text-red-700 mb-1">Medical Conditions</p>
                        <p className="text-sm text-red-900">{resident.medical_conditions}</p>
                      </div>
                    )}
                    {resident.allergies && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <p className="text-xs font-semibold text-yellow-700 mb-1">Allergies</p>
                        <p className="text-sm text-yellow-900">{resident.allergies}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {(resident.emergency_contact || resident.emergency_phone) && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Contact Person</p>
                      <p className="text-sm text-gray-900">
                        {resident.emergency_contact || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Emergency Phone</p>
                      <p className="text-sm text-gray-900">
                        {resident.emergency_phone || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={() => {
              onClose();
              onEdit(resident.resident_id);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            Edit Resident
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResidentProfileModal;