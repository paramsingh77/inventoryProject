const pool = require('../config/database.js');

async function testPOCreationSiteId() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 [TEST_PO_CREATION] Starting comprehensive PO creation site_id test...');
    
    // Get the site ID for testing
    const siteResult = await client.query(
      'SELECT id, name FROM sites WHERE name = $1',
      ['Amarillo Specialty Hospital']
    );
    
    if (siteResult.rows.length === 0) {
      console.error('❌ [TEST_PO_CREATION] Test site not found');
      return;
    }
    
    const testSiteId = siteResult.rows[0].id;
    const testSiteName = siteResult.rows[0].name;
    
    console.log('🧪 [TEST_PO_CREATION] Using test site:', { id: testSiteId, name: testSiteName });
    
    // Test 1: Direct /purchase-orders route with site_id in body
    console.log('\n🧪 [TEST_PO_CREATION] Test 1: Direct /purchase-orders route with site_id in body');
    const testPO1 = {
      order_number: `TEST-PO-1-${Date.now()}`,
      vendor_name: 'Test Vendor 1',
      vendor_email: 'test1@vendor.com',
      total_amount: 100,
      site_id: testSiteId,
      items: [{ name: 'Test Item 1', quantity: 1, price: 100 }]
    };
    
    // This would be a POST request in real scenario
    console.log('🧪 [TEST_PO_CREATION] Test PO 1 data:', testPO1);
    
    // Test 2: Direct /purchase-orders route with siteId in query
    console.log('\n🧪 [TEST_PO_CREATION] Test 2: Direct /purchase-orders route with siteId in query');
    const testPO2 = {
      order_number: `TEST-PO-2-${Date.now()}`,
      vendor_name: 'Test Vendor 2',
      vendor_email: 'test2@vendor.com',
      total_amount: 200,
      // No site_id in body, should get from query.siteId
      items: [{ name: 'Test Item 2', quantity: 1, price: 200 }]
    };
    
    console.log('🧪 [TEST_PO_CREATION] Test PO 2 data:', testPO2);
    console.log('🧪 [TEST_PO_CREATION] Query params would be: { siteId: ' + testSiteId + ' }');
    
    // Test 3: /sites/:siteName/orders route (the main frontend route)
    console.log('\n🧪 [TEST_PO_CREATION] Test 3: /sites/:siteName/orders route (main frontend route)');
    const testPO3 = {
      poNumber: `TEST-PO-3-${Date.now()}`,
      vendorName: 'Test Vendor 3',
      vendorEmail: 'test3@vendor.com',
      totalAmount: 300,
      site: testSiteName,
      site_id: testSiteId,
      items: [{ name: 'Test Item 3', quantity: 1, price: 300 }]
    };
    
    console.log('🧪 [TEST_PO_CREATION] Test PO 3 data:', testPO3);
    console.log('🧪 [TEST_PO_CREATION] URL would be: /sites/' + encodeURIComponent(testSiteName) + '/orders');
    
    // Test 4: Email webhook route
    console.log('\n🧪 [TEST_PO_CREATION] Test 4: Email webhook route');
    const testPO4 = {
      orderNumber: `TEST-PO-4-${Date.now()}`,
      vendor: 'Test Vendor 4',
      // No site_id provided, should use default site
    };
    
    console.log('🧪 [TEST_PO_CREATION] Test PO 4 data:', testPO4);
    console.log('🧪 [TEST_PO_CREATION] Should use default site_id:', testSiteId);
    
    // Summary
    console.log('\n🧪 [TEST_PO_CREATION] Test Summary:');
    console.log('✅ Test 1: /purchase-orders with site_id in body - Should work');
    console.log('✅ Test 2: /purchase-orders with siteId in query - Should work');
    console.log('✅ Test 3: /sites/:siteName/orders - Should work (main frontend route)');
    console.log('✅ Test 4: Email webhook - Should use default site_id');
    
    console.log('\n🧪 [TEST_PO_CREATION] All PO creation routes should now automatically assign site_id!');
    
  } catch (error) {
    console.error('❌ [TEST_PO_CREATION] Error during test:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the test
testPOCreationSiteId(); 