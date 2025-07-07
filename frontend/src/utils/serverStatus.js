// Simplified server status utility without rxjs dependency
import { API_CONFIG } from './apiConfig';

// Track server status
let isServerOnline = false;
let statusListeners = [];

// Function to check if server is available
const checkServerStatus = async () => {
  const endpoints = [
    '/api/health',
    '/api/auth/check',
    '/api/purchase-orders'
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      const url = `${API_CONFIG.BASE_URL}${endpoint}`;
      console.log(`Checking endpoint: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      // Try to parse response
      let responseData = null;
      let parseError = null;
      
      try {
        if (isJson) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }
      } catch (e) {
        parseError = e.message;
      }
      
      results[endpoint] = {
        status: response.status,
        ok: response.ok,
        contentType,
        isJson,
        parseError,
        data: responseData && (typeof responseData === 'string' && responseData.length > 100 
              ? responseData.substring(0, 100) + '...' 
              : responseData)
      };
    } catch (error) {
      results[endpoint] = {
        error: error.message,
        type: error.name
      };
    }
  }
  
  console.table(results);
  return results;
};

// Simple pub/sub for status changes
const subscribeToStatus = (callback) => {
  statusListeners.push(callback);
  return () => {
    statusListeners = statusListeners.filter(cb => cb !== callback);
  };
};

const notifyListeners = (status) => {
  statusListeners.forEach(callback => callback(status));
};

// Start periodic checking when in development
if (process.env.NODE_ENV === 'development') {
  setInterval(checkServerStatus, 10000);
  checkServerStatus(); // Initial check
}

export { 
  checkServerStatus, 
  subscribeToStatus, 
  isServerOnline 
}; 