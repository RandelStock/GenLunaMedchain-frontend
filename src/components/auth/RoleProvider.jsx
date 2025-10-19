import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAddress } from "@thirdweb-dev/react";
import { CONTRACT_ADDRESS } from "../../config";
import axios from 'axios';

const RoleContext = createContext();

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const RoleProvider = ({ children }) => {
  const userAddress = useAddress();
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get user role from backend database
  const getUserRoleFromDatabase = async () => {
    if (!userAddress) {
      console.log('⚠️ No user address');
      return "Patient";
    }

    setIsLoading(true);
    
    try {
      console.log('🔍 Checking role for address:', userAddress);
      
      // Call backend API to get user role
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/users/role/${userAddress}`,
        {
          headers: {
            'x-wallet-address': userAddress
          }
        }
      );

      if (response.data && response.data.role) {
        const role = response.data.role;
        console.log('✅ User role from database:', role);
        setIsLoading(false);
        return role;
      }

      console.log('👤 User not found in database, default to Patient');
      setIsLoading(false);
      return "Patient";
      
    } catch (error) {
      console.error("❌ Role check failed:", error);
      
      // If user not found (404), they're a patient
      if (error.response?.status === 404) {
        console.log('👤 New user, default to Patient');
        setIsLoading(false);
        return "Patient";
      }
      
      setIsLoading(false);
      return "Patient";
    }
  };

  const refreshRole = async () => {
    console.log('🔄 Refreshing role...');
    const role = await getUserRoleFromDatabase();
    console.log('🎭 Setting userRole to:', role);
    setUserRole(role);
  };

  useEffect(() => {
    console.log('🚀 Role effect triggered:', { 
      userAddress,
      hasAddress: !!userAddress
    });
    
    if (userAddress) {
      refreshRole();
    } else {
      console.log('🚫 No user address, setting role to null');
      setUserRole(null);
    }
  }, [userAddress]);

  // Persist connected wallet
  useEffect(() => {
    if (userAddress) {
      localStorage.setItem('connectedWalletAddress', userAddress);
    } else {
      localStorage.removeItem('connectedWalletAddress');
    }
  }, [userAddress]);

  const currentRole = userRole || "Patient";

  console.log('📊 Current role state:', {
    userRole,
    currentRole,
    userAddress,
    contractAddress: CONTRACT_ADDRESS,
    isWalletConnected: !!userAddress,
    isLoading
  });

  // Normalize role for consistent case comparison
  const normalizedRole = currentRole?.toUpperCase();
  
  const value = {
    userRole: normalizedRole === "ADMIN" ? "ADMIN" : 
              normalizedRole === "STAFF" ? "STAFF" : "Patient",
    userAddress,
    setUserRole,
    refreshRole,
    isAdmin: normalizedRole === "ADMIN",
    isStaff: normalizedRole === "STAFF", 
    isPatient: normalizedRole === "PATIENT" || normalizedRole === "PATIENT",
    isWalletConnected: !!userAddress,
    isLoading,
    canAddMedicine: normalizedRole === "ADMIN" || normalizedRole === "STAFF",
    canAddReceipts: normalizedRole === "ADMIN" || normalizedRole === "STAFF",
    canViewTransactions: normalizedRole === "ADMIN" || normalizedRole === "STAFF",
    canAccessAdminDashboard: normalizedRole === "ADMIN"
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};