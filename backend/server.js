const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initializeSchema, checkSchema } = require('./database/schema');
const { createServer } = require('http');
const { Server } = require('socket.io');
const deviceInventoryRoutes = require('./routes/deviceInventory');
const csvRoutes = require('./routes/csv.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const path = require('path');
require('dotenv').config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Export io for use in other modules
module.exports.io = io;

// Security middleware
app.use(helmet());

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Apply rate limiting to auth routes
app.use('/api/auth', authLimiter);

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Allow from both localhost and 127.0.0.1
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 3600
};

// Apply CORS first, before other middleware
app.use(cors(corsOptions));

// Handle preflight separately to ensure it works
app.options('*', cors(corsOptions));

// Middleware for parsing request body
app.use(express.json({limit: '50mb'})); // Increase size limit
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Increase size limit

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/sites', require('./routes/sites.routes'));
app.use('/api/devices', deviceInventoryRoutes);
app.use('/api/csv', csvRoutes);
app.use('/api', invoiceRoutes);

// Import and use mock email routes for development testing
const mockEmailRoutes = require('./routes/mock-email.routes');
app.use('/api', mockEmailRoutes);

// Add a console message to indicate the mock email service is available
console.log('\n📧 Mock Email Service enabled');
console.log('📝 Available mock endpoints:');
console.log('  - POST /api/mock/email/send-po');
console.log('  - POST /api/mock/email/send-po-with-file');
console.log('  - GET  /api/mock/email/check');
console.log('  - GET  /api/mock/invoices');
console.log('  - GET  /api/mock/invoices/:invoiceId');
console.log('  - POST /api/mock/invoices/:invoiceId/link\n');
console.log('🔄 Test with: http://localhost:2000/api/mock/health\n');

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Start the server first, before attempting database initialization
    const PORT = process.env.PORT || 2000;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log('📧 Email functionality is available even without database');
    });

    // Try to initialize database schema, but don't let failure stop the server
    try {
      // Initialize database schema
      await initializeSchema();
      
      // Check if schema is properly initialized
      const schemaStatus = await checkSchema();
      console.log('✅ Schema status:', schemaStatus);
    } catch (dbError) {
      console.error('⚠️ Database connection failed:', dbError.message);
      console.warn('⚠️ Running in limited mode - some features will not work');
      console.log('✅ Email functionality is still available');
    }
    
    // Start email checker service if enabled
    if (process.env.ENABLE_EMAIL_CHECKER === 'true') {
      try {
        const { startEmailChecker } = require('./utils/emailChecker');
        startEmailChecker();
        console.log('✅ Email checker service started');
      } catch (emailError) {
        console.error('❌ Failed to start email checker:', emailError.message);
        console.log('⚠️ Email checking is disabled');
      }
    } else {
      console.log('ℹ️ Email checker is disabled in .env');
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Export app for testing
module.exports.app = app; 