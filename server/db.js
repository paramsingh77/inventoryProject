const { Pool } = require('pg');
const config = require('./config');

// Create a new pool using the DATABASE_URL from Railway.app if available
const pool = process.env.DATABASE_URL 
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // Required for Railway.app PostgreSQL
      }
    })
  : new Pool({
      user: config.dbUser,
      host: config.dbHost,
      database: config.dbName,
      password: config.dbPassword,
      port: config.dbPort,
    });

module.exports = {
  query: (text, params) => pool.query(text, params),
}; 