# Product Name and Description Fixes - Complete Change Log

## 🎯 Problem Summary
The PO PDF was showing "Unnamed Item" and "No description available" instead of actual product names and descriptions.

## 🔍 Root Cause Analysis
1. **Database Schema Issue**: `order_items` table was missing a `name` column
2. **Backend Logic Issue**: Product names were being concatenated into `notes` field
3. **Frontend Logic Issue**: Incorrect data mapping and fallback logic

---

## 📋 Complete List of Changes Made

### 1. Database Schema Changes

#### File: `backend/database/schema.js`
**Lines:** ~274-294
```sql
-- BEFORE:
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES purchase_orders(id),
    item_type VARCHAR(50),
    item_id INTEGER,
    quantity INTEGER,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AFTER:
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES purchase_orders(id),
    item_type VARCHAR(50),
    item_id INTEGER,
    name VARCHAR(255), // ✅ ADDED: name column for product names
    quantity INTEGER,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Database Migration Script

#### File: `backend/database/migrate.js` (NEW FILE)
```javascript
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrateOrderItems() {
    const client = await pool.connect();
    try {
        console.log('Starting migration: Adding name column to order_items table...');
        
        // Check if name column already exists
        const columnCheck = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'order_items' AND column_name = 'name'
        `);
        
        if (columnCheck.rows.length === 0) {
            // Add the name column
            await client.query(`
                ALTER TABLE order_items 
                ADD COLUMN name VARCHAR(255)
            `);
            console.log('✅ Successfully added name column to order_items table');
            
            // Update existing records to extract name from notes
            const updateResult = await client.query(`
                UPDATE order_items 
                SET name = CASE 
                    WHEN notes LIKE '%:%' THEN 
                        SPLIT_PART(notes, ':', 1)
                    ELSE 
                        COALESCE(notes, 'Unnamed Item')
                END
                WHERE name IS NULL
            `);
            console.log(`✅ Updated ${updateResult.rowCount} existing records`);
            
        } else {
            console.log('ℹ️  name column already exists in order_items table');
        }
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migrateOrderItems()
        .then(() => {
            console.log('✅ Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateOrderItems };
```

### 3. Backend Route Changes

#### File: `backend/routes/purchase-order.routes.js`
**Lines:** ~1070-1120 (POST /purchase-orders route)

**BEFORE:**
```javascript
// Insert the items if provided
if (req.body.items && req.body.items.length > 0) {
  for (const item of req.body.items) {
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
    const itemValues = [
      purchaseOrder.id,
      item.type || item.item_type || 'product',
      itemId,
      parseInt(item.quantity) || 0,
      parseFloat(item.price || item.unit_price) || 0,
      parseFloat((item.quantity || 0) * (item.price || item.unit_price || 0)) || 0,
      (item.name || item.device_model || item.sku || 'Unnamed Item') + (item.description ? (': ' + item.description) : '')
    ];
  }
}
```

**AFTER:**
```javascript
// Insert the items if provided
if (req.body.items && req.body.items.length > 0) {
  for (const item of req.body.items) {
    // Check if 'name' column exists in order_items
    const nameColumnCheck = await client.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'name'`);
    const hasNameColumn = nameColumnCheck.rows.length > 0;
    
    let insertItemQuery, itemValues;
    if (hasNameColumn) {
      insertItemQuery = `
        INSERT INTO order_items (
          order_id,
          item_type,
          item_id,
          name,
          quantity,
          unit_price,
          total_price,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      itemValues = [
        purchaseOrder.id,
        item.type || item.item_type || 'product',
        itemId,
        item.name || item.device_model || item.sku || 'Unnamed Item', // ✅ SAVE NAME SEPARATELY
        parseInt(item.quantity) || 0,
        parseFloat(item.price || item.unit_price) || 0,
        parseFloat((item.quantity || 0) * (item.price || item.unit_price || 0)) || 0,
        item.description || item.notes || '' // ✅ SAVE DESCRIPTION IN NOTES
      ];
    } else {
      // Fallback for old schema
      insertItemQuery = `
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
      itemValues = [
        purchaseOrder.id,
        item.type || item.item_type || 'product',
        itemId,
        parseInt(item.quantity) || 0,
        parseFloat(item.price || item.unit_price) || 0,
        parseFloat((item.quantity || 0) * (item.price || item.unit_price || 0)) || 0,
        (item.name || item.device_model || item.sku || 'Unnamed Item') + (item.description ? (': ' + item.description) : '')
      ];
    }
  }
}
```

### 4. Frontend Data Mapping Changes

#### File: `frontend/src/components/Orders/PurchaseOrders/POApprovals.jsx`

**Lines:** ~360-380 (fetchCompletePoDetails function)
**BEFORE:**
```javascript
const items = (response.data.items || []).map(item => {
  const quantity = convertToNumber(item.quantity);
  const unitPrice = convertToNumber(item.unit_price || item.price);
  
  return {
    id: item.id || Math.random().toString(36).substr(2, 9),
    sku: item.sku || item.id || 'SKU-' + Math.floor(Math.random() * 10000),
    name: item.name, // ❌ No fallback
    description: item.description || item.notes || 'No description available',
    quantity: quantity,
    unitPrice: unitPrice
  };
});
```

**AFTER:**
```javascript
const items = (response.data.items || []).map(item => {
  const quantity = convertToNumber(item.quantity);
  const unitPrice = convertToNumber(item.unit_price || item.price);
  
  return {
    id: item.id || Math.random().toString(36).substr(2, 9),
    sku: item.sku || item.id || 'SKU-' + Math.floor(Math.random() * 10000),
    // ✅ FIXED: Use name field with proper fallbacks
    name: item.name || item.device_model || item.sku || 'Unnamed Item',
    description: item.description || item.notes || item.name || 'No description available',
    quantity: quantity,
    unitPrice: unitPrice
  };
});
```

**Lines:** ~430-450 (convertToPoDocFormat function)
**BEFORE:**
```javascript
const items = (po.items || []).map(item => ({
  id: item.id || Math.random().toString(36).substr(2, 9),
  sku: item.id || item.sku || 'SKU' + Math.floor(Math.random() * 1000),
  name: item.description, // ❌ WRONG: Using description as name
  quantity: convertToNumber(item.quantity),
  unitPrice: convertToNumber(item.unit_price || item.price),
}));
```

**AFTER:**
```javascript
const items = (po.items || []).map(item => ({
  id: item.id || Math.random().toString(36).substr(2, 9),
  sku: item.id || item.sku || 'SKU' + Math.floor(Math.random() * 1000),
  // ✅ FIXED: Use name field for product name, not description
  name: item.name || item.device_model || item.sku || 'Unnamed Item',
  description: item.description || item.notes || item.name || 'No description available',
  quantity: convertToNumber(item.quantity),
  unitPrice: convertToNumber(item.unit_price || item.price),
}));
```

### 5. Frontend Display Changes

#### File: `frontend/src/components/Orders/PurchaseOrders/PODocument.jsx`
**Lines:** ~300-320 (Product Description column)
**BEFORE:**
```javascript
<td style={{ padding: '10px 15px', verticalAlign: 'top' }}>
  <div style={{ wordWrap: 'break-word' }}>
    <span style={{ fontWeight: '500' }}>{item.description}</span>
    {item.description && (
      <div style={{ marginTop: '4px', color: '#666', fontSize: '11px' }}>
        {item.description}
      </div>
    )}
  </div>
