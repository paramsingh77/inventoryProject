const axios = require('axios');

async function testPurchaseOrderAPI() {
    try {
        console.log('Testing Purchase Order API...');
        
        // Test getting a specific PO
        const response = await axios.get('http://localhost:5000/api/purchase-orders/136');
        
        console.log('✅ API Response received');
        console.log('PO Details:', {
            id: response.data.id,
            order_number: response.data.order_number,
            vendor_name: response.data.vendor_name,
            total_amount: response.data.total_amount
        });
        
        console.log('\n📦 Items:');
        if (response.data.items && response.data.items.length > 0) {
            response.data.items.forEach((item, index) => {
                console.log(`Item ${index + 1}:`);
                console.log(`  - ID: ${item.id}`);
                console.log(`  - Name: ${item.name || 'MISSING'}`);
                console.log(`  - Description: ${item.description || 'MISSING'}`);
                console.log(`  - Notes: ${item.notes || 'MISSING'}`);
                console.log(`  - Quantity: ${item.quantity}`);
                console.log(`  - Unit Price: ${item.unit_price}`);
                console.log('');
            });
        } else {
            console.log('❌ No items found');
        }
        
    } catch (error) {
        console.error('❌ API Test failed:', error.response?.data || error.message);
    }
}

testPurchaseOrderAPI(); 