import io from 'socket.io-client';

// Try to determine the backend URL/port from the current page
const getBackendUrl = () => {
  // Always use port 2000 for backend
  return process.env.REACT_APP_API_URL || 'http://localhost:2000';
};

// Create a dummy socket object that won't throw errors when methods are called
const createDummySocket = () => ({
  on: () => {},
  off: () => {},
  emit: () => {},
  connect: () => {},
  disconnect: () => {},
  io: { reconnection: () => {} },
  connected: false,
  reconnect: () => console.warn('Socket reconnection attempted but socket is not available')
});

// Initialize socket with dummy implementation
let socket = createDummySocket();
let isConnecting = false;

// Function to get authentication token
const getAuthToken = () => {
  try {
    return localStorage.getItem('token');
  } catch (e) {
    console.warn('Failed to get auth token from localStorage:', e);
    return null;
  }
};

// Function to initialize socket connection
export const initSocket = () => {
  if (isConnecting) return;
  isConnecting = true;
  
  // Only try to connect if we're in a browser environment
  if (typeof window !== 'undefined') {
    try {
      const backendUrl = getBackendUrl();
      console.log(`🔌 Attempting Socket.IO connection to: ${backendUrl}`);
      
      // Get auth token for socket auth
      const token = getAuthToken();
      if (!token) {
        console.warn('No authentication token available for socket connection');
      }
      
      // Create socket instance with improved configuration
      const realSocket = io(backendUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        timeout: 15000, // Increased from 10000
        path: '/socket.io',
        withCredentials: true,
        autoConnect: true,
        forceNew: true,
        auth: token ? { token } : undefined,
        query: token ? { token } : undefined
      });
      
      // Log connection status
      realSocket.on('connect', () => {
        console.log(`✅ Socket.IO connected to ${backendUrl} with ID: ${realSocket.id}`);
        socket = realSocket; // Replace dummy with real socket
        isConnecting = false;
        
        // Add auth token if available
        if (token) {
          realSocket.emit('authenticate', { token });
        }
      });
      
      realSocket.on('disconnect', (reason) => {
        console.log(`❌ Socket.IO disconnected from ${backendUrl}. Reason: ${reason}`);
        isConnecting = false;
        
        // Auto reconnect for certain disconnect reasons
        if (reason === 'io server disconnect' || reason === 'transport close') {
          // Server closed the connection, so manually reconnect
          setTimeout(() => {
            console.log('Manually reconnecting socket...');
            realSocket.connect();
          }, 3000);
        }
      });
      
      realSocket.on('connect_error', (error) => {
        console.warn(`⚠️ Socket.IO connection error: ${error.message}`);
        isConnecting = false;
        
        // If we've exceeded reconnection attempts, fall back to polling
        if (realSocket.io._reconnectionAttempts >= 3) {
          console.log('⚠️ WebSocket connection failed, falling back to polling...');
          realSocket.io.opts.transports = ['polling'];
        }
        
        // If token is the issue, refresh it
        if (error.message.includes('auth') || error.message.includes('unauthorized')) {
          console.warn('Authentication error, refreshing token...');
          const freshToken = getAuthToken();
          if (freshToken) {
            realSocket.auth = { token: freshToken };
            setTimeout(() => realSocket.connect(), 1000);
          }
        }
        
        // If all attempts fail, use offline mode but keep trying occasionally
        if (realSocket.io._reconnectionAttempts >= 10) {
          console.warn('⚠️ Socket connection failed after max attempts. Will retry in 30s.');
          realSocket.disconnect();
          setTimeout(() => realSocket.connect(), 30000);
        }
      });

      // Handle reconnect attempts
      realSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 Socket.IO reconnection attempt ${attemptNumber}...`);
        
        // Refresh token on reconnect attempts
        const freshToken = getAuthToken();
        if (freshToken) {
          realSocket.auth = { token: freshToken };
        }
      });

      realSocket.on('reconnect', (attemptNumber) => {
        console.log(`✅ Socket.IO reconnected after ${attemptNumber} attempts`);
        isConnecting = false;
      });

      // Handle errors
      realSocket.on('error', (error) => {
        console.error('❌ Socket.IO error:', error);
        isConnecting = false;
      });
      
      // Handle authentication errors
      realSocket.on('unauthorized', (error) => {
        console.error('❌ Socket.IO unauthorized:', error);
        isConnecting = false;
      });

      return realSocket;
    } catch (error) {
      console.error('❌ Error initializing Socket.IO:', error);
      isConnecting = false;
      // We already initialized socket as a dummy socket above
    }
  }
  
  isConnecting = false;
  return socket;
};

// Initialize the socket connection immediately
if (typeof window !== 'undefined') {
  initSocket();
  
  // Listen for storage events to update socket auth when token changes
  window.addEventListener('storage', (event) => {
    if (event.key === 'token' && socket.connected) {
      // Token changed, update socket authentication
      const newToken = event.newValue;
      if (newToken) {
        console.log('Auth token changed, updating socket authentication');
        socket.emit('authenticate', { token: newToken });
      } else {
        // Token was removed, disconnect socket
        console.log('Auth token removed, disconnecting socket');
        socket.disconnect();
      }
    }
  });
}

// Add manual reconnect method to socket
socket.reconnect = () => {
  if (socket.connected) {
    console.log('Socket already connected, disconnecting first...');
    socket.disconnect();
  }
  
  console.log('Manually reconnecting socket...');
  return initSocket();
};

// Export the socket instance
export const getSocket = () => socket;
export default socket; 