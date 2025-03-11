const express = require('express');
const router = express.Router();
const multer = require('multer');
const { importDeviceData, getDevices } = require('../controllers/deviceInventory');
const { pool } = require('../database/schema');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../files/uploads');
        // Create directory if it doesn't exist
        require('fs').mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'device_import_' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Route to import CSV data
router.post('/import', upload.single('file'), async (req, res) => {
    try {
        console.log('Starting device import process...');
        
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'No file uploaded' 
            });
        }

        console.log('File received:', req.file.originalname);
        
        const result = await importDeviceData(req.file);
        console.log('Import result:', result);
        
        res.json(result);
    } catch (error) {
        console.error('Error in device import:', error);
        res.status(500).json({ 
            success: false,
            error: error.message || 'Failed to import device data'
        });
    }
});

// Route to import CSV data from an existing file on the server
router.post('/import-server-file', async (req, res) => {
    try {
        console.log('Starting server file import process...');
        
        // Default to the aam.csv file if no path is provided
        const filePath = req.query.path || path.join(__dirname, '../files/aam.csv');
        
        if (!fs.existsSync(filePath)) {
            return res.status(400).json({ 
                success: false, 
                error: `File not found: ${filePath}` 
            });
        }

        console.log('Using file:', filePath);
        
        // Create a file object similar to what multer would provide
        const file = {
            path: filePath,
            originalname: path.basename(filePath)
        };
        
        const result = await importDeviceData(file);
        console.log('Import result:', result);
        
        res.json(result);
    } catch (error) {
        console.error('Error in server file import:', error);
        res.status(500).json({ 
            success: false,
            error: error.message || 'Failed to import device data'
        });
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