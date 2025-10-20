// components/AuditLogs.jsx - Database audit trail (separate from blockchain)
import { useState, useEffect } from 'react';
import { FaHistory, FaFilter, FaDownload, FaEye, FaEyeSlash } from 'react-icons/fa';
import API_BASE_URL from '../../config.js';

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

      const response = await fetch(`${API_URL}/audit-logs?${queryParams}`, {
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
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'GRANT_ROLE':
        return 'bg-purple-100 text-purple-800';
      case 'REVOKE_ROLE':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <FaHistory className="mr-3 text-blue-600" />
              Database Audit Logs
            </h1>
            <p className="text-gray-600 mt-2">Complete audit trail of database operations</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportCSV}
              disabled={auditLogs.length === 0}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
            >
              <FaDownload className="mr-2" />
              Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              disabled={auditLogs.length === 0}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              <FaDownload className="mr-2" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FaFilter className="mr-2" />
            Filter Logs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <select
              value={filters.table_name}
              onChange={(e) => setFilters(prev => ({ ...prev, table_name: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={filters.scope}
              onChange={(e) => setFilters(prev => ({ ...prev, scope: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            )}

            <input
              type="month"
              value={filters.month}
              onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading audit logs...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Record</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Changed By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wallet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.map((log) => (
                    <tr key={log.audit_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.changed_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {log.table_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        #{log.record_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.changed_by_user?.full_name || 'System'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                        {formatAddress(log.changed_by_wallet)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleViewDetails(log)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Changes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {auditLogs.length === 0 && !loading && (
            <div className="p-8 text-center text-gray-500">
              No audit logs found
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Detailed View Modal */}
        {showDetails && selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-black">Transaction Details</h3>
                  <button
                    onClick={closeDetails}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-black mb-2">Basic Information</h4>
                    <div className="space-y-2 text-sm text-black">
                      <div><span className="font-medium">Date:</span> {new Date(selectedLog.changed_at).toLocaleString()}</div>
                      <div><span className="font-medium">Table:</span> {selectedLog.table_name}</div>
                      <div><span className="font-medium">Record ID:</span> {selectedLog.record_id || 'N/A'}</div>
                      <div><span className="font-medium">Action:</span> 
                        <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(selectedLog.action)}`}>
                          {selectedLog.action}
                        </span>
                      </div>
                      <div><span className="font-medium">Changed By:</span> {selectedLog.changed_by_user?.full_name || 'System'}</div>
                      <div><span className="font-medium">Role:</span> {selectedLog.changed_by_user?.role || 'N/A'}</div>
                      <div><span className="font-medium">Barangay:</span> {selectedLog.derivedBarangay || 'RHU'}</div>
                      <div><span className="font-medium">Wallet:</span> {formatAddress(selectedLog.changed_by_wallet)}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-black mb-2">Change Details</h4>
                    <div className="space-y-4">
                      {selectedLog.old_values && (
                        <div>
                          <h5 className="text-sm font-medium text-black mb-1">Previous Values:</h5>
                          <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto text-black">
                            {safeJsonStringify(selectedLog.old_values)}
                          </pre>
                        </div>
                      )}
                      
                      {selectedLog.new_values && (
                        <div>
                          <h5 className="text-sm font-medium text-black mb-1">New Values:</h5>
                          <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto text-black">
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
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;