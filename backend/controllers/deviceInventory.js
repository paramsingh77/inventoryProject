const { Pool } = require('pg');
require('dotenv').config();
const csv = require('csv-parse');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const pool = require('../config/database');

// Helper function to parse dates
const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
};

// Helper function to parse MAC addresses
const parseMacAddresses = (macStr) => {
    if (!macStr) return [];
    return macStr.split(',')
        .map(mac => mac.trim())
        .filter(mac => mac.length > 0);
};

// Function to determine device type from device model
const determineDeviceType = (deviceModel) => {
    if (!deviceModel) return 'Unknown';
    
    const model = deviceModel.toLowerCase();
    
    // Dell models
    if (model.includes('optiplex micro') || model.includes('micro')) {
        return 'Desktop (Micro Form Factor)';
    }
    if (model.includes('optiplex') && !model.includes('micro')) {
        return 'Desktop (SFF/Tower)';
    }
    if (model.includes('latitude')) {
        return 'Laptop';
    }
    if (model.includes('inspiron') && (model.includes('15') || model.includes('16'))) {
        return 'Laptop';
    }
    if (model.includes('vostro')) {
        return 'Laptop';
    }
    if (model.includes('xps') && model.includes('89')) {
        return 'Desktop (Tower)';
    }
    if (model.includes('poweredge')) {
        return 'Server';
    }
    
    // HP models
    if (model.includes('compaq') && (model.includes('elite') || model.includes('pro'))) {
        return 'Desktop (Small Form Factor)';
    }
    if (model.includes('probook') || model.includes('elitebook')) {
        return 'Laptop';
    }
    if (model.includes('pro') && model.includes('tower')) {
        return 'Desktop (Tower)';
    }
    if (model.includes('prodesk')) {
        return 'Desktop (Small Form Factor)';
    }
    if (model.includes('all-in-one') || model.includes('aio')) {
        return 'All-in-One';
    }
    if (model.includes('laptop')) {
        return 'Laptop';
    }
    
    // Lenovo models
    if (model.includes('thinkpad') || model.includes('20tds')) {
        return 'Laptop';
    }
    if (model.includes('thinkcentre') || model.includes('12e3')) {
        return 'Desktop';
    }
    
    // Virtual machines
    if (model.includes('vmware') || model.includes('virtual platform')) {
        return 'Virtual Machine';
    }
    
    // If it contains "laptop" in the model name
    if (model.includes('laptop')) {
        return 'Laptop';
    }
    
    // Custom or unknown systems
    if (model.includes('stealth')) {
        return 'Unknown / Custom-Built';
    }
    
    return 'Unknown';
};

