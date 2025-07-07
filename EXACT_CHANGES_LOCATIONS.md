# Exact Changes Locations - Line by Line Guide

## 🎯 File-by-File Change Locations

---

## 1. `backend/database/schema.js`

### **Location:** Around line 274-294
### **Find this code block:**
```sql
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
```

### **Replace with:**
```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES purchase_orders(id),
    item_type VARCHAR(50),
    item_id INTEGER,
    name VARCHAR(255),
    quantity INTEGER,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. `backend/database/migrate.js` (NEW FILE)

### **Create this entire file:**
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

---

## 3. `backend/routes/purchase-order.routes.js`

### **Location:** Around line 1070-1120 (in the POST /purchase-orders route)

### **Find this code block:**
```javascript
// Insert the items if provided
if (req.body.items && req.body.items.length > 0) {
  console.log(`Processing ${req.body.items.length} items for order ${purchaseOrder.id}`);
  
  for (const item of req.body.items) {
    console.log('Processing item:', item);
    
    // For integer item_id, extract numeric part or use null
    let itemId = null;
    if (item.id || item.item_id) {
      const rawItemId = item.id || item.item_id;
      
      if (itemIdType === 'integer') {
        // If item_id is integer type, try to extract numeric part
        const numericMatch = String(rawItemId).match(/\d+/);
        itemId = numericMatch ? parseInt(numericMatch[0]) : null;
      } else {
        // Otherwise use as is (for varchar/text columns)
        itemId = String(rawItemId);
      }
    }
    
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
    
    console.log('Inserting item with values:', itemValues);
    await client.query(insertItemQuery, itemValues);
  }
}
```

### **Replace with:**
```javascript
// Insert the items if provided
if (req.body.items && req.body.items.length > 0) {
  console.log(`Processing ${req.body.items.length} items for order ${purchaseOrder.id}`);
  
  for (const item of req.body.items) {
    console.log('Processing item:', item);
    
    // For integer item_id, extract numeric part or use null
    let itemId = null;
    if (item.id || item.item_id) {
      const rawItemId = item.id || item.item_id;
      
      if (itemIdType === 'integer') {
        // If item_id is integer type, try to extract numeric part
        const numericMatch = String(rawItemId).match(/\d+/);
        itemId = numericMatch ? parseInt(numericMatch[0]) : null;
      } else {
        // Otherwise use as is (for varchar/text columns)
        itemId = String(rawItemId);
      }
    }
    
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
        item.name || item.device_model || item.sku || 'Unnamed Item',
        parseInt(item.quantity) || 0,
        parseFloat(item.price || item.unit_price) || 0,
        parseFloat((item.quantity || 0) * (item.price || item.unit_price || 0)) || 0,
        item.description || item.notes || ''
      ];
    } else {
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
    
    console.log('Inserting item with values:', itemValues);
    await client.query(insertItemQuery, itemValues);
  }
}
```

---

## 4. `frontend/src/components/Orders/PurchaseOrders/POApprovals.jsx`

### **Location 1:** Around line 360-380 (fetchCompletePoDetails function)

### **Find this code block:**
```javascript
const items = (response.data.items || []).map(item => {
  const quantity = convertToNumber(item.quantity);
  const unitPrice = convertToNumber(item.unit_price || item.price);
  
  return {
    id: item.id || Math.random().toString(36).substr(2, 9),
    sku: item.sku || item.id || 'SKU-' + Math.floor(Math.random() * 10000),
    name: item.name,
    description: item.description || item.notes || 'No description available',
    quantity: quantity,
    unitPrice: unitPrice
  };
});
```

### **Replace with:**
```javascript
const items = (response.data.items || []).map(item => {
  const quantity = convertToNumber(item.quantity);
  const unitPrice = convertToNumber(item.unit_price || item.price);
  
  return {
    id: item.id || Math.random().toString(36).substr(2, 9),
    sku: item.sku || item.id || 'SKU-' + Math.floor(Math.random() * 10000),
    name: item.name || item.device_model || item.sku || 'Unnamed Item',
    description: item.description || item.notes || item.name || 'No description available',
    quantity: quantity,
    unitPrice: unitPrice
  };
});
```

### **Location 2:** Around line 430-450 (convertToPoDocFormat function)

### **Find this code block:**
```javascript
const items = (po.items || []).map(item => ({
  id: item.id || Math.random().toString(36).substr(2, 9),
  sku: item.id || item.sku || 'SKU' + Math.floor(Math.random() * 1000),
  name: item.description,
  quantity: convertToNumber(item.quantity),
  unitPrice: convertToNumber(item.unit_price || item.price),
}));
```

### **Replace with:**
```javascript
const items = (po.items || []).map(item => ({
  id: item.id || Math.random().toString(36).substr(2, 9),
  sku: item.id || item.sku || 'SKU' + Math.floor(Math.random() * 1000),
  name: item.name || item.device_model || item.sku || 'Unnamed Item',
  description: item.description || item.notes || item.name || 'No description available',
  quantity: convertToNumber(item.quantity),
  unitPrice: convertToNumber(item.unit_price || item.price),
}));
```

---

## 5. `frontend/src/components/Orders/PurchaseOrders/PODocument.jsx`

### **Location:** Around line 300-320 (in the items table body)

### **Find this code block:**
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

### **Replace with:**
```javascript
<td style={{ padding: '10px 15px', verticalAlign: 'top' }}>
  <div style={{ wordWrap: 'break-word' }}>
    <span style={{ fontWeight: '500' }}>
      {item.name || item.device_model || item.sku || 'Unnamed Item'}
    </span>
    {(item.description && item.description !== item.name) && (
      <div style={{ marginTop: '4px', color: '#666', fontSize: '11px' }}>
        {item.description}
      </div>
    )}
  </div>
</td>
```

---

## 6. `frontend/src/components/Orders/PurchaseOrders/CreatePO.jsx`

### **Location:** Around line 760-780 (handleSendForApproval function)

### **Find this code block:**
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

### **Replace with:**
```javascript
items: formData.items.map(item => ({
  name: item.name,
  device_model: item.device_model || '',
  sku: item.sku || '',
  item_type: 'product',
  quantity: parseInt(item.quantity),
  unit_price: parseFloat(item.price),
  total_price: parseFloat(item.price) * parseInt(item.quantity),
  notes: item.description || ''
})),
```

---

## 🚀 **Deployment Steps**

### **Step 1: Database Migration**
```bash
# In your backend directory
node database/migrate.js
```

### **Step 2: Restart Backend**
```bash
# Stop and restart your backend server
npm start
```

### **Step 3: Rebuild Frontend**
```bash
# In your frontend directory
npm run build
```

---

## ✅ **Verification**

After making all changes, test by:
1. Creating a new PO with items
2. Viewing the PO in approvals tab
3. Checking that product names display correctly in PDF
4. Verifying API responses have proper name/description fields

---

## 📝 **Notes**
- Line numbers are approximate - search for the code blocks to find exact locations
- All changes are backward compatible
- The migration script will handle existing data
- Make sure to test thoroughly in a staging environment first 