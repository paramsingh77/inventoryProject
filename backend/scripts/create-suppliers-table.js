/**
 * Database migration script for suppliers
 * Creates or updates the suppliers table
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createSupplierTable() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if suppliers table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'suppliers'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      console.log('Creating suppliers table...');
      
      // Create suppliers table
      await client.query(`
        CREATE TABLE suppliers (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          contact_person VARCHAR(255),
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          address TEXT,
          website VARCHAR(255),
          tax_id VARCHAR(100),
          payment_terms VARCHAR(100),
          category VARCHAR(100) DEFAULT 'general',
          status VARCHAR(50) DEFAULT 'active',
          notes TEXT,
          rating DECIMAL(3,2),
          last_order_date DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Suppliers table created successfully');
    } else {
      console.log('Suppliers table already exists, checking for needed column updates...');
      
      // Check if category column exists and add if it doesn't
      const categoryCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND table_name = 'suppliers'
          AND column_name = 'category'
        );
      `);
      
      if (!categoryCheck.rows[0].exists) {
        console.log('Adding category column...');
        await client.query(`
          ALTER TABLE suppliers
          ADD COLUMN category VARCHAR(100) DEFAULT 'general';
        `);
        console.log('Category column added successfully');
      }
      
      // Check if rating column exists and add if it doesn't
      const ratingCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND table_name = 'suppliers'
          AND column_name = 'rating'
        );
      `);
      
      if (!ratingCheck.rows[0].exists) {
        console.log('Adding rating column...');
        await client.query(`
          ALTER TABLE suppliers
          ADD COLUMN rating DECIMAL(3,2);
        `);
        console.log('Rating column added successfully');
      }
      
      // Check if last_order_date column exists and add if it doesn't
      const lastOrderCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND table_name = 'suppliers'
          AND column_name = 'last_order_date'
        );
      `);
      
      if (!lastOrderCheck.rows[0].exists) {
        console.log('Adding last_order_date column...');
        await client.query(`
          ALTER TABLE suppliers
          ADD COLUMN last_order_date DATE;
        `);
        console.log('Last order date column added successfully');
      }
    }
    
    // Add some sample suppliers if in development mode and table is empty
    if (process.env.NODE_ENV === 'development') {
      const supplierCount = await client.query('SELECT COUNT(*) FROM suppliers');
      
      if (parseInt(supplierCount.rows[0].count) === 0) {
        console.log('Adding sample suppliers for development...');
        
        const sampleSuppliers = [
          {
            name: 'Acme Supplies',
            contact_person: 'John Doe',
            email: 'john@acmesupplies.com',
            phone: '555-123-4567',
            address: '123 Main St, San Francisco, CA 94105',
            website: 'www.acmesupplies.com',
            tax_id: 'TAX123456',
            payment_terms: 'Net 30',
            category: 'hardware',
            status: 'active'
          },
          {
            name: 'Tech Solutions Inc',
            contact_person: 'Jane Smith',
            email: 'jane@techsolutions.com',
            phone: '555-987-6543',
            address: '456 Market St, San Francisco, CA 94105',
            website: 'www.techsolutions.com',
            tax_id: 'TAX987654',
            payment_terms: 'Net 15',
            category: 'software',
            status: 'active'
          },
          {
            name: 'Global Distributors',
            contact_person: 'Mike Johnson',
            email: 'mike@globaldist.com',
            phone: '555-456-7890',
            address: '789 Howard St, San Francisco, CA 94105',
            website: 'www.globaldistributors.com',
            tax_id: 'TAX456789',
            payment_terms: 'Net 45',
            category: 'hardware',
            status: 'active'
          },
          {
            name: 'Digital Networks',
            contact_person: 'Sarah Williams',
            email: 'sarah@digitalnetworks.com',
            phone: '555-222-3333',
            address: '101 Van Ness Ave, San Francisco, CA 94102',
            website: 'www.digitalnetworks.com',
            tax_id: 'TAX222333',
            payment_terms: 'Net 60',
            category: 'networking',
            status: 'active'
          },
          {
            name: 'Office Solutions',
            contact_person: 'Robert Brown',
            email: 'robert@officesol.com',
            phone: '555-444-5555',
            address: '200 California St, San Francisco, CA 94111',
            website: 'www.officesolutions.com',
            tax_id: 'TAX444555',
            payment_terms: 'Net 30',
            category: 'office',
            status: 'inactive'
          }
        ];
        
        for (const supplier of sampleSuppliers) {
          await client.query(`
            INSERT INTO suppliers (
              name, 
              contact_person, 
              email, 
              phone, 
              address, 
              website, 
              tax_id, 
              payment_terms, 
              category,
              status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            supplier.name,
            supplier.contact_person,
            supplier.email,
            supplier.phone,
            supplier.address,
            supplier.website,
            supplier.tax_id,
            supplier.payment_terms,
            supplier.category,
            supplier.status
          ]);
        }
        
        console.log('Sample suppliers added successfully');
      }
    }
    
    await client.query('COMMIT');
    console.log('Supplier setup completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting up suppliers table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
console.log('Starting supplier table setup...');
createSupplierTable()
  .then(() => console.log('Finished supplier table setup'))
  .catch(err => {
    console.error('Failed to set up supplier table:', err);
    process.exit(1);
  }); 