// residents/ResidentList.jsx
import { useState, useEffect } from "react";
import { useResidents } from "../../hooks/useResidents";
import AddResidentForm from "./AddResidentForm";

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

const AGE_CATEGORIES = [
  { value: '', label: 'All Ages' },
  { value: 'ZERO_TO_23_MONTHS', label: '0-23 Months' },
  { value: 'TWENTY_FOUR_TO_59_MONTHS', label: '24-59 Months' },
  { value: 'SIXTY_TO_71_MONTHS', label: '60-71 Months' },
  { value: 'ABOVE_71_MONTHS', label: 'Above 71 Months' }
];

const ResidentList = ({ onEdit, onView }) => {
  const { getResidents, deleteResident, loading } = useResidents();
  const [residents, setResidents] = useState([]);
  const [filters, setFilters] = useState({ 
    search: "",
    barangay: "",
    age_category: "",
    is_4ps_member: "",
    is_pregnant: "",
    is_senior_citizen: ""
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);

  useEffect(() => {
    loadResidents();
  }, [page, filters]);

  const loadResidents = async () => {
    try {
      const data = await getResidents({ ...filters, page, limit: 12 });
      // Extract the data property from the response
      const residentsArray = data.data || data.residents || data || [];
      setResidents(residentsArray);
      setTotalPages(data.pagination?.totalPages || data.totalPages || 1);
    } catch (err) {
      console.error("Failed to load residents:", err);
    }
  };

  const handleSearch = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
    setPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      barangay: "",
      age_category: "",
      is_4ps_member: "",
      is_pregnant: "",
      is_senior_citizen: ""
    });
  };

  const handleDelete = async (residentId) => {
    if (!confirm("Are you sure you want to delete this resident?")) return;
    try {
      await deleteResident(residentId);
      alert("Resident deleted successfully");
      loadResidents();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleViewClick = async (residentId) => {
    const resident = residents.find(r => r.resident_id === residentId);
    setSelectedResident(resident);
    setShowViewModal(true);
  };

  const handleEditClick = async (residentId) => {
    const resident = residents.find(r => r.resident_id === residentId);
    setSelectedResident(resident);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedResident(null);
    loadResidents();
  };

  const closeModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setSelectedResident(null);
  };

  const getBarangayLabel = (value) => {
    return BARANGAYS.find(b => b.value === value)?.label || value;
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length - (filters.search ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Residents Directory</h1>
              <p className="text-gray-600">Manage resident information and records</p>
            </div>
            <button
              onClick={() => (window.location.href = "/residents/new")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              + Add Resident
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-600 mb-1">Total Residents</div>
            <div className="text-2xl font-bold text-gray-900">{residents.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-600 mb-1">4Ps Members</div>
            <div className="text-2xl font-bold text-green-600">
              {residents.filter(r => r.is_4ps_member).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-600 mb-1">Pregnant</div>
            <div className="text-2xl font-bold text-pink-600">
              {residents.filter(r => r.is_pregnant).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-600 mb-1">Senior Citizens</div>
            <div className="text-2xl font-bold text-purple-600">
              {residents.filter(r => r.is_senior_citizen).length}
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="Search by name..."
              value={filters.search}
              onChange={handleSearch}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors relative"
            >
              Filters
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Barangay</label>
                <select
                  value={filters.barangay}
                  onChange={(e) => handleFilterChange('barangay', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500"
                >
                  {BARANGAYS.map(b => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age Category</label>
                <select
                  value={filters.age_category}
                  onChange={(e) => handleFilterChange('age_category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500"
                >
                  {AGE_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Program Status</label>
                <div className="space-y-2">
                  <label className="flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={filters.is_4ps_member === 'true'}
                      onChange={(e) => handleFilterChange('is_4ps_member', e.target.checked ? 'true' : '')}
                      className="mr-2 rounded"
                    />
                    4Ps Member
                  </label>
                  <label className="flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={filters.is_pregnant === 'true'}
                      onChange={(e) => handleFilterChange('is_pregnant', e.target.checked ? 'true' : '')}
                      className="mr-2 rounded"
                    />
                    Pregnant
                  </label>
                  <label className="flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={filters.is_senior_citizen === 'true'}
                      onChange={(e) => handleFilterChange('is_senior_citizen', e.target.checked ? 'true' : '')}
                      className="mr-2 rounded"
                    />
                    Senior Citizen
                  </label>
                </div>
              </div>

              <div className="col-span-full">
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Resident Cards */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading residents...</p>
          </div>
        ) : residents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="mt-4 text-gray-600">No residents found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {residents.map((res) => (
              <div
                key={res.resident_id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
              >
                {/* Card Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-base leading-tight">
                        {res.full_name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        ID: #{res.resident_id}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                        res.gender === 'MALE'
                          ? "bg-blue-100 text-blue-700"
                          : "bg-pink-100 text-pink-700"
                      }`}
                    >
                      {res.gender}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {/* Age */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Age:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {res.age} years
                    </span>
                  </div>

                  {/* Barangay */}
                  {res.barangay && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Barangay:</span>
                      <span className="text-xs text-gray-900 font-medium">
                        {getBarangayLabel(res.barangay)}
                      </span>
                    </div>
                  )}

                  {/* Phone */}
                  {res.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Phone:</span>
                      <span className="text-sm text-gray-900">
                        {res.phone}
                      </span>
                    </div>
                  )}

                  {/* Status Badges */}
                  {(res.is_4ps_member || res.is_pregnant || res.is_senior_citizen || res.is_birth_registered) && (
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex flex-wrap gap-1">
                        {res.is_4ps_member && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                            4Ps
                          </span>
                        )}
                        {res.is_pregnant && (
                          <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full font-medium">
                            Pregnant
                          </span>
                        )}
                        {res.is_senior_citizen && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                            Senior
                          </span>
                        )}
                        {res.is_birth_registered && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                            Birth Reg.
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Medical Conditions */}
                  {res.medical_conditions && (
                    <div className="pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-500 block mb-1">Medical:</span>
                      <p className="text-xs text-gray-700 line-clamp-2">
                        {res.medical_conditions}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="p-4 pt-0 flex gap-2">
                  <button
                    onClick={() => handleViewClick(res.resident_id)}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    title="View Details"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEditClick(res.resident_id)}
                    className="flex-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(res.resident_id)}
                    className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    title="Delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page <span className="font-semibold">{page}</span> of{" "}
              <span className="font-semibold">{totalPages}</span>
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedResident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Resident Details</h2>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="text-base font-medium text-gray-900">{selectedResident.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="text-base font-medium text-gray-900">{selectedResident.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date of Birth</p>
                    <p className="text-base font-medium text-gray-900">
                      {selectedResident.date_of_birth 
                        ? new Date(selectedResident.date_of_birth).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Age</p>
                    <p className="text-base font-medium text-gray-900">{selectedResident.age} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-base font-medium text-gray-900">{selectedResident.phone || 'N/A'}</p>
                  </div>
                  {selectedResident.barangay && (
                    <div>
                      <p className="text-sm text-gray-600">Barangay</p>
                      <p className="text-base font-medium text-gray-900">{getBarangayLabel(selectedResident.barangay)}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="text-base font-medium text-gray-900">{selectedResident.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Program Status */}
              {(selectedResident.is_4ps_member || selectedResident.is_pregnant || selectedResident.is_senior_citizen || selectedResident.is_birth_registered) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
                    Program Status
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedResident.is_4ps_member && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-700 font-medium">4Ps Member</p>
                      </div>
                    )}
                    {selectedResident.is_pregnant && (
                      <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                        <p className="text-sm text-pink-700 font-medium">Pregnant</p>
                        {selectedResident.pregnancy_due_date && (
                          <p className="text-xs text-pink-600 mt-1">
                            Due: {new Date(selectedResident.pregnancy_due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                    {selectedResident.is_senior_citizen && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <p className="text-sm text-purple-700 font-medium">Senior Citizen</p>
                      </div>
                    )}
                    {selectedResident.is_birth_registered && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <p className="text-sm text-orange-700 font-medium">Birth Registered</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Contact Person</p>
                    <p className="text-base font-medium text-gray-900">
                      {selectedResident.emergency_contact || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Emergency Phone</p>
                    <p className="text-base font-medium text-gray-900">
                      {selectedResident.emergency_phone || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
                  Medical Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Medical Conditions</p>
                    <p className="text-base font-medium text-gray-900">
                      {selectedResident.medical_conditions || 'None reported'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Known Allergies</p>
                    <p className="text-base font-medium text-gray-900">
                      {selectedResident.allergies || 'None reported'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  closeModals();
                  handleEditClick(selectedResident.resident_id);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Edit Resident
              </button>
              <button
                onClick={closeModals}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedResident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full my-8">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg">
              <h2 className="text-2xl font-bold text-gray-900">Edit Resident</h2>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
              <AddResidentForm
                editData={selectedResident}
                onSuccess={handleEditSuccess}
                onCancel={closeModals}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentList;