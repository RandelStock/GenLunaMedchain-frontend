import React, { useEffect, useState } from "react";
import {
  useConnect,
  useDisconnect,
  useAddress,
  metamaskWallet,
} from "@thirdweb-dev/react";
import { FaWallet } from "react-icons/fa";
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
    fetchMe();
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

  return (
    <nav className="bg-white shadow-md flex items-center justify-between px-6 py-3 border-b border-blue-100">
      {/* Logo / Brand */}
      <div className="font-extrabold text-lg text-blue-800 tracking-tight">
        <span className="text-orange-500">Gen</span>Luna
        <span className="text-blue-700">MedChain</span>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Role */}
        <span className="text-sm text-blue-800 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200 font-medium">
          {userRole} View
        </span>

        {/* Barangay */}
        {profile?.assigned_barangay && (
          <span className="text-sm text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200 font-semibold">
            {profile.assigned_barangay}
          </span>
        )}

        {/* Wallet Address */}
        {address && (
          <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-full border border-gray-200">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        )}

        {/* Wallet Connection Buttons */}
        {address ? (
          <div className="flex items-center gap-3">
            <span className="text-green-600 text-sm font-medium">
              Connected
            </span>
            <button
              onClick={handleDisconnect}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-md hover:opacity-90 text-sm font-semibold shadow-sm transition-all"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white px-4 py-2 rounded-md text-sm font-semibold shadow-sm hover:opacity-90 transition-all"
          >
            <FaWallet className="text-base" />
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
