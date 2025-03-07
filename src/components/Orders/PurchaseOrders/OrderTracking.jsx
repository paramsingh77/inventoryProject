import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTruck, 
  faBox, 
  faCheckCircle,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const OrderTracking = () => {
  const orders = [
    {
      id: 'ORD-001',
      customer: 'John Smith',
      status: 'In Transit',
      location: 'Chicago Distribution Center',
      eta: '2024-01-22',
      lastUpdate: '2 hours ago'
    },
    {
      id: 'ORD-002',
      customer: 'Sarah Johnson',
      status: 'Out for Delivery',
      location: 'Local Delivery Center',
      eta: '2024-01-21',
      lastUpdate: '30 minutes ago'
    },
    {
      id: 'ORD-003',
      customer: 'Mike Wilson',
      status: 'Processing',
      location: 'Main Warehouse',
      eta: '2024-01-23',
      lastUpdate: '1 day ago'
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'In Transit':
        return faTruck;
      case 'Out for Delivery':
        return faBox;
      case 'Delivered':
        return faCheckCircle;
      default:
        return faSpinner;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h4 className="mb-4">Order Tracking</h4>
      
      <Row className="g-4">
        {orders.map(order => (
          <Col key={order.id} md={6} lg={4}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between mb-3">
                  <h6 className="mb-0">{order.id}</h6>
                  <Badge bg="primary">{order.status}</Badge>
                </div>
                
                <div className="mb-3">
                  <small className="text-secondary d-block">Customer</small>
                  <span>{order.customer}</span>
                </div>

                <div className="mb-3">
                  <small className="text-secondary d-block">Current Location</small>
                  <div className="d-flex align-items-center">
                    <FontAwesomeIcon 
                      icon={getStatusIcon(order.status)} 
                      className="text-primary me-2"
                    />
                    {order.location}
                  </div>
                </div>

                <div className="mb-3">
                  <small className="text-secondary d-block">Estimated Delivery</small>
                  <span>{order.eta}</span>
                </div>

                <small className="text-secondary">
                  Last updated {order.lastUpdate}
                </small>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </motion.div>
  );
};

export default OrderTracking; 