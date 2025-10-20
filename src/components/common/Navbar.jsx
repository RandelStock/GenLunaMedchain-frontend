// src/components/common/Navbar.jsx
import React from "react";
import { useRole } from "../auth/RoleProvider";
import { FaWallet, FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

const Navbar = () => {
  const { userAddress, isWalletConnected, userRole, connectWallet, disconnectWallet } = useRole();

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
      {/* Left side - Page title or breadcrumbs could go here */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {userRole && `${userRole} Panel`}
        </h2>
      </div>

      {/* Right side - User info and wallet */}
      <div className="flex items-center gap-3">
        {isWalletConnected ? (
          <>
            {/* User Role Badge */}
            <div className="bg-blue-50 px-3 py-1.5 rounded-md border border-blue-200">
              <span className="text-xs font-semibold text-blue-700">{userRole}</span>
            </div>

            {/* Wallet Address */}
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
              <FaWallet className="text-sm text-gray-700" />
              <span className="text-sm font-medium text-gray-900">{formatAddress(userAddress)}</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>

            {/* Profile Link */}
            <Link
              to="/profile"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <FaUserCircle className="text-lg text-gray-700" />
              <span className="text-sm font-medium text-gray-900">Profile</span>
            </Link>

            {/* Disconnect Button */}
            <button
              onClick={disconnectWallet}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors border border-red-200 text-sm font-medium"
            >
              <FaSignOutAlt className="text-sm" />
              Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={connectWallet}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-semibold"
          >
            <FaWallet className="text-sm" />
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;