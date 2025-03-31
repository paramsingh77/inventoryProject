const fileUpload = require('express-fileupload');
const express = require('express');
const cors = require('cors');
const PORT = process.env.PORT || 2000;

// Import the email scheduler
const emailCheckScheduler = require('./services/emailCheckScheduler');

// Import routes
const trackingRoutes = require('./routes/tracking.routes');
const emailProcessingRoutes = require('./routes/email-processing.routes');

// Import socket utility
const socketUtils = require('./socket');

// Import user routes
const userRoutes = require('./routes/user.routes');

// Initialize your Express app
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// File upload middleware
app.use(fileUpload({
    createParentPath: true,
    limits: { 
        fileSize: 10 * 1024 * 1024 // 10MB max file size
    },
}));

// Check if vendor routes are properly registered
const supplierRoutes = require('./routes/supplier.routes.js');
app.use('/api/suppliers', supplierRoutes);

// Add these middleware registrations after creating the app
app.use(express.urlencoded({ extended: true }));

// Use the routes
app.use('/api', trackingRoutes);
app.use('/api/email', emailProcessingRoutes);

// Mount routes
app.use('/api/purchase-orders', require('./routes/purchase-orders.routes.js'));

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Add this to your existing app.js
const invoiceRoutes = require('./routes/invoice.routes');
app.use('/api', invoiceRoutes);

// Also add the email scanner service
// const emailInvoiceScanner = require('./services/emailInvoiceScanner');
// const invoiceScannerService = emailInvoiceScanner.startEmailScanner();

// Add device routes - make sure this is BEFORE any catch-all routes
const deviceRoutes = require('./routes/device.routes');
app.use('/api/devices', deviceRoutes);

// Add this for debugging
app.use((req, res, next) => {
  console.log('Request URL:', req.method, req.url);
  next();
});

// Add this after mounting all routes
console.log('Registered routes:');
app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log(r.route.stack[0].method.toUpperCase() + ' ' + r.route.path);
  }
});

// Add user routes
app.use('/api/users', require('./routes/user.routes'));

// Add site routes
const sitesRoutes = require('./routes/sites.routes.js');
app.use('/api/sites', sitesRoutes);

// Add a simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize socket.io
  const io = socketUtils.init(server);
  
  // Start the email check scheduler with error handling
  try {
    emailCheckScheduler.start();
    console.log('Email check scheduler started successfully');
  } catch (error) {
    console.error('Failed to start email check scheduler:', error);
    console.log('Email functionality may be limited');
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  try {
    emailCheckScheduler.stop();
    console.log('Email check scheduler stopped');
  } catch (error) {
    console.error('Error stopping email check scheduler:', error);
  }
  
  server.close(() => {
    console.log('Process terminated');
  });
});

// Add global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  
  // Don't crash the server for IMAP errors
  if (error.message && (
      error.message.includes('IMAP') || 
      error.stack.includes('imap/lib/Connection') ||
      error.stack.includes('imap/lib/Parser')
  )) {
    console.warn('IMAP error caught, continuing execution');
  } else {
    // For other errors, you might want to exit
    // process.exit(1);
    console.error('Serious error, but continuing execution');
  }
});

module.exports = app; 