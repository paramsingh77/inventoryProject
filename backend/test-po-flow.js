const axios = require('axios');
const io = require('socket.io-client');

const API_URL = 'http://localhost:2000/api';
const socket = io('http://localhost:2000');

// Test data for a new purchase order
const testPO = {
  order_number: `PO-TEST-${Date.now()}`,
  vendor_name: 'Test Vendor',
  vendor_email: 'test@vendor.com',
  contact_person: 'John Doe',
  phone_number: '123-456-7890',
  total_amount: 1500.00,
  status: 'pending',
  items: [
    {
      name: 'Test Item 1',
      quantity: 2,
      unit_price: 500,
      total_price: 1000
    },
    {
      name: 'Test Item 2',
      quantity: 1,
      unit_price: 500,
      total_price: 500
    }
  ]
};

async function login() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testPOFlow() {
  try {
    console.log('🚀 Starting PO flow test...');
    
    // Login first
    console.log('\n1. Logging in...');
    const token = await login();
    console.log('✅ Login successful');
    
    // Configure axios with auth token
    const authAxios = axios.create({
      baseURL: API_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // 2. Create a new PO
    console.log('\n2. Creating new PO...');
    const createResponse = await authAxios.post('/purchase-orders', testPO);
    const createdPO = createResponse.data.purchaseOrder;
    console.log('✅ PO created:', createdPO.order_number);
    
    // Wait for socket event
    await new Promise(resolve => {
      socket.once('po_approval_requested', (data) => {
        console.log('✅ Received po_approval_requested event:', data);
        resolve();
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        console.log('⚠️ No po_approval_requested event received after 5 seconds');
        resolve();
      }, 5000);
    });
    
    // 3. Approve the PO
    console.log('\n3. Approving PO...');
    const approveResponse = await authAxios.patch(
      `/purchase-orders/${createdPO.id}/status`,
      {
        status: 'approved',
        comments: 'Test approval',
        username: 'Test Admin'
      }
    );
    console.log('✅ PO approved:', approveResponse.data.message);
    
    // Wait for socket event
    await new Promise(resolve => {
      socket.once('po_status_update', (data) => {
        console.log('✅ Received po_status_update event:', data);
        resolve();
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        console.log('⚠️ No po_status_update event received after 5 seconds');
        resolve();
      }, 5000);
    });
    
    // 4. Create another PO for rejection
    console.log('\n4. Creating another PO for rejection...');
    const rejectPO = { ...testPO, order_number: `PO-TEST-REJECT-${Date.now()}` };
    const createResponse2 = await authAxios.post('/purchase-orders', rejectPO);
    const createdPO2 = createResponse2.data.purchaseOrder;
    console.log('✅ Second PO created:', createdPO2.order_number);
    
    // Wait for socket event
    await new Promise(resolve => {
      socket.once('po_approval_requested', (data) => {
        console.log('✅ Received po_approval_requested event:', data);
        resolve();
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        console.log('⚠️ No po_approval_requested event received after 5 seconds');
        resolve();
      }, 5000);
    });
    
    // 5. Reject the second PO
    console.log('\n5. Rejecting second PO...');
    const rejectResponse = await authAxios.patch(
      `/purchase-orders/${createdPO2.id}/status`,
      {
        status: 'rejected',
        comments: 'Test rejection',
        username: 'Test Admin'
      }
    );
    console.log('✅ PO rejected:', rejectResponse.data.message);
    
    // Wait for socket event
    await new Promise(resolve => {
      socket.once('po_status_update', (data) => {
        console.log('✅ Received po_status_update event:', data);
        resolve();
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        console.log('⚠️ No po_status_update event received after 5 seconds');
        resolve();
      }, 5000);
    });
    
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
console.log('🧪 PO Flow Test Script');
console.log('Make sure both frontend and backend are running before starting the test.');
console.log('Press Ctrl+C to cancel or wait 5 seconds to start...\n');

setTimeout(() => {
  testPOFlow().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}, 5000); 