import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaLink, FaSearch, FaSync, FaExternalLinkAlt, FaCheckCircle, FaTimesCircle, FaDownload, FaEye } from 'react-icons/fa';
import { useContract } from "@thirdweb-dev/react";
import api from '../../api.js';
import ContractABI from '../abi/ContractABI.json';

const CONTRACT_ADDRESS = "0xb00597076d75C504DEcb69c55B146f83819e61C1"; 

export default function BlockchainHistory() {
  const { contract } = useContract(CONTRACT_ADDRESS, ContractABI.abi);
  const [blockchainData, setBlockchainData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [verificationStatus, setVerificationStatus] = useState({});
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [selected, setSelected] = useState(null);
  const [recordData, setRecordData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    medicines: 0,
    stocks: 0,
    stock_transactions: 0,
    receipts: 0,
    removals: 0,
  });

  // 🚀 OPTIMIZATION 1: Memoize filtered data to avoid recalculation on every render
  const filteredData = useMemo(() => {
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

    return filtered;
  }, [searchTerm, filterType, blockchainData]);

  // 🚀 OPTIMIZATION 2: Use useCallback to prevent function recreation
  const fetchBlockchainData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/blockchain/hashes');
      
      const hashes = data?.hashes || [];
      const counts = data?.counts || {};
      
      setBlockchainData(hashes);
      setStats({
        total: counts.total || 0,
        medicines: counts.medicines || 0,
        stocks: counts.stocks || 0,
        stock_transactions: counts.stock_transactions || 0,
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
  }, []);

  const scanBlockchainForMissing = async () => {
    if (!contract) {
      alert("Contract not loaded. Please refresh the page.");
      return;
    }
    
    try {
      setScanning(true);
      setScanProgress({ current: 0, total: 0 });
      console.log("🔍 Scanning blockchain for missing records...");
      
      const dbResponse = await api.get('/medicines');
      const medicines = dbResponse.data.data || [];
      const maxId = Math.max(...medicines.map(m => m.medicine_id), 0);
      const scanLimit = Math.max(maxId + 50, 100);
      
      setScanProgress({ current: 0, total: scanLimit });
      
      const missingRecords = [];
      const existingIds = new Set(blockchainData.map(r => r.recordId));
      
      console.log(`Scanning IDs 1 to ${scanLimit}...`);
      
      for (let i = 1; i <= scanLimit; i++) {
        setScanProgress({ current: i, total: scanLimit });
        
        if (existingIds.has(i)) {
          continue;
        }
        
        try {
          const hashData = await contract.call("getMedicineHash", [i]);
          
          if (hashData[3]) {
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
              foundByScan: true
            });
            
            console.log(`✅ Found missing record: Medicine #${i}`);
          }
        } catch (err) {
          if (!err.message?.includes('does not exist')) {
            console.warn(`Error checking medicine ${i}:`, err);
          }
        }
      }
      
      if (missingRecords.length > 0) {
        console.log(`✅ Found ${missingRecords.length} missing records!`);
        
        const updatedData = [...blockchainData, ...missingRecords];
        setBlockchainData(updatedData);
        
        // Recalculate stats
        const newStats = {
          total: updatedData.length,
          medicines: updatedData.filter(item => item.type === 'medicine').length,
          stocks: updatedData.filter(item => item.type === 'stock').length,
          stock_transactions: updatedData.filter(item => item.type === 'stock_transaction').length,
          receipts: updatedData.filter(item => item.type === 'receipt').length,
          removals: updatedData.filter(item => item.type === 'removal').length
        };
        setStats(newStats);
        
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

  // 🚀 OPTIMIZATION 3: Use useCallback for fetchRecordData
  const fetchRecordData = useCallback(async (item) => {
    setLoadingData(true);
    setRecordData(null);
    
    try {
      let endpoint = '';
      
      switch (item.type) {
        case 'medicine':
          endpoint = `/medicines/${item.recordId}`;
          break;
        case 'stock':
          endpoint = `/stock/${item.recordId}`;
          break;
        case 'stock_transaction':
          endpoint = `/stock-transactions/${item.recordId}`;
          break;
        case 'receipt':
          endpoint = `/receipts/${item.recordId}`;
          break;
        case 'removal':
          endpoint = `/removals/${item.recordId}`;
          break;
        default:
          throw new Error('Unknown record type');
      }
      
      const { data } = await api.get(endpoint);
      setRecordData({ type: item.type, data: data.data || data });
    } catch (err) {
      console.error('Error fetching record data:', err);
      setRecordData({ error: 'Failed to load record data. The record may have been deleted.' });
    } finally {
      setLoadingData(false);
    }
  }, []);

  const openDetails = useCallback((item) => {
    setSelected(item);
    fetchRecordData(item);
  }, [fetchRecordData]);

  // 🚀 OPTIMIZATION 4: Load data once on mount
  useEffect(() => {
    fetchBlockchainData();
  }, [fetchBlockchainData]);

  // 🚀 OPTIMIZATION 5: Memoize helper functions
  const formatTimestamp = useCallback((timestamp) => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const formatAddress = useCallback((address) => {
    if (!address || address === 'Unknown') return 'N/A';
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  const getTypeColor = useCallback((type) => {
    const colors = {
      'medicine': 'bg-blue-50 text-blue-700 border-blue-200',
      'stock': 'bg-purple-50 text-purple-700 border-purple-200',
      'stock_transaction': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'receipt': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'removal': 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[type] || 'bg-gray-50 text-gray-700 border-gray-200';
  }, []);

  const getTypeIcon = useCallback((type) => {
    const icons = {
      'medicine': '💊',
      'stock': '📦',
      'stock_transaction': '🔄',
      'receipt': '📋',
      'removal': '🗑️'
    };
    return icons[type] || '📄';
  }, []);

  const handleExportCSV = useCallback(() => {
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
  }, [filteredData, formatAddress, formatTimestamp]);

  const handleExportPDF = useCallback(async () => {
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
  }, [filteredData, formatAddress, formatTimestamp]);

  const renderRecordData = useCallback(() => {
    if (loadingData) {
      return (
        <div className="py-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600 mb-3"></div>
          <p className="text-sm text-gray-600">Loading record data...</p>
        </div>
      );
    }

    if (recordData?.error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
          <p className="text-sm text-red-800">{recordData.error}</p>
        </div>
      );
    }

    if (!recordData?.data) {
      return null;
    }

    const data = recordData.data;

    switch (recordData.type) {
      case 'medicine':
        return (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              💊 Medicine Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Medicine Name:</span>
                <p className="font-medium text-gray-900">{data.medicine_name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-600">Generic Name:</span>
                <p className="font-medium text-gray-900">{data.generic_name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-600">Dosage Form:</span>
                <p className="font-medium text-gray-900">{data.dosage_form || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-600">Strength:</span>
                <p className="font-medium text-gray-900">{data.strength || 'N/A'}</p>
              </div>
              {data.description && (
                <div className="col-span-2">
                  <span className="text-gray-600">Description:</span>
                  <p className="font-medium text-gray-900">{data.description}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'stock':
        return (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              📦 Stock Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Medicine:</span>
                <p className="font-medium text-gray-900">{data.medicine?.medicine_name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-600">Batch Number:</span>
                <p className="font-medium text-gray-900">{data.batch_number || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-600">Quantity:</span>
                <p className="font-medium text-gray-900">{data.quantity || 0}</p>
              </div>
              <div>
                <span className="text-gray-600">Expiry Date:</span>
                <p className="font-medium text-gray-900">
                  {data.expiry_date ? new Date(data.expiry_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              {data.supplier && (
                <div className="col-span-2">
                  <span className="text-gray-600">Supplier:</span>
                  <p className="font-medium text-gray-900">{data.supplier}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'stock_transaction':
        return (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              🔄 Stock Transaction Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Medicine:</span>
                <p className="font-medium text-gray-900">{data.stock?.medicine?.medicine_name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-600">Transaction Type:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  data.transaction_type === 'ADDITION' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {data.transaction_type}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Quantity Changed:</span>
                <p className={`font-medium ${
                  data.transaction_type === 'ADDITION' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {data.transaction_type === 'ADDITION' ? '+' : '-'}{data.quantity_changed || 0}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Before → After:</span>
                <p className="font-medium text-gray-900">
                  {data.quantity_before} → {data.quantity_after}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Transaction Date:</span>
                <p className="font-medium text-gray-900">
                  {data.transaction_date ? new Date(data.transaction_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Batch Number:</span>
                <p className="font-medium text-gray-900">{data.stock?.batch_number || 'N/A'}</p>
              </div>
              {data.notes && (
                <div className="col-span-2">
                  <span className="text-gray-600">Notes:</span>
                  <p className="font-medium text-gray-900">{data.notes}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'receipt':
        return (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              📋 Receipt Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Medicine:</span>
                <p className="font-medium text-gray-900">{data.stock?.medicine?.medicine_name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-600">Quantity Received:</span>
                <p className="font-medium text-gray-900">{data.quantity_received || 0}</p>
              </div>
              <div>
                <span className="text-gray-600">Receipt Date:</span>
                <p className="font-medium text-gray-900">
                  {data.receipt_date ? new Date(data.receipt_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Source:</span>
                <p className="font-medium text-gray-900">{data.source || 'N/A'}</p>
              </div>
              {data.notes && (
                <div className="col-span-2">
                  <span className="text-gray-600">Notes:</span>
                  <p className="font-medium text-gray-900">{data.notes}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'removal':
        return (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              🗑️ Removal Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Medicine:</span>
                <p className="font-medium text-gray-900">{data.medicine?.medicine_name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-600">Reason:</span>
                <p className="font-medium text-gray-900">{data.reason || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-600">Quantity Removed:</span>
                <p className="font-medium text-red-700">-{data.quantity_removed || 0}</p>
              </div>
              <div>
                <span className="text-gray-600">Date Removed:</span>
                <p className="font-medium text-gray-900">
                  {data.date_removed ? new Date(data.date_removed).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Batch Number:</span>
                <p className="font-medium text-gray-900">{data.stock?.batch_number || 'N/A'}</p>
              </div>
              {data.notes && (
                <div className="col-span-2">
                  <span className="text-gray-600">Notes:</span>
                  <p className="font-medium text-gray-900">{data.notes}</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  }, [loadingData, recordData]);

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
          <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-600 mt-0.5">Total Hashes</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{stats.medicines}</div>
              <div className="text-xs text-gray-600 mt-0.5">Added Medicine </div>
            </div>
            {/* <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-bold text-purple-600">{stats.stocks}</div>
              <div className="text-xs text-gray-600 mt-0.5">Stocks</div>
            </div> */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-bold text-indigo-600">{stats.stock_transactions}</div>
              <div className="text-xs text-gray-600 mt-0.5">Added Medicine Stock</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-bold text-emerald-600">{stats.receipts}</div>
              <div className="text-xs text-gray-600 mt-0.5">Medicine Release</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-bold text-red-600">{stats.removals}</div>
              <div className="text-xs text-gray-600 mt-0.5">Removed Medicine Stock</div>
            </div>
          </div>

          {/* Warning Banner */}
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
              the record's data and stores it on the Polygon Amoy blockchain. Click <strong>"View"</strong> to see 
              the actual data behind each hash!
            </p>
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
              <option value="stock_transaction">Stock Transaction</option>
              <option value="receipt">Receipt</option>
              <option value="removal">Removal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-4">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Hash</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added By</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                            className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                          >
                            <FaEye /> View
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
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Hash Details</h2>
              <button
                onClick={() => setSelected(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* Basic Hash Information */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Record Type</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border ${getTypeColor(selected.type)}`}>
                      {getTypeIcon(selected.type)} {selected.type}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Record ID</label>
                    <p className="mt-1 text-sm font-mono text-gray-900">{selected.recordId}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</label>
                    <p className="mt-1 text-sm text-gray-900">{formatTimestamp(selected.timestamp)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Data Hash</label>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-xs font-mono text-gray-900 bg-gray-50 p-2 rounded break-all flex-1">
                      {selected.hash}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selected.hash);
                        alert('Hash copied to clipboard!');
                      }}
                      className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Added By</label>
                  <p className="mt-1 text-xs font-mono text-gray-900 bg-gray-50 p-2 rounded break-all">
                    {selected.addedBy}
                  </p>
                  {selected.addedByName && selected.addedByName !== 'Unknown' && (
                    <p className="mt-1 text-sm text-gray-600">{selected.addedByName}</p>
                  )}
                </div>

                {selected.txHash && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Hash</label>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-xs font-mono text-gray-900 bg-gray-50 p-2 rounded break-all flex-1">
                        {selected.txHash}
                      </p>
                      <a
                        href={`https://amoy.polygonscan.com/tx/${selected.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 flex items-center gap-1"
                      >
                        <FaExternalLinkAlt className="w-3 h-3" />
                        View
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Record Data */}
              {renderRecordData()}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setSelected(null)}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors font-medium"
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