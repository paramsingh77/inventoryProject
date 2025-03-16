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
  }
});

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
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

// Export the configured instance
export default api; 