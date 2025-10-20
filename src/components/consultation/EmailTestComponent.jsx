import React, { useState } from 'react';
import { FaEnvelope, FaCheckCircle, FaTimesCircle, FaCog } from 'react-icons/fa';
import API_BASE_URL from '../../config.js';

/**
 * EmailTestComponent - Test email service functionality
 * Updated to use the dedicated test-email endpoint
 */
const EmailTestComponent = () => {
  const [testResult, setTestResult] = useState(null);
  const [configResult, setConfigResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(false);
  const [email, setEmail] = useState('randeljonhlontok@gmail.com');

  // Check email configuration
  const checkEmailConfig = async () => {
    try {
      setCheckingConfig(true);
      setConfigResult(null);

      const response = await fetch(`${API_BASE_URL}/test-email/config`);
      const data = await response.json();
      
      setConfigResult(data);
    } catch (error) {
      console.error('Config check error:', error);
      setConfigResult({
        success: false,
        message: 'Failed to check configuration',
        error: error.message
      });
    } finally {
      setCheckingConfig(false);
    }
  };

  // Send test email
  const sendTestEmail = async () => {
    try {
      setLoading(true);
      setTestResult(null);

      const response = await fetch(`${API_BASE_URL}/test-email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: email })
      });

      const data = await response.json();
      setTestResult(data);

    } catch (error) {
      console.error('Email test error:', error);
      setTestResult({
        success: false,
        message: 'Failed to send test email',
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <FaEnvelope className="text-blue-600 text-2xl" />
        <h2 className="text-2xl font-bold text-gray-900">Email Service Test</h2>
      </div>

      {/* Configuration Check Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Step 1: Check Configuration</h3>
        <button
          onClick={checkEmailConfig}
          disabled={checkingConfig}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
        >
          {checkingConfig ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Checking...
            </>
          ) : (
            <>
              <FaCog />
              Check Email Configuration
            </>
          )}
        </button>

        {configResult && (
          <div className={`mt-4 p-4 rounded-lg border ${
            configResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {configResult.success ? (
                <FaCheckCircle className="text-green-600 text-xl mt-0.5 flex-shrink-0" />
              ) : (
                <FaTimesCircle className="text-red-600 text-xl mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  configResult.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {configResult.message}
                </p>
                
                {configResult.config && (
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Email User:</span>
                      <code className="text-xs bg-white px-2 py-1 rounded">{configResult.config.emailUser}</code>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Password Set:</span>
                      <span className={configResult.config.emailPasswordSet ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {configResult.config.emailPasswordSet ? '✅ YES' : '❌ NO'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Password Length:</span>
                      <span className={configResult.config.emailPasswordLength === 16 ? 'text-green-600 font-semibold' : 'text-orange-600 font-semibold'}>
                        {configResult.config.emailPasswordLength} chars
                        {configResult.config.emailPasswordLength !== 16 && ' ⚠️ Should be 16'}
                      </span>
                    </div>
                  </div>
                )}

                {configResult.error && (
                  <p className="text-sm text-red-700 mt-2">
                    <strong>Error:</strong> {configResult.error}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Send Test Email Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Step 2: Send Test Email</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@gmail.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={sendTestEmail}
          disabled={loading || !email}
          className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Sending Test Email...
            </>
          ) : (
            <>
              <FaEnvelope />
              Send Test Email
            </>
          )}
        </button>

        {testResult && (
          <div className={`mt-4 p-4 rounded-lg border ${
            testResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <FaCheckCircle className="text-green-600 text-xl mt-0.5 flex-shrink-0" />
              ) : (
                <FaTimesCircle className="text-red-600 text-xl mt-0.5 flex-shrink-0" />
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
                
                {testResult.success && testResult.details && (
                  <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Email Details:</p>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p><strong>To:</strong> {testResult.details.to}</p>
                      <p><strong>From:</strong> {testResult.details.from}</p>
                      <p><strong>Message ID:</strong> <code className="text-xs bg-gray-100 px-1">{testResult.details.messageId}</code></p>
                      <p className="mt-3 text-green-800 font-medium">
                        ✅ Check your inbox and spam folder!
                      </p>
                    </div>
                  </div>
                )}
                
                {!testResult.success && testResult.error && (
                  <div className="mt-3 p-3 bg-red-100 rounded text-xs text-red-800">
                    <p className="font-semibold mb-2">Error Details:</p>
                    <p>{testResult.error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm font-semibold text-yellow-800 mb-2">
          📋 How to Use:
        </p>
        <ol className="text-xs text-yellow-700 space-y-1 list-decimal list-inside">
          <li>Click "Check Email Configuration" to verify your email settings</li>
          <li>Make sure password length is 16 characters</li>
          <li>Enter your email address</li>
          <li>Click "Send Test Email"</li>
          <li>Check your inbox and spam folder for the test email</li>
        </ol>
      </div>
    </div>
  );
};

export default EmailTestComponent;