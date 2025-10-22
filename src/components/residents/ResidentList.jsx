import { useState, useEffect } from "react";
import { Search, Filter, X, Eye, Edit2, Trash2, Users, UserCheck, Heart, UserCog, Phone, MapPin, Plus, ChevronLeft, ChevronRight } from "lucide-react";

// Import API_BASE_URL from your config
// Make sure to uncomment this line in your actual file:
// import API_BASE_URL from '../../config.js';

// For this artifact, we're defining it here:
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.MODE === 'production' 
    ? "https://genlunamedchain-backend.onrender.com"
    : "http://localhost:4000");

console.log('🔧 API URL being used:', API_BASE_URL);

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
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadResidents();
  }, [page, filters]);

  const loadResidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', '12');
      
      if (filters.search) params.append('search', filters.search);
      if (filters.barangay) params.append('barangay', filters.barangay);
      if (filters.age_category) params.append('age_category', filters.age_category);
      if (filters.is_4ps_member) params.append('is_4ps_member', filters.is_4ps_member);
      if (filters.is_pregnant) params.append('is_pregnant', filters.is_pregnant);
      if (filters.is_senior_citizen) params.append('is_senior_citizen', filters.is_senior_citizen);

      const url = `${API_BASE_URL}/residents?${params.toString()}`;
      console.log('📡 Fetching residents from:', url);
      console.log('🔑 Token present:', !!token);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Failed to fetch residents: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ API Response:', data);

      // Handle different response formats
      const residentsArray = data.data || data.residents || data || [];
      setResidents(Array.isArray(residentsArray) ? residentsArray : []);
      setTotalPages(data.pagination?.totalPages || data.totalPages || 1);
    } catch (err) {
      console.error("❌ Failed to load residents:", err);
      setError(err.message);
      setResidents([]);
    } finally {
      setLoading(false);
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
    setPage(1);
  };

  const handleDelete = async (residentId) => {
    if (!confirm("Are you sure you want to delete this resident?")) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/residents/${residentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete resident');
      }

      alert("Resident deleted successfully");
      loadResidents();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleViewClick = (residentId) => {
    const resident = residents.find(r => r.resident_id === residentId);
    setSelectedResident(resident);
    setShowViewModal(true);
  };

  const handleEditClick = (residentId) => {
    const resident = residents.find(r => r.resident_id === residentId);
    setSelectedResident(resident);
    setShowEditModal(true);
    if (onEdit) {
      onEdit(resident);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Residents Directory</h1>
              <p className="text-lg text-gray-800">Manage resident information and records</p>
            </div>
            <button
              onClick={() => (window.location.href = "/residents/new")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus size={20} />
              Add Resident
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-md border-2 border-blue-100 p-6 transform transition-all duration-200 hover:shadow-xl hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <Users className="text-blue-600" size={32} />
              <div className="bg-blue-100 rounded-full p-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-800 mb-1">Total Residents</div>
            <div className="text-3xl font-bold text-gray-900">{residents.length}</div>
          </div>

          <div className="bg-white rounded-2xl shadow-md border-2 border-green-100 p-6 transform transition-all duration-200 hover:shadow-xl hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <UserCheck className="text-green-600" size={32} />
              <div className="bg-green-100 rounded-full p-2">
                <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-800 mb-1">4Ps Members</div>
            <div className="text-3xl font-bold text-gray-900">
              {residents.filter(r => r.is_4ps_member).length}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md border-2 border-pink-100 p-6 transform transition-all duration-200 hover:shadow-xl hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <Heart className="text-pink-600" size={32} />
              <div className="bg-pink-100 rounded-full p-2">
                <div className="w-3 h-3 bg-pink-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-800 mb-1">Pregnant</div>
            <div className="text-3xl font-bold text-gray-900">
              {residents.filter(r => r.is_pregnant).length}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md border-2 border-purple-100 p-6 transform transition-all duration-200 hover:shadow-xl hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <UserCog className="text-purple-600" size={32} />
              <div className="bg-purple-100 rounded-full p-2">
                <div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-800 mb-1">Senior Citizens</div>
            <div className="text-3xl font-bold text-gray-900">
              {residents.filter(r => r.is_senior_citizen).length}
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 mb-8">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-800" size={20} />
              <input
                type="text"
                placeholder="Search by name..."
                value={filters.search}
                onChange={handleSearch}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 font-medium transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="relative px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <Filter size={20} />
              Filters
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="pt-6 border-t-2 border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Barangay</label>
                  <select
                    value={filters.barangay}
                    onChange={(e) => handleFilterChange('barangay', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-base text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    {BARANGAYS.map(b => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Age Category</label>
                  <select
                    value={filters.age_category}
                    onChange={(e) => handleFilterChange('age_category', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-base text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    {AGE_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Program Status</label>
                  <div className="space-y-3">
                    <label className="flex items-center text-base text-gray-900 font-medium cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.is_4ps_member === 'true'}
                        onChange={(e) => handleFilterChange('is_4ps_member', e.target.checked ? 'true' : '')}
                        className="w-5 h-5 mr-3 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="group-hover:text-blue-600 transition-colors">4Ps Member</span>
                    </label>
                    <label className="flex items-center text-base text-gray-900 font-medium cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.is_pregnant === 'true'}
                        onChange={(e) => handleFilterChange('is_pregnant', e.target.checked ? 'true' : '')}
                        className="w-5 h-5 mr-3 rounded border-2 border-gray-300 text-pink-600 focus:ring-2 focus:ring-pink-500 cursor-pointer"
                      />
                      <span className="group-hover:text-pink-600 transition-colors">Pregnant</span>
                    </label>
                    <label className="flex items-center text-base text-gray-900 font-medium cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.is_senior_citizen === 'true'}
                        onChange={(e) => handleFilterChange('is_senior_citizen', e.target.checked ? 'true' : '')}
                        className="w-5 h-5 mr-3 rounded border-2 border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                      />
                      <span className="group-hover:text-purple-600 transition-colors">Senior Citizen</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 text-base text-blue-600 hover:text-blue-800 font-bold transition-colors"
                >
                  <X size={18} />
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-8">
            <p className="text-red-900 font-semibold">Error: {error}</p>
            <button 
              onClick={loadResidents}
              className="mt-2 text-sm text-red-700 underline hover:text-red-900"
            >
              Try again
            </button>
          </div>
        )}

        {/* Resident Cards */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-6 text-lg text-gray-900 font-semibold">Loading residents...</p>
          </div>
        ) : residents.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-16 text-center">
            <Users className="mx-auto h-20 w-20 text-gray-400 mb-4" />
            <p className="text-xl text-gray-900 font-semibold">No residents found</p>
            <p className="text-base text-gray-700 mt-2">Try adjusting your filters or search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {residents.map((res) => (
              <div
                key={res.resident_id}
                className="bg-white rounded-2xl shadow-md border-2 border-gray-200 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 border-b-2 border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg leading-tight">
                        {res.full_name}
                      </h3>
                      <p className="text-sm text-gray-700 mt-1 font-medium">
                        ID: #{res.resident_id}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ml-2 ${
                        res.gender === 'MALE'
                          ? "bg-blue-200 text-blue-900"
                          : "bg-pink-200 text-pink-900"
                      }`}
                    >
                      {res.gender}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  {/* Age */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <span className="text-sm font-semibold text-gray-800">Age:</span>
                    <span className="text-base font-bold text-gray-900">
                      {res.age} years
                    </span>
                  </div>

                  {/* Barangay */}
                  {res.barangay && (
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                      <MapPin size={16} className="text-gray-800 flex-shrink-0" />
                      <span className="text-sm text-gray-900 font-semibold truncate">
                        {getBarangayLabel(res.barangay)}
                      </span>
                    </div>
                  )}

                  {/* Phone */}
                  {res.phone && (
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                      <Phone size={16} className="text-gray-800 flex-shrink-0" />
                      <span className="text-sm text-gray-900 font-semibold">
                        {res.phone}
                      </span>
                    </div>
                  )}

                  {/* Status Badges */}
                  {(res.is_4ps_member || res.is_pregnant || res.is_senior_citizen || res.is_birth_registered) && (
                    <div className="pt-3 border-t-2 border-gray-200">
                      <div className="flex flex-wrap gap-2">
                        {res.is_4ps_member && (
                          <span className="px-3 py-1 bg-green-200 text-green-900 text-xs rounded-full font-bold">
                            4Ps
                          </span>
                        )}
                        {res.is_pregnant && (
                          <span className="px-3 py-1 bg-pink-200 text-pink-900 text-xs rounded-full font-bold">
                            Pregnant
                          </span>
                        )}
                        {res.is_senior_citizen && (
                          <span className="px-3 py-1 bg-purple-200 text-purple-900 text-xs rounded-full font-bold">
                            Senior
                          </span>
                        )}
                        {res.is_birth_registered && (
                          <span className="px-3 py-1 bg-orange-200 text-orange-900 text-xs rounded-full font-bold">
                            Birth Reg.
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Medical Conditions */}
                  {res.medical_conditions && (
                    <div className="pt-3 border-t-2 border-gray-200">
                      <span className="text-xs text-gray-800 font-bold block mb-2">Medical:</span>
                      <p className="text-sm text-gray-900 line-clamp-2 font-medium">
                        {res.medical_conditions}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="p-5 pt-0 flex gap-2">
                  <button
                    onClick={() => handleViewClick(res.resident_id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 transform hover:scale-105"
                    title="View Details"
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <button
                    onClick={() => handleEditClick(res.resident_id)}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 transform hover:scale-105"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(res.resident_id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center transform hover:scale-105"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between bg-white rounded-2xl shadow-md border border-gray-200 px-6 py-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-2 px-6 py-3 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 border-2 border-blue-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <ChevronLeft size={20} />
              Previous
            </button>
            <span className="text-base text-gray-900 font-bold">
              Page <span className="text-blue-600 text-xl">{page}</span> of{" "}
              <span className="text-blue-600 text-xl">{totalPages}</span>
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-2 px-6 py-3 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 border-2 border-blue-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Next
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedResident && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Resident Details</h2>
              <button
                onClick={closeModals}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
              >
                <X size={28} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Personal Information */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-blue-200">
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 font-semibold mb-1">Full Name</p>
                    <p className="text-base font-bold text-gray-900">{selectedResident.full_name}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 font-semibold mb-1">Gender</p>
                    <p className="text-base font-bold text-gray-900">{selectedResident.gender}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 font-semibold mb-1">Date of Birth</p>
                    <p className="text-base font-bold text-gray-900">
                      {selectedResident.date_of_birth 
                        ? new Date(selectedResident.date_of_birth).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 font-semibold mb-1">Age</p>
                    <p className="text-base font-bold text-gray-900">{selectedResident.age} years</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 font-semibold mb-1">Phone</p>
                    <p className="text-base font-bold text-gray-900">{selectedResident.phone || 'N/A'}</p>
                  </div>
                  {selectedResident.barangay && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 font-semibold mb-1">Barangay</p>
                      <p className="text-base font-bold text-gray-900">{getBarangayLabel(selectedResident.barangay)}</p>
                    </div>
                  )}
                  <div className="col-span-2 bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 font-semibold mb-1">Address</p>
                    <p className="text-base font-bold text-gray-900">{selectedResident.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Program Status */}
              {(selectedResident.is_4ps_member || selectedResident.is_pregnant || selectedResident.is_senior_citizen || selectedResident.is_birth_registered) && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-blue-200">
                    Program Status
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedResident.is_4ps_member && (
                      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                        <p className="text-base text-green-900 font-bold">4Ps Member</p>
                      </div>
                    )}
                    {selectedResident.is_pregnant && (
                      <div className="bg-pink-50 border-2 border-pink-200 rounded-xl p-4">
                        <p className="text-base text-pink-900 font-bold">Pregnant</p>
                        {selectedResident.pregnancy_due_date && (
                          <p className="text-sm text-pink-800 font-semibold mt-2">
                            Due: {new Date(selectedResident.pregnancy_due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                    {selectedResident.is_senior_citizen && (
                      <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                        <p className="text-base text-purple-900 font-bold">Senior Citizen</p>
                      </div>
                    )}
                    {selectedResident.is_birth_registered && (
                      <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                        <p className="text-base text-orange-900 font-bold">Birth Registered</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-blue-200">
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 font-semibold mb-1">Contact Person</p>
                    <p className="text-base font-bold text-gray-900">
                      {selectedResident.emergency_contact || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 font-semibold mb-1">Emergency Phone</p>
                    <p className="text-base font-bold text-gray-900">
                      {selectedResident.emergency_phone || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-blue-200">
                  Medical Information
                </h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 font-semibold mb-2">Medical Conditions</p>
                    <p className="text-base font-bold text-gray-900">
                      {selectedResident.medical_conditions || 'None reported'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 font-semibold mb-2">Known Allergies</p>
                    <p className="text-base font-bold text-gray-900">
                      {selectedResident.allergies || 'None reported'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-200 px-6 py-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  closeModals();
                  handleEditClick(selectedResident.resident_id);
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Edit Resident
              </button>
              <button
                onClick={closeModals}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedResident && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8">
            <div className="sticky top-0 bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-5 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">Edit Resident</h2>
              <button
                onClick={closeModals}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
              >
                <X size={28} />
              </button>
            </div>

            <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
                <p className="text-lg font-bold text-gray-900">
                  Edit form would be integrated here with AddResidentForm component
                </p>
                <p className="text-base text-gray-700 mt-2">
                  Pass editData={JSON.stringify({resident_id: selectedResident.resident_id})} to the form
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentList;