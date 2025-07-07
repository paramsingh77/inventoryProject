import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTruck, faBox, faCheckCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';

const POTracking = () => {
  const trackingOrders = [
    {
      id: 'PO-002',
      supplier: 'Office Solutions',
      status: 'In Transit',
      location: 'Chicago Distribution Center',
      eta: '2024-01-22',
      lastUpdate: '2 hours ago'
    },
    {
      id: 'PO-003',
      supplier: 'Global Electronics',
      status: 'Out for Delivery',
      location: 'Local Delivery Center',
      eta: '2024-01-21',
      lastUpdate: '30 minutes ago'
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
    <Row className="g-4">
      {trackingOrders.map(order => (
        <Col key={order.id} md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between mb-3">
                <h6 className="mb-0">{order.id}</h6>
                <Badge bg="primary">{order.status}</Badge>
              </div>
              
              <div className="mb-3">
                <small className="text-secondary d-block">Supplier</small>
                <span>{order.supplier}</span>
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
                <small className="text-secondary d-block">Expected Delivery</small>
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
  );
};

export default POTracking; 