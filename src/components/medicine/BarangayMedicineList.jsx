// frontend/src/components/medicine/BarangayMedicineList.jsx
// Medicine list component with barangay filtering

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth'; // Your auth hook
import axios from 'axios';

const BarangayMedicineList = () => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  const [availableBarangays, setAvailableBarangays] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Fetch available barangays for the user
  useEffect(() => {
    const fetchBarangays = async () => {
      try {
        const response = await axios.get('/api/user/barangays');
        setAvailableBarangays(response.data.barangays);
        
        // Set default barangay
        if (response.data.barangays.length > 0) {
          setSelectedBarangay(response.data.barangays[0].barangay);
        }
      } catch (error) {
        console.error('Error fetching barangays:', error);
      }
    };

    fetchBarangays();
  }, []);

  // Fetch medicines and stats
  useEffect(() => {
    if (!selectedBarangay) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [medicinesRes, statsRes] = await Promise.all([
          axios.get('/api/medicines', {
            params: {
              search: searchTerm,
              category: categoryFilter,
              is_active: true
            }
          }),
          axios.get('/api/medicines/stats')
        ]);

        setMedicines(medicinesRes.data.data);
        setStats(statsRes.data.stats);
      } catch (error) {
        console.error('Error fetching medicines:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedBarangay, searchTerm, categoryFilter]);

  const getStockStatus = (totalStock) => {
    if (totalStock === 0) return { text: 'Out of Stock', color: 'text-red-600 bg-red-50' };
    if (totalStock <= 10) return { text: 'Low Stock', color: 'text-yellow-600 bg-yellow-50' };
    return { text: 'In Stock', color: 'text-green-600 bg-green-50' };
  };

  const formatBarangayName = (barangay) => {
    return barangay.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Barangay Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Medicine Inventory</h2>
            <p className="text-gray-600 mt-1">
              {user.role === 'ADMIN' || user.role === 'MUNICIPAL_STAFF' 
                ? 'All Barangay Health Centers' 
                : formatBarangayName(user.assigned_barangay)}
            </p>
          </div>

          {/* Barangay Selector (for Admin/Municipal Staff) */}
          {(user.role === 'ADMIN' || user.role === 'MUNICIPAL_STAFF') && availableBarangays.length > 1 && (
            <select
              value={selectedBarangay || ''}
              onChange={(e) => setSelectedBarangay(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Barangays</option>
              {availableBarangays.map((bg) => (
                <option key={bg.barangay} value={bg.barangay}>
                  {bg.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-blue-600 text-sm font-medium">Total Medicines</p>
              <p className="text-3xl font-bold text-blue-700">{stats.totalMedicines}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-green-600 text-sm font-medium">Active Medicines</p>
              <p className="text-3xl font-bold text-green-700">{stats.activeMedicines}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-yellow-600 text-sm font-medium">Low Stock Items</p>
              <p className="text-3xl font-bold text-yellow-700">{stats.lowStockMedicines}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-red-600 text-sm font-medium">Expired Batches</p>
              <p className="text-3xl font-bold text-red-700">{stats.expiredStocks}</p>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search medicines by name or generic name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="Antibiotic">Antibiotic</option>
              <option value="Analgesic">Analgesic</option>
              <option value="Antipyretic">Antipyretic</option>
              <option value="Vitamin">Vitamin</option>
              <option value="Supplement">Supplement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Medicine List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Medicine Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Generic Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Active Batches
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {medicines.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  No medicines found for this barangay
                </td>
              </tr>
            ) : (
              medicines.map((medicine) => {
                const stockStatus = getStockStatus(medicine.total_stock);
                return (
                  <tr key={medicine.medicine_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {medicine.medicine_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {medicine.strength && `${medicine.strength} • `}
                        {medicine.dosage_form}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {medicine.generic_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {medicine.category || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {medicine.total_stock}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                        {stockStatus.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {medicine.active_batches} batch{medicine.active_batches !== 1 ? 'es' : ''}
                      {medicine.expired_batches > 0 && (
                        <span className="ml-2 text-red-600">
                          ({medicine.expired_batches} expired)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => window.location.href = `/medicines/${medicine.medicine_id}`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={() => window.location.href = `/medicines/${medicine.medicine_id}/edit`}
                        className="text-green-600 hover:text-green-900"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BarangayMedicineList;