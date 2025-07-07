# Purchase Order Column Fix Documentation

## Issue Summary

**Error**: `null value in column "po_number" of relation "purchase_orders" violates not-null constraint`

## Root Cause Analysis

The error occurred due to a **database schema inconsistency** where the actual database table had both `po_number` and `order_number` columns, both with NOT NULL constraints, but the application code was only inserting into one of them.

### Database Schema Reality
The actual `purchase_orders` table contains:
- `po_number` (character varying) - **NOT NULL** - No default value
- `order_number` (character varying) - **NOT NULL** - Default: ('PO-'::text || (nextval('purchase_orders_id_seq'::regclass))::text)

### Code Issue
The application code was trying to insert only into `order_number` but not providing a value for `po_number`, which violated the NOT NULL constraint.

## Solution Implemented

### Approach: Backward Compatibility
Instead of removing the redundant column (which could break existing data), we updated all INSERT queries to include both columns with the same value.

### Files Modified

1. **`backend/routes/purchase-order.routes.js`**
   - Updated main purchase order creation INSERT query
   - Updated email processing INSERT query
   - Fixed SELECT queries to use correct column names

2. **`backend/routes/sites.routes.js`**
   - Updated site-specific order creation INSERT query
   - Fixed SELECT queries to use correct column names

3. **`backend/routes/site.routes.js`**
   - Updated site-specific order creation INSERT query
   - Fixed SELECT queries to use correct column names

### Code Changes Pattern

**Before:**
```sql
INSERT INTO purchase_orders (
  order_number,
  vendor_name,
  -- other columns...
)
VALUES ($1, $2, ...)
```

**After:**
```sql
INSERT INTO purchase_orders (
  po_number,
  order_number,
  vendor_name,
  -- other columns...
)
VALUES ($1, $2, $3, ...)
```

**Values Array:**
```javascript
const orderValues = [
  orderNumber,  // po_number
  orderNumber,  // order_number (same value for both columns)
  // other values...
];
```

## Testing

Created and ran a comprehensive test that:
1. ✅ Successfully creates a purchase order with both columns
2. ✅ Verifies the order is properly stored in the database
3. ✅ Cleans up test data
4. ✅ Confirms no constraint violations occur

## Impact

- **Positive**: Purchase order creation now works without constraint violations
- **Backward Compatible**: Existing data and functionality preserved
- **Future-Proof**: Both columns are populated, allowing for future schema migrations if needed

## Recommendations

1. **Short-term**: The current fix resolves the immediate issue
2. **Long-term**: Consider creating a database migration to:
   - Remove the redundant `po_number` column
   - Update all references to use only `order_number`
   - This would require careful planning and testing

## Files Affected

- `backend/routes/purchase-order.routes.js`
- `backend/routes/sites.routes.js` 
- `backend/routes/site.routes.js`

## Verification

The fix has been tested and verified to work correctly. Purchase orders can now be created without constraint violations. 