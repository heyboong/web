import axios from 'axios';

import { JWT_HOST_API } from 'configs/auth.config';


const axiosInstance = axios.create({
  baseURL: JWT_HOST_API,
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we have a response with data, use that error message
    if (error.response && error.response.data) {
      const errorData = error.response.data;
      const errorMessage = errorData.message || errorData.error || 'Something went wrong';
      return Promise.reject(new Error(errorMessage));
    }
    // Otherwise use the original error
    return Promise.reject(error);
  }
);

export default axiosInstance;
