import { io } from 'socket.io-client';

// Try to determine the backend URL/port from the current page
const getBackendUrl = () => {
  const currentUrl = window.location.origin; // e.g. http://localhost:3000
  
  // If the frontend is running on port 3000, the backend is likely on 2000
  if (currentUrl.includes(':3000')) {
    return currentUrl.replace(':3000', ':2000');
  }
  
  // Default fallback
  return 'http://localhost:2000';
};

// Create a dummy socket object that won't throw errors when methods are called
const createDummySocket = () => ({
  on: () => {},
  off: () => {},
  emit: () => {},
  connect: () => {},
  disconnect: () => {},
  io: { reconnection: () => {} },
  connected: false
});

// Initialize socket with dummy implementation
let socket = createDummySocket();

// Only try to connect if we're in a browser environment
if (typeof window !== 'undefined') {
  try {
    const backendUrl = getBackendUrl();
    console.log(`🔌 Attempting Socket.IO connection to: ${backendUrl}`);
    
    // Attempt to create a real socket connection, but with limited reconnection attempts
    const realSocket = io(backendUrl, {
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 2, // Only try to reconnect twice
      timeout: 5000
    });
    
    // Log connection status
    realSocket.on('connect', () => {
      console.log(`✅ Socket.IO connected to ${backendUrl}`);
      socket = realSocket; // Replace dummy with real socket
    });
    
    realSocket.on('disconnect', () => {
      console.log(`❌ Socket.IO disconnected from ${backendUrl}`);
    });
    
    realSocket.on('connect_error', (error) => {
      console.warn(`⚠️ Socket.IO connection error: ${error.message}`);
      
      if (realSocket.io._reconnectionAttempts >= 2) {
        console.warn('⚠️ Socket connection failed. Using offline mode.');
        realSocket.disconnect();
      }
    });
  } catch (error) {
    console.error('❌ Error initializing Socket.IO:', error);
    // We already initialized socket as a dummy socket above
  }
}

// Export the socket instance
export default socket; 