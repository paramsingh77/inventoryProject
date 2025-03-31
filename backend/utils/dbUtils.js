const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const config = require('../config/db.config');

// Create a connection pool
const pool = new Pool(config);

// Set up logging
const LOG_DIR = path.join(__dirname, '../logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Simple date formatter to replace date-fns
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Executes a database query with enhanced logging and security features
 * 
 * @param {string} query - The SQL query to execute
 * @param {Array} params - Array of parameters for the query
 * @param {Object} options - Additional options for query execution
 * @param {string} options.source - Source of the query for logging (e.g., 'orders', 'inventory')
 * @param {boolean} options.logQuery - Whether to log the query (default: true)
 * @param {boolean} options.logResults - Whether to log query results (default: false)
 * @param {boolean} options.useTransaction - Whether to use a transaction (default: false)
 * @param {number} options.timeout - Query timeout in milliseconds (default: 30000)
 * @returns {Promise<Object>} - Query results
 */
async function executeQuery(query, params = [], options = {}) {
  const {
    source = 'unknown',
    logQuery = true,
    logResults = false,
    useTransaction = false,
    timeout = 30000
  } = options;

  const client = await pool.connect();
  const startTime = Date.now();
  const queryId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  
  let result;
  let error = null;
  let inTransaction = false;

  try {
    // Set statement timeout
    await client.query(`SET statement_timeout = ${timeout}`);
    
    // Start transaction if requested
    if (useTransaction) {
      await client.query('BEGIN');
      inTransaction = true;
    }
    
    // Execute the query
    result = await client.query(query, params);
    
    // Commit transaction if active
    if (inTransaction) {
      await client.query('COMMIT');
    }
    
    // Log query execution
    if (logQuery) {
      logQueryExecution(queryId, query, params, source, Date.now() - startTime);
    }
    
    // Log query results if requested
    if (logResults && result.rows) {
      logQueryResults(queryId, result.rows.length, source);
    }
    
    return result;
  } catch (err) {
    // Roll back transaction on error
    if (inTransaction) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error('Error during rollback:', rollbackErr);
      }
    }
    
    // Log the error
    error = err;
    logQueryError(queryId, query, params, source, err);
    throw err;
  } finally {
    // Release the client back to the pool
    client.release();
    
    // Calculate execution time
    const execTime = Date.now() - startTime;
    
    // Log performance issues
    if (execTime > 1000 && !error) {
      logSlowQuery(queryId, query, params, source, execTime);
    }
  }
}

/**
 * Executes a query for a specific site table
 * 
 * @param {string} siteName - The name of the site
 * @param {string} tableType - Type of table (device_inventory, purchase_orders, etc)
 * @param {string} operation - SQL operation type (SELECT, INSERT, UPDATE, DELETE)
 * @param {Object} options - Query options
 * @param {Array} options.fields - Fields to select (for SELECT queries)
 * @param {Object} options.where - Where conditions as {field: value} pairs
 * @param {Object} options.data - Data to insert/update as {field: value} pairs
 * @param {Array} options.order - Order by fields and direction [field, direction]
 * @param {number} options.limit - Result limit
 * @param {number} options.offset - Result offset
 * @returns {Promise<Object>} - Query results
 */
async function executeSiteTableQuery(siteName, tableType, operation, options = {}) {
  const {
    fields = ['*'],
    where = {},
    data = {},
    order = null,
    limit = null,
    offset = null
  } = options;
  
  // Sanitize site name for table construction
  const safeTableName = siteName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const fullTableName = `${safeTableName}_${tableType}`;
  
  // Build the query based on operation type
  let query;
  let params = [];
  let paramIndex = 1;
  
  switch (operation.toUpperCase()) {
    case 'SELECT':
      query = `SELECT ${fields.join(', ')} FROM ${fullTableName}`;
      
      // Add WHERE conditions if any
      if (Object.keys(where).length > 0) {
        query += ' WHERE ';
        const conditions = [];
        
        Object.entries(where).forEach(([field, value]) => {
          if (value === null) {
            conditions.push(`${field} IS NULL`);
          } else {
            conditions.push(`${field} = $${paramIndex++}`);
            params.push(value);
          }
        });
        
        query += conditions.join(' AND ');
      }
      
      // Add ORDER BY if specified
      if (order) {
        query += ` ORDER BY ${order[0]} ${order[1] || 'ASC'}`;
      }
      
      // Add LIMIT and OFFSET if specified
      if (limit !== null) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(limit);
      }
      
      if (offset !== null) {
        query += ` OFFSET $${paramIndex++}`;
        params.push(offset);
      }
      break;
      
    case 'INSERT':
      const fields = Object.keys(data);
      const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
      
      query = `INSERT INTO ${fullTableName} (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`;
      params = Object.values(data);
      break;
      
    case 'UPDATE':
      query = `UPDATE ${fullTableName} SET `;
      
      // Add SET values
      const setStatements = Object.entries(data).map(([field, value]) => {
        params.push(value);
        return `${field} = $${paramIndex++}`;
      });
      
      query += setStatements.join(', ');
      
      // Add WHERE conditions
      if (Object.keys(where).length > 0) {
        query += ' WHERE ';
        const conditions = [];
        
        Object.entries(where).forEach(([field, value]) => {
          if (value === null) {
            conditions.push(`${field} IS NULL`);
          } else {
            conditions.push(`${field} = $${paramIndex++}`);
            params.push(value);
          }
        });
        
        query += conditions.join(' AND ');
      }
      
      query += ' RETURNING *';
      break;
      
    case 'DELETE':
      query = `DELETE FROM ${fullTableName}`;
      
      // Add WHERE conditions
      if (Object.keys(where).length > 0) {
        query += ' WHERE ';
        const conditions = [];
        
        Object.entries(where).forEach(([field, value]) => {
          if (value === null) {
            conditions.push(`${field} IS NULL`);
          } else {
            conditions.push(`${field} = $${paramIndex++}`);
            params.push(value);
          }
        });
        
        query += conditions.join(' AND ');
      }
      
      query += ' RETURNING *';
      break;
      
    default:
      throw new Error(`Unsupported operation: ${operation}`);
  }
  
  return executeQuery(query, params, {
    source: `site-${siteName}-${tableType}`,
    useTransaction: ['INSERT', 'UPDATE', 'DELETE'].includes(operation.toUpperCase())
  });
}

