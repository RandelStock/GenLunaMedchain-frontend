import { useState, useEffect } from 'react';
import { FaHistory, FaFilter, FaDownload, FaChartBar, FaEye, FaEyeSlash, FaSearch, FaTimes } from 'react-icons/fa';
import API_BASE_URL from '../config';

const AllAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({
    table: 'all',
    action: 'all',
    month: '',
    search: '',
    barangay: 'all'
  });

  // List of all barangays
  const barangays = [
    'BARANGAY 1', 'BARANGAY 2', 'BARANGAY 3', 'BARANGAY 4', 'BARANGAY 5',
    'BARANGAY 6', 'BARANGAY 7', 'BARANGAY 8', 'BARANGAY 9', 'BARANGAY 10',
    'COTTA', 'ISABANG', 'MARKET DISTRICT'
  ];

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [page, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        table: filters.table,
        action: filters.action,
        month: filters.month,
        page: String(page),
        limit: '100'
      }).toString();

      const response = await fetch(`${API_BASE_URL}/audit/all?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Failed to fetch audit logs');

      const data = await response.json();
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
      setTotalLogs(data.total || 0);
    } catch (e) {
      console.error('Failed to load all audit logs:', e);
      setLogs([]);
      setTotalPages(1);
      setTotalLogs(0);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/audit/stats`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to load stats:', response.statusText);
        setStats(null);
      }
    } catch (e) {
      console.error('Failed to load stats:', e);
      setStats(null);
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE':
      case 'STORE':
      case 'INSERT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'UPDATE':
      case 'PATCH':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DELETE':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'GRANT_ROLE':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'REVOKE_ROLE':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const safeJsonStringify = (value) => {
    try {
      if (typeof value === 'string') {
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2);
      } else if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value, null, 2);
      } else {
        return String(value);
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return String(value);
    }
  };

  const closeDetails = () => {
    setSelectedLog(null);
    setShowDetails(false);
  };

  // Filter logs by search and barangay
  const filteredLogs = logs.filter(log => {
    // Search filter
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchesSearch = (
        (log.table_name || '').toLowerCase().includes(q) ||
        (log.action || '').toLowerCase().includes(q) ||
        (log.changed_by_user?.full_name || '').toLowerCase().includes(q)
      );
      if (!matchesSearch) return false;
    }

    // Barangay filter
    if (filters.barangay !== 'all') {
      const logBarangay = log.derivedBarangay || 'RHU';
      if (filters.barangay === 'RHU') {
        return logBarangay === 'RHU';
      } else {
        return logBarangay === filters.barangay;
      }
    }

    return true;
  });

  const handleExportCSV = () => {
    const csvContent = [
      ['Date', 'Table', 'Record ID', 'Action', 'Changed By', 'Wallet', 'Scope/Barangay'],
      ...filteredLogs.map(log => [
        new Date(log.changed_at).toLocaleString(),
        log.table_name,
        log.record_id || 'N/A',
        log.action,
        log.changed_by_user?.full_name || 'System',
        log.changed_by_wallet || 'N/A',
        log.derivedBarangay || 'RHU'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const barangayLabel = filters.barangay === 'all' ? 'all' : filters.barangay.toLowerCase().replace(/\s+/g, '-');
    a.download = `audit-logs-${barangayLabel}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('All Audit Logs Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    if (filters.barangay !== 'all') {
      doc.text(`Barangay: ${filters.barangay}`, 14, 34);
      doc.text(`Total Records: ${filteredLogs.length}`, 14, 40);
    } else {
      doc.text(`Total Records: ${filteredLogs.length}`, 14, 34);
    }
    
    let y = filters.barangay !== 'all' ? 50 : 44;
    doc.setFontSize(9);
    
    filteredLogs.slice(0, 200).forEach((log) => {
      const date = new Date(log.changed_at).toLocaleString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      const line = `${date} | ${log.table_name}#${log.record_id || 'N/A'} | ${log.action} | ${log.changed_by_user?.full_name || 'System'} | ${log.derivedBarangay || 'RHU'}`;
      doc.text(line.substring(0, 110), 14, y);
      y += 6;
      if (y > 280) { doc.addPage(); y = 20; }
    });
    
    const barangayLabel = filters.barangay === 'all' ? 'all' : filters.barangay.toLowerCase().replace(/\s+/g, '-');
    doc.save(`audit-logs-${barangayLabel}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <h1 className="text-xl font-semibold text-gray-900">All Audit Logs</h1>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <span className="text-sm text-gray-600">{filteredLogs.length} / {totalLogs.toLocaleString()} records</span>
              {filters.barangay !== 'all' && (
                <>
                  <div className="h-6 w-px bg-gray-300"></div>
                  <span className="inline-flex items-center px-3 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-300">
                    {filters.barangay}
                  </span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStats(!showStats)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
              >
                <FaChartBar className="w-3.5 h-3.5" />
                Stats
              </button>
              <button
                onClick={handleExportCSV}
                disabled={filteredLogs.length === 0}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaDownload className="w-3.5 h-3.5" />
                CSV
              </button>
              <button
                onClick={handleExportPDF}
                disabled={filteredLogs.length === 0}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaDownload className="w-3.5 h-3.5" />
                PDF
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search..."
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filters.barangay}
              onChange={(e) => setFilters(prev => ({ ...prev, barangay: e.target.value }))}
              className="px-3 py-2 text-sm font-medium border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Barangays</option>
              <option value="RHU">RHU</option>
              {barangays.map(brgy => (
                <option key={brgy} value={brgy}>{brgy}</option>
              ))}
            </select>

            <select
              value={filters.table}
              onChange={(e) => setFilters(prev => ({ ...prev, table: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tables</option>
              <option value="medicines">Medicines</option>
              <option value="receipts">Receipts</option>
              <option value="stocks">Stocks</option>
              <option value="residents">Residents</option>
              <option value="stock_removals">Stock Removals</option>
              <option value="consultations">Consultations</option>
            </select>

            <select
              value={filters.action}
              onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="INSERT">Insert</option>
              <option value="UPDATE">Update</option>
              <option value="PATCH">Patch</option>
              <option value="DELETE">Delete</option>
              <option value="STORE">Store</option>
              <option value="GRANT_ROLE">Grant Role</option>
              <option value="REVOKE_ROLE">Revoke Role</option>
            </select>

            <input
              type="month"
              value={filters.month}
              onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      {showStats && stats && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Transactions</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total?.toLocaleString() || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Filtered: {filteredLogs.length.toLocaleString()}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Actions</div>
              <div className="space-y-1">
                {Object.entries(stats.byAction || {}).map(([action, count]) => (
                  <div key={action} className="flex justify-between text-xs">
                    <span className="text-gray-600">{action}</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Tables</div>
              <div className="space-y-1">
                {Object.entries(stats.byTable || {}).map(([table, count]) => (
                  <div key={table} className="flex justify-between text-xs">
                    <span className="text-gray-600">{table.replace('_', ' ')}</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-6 py-4">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-600">Loading audit logs...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Changed By</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLogs.map((log) => (
                      <tr key={log.audit_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-500">#{log.audit_id}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(log.changed_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {log.table_name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          #{log.record_id || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="flex flex-col">
                            <span>{log.changed_by_user?.full_name || 'System'}</span>
                            <span className="text-xs text-gray-500 font-mono">{formatAddress(log.changed_by_wallet)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded">
                            {log.derivedBarangay || 'RHU'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => handleViewDetails(log)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredLogs.length === 0 && (
                <div className="p-12 text-center text-gray-500 text-sm">No audit logs found</div>
              )}
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detailed View Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
              <button
                onClick={closeDetails}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Basic Information</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium text-gray-900">{new Date(selectedLog.changed_at).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Table:</span>
                      <span className="font-medium text-gray-900">{selectedLog.table_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Record ID:</span>
                      <span className="font-medium text-gray-900">{selectedLog.record_id || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Action:</span>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${getActionColor(selectedLog.action)}`}>
                        {selectedLog.action}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Changed By:</span>
                      <span className="font-medium text-gray-900">{selectedLog.changed_by_user?.full_name || 'System'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Role:</span>
                      <span className="font-medium text-gray-900">{selectedLog.changed_by_user?.role || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Barangay:</span>
                      <span className="font-medium text-gray-900">{selectedLog.derivedBarangay || 'RHU'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wallet:</span>
                      <span className="font-mono text-xs font-medium text-gray-900">{formatAddress(selectedLog.changed_by_wallet)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Change Details</h4>
                  <div className="space-y-4">
                    {selectedLog.old_values && (
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-2">Previous Values:</div>
                        <pre className="bg-gray-50 border border-gray-200 p-3 rounded text-xs overflow-x-auto text-gray-900">
                          {safeJsonStringify(selectedLog.old_values)}
                        </pre>
                      </div>
                    )}
                    
                    {selectedLog.new_values && (
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-2">New Values:</div>
                        <pre className="bg-gray-50 border border-gray-200 p-3 rounded text-xs overflow-x-auto text-gray-900">
                          {safeJsonStringify(selectedLog.new_values)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeDetails}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded hover:bg-gray-700"
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

export default AllAuditLogs;