const { pool } = require('../database/schema');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Safely try to import PDF extraction library
let PDFExtract, pdfExtract;
try {
  PDFExtract = require('pdf.js-extract').PDFExtract;
  pdfExtract = new PDFExtract();
  console.log('PDF extraction library loaded successfully');
} catch (error) {
  console.warn('PDF extraction library not available. PDF processing will be disabled.');
  console.warn('Install with: npm install pdf.js-extract');
}

// Status keywords to look for in emails
const STATUS_KEYWORDS = {
  'shipped': ['shipped', 'dispatched', 'sent', 'on its way'],
  'in_transit': ['in transit', 'on the way', 'out for delivery'],
  'delivered': ['delivered', 'received', 'completed'],
  'delayed': ['delayed', 'postponed', 'held'],
  'cancelled': ['cancelled', 'canceled', 'order cancelled']
};

// Extract PO number from email subject
const extractPONumber = (subject) => {
  // Common PO number formats: PO-123456, Order #123456, etc.
  const poMatches = subject.match(/\b(?:PO[-#]?|order[-#]?|ref[-#]?)\s*(\w+[-]?\d+)\b/i);
  if (poMatches && poMatches[1]) {
    return poMatches[1];
  }
  
  // Fallback to looking for any word with PO prefix
  const fallbackMatches = subject.match(/\b(PO[-]?\d+)\b/i);
  return fallbackMatches ? fallbackMatches[1] : null;
};

// Determine status from email content
const determineOrderStatus = (emailText) => {
  emailText = emailText.toLowerCase();
  
  for (const [status, keywords] of Object.entries(STATUS_KEYWORDS)) {
    for (const keyword of keywords) {
      if (emailText.includes(keyword)) {
        return status;
      }
    }
  }
  
  return null;
};

// Extract tracking number from email
const extractTrackingNumber = (emailText) => {
  // Common tracking number formats
  const trackingPatterns = [
    /\b(tracking|track)(?:\s+number)?(?:\s*(?::|is|#))?\s*([A-Z0-9]{8,30})\b/i,
    /\b(shipment|package)(?:\s+id)?(?:\s*(?::|is|#))?\s*([A-Z0-9]{8,30})\b/i,
    /\b([A-Z]{2}\d{9}[A-Z]{2})\b/i,  // UPS format
    /\b(\d{12,22})\b/  // Generic long number that might be tracking
  ];
  
  for (const pattern of trackingPatterns) {
    const match = emailText.match(pattern);
    if (match && match[2]) {
      return match[2];
    }
  }
  
  return null;
};

// Extract estimated delivery date
const extractEstimatedDelivery = (emailText) => {
  const datePatterns = [
    /(?:estimated|expected|scheduled)(?:\s+delivery)?(?:\s+date)?(?:\s*(?::|is))?\s*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/i,
    /(?:delivery)(?:\s+on)?(?:\s*(?::|is))?\s*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/i,
    /(?:deliver)(?:\s+by)?(?:\s*(?::|is))?\s*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/i
  ];
  
  for (const pattern of datePatterns) {
    const match = emailText.match(pattern);
    if (match && match[1]) {
      // Convert to proper date format
      const dateStr = match[1];
      
      // Try parsing the date
      try {
        const date = new Date(dateStr);
        if (!isNaN(date)) {
          return date.toISOString().split('T')[0];  // YYYY-MM-DD
        }
      } catch (e) {
        console.error('Error parsing date:', e);
      }
    }
  }
  
  return null;
};

// Extract location information
const extractLocation = (emailText) => {
  const locationPatterns = [
    /(?:location|facility|warehouse|center)(?:\s*(?::|is))?\s*([A-Za-z\s]+(?:Center|Warehouse|Facility|Hub))/i,
    /(?:your package is in|arrived at|departed from)\s+([A-Za-z\s]+(?:Center|Warehouse|Facility|Hub|City))/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = emailText.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
};

// Process email and update order
const updateOrderFromEmail = async (email) => {
  try {
    // Log the email details
    console.log('=======================================');
    console.log('Processing email:');
    console.log(`Subject: ${email.subject}`);
    console.log(`From: ${email.from.text}`);
    console.log(`Date: ${email.date}`);
    console.log(`Attachments: ${email.attachments ? email.attachments.length : 0}`);
    console.log('=======================================');
    
    // Check for PDF attachments
    let pdfData = null;
    if (email.attachments && email.attachments.length > 0) {
      const pdfAttachment = email.attachments.find(
        attachment => attachment.contentType === 'application/pdf' || 
                     (attachment.filename && attachment.filename.toLowerCase().endsWith('.pdf'))
      );
      
      if (pdfAttachment) {
        console.log(`Found PDF attachment: ${pdfAttachment.filename}`);
        pdfData = await extractInvoiceDataFromPdf(pdfAttachment);
        
        if (pdfData) {
          console.log('Extracted data from PDF:', pdfData);
        }
      }
    }
    
    // Try to extract PO from PDF first, then fallback to subject
    let poNumber = pdfData?.poNumber || extractPONumber(email.subject);
    
    if (!poNumber) {
      console.log('No PO number found in email or attachments');
      return null;
    }
    
    console.log(`Extracted PO number: ${poNumber}`);
    
    // Get the PO from database
    const query = `
      SELECT * FROM purchase_orders
      WHERE order_number = $1
    `;
    
    const result = await pool.query(query, [poNumber]);
    
    if (result.rows.length === 0) {
      console.log(`PO ${poNumber} not found in database`);
      return null;
    }
    
    const po = result.rows[0];
    
    // Extract tracking information
    const status = determineOrderStatus(email.text || email.html.replace(/<[^>]*>/g, ' '));
    const trackingNumber = extractTrackingNumber(email.text || email.html.replace(/<[^>]*>/g, ' '));
    const estimatedDelivery = extractEstimatedDelivery(email.text || email.html.replace(/<[^>]*>/g, ' '));
    const location = extractLocation(email.text || email.html.replace(/<[^>]*>/g, ' '));
    
    // Create a history entry
    const historyEntry = {
      date: new Date().toISOString(),
      status: status || 'update_received',
      source: 'email',
      details: `Email received from ${email.from?.text || 'unknown'} with subject "${email.subject}"`
    };
    
    // Update tracking history
    let trackingHistory = [];
    if (po.tracking_history) {
      try {
        trackingHistory = JSON.parse(po.tracking_history);
      } catch (e) {
        console.error('Error parsing tracking history:', e);
      }
    }
    
    trackingHistory.push(historyEntry);
    
    // After extraction, store both email text data and PDF data
    const updateData = {
      last_status_update: new Date()
    };
    
    // Add tracking info from email text
    if (status) updateData.shipping_status = status;
    if (trackingNumber || pdfData?.trackingNumber) 
      updateData.tracking_number = trackingNumber || pdfData?.trackingNumber;
    if (estimatedDelivery) updateData.estimated_delivery = estimatedDelivery;
    if (location) updateData.current_location = location;
    
    // Add invoice info from PDF if available
    if (pdfData?.invoiceNumber) updateData.invoice_number = pdfData.invoiceNumber;
    if (pdfData?.invoiceAmount) updateData.invoice_amount = pdfData.invoiceAmount;
    
    // Save the PDF if needed
    if (pdfAttachment) {
      // Create a directory for storing attachments if it doesn't exist
      const uploadsDir = path.join(__dirname, '../../uploads/invoices');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Save the PDF
      const pdfPath = path.join(uploadsDir, `${poNumber}_invoice_${Date.now()}.pdf`);
      fs.writeFileSync(pdfPath, pdfAttachment.content);
      
      // Store the path in the database
      updateData.invoice_pdf_path = pdfPath;
    }
    
    // Build the update query
    let updateQuery = 'UPDATE purchase_orders SET ';
    const updateValues = [];
    let valueIndex = 1;
    
    Object.entries(updateData).forEach(([key, value], index) => {
      if (index > 0) updateQuery += ', ';
      updateQuery += `${key} = $${valueIndex}`;
      updateValues.push(value);
      valueIndex++;
    });
    
    // Add tracking_history as JSON
    updateQuery += `, tracking_history = $${valueIndex}`;
    updateValues.push(JSON.stringify(trackingHistory));
    valueIndex++;
    
    updateQuery += ` WHERE id = $${valueIndex}`;
    updateValues.push(po.id);
    
    // Execute the update
    await pool.query(updateQuery, updateValues);
    
    console.log(`Successfully updated PO ${poNumber} with:`, {
      status: updateData.shipping_status,
      tracking: updateData.tracking_number,
      location: updateData.current_location,
      delivery: updateData.estimated_delivery
    });
    
    return po.id;
  } catch (error) {
    console.error('Error updating order from email:', error);
    return null;
  }
};

// Add this function to handle PDF attachments with fallback
const extractInvoiceDataFromPdf = async (attachment) => {
  // Check if PDF extraction is available
  if (!pdfExtract) {
    console.log('PDF extraction skipped: library not available');
    return {
      skipped: true,
      reason: 'PDF extraction library not installed'
    };
  }
  
  try {
    // Create a temporary file to save the attachment
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `invoice_${Date.now()}.pdf`);
    
    // Write attachment content to temp file
    fs.writeFileSync(tempFilePath, attachment.content);
    
    // Extract text from PDF
    const result = await pdfExtract.extract(tempFilePath, {});
    const pdfText = result.pages.map(page => page.content.map(item => item.str).join(' ')).join(' ');
    
    // Clean up temp file
    fs.unlinkSync(tempFilePath);
    
    // Extract data from the PDF text
    const poNumber = extractPONumber(pdfText);
    const trackingNumber = extractTrackingNumber(pdfText);
    const invoiceNumber = extractInvoiceNumber(pdfText);
    const invoiceAmount = extractInvoiceAmount(pdfText);
    
    return {
      poNumber,
      trackingNumber,
      invoiceNumber,
      invoiceAmount,
      pdfText
    };
  } catch (error) {
    console.error('Error extracting data from PDF:', error);
    return null;
  }
};

// Add missing function to extract invoice number
const extractInvoiceNumber = (text) => {
  const patterns = [
    /\b(?:invoice|inv)(?:\s+number)?(?:\s*(?::|#|no\.?))?\s*([A-Z0-9][\w\-]{4,20})\b/i,
    /\b(INV[\w\-]{4,15})\b/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

// Add missing function to extract invoice amount
const extractInvoiceAmount = (text) => {
  const patterns = [
    /\b(?:invoice|total)(?:\s+amount)?(?:\s*(?::|is))?\s*(?:[$£€])?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\b/i,
    /\b(?:amount(?:\s+due)?|total)(?:\s*(?::|is))?\s*(?:[$£€])?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\b/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Remove commas and convert to number
      return parseFloat(match[1].replace(/,/g, ''));
    }
  }
  
  return null;
};

module.exports = {
  updateOrderFromEmail,
  extractPONumber,
  extractInvoiceNumber,
  extractInvoiceAmount
}; 