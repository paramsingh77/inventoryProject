import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Form, InputGroup, Badge, Row, Col, Dropdown, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { motion } from 'framer-motion';

const DeviceInventory = ({ siteName }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  const [sortField, setSortField] = useState('device_hostname');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    fetchDevices();
  }, [siteName]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the site-specific endpoint
      const response = await axios.get(`/api/inventory/site/${siteName}/devices`);
      
      if (response.data.devices) {
        setDevices(response.data.devices);
      } else {
        setDevices([]);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError(err.response?.data?.error || 'Failed to load devices');
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique device types for filtering
  const deviceTypes = ['All Types', ...new Set(devices.map(device => device.device_type).filter(Boolean))];

  // Filter and sort devices
  const filteredDevices = devices
    .filter(device => {
      const matchesSearch = 
        (device.device_hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.last_user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.operating_system?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = filterType === 'All Types' || device.device_type === filterType;
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
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
        <Button variant="outline-primary" onClick={fetchDevices}>Retry</Button>
      </Alert>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{siteName} Device Inventory</h5>
          <Button variant="primary" size="sm">Add Device</Button>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search devices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" id="device-type-dropdown">
                  {filterType}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {deviceTypes.map(type => (
                    <Dropdown.Item 
                      key={type} 
                      onClick={() => setFilterType(type)}
                      active={filterType === type}
                    >
                      {type}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
            <Col md={3} className="text-end">
              <span className="text-muted">
                Showing {filteredDevices.length} of {devices.length} devices
              </span>
            </Col>
          </Row>
          
          <Table responsive striped hover>
            <thead>
              <tr>
                <th onClick={() => handleSort('device_hostname')} style={{cursor: 'pointer'}}>
                  Hostname {sortField === 'device_hostname' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('device_type')} style={{cursor: 'pointer'}}>
                  Type {sortField === 'device_type' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('operating_system')} style={{cursor: 'pointer'}}>
                  OS {sortField === 'operating_system' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('last_user')} style={{cursor: 'pointer'}}>
                  Last User {sortField === 'last_user' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('last_seen')} style={{cursor: 'pointer'}}>
                  Last Seen {sortField === 'last_seen' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('status')} style={{cursor: 'pointer'}}>
                  Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.length > 0 ? (
                filteredDevices.map(device => (
                  <tr key={device.id}>
                    <td>{device.device_hostname}</td>
                    <td>{device.device_type}</td>
                    <td>{device.operating_system}</td>
                    <td>{device.last_user}</td>
                    <td>{device.last_seen ? new Date(device.last_seen).toLocaleString() : 'N/A'}</td>
                    <td>
                      <Badge bg={device.status === 'active' ? 'success' : 'secondary'}>
                        {device.status || 'Unknown'}
                      </Badge>
                    </td>
                    <td>
                      <Button variant="outline-primary" size="sm" className="me-1">
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button variant="outline-danger" size="sm">
                        <i className="bi bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center">No devices found for this site</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default DeviceInventory; 