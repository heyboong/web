import { useState, useEffect } from 'react';
import { Page } from "components/shared/Page";
import { Card, Button, Input, Textarea, Select, Modal, Badge } from "components/ui";
import { useThemeContext } from "app/contexts/theme/context";
import { PageHeader, SearchBar, FilterBadgeGroup, EmptyState, QuickActions } from "components/admin";
import { 
  GlobeAltIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  LockClosedIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function DomainManagement() {
  const { isDark } = useThemeContext();
  const [domains, setDomains] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [formData, setFormData] = useState({
    domain_name: '',
    description: '',
    access_type: 'public',
    is_active: true
  });

  const [allowedUsers, setAllowedUsers] = useState([]);
  const [newUserInput, setNewUserInput] = useState('');

  const [userFormData, setUserFormData] = useState({
    user_id: '',
    domain_id: ''
  });

  const accessTypes = [
    { value: 'public', label: 'Public (All Users)' },
    { value: 'private', label: 'Private (Selected Users)' }
  ];

  useEffect(() => {
    loadDomains();
    // Only load users when needed for private domains
    // loadUsers() will be called when user selects "private" access type
  }, []);

  // Lightweight polling to keep domain data fresh while page is open
  useEffect(() => {
    if (!autoRefresh) return;
    const intervalId = setInterval(() => {
      loadDomains();
    }, 15000); // refresh every 15s
    return () => clearInterval(intervalId);
  }, [autoRefresh]);

  const loadDomains = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/admin/domains', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDomains(data.data || []);
      } else {
        toast.error('Failed to load domains');
      }
    } catch (error) {
      console.error('Error loading domains:', error);
      toast.error('Failed to load domains');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('Auth token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.error('No auth token found');
        toast.error('Authentication required. Please login again.');
        return;
      }

      const response = await fetch('/api/admin/users/simple', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Users API response:', data);
        setUsers(data.data || []);
        console.log(`Successfully loaded ${data.data?.length || 0} users`);
      } else if (response.status === 401 || response.status === 403) {
        console.error('Authentication failed:', response.status);
        toast.error('Authentication failed. Please login again.');
        // Optionally redirect to login
        // window.location.href = '/login';
      } else if (response.status === 400) {
        const errorData = await response.json().catch(() => ({ message: 'Bad Request' }));
        console.error('Bad request error:', errorData);
        toast.error(`Failed to load users: ${errorData.message || 'Bad Request'}`);
      } else {
        console.error('Failed to load users:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Error data:', errorData);
        toast.error(`Failed to load users: ${errorData.message || 'Server error'}`);
        console.error('Token payload:', token ? JSON.parse(atob(token.split('.')[1])) : 'No token');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Network error while loading users. Please check your connection.');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Reset allowed users when changing to public
    if (field === 'access_type' && value === 'public') {
      setAllowedUsers([]);
    }
    
    // Load users when switching to private access type
    if (field === 'access_type' && value === 'private' && users.length === 0) {
      loadUsers();
    }
  };

  const handleAddAllowedUser = () => {
    if (!newUserInput.trim()) return;
    
    // Check if user already exists
    const userExists = allowedUsers.some(user => 
      user.username.toLowerCase() === newUserInput.toLowerCase()
    );
    
    if (userExists) {
      toast.error('User already added to allowed list');
      return;
    }
    
    // Debug: Log users array
    console.log('Users array:', users);
    console.log('Looking for username:', newUserInput);
    
    // Find user in users list
    const user = Array.isArray(users) ? users.find(u => 
      u.username.toLowerCase() === newUserInput.toLowerCase()
    ) : null;
    
    console.log('Found user:', user);
    
    if (!user) {
      toast.error(`User "${newUserInput}" not found. Available users: ${Array.isArray(users) ? users.map(u => u.username).join(', ') : 'None loaded'}`);
      return;
    }
    
    setAllowedUsers(prev => [...prev, user]);
    setNewUserInput('');
  };

  const handleRemoveAllowedUser = (userId) => {
    setAllowedUsers(prev => prev.filter(user => user.id !== userId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.domain_name) {
      toast.error('Domain name is required');
      return;
    }

    // Validate private domain has users
    if (formData.access_type === 'private' && allowedUsers.length === 0) {
      toast.error('Private domain must have at least one allowed user');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const url = selectedDomain 
        ? `/api/admin/domains/${selectedDomain.id}`
        : '/api/admin/domains';
      const method = selectedDomain ? 'PUT' : 'POST';
      
      const submitData = {
        ...formData,
        allowed_users: formData.access_type === 'private' ? allowedUsers.map(u => u.id) : []
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        toast.success(selectedDomain ? 'Domain updated successfully!' : 'Domain created successfully!');
        loadDomains();
        resetForm();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to save domain');
      }
    } catch (error) {
      console.error('Error saving domain:', error);
      toast.error('Failed to save domain');
    }
  };

  const handleEdit = (domain) => {
    setSelectedDomain(domain);
    setFormData({
      domain_name: domain.domain_name,
      description: domain.description || '',
      access_type: domain.access_type,
      is_active: domain.is_active
    });
    
    // Set allowed users for private domains
    if (domain.access_type === 'private' && domain.allowed_users) {
      setAllowedUsers(domain.allowed_users);
    } else {
      setAllowedUsers([]);
    }
    
    // Load users if needed for private domains
    if (domain.access_type === 'private' && users.length === 0) {
      loadUsers();
    }
    
    setIsEditModalOpen(true);
  };

  const handleDelete = async (domain) => {
    if (!confirm(`Are you sure you want to delete "${domain.domain_name}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/admin/domains/${domain.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Domain deleted successfully!');
        loadDomains();
      } else {
        toast.error('Failed to delete domain');
      }
    } catch (error) {
      console.error('Error deleting domain:', error);
      toast.error('Failed to delete domain');
    }
  };

  const handleManageUsers = (domain) => {
    setSelectedDomain(domain);
    setUserFormData({
      user_id: '',
      domain_id: domain.id
    });
    
    // Load users if not already loaded
    if (users.length === 0) {
      loadUsers();
    }
    
    setIsUserModalOpen(true);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!userFormData.user_id) {
      toast.error('Please select a user');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/admin/domains/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userFormData)
      });

      if (response.ok) {
        toast.success('User added to domain successfully!');
        loadDomains();
        setUserFormData({
          user_id: '',
          domain_id: selectedDomain.id
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to add user to domain');
      }
    } catch (error) {
      console.error('Error adding user to domain:', error);
      toast.error('Failed to add user to domain');
    }
  };

  const handleRemoveUser = async (domainId, userId) => {
    if (!confirm('Are you sure you want to remove this user from the domain?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/admin/domains/${domainId}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('User removed from domain successfully!');
        loadDomains();
      } else {
        toast.error('Failed to remove user from domain');
      }
    } catch (error) {
      console.error('Error removing user from domain:', error);
      toast.error('Failed to remove user from domain');
    }
  };

  const resetForm = () => {
    setFormData({
      domain_name: '',
      description: '',
      access_type: 'public',
      is_active: true
    });
    setAllowedUsers([]);
    setNewUserInput('');
    setSelectedDomain(null);
    setIsModalOpen(false);
    setIsEditModalOpen(false);
    setIsUserModalOpen(false);
  };

  const filteredDomains = Array.isArray(domains) ? domains.filter(domain => {
    const matchesSearch = domain.domain_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (domain.description && domain.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || domain.access_type === filterType;
    return matchesSearch && matchesType;
  }) : [];

  return (
    <Page title="Domain Management">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0">
          {/* Header */}
          <PageHeader
            title="Domain Management"
            description="Manage domains and user access permissions"
            icon={GlobeAltIcon}
            action={
              <Button
                variant="filled"
                color="primary"
                onClick={() => setIsModalOpen(true)}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Domain
              </Button>
            }
            stats={[
              { label: 'Total Domains', value: domains.length },
              { label: 'Active', value: domains.filter(d => d.is_active).length },
              { label: 'Public', value: domains.filter(d => d.access_type === 'public').length }
            ]}
          />

          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search domains..."
                className="max-w-md"
              />
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                data={[
                  { value: 'all', label: 'All Types' },
                  { value: 'public', label: 'Public Domains' },
                  { value: 'private', label: 'Private Domains' }
                ]}
                className="max-w-xs"
              />
              <div className="flex items-center gap-3 ml-auto">
                <Button
                  variant="outlined"
                  onClick={loadDomains}
                  disabled={isLoading}
                >
                  {isLoading ? 'Refreshing…' : 'Refresh'}
                </Button>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                  Auto refresh
                </label>
              </div>
            </div>
            <FilterBadgeGroup
              filters={[
                searchQuery && { label: `Search: ${searchQuery}`, onRemove: () => setSearchQuery('') },
                filterType !== 'all' && { label: `Type: ${filterType}`, onRemove: () => setFilterType('all') }
              ].filter(Boolean)}
            />
          </div>

          {/* Domains Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDomains.map((domain) => (
              <Card key={domain.id} className={`p-6 hover:shadow-lg transition-all duration-200 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <GlobeAltIcon className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {domain.domain_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outlined" 
                          color={domain.access_type === 'public' ? 'success' : 'warning'}
                        >
                          {domain.access_type === 'public' ? (
                            <>
                              <LockOpenIcon className="h-3 w-3 mr-1" />
                              Public
                            </>
                          ) : (
                            <>
                              <LockClosedIcon className="h-3 w-3 mr-1" />
                              Private
                            </>
                          )}
                        </Badge>
                        <Badge 
                          variant={domain.is_active ? 'filled' : 'outlined'}
                          color={domain.is_active ? 'success' : 'error'}
                        >
                          {domain.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {domain.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {domain.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <UserGroupIcon className="h-4 w-4" />
                  <span>
                    {domain.access_type === 'public' 
                      ? 'All users' 
                      : `${domain.allowed_users?.length || 0} users`
                    }
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span>Created: {new Date(domain.created_at).toLocaleDateString()}</span>
                </div>

                <QuickActions
                  actions={[
                    { label: 'Edit', icon: PencilIcon, onClick: () => handleEdit(domain), color: 'blue' },
                    ...(domain.access_type === 'private' ? [
                      { label: 'Manage Users', icon: UserGroupIcon, onClick: () => handleManageUsers(domain), color: 'purple' }
                    ] : []),
                    { label: 'Delete', icon: TrashIcon, onClick: () => handleDelete(domain), color: 'red' }
                  ]}
                />
              </Card>
            ))}
          </div>

          {filteredDomains.length === 0 && !isLoading && (
            <EmptyState
              icon={GlobeAltIcon}
              title="No domains found"
              description={
                searchQuery || filterType !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating your first domain.'
              }
              action={
                !searchQuery && filterType === 'all' && (
                  <Button variant="filled" color="primary" onClick={() => setIsModalOpen(true)}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Domain
                  </Button>
                )
              }
            />
          )}
        </div>
      </div>

      {/* Create/Edit Domain Modal */}
      <Modal open={isModalOpen || isEditModalOpen} onClose={resetForm}>
        <div className="p-6 max-w-2xl">
          <h3 className="text-lg font-semibold mb-4">
            {selectedDomain ? 'Edit Domain' : 'Create New Domain'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Domain Name *
              </label>
              <Input
                value={formData.domain_name}
                onChange={(e) => handleInputChange('domain_name', e.target.value)}
                placeholder="example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter domain description"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Access Type *
              </label>
              <Select
                value={formData.access_type}
                onChange={(e) => handleInputChange('access_type', e.target.value)}
                data={accessTypes}
              />
            </div>

            {/* Allowed Users Section - Only show for Private domains */}
            {formData.access_type === 'private' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Allowed Users * 
                  <span className="text-xs text-gray-500 ml-2">
                    ({Array.isArray(users) ? users.length : 0} users loaded)
                  </span>
                </label>
                
                {/* Add User Input */}
                <div className="flex gap-2 mb-4">
                  <Input
                    value={newUserInput}
                    onChange={(e) => setNewUserInput(e.target.value)}
                    placeholder="Enter username to add"
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAllowedUser();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outlined"
                    color="primary"
                    onClick={handleAddAllowedUser}
                    disabled={!newUserInput.trim()}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    color="secondary"
                    onClick={loadUsers}
                    title="Refresh users list"
                  >
                    🔄
                  </Button>
                </div>

                {/* Allowed Users List */}
                <div className="space-y-2">
                  {allowedUsers.length > 0 ? (
                    allowedUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-700">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{user.username}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outlined"
                          size="sm"
                          color="error"
                          onClick={() => handleRemoveAllowedUser(user.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <UserGroupIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No users added yet</p>
                      <p className="text-sm">Add users who can access this private domain</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active Domain
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outlined"
                onClick={resetForm}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="filled"
                color="primary"
              >
                {selectedDomain ? 'Update Domain' : 'Create Domain'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Manage Users Modal */}
      <Modal open={isUserModalOpen} onClose={resetForm}>
        <div className="p-6 max-w-2xl">
          <h3 className="text-lg font-semibold mb-4">
            Manage Users - {selectedDomain?.domain_name}
          </h3>
          
          {/* Add User Form */}
          <form onSubmit={handleAddUser} className="mb-6">
            <div className="flex gap-3">
              <Select
                value={userFormData.user_id}
                onChange={(e) => setUserFormData(prev => ({ ...prev, user_id: e.target.value }))}
                data={Array.isArray(users) ? users.map(user => ({ value: user.id, label: user.username })) : []}
                placeholder="Select user"
                className="flex-1"
              />
              <Button
                type="submit"
                variant="filled"
                color="primary"
              >
                Add User
              </Button>
            </div>
          </form>

          {/* Current Users List */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-white">Current Users:</h4>
            {selectedDomain?.allowed_users?.length > 0 ? (
              Array.isArray(selectedDomain.allowed_users) ? selectedDomain.allowed_users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <Button
                    variant="outlined"
                    size="sm"
                    color="error"
                    onClick={() => handleRemoveUser(selectedDomain.id, user.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              )) : null
            ) : (
              <p className="text-gray-500 text-center py-4">No users assigned to this domain</p>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <Button
              type="button"
              variant="outlined"
              onClick={resetForm}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}
