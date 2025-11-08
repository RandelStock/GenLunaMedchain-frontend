import { useState, useEffect } from "react";
import { Search, Filter, X, Eye, Edit2, Trash2, RefreshCw, FileDown, FileText, ChevronLeft, ChevronRight, UserCheck, Heart, UserCog, Users, Pill, Activity, Calendar } from "lucide-react";
import api from '../../../api.js';

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
  const [selectedResident, setSelectedResident] = useState(null);
  const [residentDetails, setResidentDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    loadResidents();
  }, [page, filters]);

  const loadResidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', '12');
      
      if (filters.search) params.append('search', filters.search);
      if (filters.barangay) params.append('barangay', filters.barangay);
      if (filters.age_category) params.append('age_category', filters.age_category);
      if (filters.is_4ps_member) params.append('is_4ps_member', filters.is_4ps_member);
      if (filters.is_pregnant) params.append('is_pregnant', filters.is_pregnant);
      if (filters.is_senior_citizen) params.append('is_senior_citizen', filters.is_senior_citizen);

      const response = await api.get(`/residents?${params.toString()}`);
      const residentsArray = response.data.data || response.data.residents || response.data || [];
      setResidents(Array.isArray(residentsArray) ? residentsArray : []);
      setTotalPages(response.data.pagination?.totalPages || response.data.totalPages || 1);
      setLoading(false);
    } catch (err) {
      const errorMessage = err.message || err.response?.data?.message || "Failed to load residents";
      setError(errorMessage);
      setResidents([]);
      setLoading(false);
    }
  };

  const loadResidentDetails = async (residentId) => {
    setDetailsLoading(true);
    try {
      const response = await api.get(`/residents/${residentId}`);
      setResidentDetails(response.data.data);
    } catch (err) {
      console.error('Error loading resident details:', err);
      alert('Failed to load complete resident details');
    } finally {
      setDetailsLoading(false);
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
      await api.delete(`/residents/${residentId}`);
      alert("Resident deleted successfully");
      loadResidents();
    } catch (err) {
      const errorMessage = err.message || err.response?.data?.message || "Failed to delete resident";
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleViewClick = (resident) => {
    setSelectedResident(resident);
    setShowViewModal(true);
    loadResidentDetails(resident.resident_id);
  };

  const handleEditClick = (residentId) => {
    const resident = residents.find(r => r.resident_id === residentId);
    if (onEdit) {
      onEdit(resident);
    }
  };

  const handleRefresh = () => {
    loadResidents();
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Gender', 'Age', 'Phone', 'Barangay', 'Address', '4Ps', 'Pregnant', 'Senior', 'Birth Reg.'];
    const csvData = residents.map(r => [
      r.resident_id,
      r.full_name,
      r.gender,
      r.age,
      r.phone || '',
      getBarangayLabel(r.barangay),
      r.address || '',
      r.is_4ps_member ? 'Yes' : 'No',
      r.is_pregnant ? 'Yes' : 'No',
      r.is_senior_citizen ? 'Yes' : 'No',
      r.is_birth_registered ? 'Yes' : 'No'
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `residents_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    const tableHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Residents List</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1e40af; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #1e40af; color: white; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-right: 4px; }
          .badge-4ps { background-color: #dcfce7; color: #166534; }
          .badge-pregnant { background-color: #fce7f3; color: #9f1239; }
          .badge-senior { background-color: #f3e8ff; color: #6b21a8; }
        </style>
      </head>
      <body>
        <h1>Residents Directory</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Gender</th>
              <th>Age</th>
              <th>Phone</th>
              <th>Barangay</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${residents.map(r => `
              <tr>
                <td>${r.resident_id}</td>
                <td>${r.full_name}</td>
                <td>${r.gender}</td>
                <td>${r.age}</td>
                <td>${r.phone || 'N/A'}</td>
                <td>${getBarangayLabel(r.barangay)}</td>
                <td>
                  ${r.is_4ps_member ? '<span class="badge badge-4ps">4Ps</span>' : ''}
                  ${r.is_pregnant ? '<span class="badge badge-pregnant">Pregnant</span>' : ''}
                  ${r.is_senior_citizen ? '<span class="badge badge-senior">Senior</span>' : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    printWindow.document.write(tableHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const closeModals = () => {
    setShowViewModal(false);
    setSelectedResident(null);
    setResidentDetails(null);
  };

  const getBarangayLabel = (value) => {
    return BARANGAYS.find(b => b.value === value)?.label || value;
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length - (filters.search ? 1 : 0);

  const toggleSelectAll = () => {
    if (selectedRows.length === residents.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(residents.map(r => r.resident_id));
    }
  };

  const toggleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-[#2b3e50] text-white px-6 py-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Users size={28} />
            <h1 className="text-2xl font-bold">Residents</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-[#3d5569] hover:bg-[#4a6376] rounded-md transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[#3d5569] hover:bg-[#4a6376] rounded-md transition-colors"
              title="Export to CSV"
            >
              <FileText size={18} />
              <span className="text-sm font-medium">CSV</span>
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-[#3d5569] hover:bg-[#4a6376] rounded-md transition-colors"
              title="Export to PDF"
            >
              <FileDown size={18} />
              <span className="text-sm font-medium">PDF</span>
            </button>
            <button
              onClick={() => (window.location.href = "/residents/new")}
              className="flex items-center gap-2 px-4 py-2 bg-[#f47920] hover:bg-[#e66d0f] rounded-md transition-colors font-semibold"
            >
              + Add Resident
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            <span className="text-sm text-gray-600">Total:</span>
            <span className="text-sm font-bold text-gray-900">{residents.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserCheck size={20} className="text-green-600" />
            <span className="text-sm text-gray-600">4Ps:</span>
            <span className="text-sm font-bold text-gray-900">
              {residents.filter(r => r.is_4ps_member).length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Heart size={20} className="text-pink-600" />
            <span className="text-sm text-gray-600">Pregnant:</span>
            <span className="text-sm font-bold text-gray-900">
              {residents.filter(r => r.is_pregnant).length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <UserCog size={20} className="text-purple-600" />
            <span className="text-sm text-gray-600">Seniors:</span>
            <span className="text-sm font-bold text-gray-900">
              {residents.filter(r => r.is_senior_citizen).length}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search residents..."
              value={filters.search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
              showFilters 
                ? 'bg-blue-50 border-blue-500 text-blue-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter size={18} />
            Filters
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Barangay</label>
              <select
                value={filters.barangay}
                onChange={(e) => handleFilterChange('barangay', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {BARANGAYS.map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Age Category</label>
              <select
                value={filters.age_category}
                onChange={(e) => handleFilterChange('age_category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {AGE_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Program Status</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.is_4ps_member === 'true'}
                    onChange={(e) => handleFilterChange('is_4ps_member', e.target.checked ? 'true' : '')}
                    className="w-4 h-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  4Ps Member
                </label>
                <label className="flex items-center text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.is_pregnant === 'true'}
                    onChange={(e) => handleFilterChange('is_pregnant', e.target.checked ? 'true' : '')}
                    className="w-4 h-4 mr-2 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  Pregnant
                </label>
                <label className="flex items-center text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.is_senior_citizen === 'true'}
                    onChange={(e) => handleFilterChange('is_senior_citizen', e.target.checked ? 'true' : '')}
                    className="w-4 h-4 mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  Senior Citizen
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex items-start gap-3">
              <X className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900">Error Loading Residents</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                {error.includes('authentication') || error.includes('401') || error.includes('Unauthorized') ? (
                  <button
                    onClick={() => window.location.href = '/login'}
                    className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
                  >
                    Go to Login
                  </button>
                ) : (
                  <button 
                    onClick={loadResidents}
                    className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-blue-600"></div>
              <p className="mt-4 text-sm text-gray-600">Loading residents...</p>
            </div>
          ) : residents.length === 0 ? (
            <div className="p-16 text-center">
              <Users className="mx-auto h-16 w-16 text-gray-300 mb-3" />
              <p className="text-base text-gray-900 font-semibold">No residents found</p>
              <p className="text-sm text-gray-600 mt-1">Try adjusting your filters or search criteria</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="w-10 px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedRows.length === residents.length && residents.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Gender
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Age
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Barangay
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {residents.map((res) => (
                      <tr 
                        key={res.resident_id} 
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(res.resident_id)}
                            onChange={() => toggleSelectRow(res.resident_id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          #{res.resident_id}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleViewClick(res)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {res.full_name}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            res.gender === 'MALE'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-pink-100 text-pink-700'
                          }`}>
                            {res.gender}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {res.age}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {res.phone || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {getBarangayLabel(res.barangay)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {res.is_4ps_member && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                4Ps
                              </span>
                            )}
                            {res.is_pregnant && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-700">
                                Pregnant
                              </span>
                            )}
                            {res.is_senior_citizen && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                Senior
                              </span>
                            )}
                            {res.is_birth_registered && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                                Birth Reg.
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewClick(res)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleEditClick(res.resident_id)}
                              className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(res.resident_id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Enhanced View Modal with Medical Records & Medicine Releases */}
      {showViewModal && selectedResident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-[#2b3e50] px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Resident Profile</h2>
              <button
                onClick={closeModals}
                className="text-white hover:bg-[#3d5569] rounded p-1 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

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
                    <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
                      <Users size={20} className="text-blue-600" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Full Name</p>
                        <p className="text-sm text-gray-900">{selectedResident.full_name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Gender</p>
                        <p className="text-sm text-gray-900">{selectedResident.gender}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Date of Birth</p>
                        <p className="text-sm text-gray-900">
                          {selectedResident.date_of_birth 
                            ? new Date(selectedResident.date_of_birth).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Age</p>
                        <p className="text-sm text-gray-900">{selectedResident.age} years</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Phone</p>
                        <p className="text-sm text-gray-900">{selectedResident.phone || 'N/A'}</p>
                      </div>
                      {selectedResident.barangay && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-1">Barangay</p>
                          <p className="text-sm text-gray-900">{getBarangayLabel(selectedResident.barangay)}</p>
                        </div>
                      )}
                      <div className="col-span-2">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Address</p>
                        <p className="text-sm text-gray-900">{selectedResident.address || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Program Status */}
                  {(selectedResident.is_4ps_member || selectedResident.is_pregnant || selectedResident.is_senior_citizen || selectedResident.is_birth_registered) && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
                        <Activity size={20} className="text-green-600" />
                        Program Status
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedResident.is_4ps_member && (
                          <div className="bg-green-50 border border-green-200 rounded-md p-3">
                            <p className="text-sm text-green-900 font-semibold">4Ps Member</p>
                          </div>
                        )}
                        {selectedResident.is_pregnant && (
                          <div className="bg-pink-50 border border-pink-200 rounded-md p-3">
                            <p className="text-sm text-pink-900 font-semibold">Pregnant</p>
                            {selectedResident.pregnancy_due_date && (
                              <p className="text-xs text-pink-800 mt-1">
                                Due: {new Date(selectedResident.pregnancy_due_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                        {selectedResident.is_senior_citizen && (
                          <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                            <p className="text-sm text-purple-900 font-semibold">Senior Citizen</p>
                          </div>
                        )}
                        {selectedResident.is_birth_registered && (
                          <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                            <p className="text-sm text-orange-900 font-semibold">Birth Registered</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Medicine Release History */}
                  {residentDetails?.medicine_releases && residentDetails.medicine_releases.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
                        <Pill size={20} className="text-purple-600" />
                        Recent Medicine Releases
                      </h3>
                      <div className="space-y-3">
                        {residentDetails.medicine_releases.map((release) => (
                          <div key={release.release_id} className="bg-gray-50 border border-gray-200 rounded-md p-4">
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

                  {/* Medical Records Section - Placeholder for future telemedicine integration */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
                      <Calendar size={20} className="text-red-600" />
                      Medical History
                    </h3>
                    
                    {/* Current Medical Info */}
                    {(selectedResident.medical_conditions || selectedResident.allergies) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                        <h4 className="text-sm font-semibold text-blue-900 mb-3">Current Medical Information</h4>
                        <div className="space-y-3">
                          {selectedResident.medical_conditions && (
                            <div>
                              <p className="text-xs font-semibold text-blue-700 mb-1">Medical Conditions</p>
                              <p className="text-sm text-blue-900">{selectedResident.medical_conditions}</p>
                            </div>
                          )}
                          {selectedResident.allergies && (
                            <div>
                              <p className="text-xs font-semibold text-blue-700 mb-1">Known Allergies</p>
                              <p className="text-sm text-blue-900">{selectedResident.allergies}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Placeholder for Consultation Records */}
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
                      <Activity size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-600 font-medium">No consultation records available</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Telemedicine and RHU consultation records will appear here
                      </p>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">
                      Emergency Contact
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Contact Person</p>
                        <p className="text-sm text-gray-900">
                          {selectedResident.emergency_contact || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Emergency Phone</p>
                        <p className="text-sm text-gray-900">
                          {selectedResident.emergency_phone || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  closeModals();
                  handleEditClick(selectedResident.resident_id);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Edit Resident
              </button>
              <button
                onClick={closeModals}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentList;