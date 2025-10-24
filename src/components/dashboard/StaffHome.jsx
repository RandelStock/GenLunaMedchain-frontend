// src/components/dashboard/StaffHome.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useReceiptCount } from '../receipts/ReceiptsTable';
import { useTransactionHistory } from '../../hooks/useTransactionHistory';
import MedicineList from '../medicine/MedicineList';
import { 
  FaPlus, 
  FaMinus, 
  FaChartLine, 
  FaUsers,
  FaCapsules,
  FaClipboardList,
  FaCalendarAlt,
  FaBoxes,
  FaUserMd,
  FaFileAlt,
  FaExchangeAlt,
  FaHistory
} from 'react-icons/fa';
import {
  ReceiptsCard,
  TransactionHistoryCard,
  ConsultationCard,
  MedicineInventoryCard
} from './DashboardCards';

const StaffHome = () => {
  const receiptCount = useReceiptCount();
  const { getStats, contractConnected } = useTransactionHistory();
  const [activeTab, setActiveTab] = useState('overview');

  const transactionStats = contractConnected ? getStats() : { total: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Enhanced Header Section */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Staff Dashboard
            </h1>
            <p className="text-sm text-gray-600">Welcome back! Your day-to-day operations at a glance</p>
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6 border border-gray-100">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FaChartLine className="text-base" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('medicines')}
              className={`px-6 py-4 text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'medicines'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FaCapsules className="text-base" />
              Medicines
            </button>
            <button
              onClick={() => setActiveTab('residents')}
              className={`px-6 py-4 text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'residents'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FaUsers className="text-base" />
              Residents
            </button>
            <button
              onClick={() => setActiveTab('consultations')}
              className={`px-6 py-4 text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'consultations'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FaCalendarAlt className="text-base" />
              Consultations
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-6 py-4 text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FaFileAlt className="text-base" />
              Reports
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <ReceiptsCard receiptCount={receiptCount} />
              <TransactionHistoryCard transactionStats={transactionStats} />
              <ConsultationCard />
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center hover:shadow-md transition-shadow">
                <div className="text-sm font-medium text-gray-600 mb-1">Blockchain Tx (recent)</div>
                <div className="text-2xl font-bold text-gray-900">{transactionStats.total || 0}</div>
              </div>
            </div>

            {/* Quick Actions - Enhanced */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-5">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <Link
                  to="/medicines/new"
                  className="group flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all border border-blue-200"
                >
                  <div className="bg-blue-600 text-white p-3 rounded-xl mb-2 group-hover:scale-110 transition-transform shadow-md">
                    <FaPlus className="text-xl" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Add Medicine</span>
                </Link>

                <Link
                  to="/stock"
                  className="group flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:shadow-md transition-all border border-purple-200"
                >
                  <div className="bg-purple-600 text-white p-3 rounded-xl mb-2 group-hover:scale-110 transition-transform shadow-md">
                    <FaBoxes className="text-xl" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Add Stock</span>
                </Link>

                <Link
                  to="/releases/new"
                  className="group flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:shadow-md transition-all border border-green-200"
                >
                  <div className="bg-green-600 text-white p-3 rounded-xl mb-2 group-hover:scale-110 transition-transform shadow-md">
                    <FaClipboardList className="text-xl" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Add Release</span>
                </Link>

                <Link
                  to="/removals/new"
                  className="group flex flex-col items-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl hover:shadow-md transition-all border border-red-200"
                >
                  <div className="bg-red-600 text-white p-3 rounded-xl mb-2 group-hover:scale-110 transition-transform shadow-md">
                    <FaMinus className="text-xl" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Remove Stock</span>
                </Link>

                <Link
                  to="/residents/new"
                  className="group flex flex-col items-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl hover:shadow-md transition-all border border-indigo-200"
                >
                  <div className="bg-indigo-600 text-white p-3 rounded-xl mb-2 group-hover:scale-110 transition-transform shadow-md">
                    <FaUsers className="text-xl" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Add Resident</span>
                </Link>

                <Link
                  to="/consultation"
                  className="group flex flex-col items-center p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl hover:shadow-md transition-all border border-teal-200"
                >
                  <div className="bg-teal-600 text-white p-3 rounded-xl mb-2 group-hover:scale-110 transition-transform shadow-md">
                    <FaUserMd className="text-xl" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Book Consultation</span>
                </Link>
              </div>
            </div>

            {/* Management Sections Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Medicine Management */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <FaCapsules className="text-xl text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Medicine Management</h3>
                </div>
                <div className="space-y-2">
                  <Link
                    to="/medicines"
                    className="block p-3 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium text-gray-900 border border-transparent hover:border-blue-200"
                  >
                    📋 View All Medicines
                  </Link>
                  <Link
                    to="/releases"
                    className="block p-3 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium text-gray-900 border border-transparent hover:border-blue-200"
                  >
                    📤 View All Releases
                  </Link>
                  <Link
                    to="/removals"
                    className="block p-3 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium text-gray-900 border border-transparent hover:border-blue-200"
                  >
                    🗑️ View Stock Removals
                  </Link>
                  <Link
                    to="/stock-transactions"
                    className="block p-3 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium text-gray-900 border border-transparent hover:border-blue-200"
                  >
                    📊 Stock History
                  </Link>
                </div>
              </div>

              {/* Resident Management */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-indigo-100 p-3 rounded-xl">
                    <FaUsers className="text-xl text-indigo-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Resident Management</h3>
                </div>
                <div className="space-y-2">
                  <Link
                    to="/residents"
                    className="block p-3 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium text-gray-900 border border-transparent hover:border-indigo-200"
                  >
                    👥 View Resident List
                  </Link>
                  <Link
                    to="/residents/dashboard"
                    className="block p-3 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium text-gray-900 border border-transparent hover:border-indigo-200"
                  >
                    📈 Barangay Statistics
                  </Link>
                  <Link
                    to="/provider-management"
                    className="block p-3 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium text-gray-900 border border-transparent hover:border-indigo-200"
                  >
                    👨‍⚕️ Provider Management
                  </Link>
                  <Link
                    to="/calendar"
                    className="block p-3 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium text-gray-900 border border-transparent hover:border-indigo-200"
                  >
                    📅 Schedule Calendar
                  </Link>
                </div>
              </div>

              {/* Consultation Services */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-purple-100 p-3 rounded-xl">
                    <FaCalendarAlt className="text-xl text-purple-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Consultation Services</h3>
                </div>
                <div className="space-y-2">
                  <Link
                    to="/consultation"
                    className="block p-3 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium text-gray-900 border border-transparent hover:border-purple-200"
                  >
                    📅 Book Consultation
                  </Link>
                  <Link
                    to="/consultations/calendar"
                    className="block p-3 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium text-gray-900 border border-transparent hover:border-purple-200"
                  >
                    📆 Consultation Calendar
                  </Link>
                  <Link
                    to="/consultations/statistics"
                    className="block p-3 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium text-gray-900 border border-transparent hover:border-purple-200"
                  >
                    📊 Statistics
                  </Link>
                  <Link
                    to="/calendar"
                    className="block p-3 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium text-gray-900 border border-transparent hover:border-purple-200"
                  >
                    📋 Schedule Overview
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Medicines Tab */}
        {activeTab === 'medicines' && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Medicine Inventory</h2>
                <p className="text-sm text-gray-600">Manage all medicines and stock levels</p>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/medicines/new"
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <FaPlus />
                  Add Medicine
                </Link>
                <Link
                  to="/stock"
                  className="bg-purple-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <FaBoxes />
                  Add Stock
                </Link>
              </div>
            </div>
            <MedicineList />
          </div>
        )}

        {/* Residents Tab */}
        {activeTab === 'residents' && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Resident Management</h2>
                <p className="text-sm text-gray-600">Manage resident records and information</p>
              </div>
              <Link
                to="/residents/new"
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <FaPlus />
                Add Resident
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Link
                to="/residents"
                className="group block p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all border border-blue-200"
              >
                <div className="bg-white p-3 rounded-xl inline-block mb-3 group-hover:scale-110 transition-transform shadow-sm">
                  <FaUsers className="text-2xl text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Resident Directory</h3>
                <p className="text-sm text-gray-600">View and manage all residents</p>
              </Link>

              <Link
                to="/residents/dashboard"
                className="group block p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:shadow-md transition-all border border-green-200"
              >
                <div className="bg-white p-3 rounded-xl inline-block mb-3 group-hover:scale-110 transition-transform shadow-sm">
                  <FaChartLine className="text-2xl text-green-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Barangay Statistics</h3>
                <p className="text-sm text-gray-600">View demographic data</p>
              </Link>

              <Link
                to="/provider-management"
                className="group block p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:shadow-md transition-all border border-purple-200"
              >
                <div className="bg-white p-3 rounded-xl inline-block mb-3 group-hover:scale-110 transition-transform shadow-sm">
                  <FaUserMd className="text-2xl text-purple-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Healthcare Providers</h3>
                <p className="text-sm text-gray-600">Manage doctors and staff</p>
              </Link>
            </div>
          </div>
        )}

        {/* Consultations Tab */}
        {activeTab === 'consultations' && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Telemedicine Consultations</h2>
              <p className="text-sm text-gray-600">Manage online consultations and appointments</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <Link
                to="/consultations/calendar"
                className="group block p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all border border-blue-200"
              >
                <div className="bg-white p-3 rounded-xl inline-block mb-3 group-hover:scale-110 transition-transform shadow-sm">
                  <FaCalendarAlt className="text-2xl text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Consultation Calendar</h3>
                <p className="text-sm text-gray-600">View and manage scheduled consultations</p>
              </Link>

              <Link
                to="/consultations/statistics"
                className="group block p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:shadow-md transition-all border border-green-200"
              >
                <div className="bg-white p-3 rounded-xl inline-block mb-3 group-hover:scale-110 transition-transform shadow-sm">
                  <FaChartLine className="text-2xl text-green-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Consultation Statistics</h3>
                <p className="text-sm text-gray-600">View analytics and reports</p>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
              <h4 className="text-base font-bold text-gray-900 mb-4">Today's Overview</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                  <div className="text-2xl font-bold text-blue-600 mb-1">0</div>
                  <div className="text-xs text-gray-600 font-medium">Scheduled</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                  <div className="text-2xl font-bold text-yellow-600 mb-1">0</div>
                  <div className="text-xs text-gray-600 font-medium">In Progress</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                  <div className="text-2xl font-bold text-green-600 mb-1">0</div>
                  <div className="text-xs text-gray-600 font-medium">Completed</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                  <div className="text-2xl font-bold text-red-600 mb-1">0</div>
                  <div className="text-xs text-gray-600 font-medium">Cancelled</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Reports & Analytics</h2>
                <p className="text-sm text-gray-600">Access comprehensive reports and data insights</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <Link
                  to="/stock-transactions"
                  className="group block p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all border border-blue-200"
                >
                  <div className="bg-white p-3 rounded-xl inline-block mb-3 group-hover:scale-110 transition-transform shadow-sm">
                    <FaBoxes className="text-2xl text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Stock Reports</h3>
                  <p className="text-sm text-gray-600">Inventory movements</p>
                </Link>

                <Link
                  to="/blockchain"
                  className="group block p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:shadow-md transition-all border border-purple-200"
                >
                  <div className="bg-white p-3 rounded-xl inline-block mb-3 group-hover:scale-110 transition-transform shadow-sm">
                    <FaExchangeAlt className="text-2xl text-purple-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Blockchain Records</h3>
                  <p className="text-sm text-gray-600">Immutable audit trail</p>
                </Link>

                <Link
                  to="/transaction-history"
                  className="group block p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl hover:shadow-md transition-all border border-yellow-200"
                >
                  <div className="bg-white p-3 rounded-xl inline-block mb-3 group-hover:scale-110 transition-transform shadow-sm">
                    <FaHistory className="text-2xl text-yellow-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Transaction History</h3>
                  <p className="text-sm text-gray-600">Complete transaction history</p>
                  <div className="mt-3 text-2xl font-bold text-yellow-600">{transactionStats.total}</div>
                </Link>

                <Link
                  to="/removals/history"
                  className="group block p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl hover:shadow-md transition-all border border-red-200"
                >
                  <div className="bg-white p-3 rounded-xl inline-block mb-3 group-hover:scale-110 transition-transform shadow-sm">
                    <FaMinus className="text-2xl text-red-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Removal History</h3>
                  <p className="text-sm text-gray-600">Stock removal records</p>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffHome;