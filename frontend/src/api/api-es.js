import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';

// FIXED: Use the new API configuration that ensures correct production URL
const API_BASE_URL = API_CONFIG.BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

console.log('API baseURL:', API_BASE_URL);
console.log('API token available:', !!localStorage.getItem('token'));

export default api; 