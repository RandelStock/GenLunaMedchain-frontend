import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaCapsules,
  FaHome,
  FaTachometerAlt,
  FaUser,
  FaVideo,
  FaHistory,
  FaWallet,
  FaUsers,
  FaClipboardList,
  FaUserMd,
  FaBoxes,
  FaExchangeAlt,
  FaLink,
  FaCalendarAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { useAddress } from "@thirdweb-dev/react";
import { useRole } from "../auth/RoleProvider";
import logo from "../../img/logo.png";

const Sidebar = () => {
  const location = useLocation();
  const address = useAddress();
  const { userRole, isAdmin, isStaff, isPatient, isLoading } = useRole();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pinnedTabs, setPinnedTabs] = useState(() => {
    const saved = localStorage.getItem('pinnedTabs');
    if (saved) {
      return JSON.parse(saved);
    }
    // Default: Home is always pinned
    return [{ path: "/", icon: FaHome, label: "Home" }];
  });

  const isWalletConnected = !!address;

  useEffect(() => {
    localStorage.setItem('pinnedTabs', JSON.stringify(pinnedTabs));
  }, [pinnedTabs]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handlePinTab = (item) => {
    const existingIndex = pinnedTabs.findIndex(tab => tab.path === item.path);
    if (existingIndex === -1) {
      setPinnedTabs([...pinnedTabs, item]);
    }
    setIsMenuOpen(false);
  };

  const handleUnpinTab = (path) => {
    setPinnedTabs(pinnedTabs.filter(tab => tab.path !== path));
  };

  const getNavigationGroups = () => {
    if (!isWalletConnected) {
      return {
        main: [
          { path: "/", icon: FaHome, label: "Home" },
          { path: "/consultation", icon: FaVideo, label: "Consultation" },
        ],
      };
    }

    if (isAdmin) {
      return {
        main: [
          { path: "/", icon: FaHome, label: "Home" },
          { path: "/dashboard", icon: FaTachometerAlt, label: "Dashboard" },
          { path: "/calendar", icon: FaCalendarAlt, label: "Calendar" },
        ],
        inventory: [
          { path: "/medicines", icon: FaCapsules, label: "Medicines" },
          { path: "/stock", icon: FaBoxes, label: "Stock Management" },
          { path: "/stock-transactions", icon: FaExchangeAlt, label: "Stock History" },
        ],
        operations: [
          { path: "/releases", icon: FaClipboardList, label: "Medicine Releases" },
          { path: "/removals/history", icon: FaHistory, label: "Stock Removals" },
        ],
        people: [
          { path: "/residents", icon: FaUsers, label: "Residents" },
          { path: "/residents/dashboard", icon: FaTachometerAlt, label: "Barangay Stats" },
          { path: "/provider-management", icon: FaUserMd, label: "Providers" },
        ],
        system: [
          { path: "/blockchain", icon: FaLink, label: "Blockchain" },
          { path: "/transaction-history", icon: FaHistory, label: "Audit Trail" },
          { path: "/audit-logs/all", icon: FaHistory, label: "All Audit Logs" },
          { path: "/profile", icon: FaUser, label: "Profile" },
        ],
      };
    }

    if (isStaff) {
      return {
        main: [
          { path: "/", icon: FaHome, label: "Home" },
          { path: "/calendar", icon: FaCalendarAlt, label: "Calendar" },
        ],
        inventory: [
          { path: "/medicines", icon: FaCapsules, label: "Medicines" },
          { path: "/stock", icon: FaBoxes, label: "Stock Management" },
          { path: "/stock-transactions", icon: FaExchangeAlt, label: "Stock History" },
        ],
        operations: [
          { path: "/releases", icon: FaClipboardList, label: "Medicine Releases" },
          { path: "/removals", icon: FaHistory, label: "Stock Removals" },
        ],
        people: [
          { path: "/residents", icon: FaUsers, label: "Residents" },
          { path: "/residents/dashboard", icon: FaTachometerAlt, label: "Barangay Stats" },
          { path: "/provider-management", icon: FaUserMd, label: "Providers" },
        ],
        system: [
          { path: "/blockchain", icon: FaLink, label: "Blockchain" },
          { path: "/consultation", icon: FaVideo, label: "Consultation" },
          { path: "/transaction-history", icon: FaHistory, label: "Audit Trail" },
          { path: "/audit-logs/all", icon: FaHistory, label: "All Audit Logs" },
          { path: "/profile", icon: FaUser, label: "Profile" },
        ],
      };
    }

    return {
      main: [
        { path: "/", icon: FaHome, label: "Home" },
        { path: "/calendar", icon: FaCalendarAlt, label: "Calendar" },
        { path: "/consultation", icon: FaVideo, label: "Consultation" },
        { path: "/profile", icon: FaUser, label: "Profile" },
      ],
    };
  };

  const navigationGroups = getNavigationGroups();

  if (isLoading && isWalletConnected) {
    return (
      <div className="fixed h-screen w-[200px] bg-white top-0 left-0 flex items-center justify-center shadow-lg border-r border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-900">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Sidebar Container */}
      <div className="fixed h-screen w-[200px] bg-white top-0 left-0 flex flex-col shadow-lg border-r border-gray-200">
        {/* Logo Section */}
        <div className="p-4 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src={logo}
              alt="Logo"
              className="w-8 h-8 object-contain transition-transform group-hover:scale-110"
            />
            <div>
              <p className="text-sm font-bold text-gray-900">GenLuna</p>
              <p className="text-xs text-blue-600 font-medium">MedChain</p>
            </div>
          </Link>
        </div>

        {/* Wallet Status */}
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FaWallet className="text-xs text-gray-700" />
              <span className="text-xs font-medium text-gray-900">
                {isWalletConnected ? "Wallet Connected" : "No Wallet"}
              </span>
            </div>
            <div
              className={`w-2 h-2 rounded-full ${
                isWalletConnected ? "bg-green-500" : "bg-gray-400"
              }`}
            ></div>
          </div>
          <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold text-center">
            {userRole || "Guest"} View
          </div>
        </div>

        {/* Menu Button */}
        <div className="px-3 py-2 border-b border-gray-200">
          <button
            onClick={toggleMenu}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded transition-colors"
          >
            <FaBars className="text-base" />
            <span>Menu</span>
          </button>
        </div>

        {/* Pinned Tabs */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className="space-y-1">
            {pinnedTabs.map(({ path, icon: Icon, label }) => (
              <div
                key={path}
                className={`flex items-center gap-2 rounded transition-colors ${
                  location.pathname === path
                    ? "bg-blue-600 text-white"
                    : "text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Link
                  to={path}
                  className="flex-1 flex items-center gap-2 px-3 py-2 text-sm font-medium"
                >
                  <Icon className="text-base flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
                <button
                  onClick={() => handleUnpinTab(path)}
                  className="pr-2 hover:opacity-70"
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
          <p className="text-xs text-gray-700 font-medium">
            GenLunaMedChain v1.0
          </p>
        </div>
      </div>

      {/* Menu Overlay Panel */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={toggleMenu}
          />

          {/* Menu Panel */}
          <div className="fixed top-0 left-[200px] h-screen w-[400px] bg-gray-900 shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <button
                onClick={toggleMenu}
                className="flex items-center gap-2 text-white hover:text-gray-300"
              >
                <FaTimes className="text-lg" />
                <span className="text-sm font-medium">Close</span>
              </button>
              <button className="text-white text-sm font-medium hover:text-gray-300">
                ADD/REMOVE
              </button>
            </div>

            {/* Menu Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(navigationGroups).map(([groupName, items]) => (
                  <React.Fragment key={groupName}>
                    {items.map(({ path, icon: Icon, label }) => (
                      <button
                        key={path}
                        onClick={() => handlePinTab({ path, icon: Icon, label })}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors group"
                      >
                        <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                          <Icon className="text-white text-xl" />
                        </div>
                        <span className="text-xs text-white text-center font-medium leading-tight">
                          {label}
                        </span>
                      </button>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;