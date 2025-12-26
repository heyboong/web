import { useSettingsContext } from "app/contexts/settings/context";

export const useSettings = () => {
  const context = useSettingsContext();
  
  return {
    settings: context.settings,
    isLoading: context.isLoading,
    isInitialized: context.isInitialized,
    error: context.error,
    updateSettings: context.updateSettings,
    refreshSettings: context.refreshSettings,
    // Helper functions for common settings
    getSiteName: () => context.settings?.site_name || 'Scanvia',
    getSiteDescription: () => context.settings?.site_description || 'Your business analytics platform',
    getSiteUrl: () => context.settings?.site_url || 'https://via88online.com',
  };
};
