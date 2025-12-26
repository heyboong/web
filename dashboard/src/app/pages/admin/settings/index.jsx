import { useState, useEffect } from 'react';
import { Page } from "components/shared/Page";
import { Card, Button } from "components/ui";
import { useAuthContext } from "app/contexts/auth/context";
import { useSettings } from "hooks/useSettings";
import { settingsService } from "services/settingsService";
import { MaintenanceToggle } from "components/shared/MaintenanceToggle";
import { PageHeader, TableSkeleton } from "components/admin";
import { 
  GlobeAltIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  BellIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function SiteSettings() {
  const { isAdmin } = useAuthContext();
  const { refreshSettings } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [settings, setSettings] = useState({
    site_name: 'Scanvia',
    site_description: 'Your business analytics platform',
    site_url: 'https://via88online.com',
    admin_email: 'admin@via88online.com',
    maintenance_mode: false,
    allow_registration: true,
    max_users: 1000,
    session_timeout: 30,
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    notifications: {
      email: true,
      push: false,
      sms: false
    }
  });

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!isAdmin) {
        toast.error('Access Denied', {
          description: 'You do not have permission to access this page.',
          duration: 4000,
        });
        // Redirect to home page
        window.location.href = '/dashboards/home';
        return;
      }

      setIsLoadingSettings(true);
      try {
        const result = await settingsService.getAdminSettings();
        if (result.success) {
          // Convert settings from API format to form format
          const formSettings = {};
          Object.entries(result.data).forEach(([key, setting]) => {
            formSettings[key] = setting.value;
          });
          setSettings(formSettings);
        } else {
          toast.error('Failed to load settings', {
            description: result.error,
            duration: 4000,
          });
        }
      } catch {
        toast.error('Failed to load settings', {
          description: 'Please try again later.',
          duration: 4000,
        });
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadSettings();
  }, [isAdmin]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await settingsService.updateSettings(settings);
      
      if (result.success) {
        // Refresh the global settings context
        await refreshSettings();
        
        toast.success('Settings saved successfully!', {
          description: 'Your site settings have been updated.',
          duration: 3000,
        });
      } else {
        toast.error('Failed to save settings', {
          description: result.error,
          duration: 4000,
        });
      }
    } catch {
      toast.error('Failed to save settings', {
        description: 'Please try again later.',
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSettings({
      site_name: 'Scanvia',
      site_description: 'Your business analytics platform',
      site_url: 'https://via88online.com',
      admin_email: 'admin@via88online.com',
      maintenance_mode: false,
      allow_registration: true,
      max_users: 1000,
      session_timeout: 30,
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      notifications: {
        email: true,
        push: false,
        sms: false
      }
    });
    toast.info('Settings reset to defaults');
  };

  if (!isAdmin) {
    return (
      <Page title="Access Denied">
        <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
          <div className="min-w-0">
            <div className="text-center py-12">
              <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Access Denied</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                You do not have permission to access this page.
              </p>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  if (isLoadingSettings) {
    return (
      <Page title="Site Settings">
        <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
          <div className="min-w-0">
            <TableSkeleton rows={4} />
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Site Settings">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0">
          {/* Header */}
          <PageHeader
            title="Site Settings"
            description="Manage your site configuration and preferences"
            icon={GlobeAltIcon}
          />

                  <div className="space-y-6">
                    {/* Maintenance Mode Toggle */}
                    <MaintenanceToggle />

                    {/* General Settings */}
                    <Card className="p-6">
              <div className="flex items-center mb-6">
                <GlobeAltIcon className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  General Settings
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={settings.site_name || ''}
                    onChange={(e) => handleInputChange('site_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Site URL
                  </label>
                  <input
                    type="url"
                    value={settings.site_url || ''}
                    onChange={(e) => handleInputChange('site_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Site Description
                  </label>
                  <textarea
                    value={settings.site_description || ''}
                    onChange={(e) => handleInputChange('site_description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={settings.admin_email || ''}
                    onChange={(e) => handleInputChange('admin_email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Users
                  </label>
                  <input
                    type="number"
                    value={settings.max_users || 1000}
                    onChange={(e) => handleInputChange('max_users', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </Card>

            {/* User Management */}
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <UserGroupIcon className="h-6 w-6 text-green-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  User Management
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Allow User Registration
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Allow new users to register accounts
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allow_registration || false}
                      onChange={(e) => handleInputChange('allow_registration', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Maintenance Mode
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Temporarily disable site access for maintenance
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenance_mode || false}
                      onChange={(e) => handleInputChange('maintenance_mode', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.session_timeout || 30}
                    onChange={(e) => handleInputChange('session_timeout', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </Card>

            {/* Appearance */}
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <PaintBrushIcon className="h-6 w-6 text-purple-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Appearance
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Theme
                  </label>
                  <select
                    value={settings.theme || 'light'}
                    onChange={(e) => handleInputChange('theme', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language
                  </label>
                  <select
                    value={settings.language || 'en'}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Timezone
                  </label>
                  <select
                    value={settings.timezone || 'UTC'}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Notifications */}
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <BellIcon className="h-6 w-6 text-yellow-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Email Notifications
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Send notifications via email
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications?.email || false}
                      onChange={(e) => handleInputChange('notifications.email', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Push Notifications
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Send push notifications to browsers
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications?.push || false}
                      onChange={(e) => handleInputChange('notifications.push', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      SMS Notifications
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Send notifications via SMS
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications?.sms || false}
                      onChange={(e) => handleInputChange('notifications.sms', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <Card className="p-6">
              <div className="mt-8 flex justify-end space-x-3">
                <Button 
                  type="button"
                  className="min-w-[7rem]"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Reset to Defaults
                </Button>
                <Button 
                  type="button"
                  className="min-w-[7rem]" 
                  color="primary"
                  loading={isLoading}
                  disabled={isLoading}
                  onClick={handleSave}
                >
                  {isLoading ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Page>
  );
}
