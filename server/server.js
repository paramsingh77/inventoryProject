// Load environment variables if not in production
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());

// Log database connection info
console.log('Database connection:', process.env.DATABASE_URL ? 'Using DATABASE_URL from environment' : 'Using local database config');

// Define API routes with the /api prefix
app.use('/api/auth', require('../backend/routes/auth.routes'));
app.use('/api/users', require('../backend/routes/users.routes'));
app.use('/api/sites', require('../backend/routes/sites.routes'));
app.use('/api/inventory', require('../backend/routes/inventory.routes'));

// Start server
const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 