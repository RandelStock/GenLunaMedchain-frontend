import { useState, useEffect } from 'react';
import { FaHistory, FaFilter, FaDownload, FaSearch, FaTimes } from 'react-icons/fa';
import API_BASE_URL from '../config.js';

const API_URL = API_BASE_URL;

const AuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({
    table_name: '',
    action: '',
    startDate: '',
    endDate: '',
    scope: 'all',
    barangay: '',
    month: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadAuditLogs();
  }, [page, filters]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const { table_name, action, startDate, endDate, scope, barangay, month } = filters;
      const queryParams = new URLSearchParams({
        table: table_name || 'all',
        action: action || 'all',
        dateFrom: startDate || '',
        dateTo: endDate || '',
        scope: scope || 'all',
        barangay: scope === 'barangay' ? (barangay || '') : '',
        month: month || '',
        page,
        limit: 50
      }).toString();

      const response = await fetch(`${API_BASE_URL}/audit-logs?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      const data = await response.json();
      
      setAuditLogs(data.logs || data);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE':
      case 'STORE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'UPDATE':
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

  const closeDetails = () => {
    setSelectedLog(null);
    setShowDetails(false);
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

  const handleExportCSV = () => {
    const csvContent = [
      ['Date', 'Table', 'Record ID', 'Action', 'Changed By', 'Wallet', 'ScopeBarangay'],
      ...auditLogs.map(log => [
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
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text('Audit Logs', 14, 16);
    let y = 24;
    auditLogs.slice(0, 100).forEach((log) => {
      const line = `${new Date(log.changed_at).toLocaleString()} | ${log.table_name}#${log.record_id || 'N/A'} | ${log.action} | ${log.changed_by_user?.full_name || 'System'} | ${log.derivedBarangay || 'RHU'}`;
      doc.text(line.substring(0, 110), 14, y);
      y += 6;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save(`audit-logs-${new Date().toISOString().split('T')[0]}.pdf`);
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
                <h1 className="text-xl font-semibold text-gray-900">Audit Logs</h1>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <span className="text-sm text-gray-600">{auditLogs.length} records</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                disabled={auditLogs.length === 0}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaDownload className="w-3.5 h-3.5" />
                CSV
              </button>
              <button
                onClick={handleExportPDF}
                disabled={auditLogs.length === 0}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaDownload className="w-3.5 h-3.5" />
                PDF
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <select
              value={filters.table_name}
              onChange={(e) => setFilters(prev => ({ ...prev, table_name: e.target.value }))}
              className="px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Tables</option>
              <option value="medicines">Medicines</option>
              <option value="receipts">Receipts</option>
              <option value="stocks">Stocks</option>
              <option value="residents">Residents</option>
              <option value="stock_removals">Stock Removals</option>
            </select>

            <select
              value={filters.action}
              onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
              className="px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="STORE">Store</option>
              <option value="GRANT_ROLE">Grant Role</option>
              <option value="REVOKE_ROLE">Revoke Role</option>
            </select>

            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={filters.scope}
              onChange={(e) => setFilters(prev => ({ ...prev, scope: e.target.value }))}
              className="px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Scope</option>
              <option value="RHU">RHU</option>
              <option value="barangay">Barangay</option>
            </select>

            {filters.scope === 'barangay' && (
              <input
                type="text"
                placeholder="Enter barangay"
                value={filters.barangay}
                onChange={(e) => setFilters(prev => ({ ...prev, barangay: e.target.value }))}
                className="px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
              />
            )}

            <input
              type="month"
              value={filters.month}
              onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
              className="px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

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
                    {auditLogs.map((log) => (
                      <tr key={log.audit_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900">#{log.audit_id}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(log.changed_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {log.table_name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          #{log.record_id || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="flex flex-col">
                            <span className="text-gray-900">{log.changed_by_user?.full_name || 'System'}</span>
                            <span className="text-xs text-gray-600 font-mono">{formatAddress(log.changed_by_wallet)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className="px-2 py-1 text-xs font-medium text-gray-900 bg-gray-100 rounded">
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

              {auditLogs.length === 0 && (
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

export default AuditLogs;