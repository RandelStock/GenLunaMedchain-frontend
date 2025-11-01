// src/components/dashboard/DashboardCards.jsx
import React from 'react';
import { FaPills, FaHistory, FaVideo, FaReceipt, FaUserMd, FaChartLine, FaUsers, FaDatabase, FaLink } from 'react-icons/fa';
import { Link } from "react-router-dom";

export const ReceiptsCard = ({ receiptCount }) => (
  <div className="bg-white rounded-lg shadow-sm p-4">
    <div className="flex items-center mb-4">
      <div className="bg-blue-100 p-2 rounded-md mr-3">
        <FaReceipt className="text-blue-600" />
      </div>
      <span className="font-medium text-black">Medicine Releases</span>
    </div>
    <div className="flex items-center justify-between mb-3">
      <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-md">
        Total: {receiptCount}
      </div>
    </div>
    <Link to="/releases" className="text-sm text-blue-600 hover:text-blue-800">
      View All Releases
    </Link>
  </div>
);

// Blockchain Transaction History Card
export const TransactionHistoryCard = ({ transactionStats }) => (
  <div className="bg-white rounded-lg shadow-sm p-4">
    <div className="flex items-center mb-4">
      <div className="bg-purple-100 p-2 rounded-md mr-3">
        <FaLink className="text-purple-600" />
      </div>
      <span className="font-medium text-black">Blockchain History</span>
    </div>
    <div className="flex items-center justify-between mb-3">
      <div className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-md">
        Total: {transactionStats.total} on-chain
      </div>
    </div>
    <div className="text-xs text-gray-600 mb-2">
      Immutable blockchain audit trail
    </div>
    <Link to="/transaction-history" className="text-sm text-blue-600 hover:text-blue-800">
      View Blockchain History
    </Link>
  </div>
);

// Database Audit Logs Card
export const AuditLogsCard = () => (
  <div className="bg-white rounded-lg shadow-sm p-4">
    <div className="flex items-center mb-4">
      <div className="bg-orange-100 p-2 rounded-md mr-3">
        <FaDatabase className="text-orange-600" />
      </div>
      <span className="font-medium text-black">Database Audit</span>
    </div>
    <div className="flex items-center justify-between mb-3">
      <div className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-md">
        Complete DB trail
      </div>
    </div>
    <div className="text-xs text-gray-600 mb-2">
      Database operation audit logs
    </div>
    <Link to="/audit-logs/all" className="text-sm text-blue-600 hover:text-blue-800">
      View Audit Logs
    </Link>
  </div>
);

export const ConsultationCard = ({ onScheduleConsultation }) => (
  <div className="bg-white rounded-lg shadow-sm p-4">
    <div className="flex items-center mb-4">
      <div className="bg-blue-100 p-2 rounded-md mr-3">
        <FaVideo className="text-blue-600" />
      </div>
      <span className="font-medium text-black">Telemedicine</span>
    </div>
    <div className="flex items-center justify-between mb-3">
      <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-md">
        Available 24/7
      </div>
    </div>
    <div className="space-y-2">
      <button 
        onClick={onScheduleConsultation}
        className="w-full text-sm bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        Schedule Consultation
      </button>
      <p className="text-xs text-gray-600 text-center">
        Book online consultation with RHU doctors/nurses
      </p>
    </div>
  </div>
);

export const MedicineInventoryCard = ({ children }) => (
  <div className="bg-white shadow-sm rounded-lg p-4 flex flex-col flex-grow">
    <h2 className="text-lg font-semibold mb-4 flex items-center text-black">
      <FaPills className="text-orange-500 mr-2" />
      Medicine Inventory
    </h2>
    <div className="max-h-96 flex-1 overflow-y-auto">
      {children}
    </div>
  </div>
);

export const AdminStatsCard = ({ title, count, icon: Icon, color = "blue" }) => (
  <div className="bg-white rounded-lg shadow-sm p-4">
    <div className="flex items-center mb-4">
      <div className={`bg-${color}-100 p-2 rounded-md mr-3`}>
        <Icon className={`text-${color}-600`} />
      </div>
      <span className="font-medium text-black">{title}</span>
    </div>
    <div className="flex items-center justify-between mb-3">
      <div className={`bg-${color}-100 text-${color}-800 text-xs font-medium px-2 py-1 rounded-md`}>
        Total: {count}
      </div>
    </div>
  </div>
);

// Staff Card Component
export const StaffCard = ({ staffCount, loading = false }) => (
  <div className="bg-white rounded-lg shadow-sm p-4">
    <div className="flex items-center mb-4">
      <div className="bg-green-100 p-2 rounded-md mr-3">
        <FaUsers className="text-green-600" />
      </div>
      <span className="font-medium text-black">Total Staff</span>
    </div>
    <div className="flex items-center justify-between mb-3">
      <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-md">
        {loading ? (
          <div className="flex items-center space-x-1">
            <div className="animate-spin rounded-full h-3 w-3 border-b border-green-800"></div>
            <span>Loading...</span>
          </div>
        ) : (
          `Total: ${staffCount || 0}`
        )}
      </div>
    </div>
    <div className="text-xs text-gray-600 mb-2">
      Active staff members with blockchain access
    </div>
    <Link to="/dashboard" className="text-sm text-blue-600 hover:text-blue-800">
      Manage Staff
    </Link>
  </div>
);

export const PatientAppointmentCard = () => (
  <div className="bg-white rounded-lg shadow-sm p-4">
    <div className="flex items-center mb-4">
      <div className="bg-green-100 p-2 rounded-md mr-3">
        <FaUserMd className="text-green-600" />
      </div>
      <span className="font-medium text-black">My Appointments</span>
    </div>
    <div className="flex items-center justify-between mb-3">
      <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-md">
        Upcoming: 0
      </div>
    </div>
    <Link to="/appointments" className="text-sm text-blue-600 hover:text-blue-800">
      View Schedule
    </Link>
  </div>
);

export const PatientPrescriptionCard = () => (
  <div className="bg-white rounded-lg shadow-sm p-4">
    <div className="flex items-center mb-4">
      <div className="bg-indigo-100 p-2 rounded-md mr-3">
        <FaPills className="text-indigo-600" />
      </div>
      <span className="font-medium text-black">My Prescriptions</span>
    </div>
    <div className="flex items-center justify-between mb-3">
      <div className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded-md">
        Active: 0
      </div>
    </div>
    <Link to="/prescriptions" className="text-sm text-blue-600 hover:text-blue-800">
      View Prescriptions
    </Link>
  </div>
);
