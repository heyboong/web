import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input, Badge, Modal } from 'components/ui';
import {
  ShieldCheckIcon,
  KeyIcon,
  ClockIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  GlobeAltIcon,
  TrashIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function Security() {
  const [loginHistory, setLoginHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const loadLoginHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/user/login-history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLoginHistory(data.data || []);
      }
    } catch (error) {
      console.error('Error loading login history:', error);
      toast.error('Failed to load login history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLoginHistory();
  }, [loadLoginHistory]);

  const handleChangePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      toast.error('Please fill all password fields');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setIsChangingPassword(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        })
      });

      if (response.ok) {
        toast.success('Password changed successfully');
        setShowPasswordModal(false);
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleBlacklistIP = async (ip) => {
    if (!confirm(`Block IP address ${ip}?\n\nThis will:\n• Immediately logout all active sessions from this IP\n• Prevent future logins from this IP`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/user/blacklist-ip', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ip_address: ip })
      });

      if (response.ok) {
        toast.success(`IP ${ip} has been blocked and all sessions logged out`);
        loadLoginHistory();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to block IP');
      }
    } catch (error) {
      console.error('Error blacklisting IP:', error);
      toast.error('Failed to block IP');
    }
  };

  const handleDeleteHistory = async (sessionId, deviceInfo) => {
    if (!confirm(`Delete login history for ${deviceInfo}? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/user/login-history/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Login history deleted successfully');
        loadLoginHistory();
      } else {
        toast.error('Failed to delete login history');
      }
    } catch (error) {
      console.error('Error deleting login history:', error);
      toast.error('Failed to delete login history');
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <DevicePhoneMobileIcon className="h-5 w-5" />;
      case 'tablet':
        return <DeviceTabletIcon className="h-5 w-5" />;
      default:
        return <ComputerDesktopIcon className="h-5 w-5" />;
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <KeyIcon className="h-6 w-6 text-gray-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Change Password
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update your password regularly for better security
              </p>
            </div>
          </div>
          <Button
            variant="filled"
            color="primary"
            onClick={() => setShowPasswordModal(true)}
          >
            <KeyIcon className="h-4 w-4 mr-2" />
            Change Password
          </Button>
        </div>
      </Card>

      {/* Login History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ClockIcon className="h-6 w-6 text-gray-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Login Activity
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monitor your account access history
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : loginHistory.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No login history found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {loginHistory.map((session) => (
              <div
                key={session.id}
                className={`p-4 rounded-lg border ${
                  session.is_active
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                  <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-gray-500 dark:text-gray-400 mt-1">
                      {getDeviceIcon(session.device_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                          {session.device_type || 'Desktop'} • {session.browser || 'Unknown Browser'}
                        </h4>
                        {session.is_active && (
                          <Badge color="success" variant="soft" size="sm">
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <GlobeAltIcon className="h-4 w-4" />
                          <code className="font-mono text-xs">{session.ip_address}</code>
                          {session.location && <span className="text-xs">• {session.location}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4" />
                          <span>{formatTimeAgo(session.created_at)}</span>
                          <span className="text-xs text-gray-500">
                            ({new Date(session.created_at).toLocaleString()})
                          </span>
                        </div>
                        {session.os && (
                          <div className="text-xs text-gray-500">
                            OS: {session.os}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outlined"
                      color="error"
                      onClick={() => handleDeleteHistory(session.id, `${session.device_type} - ${session.ip_address}`)}
                      title="Delete this login history"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outlined"
                      color="error"
                      onClick={() => handleBlacklistIP(session.ip_address)}
                      title="Block this IP address"
                    >
                      <NoSymbolIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Security Tips */}
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <ShieldCheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Security Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Use a strong, unique password for your account</li>
              <li>• Enable two-factor authentication when available</li>
              <li>• Review your login activity regularly</li>
              <li>• Delete suspicious login history entries</li>
              <li>• Block suspicious IP addresses</li>
              <li>• Never share your password with anyone</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Change Password Modal */}
      <Modal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password *
            </label>
            <Input
              type="password"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
              placeholder="Enter your current password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password *
            </label>
            <Input
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
              placeholder="Enter new password (min 6 characters)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password *
            </label>
            <Input
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
              placeholder="Confirm new password"
            />
          </div>

          {passwordForm.new_password && passwordForm.new_password.length < 6 && (
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm">
              <ExclamationTriangleIcon className="h-4 w-4" />
              Password should be at least 6 characters
            </div>
          )}

          {passwordForm.new_password && passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <ExclamationTriangleIcon className="h-4 w-4" />
              Passwords do not match
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outlined"
              onClick={() => setShowPasswordModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="filled"
              color="primary"
              onClick={handleChangePassword}
              disabled={isChangingPassword || !passwordForm.current_password || !passwordForm.new_password || passwordForm.new_password !== passwordForm.confirm_password}
              className="flex-1"
            >
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

