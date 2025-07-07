import React, { useState, useCallback } from 'react';
import { Tab, Nav, Container } from 'react-bootstrap';
import OrdersTabs from '../components/Orders/OrdersTabs';

const Orders = () => {
  return (
    <Container fluid className="p-0">
      <OrdersTabs />
    </Container>
  );
};

export default Orders; 