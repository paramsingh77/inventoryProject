const { pool } = require('../database/schema');
const format = require('pg-format');

async function migrateSiteData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. First create the site_tables function if it doesn't exist
    await client.query(`
      CREATE OR REPLACE FUNCTION create_site_tables(site_name text) RETURNS void AS $$
      BEGIN
          -- Create inventory table for the site
          EXECUTE format('
              CREATE TABLE IF NOT EXISTS %I_inventory (
                  id SERIAL PRIMARY KEY,
                  item_name VARCHAR(255) NOT NULL,
                  quantity INTEGER DEFAULT 0,
                  category VARCHAR(100),
                  description TEXT,
                  unit_price DECIMAL(10,2),
                  reorder_level INTEGER DEFAULT 0,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )', site_name);

          -- Create suppliers table for the site
          EXECUTE format('
              CREATE TABLE IF NOT EXISTS %I_suppliers (
                  id SERIAL PRIMARY KEY,
                  name VARCHAR(255) NOT NULL,
                  contact_name VARCHAR(255),
                  email VARCHAR(255),
                  phone VARCHAR(50),
                  address TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )', site_name);

          -- Create purchase orders table for the site
          EXECUTE format('
              CREATE TABLE IF NOT EXISTS %I_purchase_orders (
                  id SERIAL PRIMARY KEY,
                  order_number VARCHAR(50) UNIQUE NOT NULL,
                  supplier_id INTEGER REFERENCES %I_suppliers(id),
                  ordered_by INTEGER REFERENCES users(id),
                  status VARCHAR(50) DEFAULT ''pending'',
                  total_amount DECIMAL(10,2) DEFAULT 0,
                  notes TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )', site_name, site_name);

          -- Create order items table for the site
          EXECUTE format('
              CREATE TABLE IF NOT EXISTS %I_order_items (
                  id SERIAL PRIMARY KEY,
                  order_id INTEGER REFERENCES %I_purchase_orders(id),
                  item_name VARCHAR(255) NOT NULL,
                  quantity INTEGER NOT NULL,
                  unit_price DECIMAL(10,2) NOT NULL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )', site_name, site_name);
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 2. Get all active sites
    const sites = await client.query('SELECT id, name FROM sites WHERE is_active = true');

    // 3. For each site, create tables and migrate data
    for (const site of sites.rows) {
      console.log(`Migrating data for site: ${site.name}`);
      
      const siteName = site.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      // Create tables for this site
      await client.query('SELECT create_site_tables($1)', [siteName]);

      // Migrate inventory data
      await client.query(format(`
        INSERT INTO %I_inventory 
        (item_name, quantity, category, description, unit_price, reorder_level)
        SELECT item_name, quantity, category, description, unit_price, reorder_level
        FROM inventory
        WHERE site_id = $1
      `, siteName), [site.id]);

      // Migrate suppliers data
      await client.query(format(`
        INSERT INTO %I_suppliers 
        (name, contact_name, email, phone, address)
        SELECT name, contact_name, email, phone, address
        FROM suppliers
        WHERE site_id = $1
      `, siteName), [site.id]);

      // Migrate purchase orders and their items
      await client.query(format(`
        WITH inserted_po AS (
          INSERT INTO %I_purchase_orders 
          (order_number, supplier_id, ordered_by, status, total_amount, notes)
          SELECT 
            order_number,
            s2.id, -- Map to new supplier id
            ordered_by,
            status,
            total_amount,
            notes
          FROM purchase_orders po
          LEFT JOIN suppliers s1 ON po.supplier_id = s1.id
          LEFT JOIN %I_suppliers s2 ON s1.name = s2.name
          WHERE po.site_id = $1
          RETURNING id, order_number
        )
        INSERT INTO %I_order_items (order_id, item_name, quantity, unit_price)
        SELECT 
          inserted_po.id,
          oi.item_name,
          oi.quantity,
          oi.unit_price
        FROM order_items oi
        JOIN purchase_orders po ON oi.order_id = po.id
        JOIN inserted_po ON po.order_number = inserted_po.order_number
        WHERE po.site_id = $1
      `, siteName, siteName, siteName), [site.id]);

      console.log(`Completed migration for site: ${site.name}`);
    }

    await client.query('COMMIT');
    console.log('Migration completed successfully');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
migrateSiteData().then(() => {
  console.log('Migration completed');
  process.exit(0);
}).catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
}); 