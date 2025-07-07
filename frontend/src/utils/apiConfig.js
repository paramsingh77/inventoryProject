/**
 * API Configuration Utility
 * This utility ensures the correct API URL is used in all environments
 */

// FIXED: Ensure production uses the correct backend URL regardless of .env file conflicts
const getApiUrl = () => {
  // In production, always use the production backend URL
  if (process.env.NODE_ENV === 'production') {
    return 'https://backendinventory-production.up.railway.app';
  }
  
  // In development, use the environment variable or fallback to localhost
  return process.env.REACT_APP_API_URL || 'http://localhost:2000';
};

// FIXED: Ensure API base URL includes /api path
const getApiBaseUrl = () => {
  const baseUrl = getApiUrl();
  return `${baseUrl}/api`;
};

// FIXED: Get WebSocket URL for Socket.IO connections
const getWebSocketUrl = () => {
  // In production, use the production backend URL
  if (process.env.NODE_ENV === 'production') {
    return 'https://backendinventory-production.up.railway.app';
  }
  
  // In development, use the environment variable or fallback to localhost
  return process.env.REACT_APP_WEBSOCKET_URL || process.env.REACT_APP_API_URL || 'http://localhost:2000';
};

// Export the configuration
export const API_CONFIG = {
  BASE_URL: getApiUrl(),
  API_BASE_URL: getApiBaseUrl(),
  WEBSOCKET_URL: getWebSocketUrl(),
  IS_PRODUCTION: process.env.NODE_ENV === 'production'
};

// Log the configuration for debugging
console.log('API Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  REACT_APP_WEBSOCKET_URL: process.env.REACT_APP_WEBSOCKET_URL,
  RESOLVED_BASE_URL: API_CONFIG.BASE_URL,
  RESOLVED_API_BASE_URL: API_CONFIG.API_BASE_URL,
  RESOLVED_WEBSOCKET_URL: API_CONFIG.WEBSOCKET_URL
});

export default API_CONFIG; 