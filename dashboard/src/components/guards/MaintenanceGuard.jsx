import PropTypes from 'prop-types';
import { useSettings } from 'hooks/useSettings';
import { useAuthContext } from 'app/contexts/auth/context';
import { MaintenanceMode } from 'components/shared/MaintenanceMode';

export default function MaintenanceGuard({ children }) {
  const { settings, isLoading, error, isInitialized } = useSettings();
  const { isAdmin } = useAuthContext();

  // Show loading state while settings are being fetched or not initialized
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        </div>
      </div>
    );
  }

  // If there's an error loading settings, assume maintenance mode is off and continue
  if (error) {
    console.warn('Settings loading error, assuming maintenance mode is disabled:', error);
    return children;
  }

  // Safely check maintenance mode with additional null checks
  const maintenanceMode = Boolean(settings && typeof settings === 'object' && settings.maintenance_mode);
  
  if (maintenanceMode && !isAdmin) {
    return <MaintenanceMode />;
  }

  // If maintenance mode is enabled and user is admin, show admin warning
  if (maintenanceMode && isAdmin) {
    return (
      <div>
        {/* Admin Maintenance Warning Banner */}
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Admin Notice:</strong> Maintenance mode is currently enabled. Regular users will see the maintenance page.
              </p>
            </div>
          </div>
        </div>
        {children}
      </div>
    );
  }

  // Otherwise, render the children normally
  return children;
}

MaintenanceGuard.propTypes = {
  children: PropTypes.node,
};
