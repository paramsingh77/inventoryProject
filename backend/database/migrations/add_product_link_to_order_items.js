const pool = require('../../config/database');

async function addProductLinkToOrderItems() {
    const client = await pool.connect();
    try {
        console.log('Starting migration: Adding product_link column to order_items table...');
        
        // Check if product_link column already exists
        const columnCheck = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'order_items' AND column_name = 'product_link'
        `);
        
        if (columnCheck.rows.length === 0) {
            // Add the product_link column
            await client.query(`
                ALTER TABLE order_items 
                ADD COLUMN product_link VARCHAR(500)
            `);
            console.log('✅ Successfully added product_link column to order_items table');
        } else {
            console.log('ℹ️  product_link column already exists in order_items table');
        }
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    addProductLinkToOrderItems()
        .then(() => {
            console.log('✅ Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { addProductLinkToOrderItems }; 