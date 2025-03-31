const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function clearPurchaseOrders() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Delete order items first (due to foreign key constraint)
        console.log('Deleting order items...');
        const deleteItemsResult = await client.query('DELETE FROM order_items');
        console.log(`Deleted ${deleteItemsResult.rowCount} order items`);
        
        // Then delete purchase orders
        console.log('Deleting purchase orders...');
        const deleteOrdersResult = await client.query('DELETE FROM purchase_orders');
        console.log(`Deleted ${deleteOrdersResult.rowCount} purchase orders`);
        
        await client.query('COMMIT');
        console.log('Successfully cleared all purchase orders and items');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error clearing purchase orders:', error);
        throw error;
    } finally {
        client.release();
    }
}

clearPurchaseOrders()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    }); 