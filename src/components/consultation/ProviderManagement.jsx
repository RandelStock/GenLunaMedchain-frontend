// frontend/src/components/consultation/ProviderManagement.jsx
import React, { useState, useEffect } from 'react';
import { FaUserMd, FaUserNurse, FaEdit, FaEye, FaPlus, FaSearch } from 'react-icons/fa';
import ProviderProfile from './ProviderProfile.jsx';
import AddProviderForm from './AddProviderForm.jsx';
import API_BASE_URL from '../../config.js';

const API_URL = API_BASE_URL;

const ProviderManagement = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddProviderModal, setShowAddProviderModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/provider-profiles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setProviders(data.data);
      } else {
        throw new Error(data.message || 'Failed to load providers');
      }
    } catch (error) {
      console.error('Error loading providers:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProvider = (provider) => {
    setSelectedProvider(provider);
    setShowProfileModal(true);
  };

  const handleCloseModal = () => {
    setShowProfileModal(false);
    setSelectedProvider(null);
    loadProviders(); // Refresh the list
  };

  const handleCloseAddModal = () => {
    setShowAddProviderModal(false);
  };

  const handleAddProviderSuccess = (newProvider) => {
    setShowAddProviderModal(false);
    loadProviders(); // Refresh the list
  };

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || 
                       (filterRole === 'doctor' && provider.role === 'ADMIN') ||
                       (filterRole === 'nurse' && provider.role === 'MUNICIPAL_STAFF');
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && provider.is_active) ||
                         (filterStatus === 'inactive' && !provider.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaUserMd className="text-3xl text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Provider Management</h1>
                <p className="text-gray-600">Manage doctors and nurses profiles and availability</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddProviderModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg"
            >
              <FaPlus />
              Add New Provider
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Providers
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider Type
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Providers</option>
                <option value="doctor">Doctors</option>
                <option value="nurse">Nurses</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={loadProviders}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <FaSearch />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Providers List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredProviders.length === 0 ? (
            <div className="text-center py-12">
              <FaUserMd className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Providers Found</h3>
              <p className="text-gray-500">
                {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search criteria.'
                  : 'No providers are currently registered in the system.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Specialization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Barangay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Availability
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProviders.map((provider) => {
                    const primarySpecialization = provider.provider_specializations?.find(spec => spec.is_primary) || 
                                                 provider.provider_specializations?.[0];
                    const availableDays = provider.provider_availability?.filter(av => av.is_active).length || 0;
                    
                    return (
                      <tr key={provider.user_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {provider.role === 'ADMIN' ? (
                                <FaUserMd className="h-8 w-8 text-blue-600" />
                              ) : (
                                <FaUserNurse className="h-8 w-8 text-green-600" />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {provider.full_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {provider.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            provider.role === 'ADMIN'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {provider.role === 'ADMIN' ? 'Doctor' : 'Nurse'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {primarySpecialization ? (
                              <div>
                                <div className="font-medium">{primarySpecialization.specialization}</div>
                                {primarySpecialization.years_experience && (
                                  <div className="text-xs text-gray-500">
                                    {primarySpecialization.years_experience} years experience
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">Not specified</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {provider.assigned_barangay || 'Municipal'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            provider.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {provider.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">
                              {availableDays} days/week
                            </span>
                            {availableDays === 0 && (
                              <span className="text-red-500 text-xs">No schedule</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEditProvider(provider)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <FaEdit />
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Provider Profile Modal */}
        {showProfileModal && selectedProvider && (
          <ProviderProfile
            providerId={selectedProvider.user_id}
            onClose={handleCloseModal}
          />
        )}

        {/* Add Provider Modal */}
        {showAddProviderModal && (
          <AddProviderForm
            onSuccess={handleAddProviderSuccess}
            onCancel={handleCloseAddModal}
          />
        )}
      </div>
    </div>
  );
};

export default ProviderManagement;
