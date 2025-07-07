import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLaptop, 
  faDesktop,
  faServer,
  faCloud,
  faMobileAlt,
  faKey,
  faEdit
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';

const EditDeviceModal = ({ show, onHide, onSuccess, device }) => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [operatingSystems, setOperatingSystems] = useState([]);
  
  // Form data state
  const [formData, setFormData] = useState({
    device_hostname: '',
    device_description: '',
    last_user: '',
    last_seen: '',
    device_type: '',
    device_model: '',
    operating_system: '',
    serial_number: '',
    device_cpu: '',
    mac_addresses: '',
    site_name: ''
  });

  // Initialize form data when the device or modal visibility changes
  useEffect(() => {
    if (show && device) {
      // Format mac_addresses for display if it's an array
      const macAddresses = Array.isArray(device.mac_addresses) 
        ? device.mac_addresses.join(', ')
        : device.mac_addresses || '';
        
      setFormData({
        device_hostname: device.device_hostname || '',
        device_description: device.device_description || '',
        last_user: device.last_user || '',
        last_seen: device.last_seen || 'Currently Online',
        device_type: device.device_type || '',
        device_model: device.device_model || '',
        operating_system: device.operating_system || '',
        serial_number: device.serial_number || '',
        device_cpu: device.device_cpu || '',
        mac_addresses: macAddresses,
        site_name: device.site_name || ''
      });
      
      setError(null);
      fetchDeviceTypes();
      fetchOSOptions();
    }
  }, [show, device]);

  // Fetch device types
  const fetchDeviceTypes = async () => {
    try {
      const response = await axios.get('/api/devices/types');
      if (response.data && Array.isArray(response.data)) {
        setDeviceTypes(response.data);
      }
    } catch (err) {
      console.error('Error fetching device types:', err);
      // Use the exact device types from the UI tabs as fallback
      setDeviceTypes([
        'Server - Physical', 
        'Server - VM',
        'Cell Phones - ATT',
        'Cell Phones - Verizon',
        'DLALION - License',
        'Desktop Computers',
        'Laptops',
        'Other Devices'
      ]);
    }
  };

  // Fetch common OS options
  const fetchOSOptions = async () => {
    try {
      const response = await axios.get('/api/devices/os-versions');
      if (response.data && Array.isArray(response.data)) {
        setOperatingSystems(response.data);
      }
    } catch (err) {
      console.error('Error fetching OS versions:', err);
      // Fallback OS options
      setOperatingSystems([
        'Windows 10', 
        'Windows 11', 
        'Windows Server 2019',
        'Windows Server 2022',
        'macOS Ventura',
        'macOS Monterey',
        'Linux Ubuntu 22.04',
        'Linux CentOS 7'
      ]);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required fields
    if (!formData.device_hostname || !formData.serial_number || !formData.site_name) {
      setError('Device hostname, serial number, and site name are required');
      setLoading(false);
      return;
    }
    
    try {
      // Format form data to match API expectations
      const formattedData = {
        site_name: formData.site_name,
        device_hostname: formData.device_hostname,
        device_description: formData.device_description,
        last_user: formData.last_user,
        last_seen: formData.last_seen || 'Currently Online',
        device_type: formData.device_type,
        device_model: formData.device_model,
        operating_system: formData.operating_system,
        serial_number: formData.serial_number,
        device_cpu: formData.device_cpu,
        mac_addresses: formData.mac_addresses 
          ? formData.mac_addresses.split(',').map(mac => mac.trim()) 
          : []
      };

      console.log('Updating device data:', formattedData);
      
      // Use ID if available or fall back to a serialNumber-based URL
      const deviceId = device.id;
      
      if (!deviceId) {
        console.error('Device ID is missing. Device object:', device);
        setError('Cannot edit device: missing ID');
        setLoading(false);
        return;
      }
      
      console.log(`Using device ID for update: ${deviceId}`);
      
      const response = await axios.put(`/api/devices/${deviceId}`, formattedData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Server response:', response.data);
      
      if (response.data.success) {
        // Merge the response data with our formatted data to ensure we have complete info
        const updatedDevice = {
          ...device,
          ...formattedData,
          ...response.data.device
        };
        
        onSuccess(updatedDevice);
        onHide();
      } else {
        setError(response.data.message || 'Error updating device');
      }
    } catch (err) {
      console.error('Error updating device:', err);
      
      // Add more detailed error logging
      if (err.response) {
        console.log('Error response data:', err.response.data);
        console.log('Error response status:', err.response.status);
        console.log('Error response headers:', err.response.headers);
      }
      
      setError(err.response?.data?.message || err.message || 'Error updating device');
    } finally {
      setLoading(false);
    }
  };

  // Get icon for device type
  const getDeviceTypeIcon = (type) => {
    if (!type) return faDesktop;
    
    const lowercaseType = type.toLowerCase();
    
    if (lowercaseType.includes('laptop')) return faLaptop;
    if (lowercaseType.includes('server') && lowercaseType.includes('vm')) return faCloud;
    if (lowercaseType.includes('server')) return faServer;
    if (lowercaseType.includes('phone')) return faMobileAlt;
    if (lowercaseType.includes('license')) return faKey;
    
    return faDesktop; // Default for desktop and others
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      backdrop="static"
      className={darkMode ? 'dark-mode' : ''}
    >
      <Modal.Header closeButton className={darkMode ? 'bg-dark text-white border-secondary' : ''}>
        <Modal.Title className="d-flex align-items-center">
          <FontAwesomeIcon icon={faEdit} className="me-2" />
          Edit Device
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={darkMode ? 'bg-dark text-white' : ''}>
        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Site Name</Form.Label>
                <Form.Control
                  type="text"
                  name="site_name"
                  value={formData.site_name}
                  onChange={handleInputChange}
                  required
                  className={darkMode ? 'bg-dark text-light border-secondary' : ''}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Device Hostname*</Form.Label>
                <Form.Control
                  type="text"
                  name="device_hostname"
                  value={formData.device_hostname}
                  onChange={handleInputChange}
                  required
                  className={darkMode ? 'bg-dark text-light border-secondary' : ''}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Device Type*</Form.Label>
                <Form.Select
                  name="device_type"
                  value={formData.device_type}
                  onChange={handleInputChange}
                  required
                  className={darkMode ? 'bg-dark text-light border-secondary' : ''}
                >
                  <option value="">Select Device Type</option>
                  <option value="Server - Physical">Server - Physical</option>
                  <option value="Server - VM">Server - VM</option>
                  <option value="Cell Phones - ATT">Cell Phones - ATT</option>
                  <option value="Cell Phones - Verizon">Cell Phones - Verizon</option>
                  <option value="DLALION - License">DLALION - License</option>
                  <option value="Desktop Computers">Desktop Computers</option>
                  <option value="Laptops">Laptops</option>
                  <option value="Other Devices">Other Devices</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Device Model</Form.Label>
                <Form.Control
                  type="text"
                  name="device_model"
                  value={formData.device_model}
                  onChange={handleInputChange}
                  className={darkMode ? 'bg-dark text-light border-secondary' : ''}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Row className="mb-3">
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  type="text"
                  name="device_description"
                  value={formData.device_description}
                  onChange={handleInputChange}
                  className={darkMode ? 'bg-dark text-light border-secondary' : ''}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Last User</Form.Label>
                <Form.Control
                  type="text"
                  name="last_user"
                  value={formData.last_user}
                  onChange={handleInputChange}
                  className={darkMode ? 'bg-dark text-light border-secondary' : ''}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Last Seen</Form.Label>
                <Form.Control
                  type="text"
                  name="last_seen"
                  value={formData.last_seen}
                  onChange={handleInputChange}
                  className={darkMode ? 'bg-dark text-light border-secondary' : ''}
                />
                <Form.Text className="text-muted">
                  Default: "Currently Online"
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
          
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Operating System</Form.Label>
                <Form.Select
                  name="operating_system"
                  value={formData.operating_system}
                  onChange={handleInputChange}
                  className={darkMode ? 'bg-dark text-light border-secondary' : ''}
                >
                  <option value="">Select Operating System</option>
                  {operatingSystems.map((os, index) => (
                    <option key={index} value={os}>
                      {os}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Serial Number*</Form.Label>
                <Form.Control
                  type="text"
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleInputChange}
                  required
                  className={darkMode ? 'bg-dark text-light border-secondary' : ''}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>CPU</Form.Label>
                <Form.Control
                  type="text"
                  name="device_cpu"
                  value={formData.device_cpu}
                  onChange={handleInputChange}
                  className={darkMode ? 'bg-dark text-light border-secondary' : ''}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>MAC Address(es)</Form.Label>
                <Form.Control
                  type="text"
                  name="mac_addresses"
                  value={formData.mac_addresses}
                  onChange={handleInputChange}
                  placeholder="00:00:00:00:00:00, 11:11:11:11:11:11"
                  className={darkMode ? 'bg-dark text-light border-secondary' : ''}
                />
                <Form.Text className="text-muted">
                  Separate multiple MAC addresses with commas
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer className={darkMode ? 'bg-dark text-white border-secondary' : ''}>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Save Changes'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditDeviceModal; 