const API_URL = process.env.REACT_APP_API_URL;

// Mock data fetching from local storage or state
const getOrdersFromStorage = () => {
  try {
    // Get orders from localStorage
    const orders = JSON.parse(localStorage.getItem('purchaseOrders')) || [];
    return orders.map(order => ({
      ...order,
      created_at: new Date(order.created_at),
      order_total: order.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    }));
  } catch (error) {
    console.error('Error getting orders from storage:', error);
    return [];
  }
};

const filterOrdersByDateRange = (orders, startDate) => {
  return orders.filter(order => order.created_at >= startDate);
};

export const getOrderAnalytics = async (timeRange = 'monthly') => {
  try {
    const siteId = localStorage.getItem('selectedSiteId');
    if (!siteId) {
      throw new Error('No site selected');
    }

    // Get all purchase orders from your existing endpoint with site filter
    const response = await fetch(`${API_URL}/purchase-orders?siteId=${siteId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    const orders = await response.json();

    // Calculate date ranges
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case 'daily':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default: // monthly
        startDate.setMonth(now.getMonth() - 1);
    }

    // Filter orders for current and previous periods
    const currentPeriodOrders = orders.filter(order => 
      new Date(order.created_at) >= startDate
    );

    const previousPeriodStartDate = new Date(startDate);
    switch (timeRange) {
      case 'daily':
        previousPeriodStartDate.setDate(startDate.getDate() - 1);
        break;
      case 'weekly':
        previousPeriodStartDate.setDate(startDate.getDate() - 7);
        break;
      case 'yearly':
        previousPeriodStartDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default: // monthly
        previousPeriodStartDate.setMonth(startDate.getMonth() - 1);
    }

    const previousPeriodOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= previousPeriodStartDate && orderDate < startDate;
    });

    return {
      currentPeriodOrders,
      previousPeriodOrders
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
};

const calculatePeriodMetrics = (orders = []) => {
  const totalOrders = orders.length || 0;
  
  // Calculate total revenue more safely
  const totalRevenue = orders.reduce((sum, order) => {
    try {
      // If order.items exists and is an array, calculate total
      if (order.items && Array.isArray(order.items)) {
        const orderTotal = order.items.reduce((itemSum, item) => {
          return itemSum + ((Number(item.quantity) || 0) * (Number(item.unit_price) || 0));
        }, 0);
        return sum + orderTotal;
      }
      // If order.total exists directly, use that
      if (order.total) {
        return sum + (Number(order.total) || 0);
      }
      // If neither exists, just return current sum
      return sum;
    } catch (error) {
      console.warn('Error calculating order total:', error);
      return sum;
    }
  }, 0);

  // Ensure we have valid numbers
  const safeRevenue = Number(totalRevenue) || 0;
  const safeAverageValue = totalOrders > 0 ? safeRevenue / totalOrders : 0;
  const safeCancelledOrders = orders.filter(order => 
    order.status && order.status.toLowerCase() === 'cancelled'
  ).length || 0;

  return {
    totalOrders,
    totalRevenue: Math.round(safeRevenue * 100) / 100,
    averageOrderValue: Math.round(safeAverageValue * 100) / 100,
    cancelledOrders: safeCancelledOrders
  };
};

const calculatePercentageChange = (previous, current) => {
  if (!previous) return '+0%';
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
};

const calculateOrdersByStatus = (orders) => {
  const statusCounts = orders.reduce((acc, order) => {
    const status = order.status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    percentage: (count / orders.length) * 100
  }));
};

const calculateOrderTrends = (orders) => {
  if (!orders.length) return [];

  // Sort orders by date
  const sortedOrders = [...orders].sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at)
  );

  // Group orders by date
  const grouped = sortedOrders.reduce((acc, order) => {
    const date = new Date(order.created_at).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped).map(([date, count]) => ({
    date,
    count
  }));
};

export const processAnalyticsData = (data) => {
  const currentPeriodOrders = data?.currentPeriodOrders || [];
  const previousPeriodOrders = data?.previousPeriodOrders || [];

  const currentMetrics = calculatePeriodMetrics(currentPeriodOrders);
  const previousMetrics = calculatePeriodMetrics(previousPeriodOrders);
  
  return {
    metrics: {
      totalOrders: {
        value: currentMetrics.totalOrders,
        change: calculatePercentageChange(
          previousMetrics.totalOrders,
          currentMetrics.totalOrders
        )
      },
      revenue: {
        value: currentMetrics.totalRevenue.toFixed(2),
        change: calculatePercentageChange(
          previousMetrics.totalRevenue,
          currentMetrics.totalRevenue
        )
      },
      averageOrderValue: {
        value: currentMetrics.averageOrderValue.toFixed(2),
        change: calculatePercentageChange(
          previousMetrics.averageOrderValue,
          currentMetrics.averageOrderValue
        )
      },
      cancelledOrders: {
        value: currentMetrics.cancelledOrders,
        change: calculatePercentageChange(
          previousMetrics.cancelledOrders,
          currentMetrics.cancelledOrders
        )
      }
    },
    ordersByStatus: calculateOrdersByStatus(currentPeriodOrders),
    orderTrends: calculateOrderTrends(currentPeriodOrders)
  };
}; 