const addTestVendors = async (pool) => {
    try {
        // Check if vendors exist
        const existingVendors = await pool.query('SELECT COUNT(*) FROM vendors');
        if (existingVendors.rows[0].count === '0') {
            // Add test vendors
            await pool.query(`
                INSERT INTO vendors (name, email, phone, status) VALUES
                ('Test Vendor 1', 'vendor1@test.com', '123-456-7890', 'active'),
                ('Test Vendor 2', 'vendor2@test.com', '123-456-7891', 'active'),
                ('Test Vendor 3', 'vendor3@test.com', '123-456-7892', 'active')
            `);
            console.log('Test vendors added successfully');
        }
    } catch (error) {
        console.error('Error adding test vendors:', error);
        throw error;
    }
};

const addTestProducts = async (pool) => {
    try {
        // First get vendor IDs
        const vendors = await pool.query('SELECT id FROM vendors');
        
        for (const vendor of vendors.rows) {
            // Add test products for each vendor
            await pool.query(`
                INSERT INTO products (vendor_id, sku, name, description, price, status)
                VALUES 
                ($1, $2, $3, $4, $5, $6),
                ($1, $7, $8, $9, $10, $6)
            `, [
                vendor.id,
                `SKU-${vendor.id}-001`,
                'Test Product 1',
                'Description for test product 1',
                99.99,
                'active',
                `SKU-${vendor.id}-002`,
                'Test Product 2',
                'Description for test product 2',
                149.99
            ]);
        }
        console.log('Test products added successfully');
    } catch (error) {
        console.error('Error adding test products:', error);
    }
}; 