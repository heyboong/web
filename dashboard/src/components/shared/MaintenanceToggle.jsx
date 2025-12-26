import { useSettings } from "hooks/useSettings";
import { settingsService } from "services/settingsService";
import { 
  WrenchScrewdriverIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { Button } from "components/ui";
import { toast } from 'sonner';
import { useState } from 'react';

export const MaintenanceToggle = () => {
  const { settings, refreshSettings } = useSettings();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    
    try {
      const currentMaintenanceMode = settings?.maintenance_mode || false;
      const newSettings = {
        ...settings,
        maintenance_mode: !currentMaintenanceMode
      };

      const result = await settingsService.updateSettings(newSettings);
      
      if (result.success) {
        await refreshSettings();
        
        const wasEnabled = settings?.maintenance_mode || false;
        toast.success(
          wasEnabled 
            ? 'Maintenance mode disabled' 
            : 'Maintenance mode enabled',
          {
            description: wasEnabled 
              ? 'Site is now accessible to all users' 
              : 'Site is now in maintenance mode',
            duration: 3000,
          }
        );
      } else {
        toast.error('Failed to toggle maintenance mode', {
          description: result.error,
          duration: 4000,
        });
      }
    } catch {
      toast.error('Failed to toggle maintenance mode', {
        description: 'Please try again later.',
        duration: 4000,
      });
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${
            settings.maintenance_mode 
              ? 'bg-yellow-100 dark:bg-yellow-900/20' 
              : 'bg-green-100 dark:bg-green-900/20'
          }`}>
            {settings.maintenance_mode ? (
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            ) : (
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Maintenance Mode
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {settings.maintenance_mode 
                ? 'Site is currently in maintenance mode' 
                : 'Site is running normally'
              }
            </p>
          </div>
        </div>

        <Button
          onClick={handleToggle}
          loading={isToggling}
          disabled={isToggling}
          variant={settings.maintenance_mode ? "solid" : "outline"}
          color={settings.maintenance_mode ? "warning" : "success"}
          className="min-w-[120px]"
        >
          {isToggling 
            ? 'Toggling...' 
            : settings.maintenance_mode 
              ? 'Disable Maintenance' 
              : 'Enable Maintenance'
          }
        </Button>
      </div>

      {settings.maintenance_mode && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <div className="flex items-start">
            <WrenchScrewdriverIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2" />
            <div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Warning:</strong> When maintenance mode is enabled, all users (except admins) 
                will see a maintenance page instead of the normal site content.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
