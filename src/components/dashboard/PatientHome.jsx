// src/components/dashboard/PatientHome.jsx
import React, { useState } from 'react';
import { useRole } from '../auth/RoleProvider';
import { Link, useNavigate } from 'react-router-dom';
import { useConnect, useDisconnect, useAddress, metamaskWallet } from "@thirdweb-dev/react";
import MedicineList from '../medicine/MedicineList';
import ConsultationBookingForm from '../consultation/ConsultationBookingForm';
import AvailabilityCalendar from '../consultation/AvailabilityCalendar';

// Import all images
import logo from "../../img/logo.png";
// Government logos
import GSIS from "../../img/GSIS.png";
import SSS from "../../img/SSS.png";
import DOLE from "../../img/DOLE.png";
import PAGIBIG from "../../img/PAGIBIG.png";
import PHILHEALTH from "../../img/PHIL-HEALTH.png";
import DILG from "../../img/DILG.png";
import QUEZON from "../../img/QUEZON-PROVINCE.png";
import PRESIDENT from "../../img/OFFICE-OF-THE-PRESIDENT.png";
import GAZETTE from "../../img/GAZETTE.png";

// Hero landing image
import landingPage from "../../img/LandingPages.png";

// Barangay images
import BacongIbaba from "../../img/Bacong-Ibaba.png";
import BacongIlaya from "../../img/Bacong-Ilaya.png";
import Barangay1 from "../../img/Barangay-1.png";
import Barangay7 from "../../img/Barangay-7.png";
import Brgy2 from "../../img/Brgy-2.png";
import Brgy3 from "../../img/Brgy-3.png";
import Brgy4 from "../../img/Brgy-4.png";
import Brgy5 from "../../img/Brgy-5.png";
import Brgy6 from "../../img/Brgy-6.png";
import Brgy8 from "../../img/Brgy-8.png";
import Brgy9 from "../../img/Brgy-9.png";
import Lavides from "../../img/Lavides.png";
import Magsaysay from "../../img/Magsaysay.png";
import Malaya from "../../img/Malaya.png";
import Nieva from "../../img/Nieva.png";
import Recto from "../../img/Recto.png";
import SanIgnacioIbaba from "../../img/San-Ignacio-Ibaba.png";
import SanIgnacioIlaya from "../../img/San-Ignacio-Ilaya.png";
import SanIsidroIbaba from "../../img/San-Isidro-Ibaba.jpg";
import SanIsidroIlaya from "../../img/San-Isidro-Ilaya.png";
import SanJose from "../../img/San-Jose.png";
import SanNicolas from "../../img/San-Nicolas.png";
import SanVicente from "../../img/San-Vicente.png";
import SantaMariaIbaba from "../../img/Santa-Maria-Ibaba.jpg";
import SantaMariaIlaya from "../../img/Santa-Maria-Ilaya.png";
import Sumilang from "../../img/Sumilang.png";
import Villarica from "../../img/Villarica.png";

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
  FaUsers,
  FaChevronDown,
  FaSearch,
  FaExclamationTriangle
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
  const [expandedSection, setExpandedSection] = useState(null);
  const [showEmergency, setShowEmergency] = useState(false);
  const [barangaySearch, setBarangaySearch] = useState('');
  const navigate = useNavigate();

  // Wallet connection hooks
  const connect = useConnect();
  const disconnect = useDisconnect();
  const address = useAddress();
  const metamask = metamaskWallet();

  // Barangay data
  const barangays = [
    { name: 'Bacong Ibaba', area: '650.07 ha', pop: '1,712 (2020)', households: '420 (2020)', image: BacongIbaba },
    { name: 'Bacong Ilaya', area: '851.75 ha', pop: '1,695 (2020)', households: '429 (2020)', image: BacongIlaya },
    { name: 'Poblacion 1', area: '4.42 ha', pop: '517 (2020)', households: '119 (2020)', image: Barangay1 },
    { name: 'Poblacion 2', area: '3.75 ha', pop: '335 (2020)', households: '88 (2020)', image: Brgy2 },
    { name: 'Poblacion 3', area: '3.68 ha', pop: '451 (2020)', households: '107 (2020)', image: Brgy3 },
    { name: 'Poblacion 4', area: '3.61 ha', pop: '129 (2020)', households: '33 (2020)', image: Brgy4 },
    { name: 'Poblacion 5', area: '1.9 ha', pop: '174 (2020)', households: '44 (2020)', image: Brgy5 },
    { name: 'Poblacion 6', area: '1.69 ha', pop: '287 (2020)', households: '70 (2020)', image: Brgy6 },
    { name: 'Poblacion 7', area: '29.17 ha', pop: '846 (2020)', households: '246 (2020)', image: Barangay7 },
    { name: 'Poblacion 8', area: '12.11 ha', pop: '1,301 (2020)', households: '323 (2020)', image: Brgy8 },
    { name: 'Poblacion 9', area: '1.31 ha', pop: '202 (2020)', households: '48 (2020)', image: Brgy9 },
    { name: 'Lavides', area: '1,227.17 ha', pop: '513 (2020)', households: '124 (2020)', image: Lavides },
    { name: 'Magsaysay', area: '337.41 ha', pop: '761 (2020)', households: '188 (2020)', image: Magsaysay },
    { name: 'Malaya', area: '615.20 ha', pop: '1,783 (2020)', households: '400 (2020)', image: Malaya },
    { name: 'Nieva', area: '337.30 ha', pop: '1,330 (2020)', households: '334 (2020)', image: Nieva },
    { name: 'Recto', area: '599.67 ha', pop: '659 (2020)', households: '146 (2020)', image: Recto },
    { name: 'San Ignacio Ibaba', area: '405.79 ha', pop: '924 (2020)', households: '234 (2020)', image: SanIgnacioIbaba },
    { name: 'San Ignacio Ilaya', area: '440.74 ha', pop: '571 (2020)', households: '146 (2020)', image: SanIgnacioIlaya },
    { name: 'San Isidro Ibaba', area: '338.42 ha', pop: '1,398 (2020)', households: '347 (2020)', image: SanIsidroIbaba },
    { name: 'San Isidro Ilaya', area: '707.96 ha', pop: '2,835 (2020)', households: '678 (2020)', image: SanIsidroIlaya },
    { name: 'San Jose', area: '415.33 ha', pop: '2,326 (2020)', households: '554 (2020)', image: SanJose },
    { name: 'San Nicolas', area: '278.07 ha', pop: '1,033 (2020)', households: '257 (2020)', image: SanNicolas },
    { name: 'Sta. Maria Magdalena', area: '540.41 ha', pop: '1,083 (2020)', households: '262 (2020)', image: SantaMariaIbaba },
    { name: 'Sta. Maria Ilaya', area: '547.59 ha', pop: '245 (2020)', households: '62 (2020)', image: SantaMariaIlaya },
    { name: 'San Vicente', area: '487.83 ha', pop: '1,010 (2020)', households: '265 (2020)', image: SanVicente },
    { name: 'Sumilang', area: '529.19 ha', pop: '801 (2020)', households: '183 (2020)', image: Sumilang },
    { name: 'Villarica', area: '287.26 ha', pop: '632 (2020)', households: '160 (2020)', image: Villarica }
  ];

  // Filter barangays based on search
  const filteredBarangays = barangays.filter(brgy =>
    brgy.name.toLowerCase().includes(barangaySearch.toLowerCase())
  );

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div>Republic of the Philippines</div>
          <div className="flex gap-4">
            <span className="hidden sm:inline">Province of Quezon</span>
            <span>Municipality of General Luna</span>
          </div>
        </div>
      </div>

      {/* Sticky Navigation - REDUCED HEIGHT */}
      <nav className="bg-white shadow-md border-b-4 border-blue-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="General Luna Logo" className="h-12 w-12 object-contain" />
              <div>
                <h1 className="text-base font-bold text-gray-900">RURAL HEALTH UNIT</h1>
                <p className="text-xs text-orange-600 font-semibold">GenLunaMedChain Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {address ? (
                <>
                  <div className="bg-green-50 border border-green-300 rounded px-3 py-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-green-700 hidden sm:inline">
                        {address.slice(0, 6)}...{address.slice(-4)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-all font-medium text-xs"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnect}
                  className="bg-blue-800 text-white px-4 py-2 rounded hover:bg-blue-900 transition-all font-semibold text-xs flex items-center"
                >
                  <FaWallet className="mr-1" />
                  <span className="hidden sm:inline">Connect Wallet</span>
                  <span className="sm:hidden">Connect</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* COMPACT Hero Banner with Background Image */}
      <div className="relative text-white overflow-hidden min-h-[500px] md:min-h-[600px]">
        {/* Background Image with Gradient Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${landingPage})`,
            backgroundPosition: 'center center',
          }}
        >
          {/* Gradient Overlay - Orange to Blue with LESS opacity for more visible image */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/70 via-orange-600/60 to-blue-800/70"></div>
          
          {/* Decorative Pattern Overlay - Reduced opacity */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }}></div>
          </div>
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center md:text-left mb-8">
            <div className="inline-block bg-white text-orange-600 px-4 py-2 rounded-full text-xs font-bold mb-4 shadow-lg">
              OFFICIAL GOVERNMENT SERVICE
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-2xl">
              Welcome to General Luna RHU
            </h1>
            <p className="text-lg md:text-xl text-white drop-shadow-xl font-medium">
              "Masaya, Maunlad, Maaasahan at Nagkakaisang Bayan ng General Luna"
            </p>
          </div>

          {/* COMPACT Info Cards - Horizontal on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-8">
            <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-lg p-4 flex items-center gap-3 shadow-lg">
              <FaMapMarkerAlt className="text-2xl flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">Brgy. Poblacion, General Luna</p>
              </div>
            </div>

            <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-lg p-4 flex items-center gap-3 shadow-lg">
              <FaPhone className="text-2xl flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">0995-897-2263</p>
              </div>
            </div>

            <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-lg p-4 flex items-center gap-3 shadow-lg">
              <FaClock className="text-2xl flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">Mon-Sun: 6AM - 5PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PROMINENT Quick Action Cards - Moved to TOP with negative margin */}
      <div className="max-w-7xl mx-auto px-4 -mt-4 relative z-10 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Book Consultation */}
          <button
            onClick={() => setShowBookingForm(true)}
            className="bg-white rounded-lg shadow-lg border-2 border-blue-200 p-5 hover:shadow-xl hover:border-blue-400 transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                <FaVideo className="text-2xl text-blue-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg mb-1">Book Consultation</h3>
                <p className="text-xs text-gray-600">Online doctor consultation</p>
              </div>
            </div>
          </button>

          {/* View Medicines */}
          <button
            onClick={() => setActiveSection('medicines')}
            className="bg-white rounded-lg shadow-lg border-2 border-orange-200 p-5 hover:shadow-xl hover:border-orange-400 transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                <FaCapsules className="text-2xl text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg mb-1">View Medicines</h3>
                <p className="text-xs text-gray-600">Check medicine inventory</p>
              </div>
            </div>
          </button>

          {/* View Schedule */}
          <button
            onClick={handleViewCalendar}
            className="bg-white rounded-lg shadow-lg border-2 border-blue-200 p-5 hover:shadow-xl hover:border-blue-400 transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                <FaCalendarAlt className="text-2xl text-blue-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg mb-1">View Schedule</h3>
                <p className="text-xs text-gray-600">Doctor availability times</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        
        {/* Dashboard for Connected Users */}
        {isWalletConnected && activeSection === 'home' && (
          <div className="mb-8 bg-orange-50 rounded-lg p-6 border-2 border-orange-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Personal Health Records</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PatientAppointmentCard />
              <PatientPrescriptionCard />
              <ConsultationCard onScheduleConsultation={() => setShowBookingForm(true)} />
            </div>
          </div>
        )}

        {/* Medicine Inventory Section */}
        {activeSection === 'medicines' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">RHU Medicine Inventory</h2>
                <p className="text-gray-600 text-sm mt-1">Available medicines at General Luna Rural Health Unit</p>
              </div>
              <button
                onClick={() => setActiveSection('home')}
                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 font-medium flex items-center text-sm"
              >
                <FaArrowRight className="mr-2 rotate-180" />
                Back
              </button>
            </div>
            <MedicineInventoryCard>
              <MedicineList isPatientView={true} />
            </MedicineInventoryCard>
          </div>
        )}

        {/* Availability Calendar Section */}
        {activeSection === 'calendar' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Doctor's Consultation Schedule</h2>
                <p className="text-gray-600 text-sm mt-1">Select your preferred date and time</p>
              </div>
              <button
                onClick={() => setActiveSection('home')}
                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 font-medium flex items-center text-sm"
              >
                <FaArrowRight className="mr-2 rotate-180" />
                Back
              </button>
            </div>
            
            <AvailabilityCalendar 
              onTimeSlotSelect={handleTimeSlotSelect}
            />
            
            {!address && (
              <div className="mt-4 bg-orange-50 border-l-4 border-orange-500 p-4">
                <div className="flex items-start gap-3">
                  <FaWallet className="text-orange-600 text-lg mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 text-sm">Secure Your Health Records</h3>
                    <p className="text-xs text-gray-700 mb-3">
                      Connect your wallet to book appointments and securely store your health records.
                    </p>
                    <button
                      onClick={handleConnect}
                      className="bg-blue-800 text-white px-4 py-2 rounded hover:bg-blue-900 transition-all font-medium text-xs inline-flex items-center"
                    >
                      <FaWallet className="mr-2" />
                      Connect Wallet
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Show home sections only when on home */}
        {activeSection === 'home' && (
          <>
            {/* COMPACT Health Programs - 4 column grid */}
            <HealthServicesSection />

            {/* COLLAPSIBLE Barangay Section */}
            <div className="mb-8">
              <button
                onClick={() => setExpandedSection(expandedSection === 'barangay' ? null : 'barangay')}
                className="w-full bg-white rounded-lg shadow-md border-2 border-orange-200 p-5 hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-left">
                    <div className="bg-gradient-to-r from-orange-500 to-blue-700 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FaMapMarkerAlt className="text-xl text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">27 Barangays of General Luna</h2>
                      <p className="text-xs text-gray-600">Click to view community profiles</p>
                    </div>
                  </div>
                  <FaChevronDown className={`text-xl text-gray-400 transition-transform ${expandedSection === 'barangay' ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {expandedSection === 'barangay' && (
                <div className="mt-4 bg-white rounded-lg border-2 border-orange-200 p-5">
                  {/* Search Bar */}
                  <div className="mb-4">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search barangay..."
                        value={barangaySearch}
                        onChange={(e) => setBarangaySearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {/* Barangay Grid - COMPACT */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-96 overflow-y-auto">
                    {filteredBarangays.map((barangay, index) => (
                      <div 
                        key={index}
                        className="bg-gradient-to-br from-white to-orange-50 rounded-lg border-2 border-orange-100 hover:border-orange-400 p-3 cursor-pointer hover:shadow-lg transition-all"
                        onClick={() => {
                          setSelectedBarangay(barangay);
                          setShowModal(true);
                        }}
                      >
                        <div className="bg-gradient-to-r from-orange-500 to-blue-700 text-white p-2 rounded-lg mb-2">
                          <h3 className="font-bold text-xs text-center">{barangay.name}</h3>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-900 font-medium">Pop:</span>
                            <span className="font-semibold text-gray-900">{barangay.pop.split(' ')[0]}</span>
                          </div>
                          <div className="text-center text-blue-700 font-semibold text-xs flex items-center justify-center gap-1 mt-2">
                            <FaImage />
                            <span>View Map</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* COMPACT About & Mission */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
                    <FaHospital className="mr-2 text-orange-600" />
                    Our Mission
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Providing accessible, quality, and equitable health services to all residents through comprehensive primary healthcare programs.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
                    <FaShieldAlt className="mr-2 text-blue-800" />
                    Blockchain Technology
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    GenLunaMedChain ensures security, transparency, and integrity of health records with encrypted blockchain storage.
                  </p>
                </div>
              </div>
            </div>

            {/* Call to Action for Non-Connected Users */}
            {!address && (
              <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-blue-800 rounded-lg p-6 text-center text-white shadow-lg mb-8">
                <h2 className="text-2xl font-bold mb-3">Access Your Digital Health Records</h2>
                <button 
                  onClick={handleConnect}
                  className="bg-white text-orange-600 px-6 py-3 rounded font-bold hover:bg-orange-50 transition-all shadow-lg text-base inline-flex items-center"
                >
                  <FaWallet className="mr-2 text-lg" />
                  Connect Wallet Now
                </button>
                <p className="text-xs text-orange-100 mt-3">Secure • Private • Transparent</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* COMPACT Footer with Government Links */}
      <footer className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Government Links - Horizontal Scroll */}
          <div className="mb-6">
            <h3 className="text-center text-xs font-bold text-orange-300 mb-3">PARTNER GOVERNMENT AGENCIES</h3>
            <div className="flex overflow-x-auto gap-4 pb-4 justify-center items-center">
              {[
                { url: 'https://gsis.gov.ph', img: GSIS, name: 'GSIS' },
                { url: 'https://sss.gov.ph', img: SSS, name: 'SSS' },
                { url: 'https://dole.gov.ph', img: DOLE, name: 'DOLE' },
                { url: 'https://pagibigfund.gov.ph', img: PAGIBIG, name: 'Pag-IBIG' },
                { url: 'https://philhealth.gov.ph', img: PHILHEALTH, name: 'PhilHealth' },
                { url: 'https://dilg.gov.ph', img: DILG, name: 'DILG' },
                { url: 'https://quezon.gov.ph', img: QUEZON, name: 'Quezon' },
                { url: 'https://op-proper.gov.ph', img: PRESIDENT, name: 'OP' },
                { url: 'https://gazette.gov.ph', img: GAZETTE, name: 'Gazette' }
              ].map((link, index) => (
                <a 
                  key={index}
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex-shrink-0 bg-white rounded-lg p-3 w-16 h-16 flex items-center justify-center hover:scale-110 transition-transform"
                  title={link.name}
                >
                  <img 
                    src={link.img} 
                    alt={link.name} 
                    className="h-full w-full object-contain" 
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Footer Info - Compact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs border-t border-blue-700 pt-4">
            <div>
              <h4 className="font-bold text-orange-300 mb-1">RHU General Luna</h4>
              <p className="text-blue-100">Municipality of General Luna, Quezon</p>
            </div>
            <div>
              <h4 className="font-bold text-orange-300 mb-1">Contact</h4>
              <p className="text-blue-100 flex items-center gap-1">
                <FaPhone className="text-xs" />
                0995-897-2263
              </p>
              <p className="text-blue-100 flex items-center gap-1">
                <FaEnvelope className="text-xs" />
                rhu.generalluna@quezon.gov.ph
              </p>
            </div>
            <div>
              <h4 className="font-bold text-orange-300 mb-1">Office Hours</h4>
              <p className="text-blue-100">Mon-Sun: 6:00 AM - 5:00 PM</p>
            </div>
          </div>

          <div className="text-center mt-4 pt-4 border-t border-blue-700">
            <p className="text-blue-200 text-xs">© 2024 RHU General Luna, Quezon. All Rights Reserved.</p>
            <p className="text-blue-300 text-xs mt-1">Powered by GenLunaMedChain Blockchain</p>
          </div>
        </div>
      </footer>

      {/* Floating Emergency Hotlines Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowEmergency(!showEmergency)}
          className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-2xl transform hover:scale-110 transition-all animate-pulse"
          title="Emergency Hotlines"
        >
          <FaPhone className="text-2xl" />
        </button>
        
        {showEmergency && (
          <div className="absolute bottom-20 right-0 bg-white rounded-lg shadow-2xl border-2 border-red-500 p-4 w-72">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-red-600 flex items-center gap-2 text-sm">
                <FaExclamationTriangle />
                Emergency Hotlines
              </h3>
              <button 
                onClick={() => setShowEmergency(false)} 
                className="text-gray-700 hover:text-gray-900"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <a href="tel:09122711874" className="flex justify-between hover:bg-red-50 p-2 rounded transition-colors">
                <span className="font-medium text-gray-900">MDRRMO</span>
                <span className="text-red-600 font-semibold">0912-271-1874</span>
              </a>
              <a href="tel:09303270985" className="flex justify-between hover:bg-red-50 p-2 rounded transition-colors">
                <span className="font-medium text-gray-900">Ambulance</span>
                <span className="text-red-600 font-semibold">0930-327-0985</span>
              </a>
              <a href="tel:09389432902" className="flex justify-between hover:bg-blue-50 p-2 rounded transition-colors">
                <span className="font-medium text-gray-900">BFP</span>
                <span className="text-blue-600 font-semibold">0938-943-2902</span>
              </a>
              <a href="tel:09085985750" className="flex justify-between hover:bg-blue-50 p-2 rounded transition-colors">
                <span className="font-medium text-gray-900">PNP</span>
                <span className="text-blue-600 font-semibold">0908-598-5750</span>
              </a>
              <a href="tel:09958972263" className="flex justify-between hover:bg-orange-50 p-2 rounded transition-colors">
                <span className="font-medium text-gray-900">RHU</span>
                <span className="text-orange-600 font-semibold">0995-897-2263</span>
              </a>
              <a href="tel:09099316797" className="flex justify-between hover:bg-green-50 p-2 rounded transition-colors">
                <span className="font-medium text-gray-900">MSWDO</span>
                <span className="text-green-600 font-semibold">0909-931-6797</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Barangay Image Modal */}
      {showModal && selectedBarangay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-orange-500 via-orange-600 to-blue-700 p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="inline-block bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-white mb-1">
                    BARANGAY PROFILE
                  </div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <FaMapMarkerAlt />
                    {selectedBarangay.name}
                  </h3>
                  <p className="text-orange-100 text-xs">General Luna, Quezon Province</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:rotate-90 transition-all duration-300"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="flex-grow overflow-auto bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4">
              {/* Image Container */}
              <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-orange-200 mb-4">
                <div className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden min-h-[300px] relative">
                  <img 
                    src={selectedBarangay.image}
                    alt={`${selectedBarangay.name} map`} 
                    className="w-full h-auto object-contain max-h-[50vh]"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = logo;
                    }}
                  />
                </div>
              </div>
              
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <FaMapMarkerAlt className="text-lg" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-orange-100">Land Area</p>
                      <p className="text-xl font-bold">{selectedBarangay.area}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <FaUsers className="text-lg" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-blue-100">Population</p>
                      <p className="text-xl font-bold">{selectedBarangay.pop}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-600 to-blue-700 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <FaHospital className="text-lg" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-orange-100">Households</p>
                      <p className="text-xl font-bold">{selectedBarangay.households}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="border-t-2 border-orange-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Census Data: 2020</span>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gradient-to-r from-orange-500 to-blue-700 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 text-sm"
                >
                  Close
                  <FaTimes />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Animations */}
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
    </div>
  );
};

export default PatientHome;