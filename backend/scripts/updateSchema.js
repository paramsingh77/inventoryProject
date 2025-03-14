require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function updateSchema() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Adding missing columns to PURCHASE_ORDERS table...');
        
        // Check if the table exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'PURCHASE_ORDERS'
            );
        `);
        
        if (tableCheck.rows[0].exists) {
            console.log('PURCHASE_ORDERS table exists, adding columns...');
            
            // Add missing columns if they don't exist
            await client.query(`
                ALTER TABLE "PURCHASE_ORDERS" 
                ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255),
                ADD COLUMN IF NOT EXISTS vendor_email VARCHAR(255),
                ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
                ADD COLUMN IF NOT EXISTS phone_number VARCHAR(255);
            `);
            
            console.log('Columns added successfully!');
        } else {
            console.log('PURCHASE_ORDERS table does not exist, checking for lowercase version...');
            
            // Check if lowercase version exists
            const lowercaseCheck = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'purchase_orders'
                );
            `);
            
            if (lowercaseCheck.rows[0].exists) {
                console.log('purchase_orders table exists, adding columns...');
                
                // Add missing columns if they don't exist
                await client.query(`
                    ALTER TABLE purchase_orders 
                    ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255),
                    ADD COLUMN IF NOT EXISTS vendor_email VARCHAR(255),
                    ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
                    ADD COLUMN IF NOT EXISTS phone_number VARCHAR(255);
                `);
                
                console.log('Columns added successfully!');
            } else {
                console.log('No purchase orders table found. Please run initDb.js first.');
            }
        }

        await client.query('COMMIT');
        console.log('Schema update completed successfully!');
        process.exit(0);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating schema:', error);
        process.exit(1);
    } finally {
        client.release();
    }
}

updateSchema(); 