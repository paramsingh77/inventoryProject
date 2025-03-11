import React from 'react';
import { Container } from 'react-bootstrap';
import OrdersNavigation from '../components/Orders/OrdersNavigation';
import OrdersTabs from '../components/Orders/OrdersTabs';
import { useLocation } from 'react-router-dom';

const Orders = () => {
  const location = useLocation();
  
  return (
    <Container fluid>
      <h2 className="mb-4">Orders Management</h2>
      <OrdersNavigation />
      <OrdersTabs />
    </Container>
  );
};

export default Orders; 