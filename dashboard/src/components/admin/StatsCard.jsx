import { Card } from 'components/ui';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue,
  description,
  color = 'primary',
  loading = false 
}) {
  const colorClasses = {
    primary: 'from-blue-500 to-blue-600',
    success: 'from-green-500 to-green-600',
    warning: 'from-amber-500 to-amber-600',
    error: 'from-red-500 to-red-600',
    info: 'from-cyan-500 to-cyan-600',
    purple: 'from-purple-500 to-purple-600'
  };

  const iconBgColors = {
    primary: 'bg-blue-100 dark:bg-blue-900/30',
    success: 'bg-green-100 dark:bg-green-900/30',
    warning: 'bg-amber-100 dark:bg-amber-900/30',
    error: 'bg-red-100 dark:bg-red-900/30',
    info: 'bg-cyan-100 dark:bg-cyan-900/30',
    purple: 'bg-purple-100 dark:bg-purple-900/30'
  };

  const iconColors = {
    primary: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-amber-600 dark:text-amber-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-cyan-600 dark:text-cyan-400',
    purple: 'text-purple-600 dark:text-purple-400'
  };

  if (loading) {
    return (
      <Card className="relative overflow-hidden modern-card">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 skeleton rounded w-24"></div>
            <div className="h-12 w-12 skeleton rounded-xl"></div>
          </div>
          <div className="h-8 skeleton rounded w-32 mb-2"></div>
          <div className="h-3 skeleton rounded w-20"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden modern-card group">
      {/* Animated gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClasses[color]} opacity-5 rounded-full blur-3xl group-hover:blur-2xl transition-all duration-500`}></div>
      
      <div className="p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              {title}
            </p>
          </div>
          {Icon && (
            <div className={`stats-card-icon ${iconBgColors[color]} group-hover:scale-110 transition-transform duration-300`}>
              <Icon className={`h-6 w-6 ${iconColors[color]} relative z-10`} />
            </div>
          )}
        </div>

        <div className="mb-2">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white group-hover:text-4xl transition-all duration-300">
            {value}
          </h3>
        </div>

        {(trend || description) && (
          <div className="flex items-center gap-2 flex-wrap">
            {trend && trendValue && (
              <div className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full ${
                trend === 'up' 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              }`}>
                {trend === 'up' ? (
                  <ArrowUpIcon className="h-3 w-3" />
                ) : (
                  <ArrowDownIcon className="h-3 w-3" />
                )}
                <span>{trendValue}</span>
              </div>
            )}
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
