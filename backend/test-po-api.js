/**
 * Test script for purchase order API
 * Run with: node test-po-api.js
 */

const axios = require('axios');
const io = require('socket.io-client');

const API_URL = 'http://localhost:2000/api';
const socket = io('http://localhost:2000');

// Test data for a new purchase order
const newPO = {
  poNumber: 'PO-2024-TEST-001',
  vendorName: 'Dell',
  vendorEmail: 'orders@dell.com',
  contactPerson: 'Jane Doe',
  phoneNumber: '555-123-4567',
  department: 'IT',
  requestDate: new Date().toISOString().split('T')[0],
  priority: 'high',
  status: 'pending',
  items: [
    {
      id: 101,
      name: 'Dell XPS 15',
      model: 'XPS 15 9510',
      sku: 'DL-LT-101',
      category: 'Laptops',
      price: 1799.99,
      quantity: 2,
      description: 'Dell XPS 15 with 11th Gen Intel Core i7'
    },
    {
      id: 102,
      name: 'Dell UltraSharp 27 Monitor',
      model: 'U2722D',
      sku: 'DL-MN-102',
      category: 'Monitors',
      price: 499.99,
      quantity: 3,
      description: 'Dell 27-inch QHD Monitor'
    }
  ],
  customItems: [
    {
      description: 'Dell ProSupport Plus 3-Year Warranty',
      quantity: 2,
      price: 299.99
    }
  ],
  notes: 'Rush order for executive team'
};

// Function to create a purchase order
async function createPurchaseOrder() {
  try {
    console.log('Creating purchase order...');
    const response = await axios.post(`${API_URL}/purchase-orders`, newPO);
    console.log('Purchase order created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating purchase order:', error.response?.data || error.message);
    throw error;
  }
}

// Function to emit a socket event directly
function emitApprovalRequest(purchaseOrder) {
  console.log('Emitting socket event for PO approval...');
  socket.emit('po_approval_requested', {
    poId: purchaseOrder.id || 999,
    poNumber: purchaseOrder.poNumber,
    vendorName: purchaseOrder.vendorName,
    requestedBy: 'Test Script User',
    department: purchaseOrder.department,
    requestDate: purchaseOrder.date || new Date().toISOString(),
    total: purchaseOrder.total || 5000
  });
  console.log('Socket event emitted!');
}

// Main function
async function main() {
  console.log('Test script for purchase order API started');
  
  // Set up socket connection
  socket.on('connect', () => {
    console.log('Socket connected');
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
  
  try {
    // Create a purchase order via API
    const po = await createPurchaseOrder();
    
    // Wait a moment for the server to process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Manually emit an event (as a backup in case the API doesn't)
    emitApprovalRequest(po);
    
    console.log('\nTest complete! Check your admin interface for the new approval request.');
    console.log('Remember that you will need to have the frontend running to see the notifications.');
    
    // Keep the script running for a moment to ensure socket events are sent
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Exiting...');
    socket.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    socket.disconnect();
    process.exit(1);
  }
}

// Run the test
main(); 