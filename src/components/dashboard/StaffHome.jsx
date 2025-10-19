// src/components/dashboard/StaffHome.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useReceiptCount } from '../receipts/ReceiptsTable';
import { useTransactionHistory } from '../../hooks/useTransactionHistory';
import MedicineList from '../medicine/MedicineList';
import {
  ReceiptsCard,
  TransactionHistoryCard,
  ConsultationCard,
  MedicineInventoryCard
} from './DashboardCards';

const StaffHome = () => {
  const receiptCount = useReceiptCount();
  const { getStats, contractConnected } = useTransactionHistory();

  // Get transaction stats
  const transactionStats = contractConnected ? getStats() : { total: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      <div className="p-8 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Staff Dashboard
          </h1>
          <p className="text-gray-600 text-lg">Your day-to-day operations at a glance</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ReceiptsCard receiptCount={receiptCount} />
          <TransactionHistoryCard transactionStats={transactionStats} />
          <ConsultationCard />
          {/* Keep the fourth slot balanced with a simple summary card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex flex-col justify-center">
            <div className="text-sm font-medium text-gray-600 mb-1">Blockchain Tx (recent)</div>
            <div className="text-2xl font-bold text-gray-900">{transactionStats.total || 0}</div>
          </div>
        </div>

        {/* Work Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Medicine Inventory */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Medicine Inventory</h2>
                <p className="text-sm text-gray-600">View inventory and stock status</p>
              </div>
            </div>
            <MedicineInventoryCard>
              <MedicineList />
            </MedicineInventoryCard>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/medicines/new"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 transition-colors group border border-blue-100"
              >
                <span className="text-sm font-medium text-gray-700">Add Medicine</span>
                <span className="text-blue-600 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                to="/releases/new"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-green-50 transition-colors group border border-green-100"
              >
                <span className="text-sm font-medium text-gray-700">Add Release</span>
                <span className="text-green-600 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                to="/removals/new"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-red-50 transition-colors group border border-red-100"
              >
                <span className="text-sm font-medium text-gray-700">Remove Stock</span>
                <span className="text-red-600 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                to="/stock-transactions"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-purple-50 transition-colors group border border-purple-100"
              >
                <span className="text-sm font-medium text-gray-700">Stock Transactions</span>
                <span className="text-purple-600 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                to="/consultation"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 transition-colors group border border-blue-100"
              >
                <span className="text-sm font-medium text-gray-700">Book Consultation</span>
                <span className="text-blue-600 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffHome;