import React from 'react';
import { SiteProvider } from '../../context/SiteContext';
import OrderAnalytics from './PurchaseOrders/OrderAnalytics';
// This component will ensure OrderAnalytics always has a SiteProvider
const OrderAnalyticsWrapper = (props) => {
  return (
    <SiteProvider>
      <OrderAnalytics {...props} />
    </SiteProvider>
  );
};

export default OrderAnalyticsWrapper; 