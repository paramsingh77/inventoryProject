import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { motion } from 'framer-motion';

const SiteOrders = ({ siteName }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSiteOrders();
  }, [siteName]);

  const fetchSiteOrders = async () => {
    try {
      setLoading(true);
      // Use the site-specific endpoint
      const response = await axios.get(`/api/sites/${siteName}/orders`);
      setOrders(response.data || []);
    } catch (err) {
      console.error('Error fetching site orders:', err);
      setError('Failed to load orders for this site');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
      </Alert>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Row className="mb-4">
        <Col md={3}>
          <Card className="shadow-sm h-100">
            <Card.Body className="text-center">
              <h3>{orders.filter(o => o.status === 'pending').length}</h3>
              <p className="text-muted mb-0">Pending Orders</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm h-100">
            <Card.Body className="text-center">
              <h3>{orders.filter(o => o.status === 'processing').length}</h3>
              <p className="text-muted mb-0">Processing</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm h-100">
            <Card.Body className="text-center">
              <h3>{orders.filter(o => o.status === 'completed').length}</h3>
              <p className="text-muted mb-0">Completed</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm h-100">
            <Card.Body className="text-center">
              <h3>${orders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0).toFixed(2)}</h3>
              <p className="text-muted mb-0">Total Value</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Purchase Orders</h5>
          <Button variant="primary" size="sm">Create Order</Button>
        </Card.Header>
        <Card.Body>
          {orders.length === 0 ? (
            <div className="text-center p-4">
              <p className="mb-0">No orders found for this site</p>
            </div>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Vendor</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>{order.order_number}</td>
                    <td>{new Date(order.order_date).toLocaleDateString()}</td>
                    <td>{order.vendor_name}</td>
                    <td>{order.item_count}</td>
                    <td>${parseFloat(order.total_amount).toFixed(2)}</td>
                    <td>
                      <Badge bg={
                        order.status === 'completed' ? 'success' :
                        order.status === 'processing' ? 'warning' :
                        'secondary'
                      }>
                        {order.status}
                      </Badge>
                    </td>
                    <td>
                      <Button variant="outline-primary" size="sm" className="me-1">
                        <i className="bi bi-eye"></i>
                      </Button>
                      <Button variant="outline-secondary" size="sm">
                        <i className="bi bi-printer"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default SiteOrders; 