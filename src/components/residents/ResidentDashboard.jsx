import { useState, useEffect } from 'react';
import { Users, Heart, Baby, Gift, UserCheck, MapPin } from 'lucide-react';

const API_URL = 'http://localhost:4000';

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

const BarangayCard = ({ barangay, stats, onClick }) => {
  // Generate a unique gradient for each barangay
  const gradients = [
    'from-blue-400 to-blue-600',
    'from-green-400 to-green-600',
    'from-purple-400 to-purple-600',
    'from-pink-400 to-pink-600',
    'from-indigo-400 to-indigo-600',
    'from-red-400 to-red-600',
    'from-yellow-400 to-yellow-600',
    'from-teal-400 to-teal-600',
    'from-orange-400 to-orange-600',
  ];
  
  const gradientIndex = barangay.value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
  const gradient = gradients[gradientIndex];

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
    >
      {/* Image Header with Gradient Overlay */}
      <div className={`relative h-40 bg-gradient-to-br ${gradient}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <MapPin className="w-16 h-16 text-white opacity-30" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <h3 className="text-white font-bold text-lg">{barangay.label}</h3>
        </div>
      </div>

      {/* Stats Content */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Total Residents */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-700 font-medium">Residents</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{stats?.totalResidents || 0}</p>
          </div>

          {/* 4Ps Members */}
          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700 font-medium">4Ps</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{stats?.fourPsMembers || 0}</p>
          </div>

          {/* Pregnant */}
          <div className="bg-pink-50 rounded-lg p-3 border border-pink-100">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-pink-600" />
              <span className="text-xs text-pink-700 font-medium">Pregnant</span>
            </div>
            <p className="text-2xl font-bold text-pink-900">{stats?.pregnantResidents || 0}</p>
          </div>

          {/* Senior Citizens */}
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-purple-700 font-medium">Seniors</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">{stats?.seniorCitizens || 0}</p>
          </div>

          {/* Birth Registered */}
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-100 col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <Baby className="w-4 h-4 text-orange-600" />
              <span className="text-xs text-orange-700 font-medium">Birth Registered</span>
            </div>
            <p className="text-2xl font-bold text-orange-900">{stats?.birthRegistered || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const BarangayDetailModal = ({ barangay, stats, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{barangay.label}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700 mb-1">Total Residents</p>
              <p className="text-3xl font-bold text-blue-900">{stats?.totalResidents || 0}</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700 mb-1">4Ps Members</p>
              <p className="text-3xl font-bold text-green-900">{stats?.fourPsMembers || 0}</p>
            </div>
            
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
              <p className="text-sm text-pink-700 mb-1">Pregnant</p>
              <p className="text-3xl font-bold text-pink-900">{stats?.pregnantResidents || 0}</p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-700 mb-1">Senior Citizens</p>
              <p className="text-3xl font-bold text-purple-900">{stats?.seniorCitizens || 0}</p>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-700 mb-1">Birth Registered</p>
              <p className="text-3xl font-bold text-orange-900">{stats?.birthRegistered || 0}</p>
            </div>
          </div>

          {stats?.ageCategories && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Age Distribution</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">0-23 Months</span>
                  <span className="font-semibold text-gray-900">{stats.ageCategories.ZERO_TO_23_MONTHS || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">24-59 Months</span>
                  <span className="font-semibold text-gray-900">{stats.ageCategories.TWENTY_FOUR_TO_59_MONTHS || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">60-71 Months</span>
                  <span className="font-semibold text-gray-900">{stats.ageCategories.SIXTY_TO_71_MONTHS || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">Above 71 Months</span>
                  <span className="font-semibold text-gray-900">{stats.ageCategories.ABOVE_71_MONTHS || 0}</span>
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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAllBarangayData();
    
    // Set up periodic refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchAllBarangayData(true); // Silent refresh
    }, 30000);

    // Refresh when page becomes visible again (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchAllBarangayData(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchAllBarangayData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      const token = localStorage.getItem('token');
      
      // Use the compare/barangays endpoint which is designed for admin/municipal staff
      // to see all barangays without barangay restrictions
      try {
        const response = await fetch(`${API_URL}/residents/compare/barangays`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Convert the compare data format to our expected format
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
                  ageCategories: {}, // This endpoint doesn't provide age categories
                  genderBreakdown: {} // This endpoint doesn't provide gender breakdown
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
      
      // Fallback to individual barangay requests if compare endpoint fails
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

  const handleBarangayClick = (barangay) => {
    setSelectedBarangay(barangay);
    setSelectedStats(barangayData[barangay.value]?.stats);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600 text-lg">Loading barangay data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-gray-900">Barangay Statistics Dashboard</h1>
            <button
              onClick={handleManualRefresh}
              disabled={loading || refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
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
          <p className="text-gray-600 text-lg">General Luna, Quezon Province</p>
          <p className="text-sm text-gray-500 mt-2">All 27 Barangays</p>
          {refreshing && (
            <p className="text-sm text-blue-600 mt-2 animate-pulse">Updating data...</p>
          )}
        </div>

        {/* Barangay Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {BARANGAYS.map((barangay) => (
            <BarangayCard
              key={barangay.value}
              barangay={barangay}
              stats={barangayData[barangay.value]?.stats}
              onClick={() => handleBarangayClick(barangay)}
            />
          ))}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedBarangay && selectedStats && (
          <BarangayDetailModal
            barangay={selectedBarangay}
            stats={selectedStats}
            onClose={() => setShowDetailModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ResidentDashboard;