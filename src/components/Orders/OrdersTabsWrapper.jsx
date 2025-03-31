import React from 'react';
import { SiteProvider } from '../../context/SiteContext';
import OrdersTabs from './OrdersTabs';

const OrdersTabsWrapper = (props) => {
  return (
    <SiteProvider>
      <OrdersTabs {...props} />
    </SiteProvider>
  );
};

export default OrdersTabsWrapper; 