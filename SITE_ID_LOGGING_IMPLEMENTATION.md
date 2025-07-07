# Site ID Workflow Logging Implementation

## Overview
Comprehensive logging has been added throughout the entire `site_id` workflow to track exactly where and how `site_id` is handled from frontend to database.

## Logging Points Added

### 1. Frontend Site Selection (`frontend/src/contexts/SiteContext.jsx`)
```javascript
console.log('🔵 [SITE_CONTEXT] Setting selected site:', { 
  siteId: site.id, 
  siteName: site.name,
  timestamp: new Date().toISOString()
});
```
**Purpose:** Track when a user selects a site and `selectedSiteId` is stored in localStorage.

### 2. API Request Interceptor (`frontend/src/services/api.js`)
```javascript
console.log('🔵 [API_INTERCEPTOR] Request interceptor - siteId from localStorage:', {
  siteId: siteId,
  url: config.url,
  method: config.method,
  timestamp: new Date().toISOString()
});
```
**Purpose:** Track every API request and whether `siteId` is being added from localStorage.

### 3. PO Creation Frontend (`frontend/src/components/Orders/PurchaseOrders/CreatePO.jsx`)
```javascript
console.log('🔵 [CREATE_PO] Purchase order data being sent:', {
  siteName: siteName,
  site_id: localStorage.getItem('selectedSiteId'),
  supplier_id: purchaseOrderData.supplier_id,
  poNumber: poNumber,
  timestamp: new Date().toISOString()
});
```
**Purpose:** Track what data is being sent when creating a purchase order, including `site_id`.

### 4. Backend PO Creation via Site Name (`backend/routes/sites.routes.js`)
```javascript
console.log('🔴 [SITES_ROUTES] PO creation request received:', {
  siteName: siteName,
  body: req.body,
  timestamp: new Date().toISOString()
});

console.log('🔴 [SITES_ROUTES] Found site_id:', {
  siteName: siteName,
  siteId: siteId,
  timestamp: new Date().toISOString()
});

console.log('🔴 [SITES_ROUTES] About to insert PO with values:', {
  poNumber: req.body.poNumber,
  supplierId: req.body.supplierId || null,
  vendorName: vendorName,
  vendorEmail: req.body.vendor?.email || req.body.vendorEmail,
  totalAmount: totalAmount,
  status: req.body.status || 'pending',
  siteId: siteId,
  timestamp: new Date().toISOString()
});

console.log('🔴 [SITES_ROUTES] PO inserted successfully:', {
  poId: result.rows[0].id,
  poNumber: result.rows[0].po_number,
  siteId: result.rows[0].site_id,
  timestamp: new Date().toISOString()
});
```
**Purpose:** Track the entire PO creation process via site name, including site_id resolution and database insertion.

### 5. Backend PO Creation via Direct Route (`backend/routes/purchase-order.routes.js`)
```javascript
console.log('🔴 [PURCHASE_ORDER_ROUTES] POST /purchase-orders request received:', {
  body: req.body,
  timestamp: new Date().toISOString()
});

console.log('🔴 [PURCHASE_ORDER_ROUTES] Extracted site_id from request body:', {
  site_id: site_id,
  type: typeof site_id,
  timestamp: new Date().toISOString()
});

console.log('🔴 [PURCHASE_ORDER_ROUTES] About to insert PO with values:', {
  orderNumber: orderNumber,
  supplierId: supplierId,
  expectedDelivery: expected_delivery,
  status: status || 'pending',
  totalAmount: total_amount,
  notes: notes,
  vendorName: vendor_name,
  vendorEmail: vendor_email,
  contactPerson: contact_person,
  phoneNumber: phone_number,
  siteId: site_id,
  timestamp: new Date().toISOString()
});

console.log('🔴 [PURCHASE_ORDER_ROUTES] PO inserted successfully:', {
  poId: result.rows[0].id,
  poNumber: result.rows[0].po_number,
  siteId: result.rows[0].site_id,
  timestamp: new Date().toISOString()
});
```
**Purpose:** Track PO creation via the direct `/purchase-orders` route.

