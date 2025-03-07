import React, { useState } from 'react';
import { Table, Button, Form, InputGroup, Badge, Card, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faBell,
  faFilter,
  faEnvelope,
  faExclamationTriangle,
  faCheck,
  faCog
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';

const StockAlerts = () => {
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      productName: 'Product A',
      sku: 'SKU001',
      currentStock: 5,
      minStockLevel: 10,
      status: 'critical',
      lastNotified: '2024-01-20'
    },
    // Add more sample alerts
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { showNotification } = useNotification();

  const getStatusBadge = (status) => {
    const statusConfig = {
      critical: { bg: 'danger', text: 'Critical' },
      warning: { bg: 'warning', text: 'Warning' },
      resolved: { bg: 'success', text: 'Resolved' }
    };
    const config = statusConfig[status];
    return (
      <Badge bg={config.bg} className="px-2 py-1">
        {config.text}
      </Badge>
    );
  };

  const handleNotifySupplier = (alertId) => {
    // Implement supplier notification logic
    showNotification('success', 'Supplier has been notified');
  };

  const handleMarkResolved = (alertId) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, status: 'resolved' } : alert
    ));
    showNotification('success', 'Alert marked as resolved');
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || alert.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const alertStats = {
    critical: alerts.filter(a => a.status === 'critical').length,
    warning: alerts.filter(a => a.status === 'warning').length,
    resolved: alerts.filter(a => a.status === 'resolved').length
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Stock Alerts</h4>
        <Button variant="light">
          <FontAwesomeIcon icon={faCog} className="me-2" />
          Alert Settings
        </Button>
      </div>

      {/* Alert Statistics */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="rounded-3 p-3 bg-danger bg-opacity-10 me-3">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-danger" />
                </div>
                <div>
                  <h6 className="text-secondary mb-1">Critical Alerts</h6>
                  <h3 className="mb-0">{alertStats.critical}</h3>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="rounded-3 p-3 bg-warning bg-opacity-10 me-3">
                  <FontAwesomeIcon icon={faBell} className="text-warning" />
                </div>
                <div>
                  <h6 className="text-secondary mb-1">Warning Alerts</h6>
                  <h3 className="mb-0">{alertStats.warning}</h3>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="rounded-3 p-3 bg-success bg-opacity-10 me-3">
                  <FontAwesomeIcon icon={faCheck} className="text-success" />
                </div>
                <div>
                  <h6 className="text-secondary mb-1">Resolved</h6>
                  <h3 className="mb-0">{alertStats.resolved}</h3>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters and Search */}
      <div className="bg-light rounded-3 p-4 mb-4">
        <Row className="g-3">
          <Col md={6}>
            <InputGroup>
              <InputGroup.Text className="bg-white border-end-0">
                <FontAwesomeIcon icon={faSearch} className="text-secondary" />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-start-0"
              />
            </InputGroup>
          </Col>
          <Col md={3}>
            <Form.Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="resolved">Resolved</option>
            </Form.Select>
          </Col>
        </Row>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-3 shadow-sm">
        <Table hover responsive className="mb-0">
          <thead className="bg-light">
            <tr>
              <th>Product Name</th>
              <th>SKU</th>
              <th>Current Stock</th>
              <th>Min Stock Level</th>
              <th>Status</th>
              <th>Last Notified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlerts.map((alert) => (
              <motion.tr
                key={alert.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <td>{alert.productName}</td>
                <td>{alert.sku}</td>
                <td>{alert.currentStock}</td>
                <td>{alert.minStockLevel}</td>
                <td>{getStatusBadge(alert.status)}</td>
                <td>{alert.lastNotified}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => handleNotifySupplier(alert.id)}
                      disabled={alert.status === 'resolved'}
                    >
                      <FontAwesomeIcon icon={faEnvelope} />
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => handleMarkResolved(alert.id)}
                      disabled={alert.status === 'resolved'}
                    >
                      <FontAwesomeIcon icon={faCheck} />
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </Table>
      </div>
    </motion.div>
  );
};

export default StockAlerts; 