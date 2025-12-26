import { useSettings } from "hooks/useSettings";

export const SettingsExample = () => {
  const { 
    settings, 
    isLoading, 
    getSiteName, 
    getSiteDescription, 
    getSiteUrl 
  } = useSettings();

  if (isLoading) {
    return (
      <div className="animate-pulse bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Site Settings Integration Example
      </h3>
      
      <div className="space-y-3">
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Site Name:</span>
          <span className="ml-2 text-gray-900 dark:text-white">{getSiteName()}</span>
        </div>
        
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Description:</span>
          <span className="ml-2 text-gray-900 dark:text-white">{getSiteDescription()}</span>
        </div>
        
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">URL:</span>
          <a 
            href={getSiteUrl()} 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {getSiteUrl()}
          </a>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            All Settings (Raw Data):
          </h4>
          <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
            {JSON.stringify(settings, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
