import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const REMOVAL_REASONS = {
  EXPIRED: { label: 'Expired', icon: '⏰', color: 'red' },
  ENTRY_ERROR: { label: 'Entry Error', icon: '✏️', color: 'orange' },
  DAMAGED: { label: 'Damaged', icon: '💔', color: 'yellow' },
  LOST: { label: 'Lost', icon: '🔍', color: 'gray' },
  OTHER: { label: 'Other', icon: '📋', color: 'blue' }
};

const RemovalStatsDashboard = () => {
  const [stats, setStats] = useState([]);
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(dateRange).toString();
      const response = await fetch(`${API_URL}/removals/stats/summary?${queryParams}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Failed to load stats');
      
      const json = await response.json();
      // Fix: Extract the data array from the response
      const data = json.data || json || [];
      setStats(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setStats([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const clearDates = () => {
    setDateRange({ start_date: '', end_date: '' });
  };

  const totalRemovals = stats.reduce((sum, s) => sum + (s._count?.removal_id || 0), 0);
  const totalQuantity = stats.reduce((sum, s) => sum + (s._sum?.quantity_removed || 0), 0);

  const getReasonConfig = (reason) => REMOVAL_REASONS[reason] || REMOVAL_REASONS.OTHER;

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              name="start_date"
              value={dateRange.start_date}
              onChange={handleDateChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              name="end_date"
              value={dateRange.end_date}
              onChange={handleDateChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={clearDates}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Dates
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Total Removals</p>
              <p className="text-3xl font-bold">{totalRemovals}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Total Quantity Removed</p>
              <p className="text-3xl font-bold">{totalQuantity}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4M9 21h6a2 2 0 002-2v-5H7v5a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown by Reason */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Removals by Reason</h3>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : stats.length === 0 ? (
          <p className="text-gray-500">No removal data available</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((reasonStat, idx) => {
              const cfg = getReasonConfig(reasonStat.reason);
              const colorClasses = {
                red: { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-600' },
                orange: { border: 'border-orange-200', bg: 'bg-orange-50', text: 'text-orange-600' },
                yellow: { border: 'border-yellow-200', bg: 'bg-yellow-50', text: 'text-yellow-600' },
                gray: { border: 'border-gray-200', bg: 'bg-gray-50', text: 'text-gray-600' },
                blue: { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-600' }
              };
              const colors = colorClasses[cfg.color] || colorClasses.blue;
              
              return (
                <div key={idx} className={`rounded-lg border p-4 ${colors.border} ${colors.bg}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700 flex items-center gap-2">
                        <span>{cfg.icon}</span> {cfg.label}
                      </p>
                      <p className="text-sm text-gray-500">
                        {reasonStat._count?.removal_id || 0} removals
                      </p>
                    </div>
                    <div className={`${colors.text} font-bold text-lg`}>
                      {reasonStat._sum?.quantity_removed || 0}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RemovalStatsDashboard;