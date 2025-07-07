import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Badge, Button, Dropdown, Modal, Nav } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFilter,
  faSearch,
  faExclamationTriangle,
  faCircle,
  faDesktop,
  faServer,
  faSync,
  faChartBar,
  faChevronDown,
  faBuilding,
  faHeartbeat,
  faFileAlt,
  faNetworkWired,
  faMobile,
  faLaptop
} from '@fortawesome/free-solid-svg-icons';
import DataGrid, { 
  Column, 
  Scrolling, 
  Paging,
  FilterRow,
  HeaderFilter,
  SearchPanel,
  Export
} from 'devextreme-react/data-grid';
import api from '../utils/api-es';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

// Import DevExtreme CSS
import 'devextreme/dist/css/dx.light.css';

// Import custom CSS for additional styling
import './UserInventoryView.css';

// Analytics Modal Component
const AnalyticsModal = ({ show, onHide, devices }) => {
  const [activeTab, setActiveTab] = useState('site-summary');
  const { darkMode } = useTheme();
  
  // Count devices by site
  const devicesBySite = devices.reduce((acc, device) => {
    const site = device.siteName || 'Unknown';
    if (!acc[site]) acc[site] = [];
    acc[site].push(device);
    return acc;
  }, {});
  
  // Get device status (active vs inactive)
  const getDeviceStatus = (lastSeen) => {
    if (!lastSeen) return 'inactive';
    if (lastSeen === 'Currently Online') return 'active';
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diffDays = (now - date) / (1000 * 60 * 60 * 24);
    
    return diffDays <= 7 ? 'active' : 'inactive';
  };
  
  // Count device types per site
  const getDeviceTypesBySite = (siteDevices) => {
    return siteDevices.reduce((acc, device) => {
      const type = device.deviceType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  };
  
  // Get OS distribution
  const getOSDistribution = (allDevices) => {
    return allDevices.reduce((acc, device) => {
      const os = device.operatingSystem || 'Unknown';
      const mainOS = os.split(' ')[0] + ' ' + (os.split(' ')[1] || '');
      acc[mainOS] = (acc[mainOS] || 0) + 1;
      return acc;
    }, {});
  };
  
  // Get devices not seen in last X days
  const getDevicesNotSeenInDays = (allDevices, days) => {
    const now = new Date();
    return allDevices.filter(device => {
      if (!device.lastSeen || device.lastSeen === 'N/A') return true;
      if (device.lastSeen === 'Currently Online') return false;
      
      const date = new Date(device.lastSeen);
      if (isNaN(date.getTime())) return false;
      
      const diffDays = (now - date) / (1000 * 60 * 60 * 24);
      return diffDays > days;
    });
  };
  
  // Get device type icon
  const getDeviceTypeIcon = (type) => {
    if (!type) return faDesktop;
    
    const typeStr = type.toLowerCase();
    if (typeStr.includes('server')) return faServer;
    if (typeStr.includes('desktop')) return faDesktop;
    if (typeStr.includes('laptop')) return faLaptop;
    if (typeStr.includes('mobile') || typeStr.includes('phone')) return faMobile;
    if (typeStr.includes('network')) return faNetworkWired;
    
    return faDesktop;
  };
  
  // Generate downloadable report data
  const generateReportData = (reportType) => {
    switch (reportType) {
      case 'maintenance':
        return getDevicesNotSeenInDays(devices, 7);
      case 'upgrades':
        return devices.filter(d => 
          (d.operatingSystem || '').toLowerCase().includes('windows 10'));
      case 'site':
        return devices;
      default:
        return devices;
    }
  };
  
  // Handle report download
  const handleDownloadReport = (reportType) => {
    const reportData = generateReportData(reportType);
    const fields = ['siteName', 'deviceHostname', 'deviceDescription', 'lastUser', 
                   'lastSeen', 'deviceType', 'deviceModel', 'operatingSystem', 
                   'serialNumber', 'deviceCpu', 'macAddresses'];
    
    // Simple CSV generation
    const csvContent = [
      fields.join(','),
      ...reportData.map(device => 
        fields.map(field => {
          const value = device[field];
          if (Array.isArray(value)) return `"${value.join(', ')}"`;
          return `"${value || ''}"`;
        }).join(',')
      )
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl" 
      centered
      className={`analytics-modal ${darkMode ? 'dark-mode' : ''}`}
    >
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fs-4 fw-semibold">Device Analytics Dashboard</Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 py-3">
        {/* Modern Tab Navigation */}
        <Nav 
          variant="pills" 
          className="analytics-tabs mb-4 gap-2"
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
        >
          <Nav.Item>
             <Nav.Link 
              eventKey="site-summary"
              className="d-flex align-items-center gap-2"
            >
              <FontAwesomeIcon icon={faBuilding} />
              <div>
                <div className="tab-title">Site Summary</div>
                <small className="tab-desc">Overview of devices across sites</small>
              </div>
              </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              eventKey="health-metrics"
              className="d-flex align-items-center gap-2"
            >
              <FontAwesomeIcon icon={faHeartbeat} />
              <div>
                <div className="tab-title">Health Metrics</div>
                <small className="tab-desc">Device health status</small>
              </div>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              eventKey="reports"
              className="d-flex align-items-center gap-2"
            >
              <FontAwesomeIcon icon={faFileAlt} />
              <div>
                <div className="tab-title">Reports</div>
                <small className="tab-desc">Generate reports</small>
              </div>
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'site-summary' && (
            <Row xs={1} md={2} lg={3} className="g-4">
              {Object.entries(devicesBySite).map(([site, siteDevices]) => (
                <Col key={site}>
                  <Card className="site-card h-100 border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex align-items-center gap-3 mb-4">
                        <div className="stats-icon">
                          <FontAwesomeIcon icon={faBuilding} />
                        </div>
                        <div>
                          <h5 className="mb-1 fw-semibold">{site}</h5>
                          <div className="text-muted small">
                            {siteDevices.length} devices
                          </div>
                        </div>
                      </div>
                      
                      <div className="device-stats">
                        <div className="stat-item">
                          <div className="stat-label">Active</div>
                          <div className="stat-value text-success">
                            {siteDevices.filter(d => getDeviceStatus(d.lastSeen) === 'active').length}
                          </div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-label">Offline</div>
                          <div className="stat-value text-danger">
                            {siteDevices.filter(d => getDeviceStatus(d.lastSeen) === 'inactive').length}
                          </div>
                        </div>
                      </div>

                      <div className="device-types mt-4">
                        <h6 className="mb-3 text-muted fw-semibold">Device Types</h6>
                        {Object.entries(getDeviceTypesBySite(siteDevices)).map(([type, count]) => (
                          <div key={type} className="type-item d-flex align-items-center justify-content-between mb-2">
                            <span className="d-flex align-items-center gap-2">
                              <FontAwesomeIcon icon={getDeviceTypeIcon(type)} className="type-icon" />
                              {type}
                            </span>
                            <Badge bg="primary" pill>{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {activeTab === 'health-metrics' && (
            <Row className="g-4">
              <Col md={6}>
                <Card className={darkMode ? 'bg-dark text-light' : ''}>
                  <Card.Body>
                    <Card.Title>Device Health Overview</Card.Title>
                    <div className="mt-3">
                      {[7, 14, 30].map(days => (
                        <div key={days} className="mb-3">
                          <h6>Not seen in {days} days:</h6>
                          <h3>{getDevicesNotSeenInDays(devices, days).length} devices</h3>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className={darkMode ? 'bg-dark text-light' : ''}>
                  <Card.Body>
                    <Card.Title>OS Distribution</Card.Title>
                    <div className="mt-3">
                      {Object.entries(getOSDistribution(devices)).map(([os, count]) => (
                        <div key={os} className="d-flex justify-content-between align-items-center mb-2">
                          <span>{os}</span>
                          <Badge bg="info">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {activeTab === 'reports' && (
            <Row className="g-4">
              <Col xs={12}>
                <div className="d-grid gap-3">
                  <Button 
                    variant="outline-primary"
                    onClick={() => handleDownloadReport('maintenance')}
                  >
                    <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                    Download Maintenance Report
                  </Button>
                  <Button 
                    variant="outline-primary"
                    onClick={() => handleDownloadReport('upgrades')}
                  >
                    <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                    Download Upgrades Report
                  </Button>
                  <Button 
                    variant="outline-primary"
                    onClick={() => handleDownloadReport('site')}
                  >
                    <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                    Download Full Site Report
                  </Button>
                </div>
              </Col>
            </Row>
          )}
        </div>
      </Modal.Body>

      <style jsx>{`
        .analytics-modal .modal-content {
          border: none;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
        }

        .analytics-tabs .nav-link {
          border-radius: 8px;
          padding: 0.75rem 1.25rem;
          border: 1px solid var(--bs-border-color);
          background: transparent;
          color: var(--bs-body-color);
        }

        .analytics-tabs .nav-link.active {
          background: var(--bs-primary);
          border-color: var(--bs-primary);
          color: white;
        }

        .tab-title {
          font-weight: 500;
          font-size: 0.9rem;
        }

        .tab-desc {
          font-size: 0.75rem;
          opacity: 0.7;
        }

        .site-card {
          transition: transform 0.2s;
        }

        .site-card:hover {
          transform: translateY(-2px);
        }

        .stats-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: var(--bs-primary-bg-subtle);
          color: var(--bs-primary);
        }

        .device-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-top: 1rem;
        }

        .stat-item {
          padding: 1rem;
          background: var(--bs-light);
          border-radius: 8px;
          text-align: center;
        }

        .stat-label {
          font-size: 0.8rem;
          color: var(--bs-secondary);
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 600;
        }

        .type-icon {
          color: var(--bs-primary);
        }

        /* Dark mode styles */
        .dark-mode .analytics-modal .modal-content {
          background-color: #1a1a1a;
          color: #e0e0e0;
        }

        .dark-mode .site-card {
          background-color: #242424;
        }

        .dark-mode .stat-item {
          background-color: #2d2d2d;
        }

        .dark-mode .analytics-tabs .nav-link {
          border-color: #2d2d2d;
          color: #e0e0e0;
        }
      `}</style>
    </Modal>
  );
};

const UserInventoryView = () => {
  const { currentUser } = useAuth();
  const { siteName } = useParams();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  
  // Create refs for dropdown menus
  const statusDropdownRef = useRef(null);
  const typeDropdownRef = useRef(null);
  
  // Get user location from currentUser or URL param
  const userLocation = siteName ? decodeURIComponent(siteName) : currentUser?.location || currentUser?.assigned_site || null;
  
  const fetchUserInventory = async () => {
    if (!userLocation) {
      setError('No location assigned to your account');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Fetching inventory for location: ${userLocation}`);
      
      const encodedLocation = encodeURIComponent(userLocation);
      const response = await api.get(`/sites/${encodedLocation}/inventory`);
      
      if (response && response.data) {
        // Transform the data for table
        const transformedData = response.data.map(item => ({
          id: item.id,
          siteName: userLocation,
          deviceHostname: item.device_hostname || 'N/A',
          deviceDescription: item.device_description || 'N/A',
          lastUser: item.last_user || 'N/A',
          lastSeen: item.last_seen ? new Date(item.last_seen) : null,
          deviceType: item.device_type || 'N/A',
          deviceModel: item.device_model || 'N/A',
          operatingSystem: item.operating_system || 'N/A',
          serialNumber: item.serial_number || 'N/A',
          deviceCpu: item.device_cpu || 'N/A',
          macAddresses: Array.isArray(item.mac_addresses) 
            ? item.mac_addresses.join(', ')
            : item.mac_addresses || 'N/A',
          status: item.status || 'Unknown',
        }));
        
        setInventory(transformedData);
        setError(null);
      } else {
        setInventory([]);
        setError('No inventory data available for your location');
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(`Failed to load inventory: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUserInventory();
    
    // Add click event listener to close dropdowns when clicked outside
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setShowTypeDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userLocation]);
  
  // Get unique device types from inventory
  const deviceTypes = () => {
    const types = new Set(inventory.map(item => item.deviceType).filter(Boolean));
    return Array.from(types);
  };
  
  // Get unique statuses from inventory
  const deviceStatuses = () => {
    const statuses = new Set(inventory.map(item => item.status).filter(Boolean));
    return Array.from(statuses);
  };
  
  // Refresh function
  const handleRefresh = () => {
    fetchUserInventory();
  };
  
  // Analytics function
  const handleAnalytics = () => {
    setShowAnalyticsModal(true);
  };
  
  // Toggle status dropdown
  const toggleStatusDropdown = () => {
    setShowStatusDropdown(!showStatusDropdown);
    setShowTypeDropdown(false);
  };
  
  // Toggle type dropdown
  const toggleTypeDropdown = () => {
    setShowTypeDropdown(!showTypeDropdown);
    setShowStatusDropdown(false);
  };
  
  // Filter functionality
  const filteredInventory = () => {
    return inventory.filter(item => {
      // Apply status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      
      // Apply type filter
      if (typeFilter !== 'all' && item.deviceType !== typeFilter) {
        return false;
      }
      
      // Apply search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        // Search across all fields
        return Object.values(item).some(val => 
          val && 
          typeof val === 'string' && 
          val.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  };
  
  // Get device type icon class
  const getDeviceIconClass = (deviceType) => {
    if (!deviceType) return '';
    const type = deviceType.toLowerCase();
    if (type.includes('server')) return 'server-icon';
    if (type.includes('desktop')) return 'desktop-icon';
    return '';
  };
  
  // Cell renderer for site name with status indicator
  const renderSiteNameCell = (data) => {
    return (
      <div className="d-flex align-items-center">
        <span className="status-dot status-active me-2"></span>
        <span>{data.value}</span>
      </div>
    );
  };
  
  // Cell renderer for device type
  const renderDeviceTypeCell = (data) => {
    return (
      <div className="d-flex align-items-center">
        <span className={`device-type-icon ${getDeviceIconClass(data.value)}`}></span>
        <span className="device-type-badge">{data.value}</span>
      </div>
    );
  };
  
  // Cell renderer for status badges
  const renderStatusCell = (data) => {
    const status = data.value.toLowerCase();
    let badgeClass = "status-badge status-info";
    
    if (status === 'active') badgeClass = "status-badge status-success";
    if (status === 'inactive') badgeClass = "status-badge status-secondary";
    if (status === 'maintenance') badgeClass = "status-badge status-warning";
    
    return <span className={badgeClass}>{data.value}</span>;
  };
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading inventory data...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          {error}
        </Alert>
      </Container>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Container fluid className="py-4 px-4">
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-center mb-3">
                  <div className="site-icon me-3">
                    <FontAwesomeIcon icon={faServer} />
                  </div>
                  <div>
                    <h5 className="mb-0">{userLocation} - Device Inventory</h5>
                    <div className="text-muted small">Location: Modesto</div>
                  </div>
                </div>
                
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex filter-buttons">
                    {/* Status Dropdown */}
                    <div className="dropdown me-2" ref={statusDropdownRef}>
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        className="dropdown-toggle" 
                        onClick={toggleStatusDropdown}
                      >
                        {statusFilter === 'all' ? 'All Statuses' : statusFilter}
                        <FontAwesomeIcon icon={faChevronDown} className="ms-1" />
                      </Button>
                      <div className={`dropdown-menu ${showStatusDropdown ? 'show' : ''}`}>
                        <button 
                          className="dropdown-item" 
                          onClick={() => {
                            setStatusFilter('all');
                            setShowStatusDropdown(false);
                          }}
                        >
                          All Statuses
                        </button>
                        <div className="dropdown-divider"></div>
                        {deviceStatuses().map(status => (
                          <button 
                            key={status}
                            className={`dropdown-item ${statusFilter === status ? 'active' : ''}`}
                            onClick={() => {
                              setStatusFilter(status);
                              setShowStatusDropdown(false);
                            }}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Type Dropdown */}
                    <div className="dropdown me-2" ref={typeDropdownRef}>
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        className="dropdown-toggle" 
                        onClick={toggleTypeDropdown}
                      >
                        {typeFilter === 'all' ? 'All Types' : typeFilter}
                        <FontAwesomeIcon icon={faChevronDown} className="ms-1" />
                      </Button>
                      <div className={`dropdown-menu ${showTypeDropdown ? 'show' : ''}`}>
                        <button 
                          className="dropdown-item" 
                          onClick={() => {
                            setTypeFilter('all');
                            setShowTypeDropdown(false);
                          }}
                        >
                          All Types
                        </button>
                        <div className="dropdown-divider"></div>
                        {deviceTypes().map(type => (
                          <button 
                            key={type}
                            className={`dropdown-item ${typeFilter === type ? 'active' : ''}`}
                            onClick={() => {
                              setTypeFilter(type);
                              setShowTypeDropdown(false);
                            }}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Refresh Button */}
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      className="me-2"
                      onClick={handleRefresh}
                    >
                      <FontAwesomeIcon icon={faSync} className="me-1" /> Refresh
                    </Button>
                    
                    {/* Analytics Button */}
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={handleAnalytics}
                    >
                      <FontAwesomeIcon icon={faChartBar} className="me-1" /> Analytics
                    </Button>
                  </div>
                  
                  {/* Search Box */}
                  <div className="search-container">
                    <input
                      type="text"
                      className="form-control form-control-sm search-input"
                      placeholder="Search devices..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Row>
          <Col>
            {filteredInventory().length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover inventory-table">
                  <thead>
                    <tr>
                      <th>Site Name</th>
                      <th>Device Hostname</th>
                      <th>Description</th>
                      <th>Last User</th>
                      <th>Last Seen</th>
                      <th>Device Type</th>
                      <th>Model</th>
                      <th>OS</th>
                      <th>Serial Number</th>
                      <th>CPU</th>
                      <th>MAC Address(es)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory().map((device, index) => (
                      <tr key={device.id || index}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <FontAwesomeIcon 
                              icon={faCircle} 
                              size="xs" 
                              className="text-success" 
                            />
                            {device.siteName}
                          </div>
                        </td>
                        <td>{device.deviceHostname}</td>
                        <td>{device.deviceDescription}</td>
                        <td>{device.lastUser}</td>
                        <td>{device.lastSeen ? new Date(device.lastSeen).toLocaleDateString() : 'N/A'}</td>
                        <td>
                          <Badge bg="info" text="dark" className="bg-opacity-10">
                            <FontAwesomeIcon 
                              icon={device.deviceType?.toLowerCase().includes('server') ? faServer : faDesktop} 
                              size="xs" 
                              className="me-1" 
                            />
                            {device.deviceType}
                          </Badge>
                        </td>
                        <td>{device.deviceModel}</td>
                        <td>{device.operatingSystem}</td>
                        <td>{device.serialNumber}</td>
                        <td>{device.deviceCpu}</td>
                        <td>{device.macAddresses}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Alert variant="info" className="text-center">
                No inventory items found matching your criteria
              </Alert>
            )}
          </Col>
        </Row>
      </Container>
      
      {/* Analytics Modal */}
      <AnalyticsModal 
        show={showAnalyticsModal} 
        onHide={() => setShowAnalyticsModal(false)} 
        devices={inventory}
      />
    </motion.div>
  );
};

export default UserInventoryView;