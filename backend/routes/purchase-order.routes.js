const express = require('express');
const router = express.Router();
const { pool } = require('../database/schema'); // Import database connection
const socketIO = require('../socket'); // Import socket.io instance

// Authentication middleware (implement as needed)
const authMiddleware = (req, res, next) => {
    // Check if user is authenticated
    // For demonstration, always allow
    next();
};

// Admin check middleware (implement as needed)
const adminMiddleware = (req, res, next) => {
    // Check if user is an admin
    // For demonstration, always allow
    next();
};

// Routes

// Get all purchase orders
router.get('/purchase-orders', authMiddleware, async (req, res) => {
    try {
        // Fetch purchase orders from database
        const query = `
            SELECT po.*, 
                   u.username as ordered_by_name,
                   s.name as supplier_name
            FROM purchase_orders po
            LEFT JOIN users u ON po.ordered_by = u.id
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            ORDER BY po.created_at DESC
        `;
        
        const result = await pool.query(query);
        const purchaseOrders = result.rows;
        
        // For each purchase order, fetch its items
        for (const order of purchaseOrders) {
            const itemsQuery = `
                SELECT * FROM order_items 
                WHERE order_id = $1
            `;
            const itemsResult = await pool.query(itemsQuery, [order.id]);
            order.items = itemsResult.rows;
        }
        
        res.status(200).json(purchaseOrders);
    } catch (error) {
        console.error('Error fetching purchase orders:', error);
        res.status(500).json({ message: 'Error fetching purchase orders', error: error.message });
    }
});

// Get purchase orders by status
router.get('/purchase-orders/status/:status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.params;
        
        const query = `
            SELECT po.*, 
                   u.username as ordered_by_name,
                   s.name as supplier_name
            FROM purchase_orders po
            LEFT JOIN users u ON po.ordered_by = u.id
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            WHERE po.status = $1
            ORDER BY po.created_at DESC
        `;
        
        const result = await pool.query(query, [status]);
        const purchaseOrders = result.rows;
        
        // For each purchase order, fetch its items
        for (const order of purchaseOrders) {
            const itemsQuery = `
                SELECT * FROM order_items 
                WHERE order_id = $1
            `;
            const itemsResult = await pool.query(itemsQuery, [order.id]);
            order.items = itemsResult.rows;
        }
        
        res.status(200).json(purchaseOrders);
    } catch (error) {
        console.error(`Error fetching ${req.params.status} purchase orders:`, error);
        res.status(500).json({ message: `Error fetching ${req.params.status} purchase orders`, error: error.message });
    }
});

// Get pending purchase orders (admin only)
router.get('/purchase-orders/pending', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const query = `
            SELECT po.*, 
                   u.username as ordered_by_name,
                   s.name as supplier_name,
                   s.email as supplier_email
            FROM purchase_orders po
            LEFT JOIN users u ON po.ordered_by = u.id
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            WHERE po.status = 'pending'
            ORDER BY po.created_at DESC
        `;
        
        const result = await pool.query(query);
        const pendingOrders = result.rows;
        
        // For each pending order, fetch its items
        for (const order of pendingOrders) {
            const itemsQuery = `
                SELECT * FROM order_items 
                WHERE order_id = $1
            `;
            const itemsResult = await pool.query(itemsQuery, [order.id]);
            order.items = itemsResult.rows;
        }
        
        res.status(200).json(pendingOrders);
    } catch (error) {
        console.error('Error fetching pending purchase orders:', error);
        res.status(500).json({ message: 'Error fetching pending purchase orders', error: error.message });
    }
});

// Get a specific purchase order by ID
router.get('/purchase-orders/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT po.*, 
                   u.username as ordered_by_name,
                   s.name as supplier_name
            FROM purchase_orders po
            LEFT JOIN users u ON po.ordered_by = u.id
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            WHERE po.id = $1
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }
        
        const purchaseOrder = result.rows[0];
        
        // Fetch the items for this purchase order
        const itemsQuery = `
            SELECT * FROM order_items 
            WHERE order_id = $1
        `;
        const itemsResult = await pool.query(itemsQuery, [id]);
        purchaseOrder.items = itemsResult.rows;
        
        res.status(200).json(purchaseOrder);
    } catch (error) {
        console.error('Error fetching purchase order:', error);
        res.status(500).json({ message: 'Error fetching purchase order', error: error.message });
    }
});

