// src/components/dashboard/PatientHome.jsx
import React, { useState } from 'react';
import { useRole } from '../auth/RoleProvider';
import { Link, useNavigate } from 'react-router-dom';
import { useConnect, useDisconnect, useAddress, metamaskWallet } from "@thirdweb-dev/react";
import MedicineList from '../medicine/MedicineList';
import ConsultationBookingForm from '../consultation/ConsultationBookingForm';
import AvailabilityCalendar from '../consultation/AvailabilityCalendar';
import logo from "../../img/logo.png";
import {
  FaVideo,
  FaCapsules,
  FaCalendarAlt,
  FaUserMd,
  FaShieldAlt,
  FaClock,
  FaCheckCircle,
  FaArrowRight,
  FaHospital,
  FaStethoscope,
  FaHeartbeat,
  FaLink,
  FaWallet,
  FaPhone,
  FaMapMarkerAlt,
  FaEnvelope
} from 'react-icons/fa';

import {
  ConsultationCard,
  MedicineInventoryCard,
  PatientAppointmentCard,
  PatientPrescriptionCard
} from './DashboardCards';

const PatientHome = () => {
  const { isWalletConnected, userAddress } = useRole();
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [selectedDateTime, setSelectedDateTime] = useState(null);
  const navigate = useNavigate();

  // Wallet connection hooks
  const connect = useConnect();
  const disconnect = useDisconnect();
  const address = useAddress();
  const metamask = metamaskWallet();

  const handleConnect = async () => {
    try {
      await connect(metamask);
    } catch (err) {
      console.error("Failed to connect:", err);
      alert("Failed to connect wallet. Please try again.");
    }
  };

  const handleDisconnect = () => {
    if (window.confirm("Are you sure you want to disconnect your wallet?")) {
      disconnect();
    }
  };

  const handleViewCalendar = () => {
    setActiveSection('calendar');
  };

  const handleTimeSlotSelect = (slotData) => {
    setSelectedDateTime({ 
      date: slotData.date, 
      time: slotData.time,
      providerType: slotData.providerType,
      providerId: slotData.providerId,
      providerName: slotData.providerName
    });
    setShowBookingForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Government Header - Orange Top Bar */}
      <div className="bg-orange-600 text-white py-1 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>Republic of the Philippines</div>
          <div className="flex gap-4">
            <span>Province of Quezon</span>
            <span>Municipality of General Luna</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white shadow-md border-b-4 border-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Government Logo and Title */}
            <div className="flex items-center space-x-4">
              <img src={logo} alt="General Luna Logo" className="h-16 w-16 object-contain" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">RURAL HEALTH UNIT</h1>
                <p className="text-sm text-gray-600">Municipality of General Luna, Quezon</p>
                <p className="text-xs text-orange-600 font-semibold">GenLunaMedChain - Digital Health Platform</p>
              </div>
            </div>

            {/* Wallet Connection */}
            <div className="flex items-center gap-3">
              {address ? (
                <>
                  <div className="bg-green-50 border border-green-300 rounded px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-green-700">
                        Connected: {address.slice(0, 6)}...{address.slice(-4)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-all font-medium text-sm"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnect}
                  className="bg-blue-800 text-white px-6 py-3 rounded hover:bg-blue-900 transition-all font-semibold text-sm flex items-center"
                >
                  <FaWallet className="mr-2" />
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Banner - Orange & Blue Gradient */}
      <div className="relative bg-gradient-to-r from-orange-500 via-orange-600 to-blue-800 text-white overflow-hidden">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <div className="inline-block bg-white text-orange-600 px-4 py-1 rounded-full text-sm font-bold mb-4">
              OFFICIAL GOVERNMENT SERVICE
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Welcome to General Luna RHU
            </h1>
            <p className="text-xl text-orange-50 max-w-3xl mx-auto mb-2">
              Providing Quality Healthcare Services to the Community
            </p>
            <p className="text-lg text-orange-100">
              "Masaya, Maunlad, Maaasahan at Nagkakaisang Bayan ng General Luna"
            </p>
          </div>

          {/* Government Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-2xl text-white flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-sm mb-1">LOCATION</h3>
                  <p className="text-sm text-orange-50">Brgy. Poblacion, General Luna, Quezon Province</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FaPhone className="text-2xl text-white flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-sm mb-1">CONTACT</h3>
                  <p className="text-sm text-orange-50">RHU Hotline: 0995-897-2263</p>
                  <p className="text-sm text-orange-50">Emergency: 0930-327-0985</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FaClock className="text-2xl text-white flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-sm mb-1">OFFICE HOURS</h3>
                  <p className="text-sm text-orange-50">Mon-Fri: 6:00 AM - 5:00 PM</p>
                  <p className="text-sm text-orange-50">Sat-Sun: 6:00 AM - 5:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Public Services Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">PUBLIC HEALTH SERVICES</h2>
            <div className="h-1 w-24 bg-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Free and accessible healthcare services for all residents of General Luna</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Telemedicine Consultation */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
              <div className="bg-gradient-to-br from-blue-700 to-blue-800 text-white p-6">
                <div className="bg-white/20 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
                  <FaVideo className="text-3xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">Telemedicine Consultation</h3>
                <p className="text-sm text-blue-100">Online consultation with RHU doctors</p>
              </div>
              <div className="p-6">
                <ul className="space-y-3 mb-6 text-sm text-gray-700">
                  <li className="flex items-start">
                    <FaCheckCircle className="text-orange-600 mt-1 mr-2 flex-shrink-0" />
                    <span>Free video consultations for residents</span>
                  </li>
                  <li className="flex items-start">
                    <FaCheckCircle className="text-orange-600 mt-1 mr-2 flex-shrink-0" />
                    <span>Licensed municipal health officers</span>
                  </li>
                  <li className="flex items-start">
                    <FaCheckCircle className="text-orange-600 mt-1 mr-2 flex-shrink-0" />
                    <span>Prescription and medical certificates</span>
                  </li>
                </ul>
                <button
                  onClick={() => setShowBookingForm(true)}
                  className="w-full bg-blue-800 text-white py-3 rounded font-semibold hover:bg-blue-900 transition-all flex items-center justify-center"
                >
                  Book Consultation
                  <FaArrowRight className="ml-2" />
                </button>
              </div>
            </div>

            {/* Medicine Inventory */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6">
                <div className="bg-white/20 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
                  <FaCapsules className="text-3xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">Medicine Availability</h3>
                <p className="text-sm text-orange-100">Check available medicines at RHU</p>
              </div>
              <div className="p-6">
                <ul className="space-y-3 mb-6 text-sm text-gray-700">
                  <li className="flex items-start">
                    <FaCheckCircle className="text-orange-600 mt-1 mr-2 flex-shrink-0" />
                    <span>Real-time inventory tracking</span>
                  </li>
                  <li className="flex items-start">
                    <FaCheckCircle className="text-orange-600 mt-1 mr-2 flex-shrink-0" />
                    <span>DOH-approved medications</span>
                  </li>
                  <li className="flex items-start">
                    <FaCheckCircle className="text-orange-600 mt-1 mr-2 flex-shrink-0" />
                    <span>Transparent blockchain records</span>
                  </li>
                </ul>
                <button
                  onClick={() => setActiveSection('medicines')}
                  className="w-full bg-orange-600 text-white py-3 rounded font-semibold hover:bg-orange-700 transition-all flex items-center justify-center"
                >
                  View Medicines
                  <FaArrowRight className="ml-2" />
                </button>
              </div>
            </div>

            {/* Schedule Availability */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
              <div className="bg-gradient-to-br from-blue-700 to-blue-800 text-white p-6">
                <div className="bg-white/20 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
                  <FaCalendarAlt className="text-3xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">Doctor's Schedule</h3>
                <p className="text-sm text-blue-100">View available consultation times</p>
              </div>
              <div className="p-6">
                <ul className="space-y-3 mb-6 text-sm text-gray-700">
                  <li className="flex items-start">
                    <FaCheckCircle className="text-orange-600 mt-1 mr-2 flex-shrink-0" />
                    <span>Real-time schedule updates</span>
                  </li>
                  <li className="flex items-start">
                    <FaCheckCircle className="text-orange-600 mt-1 mr-2 flex-shrink-0" />
                    <span>Multiple doctors available</span>
                  </li>
                  <li className="flex items-start">
                    <FaCheckCircle className="text-orange-600 mt-1 mr-2 flex-shrink-0" />
                    <span>Book your preferred time slot</span>
                  </li>
                </ul>
                <button
                  onClick={handleViewCalendar}
                  className="w-full bg-blue-800 text-white py-3 rounded font-semibold hover:bg-blue-900 transition-all flex items-center justify-center"
                >
                  View Schedule
                  <FaArrowRight className="ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard for Connected Users */}
        {isWalletConnected && (
          <div className="mb-12 bg-orange-50 rounded-lg p-8 border-2 border-orange-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Personal Health Records</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PatientAppointmentCard />
              <PatientPrescriptionCard />
              <ConsultationCard onScheduleConsultation={() => setShowBookingForm(true)} />
            </div>
          </div>
        )}

        {/* Medicine Inventory Section */}
        {activeSection === 'medicines' && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">RHU Medicine Inventory</h2>
                <p className="text-gray-600 mt-1">Available medicines at General Luna Rural Health Unit</p>
              </div>
              <button
                onClick={() => setActiveSection('home')}
                className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 font-medium flex items-center"
              >
                <FaArrowRight className="mr-2 rotate-180" />
                Back to Home
              </button>
            </div>
            <MedicineInventoryCard>
              <MedicineList isPatientView={true} />
            </MedicineInventoryCard>
          </div>
        )}

        {/* Availability Calendar Section */}
        {activeSection === 'calendar' && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Doctor's Consultation Schedule</h2>
                <p className="text-gray-600 mt-1">Select your preferred date and time for consultation</p>
              </div>
              <button
                onClick={() => setActiveSection('home')}
                className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 font-medium flex items-center"
              >
                <FaArrowRight className="mr-2 rotate-180" />
                Back to Home
              </button>
            </div>
            
            <AvailabilityCalendar 
              onTimeSlotSelect={handleTimeSlotSelect}
            />
            
            {!address && (
              <div className="mt-6 bg-orange-50 border-l-4 border-orange-500 p-6">
                <div className="flex items-start gap-3">
                  <FaWallet className="text-orange-600 text-xl mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Secure Your Health Records</h3>
                    <p className="text-sm text-gray-700 mb-4">
                      Connect your digital wallet to book appointments and securely store your health records on the blockchain. This ensures privacy and gives you full control of your medical information.
                    </p>
                    <button
                      onClick={handleConnect}
                      className="bg-blue-800 text-white px-6 py-2 rounded hover:bg-blue-900 transition-all font-medium text-sm inline-flex items-center"
                    >
                      <FaWallet className="mr-2" />
                      Connect Wallet to Book
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* About RHU Section */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">ABOUT GENERAL LUNA RHU</h2>
            <div className="h-1 w-24 bg-gradient-to-r from-orange-600 to-blue-800 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <FaHospital className="mr-3 text-orange-600" />
                Our Mission
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Rural Health Unit of General Luna is committed to providing accessible, quality, and equitable health services to all residents. We aim to promote health awareness, prevent diseases, and ensure the well-being of our community through comprehensive primary healthcare programs.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <FaShieldAlt className="mr-3 text-blue-800" />
                Blockchain Technology
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                GenLunaMedChain utilizes blockchain technology to ensure the security, transparency, and integrity of health records. Your medical information is encrypted and stored securely, giving you complete control and ownership of your health data while maintaining privacy.
              </p>
            </div>
          </div>
        </div>

        {/* Programs & Services */}
        <div className="bg-gradient-to-br from-orange-50 to-blue-50 rounded-lg p-8 border-2 border-orange-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">HEALTH PROGRAMS & SERVICES</h2>
            <div className="h-1 w-24 bg-gradient-to-r from-orange-600 to-blue-800 mx-auto mb-4"></div>
            <p className="text-gray-600">Comprehensive healthcare programs for the General Luna community</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg text-center border border-orange-200 hover:shadow-lg transition-all">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaHeartbeat className="text-3xl text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Maternal & Child Health</h3>
              <p className="text-sm text-gray-600">Pre-natal care, immunization, and child health services</p>
            </div>

            <div className="bg-white p-6 rounded-lg text-center border border-blue-200 hover:shadow-lg transition-all">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUserMd className="text-3xl text-blue-800" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Primary Care</h3>
              <p className="text-sm text-gray-600">General consultation, diagnosis, and treatment</p>
            </div>

            <div className="bg-white p-6 rounded-lg text-center border border-orange-200 hover:shadow-lg transition-all">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaStethoscope className="text-3xl text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Disease Prevention</h3>
              <p className="text-sm text-gray-600">Health education and disease control programs</p>
            </div>

            <div className="bg-white p-6 rounded-lg text-center border border-blue-200 hover:shadow-lg transition-all">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCapsules className="text-3xl text-blue-800" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Medicine Assistance</h3>
              <p className="text-sm text-gray-600">Free medicines for indigent and senior citizens</p>
            </div>
          </div>
        </div>

        {/* Call to Action for Non-Connected Users */}
        {!address && (
          <div className="mt-12 bg-gradient-to-r from-orange-500 via-orange-600 to-blue-800 rounded-lg p-8 text-center text-white shadow-lg">
            <h2 className="text-3xl font-bold mb-4">Access Your Digital Health Records</h2>
            
            <button 
              onClick={handleConnect}
              className="bg-white text-orange-600 px-8 py-4 rounded font-bold hover:bg-orange-50 transition-all shadow-lg text-lg inline-flex items-center"
            >
              <FaWallet className="mr-3 text-xl" />
              Connect Wallet Now
            </button>
            <p className="text-sm text-orange-100 mt-4">Secure • Private • Transparent</p>
          </div>
        )}
      </div>

      {/* Government Footer */}
      <footer className="bg-gradient-to-r from-blue-900 to-blue-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4 text-orange-300">RURAL HEALTH UNIT</h3>
              <p className="text-blue-100 text-sm mb-2">Municipality of General Luna</p>
              <p className="text-blue-100 text-sm">Province of Quezon</p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4 text-orange-300">CONTACT INFORMATION</h3>
              <p className="text-blue-100 text-sm mb-2 flex items-center">
                <FaMapMarkerAlt className="mr-2" />
                Brgy. Poblacion, General Luna, Quezon
              </p>
              <p className="text-blue-100 text-sm mb-2 flex items-center">
                <FaPhone className="mr-2" />
                (042) XXX-XXXX
              </p>
              <p className="text-blue-100 text-sm flex items-center">
                <FaEnvelope className="mr-2" />
                rhu.generalluna@quezon.gov.ph
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4 text-orange-300">OFFICE HOURS</h3>
              <p className="text-blue-100 text-sm mb-2">Monday - Friday: 6:00 AM - 5:00 PM</p>
              <p className="text-blue-100 text-sm mb-2">Saturday - Sunday: 6:00 AM - 5:00 PM</p>
              <p className="text-blue-100 text-sm">Sunday & Holidays: Closed</p>
            </div>
          </div>
          <div className="border-t border-blue-700 mt-8 pt-6 text-center">
            <p className="text-blue-200 text-sm">
              © 2024 Rural Health Unit - General Luna, Quezon. All Rights Reserved.
            </p>
            <p className="text-blue-300 text-xs mt-2">
              Powered by GenLunaMedChain Blockchain Technology
            </p>
          </div>
        </div>
      </footer>

      {/* Consultation Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ConsultationBookingForm
              initialDate={selectedDateTime?.date}
              initialTime={selectedDateTime?.time}
              initialProviderType={selectedDateTime?.providerType}
              initialProviderId={selectedDateTime?.providerId}
              initialProviderName={selectedDateTime?.providerName}
              onSuccess={(consultationData) => {
                console.log('Consultation scheduled:', consultationData);
                setShowBookingForm(false);
                setSelectedDateTime(null);
                alert('Consultation scheduled successfully!');
              }}
              onCancel={() => {
                setShowBookingForm(false);
                setSelectedDateTime(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientHome;