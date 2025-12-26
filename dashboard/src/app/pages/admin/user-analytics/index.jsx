import { useState, useEffect, useCallback } from 'react';
import { Page } from 'components/shared/Page';
import { Card } from 'components/ui';
import { useAuthContext } from 'app/contexts/auth/context';
import { PageHeader, SearchBar, FilterBadgeGroup, TableSkeleton, EmptyState, Pagination } from 'components/admin';
import { 
  UserIcon,
  EyeIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function UserAnalyticsPage() {
  const { isAdmin, isInitialized } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState({
    search: '',
    user_id: 'all'
  });

  // Function to load analytics
  const loadAnalytics = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        search: filters.search,
        user_id: filters.user_id
      });

      const response = await fetch(`/api/admin/user-analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          setAnalytics(result.data.analytics);
          setPagination(result.data.pagination);
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
  }, [filters.search, filters.user_id, pagination.limit]);

  // Load data on component mount
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    loadAnalytics(newPage);
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

  return (
    <Page title="User Analytics">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0">
          <div className="space-y-6">
            {/* Header */}
            <PageHeader
              title="User Analytics"
              description="Track user behavior and engagement metrics"
              icon={ChartBarIcon}
              stats={[
                { label: 'Total Records', value: pagination.total },
                { label: 'Current Page', value: pagination.page },
                { label: 'Total Pages', value: pagination.totalPages }
              ]}
            />

            {/* Filters */}
            <Card>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Search
                    </label>
                    <SearchBar
                      value={filters.search}
                      onChange={(value) => handleFilterChange('search', value)}
                      placeholder="Search users..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      User ID
                    </label>
                    <input
                      type="text"
                      placeholder="User ID..."
                      value={filters.user_id}
                      onChange={(e) => handleFilterChange('user_id', e.target.value)}
                      className="w-full rounded-xl border border-gray-200/60 bg-white/60 px-3 py-2 text-gray-900 shadow-soft ring-1 ring-gray-900/5 backdrop-blur-xl transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-white/10 dark:bg-dark-800/40 dark:text-dark-50 dark:ring-white/10"
                    />
                  </div>
                </div>
                <FilterBadgeGroup
                  filters={[
                    filters.search && { label: `Search: ${filters.search}`, onRemove: () => handleFilterChange('search', '') },
                    filters.user_id !== 'all' && { label: `User ID: ${filters.user_id}`, onRemove: () => handleFilterChange('user_id', 'all') }
                  ].filter(Boolean)}
                />
              </div>
            </Card>

            {/* Analytics Table */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  User Analytics Data
                </h3>
                {loading ? (
                  <TableSkeleton rows={5} />
                ) : analytics.length === 0 ? (
                  <EmptyState
                    icon={ChartBarIcon}
                    title="No analytics data found"
                    description="No user analytics data available for the selected filters."
                  />
                ) : (
                  <div className="admin-table-wrapper">
                    <div className="admin-table-scroll custom-scrollbar">
                      <table className="admin-table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Sessions
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Page Views
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Tool Usage
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Last Activity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {analytics.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              <div>
                                <div className="font-medium">{user.username}</div>
                                <div className="text-gray-500">{user.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              <div className="flex items-center">
                                <UserIcon className="h-4 w-4 text-blue-500 mr-2" />
                                {formatNumber(user.session_count || 0)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              <div className="flex items-center">
                                <EyeIcon className="h-4 w-4 text-green-500 mr-2" />
                                {formatNumber(user.page_views || 0)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              <div className="flex items-center">
                                <ChartBarIcon className="h-4 w-4 text-purple-500 mr-2" />
                                {formatNumber(user.tool_usage_count || 0)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center">
                                <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                                {user.last_activity ? getTimeAgo(user.last_activity) : 'Never'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                              }`}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                    showInfo
                    info={`Showing ${((pagination.page - 1) * pagination.limit) + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} results`}
                  />
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Page>
  );
}
