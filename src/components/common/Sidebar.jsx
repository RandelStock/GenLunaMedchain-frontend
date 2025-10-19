import React, { useState } from "react";
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
  FaChevronDown,
  FaChevronRight,
  FaUserMd,
  FaBoxes,
  FaExchangeAlt,
  FaLink,
  FaCalendarAlt,
} from "react-icons/fa";
import { useRole } from "../auth/RoleProvider";
import logo from "../../img/logo.png";

const Sidebar = () => {
  const location = useLocation();
  const { userRole, isAdmin, isStaff, isPatient, isWalletConnected } = useRole();
  const [expandedGroups, setExpandedGroups] = useState(["main"]);

  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName)
        ? prev.filter((g) => g !== groupName)
        : [...prev, groupName]
    );
  };

  const getActiveClass = (path) =>
    location.pathname === path
      ? "bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-md"
      : "text-blue-900 hover:bg-orange-100 hover:text-blue-700";

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

    if (isPatient && isWalletConnected) {
      return {
        main: [
          { path: "/", icon: FaHome, label: "Home" },
          { path: "/calendar", icon: FaCalendarAlt, label: "Calendar" },
          { path: "/consultation", icon: FaVideo, label: "Consultation" },
          { path: "/profile", icon: FaUser, label: "Profile" },
        ],
      };
    }

    return { main: [{ path: "/", icon: FaHome, label: "Home" }] };
  };

  const navigationGroups = getNavigationGroups();
  const groupLabels = {
    main: "Main",
    inventory: "Inventory",
    operations: "Operations",
    people: "People",
    system: "System",
  };

  const groupIcons = {
    main: FaHome,
    inventory: FaCapsules,
    operations: FaExchangeAlt,
    people: FaUsers,
    system: FaHistory,
  };

  return (
    <div className="fixed h-screen w-[230px] bg-gradient-to-b from-blue-50 to-white text-blue-900 top-0 left-0 flex flex-col shadow-lg border-r border-blue-200">
      {/* Logo */}
      <div className="p-4 border-b border-blue-100 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 group">
          <img
            src={logo}
            alt="Logo"
            className="w-10 h-10 object-contain transition-transform group-hover:scale-110"
          />
          <div>
            <p className="text-base font-bold text-blue-700">GenLuna</p>
            <p className="text-xs text-orange-500 font-medium">MedChain</p>
          </div>
        </Link>
      </div>

      {/* Wallet Status */}
      <div className="px-4 py-3 border-b border-blue-100 bg-blue-50 rounded-br-xl">
        <div className="flex items-center space-x-2 mb-2">
          <FaWallet className="text-xs text-blue-700" />
          <span className="text-xs font-medium">
            {isWalletConnected ? "Wallet Connected" : "No Wallet"}
          </span>
          <div
            className={`w-2 h-2 rounded-full ml-auto ${
              isWalletConnected ? "bg-green-500" : "bg-gray-400"
            }`}
          ></div>
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold text-center shadow">
          {userRole} View
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <nav className="space-y-2">
          {Object.entries(navigationGroups).map(([groupName, items]) => (
            <div key={groupName}>
              {Object.keys(navigationGroups).length > 1 && groupName !== "main" && (
                <button
                  onClick={() => toggleGroup(groupName)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-blue-700 uppercase tracking-wide hover:bg-blue-100 rounded-md transition-all"
                >
                  <div className="flex items-center space-x-2">
                    {React.createElement(groupIcons[groupName], {
                      className: "text-xs text-orange-500",
                    })}
                    <span>{groupLabels[groupName]}</span>
                  </div>
                  {expandedGroups.includes(groupName) ? (
                    <FaChevronDown className="text-xs" />
                  ) : (
                    <FaChevronRight className="text-xs" />
                  )}
                </button>
              )}

              {(groupName === "main" || expandedGroups.includes(groupName)) && (
                <div
                  className={`space-y-1 ${
                    groupName !== "main"
                      ? "ml-2 pl-3 border-l border-blue-200 mt-1"
                      : ""
                  }`}
                >
                  {items.map(({ path, icon: Icon, label }) => (
                    <Link
                      key={path}
                      to={path}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-md transition-all ${getActiveClass(
                        path
                      )}`}
                    >
                      <Icon className="text-base text-orange-500" />
                      <span className="text-sm font-medium truncate">
                        {label}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-blue-100 bg-blue-50 text-center">
        <p className="text-xs text-blue-700 font-medium">
          GenLunaMedChain v1.0
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
