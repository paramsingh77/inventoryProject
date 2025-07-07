// This file helps to ensure Node.js environment variables are available in the browser
window.process = window.process || {};
window.process.env = window.process.env || {};

// Ensure process.browser is true
window.process.browser = true;

// Log initialization
console.log('Environment variables initialized in browser'); 