// Main function to import CSV data
const importDeviceData = async (file) => {
    if (!file || !file.path) {
        throw new Error('Invalid file object provided');
    }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // First ensure the table exists
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS device_inventory (
                id SERIAL PRIMARY KEY,
                site_name VARCHAR(255),
                device_hostname VARCHAR(255) UNIQUE,
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

        console.log('Ensuring device_inventory table exists...');
        await client.query(createTableQuery);
        console.log('Table check/creation complete');

        console.log('Reading file:', file.path);
        const fileContent = fs.readFileSync(file.path, 'utf-8');
        console.log('File content length:', fileContent.length);
        console.log('First 200 characters of file:', fileContent.substring(0, 200));

        if (!fileContent || fileContent.trim().length === 0) {
            throw new Error('File is empty or contains no valid content');
        }

        // Parse CSV data
        const records = await new Promise((resolve, reject) => {
            parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                cast: true,
                cast_date: true,
                relax_column_count: true,
                relax_quotes: true,
                skip_records_with_empty_values: true
            }, (err, records) => {
                if (err) {
                    console.error('CSV parsing error:', err);
                    reject(new Error(`Failed to parse CSV: ${err.message}`));
                } else if (!records || records.length === 0) {
                    reject(new Error('No valid records found in CSV'));
                } else {
                    console.log('CSV parsing successful. Found records:', records.length);
                    console.log('First record example:', JSON.stringify(records[0], null, 2));
                    resolve(records);
                }
            });
        });

        console.log(`Found ${records.length} records to import`);

        // Prepare query
        const insertQuery = `
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
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (device_hostname) 
            DO UPDATE SET
                site_name = EXCLUDED.site_name,
                device_description = EXCLUDED.device_description,
                last_user = EXCLUDED.last_user,
                last_seen = EXCLUDED.last_seen,
                device_type = EXCLUDED.device_type,
                device_model = EXCLUDED.device_model,
                operating_system = EXCLUDED.operating_system,
                serial_number = EXCLUDED.serial_number,
                device_cpu = EXCLUDED.device_cpu,
                mac_addresses = EXCLUDED.mac_addresses,
                vendor = EXCLUDED.vendor,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // Insert each record
        for (const record of records) {
            try {
                console.log('Processing record:', JSON.stringify(record, null, 2));

                // Determine device type from model
                const deviceModel = record['Device Model'] || record['device_model'] || '';
                console.log('Device model:', deviceModel);
                const detectedDeviceType = determineDeviceType(deviceModel);
                console.log('Detected device type:', detectedDeviceType);
                
                // Extract vendor from device model
                const vendor = deviceModel ? 
                    deviceModel.split(' ')[0].replace(/[^a-zA-Z]/g, '') : 
                    'Unknown';
                console.log('Extracted vendor:', vendor);

                // Check required fields
                if (!record['Device Hostname'] && !record['device_hostname']) {
                    throw new Error('Device hostname is required');
                }
                
                const values = [
                    record['Site Name'] || record['site_name'] || '',
                    record['Device Hostname'] || record['device_hostname'] || '',
                    record['Device Description'] || record['device_description'] || '',
                    record['Last User'] || record['last_user'] || '',
                    parseDate(record['Last Seen'] || record['last_seen']),
                    detectedDeviceType,
                    deviceModel,
                    record['Operating System'] || record['operating_system'] || '',
                    record['Serial Number'] || record['serial_number'] || '',
                    record['Device CPU'] || record['device_cpu'] || '',
                    parseMacAddresses(record['MAC Address(es)'] || record['mac_addresses'] || ''),
                    vendor
                ];

                console.log('Inserting values:', JSON.stringify(values, null, 2));
                
                try {
                    const result = await client.query(insertQuery, values);
                    console.log('Insert result:', result.rows[0]);
                    successCount++;
                } catch (dbError) {
                    console.error('Database error:', dbError);
                    throw new Error(`Database error: ${dbError.message}`);
                }
            } catch (recordError) {
                console.error('Error importing record:', recordError);
                errorCount++;
                errors.push(`Error importing record: ${recordError.message}`);
            }
        }

        if (successCount === 0) {
            throw new Error('Failed to import any records successfully');
        }

        await client.query('COMMIT');
        return { 
            success: true, 
            message: `Successfully imported ${successCount} devices`,
            details: {
                total: records.length,
                successful: successCount,
                failed: errorCount,
                errors: errors
            }
        };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error importing device data:', error);
        throw new Error(`Failed to import device data: ${error.message}`);
    } finally {
        client.release();
    }
};

// Function to get all devices with filtering and pagination
const getDevices = async ({ 
    page = 1, 
    limit = 50, 
    sortBy = 'device_hostname', 
    sortOrder = 'ASC',
    filters = {} 
}) => {
    const client = await pool.connect();
    try {
        // First ensure the table exists
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS device_inventory (
                id SERIAL PRIMARY KEY,
                site_name VARCHAR(255),
                device_hostname VARCHAR(255) UNIQUE,
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

        console.log('Ensuring device_inventory table exists...');
        await client.query(createTableQuery);
        console.log('Table check/creation complete');

        const offset = (page - 1) * limit;
        let queryParams = [limit, offset];
        let filterConditions = [];
        let paramIndex = 3;

        // Build filter conditions
        if (filters.siteName) {
            filterConditions.push(`site_name ILIKE $${paramIndex}`);
            queryParams.push(`%${filters.siteName}%`);
            paramIndex++;
        }

        if (filters.deviceType) {
            filterConditions.push(`device_type = $${paramIndex}`);
            queryParams.push(filters.deviceType);
            paramIndex++;
        }

        if (filters.vendor) {
            filterConditions.push(`vendor ILIKE $${paramIndex}`);
            queryParams.push(`%${filters.vendor}%`);
            paramIndex++;
        }

        if (filters.status) {
            if (filters.status === 'online') {
                filterConditions.push(`last_seen > NOW() - INTERVAL '5 minutes'`);
            } else if (filters.status === 'offline') {
                filterConditions.push(`(last_seen <= NOW() - INTERVAL '5 minutes' OR last_seen IS NULL)`);
            }
        }

        const whereClause = filterConditions.length 
            ? 'WHERE ' + filterConditions.join(' AND ')
            : '';

        const queryText = `
            SELECT *,
                   CASE 
                       WHEN last_seen > NOW() - INTERVAL '5 minutes' THEN 'online'
                       ELSE 'offline'
                   END as connection_status
            FROM device_inventory
            ${whereClause}
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT $1 OFFSET $2
        `;

        console.log('Executing query:', queryText);
        console.log('With parameters:', queryParams);

        const [data, count] = await Promise.all([
            client.query(queryText, queryParams),
            client.query(`SELECT COUNT(*) FROM device_inventory ${whereClause}`, 
                filterConditions.length ? queryParams.slice(2) : [])
        ]);

        console.log(`Found ${data.rows.length} devices`);

        return {
            devices: data.rows,
            total: parseInt(count.rows[0].count),
            totalPages: Math.ceil(parseInt(count.rows[0].count) / limit),
            currentPage: page
        };

    } catch (error) {
        console.error('Error fetching devices:', error);
        throw new Error(`Failed to fetch devices: ${error.message}`);
    } finally {
        client.release();
    }
};

/**
 * Process a batch of records
 * @param {Array} batch - Array of records to process
 * @param {Array} results - Array to store successful results
 * @param {Array} errors - Array to store errors
 */
const processBatch = async (batch, results, errors) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        for (const record of batch) {
            // Get device type based on device model
            const deviceModel = record.device_model || '';
            const detectedDeviceType = determineDeviceType(deviceModel);
            
            const query = {
                text: `INSERT INTO device_inventory (
                    site_name, device_hostname, device_description, last_user,
                    last_seen, device_type, device_model, operating_system,
                    serial_number, device_cpu, mac_addresses, status, vendor
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (device_hostname) DO UPDATE SET
                    site_name = EXCLUDED.site_name,
                    device_description = EXCLUDED.device_description,
                    last_user = EXCLUDED.last_user,
                    last_seen = EXCLUDED.last_seen,
                    device_type = EXCLUDED.device_type,
                    device_model = EXCLUDED.device_model,
                    operating_system = EXCLUDED.operating_system,
                    serial_number = EXCLUDED.serial_number,
                    device_cpu = EXCLUDED.device_cpu,
                    mac_addresses = EXCLUDED.mac_addresses,
                    status = EXCLUDED.status,
                    vendor = EXCLUDED.vendor
                RETURNING *`,
                values: [
                    record.site_name || null,
                    record.device_hostname || null,
                    record.device_description || null,
                    record.last_user || null,
                    record.last_seen || null,
                    detectedDeviceType || record.device_type || null,
                    record.device_model || null,
                    record.operating_system || null,
                    record.serial_number || null,
                    record.device_cpu || null,
                    record.mac_addresses || [],
                    record.status || 'active',
                    record.vendor || null
                ]
            };

            const result = await client.query(query);
            results.push(result.rows[0]);
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        errors.push(`Error inserting batch: ${error.message}`);
    } finally {
        client.release();
    }
};

module.exports = {
    importDeviceData,
    getDevices
}; 