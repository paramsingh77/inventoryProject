const { Pool } = require('pg');
require('dotenv').config();
const csv = require('csv-parse');
const fs = require('fs');
const path = require('path');

// Create a new pool using the DATABASE_URL from .env
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Only if you're using Heroku or similar platforms
    }
});

// Function to parse MAC addresses from string
const parseMacAddresses = (macString) => {
    if (!macString) return [];
    return macString
        .replace(/[\[\]"]/g, '')
        .split(',')
        .map(mac => mac.trim())
        .filter(mac => mac);
};

// Function to parse date with "Currently Online" handling
const parseDate = (dateString) => {
    if (dateString === 'Currently Online') {
        return new Date();
    }
    return new Date(dateString);
};

// Main function to import CSV data
const importDeviceData = async () => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // First, clear existing data (optional)
        await client.query('TRUNCATE TABLE device_inventory RESTART IDENTITY CASCADE');

        // Read and parse CSV file
        const csvFilePath = path.join(__dirname, '../files/aam.csv');
        const fileContent = fs.readFileSync(csvFilePath, 'utf-8');

        // Parse CSV data
        const records = await new Promise((resolve, reject) => {
            csv.parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            }, (err, records) => {
                if (err) reject(err);
                else resolve(records);
            });
        });

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
                mac_addresses
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;

        // Insert each record
        for (const record of records) {
            const values = [
                record['Site Name'],
                record['Device Hostname'],
                record['Device Description'],
                record['Last User'],
                parseDate(record['Last Seen']),
                record['Device Type'] || null,
                record['Device Model'],
                record['Operating System'],
                record['Serial Number'],
                record['Device CPU'],
                parseMacAddresses(record['MAC Address(es)'])
            ];

            await client.query(insertQuery, values);
        }

        await client.query('COMMIT');
        return { success: true, message: `Successfully imported ${records.length} devices` };

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

        if (filters.status) {
            filterConditions.push(`last_seen ${filters.status === 'online' ? '>' : '<='} NOW() - INTERVAL '5 minutes'`);
        }

        const whereClause = filterConditions.length 
            ? 'WHERE ' + filterConditions.join(' AND ')
            : '';

        const queryText = `
            SELECT *,
                   CASE 
                       WHEN last_seen > NOW() - INTERVAL '5 minutes' THEN 'online'
                       ELSE 'offline'
                   END as status
            FROM device_inventory
            ${whereClause}
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT $1 OFFSET $2
        `;

        const [data, count] = await Promise.all([
            client.query(queryText, queryParams),
            client.query(`SELECT COUNT(*) FROM device_inventory ${whereClause}`, 
                filterConditions.length ? queryParams.slice(2) : [])
        ]);

        return {
            devices: data.rows,
            total: parseInt(count.rows[0].count),
            totalPages: Math.ceil(parseInt(count.rows[0].count) / limit),
            currentPage: page
        };

    } finally {
        client.release();
    }
};

module.exports = {
    importDeviceData,
    getDevices
}; 