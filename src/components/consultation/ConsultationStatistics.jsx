// frontend/src/components/consultation/ConsultationStatistics.jsx
import React, { useState, useEffect } from 'react';
import { FaChartLine, FaCalendarAlt, FaUserMd, FaUserNurse, FaVideo, FaCheck, FaTimes, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { Line, Bar, Pie } from 'react-chartjs-2';
import API_BASE_URL from '../../config.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);


const API_URL = API_BASE_URL;

const ConsultationStatistics = () => {
  const [stats, setStats] = useState({
    totalConsultations: 0,
    scheduledConsultations: 0,
    completedConsultations: 0,
    cancelledConsultations: 0,
    todayConsultations: 0,
    upcomingConsultations: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7days'); // 7days, 30days, 90days, 1year
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    loadStatistics();
  }, [timeRange]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load summary stats
      const statsResponse = await fetch(`${API_URL}/consultations/stats/summary`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // Load chart data based on time range
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

      const chartResponse = await fetch(
        `${API_URL}/consultations?date_from=${startDate.toISOString().split('T')[0]}&date_to=${endDate.toISOString().split('T')[0]}&limit=1000`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      const chartData = await chartResponse.json();
      if (chartData.success) {
        generateChartData(chartData.data);
      }
      
    } catch (error) {
      console.error('Error loading statistics:', error);
      setError('Failed to load consultation statistics');
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (consultations) => {
    // Group consultations by date
    const dateGroups = {};
    consultations.forEach(consultation => {
      const date = new Date(consultation.scheduled_date).toISOString().split('T')[0];
      if (!dateGroups[date]) {
        dateGroups[date] = { total: 0, completed: 0, cancelled: 0 };
      }
      dateGroups[date].total++;
      if (consultation.status === 'COMPLETED') dateGroups[date].completed++;
      if (consultation.status === 'CANCELLED') dateGroups[date].cancelled++;
    });

    // Sort dates and prepare chart data
    const sortedDates = Object.keys(dateGroups).sort();
    const labels = sortedDates.map(date => new Date(date).toLocaleDateString());
    const totalData = sortedDates.map(date => dateGroups[date].total);
    const completedData = sortedDates.map(date => dateGroups[date].completed);
    const cancelledData = sortedDates.map(date => dateGroups[date].cancelled);

    setChartData({
      labels,
      datasets: [
        {
          label: 'Total Consultations',
          data: totalData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1
        },
        {
          label: 'Completed',
          data: completedData,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.1
        },
        {
          label: 'Cancelled',
          data: cancelledData,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.1
        }
      ]
    });
  };

  const statusChartData = {
    labels: ['Completed', 'Scheduled', 'Cancelled'],
    datasets: [
      {
        data: [
          stats.completedConsultations,
          stats.scheduledConsultations,
          stats.cancelledConsultations
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Consultation Trends - Last ${timeRange === '7days' ? '7 Days' : timeRange === '30days' ? '30 Days' : timeRange === '90days' ? '90 Days' : '1 Year'}`
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Consultation Status Distribution'
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <FaChartLine className="text-3xl text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Consultation Statistics</h1>
              <p className="text-gray-600">Analytics and reports for telemedicine consultations</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Time Range Selector */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Time Range</h2>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="1year">Last Year</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <FaCalendarAlt className="text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalConsultations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <FaClock className="text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{stats.scheduledConsultations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <FaCheck className="text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedConsultations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <FaTimes className="text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelledConsultations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100">
                <FaExclamationTriangle className="text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-2xl font-bold text-orange-600">{stats.todayConsultations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <FaVideo className="text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-purple-600">{stats.upcomingConsultations}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Line Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Consultation Trends</h3>
            {chartData ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">No data available for the selected time range</p>
              </div>
            )}
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
            {stats.totalConsultations > 0 ? (
              <Pie data={statusChartData} options={pieChartOptions} />
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">No consultations found</p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.totalConsultations > 0 ? ((stats.completedConsultations / stats.totalConsultations) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-sm text-gray-600">Completion Rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {stats.totalConsultations > 0 ? ((stats.cancelledConsultations / stats.totalConsultations) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-sm text-gray-600">Cancellation Rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.todayConsultations}
              </div>
              <p className="text-sm text-gray-600">Consultations Today</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationStatistics;
