import React, { useState, useEffect } from 'react';
import { useAddress } from '@thirdweb-dev/react';
import { useRole } from './auth/RoleProvider';
import { FaUser, FaWallet, FaBuilding, FaCalendarAlt, FaPhone, FaEnvelope, FaIdCard, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import api from '../../api';

export default function ProfileUI() {
  const address = useAddress();
  const { userRole } = useRole();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/users/me");
        setProfile(data?.user || null);
        if (data?.user) {
          setEditForm({
            full_name: data.user.full_name || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
          });
        }
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data } = await api.put("/users/me", editForm);
      setProfile(data?.user || profile);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error("Error updating profile:", error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
    });
    setIsEditing(false);
  };

  const getRoleDisplay = () => {
    if (userRole === 'Admin') return 'Municipal/RHU Admin';
    if (userRole === 'Staff') return 'Municipal/RHU Staff';
    if (userRole === 'Patient') return 'Patient';
    return userRole;
  };

  const getLocationDisplay = () => {
    if (userRole === 'Admin') {
      return 'Municipal/RHU Office';
    } else if (userRole === 'Staff' && profile?.assigned_barangay) {
      return `${profile.assigned_barangay} Barangay`;
    }
    return null;
  };

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
                
                <div className="md:ml-6 mt-4 md:mt-0 text-center md:text-left flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      name="full_name"
                      value={editForm.full_name}
                      onChange={handleInputChange}
                      className="text-2xl font-bold text-gray-800 border-b-2 border-blue-500 focus:outline-none bg-transparent w-full md:w-auto"
                      placeholder="Full Name"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-gray-800">{profile?.full_name || 'User'}</h1>
                  )}
                  
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleInputChange}
                      className="text-orange-600 border-b-2 border-blue-500 focus:outline-none bg-transparent mt-1 w-full md:w-auto"
                      placeholder="Email"
                    />
                  ) : (
                    <p className="text-orange-600">{profile?.email || 'No email provided'}</p>
                  )}
                </div>

                {/* Edit/Save/Cancel Buttons */}
                <div className="flex gap-2 mt-4 md:mt-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-all shadow-sm disabled:opacity-50"
                      >
                        <FaSave className="text-sm" />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-all shadow-sm disabled:opacity-50"
                      >
                        <FaTimes className="text-sm" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white px-4 py-2 rounded-md hover:opacity-90 transition-all shadow-sm"
                    >
                      <FaEdit className="text-sm" />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>

              {/* Role and Location Badges */}
              <div className="mb-8 flex flex-wrap gap-3">
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium">
                  <FaIdCard className="mr-2" />
                  {getRoleDisplay()}
                </div>
                
                {getLocationDisplay() && (
                  <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-full font-medium">
                    <FaBuilding className="mr-2" />
                    {getLocationDisplay()}
                  </div>
                )}
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                      <FaUser className="mr-2 text-orange-500" /> Role
                    </h3>
                    <p className="text-gray-800 font-medium">{getRoleDisplay()}</p>
                  </div>
                  
                  {getLocationDisplay() && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                      <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                        <FaBuilding className="mr-2 text-orange-500" /> Location Assignment
                      </h3>
                      <p className="text-gray-800 font-medium">{getLocationDisplay()}</p>
                    </div>
                  )}
                  
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                      <FaPhone className="mr-2 text-orange-500" /> Contact Number
                    </h3>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={editForm.phone}
                        onChange={handleInputChange}
                        className="text-gray-800 font-medium border-b-2 border-blue-500 focus:outline-none bg-transparent w-full"
                        placeholder="Phone Number"
                      />
                    ) : (
                      <p className="text-gray-800 font-medium">{profile?.phone || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                      <FaEnvelope className="mr-2 text-orange-500" /> Email Address
                    </h3>
                    <p className="text-gray-800 font-medium break-words">{profile?.email || 'Not provided'}</p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {profile?.created_at && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                        <FaCalendarAlt className="mr-2 text-blue-500" /> Member Since
                      </h3>
                      <p className="text-gray-800 font-medium">
                        {new Date(profile.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                      <FaWallet className="mr-2 text-blue-500" /> Wallet Address
                    </h3>
                    <div className="flex items-center">
                      <p className="text-gray-800 break-all font-mono bg-white p-3 rounded border border-blue-200 text-xs leading-relaxed">
                        {address || 'Not connected'}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      This is your blockchain wallet address used for authentication
                    </p>
                  </div>

                  {/* Account Status */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      Account Status
                    </h3>
                    <p className="text-gray-800 font-medium">Active</p>
                  </div>
                </div>
              </div>

              {/* Additional Info Section */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Profile Information</h3>
                <p className="text-xs text-gray-600">
                  {userRole === 'Admin' 
                    ? 'As a Municipal/RHU Administrator, you have full access to manage the healthcare system across all barangays.'
                    : userRole === 'Staff'
                    ? `As a Municipal/RHU Staff member assigned to ${profile?.assigned_barangay || 'your barangay'}, you can manage healthcare services in your assigned area.`
                    : 'As a Patient, you can view and manage your health records and appointments.'}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}