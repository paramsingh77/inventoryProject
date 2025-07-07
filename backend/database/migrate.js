const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrateOrderItems() {
    const client = await pool.connect();
    try {
        console.log('Starting migration: Adding name column to order_items table...');
        
        // Check if name column already exists
        const columnCheck = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'order_items' AND column_name = 'name'
        `);
        
        if (columnCheck.rows.length === 0) {
            // Add the name column
            await client.query(`
                ALTER TABLE order_items 
                ADD COLUMN name VARCHAR(255)
            `);
            console.log('✅ Successfully added name column to order_items table');
            
            // Update existing records to extract name from notes
            const updateResult = await client.query(`
                UPDATE order_items 
                SET name = CASE 
                    WHEN notes LIKE '%:%' THEN 
                        SPLIT_PART(notes, ':', 1)
                    ELSE 
                        COALESCE(notes, 'Unnamed Item')
                END
                WHERE name IS NULL
            `);
            console.log(`✅ Updated ${updateResult.rowCount} existing records`);
            
        } else {
            console.log('ℹ️  name column already exists in order_items table');
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
    migrateOrderItems()
        .then(() => {
            console.log('✅ Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateOrderItems }; 