// src/components/dashboard/DashboardCards.jsx
import React, { useState, useEffect } from 'react';
import { FaPills, FaHistory, FaVideo, FaReceipt, FaUserMd, FaChartLine, FaUsers, FaDatabase, FaLink } from 'react-icons/fa';
import { Link } from "react-router-dom";
import api from '../../../api.js';

export const ReceiptsCard = ({ receiptCount }) => {
  const [data, setData] = useState({ total: receiptCount || 0, loading: !receiptCount });

  useEffect(() => {
    if (!receiptCount) {
      const fetchData = async () => {
        try {
          const response = await api.get('/releases');
          const releasesData = response.data?.data || [];
          setData({ total: releasesData.length, loading: false });
        } catch (error) {
          console.error('Error fetching releases:', error);
          setData({ total: 0, loading: false });
        }
      };
      fetchData();
    }
  }, [receiptCount]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center mb-4">
        <div className="bg-blue-100 p-2 rounded-md mr-3">
          <FaReceipt className="text-blue-600" />
        </div>
        <span className="font-medium text-black">Medicine Releases</span>
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-md">
          {data.loading ? 'Loading...' : `Total: ${data.total}`}
        </div>
      </div>
      <Link to="/releases" className="text-sm text-blue-600 hover:text-blue-800">
        View All Releases
      </Link>
    </div>
  );
};

export const TransactionHistoryCard = ({ transactionStats }) => {
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
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center mb-4">
        <div className="bg-purple-100 p-2 rounded-md mr-3">
          <FaLink className="text-purple-600" />
        </div>
        <span className="font-medium text-black">Blockchain History</span>
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-md">
          {data.loading ? 'Loading...' : `Total: ${data.total}`}
        </div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        {data.loading ? 'Loading...' : `${data.onChain} on-chain`}
      </div>
      <Link to="/blockchain" className="text-sm text-blue-600 hover:text-blue-800">
        View Blockchain History
      </Link>
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
        setData({ total, loading: false });
      } catch (error) {
        console.error('Error fetching audit stats:', error);
        setData({ total: 0, loading: false });
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center mb-4">
        <div className="bg-orange-100 p-2 rounded-md mr-3">
          <FaDatabase className="text-orange-600" />
        </div>
        <span className="font-medium text-black">Database Audit</span>
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-md">
          {data.loading ? 'Loading...' : `Total: ${data.total}`}
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
};

export const ConsultationCard = ({ onScheduleConsultation }) => {
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
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center mb-4">
        <div className="bg-blue-100 p-2 rounded-md mr-3">
          <FaVideo className="text-blue-600" />
        </div>
        <span className="font-medium text-black">Telemedicine</span>
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-md">
          {data.loading ? 'Loading...' : `Total: ${data.total}`}
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
};

export const MedicineInventoryCard = ({ children }) => {
  const [data, setData] = useState({ total: 0, lowStock: 0, loading: true });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/medicines');
        const medicinesData = response.data?.data || [];
        const lowStockCount = medicinesData.filter(m => m.quantity < 10).length;
        setData({ total: medicinesData.length, lowStock: lowStockCount, loading: false });
      } catch (error) {
        console.error('Error fetching medicines:', error);
        setData({ total: 0, lowStock: 0, loading: false });
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white shadow-sm rounded-lg p-4 flex flex-col flex-grow">
      <h2 className="text-lg font-semibold mb-4 flex items-center text-black">
        <FaPills className="text-orange-500 mr-2" />
        Medicine Inventory
        {!data.loading && (
          <span className="ml-auto text-sm font-normal text-gray-600">
            {data.total} items {data.lowStock > 0 && `(${data.lowStock} low stock)`}
          </span>
        )}
      </h2>
      <div className="max-h-96 flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

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

export const StaffCard = ({ staffCount, loading = false }) => {
  const [data, setData] = useState({ total: staffCount || 0, loading: loading || !staffCount });

  useEffect(() => {
    if (!staffCount) {
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
    }
  }, [staffCount]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center mb-4">
        <div className="bg-green-100 p-2 rounded-md mr-3">
          <FaUsers className="text-green-600" />
        </div>
        <span className="font-medium text-black">Total Staff</span>
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-md">
          {data.loading ? (
            <div className="flex items-center space-x-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-green-800"></div>
              <span>Loading...</span>
            </div>
          ) : (
            `Total: ${data.total}`
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
};

export const PatientAppointmentCard = () => {
  const [data, setData] = useState({ total: 0, upcoming: 0, loading: true });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/consultations/patient');
        const appointmentsData = response.data?.data || [];
        const upcomingCount = appointmentsData.filter(a => a.status === 'scheduled').length;
        setData({ total: appointmentsData.length, upcoming: upcomingCount, loading: false });
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setData({ total: 0, upcoming: 0, loading: false });
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center mb-4">
        <div className="bg-green-100 p-2 rounded-md mr-3">
          <FaUserMd className="text-green-600" />
        </div>
        <span className="font-medium text-black">My Appointments</span>
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-md">
          {data.loading ? 'Loading...' : `Upcoming: ${data.upcoming}`}
        </div>
      </div>
      <Link to="/appointments" className="text-sm text-blue-600 hover:text-blue-800">
        View Schedule
      </Link>
    </div>
  );
};

export const PatientPrescriptionCard = () => {
  const [data, setData] = useState({ total: 0, active: 0, loading: true });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/prescriptions/patient');
        const prescriptionsData = response.data?.data || [];
        const activeCount = prescriptionsData.filter(p => p.status === 'active').length;
        setData({ total: prescriptionsData.length, active: activeCount, loading: false });
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
        setData({ total: 0, active: 0, loading: false });
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center mb-4">
        <div className="bg-indigo-100 p-2 rounded-md mr-3">
          <FaPills className="text-indigo-600" />
        </div>
        <span className="font-medium text-black">My Prescriptions</span>
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded-md">
          {data.loading ? 'Loading...' : `Active: ${data.active}`}
        </div>
      </div>
      <Link to="/prescriptions" className="text-sm text-blue-600 hover:text-blue-800">
        View Prescriptions
      </Link>
    </div>
  );
};