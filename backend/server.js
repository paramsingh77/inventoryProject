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
const { startEmailChecker } = require('./utils/emailChecker');
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
    // Initialize database schema
    await initializeSchema();
    
    // Check schema integrity
    await checkSchema();
    
    // Start email checker service
    startEmailChecker();
    
    // Get port from environment or use default
    const PORT = process.env.PORT || 5000;
    
    // Start the server
    httpServer.listen(PORT, () => {
      console.log('\x1b[32m%s\x1b[0m', '✅ Server started successfully!');
      console.log('\x1b[36m%s\x1b[0m', `🚀 Server running on port: ${PORT}`);
      console.log('\x1b[36m%s\x1b[0m', `📡 API available at: http://localhost:${PORT}/api`);
      console.log('\x1b[33m%s\x1b[0m', '⚠️ Make sure your frontend is configured to connect to this URL');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Start the server
startServer(); 