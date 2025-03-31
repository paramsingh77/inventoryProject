const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const deviceInventoryRoutes = require('./routes/deviceInventory');
const csvRoutes = require('./routes/csv.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const socketInit = require('./socket');
const path = require('path');
const vendorRoutes = require('./routes/vendor.routes');
const productRoutes = require('./routes/product.routes');
const sitesRoutes = require('./routes/sites.routes');
const emailProcessorRoutes = require('./routes/email-processor.routes');
const usersRoutes = require('./routes/users.routes');
const nodemailer = require('nodemailer');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const session = require('express-session');

// Other required modules
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  path: '/socket.io'
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, 
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

// Apply rate limiting to auth routes
app.use('/api/auth', authLimiter);

// Update CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'development' 
    ? ['http://localhost:3000', 'http://localhost:5173']
    : process.env.FRONTEND_URL || true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware for parsing request body
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files serving
app.use(express.static(path.join(__dirname, 'public')));

// OTP functionality
const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000); // Generate a 4-digit OTP
};

// Update the nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  debug: true, // Add for troubleshooting
  logger: true // Add for troubleshooting
});

// Add a verification step to check the connection
transporter.verify(function(error, success) {
  if (error) {
    console.log('Nodemailer verification error:', error);
  } else {
    console.log('Server is ready to send emails');
  }
});

// Add this middleware after other middleware but before routes
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Fix the OTP route to handle errors properly
app.post('/api/send-otp', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  const otp = generateOtp();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}`
  };

  // Send OTP email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Email sending error:', error);
      return res.status(500).json({ error: 'Error sending OTP email' });
    }

    // Instead of using session, use a temporary storage for demo
    // You should use a proper database in production
    const otpData = { otp, email, timestamp: Date.now() };
    // Store in global OTP map with 10 minute expiry
    if (!global.otpMap) global.otpMap = new Map();
    global.otpMap.set(email, otpData);
    
    return res.status(200).json({ message: 'OTP sent successfully' });
  });
});

// Fix the verify OTP route
app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  
  console.log("Verifying OTP:", otp, "for email:", email);
  console.log("OTP Map:", [...(global.otpMap || new Map())].map(([key, value]) => 
    ({ email: key, storedOtp: value.otp, time: new Date(value.timestamp) })));
  
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }
  
  // Get stored OTP data
  if (!global.otpMap || !global.otpMap.has(email)) {
    return res.status(400).json({ error: 'No OTP found for this email' });
  }
  
  const otpData = global.otpMap.get(email);
  console.log("Stored OTP data:", otpData);
  
  // Check if OTP is expired (10 minutes)
  if (Date.now() - otpData.timestamp > 10 * 60 * 1000) {
    global.otpMap.delete(email);
    return res.status(400).json({ error: 'OTP expired' });
  }
  
  // Convert both to strings before comparison to avoid type issues
  if (otpData.otp.toString() === otp.toString()) {
    // OTP verified, clean up
    global.otpMap.delete(email);
    return res.status(200).json({ message: 'OTP verified successfully' });
  } else {
    return res.status(400).json({ 
      error: 'Invalid OTP',
      expected: otpData.otp.toString(),
      received: otp.toString()
    });
  }
});

// Initialize socket.io
socketInit.init(io);
module.exports.io = io;

// Use other routes (existing)
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/sites', sitesRoutes);
app.use('/api', vendorRoutes);
app.use('/api/devices', deviceInventoryRoutes);
app.use('/api/csv', csvRoutes);
app.use('/api', invoiceRoutes);
app.use('/api', require('./routes/purchase-order.routes'));
app.use('/api', require('./routes/supplier.routes'));
app.use('/api', productRoutes);
app.use('/api', emailProcessorRoutes);
app.use('/api/users', require('./routes/users.routes'));

// Additional routes as per the previous structure
// ...

// Start the server
const startServer = async () => {
  try {
    console.log("Creating database pool with URL:", process.env.DATABASE_URL);
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    console.log("Database pool created successfully");

    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
    httpServer.listen(process.env.PORT || 2000, () => {
      console.log(`Server running on port ${process.env.PORT || 2000}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});
