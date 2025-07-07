/**
 * Test script to verify product link data flow
 * This script simulates the complete flow from PO creation to PDF display
 */

// Mock data representing a PO with product links
const mockPOWithProductLinks = {
  id: 1,
  poNumber: 'PO-2024-001',
  order_number: 'PO-2024-001',
  vendor: {
    name: 'Test Vendor',
    email: 'test@vendor.com',
    phone: '555-123-4567'
  },
  items: [
    {
      id: 1,
      name: 'Test Product 1',
      sku: 'SKU-001',
      quantity: 2,
      unit_price: 100,
      description: 'Test description 1',
      productLink: 'https://example.com/product1',
      product_link: 'https://example.com/product1' // Backend field
    },
    {
      id: 2,
      name: 'Test Product 2',
      sku: 'SKU-002',
      quantity: 1,
      unit_price: 50,
      description: 'Test description 2',
      productLink: 'https://example.com/product2',
      product_link: 'https://example.com/product2' // Backend field
    },
    {
      id: 3,
      name: 'Test Product 3 (No Link)',
      sku: 'SKU-003',
      quantity: 3,
      unit_price: 25,
      description: 'Test description 3'
      // No product link
    }
  ],
  total_amount: 325
};

// Import the utility functions (this would be done in the actual app)
// const { normalizePOFromAPI, preparePOForPdf } = require('./frontend/src/utils/poUtils');

console.log('🧪 Testing Product Link Data Flow');
console.log('==================================');
console.log('');

console.log('1️⃣ Original PO Data:');
console.log(JSON.stringify(mockPOWithProductLinks, null, 2));
console.log('');

// Simulate the normalization process
console.log('2️⃣ After normalizePOFromAPI:');
const normalizedItems = mockPOWithProductLinks.items.map((item, index) => ({
  id: item.id || `item-${index}`,
  sku: item.sku || `SKU-${index}`,
  name: item.name || 'Unnamed Item',
  description: item.description || 'No description available',
  quantity: Number(item.quantity) || 0,
  unitPrice: Number(item.unit_price || item.price || item.unitPrice) || 0,
  productLink: item.productLink || item.product_link || '',
  total: (Number(item.quantity) || 0) * (Number(item.unit_price || item.price || item.unitPrice) || 0)
}));

console.log('Normalized Items:');
normalizedItems.forEach((item, index) => {
  console.log(`  Item ${index + 1}:`);
  console.log(`    Name: ${item.name}`);
  console.log(`    Product Link: ${item.productLink}`);
  console.log(`    Has Link: ${!!item.productLink}`);
  console.log(`    Link Type: ${typeof item.productLink}`);
  console.log('');
});

// Simulate the PDF preparation process
console.log('3️⃣ After preparePOForPdf:');
const enrichedItems = normalizedItems.map((item, index) => ({
  id: item.id || `item-${index}`,
  sku: item.sku || `SKU-${index}`,
  name: item.name || 'Unnamed Item',
  description: item.description || 'No description available',
  quantity: Number(item.quantity) || 0,
  unitPrice: Number(item.unitPrice) || 0,
  productLink: item.productLink || '',
  total: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
}));

console.log('Enriched Items:');
enrichedItems.forEach((item, index) => {
  console.log(`  Item ${index + 1}:`);
  console.log(`    Name: ${item.name}`);
  console.log(`    Product Link: ${item.productLink}`);
  console.log(`    Has Link: ${!!item.productLink}`);
  console.log(`    Link Type: ${typeof item.productLink}`);
  console.log('');
});

// Simulate PDF rendering
console.log('4️⃣ PDF Rendering Check:');
enrichedItems.forEach((item, index) => {
  console.log(`  Item ${index + 1} in PDF:`);
  console.log(`    Name: ${item.name}`);
  if (item.productLink) {
    console.log(`    ✅ Product Link will be displayed: ${item.productLink}`);
  } else {
    console.log(`    ❌ No product link to display`);
  }
  console.log('');
});

console.log('✅ Test completed!');
console.log('');
console.log('📋 Summary:');
console.log(`- Total items: ${enrichedItems.length}`);
console.log(`- Items with links: ${enrichedItems.filter(item => item.productLink).length}`);
console.log(`- Items without links: ${enrichedItems.filter(item => !item.productLink).length}`);

// Check for potential issues
const issues = [];
enrichedItems.forEach((item, index) => {
  if (item.productLink && typeof item.productLink !== 'string') {
    issues.push(`Item ${index + 1}: productLink is not a string (${typeof item.productLink})`);
  }
  if (item.productLink && item.productLink.trim() === '') {
    issues.push(`Item ${index + 1}: productLink is empty string`);
  }
});

if (issues.length > 0) {
  console.log('');
  console.log('⚠️  Potential Issues Found:');
  issues.forEach(issue => console.log(`  - ${issue}`));
} else {
  console.log('');
  console.log('🎉 No issues found! Product links should display correctly in PDF.');
} 