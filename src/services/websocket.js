import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.subscribers = new Map();
  }

  connect() {
    if (!this.socket) {
      this.socket = io(process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3001');

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
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
    }
  }

  subscribe(type, handler) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, []);
    }
    this.subscribers.get(type).push(handler);
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

export default new WebSocketService(); 