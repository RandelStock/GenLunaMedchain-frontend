// components/TransactionHistory.jsx
import React, { useState, useEffect } from 'react';
import { FaHistory, FaFilter, FaDownload, FaSync, FaExternalLinkAlt } from 'react-icons/fa';
import api from '../../api';

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    table: 'all',
    action: 'all',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    created: 0,
    updated: 0,
    deleted: 0,
    medicines: 0,
    stocks: 0,
    releases: 0,
    removals: 0,
    residents: 0
  });

  // Fetch transactions from audit_log
  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/audit');
      const logs = data.logs || [];
      
      setTransactions(logs);
      setFilteredTransactions(logs);
      calculateStats(logs);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...transactions];

    if (filters.table !== 'all') {
      filtered = filtered.filter(tx => tx.table_name === filters.table);
    }

    if (filters.action !== 'all') {
      filtered = filtered.filter(tx => tx.action === filters.action);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(tx => 
        new Date(tx.changed_at) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(tx => 
        new Date(tx.changed_at) <= new Date(filters.dateTo + 'T23:59:59')
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.table_name.toLowerCase().includes(searchLower) ||
        tx.action.toLowerCase().includes(searchLower) ||
        (tx.changed_by_user?.full_name || '').toLowerCase().includes(searchLower) ||
        (tx.record_id?.toString() || '').includes(searchLower)
      );
    }

    setFilteredTransactions(filtered);
    calculateStats(filtered);
  }, [filters, transactions]);

  const calculateStats = (data) => {
    setStats({
      total: data.length,
      created: data.filter(tx => tx.action === 'INSERT' || tx.action === 'CREATE' || tx.action === 'STORE').length,
      updated: data.filter(tx => tx.action === 'UPDATE').length,
      deleted: data.filter(tx => tx.action === 'DELETE').length,
      medicines: data.filter(tx => tx.table_name === 'medicines' || tx.table_name === 'medicine').length,
      stocks: data.filter(tx => tx.table_name === 'stocks' || tx.table_name === 'stock_removals' || tx.table_name === 'removal').length,
      releases: data.filter(tx => tx.table_name === 'receipts' || tx.table_name === 'medicine_releases' || tx.table_name === 'receipt').length,
      removals: data.filter(tx => tx.table_name === 'stock_removals' || tx.table_name === 'removal').length,
      residents: data.filter(tx => tx.table_name === 'residents').length
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRefresh = () => {
    fetchTransactions();
  };

  const handleExportCSV = () => {
    try {
      const csvContent = [
        ['Timestamp', 'Table', 'Action', 'Record ID', 'Changed By', 'Changes'],
        ...filteredTransactions.map(tx => [
          formatTimestamp(tx.changed_at),
          tx.table_name,
          tx.action,
          tx.record_id || 'N/A',
          tx.changed_by_user?.full_name || tx.changed_by_wallet || 'System',
          getChangeSummary(tx)
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transaction-history-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting CSV:", err);
      alert("Failed to export CSV. Please try again.");
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTableDisplayName = (tableName) => {
    const names = {
      'medicines': 'Medicine',
      'medicine': 'Medicine',
      'stocks': 'Stock',
      'receipts': 'Release',
      'medicine_releases': 'Release',
      'residents': 'Resident',
      'users': 'User',
      'suppliers': 'Supplier',
      'stock_removals': 'Removal',
      'removal': 'Removal'
    };
    return names[tableName] || tableName;
  };

  const getActionColor = (action) => {
    switch (action?.toUpperCase()) {
      case 'INSERT':
      case 'CREATE':
      case 'STORE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTableColor = (tableName) => {
    const colors = {
      'medicines': 'bg-blue-100 text-blue-800',
      'medicine': 'bg-blue-100 text-blue-800',
      'stocks': 'bg-purple-100 text-purple-800',
      'receipts': 'bg-green-100 text-green-800',
      'medicine_releases': 'bg-green-100 text-green-800',
      'residents': 'bg-pink-100 text-pink-800',
      'users': 'bg-indigo-100 text-indigo-800',
      'suppliers': 'bg-orange-100 text-orange-800',
      'stock_removals': 'bg-red-100 text-red-800',
      'removal': 'bg-red-100 text-red-800'
    };
    return colors[tableName] || 'bg-gray-100 text-gray-800';
  };

  const getTableIcon = (tableName) => {
    const icons = {
      'medicines': '💊',
      'medicine': '💊',
      'stocks': '📦',
      'receipts': '📋',
      'medicine_releases': '📋',
      'residents': '👤',
      'users': '👥',
      'suppliers': '🏢',
      'stock_removals': '🗑️',
      'removal': '🗑️'
    };
    return icons[tableName] || '📄';
  };

  const getTxHash = (tx) => {
    // Check all possible locations for hash
    const checkForHash = (obj) => {
      if (!obj) return null;
      return obj.blockchain_tx_hash || obj.transaction_hash || obj.tx_hash || null;
    };
    
    try {
      // For DELETE operations, the deleted record's data is in old_values
      if (tx.action === 'DELETE' && tx.old_values) {
        const oldVals = typeof tx.old_values === 'string' ? JSON.parse(tx.old_values) : tx.old_values;
        const hash = checkForHash(oldVals);
        if (hash) return hash;
      }
      
      // For INSERT/STORE/UPDATE, check new_values
      if (tx.new_values) {
        const newVals = typeof tx.new_values === 'string' ? JSON.parse(tx.new_values) : tx.new_values;
        const hash = checkForHash(newVals);
        if (hash) return hash;
      }
      
      // Fallback: check old_values for UPDATE operations
      if (tx.old_values) {
        const oldVals = typeof tx.old_values === 'string' ? JSON.parse(tx.old_values) : tx.old_values;
        const hash = checkForHash(oldVals);
        if (hash) return hash;
      }
      
      // Last resort: check if hash is at the top level of the tx object
      return checkForHash(tx);
    } catch (err) {
      console.error('Error parsing tx hash:', err);
      return null;
    }
  };

  const getChangeSummary = (tx) => {
    if (tx.action === 'DELETE') {
      return 'Record deleted';
    }
    if (tx.action === 'INSERT' || tx.action === 'CREATE' || tx.action === 'STORE') {
      return 'New record created';
    }
    
    if (tx.old_values && tx.new_values) {
      try {
        const changes = [];
        const oldVals = typeof tx.old_values === 'string' ? JSON.parse(tx.old_values) : tx.old_values;
        const newVals = typeof tx.new_values === 'string' ? JSON.parse(tx.new_values) : tx.new_values;
        
        Object.keys(newVals).forEach(key => {
          if (oldVals[key] !== newVals[key] && key !== 'updated_at' && key !== 'timestamp') {
            changes.push(key);
          }
        });
        
        if (changes.length > 0) {
          return `Updated: ${changes.slice(0, 3).join(', ')}${changes.length > 3 ? '...' : ''}`;
        }
      } catch (err) {
        // Ignore parsing errors
      }
    }
    
    return 'Record updated';
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return 'null';
    }
    if (typeof value === 'object') {
      // For objects, try to show a meaningful representation
      if (Array.isArray(value)) {
        return `[${value.length} items]`;
      }
      // If it has an id or name, show that
      if (value.id) return `ID: ${value.id}`;
      if (value.name) return `${value.name}`;
      if (value.medicine_name) return `${value.medicine_name}`;
      if (value.stock_id) return `Stock ID: ${value.stock_id}`;
      // Otherwise show a compact JSON
      return JSON.stringify(value).slice(0, 30) + '...';
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    return String(value).slice(0, 30);
  };

  const renderChangeDetails = (tx) => {
    if (!tx.old_values || !tx.new_values) return null;
    
    try {
      const oldVals = typeof tx.old_values === 'string' ? JSON.parse(tx.old_values) : tx.old_values;
      const newVals = typeof tx.new_values === 'string' ? JSON.parse(tx.new_values) : tx.new_values;
      
      const changes = [];
      const skipFields = ['updated_at', 'timestamp', 'created_at', 'blockchain_tx_hash', 'transaction_hash', 'tx_hash'];
      
      Object.keys(newVals).forEach(key => {
        if (skipFields.includes(key)) return;
        
        const oldVal = oldVals[key];
        const newVal = newVals[key];
        
        // Compare by JSON string for objects
        const oldStr = JSON.stringify(oldVal);
        const newStr = JSON.stringify(newVal);
        
        if (oldStr !== newStr) {
          changes.push({
            field: key,
            old: oldVal,
            new: newVal
          });
        }
      });
      
      if (changes.length === 0) return null;
      
      return (
        <div className="space-y-1 text-xs">
          {changes.slice(0, 2).map((change, idx) => (
            <div key={idx}>
              <strong className="text-gray-700">{change.field}:</strong>
              <div className="ml-2">
                <span className="text-red-600">From: {formatValue(change.old)}</span>
                {' → '}
                <span className="text-green-600">{formatValue(change.new)}</span>
              </div>
            </div>
          ))}
          {changes.length > 2 && (
            <div className="text-gray-500 text-xs">+{changes.length - 2} more changes</div>
          )}
        </div>
      );
    } catch (err) {
      return <div className="text-xs text-gray-400">Unable to parse changes</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FaHistory className="text-blue-600" />
                Transaction History
              </h1>
              <p className="text-gray-600 mt-2">Complete audit trail of all system activities</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaFilter className="mr-2" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleExportCSV}
                disabled={filteredTransactions.length === 0}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
              >
                <FaDownload className="mr-2" />
                Export CSV
              </button>
            </div>
          </div>

        {/* Simple stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Created', value: stats.created },
            { label: 'Updated', value: stats.updated },
            { label: 'Deleted', value: stats.deleted },
            { label: 'Releases', value: stats.releases },
          ].map((card, idx) => (
            <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              <div className="text-xs text-gray-600">{card.label}</div>
            </div>
          ))}
        </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Filter Transactions</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Table</label>
                <select
                  value={filters.table}
                  onChange={(e) => handleFilterChange('table', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="all">All Tables</option>
                  <option value="medicine">Medicine</option>
                  <option value="stocks">Stocks</option>
                  <option value="receipts">Releases</option>
                  <option value="removal">Removals</option>
                  <option value="residents">Residents</option>
                  <option value="users">Users</option>
                  <option value="suppliers">Suppliers</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="all">All Actions</option>
                  <option value="INSERT">Insert</option>
                  <option value="STORE">Store</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading transaction history...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <FaHistory className="text-6xl text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">No Transactions Found</h2>
            <p className="text-gray-500">
              {transactions.length === 0 
                ? "No transactions have been recorded yet" 
                : "No transactions match your current filters"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Table
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Record ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Changed By
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Changes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TX Hash
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.audit_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatTimestamp(tx.changed_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getTableColor(tx.table_name)}`}>
                          {getTableIcon(tx.table_name)} {getTableDisplayName(tx.table_name)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(tx.action)}`}>
                          {tx.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        #{tx.record_id || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {(() => {
                          const u = tx.changed_by_user;
                          if (u?.full_name) {
                            if (u.role === 'ADMIN' || u.role === 'MUNICIPAL_STAFF') {
                              return `Municipal Administrator (${u.full_name})`;
                            }
                            if (u.assigned_barangay) {
                              return `${u.assigned_barangay} Staff (${u.full_name})`;
                            }
                            return u.full_name;
                          }
                          if (tx.changed_by_wallet) {
                            return `${tx.changed_by_wallet.slice(0,6)}...${tx.changed_by_wallet.slice(-4)}`;
                          }
                          return 'System';
                        })()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs">
                        {renderChangeDetails(tx) || (
                          <div className="text-gray-600">{getChangeSummary(tx)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {getTxHash(tx) ? (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${getTxHash(tx)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            {getTxHash(tx).slice(0, 8)}... <FaExternalLinkAlt className="text-xs" />
                          </a>
                        ) : (
                          <span className="text-gray-400">No hash</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-md">
                        {(() => {
                          const tbl = tx.table_name;
                          try {
                            const oldVals = typeof tx.old_values === 'string' ? JSON.parse(tx.old_values) : tx.old_values;
                            const newVals = typeof tx.new_values === 'string' ? JSON.parse(tx.new_values) : tx.new_values;
                            const src = newVals || oldVals || {};
                            if (tbl === 'medicines' || tbl === 'medicine') {
                              const name = src.medicine_name || src.name;
                              return name || 'Medicine';
                            }
                            if (tbl === 'stocks') {
                              const batch = src.batch_number;
                              const qty = src.quantity ?? src.remaining_quantity;
                              return batch ? `Batch ${batch}${qty !== undefined ? ` - ${qty}` : ''}` : 'Stock';
                            }
                            if (tbl === 'receipts' || tbl === 'medicine_releases') {
                              const med = src.medicine?.medicine_name || src.medicine_name;
                              const qty = src.quantity_released;
                              const res = src.resident_name;
                              return [med, qty && `${qty} units`, res].filter(Boolean).join(' • ');
                            }
                            if (tbl === 'stock_removals' || tbl === 'removal') {
                              const qty = src.quantity_removed;
                              const reason = src.reason;
                              return [qty && `${qty} units`, reason].filter(Boolean).join(' • ') || 'Removal';
                            }
                            if (tbl === 'residents') {
                              return src.full_name || `${src.first_name || ''} ${src.last_name || ''}`.trim() || 'Resident';
                            }
                          } catch (_) {}
                          return '-';
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}