/**
 * Test script for email functionality
 * This file tests the email service for sending purchase order emails
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const nodemailer = require('nodemailer');

const API_URL = 'http://localhost:2000/api';
let token = null;

// Test email configuration
const testEmailConfig = {
  from: process.env.EMAIL_USER || 'invoice.tester11@gmail.com',
  to: 'invoice.tester11@gmail.com', // Send to self for testing
  subject: 'Test Purchase Order Email',
  text: 'This is a test email for the purchase order system.'
};

// Create test transporter
const createTestTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || 'invoice.tester11@gmail.com',
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Login to get token
async function login() {
  try {
    console.log('Logging in...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    token = response.data.token;
    console.log('Login successful, token obtained');
    return token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Test direct email sending
async function testDirectEmail() {
  try {
    console.log('\nTesting direct email sending...');
    const transporter = createTestTransporter();
    
    const info = await transporter.sendMail({
      from: testEmailConfig.from,
      to: testEmailConfig.to,
      subject: testEmailConfig.subject,
      text: testEmailConfig.text
    });
    
    console.log('Direct email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Direct email test failed:', error);
    return false;
  }
}

// Test sending email with attachment
async function testSendEmailWithAttachment() {
  try {
    console.log('\nTesting sending email with PDF attachment...');
    
    // Create a test PDF file if it doesn't exist
    const testPdfPath = path.join(__dirname, 'test-po.pdf');
    if (!fs.existsSync(testPdfPath)) {
      console.log('Creating test PDF file...');
      const sampleContent = Buffer.from('%PDF-1.5\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length 68 >>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test Purchase Order PDF for email testing) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000233 00000 n\n0000000300 00000 n\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n418\n%%EOF');
      fs.writeFileSync(testPdfPath, sampleContent);
      console.log('Test PDF file created');
    }
    
    // First test direct email with attachment
    try {
      console.log('\nTesting direct email with attachment...');
      const transporter = createTestTransporter();
      
      const info = await transporter.sendMail({
        from: testEmailConfig.from,
        to: testEmailConfig.to,
        subject: 'Test PO Email with Attachment',
        text: 'This is a test email with PDF attachment',
        attachments: [{
          filename: 'test-po.pdf',
          path: testPdfPath
        }]
      });
      
      console.log('Direct email with attachment sent:', info.messageId);
    } catch (directError) {
      console.error('Direct email with attachment failed:', directError);
    }
    
    // Create form data for API test
    const formData = new FormData();
    formData.append('pdfFile', fs.createReadStream(testPdfPath));
    formData.append('to', testEmailConfig.to);
    formData.append('poId', 'TEST-PO-123');
    formData.append('subject', 'Test Purchase Order Email');
    formData.append('message', 'This is a test message for the purchase order email functionality.');
    
    // Test the API endpoints
    console.log('\nTesting API endpoints...');
    
    // Test the purchase order email endpoint
    console.log('\nTesting purchase order email endpoint...');
    const poResponse = await axios.post(
      `${API_URL}/purchase-orders/send-email`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('PO email endpoint response:', poResponse.data);
    
    console.log('\n✅ Email tests completed successfully!');
    return true;
  } catch (error) {
    console.error('Email test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    return false;
  }
}

// Run the tests
async function runTests() {
  console.log('🧪 Email Functionality Test Script');
  
  try {
    // Login first to get token
    await login();
    
    // Test direct email sending
    console.log('\nStep 1: Testing direct email sending');
    const directEmailResult = await testDirectEmail();
    
    // Test email with attachment
    console.log('\nStep 2: Testing email with attachment');
    const attachmentResult = await testSendEmailWithAttachment();
    
    console.log('\n--- Test Results ---');
    console.log('Direct email test:', directEmailResult ? '✅ PASSED' : '❌ FAILED');
    console.log('Email with attachment test:', attachmentResult ? '✅ PASSED' : '❌ FAILED');
    
    if (directEmailResult && attachmentResult) {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log('\n😢 Some tests failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

// Start the tests
runTests(); 