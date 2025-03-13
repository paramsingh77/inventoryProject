const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Database configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false // Disable SSL since we're using Railway's proxy
});

// Test the connection
pool.on('connect', () => {
    console.log('Connected to the database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Function to initialize database schema
async function initializeSchema() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Drop existing tables if they exist
        await client.query(`
            DROP TABLE IF EXISTS device_inventory CASCADE;
            DROP TABLE IF EXISTS software_licenses CASCADE;
            DROP TABLE IF EXISTS peripherals CASCADE;
            DROP TABLE IF EXISTS spare_parts CASCADE;
            DROP TABLE IF EXISTS device_assignments CASCADE;
            DROP TABLE IF EXISTS maintenance_logs CASCADE;
            DROP TABLE IF EXISTS purchase_orders CASCADE;
            DROP TABLE IF EXISTS order_items CASCADE;
            DROP TABLE IF EXISTS suppliers CASCADE;
            DROP TABLE IF EXISTS supplier_contracts CASCADE;
            DROP TABLE IF EXISTS warranties CASCADE;
            DROP TABLE IF EXISTS activity_logs CASCADE;
        `);

        // Create device inventory table
        await client.query(`
            CREATE TABLE device_inventory (
                id SERIAL PRIMARY KEY,
                site_name VARCHAR(100),
                device_hostname VARCHAR(100),
                device_description VARCHAR(200),
                last_user VARCHAR(100),
                last_seen VARCHAR(100),
                device_type VARCHAR(100),
                device_model VARCHAR(200),
                operating_system VARCHAR(200),
                serial_number VARCHAR(100) UNIQUE,
                device_cpu VARCHAR(200),
                mac_addresses TEXT[],
                status VARCHAR(50) DEFAULT 'active',
                vendor VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_check_in TIMESTAMP,
                ip_address VARCHAR(45),
                location VARCHAR(100),
                department VARCHAR(100),
                notes TEXT,
                asset_tag VARCHAR(50),
                purchase_date DATE,
                warranty_expiry DATE,
                lifecycle_status VARCHAR(50)
            );
        `);

        // Create software licenses table
        await client.query(`
            CREATE TABLE software_licenses (
                id SERIAL PRIMARY KEY,
                software_name VARCHAR(200) NOT NULL,
                license_key TEXT,
                type VARCHAR(50),
                seats_total INTEGER,
                seats_used INTEGER DEFAULT 0,
                purchase_date DATE,
                expiry_date DATE,
                cost DECIMAL(10,2),
                vendor VARCHAR(100),
                status VARCHAR(50),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create peripherals table
        await client.query(`
            CREATE TABLE peripherals (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                type VARCHAR(50),
                model VARCHAR(100),
                serial_number VARCHAR(100),
                status VARCHAR(50),
                assigned_to INTEGER REFERENCES users(id),
                location VARCHAR(100),
                purchase_date DATE,
                warranty_expiry DATE,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create spare parts table
        await client.query(`
            CREATE TABLE spare_parts (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                part_number VARCHAR(100),
                category VARCHAR(50),
                quantity INTEGER DEFAULT 0,
                minimum_quantity INTEGER DEFAULT 1,
                location VARCHAR(100),
                supplier_id INTEGER,
                cost_per_unit DECIMAL(10,2),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create device assignments table
        await client.query(`
            CREATE TABLE device_assignments (
                id SERIAL PRIMARY KEY,
                device_id INTEGER REFERENCES device_inventory(id),
                user_id INTEGER REFERENCES users(id),
                assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                return_date TIMESTAMP,
                status VARCHAR(50),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create maintenance logs table
        await client.query(`
            CREATE TABLE maintenance_logs (
                id SERIAL PRIMARY KEY,
                device_id INTEGER REFERENCES device_inventory(id),
                maintenance_type VARCHAR(50),
                description TEXT,
                performed_by INTEGER REFERENCES users(id),
                performed_date TIMESTAMP,
                cost DECIMAL(10,2),
                next_maintenance_date TIMESTAMP,
                status VARCHAR(50),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create purchase orders table
        await client.query(`
            CREATE TABLE purchase_orders (
                id SERIAL PRIMARY KEY,
                order_number VARCHAR(50) UNIQUE,
                supplier_id INTEGER,
                ordered_by INTEGER REFERENCES users(id),
                order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expected_delivery DATE,
                actual_delivery DATE,
                status VARCHAR(50),
                total_amount DECIMAL(10,2),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create order items table
        await client.query(`
            CREATE TABLE order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES purchase_orders(id),
                item_type VARCHAR(50),
                item_id INTEGER,
                quantity INTEGER,
                unit_price DECIMAL(10,2),
                total_price DECIMAL(10,2),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create suppliers table
        await client.query(`
            CREATE TABLE suppliers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                contact_person VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(50),
                address TEXT,
                website VARCHAR(255),
                tax_id VARCHAR(100),
                payment_terms VARCHAR(255),
                status VARCHAR(50) DEFAULT 'active',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create supplier contracts table
        await client.query(`
            CREATE TABLE supplier_contracts (
                id SERIAL PRIMARY KEY,
                supplier_id INTEGER REFERENCES suppliers(id),
                contract_number VARCHAR(50),
                start_date DATE,
                end_date DATE,
                contract_type VARCHAR(50),
                terms TEXT,
                document_url TEXT,
                status VARCHAR(50),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create warranties table
        await client.query(`
            CREATE TABLE warranties (
                id SERIAL PRIMARY KEY,
                item_type VARCHAR(50),
                item_id INTEGER,
                warranty_number VARCHAR(100),
                provider VARCHAR(100),
                start_date DATE,
                end_date DATE,
                terms TEXT,
                status VARCHAR(50),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create activity logs table
        await client.query(`
            CREATE TABLE activity_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                action_type VARCHAR(50),
                item_type VARCHAR(50),
                item_id INTEGER,
                description TEXT,
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create indexes for better performance
        await client.query(`
            CREATE INDEX idx_device_hostname ON device_inventory(device_hostname);
            CREATE INDEX idx_device_serial ON device_inventory(serial_number);
            CREATE INDEX idx_device_status ON device_inventory(status);
            CREATE INDEX idx_software_name ON software_licenses(software_name);
            CREATE INDEX idx_peripheral_serial ON peripherals(serial_number);
            CREATE INDEX idx_spare_parts_name ON spare_parts(name);
            CREATE INDEX idx_purchase_order_number ON purchase_orders(order_number);
            CREATE INDEX idx_supplier_name ON suppliers(name);
            CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
        `);

        await client.query('COMMIT');
        console.log('Database schema initialized successfully');
        return { success: true, message: 'Schema initialized successfully' };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error initializing schema:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Function to list all tables
async function listTables() {
    const client = await pool.connect();
    try {
        const query = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `;
        const { rows } = await client.query(query);
        console.log('Existing tables:', rows.map(row => row.table_name));
        return rows;
    } catch (error) {
        console.error('Error listing tables:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Function to check if schema exists
async function checkSchema() {
    const client = await pool.connect();
    try {
        console.log('Checking database connection...');
        
        // List existing tables
        const tables = await listTables();
        console.log(`Found ${tables.length} tables in the database`);
        
        // Check for required tables
        const { rows } = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'device_inventory'
            );
        `);
        
        const exists = rows[0].exists;
        console.log('Device inventory table exists:', exists);
        
        return exists;
    } catch (error) {
        console.error('Error checking schema:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Function to reset schema (for development/testing)
async function resetSchema() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Drop existing table and related objects
        await client.query(`
            DROP TABLE IF EXISTS device_inventory CASCADE;
            DROP TABLE IF EXISTS csv_files CASCADE;
            DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
        `);

        // Reinitialize schema
        await initializeSchema();

        await client.query('COMMIT');
        console.log('Schema reset successfully');
        return { success: true, message: 'Schema reset successfully' };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error resetting schema:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Function to check if CSV file exists
async function checkCsvFileExists(filename) {
    const client = await pool.connect();
    try {
        const query = 'SELECT EXISTS(SELECT 1 FROM csv_files WHERE filename = $1)';
        const { rows } = await client.query(query, [filename]);
        return rows[0].exists;
    } catch (error) {
        console.error('Error checking CSV file:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Function to store CSV file
async function storeCsvFile(fileData) {
    const client = await pool.connect();
    try {
        const query = `
            INSERT INTO csv_files (
                filename, 
                original_name, 
                file_size, 
                mime_type, 
                file_data, 
                metadata
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id`;
        
        const values = [
            fileData.filename,
            fileData.originalName,
            fileData.size,
            fileData.mimeType,
            fileData.buffer,
            fileData.metadata || {}
        ];

        const result = await client.query(query, values);
        return result.rows[0].id;
    } catch (error) {
        console.error('Error storing CSV file:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Function to retrieve CSV file
async function getCsvFile(filename) {
    const client = await pool.connect();
    try {
        const query = `
            UPDATE csv_files 
            SET last_accessed = CURRENT_TIMESTAMP 
            WHERE filename = $1 
            RETURNING *`;
        
        const { rows } = await client.query(query, [filename]);
        return rows[0] || null;
    } catch (error) {
        console.error('Error retrieving CSV file:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Function to store CSV data in device inventory
async function storeCsvDataToInventory(csvData) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Prepare the query
        const query = `
            INSERT INTO device_inventory (
                site_name,
                device_hostname,
                device_description,
                last_user,
                last_seen,
                device_type,
                device_model,
                operating_system,
                serial_number,
                device_cpu,
                mac_addresses,
                status,
                vendor,
                last_check_in
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (serial_number) 
            DO UPDATE SET
                site_name = EXCLUDED.site_name,
                device_hostname = EXCLUDED.device_hostname,
                device_description = EXCLUDED.device_description,
                last_user = EXCLUDED.last_user,
                last_seen = EXCLUDED.last_seen,
                device_type = EXCLUDED.device_type,
                device_model = EXCLUDED.device_model,
                operating_system = EXCLUDED.operating_system,
                device_cpu = EXCLUDED.device_cpu,
                mac_addresses = EXCLUDED.mac_addresses,
                status = EXCLUDED.status,
                vendor = EXCLUDED.vendor,
                last_check_in = EXCLUDED.last_check_in,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id;
        `;

        const results = [];
        for (const row of csvData) {
            // Parse MAC addresses from various formats
            let macAddresses = [];
            if (row.mac_addresses) {
                // Convert the MAC addresses to string if it's not already
                const macString = String(row.mac_addresses);
                
                // Remove any square brackets and quotes
                const cleanMacs = macString.replace(/[\[\]"']/g, '');
                
                // Split by either comma, pipe, or space and clean up
                macAddresses = cleanMacs
                    .split(/[,|\s]+/)
                    .map(mac => mac.trim())
                    .filter(mac => mac && mac.length > 0 && mac !== 'null' && mac !== 'undefined');
            }

            // Parse date with multiple formats
            let lastSeen = null;
            let lastCheckIn = null;
            if (row.last_seen) {
                if (String(row.last_seen).toLowerCase() === 'currently online') {
                    lastSeen = new Date();
                    lastCheckIn = new Date();
                } else {
                    try {
                        lastSeen = new Date(row.last_seen);
                        lastCheckIn = lastSeen;
                    } catch (error) {
                        console.warn(`Invalid date format for ${row.device_hostname}: ${row.last_seen}`);
                        lastSeen = new Date();
                        lastCheckIn = new Date();
                    }
                }
            }

            const values = [
                row.site_name || null,
                row.device_hostname || null,
                row.device_description || null,
                row.last_user || null,
                lastSeen,
                row.device_type || null,
                row.device_model || null,
                row.operating_system || null,
                row.serial_number || null,
                row.device_cpu || null,
                macAddresses,
                'active',
                row.vendor || null,
                lastCheckIn
            ];

            try {
                const result = await client.query(query, values);
                results.push(result.rows[0]);
                console.log(`Successfully inserted/updated device: ${row.device_hostname}`);
            } catch (error) {
                console.error(`Error inserting row for ${row.device_hostname}:`, error);
                throw error;
            }
        }

        await client.query('COMMIT');
        return { success: true, insertedRows: results.length, results };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error storing CSV data:', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    initializeSchema,
    checkSchema,
    resetSchema,
    pool,
    checkCsvFileExists,
    storeCsvFile,
    getCsvFile,
    listTables,
    storeCsvDataToInventory
}; 