const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/orders', async (req, res) => {
  const { timeRange = 'monthly' } = req.query;
  
  try {
    // Calculate date ranges based on timeRange
    let interval;
    switch (timeRange) {
      case 'daily': interval = '1 day'; break;
      case 'weekly': interval = '1 week'; break;
      case 'yearly': interval = '1 year'; break;
      default: interval = '1 month';
    }

    // Get current period orders
    const currentPeriodQuery = `
      SELECT 
        po.*,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) as order_total
      FROM purchase_orders po
      LEFT JOIN order_items oi ON po.id = oi.order_id
      WHERE po.created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY po.id
    `;

    // Get previous period orders
    const previousPeriodQuery = `
      SELECT 
        po.*,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) as order_total
      FROM purchase_orders po
      LEFT JOIN order_items oi ON po.id = oi.order_id
      WHERE po.created_at >= NOW() - INTERVAL '2 ${interval}'
        AND po.created_at < NOW() - INTERVAL '${interval}'
      GROUP BY po.id
    `;

    const [currentPeriod, previousPeriod] = await Promise.all([
      pool.query(currentPeriodQuery),
      pool.query(previousPeriodQuery)
    ]);

    res.json({
      currentPeriodOrders: currentPeriod.rows,
      previousPeriodOrders: previousPeriod.rows
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

module.exports = router; 