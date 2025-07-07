import socket from '../utils/socket';

class SocketEventManager {
  constructor() {
    this.eventHandlers = new Map();
    this.lastEventTimes = new Map();
    this.throttleTime = 5000; // 5 seconds between same events
  }

  canProcessEvent(eventName) {
    const now = Date.now();
    const lastTime = this.lastEventTimes.get(eventName) || 0;
    return now - lastTime >= this.throttleTime;
  }

  addHandler(eventName, handler) {
    // Create throttled version of handler
    const throttledHandler = (...args) => {
      if (!this.canProcessEvent(eventName)) {
        console.log(`Skipping ${eventName} - too soon since last event`);
        return;
      }

      this.lastEventTimes.set(eventName, Date.now());
      handler(...args);
    };

    // Store handler reference for cleanup
    this.eventHandlers.set(eventName, throttledHandler);
    
    // Add socket listener
    socket.on(eventName, throttledHandler);

    // Return cleanup function
    return () => this.removeHandler(eventName);
  }

  removeHandler(eventName) {
    const handler = this.eventHandlers.get(eventName);
    if (handler) {
      socket.off(eventName, handler);
      this.eventHandlers.delete(eventName);
    }
  }

  removeAllHandlers() {
    this.eventHandlers.forEach((handler, eventName) => {
      this.removeHandler(eventName);
    });
  }
}

export const socketEventManager = new SocketEventManager();

export default socketEventManager; 