import React, { useState, useEffect } from 'react';
import { FaLink, FaSearch, FaSync, FaExternalLinkAlt, FaCheckCircle, FaTimesCircle, FaDownload } from 'react-icons/fa';
import { useContract } from "@thirdweb-dev/react";
import api from '../../api.js';
import ContractABI from '../abi/ContractABI.json';

// Import your contract details
const CONTRACT_ADDRESS = "0xb00597076d75C504DEcb69c55B146f83819e61C1"; 

export default function BlockchainHistory() {
  const { contract } = useContract(CONTRACT_ADDRESS, ContractABI.abi);
  const [blockchainData, setBlockchainData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [verificationStatus, setVerificationStatus] = useState({});
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });

  const [stats, setStats] = useState({
    total: 0,
    medicines: 0,
    stocks: 0,
    receipts: 0,
    removals: 0
  });

  // Fetch blockchain hashes from database
  const fetchBlockchainData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/blockchain/hashes');
      
      const hashes = data?.hashes || [];
      const counts = data?.counts || {};
      
      setBlockchainData(hashes);
      setFilteredData(hashes);
      setStats({
        total: counts.total || 0,
        medicines: counts.medicines || 0,
        stocks: counts.stocks || 0,
        receipts: counts.receipts || 0,
        removals: counts.removals || 0
      });
      
      console.log(`✅ Loaded ${hashes.length} blockchain records from database`);
    } catch (err) {
      console.error('Error fetching blockchain data:', err);
      const message = err?.response?.data?.error || err?.message || 'Failed to fetch blockchain data';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Scan blockchain for missing records
  const scanBlockchainForMissing = async () => {
    if (!contract) {
      alert("Contract not loaded. Please refresh the page.");
      return;
    }
    
    try {
      setScanning(true);
      setScanProgress({ current: 0, total: 0 });
      console.log("🔍 Scanning blockchain for missing records...");
      
      // Get medicines from database to determine scan range
      const dbResponse = await api.get('/medicines');
      const medicines = dbResponse.data.data || [];
      const maxId = Math.max(...medicines.map(m => m.medicine_id), 0);
      const scanLimit = Math.max(maxId + 50, 100); // Scan beyond max ID
      
      setScanProgress({ current: 0, total: scanLimit });
      
      const missingRecords = [];
      const existingIds = new Set(blockchainData.map(r => r.recordId));
      
      console.log(`Scanning IDs 1 to ${scanLimit}...`);
      
      for (let i = 1; i <= scanLimit; i++) {
        setScanProgress({ current: i, total: scanLimit });
        
        if (existingIds.has(i)) {
          continue; // Skip already known records
        }
        
        try {
          const hashData = await contract.call("getMedicineHash", [i]);
          
          if (hashData[3]) { // exists = true on blockchain
            const medicine = medicines.find(m => m.medicine_id === i);
            
            missingRecords.push({
              type: 'medicine',
              recordId: i,
              hash: hashData[0],
              addedBy: hashData[1],
              addedByName: medicine?.added_by_name || 'Unknown',
              timestamp: hashData[2].toNumber(),
              exists: true,
              txHash: medicine?.blockchain_tx_hash || null,
              inDatabase: !!medicine,
              foundByScan: true // ✅ Flag to highlight it was found by scan
            });
            
            console.log(`✅ Found missing record: Medicine #${i}`);
          }
        } catch (err) {
          // Ignore "does not exist" errors
          if (!err.message?.includes('does not exist')) {
            console.warn(`Error checking medicine ${i}:`, err);
          }
        }
      }
      
      if (missingRecords.length > 0) {
        console.log(`✅ Found ${missingRecords.length} missing records!`);
        
        // Add missing records to the list
        const updatedData = [...blockchainData, ...missingRecords];
        setBlockchainData(updatedData);
        setFilteredData(updatedData);
        
        // Recalculate stats
        calculateStats(updatedData);
        
        alert(`🎉 Found ${missingRecords.length} records on blockchain that weren't in the history!\n\nRecords found: ${missingRecords.map(r => `#${r.recordId}`).join(', ')}`);
      } else {
        alert("✅ No missing records found. Database and blockchain are in sync!");
      }
      
    } catch (err) {
      console.error("Scan error:", err);
      alert(`❌ Scan failed: ${err.message}`);
    } finally {
      setScanning(false);
      setScanProgress({ current: 0, total: 0 });
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
        item.addedBy?.toLowerCase().includes(searchLower) ||
        item.addedByName?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredData(filtered);
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

  const [selected, setSelected] = useState(null);
  const openDetails = (item) => {
    setSelected(item);
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
    if (!address || address === 'Unknown') return 'N/A';
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTypeColor = (type) => {
    const colors = {
      'medicine': 'bg-blue-50 text-blue-700 border-blue-200',
      'stock': 'bg-purple-50 text-purple-700 border-purple-200',
      'receipt': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'removal': 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[type] || 'bg-gray-50 text-gray-700 border-gray-200';
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

  const handleExportCSV = () => {
    const csvContent = [
      ['Type', 'Record ID', 'Data Hash', 'Added By', 'Added By Name', 'Timestamp', 'Status', 'TX Hash', 'Found By Scan'],
      ...filteredData.map(item => [
        item.type,
        item.recordId || 'N/A',
        item.hash || '',
        formatAddress(item.addedBy),
        item.addedByName || 'Unknown',
        formatTimestamp(item.timestamp),
        item.exists ? 'Active' : 'Deleted',
        item.txHash || 'N/A',
        item.foundByScan ? 'Yes' : 'No'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blockchain-hashes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Blockchain History Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Hashes: ${filteredData.length}`, 14, 34);
    
    let y = 44;
    doc.setFontSize(9);
    
    filteredData.slice(0, 200).forEach((item) => {
      const date = formatTimestamp(item.timestamp);
      const status = item.exists ? 'Active' : 'Deleted';
      const line = `${item.type.toUpperCase()} | #${item.recordId} | ${item.hash?.slice(0, 16)}... | ${formatAddress(item.addedBy)} | ${status}`;
      doc.text(line.substring(0, 110), 14, y);
      y += 6;
      if (y > 280) { doc.addPage(); y = 20; }
    });
    
    doc.save(`blockchain-hashes-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <h1 className="text-xl font-semibold text-gray-900">Blockchain History</h1>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <span className="text-sm text-gray-600">{stats.total} hashes</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={fetchBlockchainData}
                disabled={loading || scanning}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaSync className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              {/* ✅ NEW: Scan Blockchain Button */}
              <button
                onClick={scanBlockchainForMissing}
                disabled={loading || scanning || !contract}
                className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scanning ? (
                  <>
                    <FaSync className="w-3.5 h-3.5 animate-spin" />
                    Scanning {scanProgress.current}/{scanProgress.total}
                  </>
                ) : (
                  <>
                    🔍 Scan Blockchain
                  </>
                )}
              </button>
              
              <button
                onClick={handleExportCSV}
                disabled={filteredData.length === 0}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaDownload className="w-3.5 h-3.5" />
                CSV
              </button>
              <button
                onClick={handleExportPDF}
                disabled={filteredData.length === 0}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaDownload className="w-3.5 h-3.5" />
                PDF
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-600 mt-0.5">Total Hashes</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{stats.medicines}</div>
              <div className="text-xs text-gray-600 mt-0.5">Medicines</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-bold text-purple-600">{stats.stocks}</div>
              <div className="text-xs text-gray-600 mt-0.5">Stocks</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-bold text-emerald-600">{stats.receipts}</div>
              <div className="text-xs text-gray-600 mt-0.5">Receipts</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-bold text-red-600">{stats.removals}</div>
              <div className="text-xs text-gray-600 mt-0.5">Removals</div>
            </div>
          </div>

          {/* ✅ NEW: Warning Banner */}
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-900 mb-1 flex items-center gap-2">
                  ⚠️ Database View with Blockchain Verification
                </h3>
                <p className="text-xs text-yellow-800 leading-relaxed">
                  This page shows records from the database by default. Some blockchain records might be missing 
                  if they were stored on-chain but not properly saved to the database. Click <strong>"Scan Blockchain"</strong> to 
                  find all records directly from the smart contract and identify any sync issues.
                </p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
              🔐 What are these hashes?
            </h3>
            <p className="text-xs text-blue-900 leading-relaxed">
              A <strong>hash</strong> is a unique cryptographic fingerprint of your data. When you create or update 
              a medicine, stock, receipt, or removal record, the system generates a hash (using SHA-256) of all 
              the record's data and stores it on the Polygon Amoy blockchain. This makes the data:
            </p>
            <ul className="list-disc list-inside text-xs text-blue-900 mt-2 space-y-1">
              <li><strong>Tamper-proof:</strong> Any change to the original data will produce a different hash</li>
              <li><strong>Verifiable:</strong> You can verify data integrity by comparing hashes</li>
              <li><strong>Immutable:</strong> Once on the blockchain, it cannot be altered</li>
              <li><strong>Transparent:</strong> Anyone can verify the data hasn't been tampered with</li>
            </ul>
          </div>

          {/* Filters */}
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by hash, record ID, or address..."
                className="w-full pl-10 pr-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

      {/* Main Content */}
      <div className="px-6 py-4">
        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-indigo-600 mb-4"></div>
            <p className="text-sm text-gray-600">Loading blockchain data from database...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FaLink className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Hashes Found</h2>
            <p className="text-sm text-gray-600 mb-4">
              {blockchainData.length === 0 
                ? "No hashes have been stored yet" 
                : "No hashes match your search criteria"}
            </p>
            {blockchainData.length === 0 && contract && (
              <button
                onClick={scanBlockchainForMissing}
                disabled={scanning}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                🔍 Scan Blockchain for Records
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Record ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Hash
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added By
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((item, idx) => (
                    <tr 
                      key={idx} 
                      className={`hover:bg-gray-50 transition-colors ${
                        item.foundByScan ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${getTypeColor(item.type)}`}>
                          {getTypeIcon(item.type)} {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-gray-900">#{item.recordId}</span>
                          {item.foundByScan && (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-800" title="Found by blockchain scan">
                              🔍
                            </span>
                          )}
                        </div>
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
                        <div>
                          <span className="font-mono text-gray-900 block">
                            {formatAddress(item.addedBy)}
                          </span>
                          {item.addedByName && item.addedByName !== 'Unknown' && (
                            <span className="text-xs text-gray-500">
                              {item.addedByName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatTimestamp(item.timestamp)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.exists ? (
                          <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">
                            <FaCheckCircle className="mr-1" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border bg-gray-50 text-gray-700 border-gray-200">
                            <FaTimesCircle className="mr-1" /> Deleted
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openDetails(item)}
                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            View
                          </button>

                          {verificationStatus[`${item.type}-${item.recordId}`] !== undefined && (
                            <span className={verificationStatus[`${item.type}-${item.recordId}`] ? 'text-green-600' : 'text-red-600'}>
                              {verificationStatus[`${item.type}-${item.recordId}`] ? '✓' : '✗'}
                            </span>
                          )}
                          {item.txHash && (
                            <a
                              href={`https://amoy.polygonscan.com/tx/${item.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                              title="View on PolygonScan"
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
              {selected && (
                  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-[480px]">
                      <h2 className="text-lg font-semibold">Hash Details</h2>

                      <p className="mt-2 text-sm"><strong>Record ID:</strong> {selected.recordId}</p>
                      <p className="mt-1 text-sm"><strong>Type:</strong> {selected.type}</p>
                      <p className="mt-1 text-sm"><strong>Full Hash:</strong> {selected.hash}</p>
                      <p className="mt-1 text-sm"><strong>Added By:</strong> {selected.addedBy}</p>
                      <p className="mt-1 text-sm"><strong>Timestamp:</strong> {formatTimestamp(selected.timestamp)}</p>

                      <button
                        onClick={() => setSelected(null)}
                        className="mt-4 px-3 py-1.5 bg-gray-700 text-white rounded"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
          </div>
        )}
      </div>
    </div>
  );
}