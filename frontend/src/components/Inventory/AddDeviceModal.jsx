import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLaptop, 
  faDesktop,
  faServer,
  faCloud,
  faMobileAlt,
  faKey
} from '@fortawesome/free-solid-svg-icons';
import api from '../../utils/api';
import { categorizeDeviceExclusive } from '../../scripts/device_categorization';
import { useTheme } from '../../context/ThemeContext';

const AddDeviceModal = ({ show, onHide, onSuccess, siteName }) => {
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
    last_seen: 'Currently Online',
    device_type: '',
    device_model: '',
    operating_system: '',
    serial_number: '',
    device_cpu: '',
    mac_addresses: '',
    site_name: siteName || ''
  });

  // Fetch device types and OS options when modal opens
  useEffect(() => {
    if (show) {
      // Reset form data
      setFormData({
        device_hostname: '',
        device_description: '',
        last_user: '',
        last_seen: 'Currently Online',
        device_type: '',
        device_model: '',
        operating_system: '',
        serial_number: '',
        device_cpu: '',
        mac_addresses: '',
        site_name: siteName || ''
      });
      setError(null);
      
      // Set site name if provided
      if (siteName) {
        setFormData(prev => ({ ...prev, site_name: siteName }));
      }

      // Fetch device types
      const fetchDeviceTypes = async () => {
        try {
          const response = await api.get('/devices/types');
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
          const response = await api.get('/devices/os-versions');
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

      fetchDeviceTypes();
      fetchOSOptions();
    }
  }, [show, siteName]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Reset form function
  const resetForm = () => {
    setFormData({
      device_hostname: '',
      device_description: '',
      last_user: '',
      last_seen: 'Currently Online',
      device_type: '',
      device_model: '',
      operating_system: '',
      serial_number: '',
      device_cpu: '',
      mac_addresses: '',
      site_name: siteName || ''
    });
    setError(null);
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
      // Handle last_seen specially - 'Currently Online' will be converted to current timestamp on the server
      // But for visibility of errors, let's log what we're sending
      console.log('Last seen value being sent:', formData.last_seen);
      
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

      console.log('Submitting device data:', formattedData);
      
      const response = await api.post('/devices', formattedData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Server response:', response.data);
      
      if (response.data.success) {
        // Create a complete device object with the response data and form data
        const newDevice = {
          ...(response.data.device || {}),
          ...formattedData,
          id: response.data.device?.id || Date.now(), // Ensure we have an ID for key purposes
          status: 'active', // Default status for new devices
        };
        
        // Call onSuccess with the complete device object
        onSuccess(newDevice);
        
        resetForm();
        onHide();
      } else {
        setError(response.data.message || 'Error adding device');
      }
    } catch (err) {
      console.error('Error adding device:', err);
      // Add more detailed error logging
      if (err.response) {
        console.log('Error response data:', err.response.data);
        console.log('Error response status:', err.response.status);
        console.log('Error response headers:', err.response.headers);
      }
      setError(err.response?.data?.message || err.message || 'Error adding device');
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
          <FontAwesomeIcon icon={faDesktop} className="me-2" />
          Add New Device
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
                  disabled={!!siteName}
                  className={darkMode ? 'bg-dark text-light border-secondary' : ''}
                />
                <Form.Text className="text-muted">
                  {siteName ? "Site name is automatically set" : "Enter the site where this device is located"}
                </Form.Text>
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
          {loading ? 'Adding...' : 'Add Device'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddDeviceModal; 