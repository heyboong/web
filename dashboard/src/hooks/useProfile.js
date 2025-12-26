import { useState } from 'react';
import axios from 'utils/axios';
import { toast } from 'sonner';

export const useProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateProfile = async (profileData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.put('/user/profile', profileData);
      
      if (response.data.status === 'success') {
        toast.success('Profile updated successfully!', {
          description: 'Your profile information has been saved.',
          duration: 3000,
        });
        
        return {
          success: true,
          user: response.data.user,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to update profile';
      
      toast.error('Profile update failed', {
        description: errorMessage,
        duration: 4000,
      });

      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get('/user/profile');
      
      if (response.data.status === 'success') {
        return {
          success: true,
          user: response.data.user
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch profile');
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to fetch profile';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateProfile,
    fetchProfile,
    isLoading,
    error,
    clearError: () => setError(null)
  };
};

