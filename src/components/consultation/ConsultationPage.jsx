import React from 'react';
import { Video, User } from 'lucide-react';

export default function TelemedicineConsultation() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Video className="w-6 h-6 mr-3 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Telemedicine Consultation</h1>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Call Area */}
          <div className="lg:col-span-2">
            <div className="bg-gray-600 rounded-lg aspect-video flex items-center justify-center">
              <div className="text-center text-white">
                <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-medium">Video Call Area</p>
              </div>
            </div>
          </div>

          {/* Participants Panel */}
          <div className="space-y-4">
            {/* Patient Info */}
            <div className="bg-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Patient Name</h3>
                  <p className="text-sm text-blue-600">Status: Online</p>
                </div>
              </div>
            </div>

            {/* Doctor Info */}
            <div className="bg-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Doctor Name</h3>
                  <p className="text-sm text-blue-600">Specialty: General</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Start Consultation Button */}
        <div className="mt-8 flex justify-center">
          <button className="bg-gray-700 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors flex items-center space-x-2">
            <Video className="w-5 h-5" />
            <span>Start Consultation</span>
          </button>
        </div>
      </div>
    </div>
  );
}