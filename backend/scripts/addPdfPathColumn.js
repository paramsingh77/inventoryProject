const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function addPdfPathColumn() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Add pdf_path column if it doesn't exist
        console.log('Adding pdf_path column to purchase_orders table...');
        await client.query(`
            ALTER TABLE purchase_orders 
            ADD COLUMN IF NOT EXISTS pdf_path VARCHAR(500);
        `);
        
        await client.query('COMMIT');
        console.log('Successfully added pdf_path column');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding pdf_path column:', error);
        throw error;
    } finally {
        client.release();
    }
}

addPdfPathColumn()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    }); 