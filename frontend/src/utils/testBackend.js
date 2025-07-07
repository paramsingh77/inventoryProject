/**
 * Backend Connection Testing Utility
 * 
 * This utility tests connectivity to the backend server by trying different ports 
 * and endpoints without relying on the email functionality that's causing issues.
 */

import axios from 'axios';
import { API_CONFIG } from './apiConfig';

// FIXED: Use the new API configuration that ensures correct production URL
const BACKEND_URLS = [
  API_CONFIG.API_BASE_URL,  // Standard backend port
  'http://localhost:3001/api',  // Socket.io port
  'http://localhost:5000/api',  // Alternative port
  '/api'                        // Same-origin (via proxy)
];

// Tests to run
const TESTS = [
  {
    name: 'Health Check',
    endpoint: '/health',
    method: 'get',
    data: null,
    successMessage: 'Backend server is running and responding to health checks',
    failureMessage: 'Backend server health check failed'
  },
  {
    name: 'Test Upload',
    endpoint: '/email/test-upload',
    method: 'post',
    data: () => {
      // Create a minimal PDF blob
      const pdfContent = '%PDF-1.5\nTest PDF';
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      const file = new File([blob], 'test.pdf', { type: 'application/pdf' });
      
      const formData = new FormData();
      formData.append('pdfFile', file);
      formData.append('testField', 'test value');
      
      return formData;
    },
    headers: { 'Content-Type': 'multipart/form-data' },
    successMessage: 'File upload functionality works',
    failureMessage: 'File upload test failed'
  }
];

/**
 * Run a single test against a specific URL
 */
const runTest = async (url, test) => {
  console.log(`🧪 Running test: ${test.name} against ${url}...`);
  
  try {
    const data = typeof test.data === 'function' ? test.data() : test.data;
    const config = {
      headers: test.headers || {},
      timeout: 5000 // 5 second timeout
    };
    
    const response = await axios[test.method](`${url}${test.endpoint}`, data, config);
    
    console.log(`✅ ${test.name}: ${test.successMessage}`);
    console.log('Response:', response.data);
    return { success: true, url, test, response: response.data };
  } catch (error) {
    console.log(`❌ ${test.name}: ${test.failureMessage}`);
    console.log('Error:', error.message);
    return { success: false, url, test, error };
  }
};

/**
 * Find a working backend URL by testing connectivity
 */
const findWorkingBackend = async () => {
  console.log('🔍 Searching for working backend...');
  
  for (const url of BACKEND_URLS) {
    console.log(`\n🌐 Testing backend URL: ${url}`);
    
    try {
      // Try simple health check
      const response = await axios.get(`${url}/health`, { timeout: 3000 });
      if (response.status === 200) {
        console.log(`✅ Found working backend at ${url}`);
        return url;
      }
    } catch (error) {
      console.log(`❌ ${url} is not responding: ${error.message}`);
    }
  }
  
  console.log('❌ No working backend found on any tested port');
  return null;
};

/**
 * Run all tests against the specified URL
 */
const runAllTests = async (url) => {
  console.log(`\n🧪 Running all tests against ${url}`);
  
  const results = {
    url,
    tests: [],
    summary: { success: 0, failure: 0 }
  };
  
  for (const test of TESTS) {
    const result = await runTest(url, test);
    results.tests.push(result);
    
    if (result.success) {
      results.summary.success++;
    } else {
      results.summary.failure++;
    }
  }
  
  return results;
};

/**
 * Display a diagnostic report
 */
const displayDiagnosticReport = (results) => {
  console.log('\n📋 BACKEND DIAGNOSTIC REPORT 📋');
  console.log('-------------------------------');
  console.log(`Backend URL: ${results.url}`);
  console.log(`Tests passed: ${results.summary.success}/${results.tests.length}`);
  console.log('-------------------------------');
  
  results.tests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.test.name}: ${test.success ? '✅ PASS' : '❌ FAIL'}`);
  });
  
  console.log('\n🔧 RECOMMENDATIONS:');
  if (results.summary.failure > 0) {
    console.log('- Check if the backend server is running');
    console.log('- Ensure the backend is running on the correct port');
    console.log('- Check if CORS is properly configured');
    console.log('- Try disabling the email checker with ENABLE_EMAIL_CHECKER=false in .env');
  } else {
    console.log('- All tests passed! The backend is functioning correctly');
    console.log('- Update your frontend to use this URL:', results.url);
  }
};

/**
 * Main function to run all diagnostics
 */
export const runBackendDiagnostics = async () => {
  console.log('🔄 Starting backend diagnostics...');
  
  // Find a working backend URL
  const workingUrl = await findWorkingBackend();
  
  if (!workingUrl) {
    console.log('\n❌ Could not connect to backend on any port');
    console.log('\n🔧 RECOMMENDATIONS:');
    console.log('- Check if the backend server is running');
    console.log('- Start the backend with: cd backend && npm run dev');
    console.log('- Check for errors in the backend console');
    console.log('- Verify that port 2000 is not blocked by firewall or other service');
    return;
  }
  
  // Run all tests
  const results = await runAllTests(workingUrl);
  
  // Display diagnostic report
  displayDiagnosticReport(results);
};

/**
 * Add a test button to the UI
 */
export const addBackendTestButton = () => {
  // Only add in development mode
  if (process.env.NODE_ENV !== 'development') return;
  
  // Create button element
  const button = document.createElement('button');
  button.textContent = '🔄 Test Backend';
  button.style.position = 'fixed';
  button.style.bottom = '20px';
  button.style.right = '20px';
  button.style.zIndex = '9999';
  button.style.padding = '10px 15px';
  button.style.backgroundColor = '#007bff';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  
  // Add click event
  button.addEventListener('click', async () => {
    console.clear();
    await runBackendDiagnostics();
  });
  
  // Add to DOM
  document.body.appendChild(button);
  
  console.log('🧪 Backend test button added to UI');
}; 