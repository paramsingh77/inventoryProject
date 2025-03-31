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
    console.log('=== Starting import process ===');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    try {
        const { filePath } = req.body;
        
        if (!filePath) {
            console.error('No file path provided in request body');
            return res.status(400).json({ 
                success: false, 
                message: 'No file path provided' 
            });
        }

        console.log('File path from request:', filePath);

        // Resolve the file path relative to the backend directory
        const absolutePath = path.resolve(__dirname, '..', filePath);
        console.log('Resolved absolute path:', absolutePath);

        // Check if file exists
        if (!fs.existsSync(absolutePath)) {
            console.error(`File not found at path: ${absolutePath}`);
            return res.status(404).json({ 
                success: false, 
                message: `File not found at path: ${absolutePath}` 
            });
        }

        console.log('File exists, checking readability...');

        // Check if file is readable
        try {
            await fs.promises.access(absolutePath, fs.constants.R_OK);
        } catch (error) {
            console.error('File not readable:', error);
            return res.status(403).json({
                success: false,
                message: `File not readable: ${error.message}`
            });
        }

        console.log('File is readable, checking size...');

        // Check file size
        const stats = await fs.promises.stat(absolutePath);
        if (stats.size === 0) {
            console.error('File is empty');
            return res.status(400).json({
                success: false,
                message: 'File is empty'
            });
        }

        console.log('File size:', stats.size, 'bytes');
        console.log('Creating file object for import...');

        // Create a file object that matches what importDeviceData expects
        const fileObj = {
            path: absolutePath,
            size: stats.size,
            originalname: path.basename(absolutePath)
        };

        console.log('Calling importDeviceData...');
        const result = await importDeviceData(fileObj);
        console.log('Import result:', result);

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error in import-server-file route:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

// Add a fallback route for all devices
router.get('/all', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    
    // Fetch all devices from the main inventory table
    const result = await client.query(`
      SELECT * FROM device_inventory
      ORDER BY device_hostname ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all devices:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching all devices',
      error: error.message 
    });
  } finally {
    // Only release the client if it was successfully acquired
    if (client) {
      try {
        await client.release();
      } catch (releaseError) {
        console.error('Error releasing client:', releaseError);
      }
    }
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

// Add this route to fetch devices by vendor
router.get('/devices/vendor/:vendorName', async (req, res) => {
    try {
        const { vendorName } = req.params;
        
        const result = await pool.query(`
            SELECT *
            FROM device_inventory
            WHERE vendor ILIKE $1
            AND status = 'active'
            ORDER BY device_model, device_hostname
        `, [`%${vendorName}%`]);

        console.log(`Found ${result.rows.length} devices for vendor ${vendorName}`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching vendor devices:', error);
        res.status(500).json({
            message: 'Failed to fetch devices',
            error: error.message
        });
    }
});

// Site-to-table mapping
const siteToTableMap = {
  "Dameron Hospital": "dameron_hospital_device_inventory",
  "Baton Rouge Specialty Hospital": "baton_rouge_specialty_hospital_device_inventory",
  // Add other mappings as needed
};

// Route to get devices for a specific site
router.get('/site/:siteName/devices', async (req, res) => {
  const { siteName } = req.params;
  
  try {
    // Get the table name from mapping or generate it
    let tableName = siteToTableMap[siteName];
    
    if (!tableName) {
      // Generate table name from site name if not in mapping
      const formattedSiteName = siteName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      tableName = `${formattedSiteName}_device_inventory`;
      console.log(`Generated table name for "${siteName}": ${tableName}`);
    }
    
    console.log(`Fetching devices from table: ${tableName}`);
    
    // Check if table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      );
    `, [tableName]);
    
    if (!tableExists.rows[0].exists) {
      console.log(`Table ${tableName} does not exist, falling back to device_inventory`);
      // Fall back to the main device_inventory table with location filter
      const result = await pool.query(`
        SELECT * FROM device_inventory
        WHERE location ILIKE $1
        ORDER BY device_hostname ASC
      `, [`%${siteName}%`]);
      
      // Return in expected format
      return res.json({
        site: siteName,
        devices: result.rows.map(device => ({
          ...device,
          site_name: siteName
        }))
      });
    }
    
    // Use site-specific table
    const result = await pool.query(`SELECT * FROM ${tableName}`);
    
    // Return in expected format
    res.json({
      site: siteName,
      devices: result.rows.map(device => ({
        ...device,
        site_name: siteName
      }))
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ 
      error: "Database error",
      details: error.message,
      site: siteName,
      devices: []
    });
  }
});

// Add this route for site stats
router.get('/site-stats/:siteName', async (req, res) => {
  const { siteName } = req.params;
  
  try {
    // Get the table name from mapping or generate it
    let tableName = siteToTableMap[siteName] || 
                   siteName.toLowerCase().replace(/[^a-z0-9]/g, '_') + "_device_inventory";
    
    const stats = {
      total: 0,
      active: 0,
      offline: 0,
      recent: 0,
      pending: 0
    };
    
    // Try to query the site-specific table
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      );
    `, [tableName]);
    
    if (tableExists.rows[0].exists) {
      console.log(`Fetching stats from ${tableName}`);
      
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' OR status = 'Active' THEN 1 END) as active,
          COUNT(CASE WHEN status = 'offline' OR status = 'Offline' THEN 1 END) as offline,
          COUNT(CASE WHEN last_seen > NOW() - INTERVAL '7 days' THEN 1 END) as recent
        FROM ${tableName}
      `);
      
      if (result.rows.length > 0) {
        stats.total = parseInt(result.rows[0].total) || 0;
        stats.active = parseInt(result.rows[0].active) || 0;
        stats.offline = parseInt(result.rows[0].offline) || 0;
        stats.recent = parseInt(result.rows[0].recent) || 0;
      }
    } else {
      console.log(`Table ${tableName} not found, using device_inventory`);
      
      // Use the main device_inventory table with a filter
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' OR status = 'Active' THEN 1 END) as active,
          COUNT(CASE WHEN status = 'offline' OR status = 'Offline' THEN 1 END) as offline,
          COUNT(CASE WHEN last_seen > NOW() - INTERVAL '7 days' THEN 1 END) as recent
        FROM device_inventory
        WHERE location ILIKE $1
      `, [`%${siteName}%`]);
      
      if (result.rows.length > 0) {
        stats.total = parseInt(result.rows[0].total) || 0;
        stats.active = parseInt(result.rows[0].active) || 0;
        stats.offline = parseInt(result.rows[0].offline) || 0;
        stats.recent = parseInt(result.rows[0].recent) || 0;
      }
    }
    
    res.json(stats);
  } catch (error) {
    console.error("Error fetching site stats:", error);
    res.status(500).json({ 
      error: "Database error", 
      message: error.message,
      total: 0,
      active: 0,
      offline: 0,
      recent: 0,
      pending: 0
    });
  }
});

module.exports = router; 