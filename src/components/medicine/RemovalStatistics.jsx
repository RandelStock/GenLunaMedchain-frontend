import { useState, useEffect } from 'react';
import { Line, Pie } from 'react-chartjs-2';

const REMOVAL_REASONS = {
  EXPIRED: { label: 'Expired', icon: '⏰', color: 'red' },
  ENTRY_ERROR: { label: 'Entry Error', icon: '✏️', color: 'orange' },
  DAMAGED: { label: 'Damaged', icon: '💔', color: 'yellow' },
  LOST: { label: 'Lost', icon: '🔍', color: 'gray' },
  OTHER: { label: 'Other', icon: '📋', color: 'blue' }
};

const RemovalStatistics = ({ removals }) => {
  const [timeRange, setTimeRange] = useState('30days');
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (removals.length > 0) {
      generateChartData(removals);
    }
  }, [removals, timeRange]);

  const generateChartData = (removalsData) => {
    // Filter by time range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    const filteredByTime = removalsData.filter(r => 
      new Date(r.date_removed) >= startDate && new Date(r.date_removed) <= endDate
    );

    // Group by date
    const dateGroups = {};
    filteredByTime.forEach(removal => {
      const date = new Date(removal.date_removed).toISOString().split('T')[0];
      if (!dateGroups[date]) {
        dateGroups[date] = { total: 0, quantity: 0 };
      }
      dateGroups[date].total++;
      dateGroups[date].quantity += removal.quantity_removed;
    });

    const sortedDates = Object.keys(dateGroups).sort();
    const labels = sortedDates.map(date => new Date(date).toLocaleDateString());
    const totalData = sortedDates.map(date => dateGroups[date].total);
    const quantityData = sortedDates.map(date => dateGroups[date].quantity);

    setChartData({
      labels,
      datasets: [
        {
          label: 'Number of Removals',
          data: totalData,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.1,
          yAxisID: 'y',
        },
        {
          label: 'Quantity Removed',
          data: quantityData,
          borderColor: 'rgb(251, 146, 60)',
          backgroundColor: 'rgba(251, 146, 60, 0.1)',
          tension: 0.1,
          yAxisID: 'y1',
        }
      ]
    });
  };

  const totalQuantityRemoved = removals.reduce((sum, r) => sum + r.quantity_removed, 0);
  
  const reasonStats = Object.keys(REMOVAL_REASONS).map(reason => {
    const reasonRemovals = removals.filter(r => r.reason === reason);
    return {
      reason,
      count: reasonRemovals.length,
      quantity: reasonRemovals.reduce((sum, r) => sum + r.quantity_removed, 0)
    };
  }).filter(s => s.count > 0);

  const reasonChartData = {
    labels: reasonStats.map(s => REMOVAL_REASONS[s.reason].label),
    datasets: [
      {
        data: reasonStats.map(s => s.quantity),
        backgroundColor: reasonStats.map(s => {
          const colorMap = {
            red: 'rgba(239, 68, 68, 0.8)',
            orange: 'rgba(251, 146, 60, 0.8)',
            yellow: 'rgba(234, 179, 8, 0.8)',
            gray: 'rgba(107, 114, 128, 0.8)',
            blue: 'rgba(59, 130, 246, 0.8)'
          };
          return colorMap[REMOVAL_REASONS[s.reason].color];
        }),
        borderColor: reasonStats.map(s => {
          const colorMap = {
            red: 'rgb(239, 68, 68)',
            orange: 'rgb(251, 146, 60)',
            yellow: 'rgb(234, 179, 8)',
            gray: 'rgb(107, 114, 128)',
            blue: 'rgb(59, 130, 246)'
          };
          return colorMap[REMOVAL_REASONS[s.reason].color];
        }),
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Removal Trends - Last ${timeRange === '7days' ? '7 Days' : timeRange === '30days' ? '30 Days' : timeRange === '90days' ? '90 Days' : '1 Year'}`
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Removals'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Quantity Removed'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Removals by Reason (Quantity)'
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Time Range</h2>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Removals</p>
              <p className="text-2xl font-bold text-gray-900">{removals.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4M9 21h6a2 2 0 002-2v-5H7v5a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Quantity</p>
              <p className="text-2xl font-bold text-orange-600">{totalQuantityRemoved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">On Blockchain</p>
              <p className="text-2xl font-bold text-green-600">
                {removals.filter(r => r.blockchain_tx_hash).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Sync</p>
              <p className="text-2xl font-bold text-yellow-600">
                {removals.filter(r => !r.blockchain_tx_hash).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Removal Trends</h3>
          {chartData && chartData.labels.length > 0 ? (
            <div className="h-80">
              <Line data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-80">
              <p className="text-gray-500">No data available for the selected time range</p>
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Removals by Reason</h3>
          {reasonStats.length > 0 ? (
            <div className="h-80 flex items-center justify-center">
              <Pie data={reasonChartData} options={pieChartOptions} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-80">
              <p className="text-gray-500">No removal data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Reason Breakdown Cards */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Breakdown by Reason</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {reasonStats.map((stat) => {
            const cfg = REMOVAL_REASONS[stat.reason];
            const colorClasses = {
              red: { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-600' },
              orange: { border: 'border-orange-200', bg: 'bg-orange-50', text: 'text-orange-600' },
              yellow: { border: 'border-yellow-200', bg: 'bg-yellow-50', text: 'text-yellow-600' },
              gray: { border: 'border-gray-200', bg: 'bg-gray-50', text: 'text-gray-600' },
              blue: { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-600' }
            };
            const colors = colorClasses[cfg.color] || colorClasses.blue;
            
            return (
              <div key={stat.reason} className={`rounded-lg border p-4 ${colors.border} ${colors.bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-700 flex items-center gap-2">
                    <span>{cfg.icon}</span> {cfg.label}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    {stat.count} removal{stat.count !== 1 ? 's' : ''}
                  </p>
                  <p className={`${colors.text} font-bold text-lg`}>
                    {stat.quantity} units
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RemovalStatistics;