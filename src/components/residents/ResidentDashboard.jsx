import { useState, useEffect } from 'react';
import { Users, Heart, Baby, Gift, UserCheck, MapPin, Search, ChevronRight, X } from 'lucide-react';
import API_BASE_URL from '../../config.js';

const API_URL = API_BASE_URL;

const BARANGAYS = [
  { value: 'BACONG_IBABA', label: 'Bacong Ibaba' },
  { value: 'BACONG_ILAYA', label: 'Bacong Ilaya' },
  { value: 'BARANGAY_1_POBLACION', label: 'Barangay 1 (Poblacion)' },
  { value: 'BARANGAY_2_POBLACION', label: 'Barangay 2 (Poblacion)' },
  { value: 'BARANGAY_3_POBLACION', label: 'Barangay 3 (Poblacion)' },
  { value: 'BARANGAY_4_POBLACION', label: 'Barangay 4 (Poblacion)' },
  { value: 'BARANGAY_5_POBLACION', label: 'Barangay 5 (Poblacion)' },
  { value: 'BARANGAY_6_POBLACION', label: 'Barangay 6 (Poblacion)' },
  { value: 'BARANGAY_7_POBLACION', label: 'Barangay 7 (Poblacion)' },
  { value: 'BARANGAY_8_POBLACION', label: 'Barangay 8 (Poblacion)' },
  { value: 'BARANGAY_9_POBLACION', label: 'Barangay 9 (Poblacion)' },
  { value: 'LAVIDES', label: 'Lavides' },
  { value: 'MAGSAYSAY', label: 'Magsaysay' },
  { value: 'MALAYA', label: 'Malaya' },
  { value: 'NIEVA', label: 'Nieva' },
  { value: 'RECTO', label: 'Recto' },
  { value: 'SAN_IGNACIO_IBABA', label: 'San Ignacio Ibaba' },
  { value: 'SAN_IGNACIO_ILAYA', label: 'San Ignacio Ilaya' },
  { value: 'SAN_ISIDRO_IBABA', label: 'San Isidro Ibaba' },
  { value: 'SAN_ISIDRO_ILAYA', label: 'San Isidro Ilaya' },
  { value: 'SAN_JOSE', label: 'San Jose' },
  { value: 'SAN_NICOLAS', label: 'San Nicolas' },
  { value: 'SAN_VICENTE', label: 'San Vicente' },
  { value: 'SANTA_MARIA_IBABA', label: 'Santa Maria Ibaba' },
  { value: 'SANTA_MARIA_ILAYA', label: 'Santa Maria Ilaya' },
  { value: 'SUMILANG', label: 'Sumilang' },
  { value: 'VILLARICA', label: 'Villarica' }
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

// Simple Bar Chart Component
const SimpleBarChart = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-black">{item.name}</span>
            <span className="font-bold text-black">{item.value}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: COLORS[index % COLORS.length]
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Simple Pie Chart Component
const SimplePieChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="space-y-2">
      {data.map((item, index) => {
        const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
        return (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm font-medium text-black">{item.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{percentage}%</span>
              <span className="font-bold text-black">{item.value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const BarangayRow = ({ barangay, stats, onViewDetails }) => {
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-black">{barangay.label}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-center text-black font-medium">{stats?.totalResidents || 0}</td>
      <td className="px-6 py-4 text-center text-black">{stats?.fourPsMembers || 0}</td>
      <td className="px-6 py-4 text-center text-black">{stats?.pregnantResidents || 0}</td>
      <td className="px-6 py-4 text-center text-black">{stats?.seniorCitizens || 0}</td>
      <td className="px-6 py-4 text-center text-black">{stats?.birthRegistered || 0}</td>
      <td className="px-6 py-4 text-center">
        <button 
          onClick={() => onViewDetails(barangay, stats)}
          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mx-auto transition-colors"
        >
          View Details <ChevronRight className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

const BarangayDetailPanel = ({ barangay, stats, onClose }) => {
  // Prepare age distribution data for chart
  const ageData = [
    { name: '0-23 Months', value: stats?.ageCategories?.ZERO_TO_23_MONTHS || 0 },
    { name: '24-59 Months', value: stats?.ageCategories?.TWENTY_FOUR_TO_59_MONTHS || 0 },
    { name: '60-71 Months', value: stats?.ageCategories?.SIXTY_TO_71_MONTHS || 0 },
    { name: 'Above 71 Months', value: stats?.ageCategories?.ABOVE_71_MONTHS || 0 }
  ];

  // Prepare demographic data for pie chart
  const demographicData = [
    { name: '4Ps Members', value: stats?.fourPsMembers || 0 },
    { name: 'Pregnant', value: stats?.pregnantResidents || 0 },
    { name: 'Senior Citizens', value: stats?.seniorCitizens || 0 },
    { name: 'Birth Registered', value: stats?.birthRegistered || 0 }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">{barangay.label}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 rounded-full p-1 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {/* Summary Statistics */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-medium text-black">Total Residents</p>
              </div>
              <p className="text-3xl font-bold text-black">{stats?.totalResidents || 0}</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-black">4Ps Members</p>
              </div>
              <p className="text-3xl font-bold text-black">{stats?.fourPsMembers || 0}</p>
            </div>
            
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-pink-600" />
                <p className="text-sm font-medium text-black">Pregnant</p>
              </div>
              <p className="text-3xl font-bold text-black">{stats?.pregnantResidents || 0}</p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-5 h-5 text-purple-600" />
                <p className="text-sm font-medium text-black">Senior Citizens</p>
              </div>
              <p className="text-3xl font-bold text-black">{stats?.seniorCitizens || 0}</p>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Baby className="w-5 h-5 text-orange-600" />
                <p className="text-sm font-medium text-black">Birth Registered</p>
              </div>
              <p className="text-3xl font-bold text-black">{stats?.birthRegistered || 0}</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-2 gap-6">
            {/* Age Distribution Bar Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-4 text-black">Age Distribution</h3>
              <SimpleBarChart data={ageData} />
            </div>

            {/* Demographics Breakdown */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-4 text-black">Demographics Breakdown</h3>
              <SimplePieChart data={demographicData} />
            </div>
          </div>

          {/* Detailed Age Categories */}
          {stats?.ageCategories && (
            <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3 text-black">Detailed Age Categories</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                  <span className="text-sm font-medium text-black">0-23 Months</span>
                  <span className="font-bold text-lg text-black">{stats.ageCategories.ZERO_TO_23_MONTHS || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                  <span className="text-sm font-medium text-black">24-59 Months</span>
                  <span className="font-bold text-lg text-black">{stats.ageCategories.TWENTY_FOUR_TO_59_MONTHS || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                  <span className="text-sm font-medium text-black">60-71 Months</span>
                  <span className="font-bold text-lg text-black">{stats.ageCategories.SIXTY_TO_71_MONTHS || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                  <span className="text-sm font-medium text-black">Above 71 Months</span>
                  <span className="font-bold text-lg text-black">{stats.ageCategories.ABOVE_71_MONTHS || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ResidentDashboard = () => {
  const [barangayData, setBarangayData] = useState({});
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  const [selectedStats, setSelectedStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAllBarangayData();
  }, []);

  const fetchAllBarangayData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      const token = localStorage.getItem('token');
      
      try {
        const response = await fetch(`${API_URL}/residents/compare/barangays`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const dataMap = {};
            data.data.forEach(item => {
              dataMap[item.barangay] = {
                success: true,
                barangay: item.barangay,
                stats: {
                  totalResidents: item.total,
                  fourPsMembers: item.fourPsMembers,
                  pregnantResidents: item.pregnant,
                  seniorCitizens: item.seniorCitizens,
                  birthRegistered: item.birthRegistered,
                  ageCategories: {},
                  genderBreakdown: {}
                }
              };
            });
            console.log('Barangay data received:', dataMap);
            setBarangayData(dataMap);
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching compare data:', error);
      }
      
      const promises = BARANGAYS.map(async (barangay) => {
        try {
          const response = await fetch(`${API_URL}/residents/statistics/barangay/${barangay.value}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            console.warn(`Failed to fetch ${barangay.label}:`, response.status);
            return { barangay: barangay.value, data: null };
          }
          
          const data = await response.json();
          return { barangay: barangay.value, data };
        } catch (error) {
          console.error(`Error fetching ${barangay.label}:`, error);
          return { barangay: barangay.value, data: null };
        }
      });

      const results = await Promise.all(promises);
      const dataMap = {};
      results.forEach(result => {
        if (result.data) {
          dataMap[result.barangay] = result.data;
        }
      });
      
      setBarangayData(dataMap);
    } catch (error) {
      console.error('Error fetching barangay data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchAllBarangayData();
  };

  const handleViewDetails = (barangay, stats) => {
    setSelectedBarangay(barangay);
    setSelectedStats(stats);
    setShowDetailPanel(true);
  };

  const filteredBarangays = BARANGAYS.filter(barangay =>
    barangay.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-900 text-lg font-medium">Loading barangay data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 rounded-t-lg px-6 py-4 mb-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Barangay Statistics Dashboard</h1>
              <p className="text-gray-600 mt-1">General Luna, Quezon Province • All 27 Barangays</p>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={loading || refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors font-medium"
            >
              <svg 
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search barangay..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Barangay</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">Total Residents</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">4Ps Members</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">Pregnant</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">Senior Citizens</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">Birth Registered</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBarangays.map((barangay) => (
                  <BarangayRow
                    key={barangay.value}
                    barangay={barangay}
                    stats={barangayData[barangay.value]?.stats}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredBarangays.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No barangays found matching your search.</p>
            </div>
          )}
        </div>

        {refreshing && (
          <div className="mt-4 text-center">
            <p className="text-sm text-blue-600 animate-pulse font-medium">Updating data...</p>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {showDetailPanel && selectedBarangay && selectedStats && (
        <BarangayDetailPanel
          barangay={selectedBarangay}
          stats={selectedStats}
          onClose={() => setShowDetailPanel(false)}
        />
      )}
    </div>
  );
};

export default ResidentDashboard;