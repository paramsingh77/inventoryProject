const express = require('express');
const router = express.Router();
const { pool } = require('../config/db.config');
const axios = require('axios');

// GET /api/vendors - Get vendors by looking up device models online
router.get('/vendors', async (req, res) => {
    try {
        // First get unique device models from device_inventory
        const result = await pool.query(`
            SELECT DISTINCT device_model
            FROM device_inventory 
            WHERE device_model IS NOT NULL 
            AND device_model != '' 
            AND status = 'active'
            ORDER BY device_model;
        `);

        const deviceModels = result.rows;
        const vendors = new Set(); // Use Set to store unique vendors

        // Look up each model online to find its manufacturer
        for (const device of deviceModels) {
            try {
                // You might want to use a specific API or service here
                // This is just an example using a hypothetical API
                const vendorInfo = await lookupDeviceManufacturer(device.device_model);
                if (vendorInfo && vendorInfo.name) {
                    vendors.add({
                        id: vendors.size + 1,
                        name: vendorInfo.name,
                        email: `sales@${vendorInfo.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
                        phone: vendorInfo.phone || 'N/A',
                        address: vendorInfo.address || 'N/A',
                        contact_person: '',
                        status: 'active'
                    });
                }
            } catch (lookupError) {
                console.warn(`Could not find vendor for model ${device.device_model}:`, lookupError);
            }
        }

        const vendorArray = Array.from(vendors);
        console.log(`Successfully found ${vendorArray.length} vendors for device models`);
        
        res.json(vendorArray);
    } catch (error) {
        console.error('Error in /vendors route:', {
            message: error.message,
            stack: error.stack
        });
        
        res.status(500).json({ 
            message: 'Failed to fetch vendors',
            error: error.message
        });
    }
});

// Function to look up device manufacturer online
async function lookupDeviceManufacturer(model) {
    try {
        // You would implement your actual lookup logic here
        // This might involve calling a specific API or web service
        
        // Example using a hypothetical API
        const response = await axios.get(`https://api.deviceinfo.com/lookup?model=${encodeURIComponent(model)}`);
        
        if (response.data && response.data.manufacturer) {
            return {
                name: response.data.manufacturer,
                phone: response.data.contact?.phone,
                address: response.data.contact?.address
            };
        }
        
        return null;
    } catch (error) {
        console.warn(`Error looking up manufacturer for model ${model}:`, error);
        return null;
    }
}

// Test route to verify the router is working
router.get('/vendors/test', (req, res) => {
    res.json({ message: 'Vendor routes are working' });
});

// Add some test vendors if none exist
router.post('/vendors/seed', async (req, res) => {
    try {
        // Check if vendors exist
        const check = await pool.query('SELECT COUNT(*) FROM vendors');
        
        if (parseInt(check.rows[0].count) === 0) {
            // Add test vendors
            await pool.query(`
                INSERT INTO vendors (name, email, phone, status) VALUES
                ('Test Vendor 1', 'vendor1@test.com', '123-456-7890', 'active'),
                ('Test Vendor 2', 'vendor2@test.com', '123-456-7891', 'active'),
                ('Test Vendor 3', 'vendor3@test.com', '123-456-7892', 'active')
            `);
            res.json({ message: 'Test vendors added successfully' });
        } else {
            res.json({ message: 'Vendors already exist' });
        }
    } catch (error) {
        console.error('Error seeding vendors:', error);
        res.status(500).json({ 
            message: 'Failed to seed vendors',
            error: error.message
        });
    }
});

// Add this before your routes
router.get('/vendors/check-table', async (req, res) => {
    try {
        const query = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name = 'vendors'
            );
        `;
        const result = await pool.query(query);
        res.json({
            tableExists: result.rows[0].exists,
            schema: await getTableSchema()
        });
    } catch (error) {
        console.error('Error checking vendors table:', error);
        res.status(500).json({ error: error.message });
    }
});

async function getTableSchema() {
    try {
        const query = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'vendors';
        `;
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error getting table schema:', error);
        return null;
    }
}

// Add this route at the top of your routes
router.post('/vendors/init', async (req, res) => {
    try {
        await require('../database/schema').initializeVendorsTable();
        
        // After creating table, add some test vendors
        await pool.query(`
            INSERT INTO vendors (name, email, phone, status) 
            VALUES 
            ('Test Vendor 1', 'vendor1@test.com', '123-456-7890', 'active'),
            ('Test Vendor 2', 'vendor2@test.com', '123-456-7891', 'active'),
            ('Test Vendor 3', 'vendor3@test.com', '123-456-7892', 'active')
            ON CONFLICT (name) DO NOTHING;
        `);
        
        res.json({ message: 'Vendors table initialized and seeded successfully' });
    } catch (error) {
        console.error('Error initializing vendors:', error);
        res.status(500).json({ 
            message: 'Failed to initialize vendors table', 
            error: error.message 
        });
    }
});

// Other vendor routes...

module.exports = router; 