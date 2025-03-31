const { Pool } = require('pg');
require('dotenv').config();

// Create a new pool using the DATABASE_URL from .env
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Only if you're using Heroku or similar platforms
    }
});

module.exports = pool; 