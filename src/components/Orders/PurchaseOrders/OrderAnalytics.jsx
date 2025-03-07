import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faShoppingCart, 
  faMoneyBill,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const OrderAnalytics = () => {
  const metrics = [
    {
      title: 'Total Orders',
      value: '1,234',
      change: '+12.5%',
      trend: 'up',
      icon: faShoppingCart
    },
    {
      title: 'Revenue',
      value: '$45,678',
      change: '+8.3%',
      trend: 'up',
      icon: faMoneyBill
    },
    {
      title: 'Average Order Value',
      value: '$123',
      change: '-2.1%',
      trend: 'down',
      icon: faChartLine
    },
    {
      title: 'Cancelled Orders',
      value: '23',
      change: '+5.2%',
      trend: 'up',
      icon: faExclamationTriangle
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h4 className="mb-4">Order Analytics</h4>

      <Row className="g-4">
        {metrics.map((metric, index) => (
          <Col key={index} md={6} lg={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex align-items-center mb-3">
                  <div className="rounded-3 p-3 bg-primary bg-opacity-10 me-3">
                    <FontAwesomeIcon icon={metric.icon} className="text-primary" />
                  </div>
                  <div>
                    <h6 className="text-secondary mb-1">{metric.title}</h6>
                    <h3 className="mb-0">{metric.value}</h3>
                  </div>
                </div>
                <div className={`text-${metric.trend === 'up' ? 'success' : 'danger'}`}>
                  {metric.change}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Placeholder for charts */}
      <Row className="mt-4 g-4">
        <Col md={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="mb-4">Orders Overview</h6>
              <div className="text-center text-secondary py-5">
                Chart placeholder
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="mb-4">Order Distribution</h6>
              <div className="text-center text-secondary py-5">
                Pie chart placeholder
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </motion.div>
  );
};

export default OrderAnalytics; 