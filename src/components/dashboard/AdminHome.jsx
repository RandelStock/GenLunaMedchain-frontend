// src/components/dashboard/AdminHome.jsx
import React, { useState } from 'react';
import { useReceiptCount } from '../receipts/ReceiptsTable';
import { useTransactionHistory } from '../../hooks/useTransactionHistory';
import MedicineList from '../medicine/MedicineList';
import { Link } from "react-router-dom";
import { 
  FaPlus, 
  FaMinus, 
  FaChartLine, 
  FaUsers,
  FaCapsules,
  FaClipboardList,
  FaCalendarAlt,
  FaVideo,
  FaBoxes,
  FaExchangeAlt,
  FaHistory,
  FaArrowRight,
  FaUserMd
} from 'react-icons/fa';

import {
  ReceiptsCard,
  TransactionHistoryCard,
  AuditLogsCard,
  ConsultationCard,
  MedicineInventoryCard,
  StaffCard
} from './DashboardCards';

const AdminHome = () => {
  const receiptCount = useReceiptCount();
  const { getStats, contractConnected } = useTransactionHistory();
  const [activeTab, setActiveTab] = useState('overview');

  const transactionStats = contractConnected ? getStats() : { total: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      <div className="p-8 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 text-lg">Complete overview of your health center operations</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-8 border border-gray-100">
          <div className="flex flex-wrap border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-8 py-4 text-sm font-semibold transition-all flex items-center space-x-2 ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FaChartLine />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('medicines')}
              className={`px-8 py-4 text-sm font-semibold transition-all flex items-center space-x-2 ${
                activeTab === 'medicines'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FaCapsules />
              <span>Medicines</span>
            </button>
            <button
              onClick={() => setActiveTab('residents')}
              className={`px-8 py-4 text-sm font-semibold transition-all flex items-center space-x-2 ${
                activeTab === 'residents'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FaUsers />
              <span>Residents</span>
            </button>
            <button
              onClick={() => setActiveTab('consultations')}
              className={`px-8 py-4 text-sm font-semibold transition-all flex items-center space-x-2 ${
                activeTab === 'consultations'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FaVideo />
              <span>Consultations</span>
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ReceiptsCard receiptCount={receiptCount} />
              <TransactionHistoryCard transactionStats={transactionStats} />
              <AuditLogsCard />
              <StaffCard />
            </div>

            {/* Quick Actions Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Quick Actions</h3>
                <div className="h-1 flex-1 bg-gradient-to-r from-blue-500 to-transparent ml-6 rounded-full"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Link
                  to="/medicines/new"
                  className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all shadow-sm hover:shadow-md group border border-blue-200"
                >
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl mb-3 group-hover:scale-110 transition-transform shadow-lg">
                    <FaPlus className="text-2xl" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Add Medicine</span>
                  <span className="text-xs text-gray-600 mt-1">New inventory item</span>
                </Link>

                <Link
                  to="/stock"
                  className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all shadow-sm hover:shadow-md group border border-purple-200"
                >
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl mb-3 group-hover:scale-110 transition-transform shadow-lg">
                    <FaBoxes className="text-2xl" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Add Stock</span>
                  <span className="text-xs text-gray-600 mt-1">Replenish inventory</span>
                </Link>

                <Link
                  to="/releases/new"
                  className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all shadow-sm hover:shadow-md group border border-green-200"
                >
                  <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl mb-3 group-hover:scale-110 transition-transform shadow-lg">
                    <FaClipboardList className="text-2xl" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Add Release</span>
                  <span className="text-xs text-gray-600 mt-1">Dispense medicine</span>
                </Link>

                <Link
                  to="/removals/new"
                  className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl hover:from-red-100 hover:to-red-200 transition-all shadow-sm hover:shadow-md group border border-red-200"
                >
                  <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-xl mb-3 group-hover:scale-110 transition-transform shadow-lg">
                    <FaMinus className="text-2xl" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Remove Stock</span>
                  <span className="text-xs text-gray-600 mt-1">Expired/damaged</span>
                </Link>

                <Link
                  to="/residents/new"
                  className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl hover:from-indigo-100 hover:to-indigo-200 transition-all shadow-sm hover:shadow-md group border border-indigo-200"
                >
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-4 rounded-xl mb-3 group-hover:scale-110 transition-transform shadow-lg">
                    <FaUsers className="text-2xl" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Add Resident</span>
                  <span className="text-xs text-gray-600 mt-1">Register new</span>
                </Link>
              </div>
            </div>

            {/* Management Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Medicine Management */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-5">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <FaCapsules className="text-2xl text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 ml-3">Medicine Management</h3>
                </div>
                <div className="space-y-3">
                  <Link
                    to="/medicines"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 transition-colors group"
                  >
                    <span className="text-sm font-medium text-gray-700">View All Medicines</span>
                    <FaArrowRight className="text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/releases"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-green-50 transition-colors group"
                  >
                    <span className="text-sm font-medium text-gray-700">View All Releases</span>
                    <FaArrowRight className="text-green-600 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/removals"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-red-50 transition-colors group"
                  >
                    <span className="text-sm font-medium text-gray-700">View Stock Removals</span>
                    <FaArrowRight className="text-red-600 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/stock-transactions"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-purple-50 transition-colors group"
                  >
                    <span className="text-sm font-medium text-gray-700">Stock Transaction History</span>
                    <FaArrowRight className="text-purple-600 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Resident Management */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-5">
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <FaUsers className="text-2xl text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 ml-3">Resident Management</h3>
                </div>
                <div className="space-y-3">
                  <Link
                    to="/residents"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-indigo-50 transition-colors group"
                  >
                    <span className="text-sm font-medium text-gray-700">View Resident List</span>
                    <FaArrowRight className="text-indigo-600 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/residents/dashboard"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-indigo-50 transition-colors group"
                  >
                    <span className="text-sm font-medium text-gray-700">Barangay Statistics</span>
                    <FaArrowRight className="text-indigo-600 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/provider-management"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-indigo-50 transition-colors group"
                  >
                    <span className="text-sm font-medium text-gray-700">Provider Management</span>
                    <FaArrowRight className="text-indigo-600 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* System & Audit */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-5">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <FaHistory className="text-2xl text-gray-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 ml-3">System & Audit</h3>
                </div>
                <div className="space-y-3">
                  <Link
                    to="/blockchain"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-sm font-medium text-gray-700">Blockchain History</span>
                    <FaArrowRight className="text-gray-600 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/transaction-history"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-sm font-medium text-gray-700">Transaction History</span>
                    <FaArrowRight className="text-gray-600 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/audit-logs"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-sm font-medium text-gray-700">Audit Logs</span>
                    <FaArrowRight className="text-gray-600 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Medicines Tab */}
        {activeTab === 'medicines' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
              <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Medicine Inventory</h2>
                  <p className="text-sm text-gray-600">Manage all medicines and stock levels</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/medicines/new"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm px-5 py-2.5 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center shadow-md hover:shadow-lg"
                  >
                    <FaPlus className="mr-2" />
                    Add Medicine
                  </Link>
                  <Link
                    to="/stock"
                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm px-5 py-2.5 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all flex items-center shadow-md hover:shadow-lg"
                  >
                    <FaBoxes className="mr-2" />
                    Add Stock
                  </Link>
                  <Link
                    to="/releases/new"
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white text-sm px-5 py-2.5 rounded-lg hover:from-green-600 hover:to-green-700 transition-all flex items-center shadow-md hover:shadow-lg"
                  >
                    <FaPlus className="mr-2" />
                    Add Release
                  </Link>
                  <Link
                    to="/removals/new"
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white text-sm px-5 py-2.5 rounded-lg hover:from-red-600 hover:to-red-700 transition-all flex items-center shadow-md hover:shadow-lg"
                  >
                    <FaMinus className="mr-2" />
                    Remove Stock
                  </Link>
                </div>
              </div>
              <MedicineList />
            </div>
          </div>
        )}

        {/* Residents Tab */}
        {activeTab === 'residents' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Resident Management</h2>
                  <p className="text-sm text-gray-600">Manage resident records and information</p>
                </div>
                <Link
                  to="/residents/new"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm px-5 py-2.5 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center shadow-md hover:shadow-lg"
                >
                  <FaPlus className="mr-2" />
                  Add Resident
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link
                  to="/residents"
                  className="block p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all shadow-md hover:shadow-xl border border-blue-200 group"
                >
                  <div className="bg-white p-4 rounded-xl inline-block mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                    <FaUsers className="text-4xl text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Resident Directory</h3>
                  <p className="text-sm text-gray-600">View and manage all registered residents</p>
                </Link>

                <Link
                  to="/residents/dashboard"
                  className="block p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all shadow-md hover:shadow-xl border border-green-200 group"
                >
                  <div className="bg-white p-4 rounded-xl inline-block mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                    <FaChartLine className="text-4xl text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Barangay Statistics</h3>
                  <p className="text-sm text-gray-600">View demographic data by barangay</p>
                </Link>

                <Link
                  to="/provider-management"
                  className="block p-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all shadow-md hover:shadow-xl border border-purple-200 group"
                >
                  <div className="bg-white p-4 rounded-xl inline-block mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                    <FaUserMd className="text-4xl text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Healthcare Providers</h3>
                  <p className="text-sm text-gray-600">Manage doctors and healthcare staff</p>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Consultations Tab */}
        {activeTab === 'consultations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Telemedicine Consultations</h2>
                  <p className="text-sm text-gray-600">Manage online consultations and appointments</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Link
                  to="/consultations/calendar"
                  className="block p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all shadow-md hover:shadow-xl border border-blue-200 group"
                >
                  <div className="bg-white p-4 rounded-xl inline-block mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                    <FaCalendarAlt className="text-4xl text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Consultation Calendar</h3>
                  <p className="text-sm text-gray-600">View and manage scheduled consultations</p>
                </Link>

                <Link
                  to="/consultations/statistics"
                  className="block p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all shadow-md hover:shadow-xl border border-green-200 group"
                >
                  <div className="bg-white p-4 rounded-xl inline-block mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                    <FaChartLine className="text-4xl text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Consultation Statistics</h3>
                  <p className="text-sm text-gray-600">View consultation analytics and reports</p>
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-5">Today's Overview</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-3xl font-bold text-blue-600 mb-1">0</div>
                    <div className="text-sm text-gray-600 font-medium">Scheduled</div>
                  </div>
                  <div className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-3xl font-bold text-yellow-600 mb-1">0</div>
                    <div className="text-sm text-gray-600 font-medium">In Progress</div>
                  </div>
                  <div className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-3xl font-bold text-green-600 mb-1">0</div>
                    <div className="text-sm text-gray-600 font-medium">Completed</div>
                  </div>
                  <div className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-3xl font-bold text-red-600 mb-1">0</div>
                    <div className="text-sm text-gray-600 font-medium">Cancelled</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHome;