/**
 * Populate Suppliers from Device Inventory
 * 
 * This script extracts manufacturer information from device_inventory table
 * and creates corresponding entries in the suppliers table.
 */

const db = require('../database/db');
const path = require('path');

// Simple console logger
const logger = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

// Map to extract manufacturer from device model
const extractManufacturer = (deviceModel) => {
  if (!deviceModel) return 'Unknown Manufacturer';
  
  const modelLower = deviceModel.toLowerCase();
  
  if (modelLower.includes('hp') || modelLower.includes('compaq')) {
    return 'HP Inc.';
  } else if (modelLower.includes('optiplex') || 
             modelLower.includes('latitude') || 
             modelLower.includes('inspiron') || 
             modelLower.includes('xps') ||
             modelLower.includes('vostro') ||
             modelLower.includes('poweredge')) {
    return 'Dell Technologies';
  } else if (modelLower.includes('lenovo') || 
             (deviceModel.match && deviceModel.match(/^[0-9]{2}[A-Z]{3}[0-9]{5}$/))) {
    return 'Lenovo Group Limited';
  } else if (modelLower.includes('vmware')) {
    return 'VMware, Inc.';
  } else if (modelLower.includes('stealth')) {
    return 'Stealth Computer';
  } else {
    return 'Unknown Manufacturer';
  }
};

// Generate email domain from company name
const generateEmailDomain = (companyName) => {
  return companyName
    .toLowerCase()
    .replace(/[^\w\s]/gi, '') // Remove special characters
    .replace(/\s+/g, '') // Remove spaces
    .replace(/inc|corporation|technologies|group|limited/gi, '') // Remove common company suffixes
    + '.com';
};

// Main function to populate suppliers
const populateSuppliers = async () => {
  logger('Starting to populate suppliers from device inventory...');
  
  try {
    // Check if pool is available
    if (!db.pool) {
      throw new Error('Database pool is not initialized');
    }
    
    // Test the connection
    logger('Testing database connection...');
    const testResult = await db.safeQuery('SELECT 1 as test');
    logger('Database connection successful');
    
    // First check if the device data has been processed
    logger('Getting unique vendors from device inventory...');
    const vendorResult = await db.safeQuery(
      'SELECT DISTINCT vendor FROM device_inventory WHERE vendor IS NOT NULL AND vendor != \'\'',
      []
    );
    
    if (vendorResult.rows.length === 0) {
      // No vendors found, let's fall back to extracting from device_model
      logger('No vendors found in device_inventory. Extracting from device_model...');
      
      const deviceModelsResult = await db.safeQuery(
        'SELECT DISTINCT device_model FROM device_inventory WHERE device_model IS NOT NULL AND device_model != \'\'',
        []
      );
      
      if (deviceModelsResult.rows.length === 0) {
        logger('No device models found. Exiting.');
        return;
      }
      
      logger(`Found ${deviceModelsResult.rows.length} unique device models`);
      
      // Extract manufacturers from device models
      const manufacturerMap = new Map();
      deviceModelsResult.rows.forEach(row => {
        const manufacturer = extractManufacturer(row.device_model);
        if (!manufacturerMap.has(manufacturer)) {
          manufacturerMap.set(manufacturer, []);
        }
        manufacturerMap.get(manufacturer).push(row.device_model);
      });
      
      const manufacturers = Array.from(manufacturerMap.keys());
      logger(`Extracted ${manufacturers.length} unique manufacturers: ${manufacturers.join(', ')}`);
      
      // Process each manufacturer
      await processManufacturers(manufacturers, Array.from(manufacturerMap.entries()));
    } else {
      // Use the vendors already in the database
      const vendors = vendorResult.rows.map(row => row.vendor);
      logger(`Found ${vendors.length} unique vendors: ${vendors.join(', ')}`);
      
      // Process each vendor
      await processManufacturers(vendors, null);
    }
    
    logger('Finished populating suppliers from device inventory.');
  } catch (error) {
    logger(`Error populating suppliers: ${error.message}`);
    throw error;
  }
};

// Helper function to process manufacturers
const processManufacturers = async (manufacturers, manufacturerEntries) => {
  try {
    // Check which manufacturers already exist in suppliers
    let existingManufacturers = [];
    
    logger('Checking existing suppliers...');
    const existingResult = await db.safeQuery(
      'SELECT name FROM suppliers WHERE name = ANY($1)',
      [manufacturers]
    );
    existingManufacturers = existingResult.rows.map(row => row.name);
    logger(`Existing manufacturers in suppliers table: ${existingManufacturers.join(', ') || 'none'}`);
    
    // Add new manufacturers to suppliers
    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const manufacturer of manufacturers) {
      try {
        if (existingManufacturers.includes(manufacturer)) {
          logger(`Skipping ${manufacturer} - already exists in suppliers`);
          skippedCount++;
          continue;
        }
        
        // Get device models for this manufacturer (if available)
        const models = manufacturerEntries ? 
          manufacturerEntries.find(entry => entry[0] === manufacturer)?.[1] || [] : 
          ['Unknown model'];
        
        // Prepare supplier data
        const emailDomain = generateEmailDomain(manufacturer);
        const supplierData = {
          name: manufacturer,
          contact_person: 'Sales Department',
          email: `sales@${emailDomain}`,
          phone: '',
          address: '',
          website: `https://www.${emailDomain}`,
          tax_id: '',
          payment_terms: 'Net 30',
          status: 'active',
          notes: `Auto-populated from device inventory. Products: ${models.join(', ')}`,
          category: 'hardware',
          rating: null,
          last_order_date: null
        };
        
        logger(`Adding supplier: ${manufacturer}`);
        
        // Insert into suppliers table
        const result = await db.safeQuery(
          `INSERT INTO suppliers (
            name, 
            contact_person, 
            email, 
            phone, 
            address, 
            website, 
            tax_id, 
            payment_terms,
            status,
            notes,
            category,
            rating,
            last_order_date,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id`,
          [
            supplierData.name,
            supplierData.contact_person,
            supplierData.email,
            supplierData.phone,
            supplierData.address,
            supplierData.website,
            supplierData.tax_id,
            supplierData.payment_terms,
            supplierData.status,
            supplierData.notes,
            supplierData.category,
            supplierData.rating,
            supplierData.last_order_date
          ]
        );
        
        logger(`Added supplier ${manufacturer} with ID ${result.rows[0].id}`);
        addedCount++;
      } catch (error) {
        logger(`Error adding supplier ${manufacturer}: ${error.message}`);
        errorCount++;
      }
    }
    
    logger(`Results: ${addedCount} added, ${skippedCount} skipped, ${errorCount} errors`);
  } catch (error) {
    logger(`Error processing manufacturers: ${error.message}`);
    throw error;
  }
};

// Export the function
module.exports = populateSuppliers; 