const express = require('express');
const router = express.Router();
const { importDeviceData, getDevices } = require('../controllers/deviceInventory');
const { pool } = require('../database/schema');

// Route to import CSV data
router.post('/import', async (req, res) => {
    try {
        const result = await importDeviceData();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to get devices with filtering and pagination
router.get('/', async (req, res) => {
    try {
        const { 
            page, 
            limit, 
            sortBy, 
            sortOrder, 
            siteName, 
            deviceType, 
            status 
        } = req.query;

        const filters = {
            siteName,
            deviceType,
            status
        };

        const devices = await getDevices({ 
            page: parseInt(page), 
            limit: parseInt(limit), 
            sortBy, 
            sortOrder,
            filters 
        });

        res.json(devices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all devices
router.get('/all', async (req, res) => {
    try {
        const query = `
            WITH processed_devices AS (
                SELECT 
                    id,
                    site_name,
                    device_hostname,
                    device_description,
                    last_user,
                    CASE 
                        WHEN last_seen = 'Currently Online' THEN NOW()
                        ELSE CAST(last_seen AS TIMESTAMP)
                    END as last_seen,
                    device_type,
                    device_model,
                    operating_system,
                    serial_number,
                    device_cpu,
                    mac_addresses,
                    status,
                    created_at,
                    updated_at,
                    last_check_in,
                    ip_address,
                    location,
                    department,
                    notes
                FROM device_inventory
            )
            SELECT 
                id,
                site_name,
                device_hostname,
                device_description,
                last_user,
                CASE 
                    WHEN last_seen = NOW() THEN 'Currently Online'
                    ELSE last_seen::TEXT
                END as last_seen,
                device_type,
                device_model,
                operating_system,
                serial_number,
                device_cpu,
                mac_addresses,
                status,
                created_at,
                updated_at,
                last_check_in,
                ip_address,
                location,
                department,
                notes
            FROM processed_devices 
            ORDER BY 
                CASE WHEN last_seen = NOW() THEN 0 ELSE 1 END,
                last_seen DESC;
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching devices',
            error: error.message 
        });
    }
});

// Get device by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query('SELECT * FROM device_inventory WHERE id = $1', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Device not found' 
            });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching device:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching device',
            error: error.message 
        });
    }
});

// Get devices by site name
router.get('/site/:siteName', async (req, res) => {
    try {
        const { siteName } = req.params;
        const { rows } = await pool.query(
            'SELECT * FROM device_inventory WHERE site_name = $1 ORDER BY device_hostname',
            [siteName]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching devices by site:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching devices by site',
            error: error.message 
        });
    }
});

// Update device status
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const { rows } = await pool.query(
            'UPDATE device_inventory SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Device not found' 
            });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Error updating device status:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating device status',
            error: error.message 
        });
    }
});

module.exports = router; 