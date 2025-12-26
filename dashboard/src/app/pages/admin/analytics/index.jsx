import { useState, useEffect } from 'react';
import { Page } from 'components/shared/Page';
import { Card } from 'components/ui';
import { useAuthContext } from 'app/contexts/auth/context';
import { StatsCard, PageHeader } from 'components/admin';
import { 
  UserIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function AnalyticsDashboard() {
  const { isAdmin, isInitialized } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState({
    stats: {
      total_users: 0,
      total_tools: 0,
      total_usage: 0,
      total_points: 0,
      total_balance: 0,
      active_users: 0,
      total_transactions: 0,
      total_transaction_amount: 0,
      deposits_today: 0,
      admin_adjustments_today: 0
    },
    recent_activity: [],
    top_tools: [],
    user_growth: [],
    recent_transactions: [],
    transaction_types: [],
    daily_transactions: []
  });

  // Function to load analytics data
  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          // Ensure all arrays have default values to prevent undefined errors
          const safeData = {
            stats: result.data.stats || {
              total_users: 0,
              total_tools: 0,
              total_usage: 0,
              total_points: 0,
              total_balance: 0,
              active_users: 0,
              total_transactions: 0,
              total_transaction_amount: 0,
              deposits_today: 0,
              admin_adjustments_today: 0
            },
            recent_activity: result.data.recent_activity || [],
            top_tools: result.data.top_tools || [],
            user_growth: result.data.user_growth || [],
            recent_transactions: result.data.recent_transactions || [],
            transaction_types: result.data.transaction_types || [],
            daily_transactions: result.data.daily_transactions || []
          };
          setAnalytics(safeData);
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
  };

  // Load data on component mount
  useEffect(() => {
    loadAnalytics();
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format number
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };


  // Get time ago
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  };

  // Show loading state while auth is initializing
  if (!isInitialized) {
    return (
      <Page title="Loading...">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </Page>
    );
  }

  if (!isAdmin) {
    return (
      <Page title="Access Denied">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              You don&apos;t have permission to access this page.
            </p>
          </div>
        </div>
      </Page>
    );
  }

  // const statCards = [
  //   {
  //     title: 'Total Users',
  //     value: formatNumber(analytics.stats.total_users),
  //     icon: UserIcon,
  //     color: 'blue',
  //     change: '+12%',
  //     changeType: 'positive'
  //   },
  //   {
  //     title: 'Total Tools',
  //     value: formatNumber(analytics.stats.total_tools),
  //     icon: WrenchScrewdriverIcon,
  //     color: 'green',
  //     change: '+5%',
  //     changeType: 'positive'
  //   },
  //   {
  //     title: 'Tool Usage',
  //     value: formatNumber(analytics.stats.total_usage),
  //     icon: ChartBarIcon,
  //     color: 'purple',
  //     change: '+23%',
  //     changeType: 'positive'
  //   },
  //   {
  //     title: 'Total Points',
  //     value: formatNumber(analytics.stats.total_points),
  //     icon: ArrowTrendingUpIcon,
  //     color: 'yellow',
  //     change: '+8%',
  //     changeType: 'positive'
  //   },
  //   {
  //     title: 'Total Balance',
  //     value: formatCurrency(analytics.stats.total_balance),
  //     icon: CurrencyDollarIcon,
  //     color: 'green',
  //     change: '+15%',
  //     changeType: 'positive'
  //   },
  //   {
  //     title: 'Active Users',
  //     value: formatNumber(analytics.stats.active_users),
  //     icon: EyeIcon,
  //     color: 'red',
  //     change: '+18%',
  //     changeType: 'positive'
  //   },
  //   {
  //     title: 'Total Transactions',
  //     value: formatNumber(analytics.stats.total_transactions),
  //     icon: ChartBarIcon,
  //     color: 'emerald',
  //     change: '+18%',
  //     changeType: 'positive'
  //   },
  //   {
  //     title: 'Transaction Volume',
  //     value: formatCurrency(analytics.stats.total_transaction_amount),
  //     icon: CurrencyDollarIcon,
  //     color: 'orange',
  //     change: '+22%',
  //     changeType: 'positive'
  //   },
  //   {
  //     title: 'Deposits Today',
  //     value: formatNumber(analytics.stats.deposits_today),
  //     icon: ArrowTrendingUpIcon,
  //     color: 'teal',
  //     change: '+7%',
  //     changeType: 'positive'
  //   },
  //   {
  //     title: 'Admin Adjustments Today',
  //     value: formatNumber(analytics.stats.admin_adjustments_today),
  //     icon: WrenchScrewdriverIcon,
  //     color: 'purple',
  //     change: '+3%',
  //     changeType: 'positive'
  //   }
  // ];

  return (
    <Page title="Analytics Dashboard">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0">
          <div className="space-y-6">
        {/* Enhanced Header with PageHeader component */}
        <PageHeader
          title="Analytics Dashboard"
          description="Overview of platform performance and user engagement"
          icon={ChartBarIcon}
          actions={
            <button
              onClick={loadAnalytics}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-white/70 px-4 py-2 text-gray-900 shadow-soft ring-1 ring-gray-900/5 backdrop-blur-xl transition-colors hover:bg-white dark:bg-dark-800/50 dark:text-dark-50 dark:ring-white/10 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          }
        />

        {/* Enhanced Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <StatsCard key={i} loading={true} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <StatsCard
              title="Total Users"
              value={formatNumber(analytics.stats.total_users)}
              icon={UserIcon}
              color="primary"
              trend="up"
              trendValue="+12%"
              description="from last month"
            />
            <StatsCard
              title="Total Tools"
              value={formatNumber(analytics.stats.total_tools)}
              icon={WrenchScrewdriverIcon}
              color="success"
              trend="up"
              trendValue="+5%"
              description="from last month"
            />
            <StatsCard
              title="Tool Usage"
              value={formatNumber(analytics.stats.total_usage)}
              icon={ChartBarIcon}
              color="purple"
              trend="up"
              trendValue="+23%"
              description="from last month"
            />
            <StatsCard
              title="Total Points"
              value={formatNumber(analytics.stats.total_points)}
              icon={ArrowTrendingUpIcon}
              color="warning"
              trend="up"
              trendValue="+8%"
              description="from last month"
            />
            <StatsCard
              title="Total Balance"
              value={formatCurrency(analytics.stats.total_balance)}
              icon={CurrencyDollarIcon}
              color="success"
              trend="up"
              trendValue="+15%"
              description="from last month"
            />
            <StatsCard
              title="Active Users"
              value={formatNumber(analytics.stats.active_users)}
              icon={EyeIcon}
              color="error"
              trend="up"
              trendValue="+18%"
              description="from last month"
            />
            <StatsCard
              title="Total Transactions"
              value={formatNumber(analytics.stats.total_transactions)}
              icon={ChartBarIcon}
              color="info"
              trend="up"
              trendValue="+18%"
              description="from last month"
            />
            <StatsCard
              title="Transaction Volume"
              value={formatCurrency(analytics.stats.total_transaction_amount)}
              icon={CurrencyDollarIcon}
              color="warning"
              trend="up"
              trendValue="+22%"
              description="from last month"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Tools */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top Tools by Usage
              </h3>
              <div className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : !analytics.top_tools || analytics.top_tools.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No usage data available</p>
                ) : (
                  analytics.top_tools.map((tool, index) => (
                    <div key={index} className="flex items-center justify-between rounded-2xl border border-gray-200/60 bg-white/60 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-dark-800/40">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-8 w-8">
                          {tool.icon && tool.icon.startsWith('uploads/') ? (
                            <img
                              src={`/${tool.icon}`}
                              alt={tool.name}
                              className="h-8 w-8 rounded object-cover border border-gray-300 dark:border-gray-600"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-xl bg-white/60 ring-1 ring-gray-900/5 backdrop-blur-xl dark:bg-dark-800/40 dark:ring-white/10 flex items-center justify-center text-lg">
                              {tool.icon || '🔧'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {tool.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {tool.unique_users} unique users
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatNumber(tool.usage_count)}
                        </div>
                        <div className="text-sm text-gray-500">uses</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Activity
              </h3>
              <div className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : !analytics.recent_activity || analytics.recent_activity.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                ) : (
                  analytics.recent_activity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 rounded-2xl border border-gray-200/60 bg-white/60 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-dark-800/40">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-white/60 ring-1 ring-gray-900/5 backdrop-blur-xl dark:bg-dark-800/40 dark:ring-white/10 flex items-center justify-center">
                          <WrenchScrewdriverIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Transactions
            </h3>
            <div className="admin-table-wrapper">
              <div className="admin-table-scroll custom-scrollbar">
                <table className="admin-table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Balance Before
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Balance After
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-2">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : !analytics.recent_transactions || analytics.recent_transactions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    analytics.recent_transactions.map((transaction, index) => (
                      <tr key={index} className="hover:bg-gray-50/60 dark:hover:bg-dark-300/10">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {transaction.username || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.transaction_type === 'deposit' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            transaction.transaction_type === 'admin_adjustment' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            transaction.transaction_type === 'product_purchase' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {transaction.transaction_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          transaction.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatCurrency(transaction.balance_before)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatCurrency(transaction.balance_after)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {transaction.admin_username || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {getTimeAgo(transaction.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </Card>

        {/* User Growth Chart Placeholder */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              User Growth (Last 30 Days)
            </h3>
            <div className="h-64 flex items-center justify-center rounded-2xl border border-gray-200/60 bg-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-dark-800/30">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Chart visualization would go here</p>
                <p className="text-sm text-gray-400">
                  {analytics.user_growth ? analytics.user_growth.length : 0} data points available
                </p>
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
