/**
 * Supplier Controller
 * Handles business logic for supplier operations
 */

const db = require('../database/db');

// Get all suppliers
const getAllSuppliers = async (req, res) => {
  try {
    // In development mode, if no database connection, return mock data
    if (!db.pool && process.env.NODE_ENV === 'development') {
      console.log('No database connection - using mock supplier data');
      return res.json(db.getMockSuppliers());
    }
    
    const result = await db.safeQuery(
      'SELECT id, name, contact_person, email, phone, address, website, tax_id, payment_terms, status, category FROM suppliers ORDER BY name'
    );
    
    // Development mode fallback
    if (process.env.NODE_ENV === 'development' && result.rows.length === 0) {
      return res.json(db.getMockSuppliers());
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    
    // Return mock data in development mode on error
    if (process.env.NODE_ENV === 'development') {
      console.log('Error in development mode - using mock supplier data');
      return res.json(db.getMockSuppliers());
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch suppliers', 
      error: error.message 
    });
  }
};

// Get a supplier by ID
const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT * FROM suppliers
      WHERE id = $1
    `;
    
    const result = await db.safeQuery(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Supplier not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching supplier', 
      error: error.message 
    });
  }
};

// Get a supplier by name
const getSupplierByName = async (req, res) => {
  try {
    const { name } = req.params;
    
    const query = `
      SELECT * FROM suppliers
      WHERE LOWER(name) = LOWER($1)
      OR LOWER(name) LIKE LOWER($2)
      ORDER BY name
      LIMIT 1
    `;
    
    const result = await db.safeQuery(query, [name, `%${name}%`]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Supplier not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching supplier by name:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching supplier by name', 
      error: error.message 
    });
  }
};

// Create a new supplier
const createSupplier = async (req, res) => {
  const { 
    name, 
    contact_person, 
    email, 
    phone, 
    address, 
    website, 
    tax_id, 
    payment_terms, 
    category,
    notes,
    rating,
    last_order_date 
  } = req.body;
  
  // Validate required fields
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Name and email are required fields'
    });
  }
  
  try {
    // First check if a supplier with the same email already exists
    const existingSupplier = await db.safeQuery(
      'SELECT id FROM suppliers WHERE email = $1',
      [email]
    );

    if (existingSupplier.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A supplier with this email already exists'
      });
    }

    // Create the new supplier
    const result = await db.safeQuery(
      `INSERT INTO suppliers (
        name, 
        contact_person, 
        email, 
        phone, 
        address, 
        website, 
        tax_id, 
        payment_terms,
        status,
        notes,
        category,
        rating,
        last_order_date,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        name, 
        contact_person || '', 
        email, 
        phone || '', 
        address || '', 
        website || '', 
        tax_id || '', 
        payment_terms || '',
        'active',
        notes || '',
        category || 'general',
        rating || null,
        last_order_date || null
      ]
    );

    // Log the successful creation
    console.log('Supplier created successfully:', result.rows[0]);
    
    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    
    // Send appropriate error response
    res.status(500).json({ 
      success: false,
      message: 'Failed to create supplier: ' + (error.message || 'Unknown error'),
      error: error.message
    });
  }
};

// Update a supplier
const updateSupplier = async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    contact_person, 
    email, 
    phone, 
    address, 
    website, 
    tax_id, 
    payment_terms, 
    category,
    status, 
    notes 
  } = req.body;
  
  try {
    const result = await db.safeQuery(
      `UPDATE suppliers 
       SET name = $1, 
           contact_person = $2, 
           email = $3, 
           phone = $4, 
           address = $5,
           website = $6, 
           tax_id = $7, 
           payment_terms = $8,
           category = $9,
           status = $10, 
           notes = $11,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [
        name, 
        contact_person, 
        email, 
        phone, 
        address, 
        website, 
        tax_id, 
        payment_terms,
        category || 'general',
        status, 
        notes, 
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update supplier', 
      error: error.message 
    });
  }
};

// Delete a supplier (soft delete)
const deleteSupplier = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await db.safeQuery(
      `UPDATE suppliers 
       SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    res.json({ 
      success: true,
      message: 'Supplier deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete supplier', 
      error: error.message 
    });
  }
};

// Get supplier statistics
const getSupplierStats = async (req, res) => {
  try {
    // Get active supplier count
    const activeSupplierResult = await db.safeQuery(
      'SELECT COUNT(*) FROM suppliers WHERE status = $1',
      ['active']
    );
    
    // Get contract count (placeholder - would need proper contract table)
    const contractCount = 28; // Placeholder
    
    // Get average supplier rating (placeholder)
    const avgRating = 4.2; // Placeholder
    
    // Get transaction count from purchase orders
    const transactionResult = await db.safeQuery(
      'SELECT COUNT(*) FROM purchase_orders'
    );
    
    res.json({
      success: true,
      data: {
        activeSuppliers: parseInt(activeSupplierResult.rows[0].count),
        contracts: contractCount,
        avgRating: avgRating,
        transactions: parseInt(transactionResult.rows[0].count || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching supplier stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier statistics',
      error: error.message
    });
  }
};

// Get supplier products
const getSupplierProducts = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Placeholder - would need proper product-supplier relationship table
    res.json({
      success: true,
      data: [
        { id: 1, name: 'Product 1', price: 99.99, category: 'Hardware' },
        { id: 2, name: 'Product 2', price: 199.99, category: 'Hardware' },
        { id: 3, name: 'Product 3', price: 299.99, category: 'Software' }
      ]
    });
  } catch (error) {
    console.error('Error fetching supplier products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier products',
      error: error.message
    });
  }
};

// Add product to supplier
const addSupplierProduct = async (req, res) => {
  const { id } = req.params;
  const { productId, price } = req.body;
  
  try {
    // Placeholder - would need proper product-supplier relationship table
    res.status(201).json({
      success: true,
      message: 'Product added to supplier successfully',
      data: {
        supplierId: id,
        productId,
        price
      }
    });
  } catch (error) {
    console.error('Error adding product to supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product to supplier',
      error: error.message
    });
  }
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  getSupplierByName,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierStats,
  getSupplierProducts,
  addSupplierProduct
}; 