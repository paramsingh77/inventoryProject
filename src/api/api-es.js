import axios from 'axios';

// Set the correct base URL for API requests
const API_BASE_URL = 'http://localhost:2000';

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