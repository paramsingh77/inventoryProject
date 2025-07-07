import OrderTracking from '../components/Orders/OrderTracking/OrderTracking';

// Then in your routes array:
{
  path: "/orders/tracking",
  element: <OrderTracking />,
  meta: {
    title: "Order Tracking",
    requiresAuth: true
  }
} 