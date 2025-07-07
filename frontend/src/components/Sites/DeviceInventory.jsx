import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Form, InputGroup, Badge, Row, Col, Dropdown, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { motion } from 'framer-motion';
import AddDeviceModal from '../Inventory/AddDeviceModal';
import EditDeviceModal from '../Inventory/EditDeviceModal';

const DeviceInventory = ({ siteName }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  const [sortField, setSortField] = useState('device_hostname');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  useEffect(() => {
    // Try to retrieve cached devices from localStorage first
    const cachedDevices = localStorage.getItem(`devices_${siteName}`);
    if (cachedDevices) {
      try {
        const parsedDevices = JSON.parse(cachedDevices);
        setDevices(parsedDevices);
      } catch (err) {
        console.error("Error parsing cached devices:", err);
      }
    }
    
    // Always fetch fresh data even if we have cached data
    fetchDevices();
  }, [siteName]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching devices for site: ${siteName}`);
      // Use the site-specific endpoint
      const response = await axios.get(`/api/inventory/site/${siteName}/devices`);
      
      if (response.data.devices) {
        console.log(`Received ${response.data.devices.length} devices for ${siteName}`);
        
        // Ensure each device has an ID for proper identification
        const processedDevices = response.data.devices.map(device => {
          // If no ID, try to use the database ID or generate one
          if (!device.id) {
            console.warn('Device missing ID:', device);
            // Use serial number as a fallback identifier if ID is missing
            return {
              ...device,
              id: device.id || device.serial_number || `temp-${Date.now()}-${Math.random()}`
            };
          }
          return device;
        });
        
        console.log('Processed devices:', processedDevices);
        setDevices(processedDevices);
        
        // Cache the devices in localStorage
        localStorage.setItem(`devices_${siteName}`, JSON.stringify(processedDevices));
      } else {
        console.log(`No devices data for ${siteName}`);
        setDevices([]);
        // Clear the cache if no devices
        localStorage.removeItem(`devices_${siteName}`);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError(err.response?.data?.error || 'Failed to load devices');
      // Don't clear devices here so we still show cached data on error
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

  // Add device success handler
  const handleAddDeviceSuccess = (newDevice) => {
    console.log('New device added:', newDevice);
    
    // Add the new device to the devices array
    setDevices(prevDevices => {
      const updatedDevices = [...prevDevices, newDevice];
      // Update localStorage
      localStorage.setItem(`devices_${siteName}`, JSON.stringify(updatedDevices));
      return updatedDevices;
    });
  };
  
  // Handle edit button click
  const handleEditClick = (device) => {
    console.log('Editing device:', device);
    setSelectedDevice(device);
    setShowEditModal(true);
  };
  
  // Edit device success handler
  const handleEditDeviceSuccess = (updatedDevice) => {
    console.log('Device updated:', updatedDevice);
    
    // Update the device in the devices array
    setDevices(prevDevices => {
      const updatedDevices = prevDevices.map(device => 
        device.id === updatedDevice.id ? updatedDevice : device
      );
      // Update localStorage
      localStorage.setItem(`devices_${siteName}`, JSON.stringify(updatedDevices));
      return updatedDevices;
    });
  };

  // Handle delete button click
  const handleDeleteClick = (device) => {
    if (window.confirm(`Are you sure you want to delete device ${device.device_hostname}?`)) {
      setLoading(true);
      console.log('Deleting device:', device);
      
      // Call the backend API to delete the device
      axios.delete(`/api/devices/${device.id}`)
        .then(response => {
          console.log('Delete response:', response.data);
          
          if (response.data.success) {
            // Remove the device from the devices array
            setDevices(prevDevices => {
              const updatedDevices = prevDevices.filter(d => d.id !== device.id);
              // Update localStorage
              localStorage.setItem(`devices_${siteName}`, JSON.stringify(updatedDevices));
              return updatedDevices;
            });
            
            // Show success message (if you have a notification system)
            console.log('Device deleted successfully');
          } else {
            setError(response.data.message || 'Failed to delete device');
          }
        })
        .catch(err => {
          console.error('Error deleting device:', err);
          setError(err.response?.data?.message || err.message || 'Error deleting device');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  if (loading && devices.length === 0) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error && devices.length === 0) {
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
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => setShowAddModal(true)}
          >
            Add Device
          </Button>
        </Card.Header>
        <Card.Body>
          {loading && devices.length > 0 && (
            <div className="mb-3">
              <Spinner animation="border" size="sm" className="me-2" />
              <span className="text-muted">Refreshing data...</span>
            </div>
          )}

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
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-1"
                        onClick={() => handleEditClick(device)}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDeleteClick(device)}
                      >
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
      
      {/* Add Device Modal */}
      <AddDeviceModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={handleAddDeviceSuccess}
        siteName={siteName}
      />
      
      {/* Edit Device Modal */}
      {selectedDevice && (
        <EditDeviceModal
          show={showEditModal}
          onHide={() => {
            setShowEditModal(false);
            setSelectedDevice(null);
          }}
          onSuccess={handleEditDeviceSuccess}
          device={selectedDevice}
        />
      )}
    </motion.div>
  );
};

export default DeviceInventory; 