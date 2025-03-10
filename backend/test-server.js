/**
 * Simple script to test if the backend server is running and accessible
 * Run this with: node test-server.js
 */

const http = require('http');

// Get port from command line or use default
const PORT = process.argv[2] || 5000;

console.log(`Testing backend server on port ${PORT}...`);

// Try to connect to the server
const req = http.request({
  host: 'localhost',
  port: PORT,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
}, (res) => {
  console.log(`Server responded with status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('Server response:', response);
      console.log('\x1b[32m%s\x1b[0m', '✅ Backend server is running and accessible!');
      console.log('\x1b[36m%s\x1b[0m', `📡 API available at: http://localhost:${PORT}/api`);
    } catch (error) {
      console.error('Error parsing response:', error);
      console.log('\x1b[31m%s\x1b[0m', '❌ Server responded but with invalid JSON');
    }
  });
});

req.on('error', (error) => {
  console.error('\x1b[31m%s\x1b[0m', '❌ Failed to connect to the server:');
  console.error(error.message);
  console.log('\x1b[33m%s\x1b[0m', '⚠️ Make sure your backend server is running on the correct port');
  console.log('\x1b[33m%s\x1b[0m', `⚠️ Try starting the server with: npm run dev`);
});

req.on('timeout', () => {
  console.error('\x1b[31m%s\x1b[0m', '❌ Connection timed out');
  console.log('\x1b[33m%s\x1b[0m', '⚠️ Server might be running but not responding');
  req.destroy();
});

req.end(); 