/**
 * ES Module API utility for making HTTP requests
 * This module provides a configured axios instance
 */

import axios from 'axios';

// Configure axios defaults
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:2000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false // Disable sending cookies to avoid CORS preflight issues
});

console.log('API baseURL:', process.env.REACT_APP_API_URL || 'http://localhost:2000');

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Ensure URL always has /api/ prefix
    if (config.url && !config.url.includes('/api/') && !config.url.startsWith('http')) {
      config.url = config.url.startsWith('/') ? `/api${config.url}` : `/api/${config.url}`;
    }
    
    // Get token from localStorage if needed
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('API Request:', config.method, config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status || 'No Status', error.config?.url);
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Request made but no response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

// Export the configured instance
export default api; 