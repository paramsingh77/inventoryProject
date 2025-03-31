const { pool } = require('../database/schema');
const socketIO = require('../socket');

/**
 * Automatically processes new invoices to link them with purchase orders
 * and notify the frontend of changes
 */
const processNewInvoice = async (invoice) => {
  try {
    console.log(`Processing new invoice: ${invoice.filename}`);
    
    // 1. Extract potential order numbers from the filename or content
    const possibleOrderNumbers = extractOrderNumbers(invoice.filename);
    
    // 2. If order numbers found, try to match with existing purchase orders
    if (possibleOrderNumbers.length > 0) {
      console.log(`Found possible order numbers: ${possibleOrderNumbers.join(', ')}`);
      
      // Query the database for matching purchase orders
      const matchingOrders = await findMatchingOrders(possibleOrderNumbers);
      
      if (matchingOrders.length > 0) {
        console.log(`Found ${matchingOrders.length} matching orders`);
        
        // Link the invoice to the first matching order
        const order = matchingOrders[0];
        await linkInvoiceToOrder(invoice.id, order.id);
        
        // Update the invoice status to 'processed'
        await updateInvoiceStatus(invoice.id, 'processed');
        
        // Notify the frontend that a new invoice has been processed
        socketIO.getIO().emit('invoiceProcessed', {
          invoiceId: invoice.id,
          orderId: order.id,
          orderNumber: order.order_number
        });
        
        return {
          success: true,
          message: `Invoice linked to order ${order.order_number}`,
          order: order
        };
      }
    }
    
    // No matching orders found, mark as pending
    console.log('No matching orders found, marking as pending');
    await updateInvoiceStatus(invoice.id, 'pending');
    
    // Notify the frontend of the new pending invoice
    socketIO.getIO().emit('newInvoice', {
      invoiceId: invoice.id,
      status: 'pending'
    });
    
    return {
      success: false,
      message: 'No matching orders found'
    };
  } catch (error) {
    console.error('Error processing invoice:', error);
    
    // Update the invoice status to 'failed'
    await updateInvoiceStatus(invoice.id, 'failed', error.message);
    
    return {
      success: false,
      message: `Error processing invoice: ${error.message}`
    };
  }
};

/**
 * Extract possible order numbers from a filename
 */
const extractOrderNumbers = (filename) => {
  const orderNumbers = [];
  
  // Common patterns for order numbers: PO-YYYY-XXXXXX, POYYYYXXXXXX, PO#XXXXXX
  const patterns = [
    /PO[-_]?(\d{4}[-_]?\d{6}[-_]?\d{4})/i,  // Match PO-YYYY-XXXXXX-XXXX
    /PO[-_#]?(\d{6,})/i,                    // Match PO#XXXXXX or POXXXXXX
    /Order[-_#]?(\d{6,})/i,                 // Match Order#XXXXXX
    /(\d{6,})/                              // Match any 6+ digit number
  ];
  
  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (match && match[1]) {
      orderNumbers.push(match[1]);
    }
  }
  
  return orderNumbers;
};

/**
 * Find purchase orders matching the possible order numbers
 */
const findMatchingOrders = async (possibleOrderNumbers) => {
  try {
    const placeholders = possibleOrderNumbers.map((_, idx) => `$${idx + 1}`).join(',');
    
    const query = `
      SELECT * FROM purchase_orders 
      WHERE order_number IN (${placeholders})
      OR id::text IN (${placeholders})
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [...possibleOrderNumbers, ...possibleOrderNumbers]);
    return result.rows;
  } catch (error) {
    console.error('Error finding matching orders:', error);
    return [];
  }
};

/**
 * Link an invoice to a purchase order
 */
const linkInvoiceToOrder = async (invoiceId, orderId) => {
  try {
    const query = `
      UPDATE invoices
      SET po_id = $1, processed_at = NOW()
      WHERE id = $2
    `;
    
    await pool.query(query, [orderId, invoiceId]);
    
    // Also update the purchase order with invoice information
    const updateOrderQuery = `
      UPDATE purchase_orders
      SET invoice_received = true, 
          invoice_date = NOW(),
          last_updated = NOW()
      WHERE id = $1
    `;
    
    await pool.query(updateOrderQuery, [orderId]);
    
    console.log(`Successfully linked invoice ${invoiceId} to order ${orderId}`);
    return true;
  } catch (error) {
    console.error('Error linking invoice to order:', error);
    throw error;
  }
};

/**
 * Update the status of an invoice
 */
const updateInvoiceStatus = async (invoiceId, status, notes = null) => {
  try {
    const query = `
      UPDATE invoices
      SET status = $1, notes = $2, last_updated = NOW()
      WHERE id = $3
    `;
    
    await pool.query(query, [status, notes, invoiceId]);
    return true;
  } catch (error) {
    console.error('Error updating invoice status:', error);
    return false;
  }
};

module.exports = {
  processNewInvoice
}; 