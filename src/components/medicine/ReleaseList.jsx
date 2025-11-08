import { useState, useEffect } from 'react';
import { Search, Filter, X, Eye, Edit2, Trash2, Calendar, Package, CheckCircle, Clock } from 'lucide-react';
import { useMedicineRelease } from '../../hooks/useMedicineRelease';
import api from '../../../api';

const ReleaseList = () => {
  const { 
    getReleases,
    updateRelease,
    deleteRelease,
    updateReleaseOnBlockchain,
    deleteReleaseOnBlockchain,
    updateReleaseBlockchainInfo,
    loading
  } = useMedicineRelease();
  
  const [releases, setReleases] = useState([]);
  const [filteredReleases, setFilteredReleases] = useState([]);
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [medicines, setMedicines] = useState([]);

  useEffect(() => {
    fetchReleases();
    fetchMedicines();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [releases, searchTerm, selectedMedicine, selectedStatus, startDate, endDate]);

  const fetchReleases = async () => {
    try {
      const data = await getReleases();
      const releasesArray = data?.data || [];
      setReleases(releasesArray);
      setFilteredReleases(releasesArray);
    } catch (error) {
      console.error('Error fetching releases:', error);
      setReleases([]);
      setFilteredReleases([]);
    }
  };

  const fetchMedicines = async () => {
    try {
      const { data: json } = await api.get('/medicines');
      const medicineArray = json?.data || [];
      setMedicines(medicineArray);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      setMedicines([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...releases];

    if (searchTerm) {
      filtered = filtered.filter(release =>
        release.resident_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        release.medicine?.medicine_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        release.concern?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedMedicine) {
      filtered = filtered.filter(release => release.medicine_id === parseInt(selectedMedicine));
    }

    if (selectedStatus) {
      if (selectedStatus === 'synced') {
        filtered = filtered.filter(release => release.blockchain_tx_hash);
      } else if (selectedStatus === 'pending') {
        filtered = filtered.filter(release => !release.blockchain_tx_hash);
      }
    }

    if (startDate) {
      filtered = filtered.filter(release => new Date(release.date_released) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(release => new Date(release.date_released) <= new Date(endDate));
    }

    setFilteredReleases(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMedicine('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
  };

  const totalReleases = releases.length;
  const totalQuantity = releases.reduce((sum, r) => sum + (r.quantity_released || 0), 0);
  const syncedCount = releases.filter(r => r.blockchain_tx_hash).length;
  const pendingCount = releases.filter(r => !r.blockchain_tx_hash).length;

  const handleView = (release) => {
    setSelectedRelease(release);
    setShowViewModal(true);
  };

  const handleEditClick = (release) => {
    setSelectedRelease(release);
    setEditFormData({
      resident_name: release.resident_name || '',
      resident_age: release.resident_age || '',
      concern: release.concern || '',
      quantity_released: release.quantity_released || '',
      notes: release.notes || '',
      date_released: release.date_released ? new Date(release.date_released).toISOString().split('T')[0] : '',
      prescription_number: release.prescription_number || '',
      prescribing_doctor: release.prescribing_doctor || '',
      dosage_instructions: release.dosage_instructions || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const updated = await updateRelease(selectedRelease.release_id, {
        ...editFormData,
        resident_age: editFormData.resident_age ? parseInt(editFormData.resident_age) : null,
        quantity_released: parseInt(editFormData.quantity_released),
        date_released: new Date(editFormData.date_released).toISOString()
      });

      try {
        const chain = await updateReleaseOnBlockchain(selectedRelease.release_id, {
          ...selectedRelease,
          ...editFormData,
          quantity_released: parseInt(editFormData.quantity_released),
          date_released: new Date(editFormData.date_released).toISOString()
        });
        await updateReleaseBlockchainInfo(selectedRelease.release_id, {
          blockchain_hash: chain.dataHash,
          blockchain_tx_hash: chain.transactionHash
        });
      } catch (chainErr) {
        console.error('Release blockchain update failed:', chainErr);
        alert('Updated in database, but blockchain sync failed. It will remain pending.');
      }

      alert('Release updated successfully!');
      setShowEditModal(false);
      fetchReleases();
    } catch (error) {
      console.error('Error updating release:', error);
      alert('Failed to update release: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (release) => {
    if (!window.confirm(`Are you sure you want to delete this release for ${release.resident_name}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      try {
        await deleteReleaseOnBlockchain(release.release_id);
      } catch (chainErr) {
        console.error('Blockchain delete failed:', chainErr);
      }

      await deleteRelease(release.release_id);
      
      alert('Release deleted successfully!');
      fetchReleases();
    } catch (error) {
      console.error('Error deleting release:', error);
      alert('Failed to delete release: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const activeFiltersCount = [searchTerm, selectedMedicine, selectedStatus, startDate, endDate].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Medicine Releases</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage medicine distribution records</p>
            </div>
            
            {/* Stats Compact */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-900">{totalReleases}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-900">{totalQuantity}</div>
                <div className="text-xs text-gray-500">Quantity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-emerald-600">{syncedCount}</div>
                <div className="text-xs text-gray-500">Synced</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-amber-600">{pendingCount}</div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by resident, medicine, or concern..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-3 grid grid-cols-4 gap-3 pt-3 border-t border-gray-200">
              <select
                value={selectedMedicine}
                onChange={(e) => setSelectedMedicine(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Medicines</option>
                {Array.isArray(medicines) && medicines.map(med => (
                  <option key={med.medicine_id} value={med.medicine_id}>
                    {med.medicine_name}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="synced">Synced</option>
                <option value="pending">Pending</option>
              </select>
              
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Start Date"
              />
              
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="End Date"
              />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="px-6 py-4">
        {loading ? (
          <div className="bg-white rounded border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Loading releases...</p>
          </div>
        ) : filteredReleases.length === 0 ? (
          <div className="bg-white rounded border border-gray-200 p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No releases found</p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Medicine</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Resident</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Concern</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReleases.map((release) => (
                  <tr key={release.release_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {new Date(release.date_released).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {release.medicine?.medicine_name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {release.resident_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {release.quantity_released}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {release.concern || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {release.blockchain_tx_hash ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          <CheckCircle className="w-3 h-3" />
                          Synced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(release)}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditClick(release)}
                          className="p-1.5 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(release)}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          disabled={actionLoading}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedRelease && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Release Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRelease.medicine?.medicine_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Number</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRelease.stock?.batch_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Resident Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRelease.resident_name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Age</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRelease.resident_age || 'N/A'}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Medical Concern</label>
                <p className="mt-1 text-sm text-gray-900">{selectedRelease.concern || '-'}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Released</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRelease.quantity_released}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date Released</label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(selectedRelease.date_released).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</label>
                <p className="mt-1 text-sm text-gray-900">{selectedRelease.notes || '-'}</p>
              </div>

              {(selectedRelease.prescription_number || selectedRelease.prescribing_doctor || selectedRelease.dosage_instructions) && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Prescription Details</h3>
                  <div className="space-y-4">
                    {selectedRelease.prescription_number && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Prescription Number</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRelease.prescription_number}</p>
                      </div>
                    )}
                    {selectedRelease.prescribing_doctor && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Prescribing Doctor</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRelease.prescribing_doctor}</p>
                      </div>
                    )}
                    {selectedRelease.dosage_instructions && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage Instructions</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRelease.dosage_instructions}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedRelease.blockchain_tx_hash && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Blockchain Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Hash</label>
                      <p className="mt-1 text-xs text-gray-600 break-all font-mono bg-gray-50 p-2 rounded">{selectedRelease.blockchain_tx_hash}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Data Hash</label>
                      <p className="mt-1 text-xs text-gray-600 break-all font-mono bg-gray-50 p-2 rounded">{selectedRelease.blockchain_hash}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowViewModal(false)}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedRelease && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Edit Release</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resident Name *</label>
                    <input
                      type="text"
                      value={editFormData.resident_name}
                      onChange={(e) => setEditFormData({...editFormData, resident_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <input
                      type="number"
                      value={editFormData.resident_age}
                      onChange={(e) => setEditFormData({...editFormData, resident_age: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical Concern</label>
                  <input
                    type="text"
                    value={editFormData.concern}
                    onChange={(e) => setEditFormData({...editFormData, concern: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      value={editFormData.quantity_released}
                      onChange={(e) => setEditFormData({...editFormData, quantity_released: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Released *</label>
                    <input
                      type="date"
                      value={editFormData.date_released}
                      onChange={(e) => setEditFormData({...editFormData, date_released: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Prescription Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prescription Number</label>
                      <input
                        type="text"
                        value={editFormData.prescription_number}
                        onChange={(e) => setEditFormData({...editFormData, prescription_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prescribing Doctor</label>
                      <input
                        type="text"
                        value={editFormData.prescribing_doctor}
                        onChange={(e) => setEditFormData({...editFormData, prescribing_doctor: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dosage Instructions</label>
                      <textarea
                        value={editFormData.dosage_instructions}
                        onChange={(e) => setEditFormData({...editFormData, dosage_instructions: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {actionLoading ? 'Updating...' : 'Update & Sync to Blockchain'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReleaseList;