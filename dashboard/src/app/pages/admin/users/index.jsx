import { useState, useEffect, useCallback, useRef } from 'react';
import { Page } from "components/shared/Page";
import { Card, Button, Input, Select, Modal, Badge, Avatar } from "components/ui";
import { useAuthContext } from "app/contexts/auth/context";
import { userManagementService } from "services/userManagementService";
import { 
  PageHeader, 
  SearchBar, 
  FilterBadgeGroup, 
  EmptyState,
  TableSkeleton 
} from 'components/admin';
import { toast } from 'sonner';
import {
  PlusIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
  UserMinusIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  XCircleIcon,
  EllipsisVerticalIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' }
];

const roleOptions = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
  { value: 'moderator', label: 'Moderator' }
];

const statusColors = {
  active: 'success',
  inactive: 'neutral',
  suspended: 'error'
};

const statusIcons = {
  active: CheckCircleIcon,
  inactive: XCircleIcon,
  suspended: NoSymbolIcon
};

export default function UserManagement() {
  const { isAdmin } = useAuthContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceAction, setBalanceAction] = useState('increase'); // 'increase' or 'decrease'
  const [balanceAmount, setBalanceAmount] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'user',
    status: 'active'
  });

  const lastParamsRef = useRef(null);

  // Load users
  const loadUsers = useCallback(async ({ force = false } = {}) => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    };

    const paramsKey = JSON.stringify(params);
    if (!force && lastParamsRef.current === paramsKey) {
      return;
    }
    lastParamsRef.current = paramsKey;

    setLoading(true);
    try {
      const result = await userManagementService.getUsers(params);

      if (result.success) {
        setUsers(result.data.data.users);
        setPagination(result.data.data.pagination);
      } else {
        toast.error('Failed to load users', {
          description: result.error || 'Please try again later.',
          duration: 4000,
        });
      }
    } catch (error) {
      toast.error('Failed to load users', {
        description: error.message,
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadUsers();
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [loadUsers]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Handle user selection
  const handleUserSelect = (userId, checked) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  // Handle create user
  const handleCreateUser = async () => {
    try {
      const result = await userManagementService.createUser(formData);
      
      if (result.success) {
        toast.success('User created successfully', {
          description: `${formData.username} has been created.`,
          duration: 3000,
        });
        setShowCreateModal(false);
        setFormData({
          username: '',
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          role: 'user',
          status: 'active'
        });
        loadUsers({ force: true });
      } else {
        toast.error('Failed to create user', {
          description: result.error,
          duration: 4000,
        });
      }
    } catch (error) {
      toast.error('Failed to create user', {
        description: error.message,
        duration: 4000,
      });
    }
  };

  // Handle edit user
  const handleEditUser = async () => {
    try {
      const result = await userManagementService.updateUser(currentUser.id, formData);
      
      if (result.success) {
        toast.success('User updated successfully', {
          description: `${formData.username} has been updated.`,
          duration: 3000,
        });
        setShowEditModal(false);
        setCurrentUser(null);
        loadUsers({ force: true });
      } else {
        toast.error('Failed to update user', {
          description: result.error,
          duration: 4000,
        });
      }
    } catch (error) {
      toast.error('Failed to update user', {
        description: error.message,
        duration: 4000,
      });
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    try {
      const result = await userManagementService.deleteUser(currentUser.id);
      
      if (result.success) {
        toast.success('User deleted successfully', {
          description: `${currentUser.username} has been deleted.`,
          duration: 3000,
        });
        setShowDeleteModal(false);
        setCurrentUser(null);
        loadUsers({ force: true });
      } else {
        toast.error('Failed to delete user', {
          description: result.error,
          duration: 4000,
        });
      }
    } catch (error) {
      toast.error('Failed to delete user', {
        description: error.message,
        duration: 4000,
      });
    }
  };

  // Handle bulk operations
  const handleBulkOperation = async (action) => {
    try {
      const result = await userManagementService.bulkOperation(action, selectedUsers);
      
      if (result.success) {
        toast.success(`Bulk ${action} completed`, {
          description: `${result.data.affectedRows} users have been ${action}d.`,
          duration: 3000,
        });
        setShowBulkModal(false);
        setSelectedUsers([]);
        loadUsers({ force: true });
      } else {
        toast.error(`Failed to ${action} users`, {
          description: result.error,
          duration: 4000,
        });
      }
    } catch (error) {
      toast.error(`Failed to ${action} users`, {
        description: error.message,
        duration: 4000,
      });
    }
  };

  // Handle export
  const handleExport = async (format = 'csv') => {
    try {
      const result = await userManagementService.exportUsers(format, filters.status);
      if (result.success) {
        toast.success('Export completed', {
          description: `Users have been exported as ${format.toUpperCase()}.`,
          duration: 3000,
        });
      } else {
        toast.error('Export failed', {
          description: result.error,
          duration: 4000,
        });
      }
    } catch (error) {
      toast.error('Export failed', {
        description: error.message,
        duration: 4000,
      });
    }
  };

  // Open edit modal
  const openEditModal = (user) => {
    setCurrentUser(user);
    const mappedRole = user.role || (user.is_admin ? 'admin' : 'user');
    const mappedStatus = user.status || (user.is_active ? 'active' : 'inactive');
    
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: mappedRole,
      status: mappedStatus
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (user) => {
    setCurrentUser(user);
    setShowDeleteModal(true);
  };

  // Open balance modal
  const openBalanceModal = (user, action) => {
    setCurrentUser(user);
    setBalanceAction(action);
    setBalanceAmount('');
    setShowBalanceModal(true);
  };

  // Handle balance update
  const handleBalanceUpdate = async () => {
    if (!balanceAmount || isNaN(balanceAmount) || parseFloat(balanceAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const amount = parseFloat(balanceAmount);
      const newBalance = balanceAction === 'increase' 
        ? (parseFloat(currentUser.balance) || 0) + amount 
        : Math.max(0, (parseFloat(currentUser.balance) || 0) - amount);

      const result = await userManagementService.updateUserBalance(currentUser.id, newBalance);
      
      if (result.success) {
        toast.success(`Balance ${balanceAction}d successfully`, {
          description: `${currentUser.username}'s balance is now $${newBalance.toFixed(2)}`,
          duration: 3000,
        });
        setShowBalanceModal(false);
        setBalanceAmount('');
        loadUsers({ force: true });
      } else {
        toast.error('Failed to update balance', {
          description: result.error,
          duration: 4000,
        });
      }
    } catch (error) {
      toast.error('Failed to update balance', {
        description: error.message,
        duration: 4000,
      });
    }
  };

  if (!isAdmin) {
    return (
      <Page title="User Management">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              You don&apos;t have permission to access this page.
            </p>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="User Management">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0">
          {/* Enhanced Header */}
          <PageHeader
            title="User Management"
            description="Manage users, roles, and permissions for your application"
            icon={UserGroupIcon}
            actions={
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleExport('csv')}
                  className="inline-flex items-center gap-2"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Export
                </Button>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add User
                </Button>
              </div>
            }
            stats={[
              { label: 'Total Users', value: pagination.total || 0, icon: UserGroupIcon },
              { 
                label: 'Active', 
                value: users.filter(u => u.status === 'active' || u.is_active).length,
                icon: CheckCircleIcon
              }
            ]}
          />

          {/* Enhanced Filters and Actions */}
          <Card className="p-6 mb-6">
            <div className="flex flex-col gap-4">
              {/* Search and Filters Row */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <SearchBar
                  value={filters.search}
                  onChange={(value) => handleFilterChange('search', value)}
                  placeholder="Search by username, email, or name..."
                  className="flex-1 max-w-md"
                />
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  data={statusOptions}
                  className="w-40"
                />
              </div>

              {/* Active Filters Display */}
              {(filters.search || filters.status !== 'all') && (
                <FilterBadgeGroup
                  filters={[
                    filters.search && { 
                      key: 'search', 
                      label: 'Search', 
                      value: filters.search 
                    },
                    filters.status !== 'all' && { 
                      key: 'status', 
                      label: 'Status', 
                      value: statusOptions.find(s => s.value === filters.status)?.label 
                    }
                  ].filter(Boolean)}
                  onRemoveFilter={(key) => {
                    if (key === 'search') handleFilterChange('search', '');
                    if (key === 'status') handleFilterChange('status', 'all');
                  }}
                  onClearAll={() => {
                    handleFilterChange('search', '');
                    handleFilterChange('status', 'all');
                  }}
                />
              )}

              {/* Bulk Actions */}
              {selectedUsers.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2 ml-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowBulkModal(true)}
                    >
                      Bulk Actions
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowBulkModal(true)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete Selected
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Users Table */}
          <Card>
            {loading ? (
              <TableSkeleton rows={10} columns={6} />
            ) : users.length === 0 ? (
              <EmptyState
                icon={UserGroupIcon}
                title="No users found"
                description={
                  filters.search || filters.status !== 'all'
                    ? "Try adjusting your filters"
                    : "Get started by adding your first user"
                }
                action={() => setShowCreateModal(true)}
                actionLabel="Add User"
              />
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => toast.info('Export feature coming soon')}
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Export
                </Button>
                {selectedUsers.length > 0 && (
                  <Button
                    variant="outline"
                    color="error"
                    onClick={() => setShowBulkModal(true)}
                  >
                    <EllipsisVerticalIcon className="h-4 w-4 mr-2" />
                    Bulk Actions ({selectedUsers.length})
                  </Button>
                )}
                <Button
                  color="primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            )}
          </Card>

          {/* Users Table */}
          <Card className="overflow-hidden admin-table-card">
            <div className="admin-table-wrapper">
              <div className="admin-table-scroll custom-scrollbar">
                <table className="admin-table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === users.length && users.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mx-auto"></div>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <div className="text-gray-500 dark:text-gray-400">
                          <UserMinusIcon className="h-12 w-12 mx-auto mb-4" />
                          <p>No users found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const StatusIcon = statusIcons[user.status] || XCircleIcon;
                      return (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={(e) => handleUserSelect(user.id, e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar
                                src={user.avatar}
                                alt={user.username}
                                className="h-10 w-10 rounded-full mr-4"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.username}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {user.email}
                                </div>
                                {(user.first_name || user.last_name) && (
                                  <div className="text-xs text-gray-400">
                                    {user.first_name} {user.last_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              color={user.role === 'admin' ? 'error' : user.role === 'moderator' ? 'info' : 'neutral'}
                              variant="soft"
                            >
                              {user.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <StatusIcon className="h-4 w-4 mr-2 text-gray-400" />
                              <Badge
                                color={statusColors[user.status]}
                                variant="soft"
                              >
                                {user.status}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                ${(parseFloat(user.balance) || 0).toFixed(2)}
                              </span>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  color="success"
                                  onClick={() => openBalanceModal(user, 'increase')}
                                  className="h-6 w-6 p-0"
                                >
                                  +
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  color="error"
                                  onClick={() => openBalanceModal(user, 'decrease')}
                                  className="h-6 w-6 p-0"
                                >
                                  -
                                </Button>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(user)}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                color="error"
                                onClick={() => openDeleteModal(user)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing{' '}
                      <span className="font-medium">
                        {(pagination.page - 1) * pagination.limit + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">{pagination.total}</span>{' '}
                      results
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={page === pagination.page ? 'solid' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username *
              </label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password *
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
              <Select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                data={roleOptions}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name
              </label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name
              </label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Enter last name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                data={statusOptions.filter(opt => opt.value !== 'all')}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={handleCreateUser}
              disabled={!formData.username || !formData.email || !formData.password}
            >
              Create User
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username *
              </label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password (leave blank to keep current)
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
              <Select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                data={roleOptions}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name
              </label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name
              </label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Enter last name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                data={statusOptions.filter(opt => opt.value !== 'all')}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={handleEditUser}
              disabled={!formData.username || !formData.email}
            >
              Update User
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Are you sure you want to delete this user?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This action cannot be undone. The user <strong>{currentUser?.username}</strong> will be permanently removed.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              color="error"
              onClick={handleDeleteUser}
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>

      {/* Balance Update Modal */}
      <Modal
        open={showBalanceModal}
        onClose={() => setShowBalanceModal(false)}
        title={`${balanceAction === 'increase' ? 'Increase' : 'Decrease'} Balance`}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                balanceAction === 'increase' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {balanceAction === 'increase' ? '+' : '-'}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {balanceAction === 'increase' ? 'Increase' : 'Decrease'} Balance for {currentUser?.username}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Current balance: <strong>${(parseFloat(currentUser?.balance) || 0).toFixed(2)}</strong>
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>
            
            {balanceAction === 'decrease' && (
              <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                <strong>Warning:</strong> Balance cannot go below $0.00
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowBalanceModal(false)}
            >
              Cancel
            </Button>
            <Button
              color={balanceAction === 'increase' ? 'success' : 'error'}
              onClick={handleBalanceUpdate}
            >
              {balanceAction === 'increase' ? 'Increase' : 'Decrease'} Balance
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Actions Modal */}
      <Modal
        open={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Actions"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You have selected <strong>{selectedUsers.length}</strong> users. Choose an action to perform on all selected users.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              color="success"
              onClick={() => handleBulkOperation('activate')}
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Activate
            </Button>
            <Button
              variant="outline"
              color="neutral"
              onClick={() => handleBulkOperation('deactivate')}
            >
              <XCircleIcon className="h-4 w-4 mr-2" />
              Deactivate
            </Button>
            <Button
              variant="outline"
              color="error"
              onClick={() => handleBulkOperation('suspend')}
            >
              <NoSymbolIcon className="h-4 w-4 mr-2" />
              Suspend
            </Button>
            <Button
              variant="outline"
              color="error"
              onClick={() => handleBulkOperation('delete')}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowBulkModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}
