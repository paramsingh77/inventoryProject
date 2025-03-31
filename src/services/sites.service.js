const getSites = async () => {
  try {
    const response = await fetch('/api/sites');
    if (!response.ok) {
      throw new Error('Failed to fetch sites');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching sites:', error);
    throw error;
  }
};

const MOCK_ORDERS = {
  'Amarillo Specialty Hospital': [
    { id: 1, po_number: 'PO-123', vendor: 'Medical Supplies Inc.', total: 1200.50, status: 'pending', date: '2023-10-15' },
    { id: 2, po_number: 'PO-124', vendor: 'Tech Solutions', total: 3500.00, status: 'approved', date: '2023-10-10' },
  ],
  'Default': [
    { id: 3, po_number: 'PO-TEST-001', vendor: 'Test Vendor', total: 1000.00, status: 'pending', date: '2023-10-20' },
  ]
};

const getSiteOrders = async (siteName) => {
  // For testing - simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Return mock data
  return MOCK_ORDERS[siteName] || MOCK_ORDERS['Default'];
  
  // Comment out the mock code and uncomment the real implementation when ready
  /*
  try {
    if (!siteName) {
      throw new Error('Site name is required');
    }
    
    const response = await fetch(`/api/sites/${siteName}/orders`);
    if (!response.ok) {
      throw new Error(`Failed to fetch orders for site ${siteName}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching orders for site ${siteName}:`, error);
    throw error;
  }
  */
};

export const sitesService = {
  getSites,
  getSiteOrders
};

export default sitesService; 