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
  FaEnvelope,
  FaTimes,
  FaImage,
  FaUsers
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
  const [showModal, setShowModal] = useState(false);
  const [selectedBarangay, setSelectedBarangay] = useState(null);
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
        <div className="bg-gradient-to-br from-orange-50 to-blue-50 rounded-lg p-8 border-2 border-orange-200 mb-12">
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

        {/* Emergency Hotlines */}
        <div className="bg-white rounded-lg shadow-md border-2 border-red-200 p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-red-600 mb-2">EMERGENCY HOTLINES</h2>
            <div className="h-1 w-24 bg-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Important contact numbers for emergency situations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded">
              <h3 className="text-lg font-bold text-gray-900 mb-2">MDRRMO</h3>
              <a href="tel:09122711874" className="text-2xl font-bold text-red-600 hover:text-red-700">0912-271-1874</a>
            </div>
            <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded">
              <h3 className="text-lg font-bold text-gray-900 mb-2">AMBULANCE</h3>
              <a href="tel:09303270985" className="text-2xl font-bold text-red-600 hover:text-red-700">0930-327-0985</a>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded">
              <h3 className="text-lg font-bold text-gray-900 mb-2">BFP</h3>
              <a href="tel:09389432902" className="text-2xl font-bold text-blue-600 hover:text-blue-700">0938-943-2902</a>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded">
              <h3 className="text-lg font-bold text-gray-900 mb-2">PNP</h3>
              <a href="tel:09085985750" className="text-2xl font-bold text-blue-600 hover:text-blue-700">0908-598-5750</a>
            </div>
            <div className="bg-orange-50 border-l-4 border-orange-600 p-6 rounded">
              <h3 className="text-lg font-bold text-gray-900 mb-2">RHU</h3>
              <a href="tel:09958972263" className="text-2xl font-bold text-orange-600 hover:text-orange-700">0995-897-2263</a>
            </div>
            <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded">
              <h3 className="text-lg font-bold text-gray-900 mb-2">MSWDO</h3>
              <a href="tel:09099316797" className="text-2xl font-bold text-green-600 hover:text-green-700">0909-931-6797</a>
            </div>
          </div>
        </div>

        {/* Barangay Profiles */}
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-blue-50 rounded-2xl p-8 border-2 border-orange-200 mb-12 shadow-lg">
          {/* Decorative Background Pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-200 to-blue-200 rounded-full opacity-20 blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-200 to-orange-200 rounded-full opacity-20 blur-3xl -ml-32 -mb-32"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-10">
              <div className="inline-block bg-gradient-to-r from-orange-500 to-blue-700 text-white px-6 py-2 rounded-full text-xs font-bold mb-4 shadow-md">
                COMMUNITY PROFILES
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-3">
                THE 27 BARANGAYS OF GENERAL LUNA
              </h2>
              <div className="h-1.5 w-32 bg-gradient-to-r from-orange-500 via-orange-400 to-blue-700 mx-auto mb-4 rounded-full"></div>
              <p className="text-gray-600 text-lg">Serving communities across all barangays of General Luna, Quezon</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[
                { name: 'Bacong Ibaba', area: '650.07 ha', pop: '1,712 (2020)', households: '420 (2020)', image: 'Bacong-Ibaba.png' },
                { name: 'Bacong Ilaya', area: '851.75 ha', pop: '1,695 (2020)', households: '429 (2020)', image: 'Bacong-Ilaya.png' },
                { name: 'Poblacion 1', area: '4.42 ha', pop: '517 (2020)', households: '119 (2020)', image: 'Barangay-1.png' },
                { name: 'Poblacion 2', area: '3.75 ha', pop: '335 (2020)', households: '88 (2020)', image: 'Brgy-2.png' },
                { name: 'Poblacion 3', area: '3.68 ha', pop: '451 (2020)', households: '107 (2020)', image: 'Brgy-3.png' },
                { name: 'Poblacion 4', area: '3.61 ha', pop: '129 (2020)', households: '33 (2020)', image: 'Brgy-4.png' },
                { name: 'Poblacion 5', area: '1.9 ha', pop: '174 (2020)', households: '44 (2020)', image: 'Brgy-5.png' },
                { name: 'Poblacion 6', area: '1.69 ha', pop: '287 (2020)', households: '70 (2020)', image: 'Brgy-6.png' },
                { name: 'Poblacion 7', area: '29.17 ha', pop: '846 (2020)', households: '246 (2020)', image: 'Barangay-7.png' },
                { name: 'Poblacion 8', area: '12.11 ha', pop: '1,301 (2020)', households: '323 (2020)', image: 'Brgy-8.png' },
                { name: 'Poblacion 9', area: '1.31 ha', pop: '202 (2020)', households: '48 (2020)', image: 'Brgy-9.png' },
                { name: 'Lavides', area: '1,227.17 ha', pop: '513 (2020)', households: '124 (2020)', image: 'Lavides.png' },
                { name: 'Magsaysay', area: '337.41 ha', pop: '761 (2020)', households: '188 (2020)', image: 'Magsaysay.png' },
                { name: 'Malaya', area: '615.20 ha', pop: '1,783 (2020)', households: '400 (2020)', image: 'Malaya.png' },
                { name: 'Nieva', area: '337.30 ha', pop: '1,330 (2020)', households: '334 (2020)', image: 'Nieva.png' },
                { name: 'Recto', area: '599.67 ha', pop: '659 (2020)', households: '146 (2020)', image: 'Recto.png' },
                { name: 'San Ignacio Ibaba', area: '405.79 ha', pop: '924 (2020)', households: '234 (2020)', image: 'San-Ignacio-Ibaba.png' },
                { name: 'San Ignacio Ilaya', area: '440.74 ha', pop: '571 (2020)', households: '146 (2020)', image: 'San-Ignacio-Ilaya.png' },
                { name: 'San Isidro Ibaba', area: '338.42 ha', pop: '1,398 (2020)', households: '347 (2020)', image: 'San-Isidro-Ibaba.jpg' },
                { name: 'San Isidro Ilaya', area: '707.96 ha', pop: '2,835 (2020)', households: '678 (2020)', image: 'San-Isidro-Ilaya.png' },
                { name: 'San Jose', area: '415.33 ha', pop: '2,326 (2020)', households: '554 (2020)', image: 'San-Jose.png' },
                { name: 'San Nicolas', area: '278.07 ha', pop: '1,033 (2020)', households: '257 (2020)', image: 'San-Nicolas.png' },
                { name: 'Sta. Maria Magdalena', area: '540.41 ha', pop: '1,083 (2020)', households: '262 (2020)', image: 'Santa-Maria-Ibaba.jpg' },
                { name: 'Sta. Maria Ilaya', area: '547.59 ha', pop: '245 (2020)', households: '62 (2020)', image: 'Santa-Maria-Ilaya.png' },
                { name: 'San Vicente', area: '487.83 ha', pop: '1,010 (2020)', households: '265 (2020)', image: 'San-Vicente.png' },
                { name: 'Sumilang', area: '529.19 ha', pop: '801 (2020)', households: '183 (2020)', image: 'Sumilang.png' },
                { name: 'Villarica', area: '287.26 ha', pop: '632 (2020)', households: '160 (2020)', image: 'Villarica.png' }
              ].map((barangay, index) => (
                <div 
                  key={index} 
                  className="group relative bg-white rounded-xl border-2 border-orange-100 hover:border-orange-400 overflow-hidden cursor-pointer transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-2xl"
                  onClick={() => {
                    setSelectedBarangay(barangay);
                    setShowModal(true);
                  }}
                >
                  {/* Card Header with Gradient */}
                  <div className="bg-gradient-to-r from-orange-500 to-blue-700 p-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    <h3 className="font-bold text-white text-base relative z-10 flex items-center justify-between">
                      <span>{barangay.name}</span>
                      <FaMapMarkerAlt className="text-orange-200 group-hover:scale-125 transition-transform" />
                    </h3>
                  </div>
                  
                  {/* Card Body */}
                  <div className="p-4 bg-gradient-to-br from-white to-orange-50">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <FaMapMarkerAlt className="text-orange-600 text-xs" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-600">Land Area</p>
                          <p className="text-sm font-bold text-gray-900">{barangay.area}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <FaUsers className="text-blue-700 text-xs" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-600">Population</p>
                          <p className="text-sm font-bold text-gray-900">{barangay.pop}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <FaHospital className="text-orange-600 text-xs" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-600">Households</p>
                          <p className="text-sm font-bold text-gray-900">{barangay.households}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* View Button */}
                    <div className="mt-4 pt-4 border-t border-orange-100">
                      <div className="flex items-center justify-center gap-2 text-blue-700 group-hover:text-orange-600 transition-colors font-semibold text-sm">
                        <FaImage className="group-hover:scale-110 transition-transform" />
                        <span>View Barangay Map</span>
                        <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-orange-400 rounded-xl pointer-events-none transition-all duration-300"></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Barangay Image Modal */}
          {showModal && selectedBarangay && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col transform animate-slideUp">
                {/* Modal Header with Gradient */}
                <div className="relative bg-gradient-to-r from-orange-500 via-orange-600 to-blue-700 p-6 overflow-hidden">
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                      backgroundSize: '30px 30px'
                    }}></div>
                  </div>
                  <div className="relative flex justify-between items-start">
                    <div className="flex-1">
                      <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white mb-2">
                        BARANGAY PROFILE
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <FaMapMarkerAlt className="text-orange-200" />
                        {selectedBarangay.name}
                      </h3>
                      <p className="text-orange-100 text-sm">General Luna, Quezon Province</p>
                    </div>
                    <button 
                      onClick={() => setShowModal(false)}
                      className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:rotate-90 transition-all duration-300 ml-4 flex-shrink-0"
                    >
                      <FaTimes size={20} />
                    </button>
                  </div>
                </div>
                
                {/* Modal Body */}
                <div className="flex-grow overflow-auto bg-gradient-to-br from-orange-50 via-white to-blue-50">
                  {/* Image Container */}
                  <div className="p-8">
                    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-200">
                      <div className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden min-h-[400px] relative">
                        <img 
                          src={`/img/${selectedBarangay.image}`} 
                          alt={`${selectedBarangay.name} map`} 
                          className="w-full h-auto object-contain max-h-[60vh]"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = logo;
                          }}
                        />
                        {/* Image Overlay Corner Badge */}
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-blue-700 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                          Barangay Map
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Statistics Cards */}
                  <div className="px-8 pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Land Area Card */}
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <FaMapMarkerAlt className="text-2xl" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-orange-100 uppercase tracking-wide">Land Area</p>
                            <p className="text-2xl font-bold">{selectedBarangay.area}</p>
                          </div>
                        </div>
                        <div className="h-1 w-full bg-white/30 rounded-full overflow-hidden">
                          <div className="h-full bg-white rounded-full w-3/4"></div>
                        </div>
                      </div>
                      
                      {/* Population Card */}
                      <div className="bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <FaUsers className="text-2xl" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-blue-100 uppercase tracking-wide">Population</p>
                            <p className="text-2xl font-bold">{selectedBarangay.pop}</p>
                          </div>
                        </div>
                        <div className="h-1 w-full bg-white/30 rounded-full overflow-hidden">
                          <div className="h-full bg-white rounded-full w-2/3"></div>
                        </div>
                      </div>
                      
                      {/* Households Card */}
                      <div className="bg-gradient-to-br from-orange-600 to-blue-700 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <FaHospital className="text-2xl" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-orange-100 uppercase tracking-wide">Households</p>
                            <p className="text-2xl font-bold">{selectedBarangay.households}</p>
                          </div>
                        </div>
                        <div className="h-1 w-full bg-white/30 rounded-full overflow-hidden">
                          <div className="h-full bg-white rounded-full w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Modal Footer */}
                <div className="border-t-2 border-orange-200 bg-white p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">Census Data: 2020</span>
                    </div>
                    <button
                      onClick={() => setShowModal(false)}
                      className="bg-gradient-to-r from-orange-500 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 group"
                    >
                      Close
                      <FaTimes className="group-hover:rotate-90 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
          .animate-slideUp {
            animation: slideUp 0.4s ease-out;
          }
        `}</style>

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

      {/* Government Links Section */}
      <div className="bg-gradient-to-br from-white via-orange-50 to-blue-50 py-16 border-t-4 border-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block bg-gradient-to-r from-orange-500 to-blue-700 text-white px-6 py-2 rounded-full text-xs font-bold mb-4 shadow-md">
              PARTNER AGENCIES
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-3">GOVERNMENT LINKS</h2>
            <div className="h-1.5 w-32 bg-gradient-to-r from-orange-500 via-orange-400 to-blue-700 mx-auto mb-4 rounded-full"></div>
            <p className="text-gray-600 text-lg">Official government agencies serving the Filipino people</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 items-center justify-items-center">
            {[
              { url: 'https://gsis.gov.ph', img: 'GSIS.png', name: 'GSIS' },
              { url: 'https://sss.gov.ph', img: 'SSS.png', name: 'SSS' },
              { url: 'https://dole.gov.ph', img: 'DOLE.png', name: 'DOLE' },
              { url: 'https://pagibigfund.gov.ph', img: 'PAGIBIG.png', name: 'Pag-IBIG' },
              { url: 'https://philhealth.gov.ph', img: 'PHIL-HEALTH.png', name: 'PhilHealth' },
              { url: 'https://dilg.gov.ph', img: 'DILG.png', name: 'DILG' },
              { url: 'https://quezon.gov.ph', img: 'QUEZON-PROVINCE.png', name: 'Quezon Province' },
              { url: 'https://op-proper.gov.ph', img: 'OFFICE-OF-THE-PRESIDENT.png', name: 'Office of the President' },
              { url: 'https://gazette.gov.ph', img: 'GAZETTE.png', name: 'Official Gazette' }
            ].map((link, index) => (
              <a 
                key={index}
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group relative bg-white p-6 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:scale-110 border-2 border-orange-100 hover:border-orange-400 w-full max-w-[160px]"
              >
                <div className="relative">
                  <img 
                    src={`/img/${link.img}`} 
                    alt={link.name} 
                    className="h-20 w-auto mx-auto object-contain transition-all duration-300 group-hover:scale-110" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = logo;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-500 to-transparent opacity-0 group-hover:opacity-10 rounded-lg transition-opacity"></div>
                </div>
                <p className="text-xs font-semibold text-gray-700 text-center mt-3 group-hover:text-orange-600 transition-colors">{link.name}</p>
                
                {/* Hover Effect Border */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-orange-400 rounded-xl pointer-events-none transition-all duration-300"></div>
              </a>
            ))}
          </div>
          
          {/* Additional Info Section */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-md border border-orange-200">
              <FaLink className="text-orange-600" />
              <span className="text-sm font-medium text-gray-700">Click any logo to visit the official government website</span>
            </div>
          </div>
        </div>
      </div>

      {/* Government Footer */}
      <footer className="bg-gradient-to-r from-blue-900 to-blue-800 text-white mt-0">
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