/**
 * Simple test file for PO utility functions
 * Run with: node poUtils.test.js
 */

// Mock the utility functions for testing
const { normalizePOFromAPI, preparePOForPdf, processPOForPdf } = require('./poUtils');

// Test data - PO with missing vendor details
const testPOWithMissingVendor = {
  id: 1,
  poNumber: 'PO-2024-001',
  vendor_name: 'Test Vendor',
  vendor_email: 'test@vendor.com',
  supplier_id: 123,
  items: [
    {
      id: 1,
      name: 'Test Item 1',
      quantity: 2,
      unit_price: 100,
      description: 'Test description'
    }
  ],
  total_amount: 200
};

// Test data - PO with complete vendor details
const testPOWithCompleteVendor = {
  id: 2,
  poNumber: 'PO-2024-002',
  vendor: {
    name: 'Complete Vendor',
    email: 'complete@vendor.com',
    phone: '555-123-4567',
    address: {
      street: '123 Complete Street',
      city: 'Complete City',
      state: 'CA',
      zip: '90210',
      country: 'USA',
      full: '123 Complete Street, Complete City, CA 90210'
    }
  },
  items: [
    {
      id: 2,
      name: 'Complete Item',
      quantity: 1,
      unit_price: 150,
      description: 'Complete item description'
    }
  ],
  total_amount: 150
};

// Test data - PO with string address
const testPOWithStringAddress = {
  id: 3,
  poNumber: 'PO-2024-003',
  vendor_name: 'String Address Vendor',
  vendor_address: '456 String Street, String City, NY 10001, USA',
  vendor_email: 'string@vendor.com',
  vendor_phone: '555-987-6543',
  items: [
    {
      id: 3,
      name: 'String Address Item',
      quantity: 3,
      unit_price: 75,
      description: 'String address item'
    }
  ],
  total_amount: 225
};

function runTests() {
  console.log('🧪 Running PO Utility Tests...\n');

  // Test 1: Normalize PO with missing vendor details
  console.log('Test 1: Normalize PO with missing vendor details');
  const normalized1 = normalizePOFromAPI(testPOWithMissingVendor);
  console.log('✅ Normalized vendor name:', normalized1.vendor.name);
  console.log('✅ Normalized vendor email:', normalized1.vendor.email);
  console.log('✅ Normalized vendor phone:', normalized1.vendor.phone);
  console.log('✅ Normalized vendor address:', normalized1.vendor.address.full);
  console.log('✅ Items count:', normalized1.items.length);
  console.log('');

  // Test 2: Normalize PO with complete vendor details
  console.log('Test 2: Normalize PO with complete vendor details');
  const normalized2 = normalizePOFromAPI(testPOWithCompleteVendor);
  console.log('✅ Normalized vendor name:', normalized2.vendor.name);
  console.log('✅ Normalized vendor email:', normalized2.vendor.email);
  console.log('✅ Normalized vendor phone:', normalized2.vendor.phone);
  console.log('✅ Normalized vendor address:', normalized2.vendor.address.full);
  console.log('');

  // Test 3: Normalize PO with string address
  console.log('Test 3: Normalize PO with string address');
  const normalized3 = normalizePOFromAPI(testPOWithStringAddress);
  console.log('✅ Normalized vendor name:', normalized3.vendor.name);
  console.log('✅ Normalized vendor email:', normalized3.vendor.email);
  console.log('✅ Normalized vendor phone:', normalized3.vendor.phone);
  console.log('✅ Normalized vendor address:', normalized3.vendor.address.full);
  console.log('✅ Parsed address street:', normalized3.vendor.address.street);
  console.log('✅ Parsed address city:', normalized3.vendor.address.city);
  console.log('✅ Parsed address state:', normalized3.vendor.address.state);
  console.log('✅ Parsed address zip:', normalized3.vendor.address.zip);
  console.log('');

  // Test 4: Prepare PO for PDF
  console.log('Test 4: Prepare PO for PDF');
  const prepared1 = preparePOForPdf(normalized1);
  console.log('✅ Calculated subtotal:', prepared1.subtotal);
  console.log('✅ Calculated tax:', prepared1.tax);
  console.log('✅ Calculated shipping fees:', prepared1.shippingFees);
  console.log('✅ Calculated total amount:', prepared1.totalAmount);
  console.log('✅ Vendor name for PDF:', prepared1.vendor.name);
  console.log('✅ Vendor address for PDF:', prepared1.vendor.address.full);
  console.log('');

  // Test 5: Complete pipeline
  console.log('Test 5: Complete pipeline (normalize + prepare)');
  const processed = processPOForPdf(testPOWithMissingVendor);
  console.log('✅ Final PO number:', processed.poNumber);
  console.log('✅ Final vendor name:', processed.vendor.name);
  console.log('✅ Final vendor address:', processed.vendor.address.full);
  console.log('✅ Final total amount:', processed.totalAmount);
  console.log('✅ Items count:', processed.items.length);
  console.log('');

  console.log('🎉 All tests completed successfully!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests }; 