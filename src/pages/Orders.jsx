import React from 'react';
import { Container } from 'react-bootstrap';
import { PurchaseOrderProvider } from '../context/PurchaseOrderContext';
import OrdersTabs from '../components/Orders/OrdersTabs';

const Orders = () => {
  return (
    <PurchaseOrderProvider>
      <Container fluid className="p-0">
        <OrdersTabs />
      </Container>
    </PurchaseOrderProvider>
  );
};

export default Orders; 