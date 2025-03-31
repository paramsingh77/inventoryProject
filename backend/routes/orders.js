// Add a route to get orders for a specific site
router.get('/api/sites/:siteName/orders', async (req, res) => {
  try {
    const { siteName } = req.params;
    
    // You'll need to implement this function based on your database structure
    const orders = await getOrdersForSite(siteName);
    
    res.json(orders);
  } catch (error) {
    console.error(`Error fetching orders for site ${req.params.siteName}:`, error);
    res.status(500).json({ 
      error: 'Failed to load site orders',
      message: error.message
    });
  }
}); 