/**
 * Checks if a site table exists
 * 
 * @param {string} siteName - Site name
 * @param {string} tableType - Table type
 * @returns {Promise<boolean>} - Whether the table exists
 */
async function checkSiteTableExists(siteName, tableType) {
  const safeTableName = siteName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const fullTableName = `${safeTableName}_${tableType}`;
  
  const query = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    )
  `;
  
  const result = await executeQuery(query, [fullTableName], {
    source: 'table-check',
    logQuery: false
  });
  
  return result.rows[0].exists;
}

/**
 * Executes a query across multiple site tables and combines the results
 * 
 * @param {Array} siteNames - Array of site names
 * @param {string} tableType - Type of table
 * @param {string} operation - SQL operation
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Combined query results
 */
async function executeMultiSiteQuery(siteNames, tableType, operation, options = {}) {
  const results = {
    rows: [],
    rowCount: 0,
    errors: []
  };
  
  // Execute queries for each site in parallel
  const queryPromises = siteNames.map(async (siteName) => {
    try {
      const tableExists = await checkSiteTableExists(siteName, tableType);
      
      if (!tableExists) {
        console.warn(`Table ${siteName}_${tableType} does not exist. Skipping.`);
        return null;
      }
      
      const result = await executeSiteTableQuery(
        siteName,
        tableType,
        operation,
        options
      );
      
      // Add site name to each row for identification
      if (result.rows && operation.toUpperCase() === 'SELECT') {
        result.rows.forEach(row => {
          row.site_name = siteName;
        });
      }
      
      return result;
    } catch (err) {
      results.errors.push({
        site: siteName,
        error: err.message
      });
      return null;
    }
  });
  
  // Wait for all queries to complete
  const siteResults = await Promise.all(queryPromises);
  
  // Combine results
  siteResults.forEach(result => {
    if (result && result.rows) {
      results.rows = results.rows.concat(result.rows);
      results.rowCount += result.rowCount;
    }
  });
  
  return results;
}

// Logging functions
function logQueryExecution(queryId, query, params, source, executionTime) {
  const logFile = path.join(LOG_DIR, `query-${formatDate(new Date())}.log`);
  const timestamp = new Date().toISOString();
  
  const logEntry = {
    id: queryId,
    timestamp,
    source,
    query: query.replace(/\s+/g, ' ').trim(),
    params,
    executionTime
  };
  
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

function logQueryResults(queryId, rowCount, source) {
  const logFile = path.join(LOG_DIR, `results-${formatDate(new Date())}.log`);
  const timestamp = new Date().toISOString();
  
  const logEntry = {
    id: queryId,
    timestamp,
    source,
    rowCount
  };
  
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

function logQueryError(queryId, query, params, source, error) {
  const logFile = path.join(LOG_DIR, `error-${formatDate(new Date())}.log`);
  const timestamp = new Date().toISOString();
  
  const logEntry = {
    id: queryId,
    timestamp,
    source,
    query: query.replace(/\s+/g, ' ').trim(),
    params,
    error: {
      message: error.message,
      code: error.code,
      position: error.position
    }
  };
  
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  console.error(`[DB ERROR] ${source}: ${error.message}`);
}

function logSlowQuery(queryId, query, params, source, executionTime) {
  const logFile = path.join(LOG_DIR, 'slow-queries.log');
  const timestamp = new Date().toISOString();
  
  const logEntry = {
    id: queryId,
    timestamp,
    source,
    query: query.replace(/\s+/g, ' ').trim(),
    params,
    executionTime
  };
  
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  console.warn(`[SLOW QUERY] ${source}: ${executionTime}ms`);
}

module.exports = {
  executeQuery,
  executeSiteTableQuery,
  executeMultiSiteQuery,
  checkSiteTableExists,
  pool
}; 