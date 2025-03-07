import React, { useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileInvoice,
  faClipboardList,
  faHistory,
  faChartLine,
  faShoppingCart,
  faArrowLeft,
  faTruck,
  faMoneyBill
} from '@fortawesome/free-solid-svg-icons';
import PurchaseOrders from '../components/Orders/PurchaseOrders';
import OrderTracking from '../components/Orders/PurchaseOrders/OrderTracking';
import OrderHistory from '../components/Orders/PurchaseOrders/OrderHistory';
import OrderAnalytics from '../components/Orders/PurchaseOrders/OrderAnalytics';
import { NotificationProvider } from '../context/NotificationContext';

const Orders = () => {
  const [activeModule, setActiveModule] = useState(null);

  const orderModules = [
    {
      id: 'purchase-orders',
      title: 'Purchase Orders',
      icon: faFileInvoice,
      description: 'Create, manage and track purchase orders',
      component: PurchaseOrders,
      stats: { value: '45', label: 'Active POs' }
    },
    {
      id: 'order-tracking',
      title: 'Order Tracking',
      icon: faTruck,
      description: 'Track order status and delivery progress',
      component: OrderTracking,
      stats: { value: '12', label: 'In Transit' }
    },
    {
      id: 'order-history',
      title: 'Order History',
      icon: faHistory,
      description: 'View and manage past orders and invoices',
      component: OrderHistory,
      stats: { value: '358', label: 'Total Orders' }
    },
    {
      id: 'analytics',
      title: 'Order Analytics',
      icon: faChartLine,
      description: 'Analyze order trends and performance metrics',
      component: OrderAnalytics,
      stats: { value: '$24.5K', label: 'Monthly Orders' }
    }
  ];

  const handleModuleClick = (moduleId) => {
    setActiveModule(moduleId);
  };

  const handleBack = () => {
    setActiveModule(null);
  };

  return (
    <NotificationProvider>
      <Container fluid>
        <AnimatePresence mode="wait">
          {!activeModule ? (
            <motion.div
              key="orders-home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Quick Stats */}
              <Row className="g-3 mb-4">
                {orderModules.map(module => (
                  <Col key={module.id} md={3}>
                    <Card className="border-0 shadow-sm">
                      <Card.Body>
                        <div className="d-flex align-items-center">
                          <div className="rounded-3 p-3 bg-primary bg-opacity-10 me-3">
                            <FontAwesomeIcon icon={module.icon} className="text-primary" />
                          </div>
                          <div>
                            <h6 className="text-secondary mb-1">{module.stats.label}</h6>
                            <h3 className="mb-0">{module.stats.value}</h3>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Additional Summary Cards */}
              <Row className="g-3 mb-4">
                <Col md={6}>
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <h6 className="text-secondary mb-3">Recent Orders Status</h6>
                      <Row className="text-center g-3">
                        <Col>
                          <div className="rounded-3 p-3 bg-success bg-opacity-10">
                            <h3 className="text-success mb-1">28</h3>
                            <small className="text-secondary">Completed</small>
                          </div>
                        </Col>
                        <Col>
                          <div className="rounded-3 p-3 bg-warning bg-opacity-10">
                            <h3 className="text-warning mb-1">15</h3>
                            <small className="text-secondary">Pending</small>
                          </div>
                        </Col>
                        <Col>
                          <div className="rounded-3 p-3 bg-info bg-opacity-10">
                            <h3 className="text-info mb-1">12</h3>
                            <small className="text-secondary">Processing</small>
                          </div>
                        </Col>
                        <Col>
                          <div className="rounded-3 p-3 bg-danger bg-opacity-10">
                            <h3 className="text-danger mb-1">3</h3>
                            <small className="text-secondary">Issues</small>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <h6 className="text-secondary mb-3">Payment Overview</h6>
                      <Row className="text-center g-3">
                        <Col>
                          <div className="rounded-3 p-3 bg-primary bg-opacity-10">
                            <h3 className="text-primary mb-1">$45.2K</h3>
                            <small className="text-secondary">Total Paid</small>
                          </div>
                        </Col>
                        <Col>
                          <div className="rounded-3 p-3 bg-warning bg-opacity-10">
                            <h3 className="text-warning mb-1">$12.8K</h3>
                            <small className="text-secondary">Pending</small>
                          </div>
                        </Col>
                        <Col>
                          <div className="rounded-3 p-3 bg-danger bg-opacity-10">
                            <h3 className="text-danger mb-1">$5.4K</h3>
                            <small className="text-secondary">Overdue</small>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Module Cards */}
              <Row className="g-4">
                {orderModules.map((module) => (
                  <Col key={module.id} md={6} lg={3}>
                    <motion.div
                      whileHover={{ y: -5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className="h-100 border-0 shadow-sm cursor-pointer"
                        onClick={() => handleModuleClick(module.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Card.Body className="p-4">
                          <div className="d-flex align-items-center mb-3">
                            <div className="rounded-3 p-3 bg-primary bg-opacity-10 me-3">
                              <FontAwesomeIcon icon={module.icon} className="text-primary fs-4" />
                            </div>
                            <h5 className="mb-0">{module.title}</h5>
                          </div>
                          <p className="text-secondary mb-0">
                            {module.description}
                          </p>
                        </Card.Body>
                      </Card>
                    </motion.div>
                  </Col>
                ))}
              </Row>
            </motion.div>
          ) : (
            <motion.div
              key="active-module"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Button
                variant="light"
                className="mb-4"
                onClick={handleBack}
              >
                <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                Back to Orders
              </Button>
              {(() => {
                const ModuleComponent = orderModules.find(m => m.id === activeModule)?.component;
                return ModuleComponent ? <ModuleComponent /> : null;
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </NotificationProvider>
  );
};

export default Orders; 