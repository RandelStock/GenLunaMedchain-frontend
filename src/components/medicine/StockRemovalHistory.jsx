import { useState, useEffect } from 'react';
import { useStockRemoval } from '../../hooks/useStockRemoval';
import { useAddress } from '@thirdweb-dev/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import RemovalStatistics from './RemovalStatistics';
import API_BASE_URL from '../../config.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const API_URL = API_BASE_URL;

const REMOVAL_REASONS = {
  EXPIRED: { label: 'Expired', icon: '⏰', color: 'red' },
  ENTRY_ERROR: { label: 'Entry Error', icon: '✏️', color: 'orange' },
  DAMAGED: { label: 'Damaged', icon: '💔', color: 'yellow' },
  LOST: { label: 'Lost', icon: '🔍', color: 'gray' },
  OTHER: { label: 'Other', icon: '📋', color: 'blue' }
};

const StockRemovalHistory = () => {
  const { getRemovals, verifyRemovalHash, generateRemovalHash, loading } = useStockRemoval();
  const address = useAddress();

  const [removals, setRemovals] = useState([]);
  const [filteredRemovals, setFilteredRemovals] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedRemoval, setSelectedRemoval] = useState(null);
  const [verifying, setVerifying] = useState({});
  const [showStatistics, setShowStatistics] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    medicine_id: '',
    reason: '',
    start_date: '',
    end_date: '',
    search: ''
  });

  const [medicines, setMedicines] = useState([]);

  useEffect(() => {
    loadData();
    loadMedicines();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, removals]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const data = await getRemovals();
      setRemovals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load removals:', err);
      setRemovals([]);
      alert('Error loading removal history: ' + err.message);
    } finally {
      setLoadingData(false);
    }
  };

  const loadMedicines = async () => {
    try {
      const response = await fetch(`${API_URL}/medicines`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const json = await response.json();
        setMedicines(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load medicines:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...removals];

    if (filters.medicine_id) {
      filtered = filtered.filter(r => r.medicine_id === parseInt(filters.medicine_id));
    }

    if (filters.reason) {
      filtered = filtered.filter(r => r.reason === filters.reason);
    }

    if (filters.start_date) {
      filtered = filtered.filter(r => 
        new Date(r.date_removed) >= new Date(filters.start_date)
      );
    }
    if (filters.end_date) {
      filtered = filtered.filter(r => 
        new Date(r.date_removed) <= new Date(filters.end_date)
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(r => 
        r.medicine?.medicine_name?.toLowerCase().includes(searchLower) ||
        r.stock?.batch_number?.toLowerCase().includes(searchLower) ||
        r.notes?.toLowerCase().includes(searchLower) ||
        r.removed_by_user?.full_name?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredRemovals(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      medicine_id: '',
      reason: '',
      start_date: '',
      end_date: '',
      search: ''
    });
  };

  const verifyOnBlockchain = async (removal) => {
    try {
      setVerifying(prev => ({ ...prev, [removal.removal_id]: true }));
      const expectedHash = generateRemovalHash(removal);
      const isValid = await verifyRemovalHash(removal.removal_id, expectedHash);
      alert(
        isValid 
          ? '✅ Verification successful! Data matches blockchain record.' 
          : '❌ Verification failed! Data does not match blockchain record or record not found.'
      );
    } catch (err) {
      console.error('Verification error:', err);
      alert('Error verifying: ' + err.message);
    } finally {
      setVerifying(prev => ({ ...prev, [removal.removal_id]: false }));
    }
  };

  const viewDetails = (removal) => {
    setSelectedRemoval(removal);
  };

  const closeDetails = () => {
    setSelectedRemoval(null);
  };

  const getReasonBadge = (reason) => {
    const config = REMOVAL_REASONS[reason] || REMOVAL_REASONS.OTHER;
    const colorClasses = {
      red: 'bg-red-100 text-red-800 border-red-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200'
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${colorClasses[config.color]}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Removal History</h1>
              <p className="text-gray-600">View and verify all stock removals recorded on the blockchain</p>
            </div>
            <button
              onClick={() => setShowStatistics(!showStatistics)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {showStatistics ? 'Hide Statistics' : 'Show Statistics'}
            </button>
          </div>
        </div>

        {/* Statistics Section */}
        {showStatistics && (
          <div className="mb-6">
            <RemovalStatistics removals={filteredRemovals} />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search medicine, batch, notes..."
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <select
              name="medicine_id"
              value={filters.medicine_id}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Medicines</option>
              {medicines.map(med => (
                <option key={med.medicine_id} value={med.medicine_id}>
                  {med.medicine_name}
                </option>
              ))}
            </select>

            <select
              name="reason"
              value={filters.reason}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Reasons</option>
              {Object.entries(REMOVAL_REASONS).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>

            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loadingData ? (
            <div className="p-8 text-center">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <p className="text-gray-600 mt-4">Loading removal history...</p>
            </div>
          ) : filteredRemovals.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No removal records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Medicine</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Batch</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Reason</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Removed By</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRemovals.map(removal => (
                    <tr key={removal.removal_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(removal.date_removed).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">
                          {removal.medicine?.medicine_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {removal.medicine?.strength}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {removal.stock?.batch_number}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-red-600">
                        -{removal.quantity_removed}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getReasonBadge(removal.reason)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {removal.removed_by_user?.full_name || (
                          <span className="text-xs font-mono text-gray-400">
                            {removal.removed_by_wallet?.slice(0, 6)}...{removal.removed_by_wallet?.slice(-4)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => viewDetails(removal)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRemoval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Removal Details</h2>
                <button
                  onClick={closeDetails}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Medicine Info */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Medicine Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-700">Name:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedRemoval.medicine?.medicine_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-700">Generic:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedRemoval.medicine?.generic_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-700">Strength:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedRemoval.medicine?.strength}</span>
                    </div>
                    <div>
                      <span className="text-gray-700">Form:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedRemoval.medicine?.dosage_form}</span>
                    </div>
                  </div>
                </div>

                {/* Stock Info */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Stock Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-700">Batch Number:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedRemoval.stock?.batch_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-700">Expiry Date:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {new Date(selectedRemoval.stock?.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700">Storage Location:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedRemoval.stock?.storage_location || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-700">Current Stock:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedRemoval.stock?.remaining_quantity} units</span>
                    </div>
                  </div>
                </div>

                {/* Removal Details */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Removal Details</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-700">Quantity Removed:</span>
                      <span className="ml-2 font-medium text-red-600">{selectedRemoval.quantity_removed} units</span>
                    </div>
                    <div>
                      <span className="text-gray-700">Reason:</span>
                      <span className="ml-2">{getReasonBadge(selectedRemoval.reason)}</span>
                    </div>
                    <div>
                      <span className="text-gray-700">Date Removed:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {new Date(selectedRemoval.date_removed).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700">Removed By:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {selectedRemoval.removed_by_user?.full_name || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  {selectedRemoval.notes && (
                    <div className="mt-3">
                      <span className="text-gray-700 text-sm">Notes:</span>
                      <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">
                        {selectedRemoval.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Blockchain Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Blockchain Information</h3>
                  {selectedRemoval.blockchain_tx_hash ? (
                    <div className="space-y-2 text-sm">
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                          <span className="font-medium text-green-800">Synced to Blockchain</span>
                        </div>
                        <div className="space-y-1">
                          <div>
                            <span className="text-gray-700">Transaction Hash:</span>
                            <p className="font-mono text-xs text-gray-900 break-all mt-1">
                              {selectedRemoval.blockchain_tx_hash}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-700">Data Hash:</span>
                            <p className="font-mono text-xs text-gray-900 break-all mt-1">
                              {selectedRemoval.blockchain_hash}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-700">Wallet Address:</span>
                            <p className="font-mono text-xs text-gray-900 break-all mt-1">
                              {selectedRemoval.removed_by_wallet}
                            </p>
                          </div>
                          {selectedRemoval.last_synced_at && (
                            <div>
                              <span className="text-gray-700">Last Synced:</span>
                              <span className="ml-2 text-gray-900">
                                {new Date(selectedRemoval.last_synced_at).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => verifyOnBlockchain(selectedRemoval)}
                        disabled={verifying[selectedRemoval.removal_id]}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-400"
                      >
                        {verifying[selectedRemoval.removal_id] ? 'Verifying...' : 'Verify on Blockchain'}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-orange-50 border border-orange-200 rounded p-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-orange-500 rounded-full"></span>
                        <span className="font-medium text-orange-800">Not synced to blockchain yet</span>
                      </div>
                      <p className="text-sm text-orange-700 mt-2">
                        This removal was created in the database but hasn't been recorded on the blockchain yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeDetails}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockRemovalHistory;