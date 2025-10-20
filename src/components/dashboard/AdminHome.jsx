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
  FaBoxes,
  FaUserMd,
  FaShieldAlt
} from 'react-icons/fa';

import {
  ReceiptsCard,
  TransactionHistoryCard,
  AuditLogsCard,
  StaffCard
} from './DashboardCards';

import ConsultationNotifications from '../consultation/ConsultationNotifications';

const AdminHome = () => {
  const receiptCount = useReceiptCount();
  const { getStats, contractConnected } = useTransactionHistory();
  const [activeTab, setActiveTab] = useState('overview');

  const transactionStats = contractConnected ? getStats() : { total: 0 };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Header Section - Simplified */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-600">Manage your health center operations</p>
          </div>
          <ConsultationNotifications />
        </div>

        {/* Tab Navigation - Cleaner Design */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-semibold transition-colors flex items-center gap-2 ${
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
              className={`px-6 py-3 text-sm font-semibold transition-colors flex items-center gap-2 ${
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
              className={`px-6 py-3 text-sm font-semibold transition-colors flex items-center gap-2 ${
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
              className={`px-6 py-3 text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'consultations'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FaCalendarAlt className="text-base" />
              Consultations
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid - Simplified */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ReceiptsCard receiptCount={receiptCount} />
              <TransactionHistoryCard transactionStats={transactionStats} />
              <AuditLogsCard />
              <StaffCard />
            </div>

            {/* Quick Actions - More Spacious */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <Link
                  to="/medicines/new"
                  className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                >
                  <div className="bg-blue-600 text-white p-3 rounded-lg mb-2">
                    <FaPlus className="text-xl" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Add Medicine</span>
                </Link>

                <Link
                  to="/stock"
                  className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-100"
                >
                  <div className="bg-purple-600 text-white p-3 rounded-lg mb-2">
                    <FaBoxes className="text-xl" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Add Stock</span>
                </Link>

                <Link
                  to="/releases/new"
                  className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-100"
                >
                  <div className="bg-green-600 text-white p-3 rounded-lg mb-2">
                    <FaClipboardList className="text-xl" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Add Release</span>
                </Link>

                <Link
                  to="/removals/new"
                  className="flex flex-col items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                >
                  <div className="bg-red-600 text-white p-3 rounded-lg mb-2">
                    <FaMinus className="text-xl" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Remove Stock</span>
                </Link>

                <Link
                  to="/residents/new"
                  className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100"
                >
                  <div className="bg-indigo-600 text-white p-3 rounded-lg mb-2">
                    <FaUsers className="text-xl" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Add Resident</span>
                </Link>
              </div>
            </div>

            {/* Management Sections - Cleaner Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Medicine Management */}
              <div className="bg-white rounded-lg shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <FaCapsules className="text-xl text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Medicine Management</h3>
                </div>
                <div className="space-y-2">
                  <Link
                    to="/medicines"
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-900"
                  >
                    View All Medicines
                  </Link>
                  <Link
                    to="/releases"
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-900"
                  >
                    View All Releases
                  </Link>
                  <Link
                    to="/removals"
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-900"
                  >
                    View Stock Removals
                  </Link>
                  <Link
                    to="/stock-transactions"
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-900"
                  >
                    Stock History
                  </Link>
                </div>
              </div>

              {/* Resident Management */}
              <div className="bg-white rounded-lg shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <FaUsers className="text-xl text-indigo-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Resident Management</h3>
                </div>
                <div className="space-y-2">
                  <Link
                    to="/residents"
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-900"
                  >
                    View Resident List
                  </Link>
                  <Link
                    to="/residents/dashboard"
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-900"
                  >
                    Barangay Statistics
                  </Link>
                  <Link
                    to="/provider-management"
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-900"
                  >
                    Provider Management
                  </Link>
                </div>
              </div>

              {/* System & Audit */}
              <div className="bg-white rounded-lg shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <FaShieldAlt className="text-xl text-gray-700" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">System & Audit</h3>
                </div>
                <div className="space-y-2">
                  <Link
                    to="/blockchain"
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-900"
                  >
                    Blockchain History
                  </Link>
                  <Link
                    to="/transaction-history"
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-900"
                  >
                    Transaction History
                  </Link>
                  <Link
                    to="/audit-logs"
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-900"
                  >
                    Audit Logs
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Medicines Tab */}
        {activeTab === 'medicines' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Medicine Inventory</h2>
                <p className="text-sm text-gray-600">Manage all medicines and stock levels</p>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/medicines/new"
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FaPlus />
                  Add Medicine
                </Link>
                <Link
                  to="/stock"
                  className="bg-purple-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
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
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Resident Management</h2>
                <p className="text-sm text-gray-600">Manage resident records and information</p>
              </div>
              <Link
                to="/residents/new"
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FaPlus />
                Add Resident
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/residents"
                className="block p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
              >
                <div className="bg-white p-3 rounded-lg inline-block mb-3">
                  <FaUsers className="text-2xl text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Resident Directory</h3>
                <p className="text-sm text-gray-600">View and manage all residents</p>
              </Link>

              <Link
                to="/residents/dashboard"
                className="block p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-100"
              >
                <div className="bg-white p-3 rounded-lg inline-block mb-3">
                  <FaChartLine className="text-2xl text-green-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Barangay Statistics</h3>
                <p className="text-sm text-gray-600">View demographic data</p>
              </Link>

              <Link
                to="/provider-management"
                className="block p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-100"
              >
                <div className="bg-white p-3 rounded-lg inline-block mb-3">
                  <FaUserMd className="text-2xl text-purple-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Healthcare Providers</h3>
                <p className="text-sm text-gray-600">Manage doctors and staff</p>
              </Link>
            </div>
          </div>
        )}

        {/* Consultations Tab - Email Test Removed */}
        {activeTab === 'consultations' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Telemedicine Consultations</h2>
              <p className="text-sm text-gray-600">Manage online consultations and appointments</p>
            </div>

            {/* Only 2 Cards Now */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Link
                to="/consultations/calendar"
                className="block p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
              >
                <div className="bg-white p-3 rounded-lg inline-block mb-3">
                  <FaCalendarAlt className="text-2xl text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Consultation Calendar</h3>
                <p className="text-sm text-gray-600">View and manage scheduled consultations</p>
              </Link>

              <Link
                to="/consultations/statistics"
                className="block p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-100"
              >
                <div className="bg-white p-3 rounded-lg inline-block mb-3">
                  <FaChartLine className="text-2xl text-green-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Consultation Statistics</h3>
                <p className="text-sm text-gray-600">View analytics and reports</p>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h4 className="text-base font-bold text-gray-900 mb-4">Today's Overview</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">0</div>
                  <div className="text-xs text-gray-600 font-medium">Scheduled</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600 mb-1">0</div>
                  <div className="text-xs text-gray-600 font-medium">In Progress</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">0</div>
                  <div className="text-xs text-gray-600 font-medium">Completed</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600 mb-1">0</div>
                  <div className="text-xs text-gray-600 font-medium">Cancelled</div>
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