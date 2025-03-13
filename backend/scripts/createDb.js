require('dotenv').config();
const { Client } = require('pg');
const { parse } = require('pg-connection-string');

async function checkDatabaseConnection() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Successfully connected to Railway PostgreSQL database');
        
        // Get database version
        const result = await client.query('SELECT version()');
        console.log('PostgreSQL version:', result.rows[0].version);
        
        process.exit(0);
    } catch (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

checkDatabaseConnection(); 