import axios from 'utils/axios';

export const userManagementService = {
  // Get all users with pagination and filters
  async getUsers(params = {}) {
    try {
      const response = await axios.get('/api/admin/users', { params });
      
      // Map backend data to frontend format
      if (response.data.data && response.data.data.users) {
        response.data.data.users = response.data.data.users.map(user => ({
          ...user,
          role: user.is_admin ? 'admin' : 'user',
          status: user.is_active ? 'active' : 'inactive'
        }));
      }
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('User management API error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response?.data
      });
      return {
        success: false,
        error: error.message || (typeof error === 'string' ? error : 'Failed to fetch users')
      };
    }
  },

  // Get single user by ID
  async getUserById(id) {
    try {
      const response = await axios.get(`/admin/users/${id}`);
      
      // Map backend data to frontend format
      if (response.data.user) {
        response.data.user = {
          ...response.data.user,
          role: response.data.user.is_admin ? 'admin' : 'user',
          status: response.data.user.is_active ? 'active' : 'inactive'
        };
      }
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('User management API error:', error);
      return {
        success: false,
        error: error.message || (typeof error === 'string' ? error : 'Failed to fetch user')
      };
    }
  },

  // Create new user
  async createUser(userData) {
    try {
      // Map frontend data to backend format
      const backendData = {
        ...userData,
        is_admin: userData.role === 'admin',
        is_active: userData.status === 'active'
      };
      delete backendData.role;
      delete backendData.status;
      
      const response = await axios.post('/api/admin/users', backendData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('User management API error:', error);
      return {
        success: false,
        error: error.message || (typeof error === 'string' ? error : 'Failed to create user')
      };
    }
  },

  // Update user
  async updateUser(id, userData) {
    try {
      // Map frontend data to backend format
      const backendData = {
        ...userData,
        is_admin: userData.role === 'admin',
        is_active: userData.status === 'active'
      };
      delete backendData.role;
      delete backendData.status;
      
      const response = await axios.put(`/admin/users/${id}`, backendData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('User management API error:', error);
      return {
        success: false,
        error: error.message || (typeof error === 'string' ? error : 'Failed to update user')
      };
    }
  },

  // Delete user
  async deleteUser(id) {
    try {
      const response = await axios.delete(`/admin/users/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('User management API error:', error);
      return {
        success: false,
        error: error.message || (typeof error === 'string' ? error : 'Failed to delete user')
      };
    }
  },

  // Update user balance
  async updateUserBalance(id, balance) {
    try {
      const response = await axios.put(`/api/admin/users/${id}/balance`, { balance });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('User management API error:', error);
      return {
        success: false,
        error: error.message || (typeof error === 'string' ? error : 'Failed to update user balance')
      };
    }
  },

  // Bulk operations
  async bulkOperation(action, userIds) {
    try {
      const response = await axios.post('/api/admin/users/bulk', { action, userIds });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('User management API error:', error);
      return {
        success: false,
        error: error.message || (typeof error === 'string' ? error : 'Failed to perform bulk operation')
      };
    }
  },

  // Export users
  async exportUsers(format = 'csv', status = 'all') {
    try {
      const response = await axios.get('/api/admin/users/export', { 
        params: { format, status },
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      if (format === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return { success: true };
      }

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('User management API error:', error);
      return {
        success: false,
        error: error.message || (typeof error === 'string' ? error : 'Failed to export users')
      };
    }
  }
};
