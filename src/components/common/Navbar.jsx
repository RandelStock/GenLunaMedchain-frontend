// src/components/common/Navbar.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  useConnect,
  useDisconnect,
  useAddress,
  metamaskWallet,
} from "@thirdweb-dev/react";
import { FaWallet, FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import { useRole } from "../auth/RoleProvider";
import api from "../../../api";

const Navbar = () => {
  const connect = useConnect();
  const disconnect = useDisconnect();
  const address = useAddress();
  const metamask = metamaskWallet();
  const { userRole } = useRole();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchMe = async () => {
      try {
        const { data } = await api.get("/users/me");
        if (mounted) setProfile(data?.user || null);
      } catch (_) {
        if (mounted) setProfile(null);
      }
    };
    if (address) {
      fetchMe();
    }
    return () => {
      mounted = false;
    };
  }, [address]);

  const handleConnect = async () => {
    try {
      await connect(metamask);
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  };

  const handleDisconnect = () => {
    if (window.confirm("Are you sure you want to disconnect your wallet?")) {
      disconnect();
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
      {/* Left side - Page title or breadcrumbs */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {userRole && `${userRole} Panel`}
        </h2>
      </div>

      {/* Right side - User info and wallet */}
      <div className="flex items-center gap-3">
        {address ? (
          <>
            {/* User Role Badge */}
            <div className="bg-blue-50 px-3 py-1.5 rounded-md border border-blue-200">
              <span className="text-xs font-semibold text-blue-700">{userRole}</span>
            </div>

            {/* Barangay Badge */}
            {profile?.assigned_barangay && (
              <div className="bg-orange-50 px-3 py-1.5 rounded-md border border-orange-200">
                <span className="text-xs font-semibold text-orange-700">
                  {profile.assigned_barangay}
                </span>
              </div>
            )}

            {/* Wallet Address */}
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
              <FaWallet className="text-sm text-gray-700" />
              <span className="text-sm font-medium text-gray-900">{formatAddress(address)}</span>
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
              onClick={handleDisconnect}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors border border-red-200 text-sm font-medium"
            >
              <FaSignOutAlt className="text-sm" />
              Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={handleConnect}
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