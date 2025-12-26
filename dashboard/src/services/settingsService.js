import axios from 'utils/axios';

export const settingsService = {
  // Get public settings (for all users)
  getPublicSettings: async () => {
    try {
      const response = await axios.get('/settings');
      return {
        success: true,
        data: response.data.settings
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  // Get all settings (admin only)
  getAdminSettings: async () => {
    try {
      const response = await axios.get('/api/admin/settings');
      return {
        success: true,
        data: response.data.settings
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  // Update settings (admin only)
  updateSettings: async (settings) => {
    try {
      const response = await axios.put('/api/admin/settings', { settings });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
};
