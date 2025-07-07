class RequestManager {
  constructor() {
    this.pendingRequests = new Map();
    this.lastRequestTime = 0;
    this.minRequestInterval = 10000; // Increased to 10 seconds
    this.controller = null;
    this.errorCount = 0;
    this.maxErrors = 3;
    this.backoffTime = 30000; // 30 seconds initial backoff
    this.isInErrorState = false;
    this.errorStateTimeout = null;
  }

  canMakeRequest(key) {
    const now = Date.now();
    
    // If in error state, block all requests
    if (this.isInErrorState) {
      console.log('In error state, blocking request');
      return false;
    }

    // If there's a pending request for this key, block
    if (this.pendingRequests.has(key)) {
      console.log(`Request for ${key} already pending`);
      return false;
    }

    // Enforce minimum time between requests
    if (now - this.lastRequestTime < this.minRequestInterval) {
      console.log('Too soon since last request');
      return false;
    }

    return true;
  }

  enterErrorState() {
    this.isInErrorState = true;
    this.errorCount++;
    
    // Calculate backoff time with exponential increase
    const backoff = Math.min(300000, this.backoffTime * Math.pow(2, this.errorCount - 1)); // Max 5 minutes
    
    console.log(`Entering error state for ${backoff}ms`);
    
    // Clear any existing timeout
    if (this.errorStateTimeout) {
      clearTimeout(this.errorStateTimeout);
    }
    
    // Set timeout to exit error state
    this.errorStateTimeout = setTimeout(() => {
      this.isInErrorState = false;
      console.log('Exiting error state');
    }, backoff);
  }

  resetErrorState() {
    this.errorCount = 0;
    this.isInErrorState = false;
    if (this.errorStateTimeout) {
      clearTimeout(this.errorStateTimeout);
      this.errorStateTimeout = null;
    }
  }

  cancelPendingRequests() {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
    this.pendingRequests.clear();
  }

  async makeRequest(key, requestFn) {
    // Don't make request if conditions aren't met
    if (!this.canMakeRequest(key)) {
      return null;
    }

    // Cancel any existing requests
    this.cancelPendingRequests();

    // Create new abort controller
    this.controller = new AbortController();

    try {
      // Create the promise for this request
      const promise = requestFn(this.controller.signal);
      this.pendingRequests.set(key, promise);
      this.lastRequestTime = Date.now();

      // Wait for the request to complete
      const result = await promise;

      // Success - reset error state and clean up
      this.resetErrorState();
      this.pendingRequests.delete(key);
      return result;
    } catch (error) {
      // Clean up
      this.pendingRequests.delete(key);

      // Handle error state
      if (error.name !== 'AbortError') {
        this.enterErrorState();
      }
      
      throw error;
    }
  }

  // Call this when component unmounts
  cleanup() {
    this.cancelPendingRequests();
    if (this.errorStateTimeout) {
      clearTimeout(this.errorStateTimeout);
    }
  }
}

export const requestManager = new RequestManager();

export default requestManager; 