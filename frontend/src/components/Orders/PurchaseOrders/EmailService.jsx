import React from 'react';
import api from '../../../utils/api';

/**
 * Email Service for sending PO-related emails to vendors
 */
const EmailService = {
  /**
   * Send approved purchase order email with PDF to vendor
   * @param {Object} poData - Purchase order data
   * @param {Blob|File} pdfBlob - PDF blob or file for attachment
   * @returns {Promise<{success: boolean, error: string|null}>} - Success status and error if any
   */
  async sendPOEmail(poData, pdfBlob) {
    console.log('EmailService: Sending PO approval email...');
    
    // Validate required inputs
    if (!poData) {
      console.error('EmailService: Missing PO data');
      return { success: false, error: 'Missing purchase order data' };
    }
    
    if (!pdfBlob) {
      console.error('EmailService: Missing PDF blob/file');
      return { success: false, error: 'Missing PDF attachment' };
    }
    
    if (!poData.vendor_email && !poData.email) {
      console.error('EmailService: No vendor email address provided');
      return { success: false, error: 'Missing vendor email address' };
    }
    
    try {
      // Create FormData for multipart request (PDF attachment)
      const formData = new FormData();
      
      // If input is already a File, use it directly, otherwise create File from Blob
      const pdfFile = pdfBlob instanceof File ? pdfBlob : 
                     new File([pdfBlob], `PO-${poData.order_number}.pdf`, { 
                       type: 'application/pdf', 
                       lastModified: new Date() 
                     });
      
      // Check and log file details
      console.log('EmailService: PDF file details:', {
        name: pdfFile.name,
        size: pdfFile.size,
        type: pdfFile.type,
        lastModified: pdfFile.lastModified
      });
      
      // Ensure the file is valid before uploading
      if (pdfFile.size === 0) {
        console.error('EmailService: PDF file is empty');
        return { success: false, error: 'PDF file is empty' };
      }
      
      // Add file to form data
      formData.append('pdfFile', pdfFile);
      
      // Add email details
      formData.append('to', poData.vendor_email || poData.email);
      formData.append('subject', `Purchase Order ${poData.order_number} Approved`);
      
      // Create email body with complete details
      const emailBody = `Dear ${poData.vendor_name || 'Vendor'},

We are pleased to inform you that purchase order ${poData.order_number} has been approved with the following details:

Order Number: ${poData.order_number}
Date: ${new Date().toLocaleDateString()}
${poData.subtotal ? `Subtotal: $${poData.subtotal}` : ''}
${poData.tax ? `Tax (${poData.tax_rate || 0}%): $${poData.tax}` : ''}
${poData.shipping_fee ? `Shipping: $${poData.shipping_fee}` : ''}
Total Amount: $${poData.total_amount || '0.00'}

Please find the approved purchase order attached to this email.

If you have any questions regarding this order, please contact us directly.

Best regards,
${localStorage.getItem('username') || localStorage.getItem('name') || 'Purchasing Department'}
${localStorage.getItem('company') || 'AAM Inventory Solutions'}`;
      
      formData.append('message', emailBody);
      formData.append('poId', poData.id || poData.order_number); // Add PO ID for tracking
      
      // For debugging - log form data content
      console.log('EmailService: Form data keys:', [...formData.keys()]);
      console.log('EmailService: Sending email to:', poData.vendor_email || poData.email);
      
      // Try the standard API endpoint first
      try {
        const response = await api.post('/purchase-orders/send-email', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000 // 30 seconds timeout
        });
        
        console.log('EmailService: Standard API response:', response.data);
        return { success: true };
      } catch (standardError) {
        console.warn('EmailService: Standard endpoint failed, trying mock endpoint:', standardError);
        
        // If standard endpoint fails, try the mock endpoint directly
        try {
          const mockResponse = await api.post('/mock/email/send-po-with-file', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            timeout: 30000
          });
          
          console.log('EmailService: Mock API response:', mockResponse.data);
          return { success: true };
        } catch (mockError) {
          console.error('EmailService: Mock endpoint also failed:', mockError);
          throw mockError; // Re-throw to be caught by outer catch
        }
      }
    } catch (error) {
      console.error('EmailService: Error sending PO to vendor:', error);
      
      // Provide a specific error message based on the error type
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error sending email';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  },

  /**
   * Send rejection notification email to vendor
   * @param {Object} poData - Purchase order data
   * @param {string} rejectionReason - Reason for rejection
   * @returns {Promise<{success: boolean, error: string|null}>} - Success status and error if any
   */
  async sendRejectionEmail(poData, rejectionReason) {
    console.log('EmailService: Sending PO rejection email...');
    
    // Validate required inputs
    if (!poData) {
      console.error('EmailService: Missing PO data');
      return { success: false, error: 'Missing purchase order data' };
    }
    
    if (!rejectionReason || !rejectionReason.trim()) {
      console.error('EmailService: Missing rejection reason');
      return { success: false, error: 'Missing rejection reason' };
    }
    
    if (!poData.vendor_email && !poData.email) {
      console.error('EmailService: No vendor email address provided');
      return { success: false, error: 'Missing vendor email address' };
    }
    
    try {
      // Create FormData for request
      const formData = new FormData();
      
      // Add email details
      formData.append('to', poData.vendor_email || poData.email);
      formData.append('subject', `Purchase Order ${poData.order_number} Rejected`);
      formData.append('poId', poData.id || poData.order_number); // Add PO ID for tracking
      
      // Create email body with complete details
      const emailBody = `Dear ${poData.vendor_name || 'Vendor'},

We regret to inform you that purchase order ${poData.order_number} has been rejected.

Reason for Rejection: ${rejectionReason}

If you have any questions about this decision or would like to submit a revised purchase order, please contact us directly.

Best regards,
${localStorage.getItem('username') || localStorage.getItem('name') || 'Purchasing Department'}
${localStorage.getItem('company') || 'AAM Inventory Solutions'}`;
      
      formData.append('message', emailBody);
      
      // Try the standard API endpoint first
      try {
        const response = await api.post('/purchase-orders/send-email', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000
        });
        
        console.log('EmailService: API response:', response.data);
        return { success: true };
      } catch (standardError) {
        console.warn('EmailService: Standard endpoint failed, trying mock endpoint:', standardError);
        
        // If standard endpoint fails, try the mock endpoint directly
        const mockResponse = await api.post('/mock/email/send-po', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000
        });
        
        console.log('EmailService: Mock API response:', mockResponse.data);
        return { success: true };
      }
    } catch (error) {
      console.error('EmailService: Error sending rejection email:', error);
      
      // Provide a specific error message based on the error type
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error sending email';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }
};

export default EmailService; 