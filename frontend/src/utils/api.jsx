import axios from 'axios';
import { API_CONFIG } from './apiConfig';

// FIXED: Use the new API configuration that ensures correct production URL
const baseURL = API_CONFIG.API_BASE_URL;

const api = axios.create({
    baseURL,
    timeout: 15000, // Increase timeout for slower connections
    headers: {
        'Content-Type': 'application/json'
    },
    // Add withCredentials for cookie-based auth if needed
    withCredentials: true
});

// Add an interceptor to include the authentication token with every request
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Improved error handling for network issues
api.interceptors.response.use(
    response => response,
    error => {
        // Network error (server down/not reachable)
        if (!error.response) {
            console.error('Network error - server may be down:', error.message);
            // Check if server is actually running
            fetch(`${baseURL.split('/api')[0]}/api/health`, { method: 'HEAD' })
                .then(response => {
                    if (response.ok) {
                        console.log('Server is running, but connection to specific endpoint failed');
                    }
                })
                .catch(() => {
                    console.log('Server appears to be down completely');
                });
            return Promise.reject({
                message: 'Unable to reach server. Please check your connection or try again later.'
            });
        }
        return Promise.reject(error);
    }
);

export default api; 