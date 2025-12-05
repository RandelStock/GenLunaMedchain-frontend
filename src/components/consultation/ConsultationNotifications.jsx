import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBell, FaCalendarCheck, FaTimes, FaCheckCircle } from 'react-icons/fa';
import API_BASE_URL from '../../config.js';

const ConsultationNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastChecked, setLastChecked] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load notifications on mount and set up polling
  useEffect(() => {
    loadNotifications();
    
    // Poll for new consultations every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const wallet = localStorage.getItem('connectedWalletAddress');
      
      console.log('🔔 Fetching notifications...', { 
        hasToken: !!token, 
        hasWallet: !!wallet 
      });
      
      // Get date range for upcoming consultations (today + next 7 days)
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 7); // Next 7 days
      
      const dateFrom = todayStart.toISOString().split('T')[0];
      const dateTo = futureDate.toISOString().split('T')[0];
      
      console.log('📅 Date range:', { dateFrom, dateTo });
      
      // Build URL with query parameters
      const url = `${API_BASE_URL}/consultations?date_from=${dateFrom}&date_to=${dateTo}&limit=50`;
      
      console.log('🌐 API URL:', url);
      
      // Fetch upcoming consultations
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (wallet) {
        headers['x-wallet-address'] = wallet;
      }
      
      const response = await fetch(url, { headers });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`Failed to fetch consultations: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ API Response:', data);
      
      if (data.success && data.data) {
        const consultations = data.data;
        console.log(`📋 Found ${consultations.length} consultations`);
        
        // Filter for upcoming scheduled/confirmed consultations
        const upcomingConsultations = consultations.filter(c => {
          const scheduledDate = new Date(c.scheduled_date);
          const isUpcoming = scheduledDate >= todayStart;
          const isActiveStatus = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(c.status);
          return isUpcoming && isActiveStatus;
        });
        
        // Sort by date and time (earliest first)
        upcomingConsultations.sort((a, b) => {
          const dateA = new Date(`${a.scheduled_date}T${a.scheduled_time}`);
          const dateB = new Date(`${b.scheduled_date}T${b.scheduled_time}`);
          return dateA - dateB;
        });
        
        console.log(`🎯 Upcoming consultations: ${upcomingConsultations.length}`);
        
        // Check for new consultations since last check
        const storedLastChecked = localStorage.getItem('lastNotificationCheck');
        const lastCheckTime = storedLastChecked ? new Date(storedLastChecked) : new Date(0);
        
        const newConsultations = upcomingConsultations.filter(c => {
          const createdAt = new Date(c.created_at);
          return createdAt > lastCheckTime;
        });
        
        console.log(`🆕 New consultations: ${newConsultations.length}`);
        
        setNotifications(upcomingConsultations);
        setUnreadCount(newConsultations.length);
        
        // Show browser notification for new consultations
        if (newConsultations.length > 0) {
          if ('Notification' in window && Notification.permission === 'granted') {
            console.log('🔔 Showing browser notification');
            new Notification('New Consultation Booking', {
              body: `${newConsultations.length} new consultation${newConsultations.length > 1 ? 's' : ''} scheduled`,
              icon: '/favicon.ico',
              tag: 'consultation-notification'
            });
          } else if ('Notification' in window && Notification.permission === 'default') {
            console.log('🔔 Requesting notification permission');
            Notification.requestPermission();
          }
        }
      } else {
        console.warn('⚠️ Unexpected response format:', data);
      }
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = () => {
    const now = new Date().toISOString();
    localStorage.setItem('lastNotificationCheck', now);
    setLastChecked(now);
    setUnreadCount(0);
    console.log('✔️ Marked notifications as read');
  };

  const handleNotificationClick = () => {
    console.log('🔔 Bell clicked, dropdown:', !showDropdown);
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      markAsRead();
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        console.log('🔔 Requesting notification permission');
        Notification.requestPermission().then(permission => {
          console.log('🔔 Notification permission:', permission);
        });
      } else {
        console.log('🔔 Notification permission:', Notification.permission);
      }
    } else {
      console.log('⚠️ Browser notifications not supported');
    }
  }, []);

  const formatTime = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    // Check if it's tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    // Otherwise show the date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatBarangay = (barangay) => {
    if (!barangay) return 'N/A';
    return barangay.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getStatusColor = (status) => {
    const colors = {
      'SCHEDULED': 'bg-blue-100 text-blue-800',
      'CONFIRMED': 'bg-green-100 text-green-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-gray-100 text-gray-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };



  // Group consultations by date
  const groupedNotifications = notifications.reduce((groups, consultation) => {
    const date = consultation.scheduled_date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(consultation);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedNotifications).sort();

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={handleNotificationClick}
        className="relative p-3 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <FaBell className="text-2xl text-gray-700" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        
        {/* Loading Indicator */}
        {loading && (
          <span className="absolute top-1 right-1 bg-blue-500 rounded-full h-2 w-2 animate-ping"></span>
        )}
      </button>

      {/* Dropdown Panel */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaBell className="text-xl" />
                <div>
                  <h3 className="font-bold text-lg">Upcoming Consultations</h3>
                  <p className="text-xs text-blue-100">
                    Next 7 days
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDropdown(false)}
                className="hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-b border-red-200 p-3">
                <p className="text-sm text-red-800">
                  ⚠️ {error}
                </p>
                <button
                  onClick={loadNotifications}
                  className="text-xs text-red-600 font-medium mt-1 hover:underline"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Notification List */}
            <div className="overflow-y-auto flex-1">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600 mx-auto mb-3"></div>
                  <p className="text-gray-500 font-medium">Loading consultations...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <FaCheckCircle className="text-5xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No upcoming consultations</p>
                  <p className="text-sm text-gray-400 mt-1">New bookings will appear here</p>
                </div>
              ) : (
                <div>
                  {sortedDates.map((date) => (
                    <div key={date}>
                      {/* Date Header */}
                      <div className="sticky top-0 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 border-b border-gray-200">
                        {formatDate(date)} - {new Date(date).toLocaleDateString('en-US', { weekday: 'long' })}
                      </div>
                      
                      {/* Consultations for this date */}
                      <div className="divide-y divide-gray-200">
                        {groupedNotifications[date].map((consultation) => (
                          <Link
                            to="/consultations/calendar"
                            key={consultation.consultation_id}
                            className="block p-4 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 bg-blue-100 p-2 rounded-lg">
                                <FaCalendarCheck className="text-blue-600 text-xl" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-bold text-gray-900 truncate">
                                    {consultation.patient_name}
                                  </p>
                                  <span className="text-xs font-semibold text-blue-600 ml-2 flex-shrink-0">
                                    {formatTime(consultation.scheduled_time)}
                                  </span>
                                </div>
                                
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                  {consultation.chief_complaint}
                                </p>
                                
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(consultation.status)}`}>
                                    {consultation.status.replace(/_/g, ' ')}
                                  </span>
                                  {consultation.consultation_type && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                      {consultation.consultation_type}
                                    </span>
                                  )}
                                  {consultation.patient_barangay && (
                                    <span className="text-xs text-gray-500">
                                      📍 {formatBarangay(consultation.patient_barangay)}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Provider Info */}
                                {(consultation.assigned_doctor || consultation.assigned_nurse) && (
                                  <div className="mt-2 text-xs text-gray-500">
                                    👨‍⚕️ {consultation.assigned_doctor 
                                      ? `Dr. ${consultation.assigned_doctor.full_name}` 
                                      : consultation.assigned_nurse?.full_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-3 bg-gray-50 rounded-b-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600">
                  {notifications.length} upcoming consultation{notifications.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    loadNotifications();
                  }}
                  disabled={loading}
                  className="text-xs text-blue-600 font-medium hover:underline disabled:opacity-50"
                >
                  {loading ? '⟳ Refreshing...' : '⟳ Refresh'}
                </button>
              </div>
              <Link
                to="/consultations/calendar"
                className="block w-full text-center text-sm font-semibold text-blue-600 hover:text-blue-700 py-2 hover:bg-blue-50 rounded-lg transition-colors"
              >
                View All Consultations →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ConsultationNotifications;