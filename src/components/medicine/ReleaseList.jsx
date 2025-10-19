import { useState, useEffect } from 'react';
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
      
      // Backend returns { success: true, data: [...] }
      const releasesArray = data?.data || [];
      
      console.log('Fetched releases:', releasesArray);
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

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(release =>
        release.resident_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        release.medicine?.medicine_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        release.concern?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Medicine filter
    if (selectedMedicine) {
      filtered = filtered.filter(release => release.medicine_id === parseInt(selectedMedicine));
    }

    // Status filter
    if (selectedStatus) {
      if (selectedStatus === 'synced') {
        filtered = filtered.filter(release => release.blockchain_tx_hash);
      } else if (selectedStatus === 'pending') {
        filtered = filtered.filter(release => !release.blockchain_tx_hash);
      }
    }

    // Date range filter
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

  // Calculate statistics
  const totalReleases = releases.length;
  const totalQuantity = releases.reduce((sum, r) => sum + (r.quantity_released || 0), 0);
  const syncedCount = releases.filter(r => r.blockchain_tx_hash).length;
  const pendingCount = releases.filter(r => !r.blockchain_tx_hash).length;

  // View Release
  const handleView = (release) => {
    setSelectedRelease(release);
    setShowViewModal(true);
  };

  // Edit Release - Open Modal
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

  // Edit Release - Submit with Blockchain
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

      // Sync blockchain after successful DB update
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

  // Delete Release with Blockchain Confirmation
  const handleDelete = async (release) => {
    if (!window.confirm(`Are you sure you want to delete this release for ${release.resident_name}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      // Attempt on-chain delete first (optional order). If it fails, continue DB delete but warn
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Medicine Releases</h1>
          <p className="text-gray-600 mt-1">View and manage medicine distribution records</p>
        </div>

        {/* Statistics Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Total Releases</p>
            <p className="text-3xl font-bold text-gray-900">{totalReleases}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Total Quantity</p>
            <p className="text-3xl font-bold text-gray-900">{totalQuantity}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">On Blockchain</p>
            <p className="text-3xl font-bold text-green-600">{syncedCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Pending Sync</p>
            <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Search resident, medicine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
            <select
              value={selectedMedicine}
              onChange={(e) => setSelectedMedicine(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="">All Status</option>
              <option value="synced">Synced</option>
              <option value="pending">Pending</option>
            </select>
            <input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
            <input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading releases...</p>
          </div>
        ) : filteredReleases.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-600">No releases found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Medicine</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Resident</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Concern</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Blockchain</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReleases.map((release) => (
                    <tr key={release.release_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
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
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {release.concern || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {release.blockchain_tx_hash ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Synced
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right space-x-2">
                        <button
                          onClick={() => handleView(release)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditClick(release)}
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(release)}
                          className="text-red-600 hover:text-red-800 font-medium"
                          disabled={actionLoading}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && selectedRelease && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Release Details</h2>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Medicine</p>
                      <p className="text-gray-900">{selectedRelease.medicine?.medicine_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Batch Number</p>
                      <p className="text-gray-900">{selectedRelease.stock?.batch_number || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Resident Name</p>
                      <p className="text-gray-900">{selectedRelease.resident_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Age</p>
                      <p className="text-gray-900">{selectedRelease.resident_age || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Medical Concern</p>
                    <p className="text-gray-900">{selectedRelease.concern || '-'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Quantity Released</p>
                      <p className="text-gray-900">{selectedRelease.quantity_released}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Date Released</p>
                      <p className="text-gray-900">{new Date(selectedRelease.date_released).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Notes</p>
                    <p className="text-gray-900">{selectedRelease.notes || '-'}</p>
                  </div>

                  {(selectedRelease.prescription_number || selectedRelease.prescribing_doctor || selectedRelease.dosage_instructions) && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold text-gray-800 mb-2">Prescription Details</h3>
                      <div className="space-y-2">
                        {selectedRelease.prescription_number && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Prescription Number</p>
                            <p className="text-gray-900">{selectedRelease.prescription_number}</p>
                          </div>
                        )}
                        {selectedRelease.prescribing_doctor && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Prescribing Doctor</p>
                            <p className="text-gray-900">{selectedRelease.prescribing_doctor}</p>
                          </div>
                        )}
                        {selectedRelease.dosage_instructions && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Dosage Instructions</p>
                            <p className="text-gray-900">{selectedRelease.dosage_instructions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedRelease.blockchain_tx_hash && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold text-gray-800 mb-2">Blockchain Info</h3>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Transaction Hash</p>
                          <p className="text-xs text-gray-600 break-all font-mono">{selectedRelease.blockchain_tx_hash}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Data Hash</p>
                          <p className="text-xs text-gray-600 break-all font-mono">{selectedRelease.blockchain_hash}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedRelease && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Edit Release</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Resident Name</label>
                      <input
                        type="text"
                        value={editFormData.resident_name}
                        onChange={(e) => setEditFormData({...editFormData, resident_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                      <input
                        type="number"
                        value={editFormData.resident_age}
                        onChange={(e) => setEditFormData({...editFormData, resident_age: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medical Concern</label>
                    <input
                      type="text"
                      value={editFormData.concern}
                      onChange={(e) => setEditFormData({...editFormData, concern: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={editFormData.quantity_released}
                        onChange={(e) => setEditFormData({...editFormData, quantity_released: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                        required
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Released</label>
                      <input
                        type="date"
                        value={editFormData.date_released}
                        onChange={(e) => setEditFormData({...editFormData, date_released: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={editFormData.notes}
                      onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                      rows="3"
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Prescription Details</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prescription Number</label>
                        <input
                          type="text"
                          value={editFormData.prescription_number}
                          onChange={(e) => setEditFormData({...editFormData, prescription_number: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prescribing Doctor</label>
                        <input
                          type="text"
                          value={editFormData.prescribing_doctor}
                          onChange={(e) => setEditFormData({...editFormData, prescribing_doctor: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dosage Instructions</label>
                        <textarea
                          value={editFormData.dosage_instructions}
                          onChange={(e) => setEditFormData({...editFormData, dosage_instructions: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                          rows="2"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {actionLoading ? 'Updating...' : 'Update & Sync to Blockchain'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReleaseList;