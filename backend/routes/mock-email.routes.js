/**
 * Mock Email Routes
 * 
 * These routes simulate email functionality without requiring actual email credentials.
 * They provide console logs for visual feedback in the terminal.
 */

const express = require('express');
const router = express.Router();
const mockEmailController = require('../controllers/mock-email.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory:', uploadsDir);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalExtension = path.extname(file.originalname) || '.pdf';
    cb(null, 'purchase-order-' + uniqueSuffix + originalExtension);
  }
});

// Error handling for multer file uploads
const fileFilter = (req, file, cb) => {
  // Accept PDF files and other common document types
  const acceptedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
  if (acceptedTypes.includes(file.mimetype) || file.originalname.endsWith('.pdf')) {
    cb(null, true);
  } else {
    console.warn('File upload rejected - invalid type:', file.mimetype, file.originalname);
    cb(null, false); // Don't throw error but don't accept file
  }
};

// Create multer upload handler
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: fileFilter
});

// Add a simple health check endpoint
router.get('/mock/health', (req, res) => {
  console.log('\n🏥 MOCK HEALTH CHECK 🏥');
  console.log('----------------------------------');
  console.log('✅ Backend is running in mock mode');
  console.log(`⏱️ Server time: ${new Date().toISOString()}`);
  console.log('----------------------------------\n');
  
  res.json({
    status: 'ok',
    mode: 'mock',
    timestamp: new Date().toISOString(),
    message: 'Mock backend server is running'
  });
});

// Route to send a purchase order via email (mock)
router.post('/mock/email/send-po', (req, res) => {
  console.log('Mock email endpoint called without attachment');
  mockEmailController.sendPurchaseOrderEmail(req, res);
});

// Route to send a purchase order via email with uploaded PDF (mock)
router.post('/mock/email/send-po-with-file', upload.single('pdfFile'), (req, res) => {
  console.log('Mock email endpoint called with attachment');
  if (!req.file) {
    console.warn('No file received in mock email request');
    return res.status(400).json({
      success: false,
      error: 'No file was uploaded or file was rejected'
    });
  }
  
  console.log('File received:', req.file.originalname, req.file.size, 'bytes');
  mockEmailController.sendPurchaseOrderWithPdf(req, res);
});

// Route to manually check for new emails with invoices (mock)
router.get('/mock/email/check', mockEmailController.checkEmails);

// Invoice routes (mock)
router.get('/mock/invoices', mockEmailController.getInvoices);
router.get('/mock/invoices/:invoiceId', mockEmailController.getInvoiceById);
router.post('/mock/invoices/:invoiceId/link', mockEmailController.linkInvoiceToPO);

// Add a debug endpoint to verify route handling
router.post('/mock/test-upload', upload.single('testFile'), (req, res) => {
    console.log('\n🧪 TEST UPLOAD ENDPOINT 🧪');
    console.log('----------------------------------');
    console.log('Request Content-Type:', req.get('Content-Type'));
    console.log('Request body fields:', Object.keys(req.body));
    
    if (req.file) {
        console.log('File received:');
        console.log(`- Name: ${req.file.originalname}`);
        console.log(`- Size: ${req.file.size} bytes`);
        console.log(`- Mimetype: ${req.file.mimetype}`);
        console.log(`- Saved to: ${req.file.path}`);
        
        res.status(200).json({ 
            success: true,
            message: 'File upload test successful', 
            file: {
              originalname: req.file.originalname,
              size: req.file.size,
              mimetype: req.file.mimetype,
              path: req.file.path
            },
            bodyFields: Object.keys(req.body)
        });
    } else {
        console.log('No file received');
        res.status(400).json({ 
            success: false,
            message: 'No file received', 
            bodyFields: Object.keys(req.body),
            contentType: req.get('Content-Type')
        });
    }
    console.log('----------------------------------\n');
});

module.exports = router; 