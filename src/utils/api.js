import axios from 'axios';

// Create axios instance with correct base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:2000',
  headers: {
    'Content-Type': 'application/json'
  },
  // Increase timeout to prevent premature errors
  timeout: 15000
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Ensure URL always has /api/ prefix
    if (config.url && !config.url.includes('/api/') && !config.url.startsWith('http')) {
      config.url = config.url.startsWith('/') ? `/api${config.url}` : `/api/${config.url}`;
    }
    
    // Log ALL outgoing requests in great detail
    console.log('📤 API Request:', {
      url: config.url,
      method: config.method.toUpperCase(),
      data: config.data,
      headers: config.headers,
      baseURL: config.baseURL
    });
    
    // Get token from localStorage if needed
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log('✅ API Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      url: response.config.url
    });
    return response;
  },
  (error) => {
    // Log detailed error information
    console.error('❌ API Error Response:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      requestData: error.config?.data
    });
    
    return Promise.reject(error);
  }
);

export default api; 