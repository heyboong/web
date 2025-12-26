import { useState, useEffect, useCallback } from 'react';
import { Page } from 'components/shared/Page';
import { Card, Button, Input, Select, Badge, Skeleton } from 'components/ui';
import { useAuthContext } from 'app/contexts/auth/context';
import { useThemeContext } from 'app/contexts/theme/context';
import {
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  UserIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  UserPlusIcon,
  ArrowRightOnRectangleIcon,
  XCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

const typeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'login', label: 'Login' },
  { value: 'register', label: 'Register' },
  { value: 'website_created', label: 'Website Created' },
  { value: 'account_captured', label: 'Account Captured' },
  { value: 'template_created', label: 'Template Created' },
  { value: 'template_approved', label: 'Template Approved' },
  { value: 'other', label: 'Other' }
];

export default function ActivityLog() {
  const { isAdmin, isInitialized } = useAuthContext();
  const { isDark } = useThemeContext();
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({
    by_type: [],
    recent_24h: 0,
    top_users: []
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    type: 'all',
    user_id: 'all',
    search: ''
  });

  // Load activities
  const loadActivities = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });

      const response = await fetch(`/api/admin/activities?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          setActivities(result.data.activities || []);
          setPagination(prev => ({
            ...prev,
            ...result.data.pagination
          }));
        } else {
          toast.error('Failed to load activities');
        }
      } else {
        toast.error('Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      toast.error('Error loading activities');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, filters]);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/activities/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          setStats(result.data);
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  useEffect(() => {
    if (isInitialized && isAdmin) {
      loadActivities();
      loadStats();
    }
  }, [isInitialized, isAdmin, loadActivities, loadStats]);

  useEffect(() => {
    loadActivities(1);
  }, [loadActivities]);

  // Get activity icon and color
  const getActivityIcon = (type) => {
    const iconMap = {
      login: { Icon: ArrowRightOnRectangleIcon, color: 'info' },
      register: { Icon: UserPlusIcon, color: 'success' },
      website_created: { Icon: GlobeAltIcon, color: 'primary' },
      account_captured: { Icon: UserIcon, color: 'warning' },
      template_created: { Icon: DocumentTextIcon, color: 'info' },
      template_approved: { Icon: DocumentTextIcon, color: 'success' },
      other: { Icon: ClipboardDocumentListIcon, color: 'neutral' }
    };
    return iconMap[type] || iconMap.other;
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch {
      return dateString;
    }
  };

  // Get full date
  const getFullDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (!isInitialized) {
    return (
      <Page title="Activity Log">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Page>
    );
  }

  if (!isAdmin) {
    return (
      <Page title="Activity Log">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              You do not have permission to access this page.
            </p>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Activity Log">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}>
                  <ClipboardDocumentListIcon className={`h-6 w-6 ${isDark ? 'text-primary-400' : 'text-primary-600'}`} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Activity Log
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Monitor all user activities across the platform
                  </p>
                </div>
              </div>
              <Button
                variant="filled"
                color="primary"
                onClick={() => {
                  loadActivities(pagination.page);
                  loadStats();
                }}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            <Card skin="shadow" className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}>
                    <ClipboardDocumentListIcon className={`h-6 w-6 ${isDark ? 'text-primary-400' : 'text-primary-600'}`} />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last 24 Hours</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stats.recent_24h}
                  </p>
                </div>
              </div>
            </Card>

            {stats.by_type.slice(0, 3).map((item, index) => {
              const { Icon, color } = getActivityIcon(item.type);
              const colorClasses = {
                info: isDark ? 'bg-info-500/20 text-info-400' : 'bg-info-100 text-info-600',
                success: isDark ? 'bg-success-500/20 text-success-400' : 'bg-success-100 text-success-600',
                primary: isDark ? 'bg-primary-500/20 text-primary-400' : 'bg-primary-100 text-primary-600',
                warning: isDark ? 'bg-warning-500/20 text-warning-400' : 'bg-warning-100 text-warning-600',
                neutral: isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
              };
              
              return (
                <Card key={index} skin="shadow" className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                        {item.type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {item.count}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Filters */}
          <Card skin="shadow" className="p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search activities..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Type Filter */}
              <div className="relative">
                <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
                <Select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  data={typeOptions}
                  className="pl-10 w-full lg:w-48"
                />
              </div>

              {/* User Filter */}
              <div>
                <Input
                  placeholder="User ID (optional)"
                  value={filters.user_id === 'all' ? '' : filters.user_id}
                  onChange={(e) => handleFilterChange('user_id', e.target.value || 'all')}
                  className="w-full lg:w-48"
                />
              </div>
            </div>
          </Card>

          {/* Activities Table */}
          <Card skin="shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Activities
                </h3>
                <Badge color="neutral" variant="soft">
                  {pagination.total} total
                </Badge>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-12">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <ClipboardDocumentListIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No activities found
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your filters
                  </p>
                </div>
              ) : (
                <div className="admin-table-wrapper">
                  <div className="admin-table-scroll custom-scrollbar">
                    <table className="admin-table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          IP Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {activities.map((activity) => {
                        const { Icon, color } = getActivityIcon(activity.type);
                        return (
                          <tr key={activity.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge color={color} variant="soft" className="flex items-center gap-2 w-fit">
                                <Icon className="w-4 h-4" />
                                <span className="capitalize">
                                  {activity.type.replace(/_/g, ' ')}
                                </span>
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                  <UserIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {activity.username || 'Unknown'}
                                  </div>
                                  {activity.user_email && (
                                    <div className="text-xs text-gray-500 dark:text-gray-500">
                                      {activity.user_email}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-900 dark:text-white">
                                {activity.action}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {activity.description || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-500 dark:text-gray-500 font-mono">
                                {activity.ip_address || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600 dark:text-gray-400" title={getFullDate(activity.created_at)}>
                                {formatDate(activity.created_at)}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && !loading && (
              <div className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button
                    variant="outlined"
                    onClick={() => loadActivities(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => loadActivities(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing{' '}
                      <span className="font-medium">
                        {((pagination.page - 1) * pagination.limit) + 1}
                      </span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{pagination.total}</span>
                      {' '}results
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outlined"
                      size="sm"
                      onClick={() => loadActivities(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <span className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outlined"
                      size="sm"
                      onClick={() => loadActivities(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Top Active Users */}
          {stats.top_users && stats.top_users.length > 0 && (
            <Card skin="shadow" className="p-6 mt-6">
              <div className="flex items-center gap-3 mb-6">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Top Active Users
                </h3>
              </div>
              <div className="space-y-3">
                {stats.top_users.map((user, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary-600 text-white rounded-full font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.username}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          User ID: {user.user_id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {user.activity_count}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        activities
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </Page>
  );
}
