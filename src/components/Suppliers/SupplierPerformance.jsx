import React, { useState } from 'react';
import { Card, Row, Col, Form, Table, Badge } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faBoxes,
  faClock,
  faPercent,
  faExclamationTriangle,
  faCheckCircle,
  faStar
} from '@fortawesome/free-solid-svg-icons';

const styles = {
  container: {
    fontFamily: 'Afacad, sans-serif'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#344767'
  },
  card: {
    height: '100%',
    border: 'none'
  },
  metricValue: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#344767'
  },
  metricLabel: {
    fontSize: '0.875rem',
    color: '#67748e'
  }
};

const SupplierPerformance = () => {
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [timeRange, setTimeRange] = useState('month');

  // Sample performance metrics
  const metrics = {
    deliveryPerformance: 92,
    qualityRating: 4.5,
    responseTime: '24h',
    fulfillmentRate: 95,
    defectRate: 0.8,
    onTimeDelivery: 94,
    averageLeadTime: '5 days'
  };

  // Sample performance history
  const performanceHistory = [
    {
      id: 1,
      date: '2024-01-15',
      orderNumber: 'PO-2024-001',
      deliveryStatus: 'on_time',
      qualityScore: 5,
      issues: 0,
      notes: 'Perfect delivery'
    },
    // Add more history items
  ];

  const getStatusBadge = (status) => {
    const badges = {
      on_time: <Badge bg="success">On Time</Badge>,
      delayed: <Badge bg="warning">Delayed</Badge>,
      failed: <Badge bg="danger">Failed</Badge>
    };
    return badges[status];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={styles.container}
    >
      {/* Filters */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Select Supplier</Form.Label>
                <Form.Select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                >
                  <option value="all">All Suppliers</option>
                  <option value="1">Acme Supplies</option>
                  <option value="2">Global Trading Co.</option>
                  <option value="3">Tech Parts Inc.</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Time Range</Form.Label>
                <Form.Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="year">Last Year</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Key Metrics */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="shadow-sm" style={styles.card}>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle p-2 bg-primary bg-opacity-10 me-3">
                  <FontAwesomeIcon icon={faBoxes} className="text-primary" />
                </div>
                <div>
                  <div style={styles.metricValue}>{metrics.deliveryPerformance}%</div>
                  <div style={styles.metricLabel}>Delivery Performance</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm" style={styles.card}>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle p-2 bg-success bg-opacity-10 me-3">
                  <FontAwesomeIcon icon={faStar} className="text-success" />
                </div>
                <div>
                  <div style={styles.metricValue}>{metrics.qualityRating}</div>
                  <div style={styles.metricLabel}>Quality Rating</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm" style={styles.card}>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle p-2 bg-warning bg-opacity-10 me-3">
                  <FontAwesomeIcon icon={faClock} className="text-warning" />
                </div>
                <div>
                  <div style={styles.metricValue}>{metrics.responseTime}</div>
                  <div style={styles.metricLabel}>Avg. Response Time</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm" style={styles.card}>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle p-2 bg-info bg-opacity-10 me-3">
                  <FontAwesomeIcon icon={faPercent} className="text-info" />
                </div>
                <div>
                  <div style={styles.metricValue}>{metrics.fulfillmentRate}%</div>
                  <div style={styles.metricLabel}>Fulfillment Rate</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Performance History */}
      <Card className="shadow-sm">
        <Card.Body>
          <h5 style={styles.title} className="mb-4">Performance History</h5>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Date</th>
                <th>Order Number</th>
                <th>Delivery Status</th>
                <th>Quality Score</th>
                <th>Issues</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {performanceHistory.map(item => (
                <tr key={item.id}>
                  <td>{new Date(item.date).toLocaleDateString()}</td>
                  <td>{item.orderNumber}</td>
                  <td>{getStatusBadge(item.deliveryStatus)}</td>
                  <td>
                    {[...Array(5)].map((_, index) => (
                      <FontAwesomeIcon
                        key={index}
                        icon={faStar}
                        className={index < item.qualityScore ? 'text-warning' : 'text-muted'}
                      />
                    ))}
                  </td>
                  <td>
                    {item.issues === 0 ? (
                      <FontAwesomeIcon icon={faCheckCircle} className="text-success" />
                    ) : (
                      <span className="text-danger">
                        <FontAwesomeIcon icon={faExclamationTriangle} /> {item.issues}
                      </span>
                    )}
                  </td>
                  <td>{item.notes}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default SupplierPerformance; 