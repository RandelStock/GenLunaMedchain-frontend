import { useState, useEffect } from 'react';
import { Package, TrendingUp, TrendingDown, ExternalLink, Search, Filter, X, Eye } from 'lucide-react';
import api from '../../../api';

export default function StockTransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    transaction_type: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, transactions]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data } = await api.get(`/stock-transactions`);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(`Failed to load transaction history: ${err.message}`);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (filters.transaction_type) {
      filtered = filtered.filter(t => t.transaction_type === filters.transaction_type);
    }

    if (filters.start_date) {
      filtered = filtered.filter(t => 
        new Date(t.transaction_date) >= new Date(filters.start_date)
      );
    }

    if (filters.end_date) {
      filtered = filtered.filter(t => 
        new Date(t.transaction_date) <= new Date(filters.end_date)
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.stock?.medicine?.medicine_name?.toLowerCase().includes(searchLower) ||
        t.stock?.batch_number?.toLowerCase().includes(searchLower) ||
        t.notes?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      transaction_type: '',
      start_date: '',
      end_date: ''
    });
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const getBlockchainExplorerUrl = (txHash) => {
    return `https://amoy.polygonscan.com/tx/${txHash}`;

  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'ADDITION':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'REMOVAL':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const totalQuantityAdded = filteredTransactions
    .filter(t => t.transaction_type === 'ADDITION')
    .reduce((sum, t) => sum + t.quantity_changed, 0);

  const totalQuantityRemoved = filteredTransactions
    .filter(t => t.transaction_type === 'REMOVAL')
    .reduce((sum, t) => sum + t.quantity_changed, 0);

  const activeFiltersCount = [filters.search, filters.transaction_type, filters.start_date, filters.end_date].filter(Boolean).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Stock Transaction History</h1>
        </div>
        <div className="px-6 py-12">
          <div className="bg-white rounded border border-gray-200 p-12 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-600">Loading transaction history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Stock Transaction History</h1>
        </div>
        <div className="px-6 py-12">
          <div className="bg-white rounded border border-gray-200 p-12 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-sm text-gray-900 mb-4">{error}</p>
            <button 
              onClick={fetchTransactions}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Stock Transaction History</h1>
              <p className="text-sm text-gray-500 mt-0.5">Track all stock additions and removals</p>
            </div>
            
            {/* Stats Compact */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-900">{filteredTransactions.length}</div>
                <div className="text-xs text-gray-500">Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-green-600">+{totalQuantityAdded}</div>
                <div className="text-xs text-gray-500">Added</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-red-600">-{totalQuantityRemoved}</div>
                <div className="text-xs text-gray-500">Removed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-emerald-600">
                  {filteredTransactions.filter(t => t.blockchain_tx_hash).length}
                </div>
                <div className="text-xs text-gray-500">On Chain</div>
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
                name="search"
                placeholder="Search medicine, batch number, or notes..."
                value={filters.search}
                onChange={handleFilterChange}
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
            <div className="mt-3 grid grid-cols-3 gap-3 pt-3 border-t border-gray-200">
              <select
                name="transaction_type"
                value={filters.transaction_type}
                onChange={handleFilterChange}
                className="px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="ADDITION">Addition</option>
                <option value="REMOVAL">Removal</option>
              </select>

              <input
                type="date"
                name="start_date"
                value={filters.start_date}
                onChange={handleFilterChange}
                className="px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Start Date"
              />

              <input
                type="date"
                name="end_date"
                value={filters.end_date}
                onChange={handleFilterChange}
                className="px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="End Date"
              />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="px-6 py-4">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded border border-gray-200 p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No transactions found</p>
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Medicine</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Batch</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Change</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Before/After</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Performed By</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.map((tx, index) => (
                    <tr key={tx.transaction_id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {new Date(tx.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(tx.transaction_type)}
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            tx.transaction_type === 'ADDITION' 
                              ? 'bg-green-50 text-green-700' 
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {tx.transaction_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {tx.stock?.medicine?.medicine_name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {tx.stock?.batch_number || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-semibold ${
                          tx.transaction_type === 'ADDITION' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {tx.transaction_type === 'ADDITION' ? '+' : '-'}{tx.quantity_changed}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {tx.quantity_before} → {tx.quantity_after}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {tx.performed_by_wallet ? (
                          <span className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            {tx.performed_by_wallet.slice(0, 6)}...{tx.performed_by_wallet.slice(-4)}
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(tx)}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {tx.blockchain_tx_hash && (
                            <a
                              href={getBlockchainExplorerUrl(tx.blockchain_tx_hash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                              title="View on Blockchain Explorer"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Transaction Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Transaction Type Badge */}
              <div className="flex items-center gap-3">
                {getTransactionIcon(selectedTransaction.transaction_type)}
                <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${
                  selectedTransaction.transaction_type === 'ADDITION' 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}>
                  {selectedTransaction.transaction_type}
                </span>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedTransaction.transaction_date).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">
                    {selectedTransaction.transaction_id || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Medicine & Stock Info */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Medicine & Stock Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine Name</label>
                    <p className="mt-1 text-sm text-gray-900 font-medium">
                      {selectedTransaction.stock?.medicine?.medicine_name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Number</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedTransaction.stock?.batch_number || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Generic Name</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedTransaction.stock?.medicine?.generic_name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage Form</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedTransaction.stock?.medicine?.dosage_form || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quantity Changes */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Quantity Changes</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Before</label>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {selectedTransaction.quantity_before}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Change</label>
                    <p className={`mt-1 text-2xl font-semibold ${
                      selectedTransaction.transaction_type === 'ADDITION' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {selectedTransaction.transaction_type === 'ADDITION' ? '+' : '-'}
                      {selectedTransaction.quantity_changed}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity After</label>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {selectedTransaction.quantity_after}
                    </p>
                  </div>
                </div>
              </div>

              {/* Performed By */}
              {selectedTransaction.performed_by_wallet && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Performed By</h3>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet Address</label>
                    <p className="mt-1 text-xs text-gray-600 break-all font-mono bg-gray-50 p-3 rounded">
                      {selectedTransaction.performed_by_wallet}
                    </p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedTransaction.notes && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Notes</h3>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                    {selectedTransaction.notes}
                  </p>
                </div>
              )}

              {/* Blockchain Info */}
              {selectedTransaction.blockchain_tx_hash && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Blockchain Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Hash</label>
                      <p className="mt-1 text-xs text-gray-600 break-all font-mono bg-gray-50 p-3 rounded">
                        {selectedTransaction.blockchain_tx_hash}
                      </p>
                    </div>
                    {selectedTransaction.blockchain_hash && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Data Hash</label>
                        <p className="mt-1 text-xs text-gray-600 break-all font-mono bg-gray-50 p-3 rounded">
                          {selectedTransaction.blockchain_hash}
                        </p>
                      </div>
                    )}
                    <a
                      href={getBlockchainExplorerUrl(selectedTransaction.blockchain_tx_hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors text-sm font-medium"
                    >
                      View on Blockchain Explorer
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}

              {!selectedTransaction.blockchain_tx_hash && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                      <p className="text-sm text-amber-800 font-medium">
                        This transaction is pending blockchain confirmation
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}