// Create a new purchase order
router.post('/purchase-orders', authMiddleware, async (req, res) => {
    try {
        const { 
            order_number,
            supplier_id,
            ordered_by,
            expected_delivery,
            status,
            total_amount,
            notes,
            items
        } = req.body;
        
        // Start a transaction
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Insert the purchase order
            const insertOrderQuery = `
                INSERT INTO purchase_orders (
                    order_number, 
                    supplier_id, 
                    ordered_by, 
                    expected_delivery, 
                    status, 
                    total_amount, 
                    notes
                ) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;
            
            const orderResult = await client.query(insertOrderQuery, [
                order_number,
                supplier_id,
                ordered_by,
                expected_delivery,
                status || 'draft', // Default to draft if not specified
                total_amount,
                notes
            ]);
            
            const purchaseOrder = orderResult.rows[0];
            
            // Insert the order items if provided
            if (items && items.length > 0) {
                for (const item of items) {
                    const insertItemQuery = `
                        INSERT INTO order_items (
                            order_id,
                            item_type,
                            item_id,
                            quantity,
                            unit_price,
                            total_price,
                            notes
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                    `;
                    
                    await client.query(insertItemQuery, [
                        purchaseOrder.id,
                        item.item_type,
                        item.item_id,
                        item.quantity,
                        item.unit_price,
                        item.quantity * item.unit_price, // Calculate total price
                        item.notes
                    ]);
                }
            }
            
            await client.query('COMMIT');
            
            // If purchase order is submitted for approval (status = pending)
            if (status === 'pending') {
                // Emit socket event for admin notification
                socketIO.getIO().emit('po_approval_requested', {
                    poId: purchaseOrder.id,
                    poNumber: purchaseOrder.order_number,
                    vendorName: req.body.vendor_name || req.body.vendorName || 'Not specified',
                    vendorEmail: req.body.vendor_email || req.body.vendorEmail || '',
                    requestedBy: req.body.username || 'User',
                    department: req.body.department || 'Not specified',
                    requestDate: new Date().toISOString(),
                    total: total_amount,
                    items: items || [],
                    contactPerson: req.body.contact_person || req.body.contactPerson || '',
                    phoneNumber: req.body.phone_number || req.body.phoneNumber || ''
                });
            }
            
            res.status(201).json({
                message: 'Purchase order created successfully',
                purchaseOrder
            });
            
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating purchase order:', error);
        res.status(500).json({ message: 'Error creating purchase order', error: error.message });
    }
});

// Update a purchase order status (approve/reject)
router.patch('/purchase-orders/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, comments } = req.body;
        
        // Validate the status
        if (!['pending', 'approved', 'rejected', 'draft', 'sent'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        
        // Update the purchase order status
        const updateQuery = `
            UPDATE purchase_orders
            SET 
                status = $1,
                notes = CASE
                    WHEN $2::TEXT IS NOT NULL AND $2::TEXT != ''
                    THEN COALESCE(notes, '') || E'\n' || $2::TEXT
                    ELSE notes
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `;
        
        const result = await pool.query(updateQuery, [status, comments, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }
        
        const updatedOrder = result.rows[0];
        
        // If the status is approved, send email to vendor
        if (status === 'approved') {
            try {
                // Get the full purchase order details with items
                const fullOrderQuery = `
                    SELECT po.*, 
                        u.username as ordered_by_name,
                        s.name as supplier_name,
                        s.email as supplier_email
                    FROM purchase_orders po
                    LEFT JOIN users u ON po.ordered_by = u.id
                    LEFT JOIN suppliers s ON po.supplier_id = s.id
                    WHERE po.id = $1
                `;
                
                const fullOrderResult = await pool.query(fullOrderQuery, [id]);
                const fullOrder = fullOrderResult.rows[0];
                
                // Fetch the items for this purchase order
                const itemsQuery = `
                    SELECT * FROM order_items 
                    WHERE order_id = $1
                `;
                const itemsResult = await pool.query(itemsQuery, [id]);
                fullOrder.items = itemsResult.rows;
                
                // Check if we have the vendor email
                const vendorEmail = fullOrder.supplier_email || req.body.vendorEmail;
                
                if (vendorEmail) {
                    // Import email service
                    const { sendPurchaseOrderEmail } = require('../utils/emailService');
                    
                    // Prepare email data
                    const emailData = {
                        to: vendorEmail,
                        subject: `Purchase Order ${fullOrder.order_number} Approved`,
                        message: `
                            <p>Dear ${fullOrder.supplier_name || 'Vendor'},</p>
                            <p>We are pleased to inform you that Purchase Order ${fullOrder.order_number} has been approved.</p>
                            <p>Order Details:</p>
                            <ul>
                                <li>PO Number: ${fullOrder.order_number}</li>
                                <li>Date: ${new Date(fullOrder.order_date || fullOrder.created_at).toLocaleDateString()}</li>
                                <li>Total Amount: $${parseFloat(fullOrder.total_amount || 0).toFixed(2)}</li>
                                <li>Status: Approved</li>
                            </ul>
                            <p>Please process this order as soon as possible.</p>
                            <p>Thank you for your partnership.</p>
                            <p>Best regards,<br>${req.body.username || 'Admin'}</p>
                        `
                    };
                    
                    // Send the email
                    await sendPurchaseOrderEmail(id, emailData);
                    
                    console.log(`Approval email sent to vendor ${vendorEmail} for PO ${fullOrder.order_number}`);
                } else {
                    console.warn(`Could not send approval email for PO ${fullOrder.order_number}: No vendor email found`);
                }
            } catch (emailError) {
                console.error('Error sending approval email to vendor:', emailError);
                // Don't stop the approval process if email fails
            }
        }
        
        // Emit socket event for status change notification
        socketIO.getIO().emit('po_status_update', {
            poId: updatedOrder.id,
            poNumber: updatedOrder.order_number,
            status: updatedOrder.status,
            updatedBy: req.body.username || 'Admin', // Use authenticated user info
            comments: comments
        });
        
        res.status(200).json({
            message: `Purchase order ${status} successfully`,
            purchaseOrder: updatedOrder
        });
    } catch (error) {
        console.error('Error updating purchase order status:', error);
        res.status(500).json({ message: 'Error updating purchase order status', error: error.message });
    }
});

// Delete a purchase order (soft delete or hard delete)
router.delete('/purchase-orders/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if we should implement soft delete instead
        // For now, this is a hard delete that removes the order and its items
        
        // Start a transaction
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Delete associated order items first (foreign key constraint)
            await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);
            
            // Delete the purchase order
            const deleteQuery = `DELETE FROM purchase_orders WHERE id = $1 RETURNING *`;
            const result = await client.query(deleteQuery, [id]);
            
            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Purchase order not found' });
            }
            
            await client.query('COMMIT');
            
            res.status(200).json({
                message: 'Purchase order deleted successfully',
                purchaseOrder: result.rows[0]
            });
            
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error deleting purchase order:', error);
        res.status(500).json({ message: 'Error deleting purchase order', error: error.message });
    }
});

module.exports = router; 