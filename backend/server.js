const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initializeSchema, checkSchema } = require('./database/schema');
const { createServer } = require('http');
const { Server } = require('socket.io');
const deviceInventoryRoutes = require('./routes/deviceInventory');
const csvRoutes = require('./routes/csv.routes');
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
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/sites', require('./routes/sites.routes'));
app.use('/api/devices', deviceInventoryRoutes);
app.use('/api/csv', csvRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
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
const PORT = process.env.PORT || 2000;

const startServer = async () => {
  try {
    // Check if required environment variables are set
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Initialize database schema
    console.log('Checking database schema...');
    const schemaExists = await checkSchema();
    
    if (!schemaExists) {
      console.log('Schema does not exist, creating...');
      await initializeSchema();
      console.log('Database schema created successfully');
    } else {
      console.log('Database schema already exists');
    }

    // Start the server
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Database connection successful');
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