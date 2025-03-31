// Add this endpoint for order history
router.get('/purchase-orders/history', async (req, res) => {
  try {
    const query = `
      SELECT 
        po.id,
        po.created_at,
        po.customer_name,
        po.status,
        po.payment_status,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total
      FROM purchase_orders po
      LEFT JOIN order_items oi ON po.id = oi.order_id
      WHERE po.status IN ('approved', 'rejected', 'cancelled')
      GROUP BY po.id, po.created_at, po.customer_name, po.status, po.payment_status
      ORDER BY po.created_at DESC
    `;

    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
}); 