</td>
```

**AFTER:**
```javascript
<td style={{ padding: '10px 15px', verticalAlign: 'top' }}>
  <div style={{ wordWrap: 'break-word' }}>
    {/* ✅ FIXED: Display product name with fallbacks */}
    <span style={{ fontWeight: '500' }}>
      {item.name || item.device_model || item.sku || 'Unnamed Item'}
    </span>
    {/* Show description if available and different from name */}
    {(item.description && item.description !== item.name) && (
      <div style={{ marginTop: '4px', color: '#666', fontSize: '11px' }}>
        {item.description}
      </div>
    )}
  </div>
</td>
```

### 6. PO Creation Changes

#### File: `frontend/src/components/Orders/PurchaseOrders/CreatePO.jsx`
**Lines:** ~760-780 (handleSendForApproval function)
**BEFORE:**
```javascript
items: formData.items.map(item => ({
  name: item.name,
  item_type: 'product',
  quantity: parseInt(item.quantity),
  unit_price: parseFloat(item.price),
  total_price: parseFloat(item.price) * parseInt(item.quantity),
  notes: item.description || ''
})),
```

**AFTER:**
```javascript
items: formData.items.map(item => ({
  name: item.name, // Always include product name
  device_model: item.device_model || '', // Ensure device_model is present
  sku: item.sku || '', // Ensure sku is present
  item_type: 'product',
  quantity: parseInt(item.quantity),
  unit_price: parseFloat(item.price),
  total_price: parseFloat(item.price) * parseInt(item.quantity),
  notes: item.description || ''
})),
```

---

## 🚀 Deployment Steps for Production

### Step 1: Database Migration
```bash
# 1. Create the migration file
# 2. Run the migration
node database/migrate.js
```

### Step 2: Backend Changes
1. Update `backend/database/schema.js` - Add name column to order_items table
2. Update `backend/routes/purchase-order.routes.js` - Fix item insertion logic
3. Restart backend server

### Step 3: Frontend Changes
1. Update `frontend/src/components/Orders/PurchaseOrders/POApprovals.jsx` - Fix data mapping
2. Update `frontend/src/components/Orders/PurchaseOrders/PODocument.jsx` - Fix display logic
3. Update `frontend/src/components/Orders/PurchaseOrders/CreatePO.jsx` - Ensure all fields are sent
4. Rebuild frontend

### Step 4: Testing
1. Create a new PO with items
2. View the PO in approvals tab
3. Verify product names and descriptions display correctly in PDF
4. Check API responses for proper name/description fields

---

## ✅ Expected Results After Fixes

1. **New POs**: Product names saved in `name` column, descriptions in `notes` column
2. **Existing POs**: Names extracted from notes and saved in `name` column
3. **PDF Display**: Shows actual product names instead of "Unnamed Item"
4. **API Responses**: Returns proper `name` and `description` fields
5. **Frontend**: Proper fallback logic for missing data

---

## 🔍 Verification Commands

```bash
# Check database structure
node -e "const { Pool } = require('pg'); require('dotenv').config(); const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false }); pool.query('SELECT column_name FROM information_schema.columns WHERE table_name = \\'order_items\\' ORDER BY ordinal_position').then(result => { console.log('order_items columns:'); console.table(result.rows); pool.end(); });"

# Check sample data
node -e "const { Pool } = require('pg'); require('dotenv').config(); const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false }); pool.query('SELECT id, order_id, name, notes FROM order_items LIMIT 3').then(result => { console.log('Sample order_items data:'); console.table(result.rows); pool.end(); });"
```

---

## 📝 Notes
- All changes are backward compatible
- Existing data is preserved and migrated
- Fallback logic ensures graceful handling of missing data
- The fixes address the root cause at database, backend, and frontend levels 