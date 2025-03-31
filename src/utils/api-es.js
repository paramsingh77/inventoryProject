/**
 * ES Module API utility for making HTTP requests
 * This module provides a configured axios instance
 */

import axios from 'axios';

// Handle potential browser issues with localStorage
let token;
try {
  token = localStorage.getItem('token');
} catch (e) {
  console.warn('Failed to read token from localStorage:', e);
  token = null;
}

// Configure axios defaults
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:2000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  },
  withCredentials: true
});

console.log('API baseURL:', process.env.REACT_APP_API_URL || 'http://localhost:2000');
console.log('API token available:', !!token);

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 Making ${config.method.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    let updatedConfig = { ...config };
    try {
      // Add trace logging for GET requests to help debug the repeating calls
      if (config.method === 'get' && config.url.includes('/purchase-orders/pending')) {
        console.trace(`Tracing API Request: ${config.method} ${config.url}`);
      }
      
      // Ensure URL always has /api/ prefix
      if (updatedConfig.url && !updatedConfig.url.includes('/api/') && !updatedConfig.url.startsWith('http')) {
        updatedConfig.url = updatedConfig.url.startsWith('/') ? `/api${updatedConfig.url}` : `/api/${updatedConfig.url}`;
      }
      
      // Get fresh token from localStorage for each request
      const freshToken = localStorage.getItem('token');
      if (freshToken) {
        updatedConfig.headers = {
          ...updatedConfig.headers,
          'Authorization': `Bearer ${freshToken}`
        };
      } else {
        console.warn('No auth token available for request');
      }
      
      // Ensure headers are properly set for each request
      updatedConfig.headers = {
        ...updatedConfig.headers,
        'Accept': 'application/json',
        'Content-Type': updatedConfig.headers['Content-Type'] || 'application/json',
      };
      
      console.log('API Request:', updatedConfig.method, updatedConfig.url);
      return updatedConfig;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return updatedConfig;
    }
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
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error(`API Error ${error.response.status} for ${error.config?.url}:`, error.response.data);
      
      // Handle authentication errors
      if (error.response.status === 401) {
        console.warn('Authentication error detected. User may need to log in again.');
        
        // Don't redirect immediately as it might cause loops
        // Instead set a flag in localStorage that the auth system can check
        try {
          localStorage.setItem('auth_error', 'true');
        } catch (e) {
          console.error('Failed to set auth_error flag:', e);
        }
      }
    } else if (error.request) {
      // The request was made but no response was received (network error)
      console.error('Network error - no response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Export the configured instance
export default api; 