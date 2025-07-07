require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const session = require('express-session');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');
const { runMigrations } = require('./database/migration');
const socketInit = require('./socket');
const deviceInventoryRoutes = require('./routes/deviceInventory');
const csvRoutes = require('./routes/csv.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const vendorRoutes = require('./routes/vendor.routes');
const productRoutes = require('./routes/product.routes');
const sitesRoutes = require('./routes/sites.routes');
const emailProcessorRoutes = require('./routes/email-processor.routes');
const usersRoutes = require('./routes/users.routes');
const supplierRoutes = require('./routes/supplier.routes');
const emailProcessor = require('./services/emailProcessor');

const API_BASE_PATH = process.env.API_BASE_PATH || '/api';
const FRONTEND_URL = process.env.FRONTEND_URL;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [FRONTEND_URL, 'https://' + FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  path: '/socket.io'
});

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: [FRONTEND_URL, 'https://' + FRONTEND_URL, 'https://frontendinventory-production.up.railway.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Add request logging middleware
app.use((req, res, next) => {
  console.log('🔍 [SERVER] Request received:', req.method, req.url, 'at', new Date().toISOString());
  next();
});
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}));

// Health check endpoint
app.get(`${API_BASE_PATH}/health`, (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: 'connected'
  });
});

// OTP routes
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  debug: false, logger: false
});
transporter.verify((error) => {
  if (error) console.log('Nodemailer verification error:', error);
});
const generateOtp = () => Math.floor(1000 + Math.random() * 9000);
app.post(`${API_BASE_PATH}/send-otp`, (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const otp = generateOtp();
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}`
  };
  transporter.sendMail(mailOptions, (error) => {
    if (error) return res.status(500).json({ error: 'Error sending OTP email' });
    if (!global.otpMap) global.otpMap = new Map();
    global.otpMap.set(email, { otp, email, timestamp: Date.now() });
    return res.status(200).json({ message: 'OTP sent successfully' });
  });
});
app.post(`${API_BASE_PATH}/verify-otp`, (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp || !global.otpMap || !global.otpMap.has(email)) return res.status(400).json({ error: 'Invalid or missing OTP' });
  const otpData = global.otpMap.get(email);
  if (Date.now() - otpData.timestamp > 10 * 60 * 1000) {
    global.otpMap.delete(email);
    return res.status(400).json({ error: 'OTP expired' });
  }
  if (otpData.otp.toString() === otp.toString()) {
    global.otpMap.delete(email);
    return res.status(200).json({ message: 'OTP verified successfully' });
  }
  return res.status(400).json({ error: 'Invalid OTP' });
});

// Modular routers under API_BASE_PATH
app.use(`${API_BASE_PATH}/auth`, require('./routes/auth.routes'));
app.use(`${API_BASE_PATH}/sites`, sitesRoutes);
app.use(`${API_BASE_PATH}/devices`, deviceInventoryRoutes);
app.use(`${API_BASE_PATH}/csv`, csvRoutes);
app.use(`${API_BASE_PATH}/suppliers`, supplierRoutes);
app.use(`${API_BASE_PATH}/users`, require('./routes/users.routes'));
app.use(`${API_BASE_PATH}/purchase-orders`, require('./routes/purchase-order.routes'));
app.use(API_BASE_PATH, vendorRoutes);
app.use(API_BASE_PATH, invoiceRoutes);
app.use(API_BASE_PATH, productRoutes);
app.use(API_BASE_PATH, emailProcessorRoutes);

// Log registered routes for debugging
console.log('🔍 [SERVER] Registered routes:');
app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log('  ' + r.route.stack[0].method.toUpperCase() + ' ' + r.route.path);
  } else if (r.name === 'router') {
    console.log('  Router middleware:', r.regexp);
  }
});

// 404 handler
app.use((req, res) => {
  console.log('🔍 [SERVER] 404 - Route not found:', req.method, req.url);
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    await pool.query('SELECT NOW()');
    await runMigrations();
    await emailProcessor.startMonitoring();
    httpServer.listen(process.env.PORT || 2000, () => {
      console.log(`Server running on port ${process.env.PORT || 2000}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

socketInit.init(io);
module.exports.io = io;
startServer();
