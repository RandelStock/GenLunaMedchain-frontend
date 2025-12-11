import React, { useState, useEffect } from "react";
import { useAddress, useContract, useContractWrite } from "@thirdweb-dev/react";
import API_BASE_URL, { CONTRACT_ADDRESS } from "../../config.js";

// Barangay constants matching ResidentProfileModal
const BARANGAYS = [
  { value: '', label: 'All Barangays' },
  { value: 'BACONG_IBABA', label: 'Bacong Ibaba' },
  { value: 'BACONG_ILAYA', label: 'Bacong Ilaya' },
  { value: 'BARANGAY_1_POBLACION', label: 'Barangay 1 (Poblacion)' },
  { value: 'BARANGAY_2_POBLACION', label: 'Barangay 2 (Poblacion)' },
  { value: 'BARANGAY_3_POBLACION', label: 'Barangay 3 (Poblacion)' },
  { value: 'BARANGAY_4_POBLACION', label: 'Barangay 4 (Poblacion)' },
  { value: 'BARANGAY_5_POBLACION', label: 'Barangay 5 (Poblacion)' },
  { value: 'BARANGAY_6_POBLACION', label: 'Barangay 6 (Poblacion)' },
  { value: 'BARANGAY_7_POBLACION', label: 'Barangay 7 (Poblacion)' },
  { value: 'BARANGAY_8_POBLACION', label: 'Barangay 8 (Poblacion)' },
  { value: 'BARANGAY_9_POBLACION', label: 'Barangay 9 (Poblacion)' },
  { value: 'LAVIDES', label: 'Lavides' },
  { value: 'MAGSAYSAY', label: 'Magsaysay' },
  { value: 'MALAYA', label: 'Malaya' },
  { value: 'NIEVA', label: 'Nieva' },
  { value: 'RECTO', label: 'Recto' },
  { value: 'SAN_IGNACIO_IBABA', label: 'San Ignacio Ibaba' },
  { value: 'SAN_IGNACIO_ILAYA', label: 'San Ignacio Ilaya' },
  { value: 'SAN_ISIDRO_IBABA', label: 'San Isidro Ibaba' },
  { value: 'SAN_ISIDRO_ILAYA', label: 'San Isidro Ilaya' },
  { value: 'SAN_JOSE', label: 'San Jose' },
  { value: 'SAN_NICOLAS', label: 'San Nicolas' },
  { value: 'SAN_VICENTE', label: 'San Vicente' },
  { value: 'SANTA_MARIA_IBABA', label: 'Santa Maria Ibaba' },
  { value: 'SANTA_MARIA_ILAYA', label: 'Santa Maria Ilaya' },
  { value: 'SUMILANG', label: 'Sumilang' },
  { value: 'VILLARICA', label: 'Villarica' }
];

