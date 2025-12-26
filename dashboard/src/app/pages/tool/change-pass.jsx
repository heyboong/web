import { useState, useEffect } from 'react';
import { Card, Button } from 'components/ui';
import { Input } from 'components/ui/Form';
import { 
  ClipboardDocumentIcon,
  CheckIcon,
  KeyIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router';
import { useAuthContext } from 'app/contexts/auth/context';

export default function ChangePassTool() {
  const { user } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [logs, setLogs] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    cookie: '',
    accessToken: '',
    newPassword: ''
  });
  // eslint-disable-next-line no-unused-vars
  const [toolInfo, setToolInfo] = useState(null);

  // Load tool info and track usage when component mounts
  useEffect(() => {
    const loadToolInfo = async () => {
      try {
        // Get tool information
        const toolResponse = await fetch('/api/tools');
        const toolData = await toolResponse.json();
        
        if (toolData.status === 'success') {
          const changePassTool = toolData.data.find(tool => 
            tool.url.includes('change-pass') || tool.name.includes('change-pass')
          );
          if (changePassTool) {
            setToolInfo(changePassTool);
          }
        }
        
        // Track tool usage
        console.log('📊 Tracking tool usage for change-pass...');
        
        const response = await fetch('/api/tools/change-pass/track-usage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user?.id || null
          })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          console.log('✅ Tool usage tracked successfully:', result);
        } else {
          console.log('⚠️ Failed to track tool usage:', result);
        }
      } catch (error) {
        console.error('❌ Error loading tool info or tracking usage:', error);
      }
    };

    loadToolInfo();
  }, [user?.id]);

  const showAlert = (type, title, message) => {
    setAlert({ type, title, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const updateStepIndicator = (step) => {
    setCurrentStep(step);
  };

  const getVerificationCode = async () => {
    if (!formData.cookie.trim() || !formData.accessToken.trim()) {
      showAlert('error', 'Error!', 'Please enter both cookie and access token.');
      return;
    }

    // Extract UID from cookie for payment
    const uidMatch = formData.cookie.match(/c_user=(\d+)/);
    if (!uidMatch) {
      showAlert('error', 'Error!', 'Cannot extract UID from cookie. Please check your cookie.');
      return;
    }
    
    setLoading(true);
    showAlert('info', 'Processing...', 'Getting verification code...');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/tools/change-pass/get-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cookie: formData.cookie,
          access_token: formData.accessToken
        })
      });

      const data = await response.json();

      if (data.success) {
        setVerificationCode(data.code);
        
        // Update logs if available (debug mode)
        if (data.logs && data.logs.length > 0) {
          setLogs(data.logs);
        }
        
        showAlert('success', 'Success!', `Verification code obtained successfully. Points deducted: ${data.points_deducted}`);
        updateStepIndicator(2);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('error', 'Error!', error.message || 'Failed to get verification code.');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (!formData.newPassword.trim()) {
      showAlert('error', 'Error!', 'Please enter a new password.');
      return;
    }

    setLoading(true);
    showAlert('info', 'Processing...', 'Changing password...');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/tools/change-pass/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cookie: formData.cookie,
          access_token: formData.accessToken,
          new_password: formData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update logs if available (debug mode)
        if (data.logs && data.logs.length > 0) {
          setLogs(data.logs);
        }
        
        showAlert('success', 'Password Changed Successfully!', `Your Facebook password has been changed. Points deducted: ${data.points_deducted}`);
        updateStepIndicator(3);
      } else {
        // Update logs even on failure if available
        if (data.logs && data.logs.length > 0) {
          setLogs(data.logs);
        }
        
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('error', 'Password Change Failed!', error.message || 'An error occurred while changing password.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFormData({
      cookie: '',
      accessToken: '',
      newPassword: ''
    });
    setVerificationCode('');
    setLogs([]);
    setAlert(null);
    updateStepIndicator(1);
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center items-center mb-8 space-x-4">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
            step < currentStep 
              ? 'bg-green-500 text-white' 
              : step === currentStep 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
          }`}>
            {step < currentStep ? <CheckIcon className="h-5 w-5" /> : step}
          </div>
          {step < 3 && (
            <div className={`w-8 h-0.5 mx-2 ${
              step < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderLogs = () => {
    if (!logs || logs.length === 0) return null;

    return (
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Debug Logs:
        </h4>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg max-h-64 overflow-y-auto text-xs font-mono">
          {logs.map((log, index) => (
            <div key={index} className="mb-2">
              <span className="text-gray-400">[{log.time}]</span>
              <span className={`ml-2 ${
                log.type === 'success' ? 'text-green-400' :
                log.type === 'error' ? 'text-red-400' :
                log.type === 'warning' ? 'text-yellow-400' :
                'text-blue-400'
              }`}>
                [{log.type.toUpperCase()}]
              </span>
              <span className="ml-2">{log.message}</span>
              {log.data && (
                <div className="ml-4 mt-1 text-gray-500">
                  {JSON.stringify(log.data, null, 2)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              to="/dashboards/home" 
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back to Tools</span>
            </Link>
          </div>
         
        </div>

        {/* Alert */}
        {alert && (
          <div className={`mb-6 p-4 rounded-lg border ${
            alert.type === 'success' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' :
            alert.type === 'error' ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' :
            alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400' :
            'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {alert.type === 'success' && <CheckCircleIcon className="h-5 w-5" />}
                {alert.type === 'error' && <ExclamationTriangleIcon className="h-5 w-5" />}
                {alert.type === 'warning' && <ExclamationTriangleIcon className="h-5 w-5" />}
                {alert.type === 'info' && <InformationCircleIcon className="h-5 w-5" />}
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">{alert.title}</h3>
                <div className="mt-1 text-sm">{alert.message}</div>
              </div>
            </div>
          </div>
        )}

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Main Form */}
        <Card className="p-8">
          {/* Step 1: Input Data */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  <KeyIcon className="h-6 w-6 inline mr-2 text-primary-600" />
                  Login Informations
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter the required information to start the password change process
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <ClipboardDocumentIcon className="h-4 w-4 inline mr-1" />
                  Facebook Cookie
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  rows={4}
                  placeholder="Enter your Facebook cookie..."
                  value={formData.cookie}
                  onChange={(e) => setFormData(prev => ({ ...prev, cookie: e.target.value }))}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <InformationCircleIcon className="h-3 w-3 inline mr-1" />
                  Copy cookie from Developer Tools of your browser
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <ShieldCheckIcon className="h-4 w-4 inline mr-1" />
                  Access Token EAAAAU
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  rows={3}
                  placeholder="Enter your access token..."
                  value={formData.accessToken}
                  onChange={(e) => setFormData(prev => ({ ...prev, accessToken: e.target.value }))}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <InformationCircleIcon className="h-3 w-3 inline mr-1" />
                  Token to access Facebook Graph API
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <KeyIcon className="h-4 w-4 inline mr-1" />
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password..."
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="pr-10"
                  />
                  <Button
                    size="sm"
                    variant="plain"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <InformationCircleIcon className="h-3 w-3 inline mr-1" />
                  New password for your Facebook account
                </p>
              </div>

              <div className="pt-4">
                <Button
                  onClick={getVerificationCode}
                  loading={loading}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
                >
                  <KeyIcon className="h-4 w-4 mr-2" />
                  Get Verification Code
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Code Verification */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  <ShieldCheckIcon className="h-6 w-6 inline mr-2 text-green-600" />
                  Code Verification
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Verification code has been generated, check and continue to change password
                </p>
              </div>
              
              <div className="mb-6 p-4 rounded-lg border bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">Success</h3>
                    <div className="mt-1 text-sm">Verification code obtained successfully. Click continue to change password.</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <KeyIcon className="h-4 w-4 inline mr-1" />
                  Verification Code:
                </label>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                  <code className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    {verificationCode}
                  </code>
                </div>
              </div>

              {renderLogs()}

              <div className="flex space-x-4 pt-4">
                <Button
                  onClick={changePassword}
                  loading={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                  <KeyIcon className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateStepIndicator(1)}
                  className="px-6"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Result */}
          {currentStep === 3 && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-6">
                  <CheckCircleIcon className="h-16 w-16 text-green-600 dark:text-green-400" />
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-3">
                  Password Changed Successfully!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Your Facebook password has been changed successfully.
                </p>
              </div>

              {renderLogs()}
              
              <div className="pt-6">
                <Button
                  onClick={reset}
                  className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
                >
                  <KeyIcon className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Security Tips */}
        <Card className="p-8">
          <div className="flex items-start space-x-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Important Notes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                    <span>Ensure cookie and access token are still valid</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                    <span>Do not share this information with anyone</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                    <span>Use a strong password for better security</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                    <span>Log out from all devices after changing password</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                    <span>Enable two-factor authentication when available</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                    <span>Keep your account information secure</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
