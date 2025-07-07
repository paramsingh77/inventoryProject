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

// FIXED: New endpoint that combines inventory vendors and suppliers for PO creation
router.get('/vendors/combined', async (req, res) => {
    try {
        console.log('Fetching combined vendors and suppliers for PO creation...');
        
        const client = await pool.connect();
        try {
            const combinedVendors = [];
            const vendorMap = new Map(); // To track unique vendors by name
            
            // 1. Get vendors from device inventory
            console.log('Fetching vendors from device inventory...');
            const inventoryVendorQuery = `
                SELECT DISTINCT 
                    vendor as name,
                    COUNT(*) as device_count,
                    STRING_AGG(DISTINCT device_type, ', ') as device_types
                FROM device_inventory 
                WHERE vendor IS NOT NULL AND vendor != ''
                GROUP BY vendor
                ORDER BY vendor
            `;
            
            const inventoryResult = await client.query(inventoryVendorQuery);
            console.log(`Found ${inventoryResult.rows.length} vendors from inventory`);
            
            // Add inventory vendors to combined list
            inventoryResult.rows.forEach((vendor, index) => {
                const vendorId = `inventory-${index + 1}`;
                vendorMap.set(vendor.name.toLowerCase(), {
                    id: vendorId,
                    name: vendor.name,
                    source: 'inventory',
                    device_count: vendor.device_count,
                    device_types: vendor.device_types,
                    email: `sales@${vendor.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
                    phone: 'N/A',
                    contact_person: '',
                    address: 'N/A'
                });
            });
            
            // 2. Get suppliers from suppliers table
            console.log('Fetching suppliers from suppliers table...');
            const suppliersQuery = `
                SELECT 
                    id,
                    name,
                    contact_person,
                    email,
                    phone,
                    address,
                    website,
                    status,
                    category,
                    notes
                FROM suppliers 
                WHERE status = 'active'
                ORDER BY name
            `;
            
            const suppliersResult = await client.query(suppliersQuery);
            console.log(`Found ${suppliersResult.rows.length} suppliers`);
            
            // Add suppliers to combined list (may override inventory vendors with more complete data)
            suppliersResult.rows.forEach(supplier => {
                const existingVendor = vendorMap.get(supplier.name.toLowerCase());
                
                if (existingVendor) {
                    // Update existing vendor with supplier data (more complete)
                    existingVendor.id = `supplier-${supplier.id}`;
                    existingVendor.source = 'both';
                    existingVendor.contact_person = supplier.contact_person || existingVendor.contact_person;
                    existingVendor.email = supplier.email || existingVendor.email;
                    existingVendor.phone = supplier.phone || existingVendor.phone;
                    existingVendor.address = supplier.address || existingVendor.address;
                    existingVendor.website = supplier.website;
                    existingVendor.category = supplier.category;
                    existingVendor.notes = supplier.notes;
                } else {
                    // Add new supplier
                    vendorMap.set(supplier.name.toLowerCase(), {
                        id: `supplier-${supplier.id}`,
                        name: supplier.name,
                        source: 'suppliers',
                        device_count: 0,
                        device_types: '',
                        contact_person: supplier.contact_person || '',
                        email: supplier.email || `sales@${supplier.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
                        phone: supplier.phone || 'N/A',
                        address: supplier.address || 'N/A',
                        website: supplier.website,
                        category: supplier.category,
                        notes: supplier.notes
                    });
                }
            });
            
            // Convert map to array and sort by name
            const finalVendors = Array.from(vendorMap.values()).sort((a, b) => 
                a.name.localeCompare(b.name)
            );
            
            console.log(`Returning ${finalVendors.length} combined vendors/suppliers`);
            res.json(finalVendors);
            
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching combined vendors:', error);
        
        // Fallback to basic vendor list if there's an error
        const fallbackVendors = [
            { 
                id: 'fallback-1',
                name: 'Dell Technologies',
                source: 'fallback',
                device_count: 0,
                device_types: '',
                email: 'sales@dell.com',
                phone: 'N/A',
                contact_person: '',
                address: 'N/A'
            },
            { 
                id: 'fallback-2',
                name: 'HP Inc.',
                source: 'fallback',
                device_count: 0,
                device_types: '',
                email: 'sales@hp.com',
                phone: 'N/A',
                contact_person: '',
                address: 'N/A'
            },
            { 
                id: 'fallback-3',
                name: 'Lenovo Group Limited',
                source: 'fallback',
                device_count: 0,
                device_types: '',
                email: 'sales@lenovo.com',
                phone: 'N/A',
                contact_person: '',
                address: 'N/A'
            }
        ];
        
        console.log('Error occurred, returning fallback vendor list');
        res.json(fallbackVendors);
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

// Add a route to add a single device
router.post('/', async (req, res) => {
  let client;
  try {
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    const {
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
      mac_addresses
    } = req.body;

    // Check required fields
    if (!device_hostname || !serial_number || !site_name) {
      console.log('Missing required fields:', { device_hostname, serial_number, site_name });
      return res.status(400).json({ 
        success: false, 
        message: 'Device hostname, serial number, and site name are required' 
      });
    }

    // Log formatted mac_addresses to debug
    console.log('MAC addresses before processing:', mac_addresses);
    console.log('MAC addresses type:', typeof mac_addresses, Array.isArray(mac_addresses));

    // Extract vendor from device model
    const vendor = device_model ? 
      device_model.split(' ')[0].replace(/[^a-zA-Z]/g, '') : 
      'Unknown';
      
    // Handle last_seen field - convert "Currently Online" to current timestamp
    let formattedLastSeen;
    if (!last_seen || last_seen === 'Currently Online') {
      formattedLastSeen = new Date().toISOString();
    } else {
      // Try to parse as a date, if it fails, use current date
      try {
        const parsedDate = new Date(last_seen);
        formattedLastSeen = parsedDate.toString() !== 'Invalid Date' 
          ? parsedDate.toISOString() 
          : new Date().toISOString();
      } catch (e) {
        console.error('Error parsing last_seen date, using current timestamp:', e);
        formattedLastSeen = new Date().toISOString();
      }
    }
    
    console.log('Formatted last_seen:', formattedLastSeen);

    client = await pool.connect();

    // First ensure the main table exists
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS device_inventory (
        id SERIAL PRIMARY KEY,
        site_name VARCHAR(255),
        device_hostname VARCHAR(255),
        device_description TEXT,
        last_user VARCHAR(255),
        last_seen TIMESTAMP,
        device_type VARCHAR(100),
        device_model VARCHAR(255),
        operating_system VARCHAR(255),
        serial_number VARCHAR(255),
        device_cpu VARCHAR(255),
        mac_addresses TEXT[],
        vendor VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await client.query(createTableQuery);

    // Check if a device with the same serial number already exists in main table
    const checkQuery = `SELECT * FROM device_inventory WHERE serial_number = $1`;
    const checkResult = await client.query(checkQuery, [serial_number]);
    
    if (checkResult.rows.length > 0) {
      console.log('Device with serial number already exists in main table:', serial_number);
      return res.status(409).json({
        success: false,
        message: 'A device with this serial number already exists'
      });
    }

    // Format site name for table name
    const formattedSiteName = site_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const siteTableName = `${formattedSiteName}_device_inventory`;
    
    console.log(`Creating/checking site-specific table: ${siteTableName}`);

    // Create site-specific table if it doesn't exist
    const createSiteTableQuery = `
      CREATE TABLE IF NOT EXISTS ${siteTableName} (
        id SERIAL PRIMARY KEY,
        site_name VARCHAR(255),
        device_hostname VARCHAR(255),
        device_description TEXT,
        last_user VARCHAR(255),
        last_seen TIMESTAMP,
        device_type VARCHAR(100),
        device_model VARCHAR(255),
        operating_system VARCHAR(255),
        serial_number VARCHAR(255),
        device_cpu VARCHAR(255),
        mac_addresses TEXT[],
        vendor VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await client.query(createSiteTableQuery);
    
    // Check if device exists in site-specific table
    const checkSiteQuery = `SELECT * FROM ${siteTableName} WHERE serial_number = $1`;
    const checkSiteResult = await client.query(checkSiteQuery, [serial_number]);
    
    if (checkSiteResult.rows.length > 0) {
      console.log('Device with serial number already exists in site table:', serial_number);
      return res.status(409).json({
        success: false,
        message: 'A device with this serial number already exists at this site'
      });
    }

    // Begin transaction
    await client.query('BEGIN');

    // Insert into the main device_inventory table
    const insertMainQuery = `
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
        vendor
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      site_name,
      device_hostname,
      device_description || '',
      last_user || '',
      formattedLastSeen,
      device_type || '',
      device_model || '',
      operating_system || '',
      serial_number,
      device_cpu || '',
      mac_addresses || [],
      vendor
    ];

    const mainResult = await client.query(insertMainQuery, values);
    console.log('Device inserted into main table:', mainResult.rows[0]);
    
    // Insert into site-specific table
    const insertSiteQuery = `
      INSERT INTO ${siteTableName} (
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
        vendor
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const siteResult = await client.query(insertSiteQuery, values);
    console.log('Device inserted into site table:', siteResult.rows[0]);
    
    // Commit transaction
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Device added successfully',
      device: siteResult.rows[0]
    });
  } catch (error) {
    // Rollback in case of error
    if (client) {
      await client.query('ROLLBACK').catch(err => 
        console.error('Error during rollback:', err)
      );
    }
    
    console.error('Error adding device:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error adding device',
      error: error.message 
    });
  } finally {
    if (client) {
      try {
        await client.release();
      } catch (releaseError) {
        console.error('Error releasing client:', releaseError);
      }
    }
  }
});

// Get all unique device types
router.get('/types', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    
    const query = `
      SELECT DISTINCT device_type 
      FROM device_inventory 
      WHERE device_type IS NOT NULL AND device_type != '' 
      ORDER BY device_type
    `;
    
    const result = await client.query(query);
    
    // Extract the device types from the result
    const deviceTypes = result.rows.map(row => row.device_type);
    
    res.json(deviceTypes);
  } catch (error) {
    console.error('Error fetching device types:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching device types',
      error: error.message 
    });
  } finally {
    if (client) {
      try {
        await client.release();
      } catch (releaseError) {
        console.error('Error releasing client:', releaseError);
      }
    }
  }
});

// Get all unique OS versions
router.get('/os-versions', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    
    const query = `
      SELECT DISTINCT operating_system 
      FROM device_inventory 
      WHERE operating_system IS NOT NULL AND operating_system != '' 
      ORDER BY operating_system
    `;
    
    const result = await client.query(query);
    
    // Extract the OS versions from the result
    const osVersions = result.rows.map(row => row.operating_system);
    
    res.json(osVersions);
  } catch (error) {
    console.error('Error fetching OS versions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching OS versions',
      error: error.message 
    });
  } finally {
    if (client) {
      try {
        await client.release();
      } catch (releaseError) {
        console.error('Error releasing client:', releaseError);
      }
    }
  }
});

// Update a device
router.put('/:id', async (req, res) => {
  let client;
  try {
    const { id } = req.params;
    console.log('Updating device with ID:', id);
    console.log('Request body:', req.body);
    
    const {
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
      mac_addresses
    } = req.body;

    // Check required fields
    if (!device_hostname || !serial_number || !site_name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Device hostname, serial number, and site name are required' 
      });
    }

    // Extract vendor from device model
    const vendor = device_model ? 
      device_model.split(' ')[0].replace(/[^a-zA-Z]/g, '') : 
      'Unknown';
      
    // Handle last_seen field - convert "Currently Online" to current timestamp
    let formattedLastSeen;
    if (!last_seen || last_seen === 'Currently Online') {
      formattedLastSeen = new Date().toISOString();
    } else {
      // Try to parse as a date, if it fails, use current date
      try {
        const parsedDate = new Date(last_seen);
        formattedLastSeen = parsedDate.toString() !== 'Invalid Date' 
          ? parsedDate.toISOString() 
          : new Date().toISOString();
      } catch (e) {
        console.error('Error parsing last_seen date, using current timestamp:', e);
        formattedLastSeen = new Date().toISOString();
      }
    }
    
    console.log('Formatted last_seen:', formattedLastSeen);

    client = await pool.connect();
    
    // Begin transaction
    await client.query('BEGIN');

    // *** Enhanced device lookup logic ***
    
    // Try looking up device by ID first
    console.log(`Trying to find device with ID: ${id}`);
    const checkByIdQuery = `SELECT * FROM device_inventory WHERE id = $1`;
    const deviceByIdResult = await client.query(checkByIdQuery, [id]);
    console.log(`Results from ID lookup: ${deviceByIdResult.rows.length} rows`);
    
    // If not found, try looking up by serial number as fallback
    let checkResult = deviceByIdResult;
    if (deviceByIdResult.rows.length === 0 && serial_number) {
      console.log(`Device not found by ID, trying with serial number: ${serial_number}`);
      const checkBySerialQuery = `SELECT * FROM device_inventory WHERE serial_number = $1`;
      const deviceBySerialResult = await client.query(checkBySerialQuery, [serial_number]);
      console.log(`Results from serial number lookup: ${deviceBySerialResult.rows.length} rows`);
      checkResult = deviceBySerialResult;
    }
    
    // If still not found, return 404
    if (checkResult.rows.length === 0) {
      console.log('Device not found by either ID or serial number');
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    const deviceToUpdate = checkResult.rows[0];
    console.log('Found device to update:', deviceToUpdate);
    
    // Get the original site name from the database
    const originalSiteName = deviceToUpdate.site_name;
    console.log('Original site name:', originalSiteName);
    
    // Format site names for table names
    const formattedOriginalSiteName = originalSiteName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const originalSiteTable = `${formattedOriginalSiteName}_device_inventory`;
    
    const formattedNewSiteName = site_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newSiteTable = `${formattedNewSiteName}_device_inventory`;
    
    console.log('Original site table:', originalSiteTable);
    console.log('New site table:', newSiteTable);
    
    // Check if the site has changed
    const siteChanged = originalSiteName !== site_name;
    
    // Update the device in the main table
    const updateMainQuery = `
      UPDATE device_inventory SET
        site_name = $1,
        device_hostname = $2,
        device_description = $3,
        last_user = $4,
        last_seen = $5,
        device_type = $6,
        device_model = $7,
        operating_system = $8,
        serial_number = $9,
        device_cpu = $10,
        mac_addresses = $11,
        vendor = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `;

    const values = [
      site_name,
      device_hostname,
      device_description || '',
      last_user || '',
      formattedLastSeen,
      device_type || '',
      device_model || '',
      operating_system || '',
      serial_number,
      device_cpu || '',
      mac_addresses || [],
      vendor,
      deviceToUpdate.id // Use the device ID we found
    ];

    const mainResult = await client.query(updateMainQuery, values);
    console.log('Device updated in main table:', mainResult.rows[0]);
    
    // If site has changed, we need to move the device to the new site table
    if (siteChanged) {
      console.log(`Site has changed from ${originalSiteName} to ${site_name}`);
      
      // First, ensure the new site table exists
      const createNewSiteTableQuery = `
        CREATE TABLE IF NOT EXISTS ${newSiteTable} (
          id SERIAL PRIMARY KEY,
          site_name VARCHAR(255),
          device_hostname VARCHAR(255),
          device_description TEXT,
          last_user VARCHAR(255),
          last_seen TIMESTAMP,
          device_type VARCHAR(100),
          device_model VARCHAR(255),
          operating_system VARCHAR(255),
          serial_number VARCHAR(255),
          device_cpu VARCHAR(255),
          mac_addresses TEXT[],
          vendor VARCHAR(255),
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      await client.query(createNewSiteTableQuery);
      
      // Check if device with same serial exists in new site table
      const checkNewSiteQuery = `SELECT * FROM ${newSiteTable} WHERE serial_number = $1 AND id != $2`;
      const checkNewSiteResult = await client.query(checkNewSiteQuery, [serial_number, deviceToUpdate.id]);
      
      if (checkNewSiteResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          message: 'A device with this serial number already exists at the destination site'
        });
      }
      
      // Check if original site table exists
      const checkOriginalTableQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `;
      
      const originalTableExists = await client.query(checkOriginalTableQuery, [originalSiteTable]);
      
      if (originalTableExists.rows[0].exists) {
        // Check if device exists in original site table
        const checkOriginalSiteQuery = `SELECT * FROM ${originalSiteTable} WHERE serial_number = $1`;
        const checkOriginalSiteResult = await client.query(checkOriginalSiteQuery, [deviceToUpdate.serial_number]);
        
        if (checkOriginalSiteResult.rows.length > 0) {
          // Delete from original site table
          const deleteOriginalQuery = `DELETE FROM ${originalSiteTable} WHERE serial_number = $1`;
          await client.query(deleteOriginalQuery, [deviceToUpdate.serial_number]);
          console.log('Device removed from original site table');
        }
      }
      
      // Insert into new site table
      const insertNewSiteQuery = `
        INSERT INTO ${newSiteTable} (
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
          vendor,
          status,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
      
      const newSiteValues = [
        ...values.slice(0, 12),
        mainResult.rows[0].status || 'active',
        mainResult.rows[0].created_at || new Date()
      ];
      
      const newSiteResult = await client.query(insertNewSiteQuery, newSiteValues);
      console.log('Device inserted into new site table:', newSiteResult.rows[0]);
    } else {
      // If site hasn't changed, just update the existing site table
      console.log('Site has not changed, updating site-specific table');
      
      // Check if site table exists
      const checkSiteTableQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `;
      
      const siteTableExists = await client.query(checkSiteTableQuery, [originalSiteTable]);
      
      if (siteTableExists.rows[0].exists) {
        // Update in site table
        const updateSiteQuery = `
          UPDATE ${originalSiteTable} SET
            device_hostname = $1,
            device_description = $2,
            last_user = $3,
            last_seen = $4,
            device_type = $5,
            device_model = $6,
            operating_system = $7,
            serial_number = $8,
            device_cpu = $9,
            mac_addresses = $10,
            vendor = $11,
            updated_at = CURRENT_TIMESTAMP
          WHERE serial_number = $12
          RETURNING *
        `;
        
        const siteValues = [
          device_hostname,
          device_description || '',
          last_user || '',
          formattedLastSeen,
          device_type || '',
          device_model || '',
          operating_system || '',
          serial_number,
          device_cpu || '',
          mac_addresses || [],
          vendor,
          serial_number
        ];
        
        const siteResult = await client.query(updateSiteQuery, siteValues);
        console.log('Device updated in site table:', siteResult.rows[0]);
      } else {
        // Create the site table and insert the device
        console.log(`Site table ${originalSiteTable} doesn't exist, creating it`);
        
        const createSiteTableQuery = `
          CREATE TABLE IF NOT EXISTS ${originalSiteTable} (
            id SERIAL PRIMARY KEY,
            site_name VARCHAR(255),
            device_hostname VARCHAR(255),
            device_description TEXT,
            last_user VARCHAR(255),
            last_seen TIMESTAMP,
            device_type VARCHAR(100),
            device_model VARCHAR(255),
            operating_system VARCHAR(255),
            serial_number VARCHAR(255),
            device_cpu VARCHAR(255),
            mac_addresses TEXT[],
            vendor VARCHAR(255),
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
        
        await client.query(createSiteTableQuery);
        
        // Insert into site table
        const insertSiteQuery = `
          INSERT INTO ${originalSiteTable} (
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
            vendor,
            status,
            created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *
        `;
        
        const siteValues = [
          site_name,
          ...values.slice(1, 5),
          ...values.slice(5, 12),
          mainResult.rows[0].status || 'active',
          mainResult.rows[0].created_at || new Date()
        ];
        
        const siteResult = await client.query(insertSiteQuery, siteValues);
        console.log('Device inserted into new site table:', siteResult.rows[0]);
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    res.status(200).json({
      success: true,
      message: 'Device updated successfully',
      device: mainResult.rows[0]
    });
  } catch (error) {
    // Rollback transaction on error
    if (client) {
      await client.query('ROLLBACK').catch(err => 
        console.error('Error during rollback:', err)
      );
    }
    
    console.error('Error updating device:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating device',
      error: error.message 
    });
  } finally {
    if (client) {
      try {
        await client.release();
      } catch (releaseError) {
        console.error('Error releasing client:', releaseError);
      }
    }
  }
});

// Delete a device
router.delete('/:id', async (req, res) => {
  let client;
  try {
    const { id } = req.params;
    
    client = await pool.connect();
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Check if device exists in main table
    const checkQuery = `SELECT * FROM device_inventory WHERE id = $1`;
    const checkResult = await client.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    const device = checkResult.rows[0];
    console.log('Found device to delete:', device);
    
    // Delete from main device_inventory table
    const deleteMainQuery = `DELETE FROM device_inventory WHERE id = $1 RETURNING *`;
    const mainResult = await client.query(deleteMainQuery, [id]);
    console.log('Device deleted from main table');
    
    // Check if site-specific table exists
    const formattedSiteName = device.site_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const siteTableName = `${formattedSiteName}_device_inventory`;
    
    const checkSiteTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      );
    `;
    
    const siteTableExists = await client.query(checkSiteTableQuery, [siteTableName]);
    
    if (siteTableExists.rows[0].exists) {
      // Delete from site-specific table by serial number
      const deleteSiteQuery = `DELETE FROM ${siteTableName} WHERE serial_number = $1 RETURNING *`;
      const siteResult = await client.query(deleteSiteQuery, [device.serial_number]);
      
      if (siteResult.rows.length > 0) {
        console.log('Device deleted from site table');
      } else {
        console.log('Device not found in site table, continuing');
      }
    } else {
      console.log(`Site table ${siteTableName} does not exist, skipping site deletion`);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    res.status(200).json({
      success: true,
      message: 'Device deleted successfully',
      device: mainResult.rows[0]
    });
  } catch (error) {
    // Rollback transaction on error
    if (client) {
      await client.query('ROLLBACK').catch(err => 
        console.error('Error during rollback:', err)
      );
    }
    
    console.error('Error deleting device:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting device',
      error: error.message 
    });
  } finally {
    if (client) {
      try {
        await client.release();
      } catch (releaseError) {
        console.error('Error releasing client:', releaseError);
      }
    }
  }
});

module.exports = router; 