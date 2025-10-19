import React from 'react';
import { FaPills, FaHistory, FaVideo, FaReceipt } from 'react-icons/fa';
import MedicineList from './MedicineList';
import { Link } from "react-router-dom";
import { useReceiptCount } from './ReceiptsTable';
import { useTransactionHistory } from '../hooks/useTransactionHistory';

const Home = () => {
    const receiptCount = useReceiptCount();
    const { getStats, contractConnected } = useTransactionHistory();
    
    // Get transaction stats
    const transactionStats = contractConnected ? getStats() : { total: 0 };

    return (
        <div className="min-h-screen bg-gray-100">
        {/* Dashboard Content */}
        <div className="p-4">
            {/* Cards Row (Dashboard Widgets) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Receipts Card */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-2 rounded-md mr-3">
                    <FaReceipt className="text-blue-600" />
                </div>
                <span className="font-medium text-black">Staff Receipts</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-md">
                    Receipts: {receiptCount} {/* ✅ Dynamically updates */}
                </div>
                </div>
                <Link to="/receipts" className="text-sm text-blue-600 hover:text-blue-800">
                View Details
                </Link>
            </div>
            
            {/* History of Transactions Card - ENHANCED */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-2 rounded-md mr-3">
                    <FaHistory className="text-purple-600" />
                </div>
                <span className="font-medium text-black">Transaction History</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                <div className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-md">
                    Total: {transactionStats.total} transactions
                </div>
                </div>
                <div className="text-xs text-gray-600 mb-2">
                    Live blockchain audit trail
                </div>
                <Link to="/transaction-history" className="text-sm text-blue-600 hover:text-blue-800">
                    View Full History
                </Link>
            </div>
            
            {/* Consultation Card */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-2 rounded-md mr-3">
                    <FaVideo className="text-blue-600" />
                </div>
                <span className="font-medium text-black">Consultation</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                <div className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-md">
                    Ongoing: 0
                </div>
                </div>
                    <Link to="/consultation" className="text-sm text-blue-600 hover:text-blue-800">
                    Start Consultation
                    </Link>
                </div>
            </div>
            
            {/* Medicine Inventory List - Constrained Height */}
            <div className="bg-white shadow-sm rounded-lg p-4 flex flex-col flex-grow">
            <h2 className="text-lg font-semibold mb-4 flex items-center text-black">
                <FaPills className="text-orange-500 mr-2 " />
                Medicine Inventory
            </h2>
            <div className="max-h-96 flex-1 overflow-y-auto">
                <MedicineList />
            </div>
            </div>
        </div>
        </div>
    );
};

export default Home;