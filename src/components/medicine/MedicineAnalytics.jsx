import React, { useState, useEffect } from 'react';
import { 
  FaCapsules, 
  FaChartLine, 
  FaBoxes, 
  FaExclamationTriangle,
  FaCalendarAlt,
  FaArrowUp, // ✅ FIXED: Replaced FaTrendingUp
  FaWarehouse,
  FaClipboardList
} from 'react-icons/fa';
import api from '../../../api';

const MedicineAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // ✅ NEW: Error state
  const [timeRange, setTimeRange] = useState('month');
  const [analytics, setAnalytics] = useState({
    totalMedicines: 0,
    totalStock: 0,
    lowStockCount: 0,
    expiringSoonCount: 0,
    topRestockedMedicines: [],
    recentlyAddedMedicines: [],
    stockValueTrend: [],
    categoryDistribution: [],
    expiryAlerts: [],
    barangayDistribution: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null); // ✅ NEW: Reset error on new fetch
    
    try {
      // ✅ ENHANCED: Error handling for API calls
      const medicinesResponse = await api.get('/medicines');
      const medicines = medicinesResponse.data.data || [];

      if (!Array.isArray(medicines)) {
        throw new Error('Invalid medicines data received');
      }

      const stocksResponse = await api.get('/stocks?limit=1000');
      const allStocks = stocksResponse.data.data || [];

      if (!Array.isArray(allStocks)) {
        throw new Error('Invalid stocks data received');
      }

      // Calculate analytics with error handling
      const calculatedAnalytics = calculateAnalytics(medicines, allStocks);
      setAnalytics(calculatedAnalytics);
      
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      
      // ✅ ENHANCED: User-friendly error messages
      let errorMessage = 'Failed to load analytics data';
      
      if (err.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Analytics endpoint not found.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (medicines, allStocks) => {
    try {
      const now = new Date();
      const lowStockThreshold = 10;
      const expiryWarningDays = 30;

      const getDateRange = (range) => {
        const startDate = new Date();
        switch (range) {
          case 'day':
            startDate.setDate(startDate.getDate() - 1);
            break;
          case 'week':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          default:
            startDate.setMonth(startDate.getMonth() - 1);
        }
        return startDate;
      };

      const startDate = getDateRange(timeRange);

      // Total medicines and stock
      const totalMedicines = medicines.length;
      const totalStock = medicines.reduce((sum, med) => {
        return sum + (med.medicine_stocks || []).reduce((s, stock) => s + (stock.remaining_quantity || 0), 0);
      }, 0);

      // Low stock count
      const lowStockCount = medicines.filter(med => {
        const totalMedStock = (med.medicine_stocks || []).reduce((s, stock) => s + (stock.remaining_quantity || 0), 0);
        return totalMedStock > 0 && totalMedStock <= lowStockThreshold;
      }).length;

      // Expiring soon
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryWarningDays);
      
      const expiryAlerts = [];
      medicines.forEach(med => {
        (med.medicine_stocks || []).forEach(stock => {
          try {
            const expiry = new Date(stock.expiry_date);
            if (!isNaN(expiry.getTime()) && expiry > now && expiry <= expiryDate && stock.remaining_quantity > 0) {
              expiryAlerts.push({
                medicine_name: med.medicine_name || 'Unknown',
                batch_number: stock.batch_number || 'N/A',
                expiry_date: stock.expiry_date,
                remaining_quantity: stock.remaining_quantity || 0,
                days_until_expiry: Math.floor((expiry - now) / (1000 * 60 * 60 * 24))
              });
            }
          } catch (err) {
            console.warn('Error processing expiry date:', err);
          }
        });
      });

      const expiringSoonCount = expiryAlerts.length;

      // Recently added medicines
      const recentlyAddedMedicines = allStocks
        .filter(stock => {
          try {
            return new Date(stock.date_received) >= startDate;
          } catch {
            return false;
          }
        })
        .map(stock => {
          const medicine = medicines.find(m => m.medicine_id === stock.medicine_id);
          return {
            medicine_name: medicine?.medicine_name || 'Unknown',
            quantity: stock.quantity || 0,
            date_received: stock.date_received,
            batch_number: stock.batch_number || 'N/A'
          };
        })
        .sort((a, b) => {
          try {
            return new Date(b.date_received) - new Date(a.date_received);
          } catch {
            return 0;
          }
        })
        .slice(0, 10);

      // Top restocked medicines
      const restockMap = {};
      allStocks
        .filter(stock => {
          try {
            return new Date(stock.date_received) >= startDate;
          } catch {
            return false;
          }
        })
        .forEach(stock => {
          const medicine = medicines.find(m => m.medicine_id === stock.medicine_id);
          const name = medicine?.medicine_name || 'Unknown';
          if (!restockMap[name]) {
            restockMap[name] = {
              medicine_name: name,
              total_quantity: 0,
              restock_count: 0
            };
          }
          restockMap[name].total_quantity += stock.quantity || 0;
          restockMap[name].restock_count += 1;
        });

      const topRestockedMedicines = Object.values(restockMap)
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, 10);

      // Category distribution
      const categoryMap = {};
      medicines.forEach(med => {
        const category = med.category || 'Uncategorized';
        const categories = category.split(',').map(c => c.trim());
        categories.forEach(cat => {
          if (!categoryMap[cat]) {
            categoryMap[cat] = { category: cat, count: 0, total_stock: 0 };
          }
          categoryMap[cat].count += 1;
          const medStock = (med.medicine_stocks || []).reduce((s, stock) => s + (stock.remaining_quantity || 0), 0);
          categoryMap[cat].total_stock += medStock;
        });
      });

      const categoryDistribution = Object.values(categoryMap)
        .sort((a, b) => b.count - a.count);

      // Barangay distribution
      const barangayMap = {};
      medicines.forEach(med => {
        const barangay = med.barangay || 'Unknown';
        if (!barangayMap[barangay]) {
          barangayMap[barangay] = { barangay, count: 0, total_stock: 0 };
        }
        barangayMap[barangay].count += 1;
        const medStock = (med.medicine_stocks || []).reduce((s, stock) => s + (stock.remaining_quantity || 0), 0);
        barangayMap[barangay].total_stock += medStock;
      });

      const barangayDistribution = Object.values(barangayMap)
        .sort((a, b) => b.total_stock - a.total_stock);

      return {
        totalMedicines,
        totalStock,
        lowStockCount,
        expiringSoonCount,
        topRestockedMedicines,
        recentlyAddedMedicines,
        categoryDistribution,
        expiryAlerts: expiryAlerts.sort((a, b) => a.days_until_expiry - b.days_until_expiry).slice(0, 10),
        barangayDistribution
      };
    } catch (err) {
      console.error('Error calculating analytics:', err);
      // Return empty analytics on calculation error
      return {
        totalMedicines: 0,
        totalStock: 0,
        lowStockCount: 0,
        expiringSoonCount: 0,
        topRestockedMedicines: [],
        recentlyAddedMedicines: [],
        categoryDistribution: [],
        expiryAlerts: [],
        barangayDistribution: []
      };
    }
  };

  // ✅ LOADING STATE
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
        <p className="text-sm font-medium text-gray-900">Loading analytics...</p>
      </div>
    );
  }

  // ✅ ERROR STATE
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 border border-red-300 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <FaExclamationTriangle className="text-3xl text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Analytics</h3>
        <p className="text-sm text-gray-800 mb-4">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <FaChartLine className="text-blue-600" />
              Medicine Analytics
            </h2>
            <p className="text-sm font-medium text-gray-800">Insights and trends for medicine inventory</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">Time Range:</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards - ✅ ALL DARK TEXT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-300 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-600 p-3 rounded-xl">
              <FaCapsules className="text-2xl text-white" />
            </div>
            <span className="text-xs font-bold text-blue-900 bg-blue-200 px-2 py-1 rounded">TOTAL</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.totalMedicines}</div>
          <div className="text-sm font-bold text-gray-800">Total Medicines</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-300 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-600 p-3 rounded-xl">
              <FaBoxes className="text-2xl text-white" />
            </div>
            <span className="text-xs font-bold text-green-900 bg-green-200 px-2 py-1 rounded">STOCK</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.totalStock.toLocaleString()}</div>
          <div className="text-sm font-bold text-gray-800">Total Units in Stock</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-300 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-yellow-600 p-3 rounded-xl">
              <FaWarehouse className="text-2xl text-white" />
            </div>
            <span className="text-xs font-bold text-yellow-900 bg-yellow-200 px-2 py-1 rounded">LOW</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.lowStockCount}</div>
          <div className="text-sm font-bold text-gray-800">Low Stock Medicines</div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-300 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-red-600 p-3 rounded-xl">
              <FaExclamationTriangle className="text-2xl text-white" />
            </div>
            <span className="text-xs font-bold text-red-900 bg-red-200 px-2 py-1 rounded">ALERT</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.expiringSoonCount}</div>
          <div className="text-sm font-bold text-gray-800">Expiring Soon (30 days)</div>
        </div>
      </div>

      {/* Top Restocked Medicines & Recently Added - ✅ ALL DARK TEXT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Restocked */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-purple-100 p-3 rounded-xl">
              <FaArrowUp className="text-xl text-purple-600" /> {/* ✅ FIXED ICON */}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Top Restocked Medicines</h3>
              <p className="text-xs font-medium text-gray-800">Most added in selected period</p>
            </div>
          </div>

          {analytics.topRestockedMedicines.length > 0 ? (
            <div className="space-y-3">
              {analytics.topRestockedMedicines.map((med, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-300">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{med.medicine_name}</p>
                      <p className="text-xs font-medium text-gray-800">{med.restock_count} restock{med.restock_count > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-purple-700">+{med.total_quantity}</span>
                    <p className="text-xs font-medium text-gray-800">units</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-800 text-sm font-medium">
              No restocks in selected period
            </div>
          )}
        </div>

        {/* Recently Added */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-green-100 p-3 rounded-xl">
              <FaClipboardList className="text-xl text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Recently Added Stock</h3>
              <p className="text-xs font-medium text-gray-800">Latest additions in selected period</p>
            </div>
          </div>

          {analytics.recentlyAddedMedicines.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {analytics.recentlyAddedMedicines.map((stock, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-300 hover:bg-green-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">{stock.medicine_name}</p>
                    <p className="text-xs font-medium text-gray-800">Batch: {stock.batch_number}</p>
                  </div>
                  <div className="text-right mr-3">
                    <span className="text-base font-bold text-green-700">+{stock.quantity}</span>
                  </div>
                  <div className="text-xs font-medium text-gray-800">
                    <FaCalendarAlt className="inline mr-1" />
                    {new Date(stock.date_received).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-800 text-sm font-medium">
              No new stock in selected period
            </div>
          )}
        </div>
      </div>

      {/* Expiry Alerts & Category Distribution - ✅ ALL DARK TEXT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Expiry Alerts */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-red-100 p-3 rounded-xl">
              <FaExclamationTriangle className="text-xl text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Expiry Alerts</h3>
              <p className="text-xs font-medium text-gray-800">Medicines expiring within 30 days</p>
            </div>
          </div>

          {analytics.expiryAlerts.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {analytics.expiryAlerts.map((alert, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-lg border-2 ${
                    alert.days_until_expiry <= 7 
                      ? 'bg-red-50 border-red-400' 
                      : alert.days_until_expiry <= 14 
                      ? 'bg-orange-50 border-orange-400'
                      : 'bg-yellow-50 border-yellow-400'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">{alert.medicine_name}</p>
                      <p className="text-xs font-medium text-gray-800">Batch: {alert.batch_number}</p>
                      <p className="text-xs font-medium text-gray-800 mt-1">Stock: {alert.remaining_quantity} units</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        alert.days_until_expiry <= 7 
                          ? 'bg-red-200 text-red-900' 
                          : alert.days_until_expiry <= 14 
                          ? 'bg-orange-200 text-orange-900'
                          : 'bg-yellow-200 text-yellow-900'
                      }`}>
                        {alert.days_until_expiry} days
                      </span>
                      <p className="text-xs font-medium text-gray-800 mt-1">
                        {new Date(alert.expiry_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-800 text-sm font-medium">
              No medicines expiring within 30 days
            </div>
          )}
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-indigo-100 p-3 rounded-xl">
              <FaChartLine className="text-xl text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Category Distribution</h3>
              <p className="text-xs font-medium text-gray-800">Medicines by category</p>
            </div>
          </div>

          {analytics.categoryDistribution.length > 0 ? (
            <div className="space-y-3">
              {analytics.categoryDistribution.slice(0, 8).map((cat, idx) => {
                const maxCount = Math.max(...analytics.categoryDistribution.map(c => c.count));
                const percentage = maxCount > 0 ? (cat.count / maxCount) * 100 : 0;
                
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">{cat.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-indigo-700">{cat.count}</span>
                        <span className="text-xs font-medium text-gray-800">medicines</span>
                        <span className="text-xs font-bold text-gray-900">•</span>
                        <span className="text-xs font-bold text-gray-900">{cat.total_stock} units</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-indigo-600 to-indigo-700 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-800 text-sm font-medium">
              No category data available
            </div>
          )}
        </div>
      </div>

      {/* Barangay Distribution - ✅ ALL DARK TEXT */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-blue-100 p-3 rounded-xl">
            <FaWarehouse className="text-xl text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Barangay Distribution</h3>
            <p className="text-xs font-medium text-gray-800">Medicine inventory by location</p>
          </div>
        </div>

        {analytics.barangayDistribution.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.barangayDistribution.map((brgy, idx) => (
              <div key={idx} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-300">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-900 text-sm">{brgy.barangay}</h4>
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-bold">
                    #{idx + 1}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">Medicines:</span>
                    <span className="text-sm font-bold text-gray-900">{brgy.count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">Total Stock:</span>
                    <span className="text-sm font-bold text-blue-700">{brgy.total_stock.toLocaleString()} units</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-800 text-sm font-medium">
            No barangay data available
          </div>
        )}
      </div>

      {/* Summary Footer - ✅ ALL DARK TEXT */}
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-6 border-2 border-gray-300">
        <div className="text-center">
          <p className="text-sm font-bold text-gray-900 mb-2">
            📊 Data refreshed based on <strong className="text-blue-700">{timeRange === 'day' ? 'last 24 hours' : timeRange === 'week' ? 'last 7 days' : 'last 30 days'}</strong>
          </p>
          <p className="text-xs font-medium text-gray-800">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MedicineAnalytics;