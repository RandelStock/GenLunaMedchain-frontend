import { useState, useEffect } from 'react';
import { Pill, Link2, Database, Users, TrendingUp, Activity, Package, FileText } from 'lucide-react';
import api from '../../../api.js';

// Individual Card Components
export const MedicineReleasesCard = () => {
  const [data, setData] = useState({ total: 0, loading: true });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/releases');
        const releasesData = response.data?.data || [];
        setData({ total: releasesData.length, loading: false });
      } catch (error) {
        console.error('Error fetching medicine releases:', error);
        setData({ total: 0, loading: false });
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Pill className="w-5 h-5 text-blue-600" />
        </div>
        {data.loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900">
          {data.loading ? '...' : data.total.toLocaleString()}
        </p>
        <p className="text-sm font-medium text-gray-900">Medicine Releases</p>
        <p className="text-xs text-gray-700">Total: {data.total}</p>
      </div>
      <button className="mt-3 text-sm text-blue-700 hover:text-blue-800 font-semibold">
        View All Releases →
      </button>
    </div>
  );
};

export const BlockchainHistoryCard = () => {
  const [data, setData] = useState({ total: 0, onChain: 0, loading: true });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/blockchain/hashes');
        const hashes = response.data?.hashes || [];
        const onChainCount = hashes.filter(h => h.txHash).length;
        setData({ total: hashes.length, onChain: onChainCount, loading: false });
      } catch (error) {
        console.error('Error fetching blockchain history:', error);
        setData({ total: 0, onChain: 0, loading: false });
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Link2 className="w-5 h-5 text-purple-600" />
        </div>
        {data.loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900">
          {data.loading ? '...' : data.total.toLocaleString()}
        </p>
        <p className="text-sm font-medium text-gray-900">Blockchain History</p>
        <p className="text-xs text-gray-700">Total: {data.onChain} on-chain</p>
      </div>
      <button className="mt-3 text-sm text-purple-700 hover:text-purple-800 font-semibold">
        View Blockchain History →
      </button>
    </div>
  );
};

export const AuditLogsCard = () => {
  const [data, setData] = useState({ total: 0, loading: true });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/audit/stats');
        const total = response.data?.total || 0;
        setData({ total: total, loading: false });
      } catch (error) {
        console.error('Error fetching audit stats:', error);
        setData({ total: 0, loading: false });
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
          <Database className="w-5 h-5 text-orange-600" />
        </div>
        {data.loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-600 border-t-transparent"></div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900">
          {data.loading ? '...' : data.total.toLocaleString()}
        </p>
        <p className="text-sm font-medium text-gray-900">Database Audit</p>
        <p className="text-xs text-gray-700">Complete DB trail</p>
      </div>
      <button className="mt-3 text-sm text-orange-700 hover:text-orange-800 font-semibold">
        View Audit Logs →
      </button>
    </div>
  );
};

export const TotalStaffCard = () => {
  const [data, setData] = useState({ total: 0, loading: true });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/users/by-role/STAFF');
        const staffList = response.data || [];
        setData({ total: staffList.length, loading: false });
      } catch (error) {
        console.error('Error fetching staff:', error);
        setData({ total: 0, loading: false });
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <Users className="w-5 h-5 text-green-600" />
        </div>
        {data.loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900">
          {data.loading ? '...' : data.total.toLocaleString()}
        </p>
        <p className="text-sm font-medium text-gray-900">Total Staff</p>
        <p className="text-xs text-gray-700">Total: {data.total}</p>
      </div>
      <button className="mt-3 text-sm text-green-700 hover:text-green-800 font-semibold">
        Manage Staff →
      </button>
    </div>
  );
};

export const MedicinesCard = () => {
  const [data, setData] = useState({ total: 0, loading: true });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/medicines');
        const medicinesData = response.data?.data || [];
        setData({ total: medicinesData.length, loading: false });
      } catch (error) {
        console.error('Error fetching medicines:', error);
        setData({ total: 0, loading: false });
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
          <Package className="w-5 h-5 text-teal-600" />
        </div>
        {data.loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-600 border-t-transparent"></div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900">
          {data.loading ? '...' : data.total.toLocaleString()}
        </p>
        <p className="text-sm font-medium text-gray-900">Total Medicines</p>
        <p className="text-xs text-gray-700">Registered medicines</p>
      </div>
    </div>
  );
};

export const StocksCard = () => {
  const [data, setData] = useState({ total: 0, loading: true });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/stocks');
        const stocksData = response.data?.data || [];
        setData({ total: stocksData.length, loading: false });
      } catch (error) {
        console.error('Error fetching stocks:', error);
        setData({ total: 0, loading: false });
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-indigo-600" />
        </div>
        {data.loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900">
          {data.loading ? '...' : data.total.toLocaleString()}
        </p>
        <p className="text-sm font-medium text-gray-900">Stock Records</p>
        <p className="text-xs text-gray-700">All stock batches</p>
      </div>
    </div>
  );
};

export const ConsultationCard = () => {
  const [data, setData] = useState({ total: 0, loading: true });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/consultations');
        const consultationsData = response.data?.data || [];
        setData({ total: consultationsData.length, loading: false });
      } catch (error) {
        console.error('Error fetching consultations:', error);
        setData({ total: 0, loading: false });
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Activity className="w-5 h-5 text-purple-600" />
        </div>
        {data.loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900">
          {data.loading ? '...' : data.total.toLocaleString()}
        </p>
        <p className="text-sm font-medium text-gray-900">Consultations</p>
        <p className="text-xs text-gray-700">Total appointments</p>
      </div>
    </div>
  );
};

export const MedicineInventoryCard = () => {
  const [data, setData] = useState({ total: 0, lowStock: 0, loading: true });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/medicines');
        const medicinesData = response.data?.data || [];
        const lowStockCount = medicinesData.filter(m => m.quantity < 10).length;
        setData({ total: medicinesData.length, lowStock: lowStockCount, loading: false });
      } catch (error) {
        console.error('Error fetching medicine inventory:', error);
        setData({ total: 0, lowStock: 0, loading: false });
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
          <Package className="w-5 h-5 text-teal-600" />
        </div>
        {data.loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-600 border-t-transparent"></div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900">
          {data.loading ? '...' : data.total.toLocaleString()}
        </p>
        <p className="text-sm font-medium text-gray-900">Medicine Inventory</p>
        <p className="text-xs text-gray-700">{data.lowStock} low stock items</p>
      </div>
    </div>
  );
};

// Alias exports for compatibility with AdminHome.jsx
export const ReceiptsCard = StocksCard;
export const TransactionHistoryCard = BlockchainHistoryCard;
export const StaffCard = TotalStaffCard;

// Main Dashboard Component (combines all cards)
const DashboardCards = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">System Dashboard</h1>
          <p className="text-sm text-gray-700 mt-1">Overview of system statistics and activity</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MedicineReleasesCard />
          <BlockchainHistoryCard />
          <AuditLogsCard />
          <TotalStaffCard />
        </div>

        {/* Additional Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MedicinesCard />
          <StocksCard />
          
          {/* Quick Action Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-5 text-white hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">System Active</p>
              <p className="text-sm font-medium opacity-90">All services operational</p>
              <p className="text-xs opacity-75">Last updated: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Real-Time System Statistics</h3>
              <p className="text-xs text-blue-800 leading-relaxed">
                These statistics are fetched in real-time from your database and blockchain. The dashboard automatically 
                retrieves data from medicine releases, blockchain hashes, audit logs, staff records, medicines inventory, 
                and stock batches.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCards;