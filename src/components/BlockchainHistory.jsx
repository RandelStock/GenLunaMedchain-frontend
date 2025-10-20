import React, { useState, useEffect } from 'react';
import { FaLink, FaSearch, FaSync, FaExternalLinkAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import api from '../../api.js';

export default function BlockchainHistory() {
  const [blockchainData, setBlockchainData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [verificationStatus, setVerificationStatus] = useState({});

  const [stats, setStats] = useState({
    total: 0,
    medicines: 0,
    stocks: 0,
    receipts: 0,
    removals: 0
  });

  // Fetch blockchain hashes
  const fetchBlockchainData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use configured API client to avoid fetching the app HTML (which causes JSON parse errors)
      const { data } = await api.get('/blockchain/hashes');
      const hashes = data?.hashes || [];
      
      setBlockchainData(hashes);
      setFilteredData(hashes);
      calculateStats(hashes);
    } catch (err) {
      console.error('Error fetching blockchain data:', err);
      // Provide clearer error when frontend served HTML instead of JSON
      const message = err?.response?.data?.error || err?.message || 'Failed to fetch blockchain data';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockchainData();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...blockchainData];

    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.hash?.toLowerCase().includes(searchLower) ||
        item.recordId?.toString().includes(searchLower) ||
        item.type?.toLowerCase().includes(searchLower) ||
        item.addedBy?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredData(filtered);
    calculateStats(filtered);
  }, [searchTerm, filterType, blockchainData]);

  const calculateStats = (data) => {
    setStats({
      total: data.length,
      medicines: data.filter(item => item.type === 'medicine').length,
      stocks: data.filter(item => item.type === 'stock').length,
      receipts: data.filter(item => item.type === 'receipt').length,
      removals: data.filter(item => item.type === 'removal').length
    });
  };

  const verifyHash = async (recordId, type, hash) => {
    try {
      const { data } = await api.post('/blockchain/verify', { recordId, type, hash });
      setVerificationStatus(prev => ({
        ...prev,
        [`${type}-${recordId}`]: data?.verified
      }));
    } catch (err) {
      console.error('Verification error:', err);
      setVerificationStatus(prev => ({
        ...prev,
        [`${type}-${recordId}`]: false
      }));
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTypeColor = (type) => {
    const colors = {
      'medicine': 'bg-blue-100 text-blue-800',
      'stock': 'bg-purple-100 text-purple-800',
      'receipt': 'bg-green-100 text-green-800',
      'removal': 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type) => {
    const icons = {
      'medicine': '💊',
      'stock': '📦',
      'receipt': '📋',
      'removal': '🗑️'
    };
    return icons[type] || '📄';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FaLink className="text-indigo-600" />
                Blockchain History
              </h1>
              <p className="text-gray-900 mt-2">
                All cryptographic hashes stored on the Ethereum blockchain
              </p>
            </div>
            <button
              onClick={fetchBlockchainData}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
            >
              <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-700">Total Hashes</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-3xl font-bold text-blue-600">{stats.medicines}</div>
              <div className="text-sm text-gray-700">Medicines</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-3xl font-bold text-purple-600">{stats.stocks}</div>
              <div className="text-sm text-gray-700">Stocks</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-3xl font-bold text-green-600">{stats.receipts}</div>
              <div className="text-sm text-gray-700">Receipts</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-3xl font-bold text-red-600">{stats.removals}</div>
              <div className="text-sm text-gray-700">Removals</div>
            </div>
          </div>
        </div>

        {/* Info Box - What are Hashes? */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            🔐 What are these hashes?
          </h3>
          <p className="text-sm text-blue-900">
            A <strong>hash</strong> is a unique cryptographic fingerprint of your data. When you create or update 
            a medicine, stock, receipt, or removal record, the system generates a hash (using SHA-256) of all 
            the record's data and stores it on the Ethereum blockchain. This makes the data:
          </p>
          <ul className="list-disc list-inside text-sm text-blue-900 mt-2 space-y-1">
            <li><strong>Tamper-proof:</strong> Any change to the original data will produce a different hash</li>
            <li><strong>Verifiable:</strong> You can verify data integrity by comparing hashes</li>
            <li><strong>Immutable:</strong> Once on the blockchain, it cannot be altered</li>
            <li><strong>Transparent:</strong> Anyone can verify the data hasn't been tampered with</li>
          </ul>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                <FaSearch className="inline mr-2" />
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by hash, record ID, or address..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Filter by Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-gray-900"
              >
                <option value="all">All Types</option>
                <option value="medicine">Medicine</option>
                <option value="stock">Stock</option>
                <option value="receipt">Receipt</option>
                <option value="removal">Removal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-indigo-600 mb-4"></div>
            <p className="text-gray-900">Loading blockchain data...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <FaLink className="text-6xl text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Hashes Found</h2>
            <p className="text-gray-700">
              {blockchainData.length === 0 
                ? "No hashes have been stored on the blockchain yet" 
                : "No hashes match your search criteria"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Record ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Data Hash
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Added By
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(item.type)}`}>
                          {getTypeIcon(item.type)} {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">
                        #{item.recordId}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900">{item.hash?.slice(0, 10)}...{item.hash?.slice(-8)}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(item.hash)}
                            className="text-indigo-600 hover:text-indigo-800 text-xs"
                            title="Copy full hash"
                          >
                            📋
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className="font-mono text-gray-900">
                          {formatAddress(item.addedBy)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatTimestamp(item.timestamp)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.exists ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            <FaCheckCircle className="mr-1" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            <FaTimesCircle className="mr-1" /> Deleted
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => verifyHash(item.recordId, item.type, item.hash)}
                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Verify
                          </button>
                          {verificationStatus[`${item.type}-${item.recordId}`] !== undefined && (
                            <span className={verificationStatus[`${item.type}-${item.recordId}`] ? 'text-green-600' : 'text-red-600'}>
                              {verificationStatus[`${item.type}-${item.recordId}`] ? '✓' : '✗'}
                            </span>
                          )}
                          {item.txHash && (
                            <a
                              href={`https://sepolia.etherscan.io/tx/${item.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                              title="View on Etherscan"
                            >
                              <FaExternalLinkAlt />
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
    </div>
  );
}