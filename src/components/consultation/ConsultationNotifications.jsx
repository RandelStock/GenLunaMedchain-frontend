import React, { useState, useEffect } from 'react';
import { FaBell, FaCalendarCheck, FaTimes, FaCheckCircle } from 'react-icons/fa';
import API_BASE_URL from '../../config.js';

const ConsultationNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastChecked, setLastChecked] = useState(null);

  // Load notifications on mount and set up polling
  useEffect(() => {
    loadNotifications();
    
    // Poll for new consultations every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const wallet = localStorage.getItem('connectedWalletAddress') || '';
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's scheduled consultations
      const response = await fetch(
        `${API_BASE_URL}/consultations?status=SCHEDULED&date_from=${today}&date_to=${today}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-wallet-address': wallet
          }
        }
      );
      
      if (!response.ok) return;
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const consultations = data.data;
        
        // Check for new consultations since last check
        const storedLastChecked = localStorage.getItem('lastNotificationCheck');
        const lastCheckTime = storedLastChecked ? new Date(storedLastChecked) : new Date(0);
        
        const newConsultations = consultations.filter(c => {
          const createdAt = new Date(c.created_at);
          return createdAt > lastCheckTime;
        });
        
        setNotifications(consultations);
        setUnreadCount(newConsultations.length);
        
        // Show browser notification for new consultations
        if (newConsultations.length > 0 && Notification.permission === 'granted') {
          new Notification('New Consultation Booking', {
            body: `${newConsultations.length} new consultation${newConsultations.length > 1 ? 's' : ''} scheduled`,
            icon: '/favicon.ico',
            tag: 'consultation-notification'
          });
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = () => {
    const now = new Date().toISOString();
    localStorage.setItem('lastNotificationCheck', now);
    setLastChecked(now);
    setUnreadCount(0);
  };

  const handleNotificationClick = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      markAsRead();
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
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
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

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
                <h3 className="font-bold text-lg">Today's Consultations</h3>
              </div>
              <button
                onClick={() => setShowDropdown(false)}
                className="hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <FaCheckCircle className="text-5xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No consultations scheduled for today</p>
                  <p className="text-sm text-gray-400 mt-1">New bookings will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((consultation) => (
                    <div
                      key={consultation.consultation_id}
                      className="p-4 hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={() => {
                        window.location.href = '/consultations/calendar';
                      }}
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
                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                              {formatTime(consultation.scheduled_time)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {consultation.chief_complaint}
                          </p>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {consultation.consultation_type}
                            </span>
                            <span className="text-xs text-gray-500">
                              {consultation.patient_barangay.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-3 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => {
                  window.location.href = '/consultations/calendar';
                }}
                className="w-full text-center text-sm font-semibold text-blue-600 hover:text-blue-700 py-2 hover:bg-blue-50 rounded-lg transition-colors"
              >
                View All Consultations →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ConsultationNotifications;