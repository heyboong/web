import { useState, useEffect, useCallback } from 'react';
import { Page } from 'components/shared/Page';
import { Card } from 'components/ui';
import { useAuthContext } from 'app/contexts/auth/context';
import { 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function UserPointsPage() {
  const { isAdmin, isInitialized } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
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
    type: 'all',
    user_id: 'all'
  });

  // Function to load transactions
  const loadTransactions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        search: filters.search,
        type: filters.type,
        user_id: filters.user_id
      });

      const response = await fetch(`/api/admin/user-points?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          setTransactions(result.data.transactions);
          setPagination(result.data.pagination);
        } else {
          console.error('Failed to load transactions:', result.message);
          toast.error('Failed to load transactions');
        }
      } else {
        console.error('Failed to fetch transactions:', response.statusText);
        toast.error('Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Error loading transactions');
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.type, filters.user_id, pagination.limit]);

  // Load data on component mount
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    loadTransactions(newPage);
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
    <Page title="User Points Management">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  User Points Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage user points transactions and balances
                </p>
              </div>
            </div>

            {/* Filters */}
            <Card>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Search
                    </label>
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type
                    </label>
                    <select
                      value={filters.type}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Types</option>
                      <option value="earned">Earned</option>
                      <option value="spent">Spent</option>
                      <option value="bonus">Bonus</option>
                      <option value="penalty">Penalty</option>
                    </select>
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Transactions Table */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Points Transactions
                </h3>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : transactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No transactions found</p>
                ) : (
                  <div className="admin-table-wrapper">
                    <div className="admin-table-scroll custom-scrollbar">
                      <table className="admin-table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Transaction ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Points
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {transactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                              {transaction.transaction_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              <div>
                                <div className="font-medium">{transaction.username}</div>
                                <div className="text-gray-500">{transaction.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                transaction.type === 'earned' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                transaction.type === 'spent' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                transaction.type === 'bonus' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              }`}>
                                {transaction.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              <div className="flex items-center">
                                {transaction.type === 'earned' || transaction.type === 'bonus' ? (
                                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                                ) : (
                                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                                )}
                                <span className={`font-medium ${
                                  transaction.type === 'earned' || transaction.type === 'bonus' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {transaction.type === 'earned' || transaction.type === 'bonus' ? '+' : '-'}{formatNumber(transaction.points)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              {transaction.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {getTimeAgo(transaction.created_at)}
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
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.hasPrev}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={!pagination.hasNext}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Page>
  );
}