export default function AdminDashboard() {
  const address = useAddress();
  const { contract } = useContract(CONTRACT_ADDRESS);
  const { mutateAsync: grantStaffRole } = useContractWrite(contract, "grantStaffRole");
  const { mutateAsync: revokeStaffRole } = useContractWrite(contract, "revokeStaffRole");
  
  const [userRole, setUserRole] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [newStaff, setNewStaff] = useState({
    wallet_address: "",
    full_name: "",
    email: "",
    assigned_barangay: "",
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [blockchainLoading, setBlockchainLoading] = useState({});
  const [retryState, setRetryState] = useState({});

  useEffect(() => {
    if (address) {
      checkUserRole();
    }
  }, [address]);

  const checkUserRole = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/role/${address}`, {
        headers: { 'x-wallet-address': address }
      });
      const data = await response.json();
      setUserRole(data.role);
      if (data.role === 'ADMIN') {
        loadStaffList();
      }
    } catch (err) {
      console.error("Error checking role:", err);
      setUserRole('PATIENT');
    }
  };

  const loadStaffList = async () => {
    try {
      setLoadingStaff(true);
      const response = await fetch(`${API_BASE_URL}/users/by-role/STAFF`);
      const data = await response.json();
      setStaffList(data || []);
    } catch (err) {
      console.error("Error loading staff list:", err);
      setMessage({ type: 'error', text: 'Failed to load staff list' });
    } finally {
      setLoadingStaff(false);
    }
  };

  const createStaff = async () => {
    if (!newStaff.wallet_address || !newStaff.full_name) {
      setMessage({ type: 'error', text: 'Wallet address and full name are required' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: newStaff.wallet_address,
          full_name: newStaff.full_name,
          email: newStaff.email,
          role: "STAFF",
          assigned_barangay: newStaff.assigned_barangay || null,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create staff');
      }

      setMessage({ 
        type: 'success', 
        text: `✅ Staff member ${newStaff.full_name} created in database. Now granting blockchain access...` 
      });

      try {
        const tx = await grantStaffRole({ args: [newStaff.wallet_address] });
        console.log("✅ Blockchain role granted:", tx);
        
        setMessage({ 
          type: 'success', 
          text: `✅ Staff member ${newStaff.full_name} created successfully with blockchain access!` 
        });
        
        setRetryState(prev => ({ ...prev, [newStaff.wallet_address]: undefined }));
      } catch (blockchainError) {
        console.error("⚠️ Blockchain grant failed:", blockchainError);
        
        setRetryState(prev => ({ 
          ...prev, 
          [newStaff.wallet_address]: { attempts: 1, type: 'grant' }
        }));
        
        setMessage({ 
          type: 'warning', 
          text: `⚠️ Staff created in database but blockchain access failed (Attempt 1/3). Use the "Retry Grant" button below.` 
        });
      }
      
      setNewStaff({
        wallet_address: "",
        full_name: "",
        email: "",
        assigned_barangay: "",
      });
      
      setTimeout(() => loadStaffList(), 1000);

    } catch (err) {
      console.error("Error creating staff:", err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const grantBlockchainAccess = async (walletAddress, fullName) => {
    const currentAttempt = (retryState[walletAddress]?.attempts || 0) + 1;
    
    try {
      setBlockchainLoading(prev => ({ ...prev, [walletAddress]: true }));
      setMessage({ 
        type: 'info', 
        text: `Granting blockchain access to ${fullName}... (Attempt ${currentAttempt}/3)` 
      });

      const tx = await grantStaffRole({ args: [walletAddress] });
      console.log("✅ Blockchain role granted:", tx);

      setMessage({ 
        type: 'success', 
        text: `✅ Blockchain access granted to ${fullName}! They can now add medicines.` 
      });

      setRetryState(prev => ({ ...prev, [walletAddress]: undefined }));

      setTimeout(() => loadStaffList(), 1000);
    } catch (err) {
      console.error("Error granting blockchain access:", err);
      let errorMsg = 'Failed to grant blockchain access';
      
      if (err.message?.includes('user rejected')) {
        errorMsg = '❌ Transaction cancelled by user';
      } else if (err.message?.includes('insufficient funds')) {
        errorMsg = '❌ Insufficient MATIC for gas fees';
      } else {
        errorMsg = `❌ Blockchain error (Attempt ${currentAttempt}/3)`;
      }
      
      setRetryState(prev => ({ 
        ...prev, 
        [walletAddress]: { attempts: currentAttempt, type: 'grant' }
      }));
      
      if (currentAttempt < 3) {
        errorMsg += ` - Click "Retry Grant" to try again`;
      } else {
        errorMsg += ` - Maximum attempts reached. Contact technical support.`;
      }
      
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setBlockchainLoading(prev => ({ ...prev, [walletAddress]: false }));
    }
  };

  const revokeBlockchainAccess = async (walletAddress, fullName) => {
    if (!confirm(`Are you sure you want to revoke blockchain access for ${fullName}?`)) {
      return;
    }

    try {
      setBlockchainLoading(prev => ({ ...prev, [walletAddress]: true }));
      setMessage({ type: 'info', text: `Revoking blockchain access from ${fullName}...` });

      const tx = await revokeStaffRole({ args: [walletAddress] });
      console.log("✅ Blockchain role revoked:", tx);

      setMessage({ 
        type: 'success', 
        text: `✅ Blockchain access revoked from ${fullName}` 
      });

      setTimeout(() => loadStaffList(), 1000);
    } catch (err) {
      console.error("Error revoking blockchain access:", err);
      setMessage({ type: 'error', text: 'Failed to revoke blockchain access' });
    } finally {
      setBlockchainLoading(prev => ({ ...prev, [walletAddress]: false }));
    }
  };

  const deleteStaff = async (userId, walletAddress, fullName) => {
    if (!confirm(`Are you sure you want to deactivate ${fullName}? This will:\n- Deactivate their database account\n- Revoke their blockchain access`)) {
      return;
    }

    try {
      setLoading(true);
      
      try {
        await revokeStaffRole({ args: [walletAddress] });
        console.log("✅ Blockchain access revoked");
      } catch (bcErr) {
        console.warn("⚠️ Blockchain revoke failed (may not have had access):", bcErr.message);
      }

      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete user');
      
      setMessage({ 
        type: 'success', 
        text: `✅ ${fullName} deactivated successfully` 
      });
      
      setRetryState(prev => ({ ...prev, [walletAddress]: undefined }));
      
      setTimeout(() => loadStaffList(), 1000);
    } catch (err) {
      console.error("Error deleting staff:", err);
      setMessage({ type: 'error', text: 'Failed to deactivate staff member' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const isAdmin = userRole === 'ADMIN';


  if (!address) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <svg className="h-10 w-10 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="ml-3 text-lg font-semibold text-yellow-900">Wallet Required</h3>
          </div>
          <p className="text-yellow-800">Please connect your wallet to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Manage staff members and blockchain permissions</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                isAdmin 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {userRole || 'Loading...'}
              </span>
              <span className="text-sm text-gray-600 font-mono">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
          </div>
        </div>

        {!isAdmin && userRole && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <svg className="h-6 w-6 text-red-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-red-800">Access Restricted</h3>
                <p className="text-red-700 mt-1">Only system administrators can access this dashboard.</p>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className={`border rounded-lg p-4 mb-6 ${
            message.type === 'error' ? 'bg-red-50 border-red-200' :
            message.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
            message.type === 'info' ? 'bg-blue-50 border-blue-200' :
            'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-start">
              <svg className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${
                message.type === 'error' ? 'text-red-400' :
                message.type === 'warning' ? 'text-yellow-400' :
                message.type === 'info' ? 'text-blue-400' :
                'text-green-400'
              }`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className={`text-sm font-medium ${
                message.type === 'error' ? 'text-red-800' :
                message.type === 'warning' ? 'text-yellow-800' :
                message.type === 'info' ? 'text-blue-800' :
                'text-green-800'
              }`}>{message.text}</span>
            </div>
          </div>
        )}

        {isAdmin ? (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Create New Staff Member
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  ℹ️ This will create a staff account in the database AND grant blockchain access for adding medicines.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wallet Address *
                  </label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={newStaff.wallet_address}
                    onChange={(e) => setNewStaff({...newStaff, wallet_address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Juan Dela Cruz"
                    value={newStaff.full_name}
                    onChange={(e) => setNewStaff({...newStaff, full_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="juan@example.com"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned Barangay (Optional)
                  </label>
                  <select
                    value={newStaff.assigned_barangay}
                    onChange={(e) => setNewStaff({...newStaff, assigned_barangay: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {BARANGAYS.map((barangay) => (
                      <option key={barangay.value} value={barangay.value}>
                        {barangay.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-600 mt-1">
                    27 barangays available
                  </p>
                </div>
                
                <button
                  onClick={createStaff}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Staff Member (DB + Blockchain)</span>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Staff Members
                  <span className="ml-2 text-sm font-normal text-gray-600">({staffList.length})</span>
                </h3>
                <button
                  onClick={loadStaffList}
                  disabled={loadingStaff}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  {loadingStaff ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-gray-700"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Refresh</span>
                    </>
                  )}
                </button>
              </div>
              
              {loadingStaff ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
                  <p className="text-gray-600">Loading staff members...</p>
                </div>
              ) : staffList.length > 0 ? (
                <div className="space-y-3">
                  {staffList.map((staff) => {
                    const retry = retryState[staff.wallet_address];
                    const hasRetry = retry && retry.attempts > 0 && retry.attempts < 3;
                    
                    return (
                      <div key={staff.user_id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{staff.full_name}</p>
                                <p className="text-sm text-gray-600">{staff.email || 'No email'}</p>
                              </div>
                            </div>
                            <div className="ml-13 space-y-1">
                              <p className="font-mono text-xs text-gray-600">{staff.wallet_address}</p>
                              {staff.assigned_barangay && (
                                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  {BARANGAYS.find(b => b.value === staff.assigned_barangay)?.label || staff.assigned_barangay}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2 ml-4">
                            {hasRetry ? (
                              <button
                                onClick={() => grantBlockchainAccess(staff.wallet_address, staff.full_name)}
                                disabled={blockchainLoading[staff.wallet_address]}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded-lg transition-colors disabled:bg-gray-400 flex items-center justify-center space-x-1 whitespace-nowrap"
                              >
                                {blockchainLoading[staff.wallet_address] ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                    <span>Retrying...</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Retry Grant ({retry.attempts}/3)</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => grantBlockchainAccess(staff.wallet_address, staff.full_name)}
                                disabled={blockchainLoading[staff.wallet_address]}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors disabled:bg-gray-400 flex items-center justify-center space-x-1 whitespace-nowrap"
                              >
                                {blockchainLoading[staff.wallet_address] ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                    <span>Processing...</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span>Grant Blockchain</span>
                                  </>
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => revokeBlockchainAccess(staff.wallet_address, staff.full_name)}
                              disabled={blockchainLoading[staff.wallet_address]}
                              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded-lg transition-colors disabled:bg-gray-400 whitespace-nowrap"
                            >
                              Revoke Blockchain
                            </button>
                            <button
                              onClick={() => deleteStaff(staff.user_id, staff.wallet_address, staff.full_name)}
                              disabled={loading}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors disabled:bg-gray-400 whitespace-nowrap"
                            >
                              Deactivate All
                            </button>
                          </div>
                        </div>
                        
                        {hasRetry && (
                          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-center text-sm text-orange-800">
                              <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <span>
                                Blockchain grant failed ({retry.attempts}/3 attempts). Click "Retry Grant" button above to try again.
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {retry && retry.attempts >= 3 && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center text-sm text-red-800">
                              <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <span>
                                Maximum retry attempts reached (3/3). Please contact technical support or try again later.
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-600 font-medium">No staff members found</p>
                  <p className="text-sm text-gray-600 mt-1">Create staff members to get started</p>
                </div>
              )}
            </div>
          </div>
        ) : userRole ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Admin Access Required</h3>
            <p className="text-gray-600">You need administrator privileges to access this dashboard.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}