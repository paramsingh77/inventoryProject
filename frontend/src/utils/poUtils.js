/**
 * Utility functions for Purchase Order data normalization and preparation
 */

/**
 * Normalizes PO data from API response to ensure consistent structure
 * Fills in vendor, vendor.address, and items if missing
 * Maps legacy flat fields into proper nested objects
 * 
 * @param {Object} po - Raw PO data from API
 * @returns {Object} Normalized PO data with consistent structure
 */
export const normalizePOFromAPI = (po) => {
  if (!po) return null;

  // Helper function to safely convert to number
  const toNumber = (val) => {
    if (val === null || val === undefined) return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  // Helper function to safely get string value
  const toString = (val) => {
    if (val === null || val === undefined) return '';
    return String(val).trim();
  };

  // Helper function to parse address string into components
  const parseAddress = (addressString) => {
    if (!addressString || typeof addressString !== 'string') {
      return {
        street: '123 Vendor Street',
        city: 'City',
        state: 'State',
        zip: '12345',
        country: 'USA',
        full: '123 Vendor Street, City, State 12345'
      };
    }
    
    const parts = addressString.split(',').map(part => part.trim());
    return {
      street: parts[0] || '123 Vendor Street',
      city: parts[1] || 'City',
      state: parts[2] || 'State',
      zip: parts[3] || '12345',
      country: parts[4] || 'USA',
      full: addressString
    };
  };

  // Normalize vendor data - prioritize nested vendor object, fall back to flat fields
  const vendor = po.vendor || {};
  const vendorAddress = vendor.address || {};
  
  // Parse address from various sources
  const addressFromString = parseAddress(po.vendor_address || po.address || vendorAddress.full);
  
  const normalizedVendor = {
    name: toString(vendor.name || po.vendor_name || po.supplier_name || 'Vendor Not Available'),
    companyName: toString(vendor.companyName || po.vendor_company || po.company_name || po.vendor_name || po.supplier_name || 'Company Not Available'),
    contactPerson: toString(vendor.contactPerson || po.contact_person || po.contact_name || po.vendor_name || 'Contact Not Available'),
    email: toString(vendor.email || po.vendor_email || po.email || po.supplier_email || 'Email Not Available'),
    phone: toString(vendor.phone || po.phone_number || po.vendor_phone || po.phone || po.supplier_phone || 'Phone Not Available'),
    address: {
      street: toString(vendorAddress.street || po.vendor_street || addressFromString.street),
      city: toString(vendorAddress.city || po.vendor_city || addressFromString.city),
      state: toString(vendorAddress.state || po.vendor_state || addressFromString.state),
      zip: toString(vendorAddress.zip || po.vendor_zip || addressFromString.zip),
      country: toString(vendorAddress.country || po.vendor_country || addressFromString.country),
      full: toString(vendorAddress.full || po.vendor_address || po.address || addressFromString.full)
    }
  };

  // Normalize items data - ensure consistent field names
  const normalizedItems = (po.items || []).map((item, index) => ({
    id: item.id || `item-${index}`,
    sku: toString(item.sku || item.id || `SKU-${index}`),
    name: toString(item.name || item.device_model || item.product_name || item.sku || 'Unnamed Item'),
    description: toString(item.description || item.notes || item.name || 'No description available'),
    quantity: toNumber(item.quantity),
    unitPrice: toNumber(item.unit_price || item.price || item.unitPrice),
    productLink: toString(item.productLink || item.product_link || ''),
    // Calculate item total
    total: toNumber(item.quantity) * toNumber(item.unit_price || item.price || item.unitPrice)
  }));

  // Return normalized PO object
  return {
    id: po.id,
    poNumber: toString(po.poNumber || po.order_number || po.id),
    createdAt: po.created_at || po.createdAt || new Date().toISOString(),
    updatedAt: po.updated_at || po.updatedAt,
    status: toString(po.status || 'pending'),
    vendor: normalizedVendor,
    items: normalizedItems,
    // Preserve original fields for backward compatibility
    vendor_name: normalizedVendor.name,
    vendor_email: normalizedVendor.email,
    contact_person: normalizedVendor.contactPerson,
    phone_number: normalizedVendor.phone,
    vendor_address: normalizedVendor.address.full,
    // Financial fields (will be calculated in preparePOForPdf)
    subtotal: toNumber(po.subtotal),
    tax: toNumber(po.tax),
    taxRate: toNumber(po.taxRate || po.tax_rate || 10),
    shippingFees: toNumber(po.shippingFees || po.shipping_fees || po.shipping_fee),
    totalAmount: toNumber(po.totalAmount || po.total_amount || po.total),
    // Other fields
    paymentTerms: toString(po.paymentTerms || po.payment_terms || 'Net 30'),
    deliveryDate: po.deliveryDate || po.expected_delivery || po.delivery_date || new Date(Date.now() + 14*24*60*60*1000).toISOString(),
    shippingTerms: toString(po.shippingTerms || po.shipping_terms || 'Standard Delivery'),
    shippingMethod: toString(po.shippingMethod || po.shipping_method || 'Ground'),
    termsAndConditions: toString(po.termsAndConditions || po.terms || 'Standard terms and conditions apply.'),
    requestedBy: toString(po.requestedBy || po.ordered_by_name || po.username || 'Admin'),
    notes: toString(po.notes || ''),
    // Site information
    site_id: po.site_id,
    site_name: toString(po.site_name || ''),
    // Supplier information (for backward compatibility)
    supplier: po.supplier || {
      id: po.supplier_id,
      name: normalizedVendor.name,
      email: normalizedVendor.email,
      contact_person: normalizedVendor.contactPerson,
      phone: normalizedVendor.phone,
      address: normalizedVendor.address.full
    }
  };
};

/**
 * Prepares PO data for PDF rendering by calculating financials and ensuring all required fields
 * 
 * @param {Object} po - Normalized PO data
 * @returns {Object} Enriched PO data ready for PDF rendering
 */
export const preparePOForPdf = (po) => {
  if (!po) return null;

  // Helper function to safely convert to number
  const toNumber = (val) => {
    if (val === null || val === undefined) return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  // Calculate subtotal from items
  const calculatedSubtotal = (po.items || []).reduce((sum, item) => {
    const quantity = toNumber(item.quantity);
    const unitPrice = toNumber(item.unitPrice);
    return sum + (quantity * unitPrice);
  }, 0);

  // Use provided subtotal if it's greater than 0, otherwise use calculated
  const subtotal = toNumber(po.subtotal) > 0 ? toNumber(po.subtotal) : calculatedSubtotal;
  
  // Calculate tax (default 10%)
  const taxRate = toNumber(po.taxRate || 10);
  const tax = toNumber(po.tax) > 0 ? toNumber(po.tax) : (subtotal * (taxRate / 100));
  
  // Calculate shipping fees (default $50)
  const shippingFees = toNumber(po.shippingFees) > 0 ? toNumber(po.shippingFees) : 50;
  
  // Calculate total amount
  const calculatedTotal = subtotal + tax + shippingFees;
  const totalAmount = toNumber(po.totalAmount) > 0 ? toNumber(po.totalAmount) : calculatedTotal;

  // Ensure vendor object is complete
  const vendor = po.vendor || {};
  const enrichedVendor = {
    name: vendor.name || 'Vendor Not Available',
    companyName: vendor.companyName || vendor.name || 'Company Not Available',
    contactPerson: vendor.contactPerson || vendor.name || 'Contact Not Available',
    email: vendor.email || 'Email Not Available',
    phone: vendor.phone || 'Phone Not Available',
    address: {
      street: vendor.address?.street || '123 Vendor Street',
      city: vendor.address?.city || 'City',
      state: vendor.address?.state || 'State',
      zip: vendor.address?.zip || '12345',
      country: vendor.address?.country || 'USA',
      full: vendor.address?.full || '123 Vendor Street, City, State 12345'
    }
  };

  // Ensure items have all required fields
  const enrichedItems = (po.items || []).map((item, index) => ({
    id: item.id || `item-${index}`,
    sku: item.sku || `SKU-${index}`,
    name: item.name || 'Unnamed Item',
    description: item.description || item.name || 'No description available',
    quantity: toNumber(item.quantity),
    unitPrice: toNumber(item.unitPrice),
    productLink: item.productLink || '',
    // Recalculate item total
    total: toNumber(item.quantity) * toNumber(item.unitPrice)
  }));

  // Return enriched PO object ready for PDF rendering
  return {
    // Basic PO information
    id: po.id,
    poNumber: po.poNumber || `PO-${Date.now()}`,
    createdAt: po.createdAt || new Date().toISOString(),
    updatedAt: po.updatedAt,
    status: po.status || 'pending',
    
    // Vendor information
    vendor: enrichedVendor,
    
    // Items
    items: enrichedItems,
    
    // Financial calculations
    subtotal: subtotal,
    tax: tax,
    taxRate: taxRate,
    shippingFees: shippingFees,
    totalAmount: totalAmount,
    
    // Terms and conditions
    paymentTerms: po.paymentTerms || 'Net 30',
    deliveryDate: po.deliveryDate || new Date(Date.now() + 14*24*60*60*1000).toISOString(),
    shippingTerms: po.shippingTerms || 'Standard Delivery',
    shippingMethod: po.shippingMethod || 'Ground',
    termsAndConditions: po.termsAndConditions || 'Standard terms and conditions apply.',
    
    // Request information
    requestedBy: po.requestedBy || 'Admin',
    notes: po.notes || '',
    
    // Company information (for PDF header)
    companyName: 'AAM Inventory',
    companyAddress: '700 17th Street, Modesto, CA 95354',
    department: 'IT Department',
    
    // Backward compatibility fields
    vendor_name: enrichedVendor.name,
    vendor_email: enrichedVendor.email,
    contact_person: enrichedVendor.contactPerson,
    phone_number: enrichedVendor.phone,
    vendor_address: enrichedVendor.address.full,
    
    // Site information
    site_id: po.site_id,
    site_name: po.site_name,
    
    // Supplier information
    supplier: po.supplier || {
      id: po.supplier_id,
      name: enrichedVendor.name,
      email: enrichedVendor.email,
      contact_person: enrichedVendor.contactPerson,
      phone: enrichedVendor.phone,
      address: enrichedVendor.address.full
    }
  };
};

/**
 * Complete PO processing pipeline - normalizes and prepares PO data for PDF rendering
 * 
 * @param {Object} po - Raw PO data from API
 * @returns {Object} Fully processed PO data ready for PDF rendering
 */
export const processPOForPdf = (po) => {
  const normalized = normalizePOFromAPI(po);
  return preparePOForPdf(normalized);
}; 