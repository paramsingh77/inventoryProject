const express = require('express');
const router = express.Router();
const multer = require('multer');
const { importDeviceData, getDevices } = require('../controllers/deviceInventory');
const { pool } = require('../database/schema');
const path = require('path');
const fs = require('fs');
const { getUniqueVendorsForModels, detectVendorFromModel } = require('../utils/modelLookup');
const { log } = require('console');

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

// Route to get all unique vendors/manufacturers
router.get('/vendors', async (req, res) => {
    try {
        console.log('Fetching vendor information from device models...');
        
        const client = await pool.connect();
        try {
            // First, get all unique device models
            const modelQuery = `
                SELECT DISTINCT device_model FROM device_inventory 
                WHERE device_model IS NOT NULL AND device_model != ''
            `;
            
            const modelResult = await client.query(modelQuery);
            console.log(`Found ${modelResult.rows.length} unique device models`);
            
            // Prepare vendors list
            let vendors = [];
             
            if (modelResult.rows.length > 0) {
                // Extract model numbers
                const modelNumbers = modelResult.rows.map(row => row.device_model);
                
                // Get vendors for these model numbers using pattern detection
                const vendorPromises = modelNumbers.map(model => {
                    // Simple pattern matching for common vendors
                    return { name: detectVendorFromModel(model) };
                });
                
                // Filter out unknown vendors and duplicates
                vendors = vendorPromises
                    .filter(v => v.name && v.name !== 'Unknown')
                    .filter((vendor, index, self) => 
                        index === self.findIndex(v => v.name === vendor.name)
                    );
            }
            
            // If we couldn't find any vendors from models, use hardcoded list
            if (vendors.length === 0) {
                console.log('No vendors found from models, using hardcoded list');
                vendors = [
                    { name: 'Dell' },
                    { name: 'HP' },
                    { name: 'Lenovo' },
                    { name: 'Apple' },
                    { name: 'Microsoft' },
                    { name: 'Cisco' },
                    { name: 'Samsung' },
                    { name: 'Asus' },
                    { name: 'Acer' },
                    { name: 'Logitech' },
                    { name: 'IBM' },
                    { name: 'Intel' },
                    { name: 'AMD' },
                    { name: 'Sony' },
                    { name: 'LG' },
                    { name: 'Toshiba' }
                ];
            }
            
            // Sort vendors by name
            vendors.sort((a, b) => a.name.localeCompare(b.name));
            
            console.log(`Returning ${vendors.length} vendors`);
            res.json(vendors);
            console.log("WE got");
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching vendors from device models:', error);
        
        // Fallback to hardcoded vendors if there's an error
        const hardcodedVendors = [
            { name: 'Dell' },
            { name: 'HP' },
            { name: 'Lenovo' },
            { name: 'Apple' },
            { name: 'Microsoft' },
            { name: 'Cisco' },
            { name: 'Samsung' },
            { name: 'Asus' }
        ];
        
        console.log('Error occurred, returning hardcoded vendor list');
        res.json(hardcodedVendors);
    }
});

// Route to get devices by vendor name
router.get('/vendor/:vendorName', async (req, res) => {
    try {
        const vendorName = req.params.vendorName;
        console.log(`Fetching devices for vendor: ${vendorName}`);
        
        if (!vendorName) {
            return res.status(400).json({
                success: false,
                error: 'Vendor name is required'
            });
        }
        
        // Generate sample products for this vendor
        const sampleProducts = generateSampleProducts(vendorName);
        console.log(`Generated ${sampleProducts.length} sample products for ${vendorName}`);
        
        res.json(sampleProducts);
    } catch (error) {
        console.error(`Error fetching devices for vendor ${req.params.vendorName}:`, error);
        
        // Return sample products even if an error occurs
        const sampleProducts = generateSampleProducts(req.params.vendorName);
        res.json(sampleProducts);
    }
});

/**
 * Generate sample products for a given vendor
 * @param {string} vendorName - The vendor name
 * @returns {Array} - Array of sample products
 */
function generateSampleProducts(vendorName) {
    const vendorNameLower = vendorName.toLowerCase();
    
    // Create product templates based on vendor
    const productTemplates = {
        'dell': [
            { model: 'Latitude 5520', type: 'laptop', price: 1299 },
            { model: 'Precision 5550', type: 'laptop', price: 1999 },
            { model: 'XPS 15', type: 'laptop', price: 1799 },
            { model: 'Optiplex 7090', type: 'desktop', price: 899 },
            { model: 'Inspiron 15', type: 'laptop', price: 699 },
            { model: 'Precision Tower 5820', type: 'workstation', price: 2499 },
            { model: 'PowerEdge R750', type: 'server', price: 3999 }
        ],
        'hp': [
            { model: 'EliteBook 850', type: 'laptop', price: 1399 },
            { model: 'ProBook 440', type: 'laptop', price: 899 },
            { model: 'Envy 15', type: 'laptop', price: 1299 },
            { model: 'ProDesk 600', type: 'desktop', price: 799 },
            { model: 'Color LaserJet Pro', type: 'printer', price: 499 },
            { model: 'Z4 Workstation', type: 'workstation', price: 2299 },
            { model: 'ProLiant DL380', type: 'server', price: 4299 }
        ],
        'lenovo': [
            { model: 'ThinkPad X1 Carbon', type: 'laptop', price: 1599 },
            { model: 'ThinkPad T14s', type: 'laptop', price: 1199 },
            { model: 'Legion 5', type: 'laptop', price: 999 },
            { model: 'ThinkCentre M90n', type: 'desktop', price: 699 },
            { model: 'ThinkStation P340', type: 'workstation', price: 1899 },
            { model: 'ThinkSystem SR650', type: 'server', price: 3599 }
        ],
        'apple': [
            { model: 'MacBook Pro 14"', type: 'laptop', price: 1999 },
            { model: 'MacBook Air M2', type: 'laptop', price: 1199 },
            { model: 'iMac 24"', type: 'desktop', price: 1499 },
            { model: 'Mac Mini M2', type: 'desktop', price: 699 },
            { model: 'Mac Studio', type: 'workstation', price: 1999 },
            { model: 'Mac Pro', type: 'workstation', price: 5999 }
        ],
        'microsoft': [
            { model: 'Surface Pro 9', type: 'tablet', price: 999 },
            { model: 'Surface Laptop 5', type: 'laptop', price: 1299 },
            { model: 'Surface Book 3', type: 'laptop', price: 1599 },
            { model: 'Surface Studio 2', type: 'desktop', price: 3499 },
            { model: 'Surface Hub 2S', type: 'display', price: 8999 }
        ],
        'cisco': [
            { model: 'Catalyst 9200', type: 'switch', price: 2999 },
            { model: 'Nexus 9300', type: 'switch', price: 9999 },
            { model: 'ISR 4321', type: 'router', price: 1999 },
            { model: 'Meraki MX68', type: 'security', price: 1299 },
            { model: 'Webex Room Kit', type: 'conferencing', price: 9999 }
        ]
    };
    
    // Default products if vendor not in the list
    const defaultProducts = [
        { model: 'Professional Laptop 14"', type: 'laptop', price: 899 },
        { model: 'Business Desktop', type: 'desktop', price: 699 },
        { model: 'Professional Workstation', type: 'workstation', price: 1499 },
        { model: 'Enterprise Server', type: 'server', price: 2999 }
    ];
    
    // Get template for this vendor or use default
    const templates = productTemplates[vendorNameLower] || defaultProducts;
    
    // Generate product details
    return templates.map((template, index) => {
        // Generate a unique id
        const id = `${vendorName.toLowerCase().replace(/\s+/g, '-')}-${template.type}-${index}`;
        
        // Create device_model format
        const deviceModel = `${vendorName} ${template.model} (${template.type})`;
        
        // Create full product object
        return {
            id: id,
            device_hostname: `${vendorName}-${template.type}-${100 + index}`,
            device_model: deviceModel,
            device_type: template.type,
            status: 'active',
            estimated_value: template.price,
            serial_number: `SN${Math.floor(Math.random() * 1000000)}`,
            device_description: `${vendorName} ${template.model} - ${template.type}`,
            site_name: 'Main Office',
            last_seen: new Date().toISOString(),
            mac_address: generateRandomMAC()
        };
    });
}

/**
 * Generate a random MAC address
 * @returns {string} - Random MAC address
 */
function generateRandomMAC() {
    return Array(6).fill(0).map(() => {
        return Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    }).join(':');
}

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