### 6. PO Retrieval (`backend/routes/purchase-order.routes.js`)
```javascript
console.log('🔴 [PURCHASE_ORDER_ROUTES] GET /purchase-orders request received:', {
  query: req.query,
  timestamp: new Date().toISOString()
});

console.log('🔴 [PURCHASE_ORDER_ROUTES] Extracted siteId from query:', {
  siteId: siteId,
  type: typeof siteId,
  timestamp: new Date().toISOString()
});
```
**Purpose:** Track PO retrieval requests and siteId extraction from query parameters.

### 7. Site Utils (`backend/utils/siteUtils.js`)
```javascript
console.log('🔴 [SITE_UTILS] Checking if site-specific tables should be used:', {
  siteId: siteId,
  type: typeof siteId,
  timestamp: new Date().toISOString()
});

console.log('🔴 [SITE_UTILS] Table strategy decision:', {
  siteId: siteId,
  useSiteTables: useSiteTables,
  timestamp: new Date().toISOString()
});
```
**Purpose:** Track table strategy decisions (site-specific vs main tables with site_id filter).

## Log Color Coding
- 🔵 **Blue**: Frontend operations
- 🔴 **Red**: Backend operations
- ⚠️ **Warning**: Missing or problematic data
- ❌ **Error**: Errors or failures

## How to Use This Logging

### 1. Create a New PO
1. Select a site in the frontend
2. Create a new purchase order
3. Check the console logs for the complete flow

### 2. Check Backend Logs
Monitor your backend console for logs starting with:
- `🔵 [SITE_CONTEXT]` - Site selection
- `🔵 [API_INTERCEPTOR]` - API requests
- `🔵 [CREATE_PO]` - Frontend PO creation
- `🔴 [SITES_ROUTES]` - Backend PO creation via site name
- `🔴 [PURCHASE_ORDER_ROUTES]` - Backend PO creation via direct route
- `🔴 [SITE_UTILS]` - Table strategy decisions

### 3. Identify Missing site_id
Look for:
- `⚠️ [API_INTERCEPTOR] No siteId found in localStorage`
- `❌ [SITES_ROUTES] Site not found in database`
- `❌ [PURCHASE_ORDER_ROUTES] No siteId provided in request`
- Any logs showing `siteId: null` or `siteId: undefined`

## Expected Flow for Working site_id

1. **Frontend Site Selection:**
   ```
   🔵 [SITE_CONTEXT] Setting selected site: { siteId: "18", siteName: "Amarillo Specialty Hospital" }
   ```

2. **API Request:**
   ```
   🔵 [API_INTERCEPTOR] Request interceptor - siteId from localStorage: { siteId: "18", url: "/sites/Amarillo%20Specialty%20Hospital/orders" }
   🔵 [API_INTERCEPTOR] Added siteId to request params: { siteId: "18" }
   ```

3. **Backend PO Creation:**
   ```
   🔴 [SITES_ROUTES] PO creation request received: { siteName: "Amarillo Specialty Hospital", body: {...} }
   🔴 [SITES_ROUTES] Found site_id: { siteName: "Amarillo Specialty Hospital", siteId: 18 }
   🔴 [SITES_ROUTES] About to insert PO with values: { siteId: 18, ... }
   🔴 [SITES_ROUTES] PO inserted successfully: { poId: 33, siteId: 18 }
   ```

## Troubleshooting

If `site_id` is missing, check these logs in order:

1. **Is site selected?** Look for `🔵 [SITE_CONTEXT]`
2. **Is siteId in localStorage?** Look for `🔵 [API_INTERCEPTOR]`
3. **Is siteId sent in request?** Look for `🔵 [CREATE_PO]`
4. **Is site found in DB?** Look for `🔴 [SITES_ROUTES]`
5. **Is siteId inserted?** Look for `🔴 [SITES_ROUTES] PO inserted successfully`

This comprehensive logging will help identify exactly where the `site_id` workflow breaks down. 