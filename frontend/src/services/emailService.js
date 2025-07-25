import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';

// FIXED: Use the new API configuration that ensures correct production URL
const POSSIBLE_BACKEND_URLS = [
  API_CONFIG.API_BASE_URL,  // Primary backend server
  '/api',                       // Same origin (when using proxy)
  'http://127.0.0.1:2000/api'  // Alternative localhost
];

// Function to test which backend URL works
const testBackendConnection = async () => {
  for (const url of POSSIBLE_BACKEND_URLS) {
    try {
      console.log(`Testing backend connection to: ${url}`);
      // Try health check first, fallback to email check
      try {
        await axios.get(`${url}/health`, { timeout: 2000 });
      } catch {
        await axios.head(`${url}/email/check`, { timeout: 2000 });
      }
      console.log(`✅ Successfully connected to backend at: ${url}`);
      return url;
    } catch (error) {
      console.log(`❌ Failed to connect to: ${url}`, error.message);
    }
  }
  // Default to the proxy URL if none work
  console.warn('Could not connect to any backend URL, using proxy');
  return '/api';
};

// Start with the first URL and try to find a working one
let API_URL = POSSIBLE_BACKEND_URLS[0];

// Try to find a working backend URL
testBackendConnection().then(url => {
  API_URL = url;
  console.log(`Using backend URL: ${API_URL}`);
}).catch(err => {
  console.error('Error testing backend connections:', err);
});

/**
 * Send a purchase order to a vendor via email
 * @param {number} poId - Purchase order ID
 * @param {object} emailData - Email data (to, subject, message)
 * @returns {Promise} - API response
 */
export const sendPurchaseOrderEmail = async (poId, emailData) => {
  try {
    console.log('Sending PO email:', {
      poId,
      to: emailData.to,
      subject: emailData.subject
    });
    
    const response = await axios.post(`${API_URL}/email/send-po`, {
      poId,
      ...emailData
    }, {
      withCredentials: true,
      timeout: 30000 // 30 seconds timeout
    });
    
    console.log('Successfully sent PO:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending PO email:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Send a purchase order with an attached PDF blob
 * @param {number} poId - Purchase order ID 
 * @param {object} emailData - Email data (to, subject, message)
 * @param {Blob} pdfBlob - PDF blob to attach
 * @returns {Promise} - API response
 */
export const sendPurchaseOrderWithPdf = async (poId, emailData, pdfBlob) => {
  try {
    // Ensure we have a proper file name with extension
    const fileName = `PO-${poId}-${Date.now()}.pdf`;
    
    // Create a new File object from the blob to ensure proper attachment
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
    
    // Create form data with the PDF blob
    const formData = new FormData();
    formData.append('poId', poId);
    formData.append('to', emailData.to);
    formData.append('subject', emailData.subject);
    formData.append('message', emailData.message);
    formData.append('pdfFile', file);
    
    // Log what we're sending for debugging
    console.log('Sending PO email with attachment:', {
      poId,
      to: emailData.to,
      subject: emailData.subject,
      fileName
    });
    
    // Send with FormData
    const response = await axios.post(`${API_URL}/email/send-po-with-file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      withCredentials: true,
      timeout: 30000 // 30 seconds timeout
    });
    
    console.log('Successfully sent PO:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending PO email:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get all invoices received via email
 * @param {number} limit - Number of invoices to get
 * @param {number} offset - Offset for pagination
 * @returns {Promise} - API response
 */
export const getReceivedInvoices = async (limit = 10, offset = 0) => {
  try {
    const response = await axios.get(`${API_URL}/invoices`, {
      params: { limit, offset }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting invoices:', error);
    throw error;
  }
};

/**
 * Get a specific invoice by ID
 * @param {number} invoiceId - Invoice ID
 * @returns {Promise} - API response
 */
export const getInvoiceById = async (invoiceId) => {
  try {
    const response = await axios.get(`${API_URL}/invoices/${invoiceId}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting invoice ${invoiceId}:`, error);
    throw error;
  }
};

/**
 * Link an invoice to a purchase order
 * @param {number} invoiceId - Invoice ID
 * @param {number} poId - Purchase order ID
 * @returns {Promise} - API response
 */
export const linkInvoiceToPO = async (invoiceId, poId) => {
  try {
    const response = await axios.post(`${API_URL}/invoices/${invoiceId}/link`, { poId });
    return response.data;
  } catch (error) {
    console.error('Error linking invoice to PO:', error);
    throw error;
  }
};

/**
 * Get all invoices for a specific purchase order
 * @param {number} poId - Purchase order ID
 * @returns {Promise} - API response
 */
export const getInvoicesForPO = async (poId) => {
  try {
    const response = await axios.get(`${API_URL}/purchase-orders/${poId}/invoices`);
    return response.data;
  } catch (error) {
    console.error(`Error getting invoices for PO ${poId}:`, error);
    throw error;
  }
};

/**
 * Test upload function to verify file upload functionality
 * @param {Blob} file - File blob to upload for testing
 * @returns {Promise} - API response
 */
export const testFileUpload = async (file) => {
  try {
    const formData = new FormData();
    formData.append('pdfFile', file);
    formData.append('testField', 'test value');
    
    console.log('Starting test file upload...');
    
    const response = await axios.post(`${API_URL}/email/test-upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      withCredentials: true
    });
    
    console.log('Test upload successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Test upload failed:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

export default {
  sendPurchaseOrderEmail,
  sendPurchaseOrderWithPdf,
  getReceivedInvoices,
  getInvoiceById,
  linkInvoiceToPO,
  getInvoicesForPO,
  testFileUpload
}; 