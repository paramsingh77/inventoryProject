import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.subscribers = new Map();
    this.isConnecting = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
  }

  connect() {
    // If already connecting or connected, don't try again
    if (this.isConnecting || this.socket) {
      return;
    }
    
    this.isConnecting = true;
    
    if (!this.socket) {
      this.socket = io(process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3001', {
        reconnectionAttempts: this.maxConnectionAttempts,
        reconnectionDelay: 2000,
        timeout: 5000,
        transports: ['websocket'], // Only use websocket for better performance
        forceNew: false,
        autoConnect: true
      });

      this.socket.on('connect', () => {
        this.isConnecting = false;
        this.connectionAttempts = 0;
      });

      this.socket.on('disconnect', () => {
        // Don't log - this can flood the console
      });

      this.socket.on('connect_error', () => {
        this.connectionAttempts++;
        if (this.connectionAttempts >= this.maxConnectionAttempts) {
          this.isConnecting = false;
          // Don't keep trying forever
          this.socket.disconnect();
        }
      });

      // Handle incoming messages
      this.socket.on('notification', (data) => {
        const { type, ...payload } = data;
        const handlers = this.subscribers.get(type) || [];
        handlers.forEach(handler => handler(payload));
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
      this.connectionAttempts = 0;
    }
  }

  subscribe(type, handler) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, []);
    }
    // Check if handler is already subscribed to avoid duplicates
    if (!this.subscribers.get(type).includes(handler)) {
      this.subscribers.get(type).push(handler);
    }
  }

  unsubscribe(type, handler) {
    if (this.subscribers.has(type)) {
      const handlers = this.subscribers.get(type);
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }
}

// Export a singleton instance
export default new WebSocketService(); 