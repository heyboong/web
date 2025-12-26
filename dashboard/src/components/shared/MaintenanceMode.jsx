import { useSettings } from "hooks/useSettings";
import { 
  WrenchScrewdriverIcon, 
  ClockIcon,
  EnvelopeIcon 
} from '@heroicons/react/24/outline';

export const MaintenanceMode = () => {
  const { settings, isLoading } = useSettings();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        </div>
      </div>
    );
  }

  const maintenanceMode = settings?.maintenance_mode || false;
  
  if (!maintenanceMode) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-yellow-100 dark:bg-yellow-900/20 mb-6">
          <WrenchScrewdriverIcon className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {settings?.site_name || 'Site'} is Under Maintenance
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          We&apos;re currently performing scheduled maintenance to improve your experience. 
          We&apos;ll be back online shortly.
        </p>

        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-center mb-4">
            <ClockIcon className="h-6 w-6 text-blue-500 mr-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Maintenance Status
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            In Progress
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Estimated completion time will be announced soon
          </div>
        </div>

        {/* Contact Information */}
        {settings.admin_email && (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <EnvelopeIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Need immediate assistance?
              </span>
            </div>
            <a 
              href={`mailto:${settings.admin_email}`}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
            >
              Contact us at {settings.admin_email}
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Thank you for your patience.</p>
          <p className="mt-1">
            © {new Date().getFullYear()} {settings.site_name || 'Scanvia'}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
