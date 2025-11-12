import React, { useState } from 'react';
import { FaHeartbeat, FaUserMd, FaStethoscope, FaCapsules, FaTimes, FaBaby, FaBed, FaSyringe, FaDog, FaClipboardCheck, FaBrain, FaClock, FaCheckCircle } from 'react-icons/fa';

const HealthServicesSection = () => {
  const [selectedService, setSelectedService] = useState(null);

  const healthServices = [
    {
      id: 1,
      icon: FaHeartbeat,
      title: 'Maternal & Child',
      color: 'orange',
      description: 'Comprehensive care for mothers and children',
      programs: [
        {
          name: 'Newborn Screening',
          icon: FaBaby,
          details: 'Free screening for all newborns to detect genetic and metabolic disorders early',
          services: [
            'Blood spot screening within 24-48 hours after birth',
            'Detection of 28+ disorders including PKU, hypothyroidism, CAH',
            'Free follow-up consultations and confirmatory tests',
            'Health education and counseling for parents'
          ],
          schedule: 'Available daily, 7:00 AM - 4:00 PM',
          requirements: ['Birth certificate or hospital discharge slip', 'PhilHealth ID (if available)', 'Valid ID of parent/guardian']
        },
        {
          name: 'Lying-In Services',
          icon: FaBed,
          details: 'Safe and comfortable birthing facility with 24/7 medical support',
          services: [
            'Pre-natal check-ups and monitoring',
            'Normal spontaneous delivery',
            'Post-partum care and monitoring',
            'Breastfeeding support and education',
            'Family planning counseling'
          ],
          schedule: '24/7 Emergency services available',
          requirements: ['Pre-natal records', 'PhilHealth MDR form', 'Valid ID', 'Birth plan (if available)']
        },
        {
          name: 'Immunization Program',
          icon: FaSyringe,
          details: 'Complete vaccination schedule for infants and children',
          services: [
            'BCG, Hepatitis B, DPT, OPV, MMR vaccines',
            'Pneumococcal and Rotavirus vaccines',
            'Immunization monitoring and records',
            'Catch-up immunization for delayed schedules'
          ],
          schedule: 'Monday to Friday, 8:00 AM - 12:00 NN',
          requirements: ['Birth certificate', 'Immunization card', 'Valid ID of parent/guardian']
        }
      ]
    },
    {
      id: 2,
      icon: FaUserMd,
      title: 'Primary Care',
      color: 'blue',
      description: 'Essential health services and consultations',
      programs: [
        {
          name: 'Outpatient Consultation',
          icon: FaClipboardCheck,
          details: 'General medical consultation for common illnesses and health concerns',
          services: [
            'Physical examination and vital signs monitoring',
            'Diagnosis of common illnesses (fever, cough, colds)',
            'Treatment and prescription of medications',
            'Medical certificates and referrals',
            'Health counseling and lifestyle advice'
          ],
          schedule: 'Monday to Sunday, 6:00 AM - 5:00 PM',
          requirements: ['Valid ID', 'Previous medical records (if available)', 'PhilHealth ID (for coverage)']
        },
        {
          name: 'Dog Bite Treatment',
          icon: FaDog,
          details: 'Immediate treatment and anti-rabies vaccination for animal bites',
          services: [
            'Wound cleaning and treatment',
            'Anti-rabies vaccine administration',
            'Tetanus prophylaxis',
            'Follow-up vaccination schedule',
            'Animal bite case documentation',
            'Coordination with veterinary services'
          ],
          schedule: 'Emergency: 24/7 | Regular: 6:00 AM - 5:00 PM',
          requirements: ['Valid ID', 'Details of the incident and animal', 'Previous vaccination records (if any)']
        },
        {
          name: 'Injection Services',
          icon: FaSyringe,
          details: 'Safe administration of prescribed medications',
          services: [
            'Intramuscular (IM) injections',
            'Intravenous (IV) injections',
            'Subcutaneous injections',
            'Proper disposal of medical waste',
            'Post-injection monitoring'
          ],
          schedule: 'Monday to Sunday, 6:00 AM - 5:00 PM',
          requirements: ['Valid prescription from licensed physician', 'Medication to be administered', 'Valid ID']
        }
      ]
    },
    {
      id: 3,
      icon: FaStethoscope,
      title: 'Disease Prevention',
      color: 'orange',
      description: 'Programs to prevent and control diseases',
      programs: [
        {
          name: 'TB-DOTS Program',
          icon: FaStethoscope,
          details: 'Directly Observed Treatment Short-course for Tuberculosis',
          services: [
            'Free TB screening and sputum examination',
            'Free anti-TB medications for 6-8 months',
            'Daily observed medication intake',
            'Monthly monitoring and follow-up',
            'Contact tracing and home visits',
            'Nutritional support and counseling'
          ],
          schedule: 'Monday to Friday, 7:00 AM - 4:00 PM',
          requirements: ['Valid ID', 'Chest X-ray results', 'Sputum examination results']
        },
        {
          name: 'Hypertension & Diabetes Management',
          icon: FaHeartbeat,
          details: 'Regular monitoring and management of chronic conditions',
          services: [
            'Blood pressure and blood sugar monitoring',
            'Free maintenance medications',
            'Diet and lifestyle counseling',
            'Regular health education sessions',
            'Complication screening and prevention'
          ],
          schedule: 'Monday to Friday, 8:00 AM - 4:00 PM',
          requirements: ['Valid ID', 'Previous medical records', 'Laboratory results (if available)']
        },
        {
          name: 'Dengue Prevention',
          icon: FaClipboardCheck,
          details: 'Community-based dengue surveillance and prevention',
          services: [
            'Mosquito larvae inspection',
            'Health education on 4S strategy',
            'Dengue rapid testing',
            'Community clean-up drives',
            'Distribution of larvicides'
          ],
          schedule: 'Monday to Friday, 8:00 AM - 5:00 PM',
          requirements: ['Barangay clearance for community activities']
        }
      ]
    },
    {
      id: 4,
      icon: FaCapsules,
      title: 'Medicine Assistance',
      color: 'blue',
      description: 'Free medication programs for the community',
      programs: [
        {
          name: 'Free Medicine Program',
          icon: FaCapsules,
          details: 'Essential medicines provided free of charge to qualified patients',
          services: [
            'Antibiotics (Amoxicillin, Cefalexin, etc.)',
            'Pain relievers (Paracetamol, Mefenamic acid)',
            'Vitamins and supplements',
            'Maintenance medications (for hypertension, diabetes)',
            'Anti-allergy medications',
            'Wound care supplies'
          ],
          schedule: 'Monday to Sunday, 6:00 AM - 5:00 PM',
          requirements: ['Valid prescription from RHU doctor', 'Valid ID', 'Barangay Certificate of Indigency (for free medicines)']
        },
        {
          name: 'Mental Health Support',
          icon: FaBrain,
          details: 'Free medication assistance for patients with mental health conditions',
          services: [
            'Psychiatric medications (as prescribed)',
            'Anti-depressants and anti-anxiety medications',
            'Mood stabilizers',
            'Psychosocial support and counseling',
            'Regular medication monitoring',
            'Referral to psychiatric services when needed'
          ],
          schedule: 'Monday to Friday, 8:00 AM - 4:00 PM',
          requirements: ['Prescription from psychiatrist or mental health professional', 'Medical records/diagnosis', 'Valid ID', 'Certificate of Indigency']
        },
        {
          name: 'Senior Citizen Medicine Program',
          icon: FaHeartbeat,
          details: 'Priority medicine assistance for senior citizens',
          services: [
            'Maintenance medications for chronic diseases',
            'Vitamins and dietary supplements',
            'Priority lane for medicine claims',
            '20% discount on all medicines',
            'Home delivery for immobile seniors'
          ],
          schedule: 'Monday to Sunday, 6:00 AM - 5:00 PM',
          requirements: ['Senior Citizen ID', 'Valid prescription', 'OSCA ID']
        }
      ]
    }
  ];

  const ServiceCard = ({ service }) => (
    <button
      onClick={() => setSelectedService(service)}
      className={`bg-white p-6 rounded-lg text-center border-2 border-${service.color}-100 hover:border-${service.color}-400 hover:shadow-xl transition-all cursor-pointer group`}
    >
      <div className={`bg-${service.color}-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
        <service.icon className={`text-3xl text-${service.color}-600`} />
      </div>
      <h3 className="font-bold text-gray-900 text-lg mb-2">{service.title}</h3>
      <p className="text-sm text-gray-900 mb-3">{service.description}</p>
      <span className={`text-xs font-semibold text-${service.color}-600 flex items-center justify-center gap-1`}>
        Click for details
        <FaCheckCircle className="text-xs" />
      </span>
    </button>
  );

  const ServiceModal = ({ service, onClose }) => {
    if (!service) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Modal Header */}
          <div className={`relative bg-gradient-to-r ${service.color === 'orange' ? 'from-orange-500 via-orange-600 to-orange-700' : 'from-blue-600 via-blue-700 to-blue-800'} p-6`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white mb-2">
                  HEALTH SERVICES
                </div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
                  <service.icon className="text-4xl" />
                  {service.title}
                </h2>
                <p className="text-white/90 text-sm">{service.description}</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:rotate-90 transition-all duration-300 flex-shrink-0 ml-4"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-white">
            <div className="space-y-6">
              {service.programs.map((program, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg border-2 border-gray-100 hover:border-orange-200 transition-all overflow-hidden">
                  {/* Program Header */}
                  <div className={`bg-gradient-to-r ${service.color === 'orange' ? 'from-orange-50 to-orange-100' : 'from-blue-50 to-blue-100'} p-4 border-b-2 ${service.color === 'orange' ? 'border-orange-200' : 'border-blue-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${service.color === 'orange' ? 'bg-orange-500' : 'bg-blue-600'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <program.icon className="text-2xl text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">{program.name}</h3>
                        <p className="text-sm text-gray-600">{program.details}</p>
                      </div>
                    </div>
                  </div>

                  {/* Program Content */}
                  <div className="p-5">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Services Offered */}
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <FaCheckCircle className={service.color === 'orange' ? 'text-orange-600' : 'text-blue-600'} />
                          Services Offered
                        </h4>
                        <ul className="space-y-2">
                          {program.services.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className={`${service.color === 'orange' ? 'text-orange-500' : 'text-blue-500'} mt-1 flex-shrink-0`}>•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Schedule & Requirements */}
                      <div className="space-y-4">
                        {/* Schedule */}
                        <div className={`bg-gradient-to-br ${service.color === 'orange' ? 'from-orange-50 to-orange-100' : 'from-blue-50 to-blue-100'} rounded-lg p-4 border ${service.color === 'orange' ? 'border-orange-200' : 'border-blue-200'}`}>
                          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <FaClock className={service.color === 'orange' ? 'text-orange-600' : 'text-blue-600'} />
                            Schedule
                          </h4>
                          <p className="text-sm text-gray-700 font-medium">{program.schedule}</p>
                        </div>

                        {/* Requirements */}
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <FaClipboardCheck className={service.color === 'orange' ? 'text-orange-600' : 'text-blue-600'} />
                            Requirements
                          </h4>
                          <ul className="space-y-1">
                            {program.requirements.map((req, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                <FaCheckCircle className={`${service.color === 'orange' ? 'text-orange-500' : 'text-blue-500'} mt-0.5 flex-shrink-0`} />
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t-2 border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className={`w-2 h-2 ${service.color === 'orange' ? 'bg-orange-500' : 'bg-blue-500'} rounded-full animate-pulse`}></div>
                <span className="font-medium">All services are FREE for qualified patients</span>
              </div>
              <button
                onClick={onClose}
                className={`bg-gradient-to-r ${service.color === 'orange' ? 'from-orange-500 to-orange-600' : 'from-blue-600 to-blue-700'} text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2`}
              >
                Close
                <FaTimes />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 to-blue-50 rounded-lg p-8 mb-8">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Health Programs & Services</h2>
        <div className="h-1 w-20 bg-gradient-to-r from-orange-600 to-blue-800 mx-auto mb-3"></div>
        <p className="text-gray-600">Click on any service to view detailed information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {healthServices.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>

      {selectedService && (
        <ServiceModal 
          service={selectedService} 
          onClose={() => setSelectedService(null)} 
        />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default HealthServicesSection;