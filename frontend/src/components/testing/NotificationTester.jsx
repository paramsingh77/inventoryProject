import React, { useState } from 'react';
import { Card, Button, Form, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faBox,
  faShoppingCart,
  faTag,
  faTruck,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { useNotification } from '../../context/NotificationContext';

const NotificationTester = () => {
  const { addNotification } = useNotification();
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  const testScenarios = [
    {
      title: 'Low Stock Alert',
      type: 'low_stock_alert',
      icon: faExclamationTriangle,
      action: () => {
        addNotification('low_stock_alert', {
          productName: 'Test Product',
          currentStock: 5,
          threshold: 10,
          timestamp: new Date()
        });
      }
    },
    {
      title: 'New Purchase Order',
      type: 'purchase_order',
      icon: faTruck,
      action: () => {
        addNotification('purchase_order', {
          poNumber: 'PO-' + Math.floor(Math.random() * 1000),
          supplier: 'Test Supplier',
          items: 3,
          timestamp: new Date()
        });
      }
    },
    {
      title: 'Order Status Update',
      type: 'order_status',
      icon: faShoppingCart,
      action: () => {
        const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered'];
        addNotification('order_status', {
          orderNumber: 'ORD-' + Math.floor(Math.random() * 1000),
          status: statuses[Math.floor(Math.random() * statuses.length)],
          timestamp: new Date()
        });
      }
    },
    {
      title: 'Price Change',
      type: 'price_change',
      icon: faTag,
      action: () => {
        addNotification('price_change', {
          productName: 'Test Product',
          oldPrice: 99.99,
          newPrice: 89.99,
          timestamp: new Date()
        });
      }
    },
    {
      title: 'Inventory Update',
      type: 'inventory_update',
      icon: faBox,
      action: () => {
        addNotification('inventory_update', {
          productName: 'Test Product',
          quantity: 100,
          type: 'addition',
          timestamp: new Date()
        });
      }
    },
    {
      title: 'Success Notification',
      type: 'success',
      icon: faCheckCircle,
      action: () => {
        addNotification('success', 'Operation completed successfully!');
      }
    }
  ];

  // Simulate real-time updates
  const startAutoNotifications = () => {
    const interval = setInterval(() => {
      const randomScenario = testScenarios[Math.floor(Math.random() * testScenarios.length)];
      randomScenario.action();
    }, 5000); // Send a notification every 5 seconds

    // Stop after 1 minute
    setTimeout(() => {
      clearInterval(interval);
    }, 60000);
  };

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-primary text-white">
        <h5 className="mb-0">
          <FontAwesomeIcon icon={faBell} className="me-2" />
          Notification Testing Panel
        </h5>
      </Card.Header>
      <Card.Body>
        <Row className="g-3">
          {testScenarios.map((scenario, index) => (
            <Col md={4} key={index}>
              <Card className="h-100">
                <Card.Body>
                  <h6>
                    <FontAwesomeIcon icon={scenario.icon} className="me-2" />
                    {scenario.title}
                  </h6>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={scenario.action}
                    className="mt-2"
                  >
                    Test Notification
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <div className="mt-4">
          <Button 
            variant="success" 
            onClick={startAutoNotifications}
            className="me-2"
          >
            Start Auto Notifications (1 min)
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setShowNotificationCenter(true)}
          >
            Open Notification Center
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default NotificationTester; 