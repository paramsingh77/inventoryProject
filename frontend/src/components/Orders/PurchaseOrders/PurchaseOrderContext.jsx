const fetchPurchaseOrders = async () => {
  try {
    // Make sure this URL matches what's defined in your backend routes
    const response = await axios.get('/api/purchase-orders');
    // ... rest of the function
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    // ... error handling
  }
}; 