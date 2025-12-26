import { useState, useEffect, useCallback } from 'react';
import { Page } from 'components/shared/Page';
import { Card } from 'components/ui';
import { useAuthContext } from 'app/contexts/auth/context';
import { 
  EyeIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  ClockIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function UserAnalyticsDashboard() {
  const { isAuthenticated, user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  // Load user analytics
  const loadAnalytics = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/analytics/user-summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          setAnalytics(result.data);
        } else {
          console.error('Failed to load analytics:', result.message);
          toast.error('Failed to load analytics');
        }
      } else {
        console.error('Failed to fetch analytics:', response.statusText);
        toast.error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Error loading analytics');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Format number
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  // Get time ago
  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Never';
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  };

  if (!isAuthenticated) {
    return (
      <Page title="Access Denied">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Please Login
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              You need to be logged in to view your analytics.
            </p>
          </div>
        </div>
      </Page>
    );
  }

  const statsCards = [
    {
      title: 'Total Points',
      value: formatNumber(analytics?.totalPoints),
      icon: TrophyIcon,
      color: 'yellow',
      description: 'Points earned from activities'
    },
    {
      title: 'Page Views',
      value: formatNumber(analytics?.analytics?.page_views),
      icon: EyeIcon,
      color: 'blue',
      description: 'Pages you\'ve visited'
    },
    {
      title: 'Tool Usage',
      value: formatNumber(analytics?.analytics?.tool_use_count),
      icon: WrenchScrewdriverIcon,
      color: 'green',
      description: 'Tools you\'ve used'
    },
    {
      title: 'Last Activity',
      value: getTimeAgo(analytics?.analytics?.last_activity),
      icon: ClockIcon,
      color: 'purple',
      description: 'When you were last active'
    }
  ];

  return (
    <Page title="My Analytics">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  My Analytics
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Track your activity and earned points
                </p>
              </div>
              <button
                onClick={loadAnalytics}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsCards.map((stat, index) => (
                <Card key={index}>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stat.value}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {stat.description}
                        </p>
                      </div>
                      <div className={`p-3 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900`}>
                        <stat.icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Recent Activity */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Recent Activity
                </h3>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : analytics?.recentActivity?.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                ) : (
                  <div className="space-y-4">
                    {analytics?.recentActivity?.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className={`h-8 w-8 rounded-full ${
                            activity.type === 'login_bonus' ? 'bg-green-100 dark:bg-green-900' :
                            activity.type === 'registration_bonus' ? 'bg-blue-100 dark:bg-blue-900' :
                            'bg-yellow-100 dark:bg-yellow-900'
                          } flex items-center justify-center`}>
                            {activity.type === 'login_bonus' ? (
                              <ClockIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                            ) : activity.type === 'registration_bonus' ? (
                              <TrophyIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <CurrencyDollarIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.description}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getTimeAgo(activity.created_at)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${
                            activity.points > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {activity.points > 0 ? '+' : ''}{activity.points} points
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Points Information */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  How to Earn Points
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <TrophyIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Daily Login
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        +10 points (once per 24 hours)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <TrophyIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Registration
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        +100 points (one-time bonus)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <EyeIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Page Views
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Tracked automatically
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <WrenchScrewdriverIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Tool Usage
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Tracked automatically
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Page>
  );
}
