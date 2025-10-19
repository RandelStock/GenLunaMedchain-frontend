import { useState, useEffect } from 'react';
import { Package, TrendingUp, TrendingDown, ExternalLink, Calendar, Hash, User } from 'lucide-react';
import api from '../../../api';

export default function StockTransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
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

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'ADDITION':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'REMOVAL':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'ADDITION':
        return 'bg-green-50 border-green-200';
      case 'REMOVAL':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const totalQuantityAdded = filteredTransactions
    .filter(t => t.transaction_type === 'ADDITION')
    .reduce((sum, t) => sum + t.quantity_changed, 0);

  const totalQuantityRemoved = filteredTransactions
    .filter(t => t.transaction_type === 'REMOVAL')
    .reduce((sum, t) => sum + t.quantity_changed, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-900">Loading transaction history...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <p className="text-red-600 font-semibold mb-2">Error</p>
              <p className="text-sm text-gray-900 mb-4">{error}</p>
              <button 
                onClick={fetchTransactions}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Transaction History</h1>
          <p className="text-gray-900">View all stock additions and removals</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-700 mb-1">Total Transactions</p>
            <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-700 mb-1">Total Added</p>
            <p className="text-2xl font-bold text-green-600">+{totalQuantityAdded}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-700 mb-1">Total Removed</p>
            <p className="text-2xl font-bold text-red-600">-{totalQuantityRemoved}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-700 mb-1">On Blockchain</p>
            <p className="text-2xl font-bold text-green-600">
              {filteredTransactions.filter(t => t.blockchain_tx_hash).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search medicine, batch, notes..."
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />

            <select
              name="transaction_type"
              value={filters.transaction_type}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />

            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30 text-gray-400" />
              <p className="text-gray-900">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Medicine</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Batch</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Before/After</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Performed By</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Blockchain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.map((tx, index) => (
                    <tr key={tx.transaction_id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(tx.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(tx.transaction_type)}
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            tx.transaction_type === 'ADDITION' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {tx.transaction_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">
                          {tx.stock?.medicine?.medicine_name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {tx.stock?.batch_number || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-semibold ${
                          tx.transaction_type === 'ADDITION' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {tx.transaction_type === 'ADDITION' ? '+' : '-'}{tx.quantity_changed}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {tx.quantity_before} → {tx.quantity_after}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {tx.performed_by_wallet ? (
                          <span className="text-xs font-mono text-gray-600">
                            {tx.performed_by_wallet.slice(0, 6)}...{tx.performed_by_wallet.slice(-4)}
                          </span>
                        ) : (
                          <span className="text-gray-600">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {tx.blockchain_tx_hash ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                            <a
                              href={`https://etherscan.io/tx/${tx.blockchain_tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1 font-medium"
                            >
                              View
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                            <span className="text-xs text-orange-600 font-medium">Pending</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}