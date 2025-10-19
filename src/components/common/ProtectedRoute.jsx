// src/components/common/ProtectedRoute.jsx
import React from 'react';
import { useRole } from '../auth/RoleProvider';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole, requireWallet = false }) => {
  const { userRole, isWalletConnected } = useRole();

  // If wallet is required but not connected, redirect to home
  if (requireWallet && !isWalletConnected) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Wallet Required</h2>
          <p className="text-gray-600 mb-4">
            Please connect your wallet to access this feature.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Check if user has required role
  if (requiredRole && userRole !== requiredRole) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Required role: {requiredRole} | Your role: {userRole}
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;