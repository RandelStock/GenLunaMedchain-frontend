import { useState, useEffect } from "react";
import { Search, Filter, X, Eye, Edit2, Trash2, RefreshCw, FileDown, FileText, ChevronLeft, ChevronRight, UserCheck, Heart, UserCog, Users, Pill, Activity, Calendar } from "lucide-react";
import api from '../../../api.js';
import { Link } from 'react-router-dom';
import ResidentProfileModal from './ResidentProfileModal';

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
    is_philhealth_member: "",
    is_pregnant: "",
    is_senior_citizen: "",
    is_profile_complete: ""
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [residentDetails, setResidentDetails] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
      if (filters.is_philhealth_member) params.append('is_philhealth_member', filters.is_philhealth_member);
      if (filters.is_pregnant) params.append('is_pregnant', filters.is_pregnant);
      if (filters.is_senior_citizen) params.append('is_senior_citizen', filters.is_senior_citizen);
      if (filters.is_profile_complete) params.append('is_profile_complete', filters.is_profile_complete);

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
      is_philhealth_member: "",
      is_pregnant: "",
      is_senior_citizen: "",
      is_profile_complete: ""
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

  const handleEditClick = async (residentId) => {
    const resident = residents.find(r => r.resident_id === residentId);
    if (!resident) return;
    
    // Load full details for editing
    try {
      const response = await api.get(`/residents/${residentId}`);
      const fullResident = response.data.data;
      
      setEditFormData({
        first_name: fullResident.first_name || '',
        last_name: fullResident.last_name || '',
        middle_name: fullResident.middle_name || '',
        date_of_birth: fullResident.date_of_birth || '',
        gender: fullResident.gender || 'MALE',
        phone: fullResident.phone || '',
        barangay: fullResident.barangay || '',
        address: fullResident.address || '',
        is_4ps_member: fullResident.is_4ps_member || false,
        is_philhealth_member: fullResident.is_philhealth_member || false,
        philhealth_number: fullResident.philhealth_number || '',
        is_pregnant: fullResident.is_pregnant || false,
        is_senior_citizen: fullResident.is_senior_citizen || false,
        is_birth_registered: fullResident.is_birth_registered || false,
        other_program: fullResident.other_program || '',
        pregnancy_due_date: fullResident.pregnancy_due_date || '',
        medical_conditions: fullResident.medical_conditions || '',
        allergies: fullResident.allergies || '',
        emergency_contact: fullResident.emergency_contact || '',
        emergency_phone: fullResident.emergency_phone || ''
      });
      
      setSelectedResident(fullResident);
      setShowEditModal(true);
    } catch (err) {
      console.error('Error loading resident for edit:', err);
      alert('Failed to load resident details for editing');
    }
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEdit = async () => {
    if (!selectedResident) return;
    
    setSaving(true);
    try {
      await api.put(`/residents/${selectedResident.resident_id}`, editFormData);
      alert('Resident updated successfully!');
      setShowEditModal(false);
      setSelectedResident(null);
      setEditFormData(null);
      loadResidents(); // Reload the list
    } catch (err) {
      console.error('Error updating resident:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update resident';
      alert(`Error: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    loadResidents();
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Gender', 'Age', 'Phone', 'Barangay', 'Address', '4Ps', 'PhilHealth', 'Pregnant', 'Senior', 'Birth Reg.'];
    const csvData = residents.map(r => [
      r.resident_id,
      r.full_name,
      r.gender,
      r.age,
      r.phone || '',
      getBarangayLabel(r.barangay),
      r.address || '',
      r.is_4ps_member ? 'Yes' : 'No',
      r.is_philhealth_member ? 'Yes' : 'No',
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


  const exportToPDF = async () => {
    try {
      console.log('Starting PDF export...');
      
      // Use the optimized export endpoint
      const response = await api.get('/residents/export/all');
      const allResidents = response.data.data || [];
      
      if (!Array.isArray(allResidents) || allResidents.length === 0) {
        alert('No residents to export');
        return;
      }

      console.log(`Successfully fetched ${allResidents.length} residents for export`);

      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        alert('Please allow pop-ups to export PDF');
        return;
      }
      
      const tableHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Residents List - Complete Directory</title>
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              font-size: 10px;
            }
            h1 { 
              color: #1e40af; 
              margin-bottom: 10px;
              font-size: 18px;
            }
            .header-info {
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #1e40af;
            }
            .stats {
              display: flex;
              gap: 20px;
              margin-bottom: 15px;
              font-size: 11px;
              flex-wrap: wrap;
            }
            .stat-item {
              padding: 5px 10px;
              background: #f0f0f0;
              border-radius: 4px;
            }
            .stat-label {
              font-weight: bold;
              color: #666;
            }
            .stat-value {
              font-weight: bold;
              color: #1e40af;
              margin-left: 5px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
              font-size: 9px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 6px 4px; 
              text-align: left;
              word-wrap: break-word;
            }
            th { 
              background-color: #1e40af; 
              color: white;
              font-weight: bold;
              position: sticky;
              top: 0;
            }
            tr:nth-child(even) { 
              background-color: #f9fafb; 
            }
            .badge { 
              display: inline-block; 
              padding: 2px 5px; 
              border-radius: 3px; 
              font-size: 8px; 
              margin-right: 3px;
              font-weight: bold;
              white-space: nowrap;
            }
            .badge-4ps { 
              background-color: #dcfce7; 
              color: #166534; 
            }
            .badge-philhealth { 
              background-color: #ccfbf1; 
              color: #115e59; 
            }
            .badge-pregnant { 
              background-color: #fce7f3; 
              color: #9f1239; 
            }
            .badge-senior { 
              background-color: #f3e8ff; 
              color: #6b21a8; 
            }
            .badge-birth { 
              background-color: #ffedd5; 
              color: #9a3412; 
            }
            .footer {
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 9px;
            }
          </style>
        </head>
        <body>
          <div class="header-info">
            <h1>📋 Residents Complete Directory</h1>
            <p style="margin: 5px 0; color: #666;">Generated on: ${new Date().toLocaleString()}</p>
            <div class="stats">
              <div class="stat-item">
                <span class="stat-label">Total Residents:</span>
                <span class="stat-value">${allResidents.length}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">4Ps Members:</span>
                <span class="stat-value">${allResidents.filter(r => r.is_4ps_member).length}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">PhilHealth:</span>
                <span class="stat-value">${allResidents.filter(r => r.is_philhealth_member).length}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Pregnant:</span>
                <span class="stat-value">${allResidents.filter(r => r.is_pregnant).length}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Seniors:</span>
                <span class="stat-value">${allResidents.filter(r => r.is_senior_citizen).length}</span>
              </div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 5%;">ID</th>
                <th style="width: 20%;">Name</th>
                <th style="width: 8%;">Gender</th>
                <th style="width: 5%;">Age</th>
                <th style="width: 12%;">Phone</th>
                <th style="width: 18%;">Barangay</th>
                <th style="width: 32%;">Status & Programs</th>
              </tr>
            </thead>
            <tbody>
              ${allResidents.map(r => `
                <tr>
                  <td>${r.resident_id}</td>
                  <td style="font-weight: bold;">${r.full_name || `${r.first_name} ${r.last_name}`}</td>
                  <td>${r.gender}</td>
                  <td>${r.age || 'N/A'}</td>
                  <td>${r.phone || 'N/A'}</td>
                  <td>${getBarangayLabel(r.barangay)}</td>
                  <td>
                    ${r.is_4ps_member ? '<span class="badge badge-4ps">4Ps</span>' : ''}
                    ${r.is_philhealth_member ? '<span class="badge badge-philhealth">PhilHealth</span>' : ''}
                    ${r.is_pregnant ? '<span class="badge badge-pregnant">Pregnant</span>' : ''}
                    ${r.is_senior_citizen ? '<span class="badge badge-senior">Senior</span>' : ''}
                    ${r.is_birth_registered ? '<span class="badge badge-birth">Birth Reg</span>' : ''}
                    ${!r.is_4ps_member && !r.is_philhealth_member && !r.is_pregnant && !r.is_senior_citizen && !r.is_birth_registered ? '<span style="color: #999;">None</span>' : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p><strong>GenLuna MedChain</strong> - Barangay Health Center Management System</p>
            <p>Total Records: ${allResidents.length} | Document generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(tableHTML);
      printWindow.document.close();
      printWindow.focus();
      
      // Give the browser time to render before printing
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      
      let errorMessage = 'Failed to export PDF';
      
      if (error.response?.status === 504 || error.response?.status === 500) {
        errorMessage = 'Server timeout while fetching residents. The database may be under heavy load. Please try again in a moment.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  const closeModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setSelectedResident(null);
    setResidentDetails(null);
    setEditFormData(null);
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
            <Link
              to="/residents/new"
              className="flex items-center gap-2 px-4 py-2 bg-[#f47920] hover:bg-[#e66d0f] rounded-md transition-colors font-semibold"
            >
              + Add Resident
            </Link>
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
            <Activity size={20} className="text-teal-600" />
            <span className="text-sm text-gray-600">PhilHealth:</span>
            <span className="text-sm font-bold text-gray-900">
              {residents.filter(r => r.is_philhealth_member).length}
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {AGE_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Program Status</label>
              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center text-sm cursor-pointer text-black">
                  <input
                    type="checkbox"
                    checked={filters.is_4ps_member === 'true'}
                    onChange={(e) => handleFilterChange('is_4ps_member', e.target.checked ? 'true' : '')}
                    className="w-4 h-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  4Ps Member
                </label>
                <label className="flex items-center text-sm cursor-pointer text-black">
                  <input
                    type="checkbox"
                    checked={filters.is_philhealth_member === 'true'}
                    onChange={(e) => handleFilterChange('is_philhealth_member', e.target.checked ? 'true' : '')}
                    className="w-4 h-4 mr-2 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  PhilHealth
                </label>
                <label className="flex items-center text-sm cursor-pointer text-black">
                  <input
                    type="checkbox"
                    checked={filters.is_pregnant === 'true'}
                    onChange={(e) => handleFilterChange('is_pregnant', e.target.checked ? 'true' : '')}
                    className="w-4 h-4 mr-2 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  Pregnant
                </label>
                <label className="flex items-center text-sm cursor-pointer text-black">
                  <input
                    type="checkbox"
                    checked={filters.is_senior_citizen === 'true'}
                    onChange={(e) => handleFilterChange('is_senior_citizen', e.target.checked ? 'true' : '')}
                    className="w-4 h-4 mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  Senior Citizen
                </label>
                <label className="flex items-center text-sm cursor-pointer text-black">
                  <input
                    type="checkbox"
                    checked={filters.is_profile_complete === 'false'}
                    onChange={(e) => handleFilterChange('is_profile_complete', e.target.checked ? 'false' : '')}
                    className="w-4 h-4 mr-2 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                  />
                  Incomplete Profile
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
                            {!res.is_profile_complete && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                ⚠️ Incomplete
                              </span>
                            )}
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

      {/* View Modal */}
      {showViewModal && (
        <ResidentProfileModal
          resident={selectedResident}
          residentDetails={residentDetails}
          detailsLoading={detailsLoading}
          onClose={closeModals}
          onEdit={handleEditClick}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editFormData && selectedResident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-[#2b3e50] px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Edit Resident</h2>
              <button
                onClick={closeModals}
                className="text-white hover:bg-[#3d5569] rounded p-1 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Personal Information */}
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={editFormData.first_name}
                      onChange={(e) => handleEditFormChange('first_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={editFormData.last_name}
                      onChange={(e) => handleEditFormChange('last_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Middle Name</label>
                    <input
                      type="text"
                      value={editFormData.middle_name}
                      onChange={(e) => handleEditFormChange('middle_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      value={editFormData.date_of_birth}
                      onChange={(e) => handleEditFormChange('date_of_birth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Gender *</label>
                    <select
                      value={editFormData.gender}
                      onChange={(e) => handleEditFormChange('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => handleEditFormChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Barangay</label>
                    <select
                      value={editFormData.barangay}
                      onChange={(e) => handleEditFormChange('barangay', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Barangay</option>
                      {BARANGAYS.slice(1).map(b => (
                        <option key={b.value} value={b.value}>{b.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                    <textarea
                      value={editFormData.address}
                      onChange={(e) => handleEditFormChange('address', e.target.value)}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Program Status */}
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-4">Program Status</h3>
                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.is_4ps_member}
                      onChange={(e) => handleEditFormChange('is_4ps_member', e.target.checked)}
                      className="w-4 h-4 mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">4Ps Member</span>
                  </label>
                  
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.is_philhealth_member}
                      onChange={(e) => handleEditFormChange('is_philhealth_member', e.target.checked)}
                      className="w-4 h-4 mr-3 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm font-medium text-gray-700">PhilHealth Member</span>
                  </label>
                  
                  {editFormData.is_philhealth_member && (
                    <div className="ml-7">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">PhilHealth Number</label>
                      <input
                        type="text"
                        value={editFormData.philhealth_number}
                        onChange={(e) => handleEditFormChange('philhealth_number', e.target.value)}
                        placeholder="XX-XXXXXXXXX-X"
                        className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.is_pregnant}
                      onChange={(e) => handleEditFormChange('is_pregnant', e.target.checked)}
                      className="w-4 h-4 mr-3 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Pregnant</span>
                  </label>
                  {editFormData.is_pregnant && (
                    <div className="ml-7">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={editFormData.pregnancy_due_date}
                        onChange={(e) => handleEditFormChange('pregnancy_due_date', e.target.value)}
                        className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.is_senior_citizen}
                      onChange={(e) => handleEditFormChange('is_senior_citizen', e.target.checked)}
                      className="w-4 h-4 mr-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Senior Citizen</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.is_birth_registered}
                      onChange={(e) => handleEditFormChange('is_birth_registered', e.target.checked)}
                      className="w-4 h-4 mr-3 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Birth Registered</span>
                  </label>
                  
                  <div className="pt-3 border-t border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Other Programs/Memberships</label>
                    <input
                      type="text"
                      value={editFormData.other_program}
                      onChange={(e) => handleEditFormChange('other_program', e.target.value)}
                      placeholder="e.g., PWD ID, Solo Parent, Indigenous People"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter any other government programs or special categories</p>
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-4">Medical Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Medical Conditions</label>
                    <textarea
                      value={editFormData.medical_conditions}
                      onChange={(e) => handleEditFormChange('medical_conditions', e.target.value)}
                      rows="2"
                      placeholder="List any known medical conditions"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Allergies</label>
                    <textarea
                      value={editFormData.allergies}
                      onChange={(e) => handleEditFormChange('allergies', e.target.value)}
                      rows="2"
                      placeholder="List any known allergies"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-4">Emergency Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={editFormData.emergency_contact}
                      onChange={(e) => handleEditFormChange('emergency_contact', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Emergency Phone</label>
                    <input
                      type="tel"
                      value={editFormData.emergency_phone}
                      onChange={(e) => handleEditFormChange('emergency_phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeModals}
                disabled={saving}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentList;