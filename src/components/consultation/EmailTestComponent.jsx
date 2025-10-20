import React, { useState } from 'react';
import { FaEnvelope, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import API_BASE_URL from '../../config.js';

/**
 * EmailTestComponent - Test email service functionality
 * This component helps verify that email notifications are working correctly
 */
const EmailTestComponent = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testEmailService = async () => {
    try {
      setLoading(true);
      setTestResult(null);

      // Get a recent consultation to test with
      const token = localStorage.getItem('token') || '';
      const wallet = localStorage.getItem('connectedWalletAddress') || '';

      const response = await fetch(`${API_BASE_URL}/consultations?limit=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-wallet-address': wallet
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch consultations');
      }

      const data = await response.json();
      
      if (!data.success || !data.data || data.data.length === 0) {
        setTestResult({
          success: false,
          message: 'No consultations found to test with. Please create a consultation first.'
        });
        return;
      }

      const consultation = data.data[0];

      if (!consultation.patient_email) {
        setTestResult({
          success: false,
          message: 'The test consultation does not have an email address. Please create a consultation with a patient email.'
        });
        return;
      }

      // Test by updating the consultation status
      const updateResponse = await fetch(`${API_BASE_URL}/consultations/${consultation.consultation_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-wallet-address': wallet
        },
        body: JSON.stringify({
          status: consultation.status === 'CONFIRMED' ? 'SCHEDULED' : 'CONFIRMED'
        })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Failed to update consultation');
      }

      const result = await updateResponse.json();

      setTestResult({
        success: true,
        message: `Email test successful! A ${consultation.status === 'CONFIRMED' ? 'scheduled' : 'confirmation'} email should have been sent to ${consultation.patient_email}`,
        consultation: result.data
      });

    } catch (error) {
      console.error('Email test error:', error);
      setTestResult({
        success: false,
        message: `Email test failed: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <FaEnvelope className="text-blue-600 text-2xl" />
        <h2 className="text-2xl font-bold text-gray-900">Email Service Test</h2>
      </div>

      <div className="mb-6">
        <p className="text-gray-700 mb-4">
          Click the button below to test the email notification service. This will:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Find the most recent consultation with an email address</li>
          <li>Update its status to trigger an email notification</li>
          <li>Send a test email to the patient</li>
        </ul>
      </div>

      <button
        onClick={testEmailService}
        disabled={loading}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Testing Email Service...
          </>
        ) : (
          <>
            <FaEnvelope />
            Test Email Service
          </>
        )}
      </button>

      {testResult && (
        <div className={`mt-6 p-4 rounded-lg border ${
          testResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            {testResult.success ? (
              <FaCheckCircle className="text-green-600 text-xl mt-0.5" />
            ) : (
              <FaTimesCircle className="text-red-600 text-xl mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${
                testResult.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {testResult.success ? 'Success!' : 'Failed'}
              </p>
              <p className={`text-sm mt-1 ${
                testResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {testResult.message}
              </p>
              {testResult.consultation && (
                <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Consultation Details:</p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><strong>ID:</strong> {testResult.consultation.consultation_id}</p>
                    <p><strong>Patient:</strong> {testResult.consultation.patient_name}</p>
                    <p><strong>Email:</strong> {testResult.consultation.patient_email}</p>
                    <p><strong>Status:</strong> {testResult.consultation.status}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Make sure your backend environment variables are set:
        </p>
        <ul className="text-xs text-yellow-700 mt-2 space-y-1 list-disc list-inside">
          <li><code>EMAIL_USER</code> - Your Gmail address</li>
          <li><code>EMAIL_PASSWORD</code> - Your Gmail App Password</li>
        </ul>
      </div>
    </div>
  );
};

export default EmailTestComponent;