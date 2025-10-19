import React, { useState, useEffect } from 'react';
import { useAddress } from '@thirdweb-dev/react';
import { useRole } from './auth/RoleProvider';
import { FaUser, FaWallet, FaBuilding, FaCalendarAlt, FaPhone, FaEnvelope, FaIdCard } from 'react-icons/fa';
import api from '../../api';

export default function ProfileUI() {
  const address = useAddress();
  const { userRole } = useRole();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/users/me");
        setProfile(data?.user || null);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchProfile();
    }
  }, [address]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <>
            {/* Profile Header with Banner */}
            <div className="bg-gradient-to-r from-orange-500 to-blue-600 h-32 relative"></div>
            
            <div className="px-8 pb-8">
              {/* Profile Picture and Basic Info */}
              <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 mb-8">
                <div className="w-28 h-28 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center overflow-hidden z-10">
                  <FaUser className="text-6xl text-blue-500" />
                </div>
                
                <div className="md:ml-6 mt-4 md:mt-0 text-center md:text-left">
                  <h1 className="text-2xl font-bold text-gray-800">{profile?.full_name || 'User'}</h1>
                  <p className="text-orange-600">{profile?.email || 'No email provided'}</p>
                </div>
              </div>

              {/* Role Badge */}
              <div className="mb-8">
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium">
                  <FaIdCard className="mr-2" />
                  {userRole} {profile?.assigned_barangay ? `- ${profile.assigned_barangay} Barangay` : ''}
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                      <FaUser className="mr-2 text-orange-500" /> Role
                    </h3>
                    <p className="text-gray-800 font-medium">
                      {userRole === 'Admin' ? 'Municipal/RHU Admin' : 
                       userRole === 'Staff' ? 'Municipal/RHU Staff' : 
                       userRole === 'Patient' ? 'Patient' : userRole}
                    </p>
                  </div>
                  
                  {profile?.assigned_barangay && (
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                        <FaBuilding className="mr-2 text-orange-500" /> Assigned Barangay
                      </h3>
                      <p className="text-gray-800 font-medium">{profile.assigned_barangay}</p>
                    </div>
                  )}
                  
                  {profile?.phone && (
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                        <FaPhone className="mr-2 text-orange-500" /> Contact
                      </h3>
                      <p className="text-gray-800 font-medium">{profile.phone}</p>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {profile?.created_at && (
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                        <FaCalendarAlt className="mr-2 text-orange-500" /> Joined
                      </h3>
                      <p className="text-gray-800 font-medium">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                      <FaWallet className="mr-2 text-orange-500" /> Wallet Address
                    </h3>
                    <div className="flex items-center">
                      <p className="text-gray-800 break-all font-mono bg-white p-2 rounded border border-orange-100 text-sm">
                        {address || 'Not connected'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Profile Button */}
              <div className="mt-8 flex justify-center md:justify-start">
                <button className="bg-gradient-to-r from-blue-600 to-orange-500 text-white px-6 py-2 rounded-md hover:opacity-90 transition-all shadow-sm flex items-center">
                  <FaUser className="mr-2" /> Edit Profile
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}