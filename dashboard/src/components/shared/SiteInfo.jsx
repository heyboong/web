import { useSettings } from "hooks/useSettings";

export const SiteInfo = ({ showDescription = true, className = "" }) => {
  const { getSiteName, getSiteDescription, isLoading } = useSettings();

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
        {showDescription && (
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {getSiteName()}
      </h1>
      {showDescription && (
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {getSiteDescription()}
        </p>
      )}
    </div>
  );
};
