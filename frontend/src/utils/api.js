/**
 * API utility for making HTTP requests
 * This module provides a configured axios instance
 */

import axios from 'axios';
import { API_CONFIG } from './apiConfig';

// FIXED: Use the new API configuration that ensures correct production URL
const api = axios.create({
  baseURL: API_CONFIG.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage if needed
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Log the full URL being requested
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log('API Request:', config.method?.toUpperCase(), fullUrl);
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
// api.interceptors.response.use(
//   (response) => {
//     console.log('API Response Success:', {
//       status: response.status,
//       url: response.config.url,
//       method: response.config.method?.toUpperCase()
//     });
//     return response;
//   },
//   (error) => {
//     if (error.response) {
//       console.error('API Response Error:', {
//         status: error.response.status,
//         url: error.config?.url,
//         data: error.response.data,
//         method: error.config?.method?.toUpperCase()
//       });
//     } else if (error.request) {
//       console.error('API Request Error: No response received', {
//         url: error.config?.url,
//         method: error.config?.method?.toUpperCase()
//       });
//     } else {
//       console.error('API Error:', error.message);
//     }
//     return Promise.reject(error);
//   }
// );

// Export both as default and named export for maximum compatibility
export default api;
export { api };

// Remove CommonJS compatibility
// if (typeof module !== 'undefined') {
//   module.exports = api;
//   module.exports.default = api;
// } 