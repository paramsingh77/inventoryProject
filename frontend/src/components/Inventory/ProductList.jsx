import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Form, Badge, Modal, Card, Container, Row, Col, InputGroup, Nav, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faTrash, 
  faChevronDown,
  faCircle,
  faArrowUpRightFromSquare,
  faSearch,
  faChartLine,
  faBuilding,
  faHeartbeat,
  faShieldAlt,
  faHistory,
  faFileAlt,
  faDesktop,
  faServer,
  faArrowUp,
  faExclamationTriangle,
  faShoppingCart,
  faSync,
  faLaptop,
  faCloud,
  faMobileAlt,
  faKey,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import AddDeviceModal from './AddDeviceModal';
import EditDeviceModal from './EditDeviceModal';
import axios from 'axios';
import { 
  getDeviceCategories, 
  getExclusiveDeviceCategories, 
  categorizeDeviceExclusive,
  detectDeviceCategory,
  isServerPhysical,
  isServerPhysicalStrict,
  isServerVM,
  isCellPhoneATT,
  isCellPhoneVerizon,
  isDLALIONLicense,
  isDesktop,
  isLaptop
} from '../../scripts/device_categorization';
import { API_CONFIG } from '../../utils/apiConfig';

// Analytics Dashboard Modal Component
const AnalyticsModal = ({ show, onHide, devices }) => {
  const [activeTab, setActiveTab] = useState('site-summary');
  const { darkMode } = useTheme();
  
  // Count devices by site
  const devicesBySite = devices.reduce((acc, device) => {
    const site = device.site_name || 'Unknown';
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
      const type = device.device_type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  };
  
  // Get OS distribution
  const getOSDistribution = (allDevices) => {
    return allDevices.reduce((acc, device) => {
      const os = device.operating_system || 'Unknown';
      const mainOS = os.split(' ')[0] + ' ' + (os.split(' ')[1] || '');
      acc[mainOS] = (acc[mainOS] || 0) + 1;
      return acc;
    }, {});
  };
  
  // Get devices not seen in last X days
  const getDevicesNotSeenInDays = (allDevices, days) => {
    const now = new Date();
    return allDevices.filter(device => {
      if (!device.last_seen || device.last_seen === 'N/A') return true;
      if (device.last_seen === 'Currently Online') return false;
      
      const date = new Date(device.last_seen);
      if (isNaN(date.getTime())) return false;
      
      const diffDays = (now - date) / (1000 * 60 * 60 * 24);
      return diffDays > days;
    });
  };
  
  // Get OS version distribution
  const getOSVersions = (allDevices) => {
    return allDevices.reduce((acc, device) => {
      const os = device.operating_system || 'Unknown';
      acc[os] = (acc[os] || 0) + 1;
      return acc;
    }, {});
  };
  
  // Get outdated OS devices
  const getOutdatedOSDevices = (allDevices) => {
    return allDevices.filter(device => {
      const os = device.operating_system || '';
      // Check for Windows 10 or earlier
      if (os.includes('Windows')) {
        const version = parseInt(os.split(' ')[1]);
        return version < 11; // Consider Windows 10 or earlier as outdated
      }
      // You can add more OS checks here
      return false;
    });
  };
  
  // Generate downloadable report data
  const generateReportData = (reportType) => {
    switch (reportType) {
      case 'maintenance':
        return getDevicesNotSeenInDays(devices, 7);
      case 'upgrades':
        return getOutdatedOSDevices(devices);
      case 'site':
        // This would typically be filtered by a selected site
        return devices.filter(d => d.site_name === 'AAM');
      default:
        return devices;
    }
  };
  
  // Handle report download
  const handleDownloadReport = (reportType) => {
    const reportData = generateReportData(reportType);
    const fields = ['site_name', 'device_hostname', 'device_description', 'last_user', 
                   'last_seen', 'device_type', 'device_model', 'operating_system', 
                   'serial_number', 'device_cpu', 'mac_addresses'];
    
    // Convert to CSV (simple version)
    let csv = fields.join(',') + '\n';
    
    reportData.forEach(device => {
      const row = fields.map(field => {
        // Handle fields that might contain commas
        const value = device[field] || '';
        return `"${value.toString().replace(/"/g, '""')}"`;
      }).join(',');
      csv += row + '\n';
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `inventory-report-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Animation variants for cards
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  // Animation variants for tabs
  const tabVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  // Calculate dashboard metrics
  const getDashboardMetrics = (allDevices) => {
    const totalDevices = allDevices.length;
    
    // Calculate active devices (seen in last 24 hours)
    const activeDevices = allDevices.filter(device => {
      const status = getDeviceStatus(device.last_seen);
      return status === 'online' || status === 'recently-active';
    }).length;
    
    // Calculate offline devices (not seen in over 7 days)
    const offlineDevices = getDevicesNotSeenInDays(allDevices, 7).length;
    
    // Calculate devices needing updates
    const pendingUpdates = getOutdatedOSDevices(allDevices).length;
    
    // Calculate recent activity (devices with activity in last 72 hours)
    const recentActivity = allDevices.filter(device => {
      if (device.last_seen === 'Currently Online') return true;
      
      try {
        if (!device.last_seen) return false;
        const lastSeen = new Date(device.last_seen);
        const now = new Date();
        const hoursDiff = Math.abs(now - lastSeen) / 36e5; // Convert ms to hours
        return hoursDiff <= 72;
      } catch (e) {
        return false;
      }
    }).length;
    
    return {
      totalDevices,
      activeDevices,
      offlineDevices,
      pendingUpdates,
      recentActivity
    };
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl" 
      centered
      dialogClassName="analytics-modal-dialog"
      contentClassName="analytics-modal-content"
      className={`analytics-modal ${darkMode ? 'dark-mode' : ''}`}
    >
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@300;400;500;600;700&display=swap');
          
          .analytics-modal * {
            font-family: 'Afacad', sans-serif !important;
          }
          
          .analytics-modal-dialog {
            max-width: 90%;
            margin: 1.75rem auto;
          }
          
          .analytics-modal-content {
            border-radius: 1rem;
            border: ${darkMode ? '1px solid #444' : '1px solid #dee2e6'};
            overflow: visible !important;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
          }
          
          .modal-body {
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
          }
          
          .table-responsive {
            overflow: visible !important;
          }
          
          /* Aceternity-inspired table styling */
          .table {
            border-collapse: separate;
            border-spacing: 0;
            width: 100%;
          }
          
          .table th {
            font-weight: 500;
            text-transform: uppercase;
            font-size: 0.8rem;
            letter-spacing: 0.5px;
            padding: 1rem;
            border-bottom: 1px solid ${darkMode ? '#444' : '#e9ecef'};
            color: ${darkMode ? '#aaa' : '#6c757d'};
            background: ${darkMode ? '#222' : '#f8f9fa'};
            transition: all 0.2s ease;
          }
          
          .table td {
            padding: 1rem;
            border-bottom: 1px solid ${darkMode ? '#333' : '#f0f0f0'};
            transition: all 0.2s ease;
          }
          
          .table tbody tr {
            background: ${darkMode ? '#1a1a1a' : 'white'};
            transition: all 0.2s ease;
          }
          
          .table tbody tr:hover {
            background: ${darkMode ? '#222' : '#f8f9fa'};
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
          }
          
          /* Cards with Aceternity styling */
          .card {
            border-radius: 1rem;
            border: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, ${darkMode ? '0.15' : '0.05'});
            transition: all 0.3s ease;
            overflow: hidden;
            backdrop-filter: blur(5px);
          }
          
          .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, ${darkMode ? '0.25' : '0.1'});
          }
          
          .card-body {
            padding: 1.5rem;
          }
          
          /* Badge styling */
          .badge {
            font-weight: normal;
            padding: 0.5rem 0.8rem;
            border-radius: 30px;
            font-size: 0.8rem;
            letter-spacing: 0.3px;
            text-transform: capitalize;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          }
          
          /* Tab styling */
          .analytics-tabs {
            position: sticky;
            top: 0;
            z-index: 10;
            background: ${darkMode ? 'rgba(26, 26, 26, 0.9)' : 'rgba(248, 249, 250, 0.9)'};
            backdrop-filter: blur(8px);
            padding: 1rem 1.5rem;
            border-bottom: 1px solid ${darkMode ? '#333' : '#dee2e6'};
          }
          
          .nav-pills .nav-link {
            border-radius: 30px;
            padding: 0.6rem 1.2rem;
            font-weight: 500;
            font-size: 0.9rem;
            letter-spacing: 0.3px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid transparent;
          }
          
          .nav-pills .nav-link:hover {
            transform: translateY(-2px);
          }
          
          .nav-pills .nav-link.active {
            background: ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(13, 110, 253, 0.1)'};
            color: ${darkMode ? 'white' : '#0d6efd'};
            border: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(13, 110, 253, 0.2)'};
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          }
          
          /* Content section */
          .content-section {
            padding: 2rem;
          }
          
          .card-spacing {
            margin-bottom: 2.5rem;
          }
          
          /* Buttons */
          .btn {
            border-radius: 30px;
            padding: 0.6rem 1.5rem;
            font-weight: 500;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
          }
          
          .btn:before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 0;
            height: 100%;
            background: rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
            z-index: 0;
          }
          
          .btn:hover:before {
            width: 100%;
          }
          
          .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          
          /* Form controls */
          .form-control {
            border-radius: 0.5rem;
            padding: 0.7rem 1rem;
            border: 1px solid ${darkMode ? '#444' : '#dee2e6'};
            background-color: ${darkMode ? '#222' : 'white'};
            color: ${darkMode ? '#e0e0e0' : 'inherit'};
            transition: all 0.2s ease;
          }
          
          .form-control:focus {
            border-color: ${darkMode ? '#666' : '#b0c4de'};
            box-shadow: 0 0 0 0.25rem ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(13, 110, 253, 0.15)'};
          }
          
          /* Dark mode specific */
          .dark-mode .bg-dark {
            background-color: #121212 !important;
          }
          
          .dark-mode .text-muted {
            color: #aaaaaa !important;
          }
          
          /* Modal header and footer */
          .modal-header {
            padding: 1.5rem;
            border-bottom: 1px solid ${darkMode ? '#333' : '#dee2e6'};
          }
          
          .modal-footer {
            padding: 1.5rem;
            border-top: 1px solid ${darkMode ? '#333' : '#dee2e6'};
          }
          
          /* Close button */
          .btn-close {
            opacity: 0.7;
            transition: all 0.3s ease;
          }
          
          .btn-close:hover {
            opacity: 1;
            transform: rotate(90deg);
          }
          
          /* Icon styling */
          .fa-icon-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 12px;
            margin-right: 1rem;
          }
        `}
      </style>
      
      <Modal.Header closeButton className={darkMode ? 'bg-dark text-white border-secondary' : ''}>
        <Modal.Title className="d-flex align-items-center">
          <div className={`fa-icon-wrapper bg-primary bg-opacity-10`}>
            <FontAwesomeIcon icon={faChartLine} className="text-primary" />
          </div>
          <span className="fw-bold">Inventory Analytics Dashboard</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={`${darkMode ? 'bg-dark text-white' : 'bg-light'}`}>
        <Nav 
          variant="pills" 
          className="analytics-tabs"
        >
          {[
            { id: 'site-summary', label: 'Site Summary', icon: faBuilding },
            { id: 'device-health', label: 'Device Health', icon: faHeartbeat },
            { id: 'software-compliance', label: 'Compliance', icon: faShieldAlt },
            { id: 'inventory-changes', label: 'Changes', icon: faHistory },
            { id: 'reports', label: 'Reports', icon: faFileAlt }
          ].map((tab) => (
            <motion.div
              key={tab.id}
              variants={tabVariants}
              initial="hidden"
              animate="visible"
            >
             <Nav.Link 
        active={false} // Override Bootstrap's built-in active styling
        onClick={() => setActiveTab(tab.id)} 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1.5rem',
          borderRadius: '50px',
          backgroundColor: activeTab === tab.id 
            ? '#4a90e2' // Custom blue color for active tab
            : darkMode ? '#1a1a1a' : 'transparent',
          color: activeTab === tab.id 
            ? 'white' 
            : darkMode ? 'white' : 'black'
        }}
      >
                <FontAwesomeIcon icon={tab.icon} />
                {tab.label}
              </Nav.Link>
            </motion.div>
          ))}
        </Nav>
        
        <div className="content-section">
          {/* Site-Level Summary */}
          {activeTab === 'site-summary' && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { 
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
            >
              <h5 className="mb-4 d-flex align-items-center">
                <FontAwesomeIcon icon={faBuilding} className="me-2" />
                Site-Level Device Summary
              </h5>
              
              {/* Real-time Dashboard Stats */}
              {(() => {
                const metrics = getDashboardMetrics(devices);
                return (
                  <Row className="g-4 card-spacing">
                    <Col>
                      <motion.div variants={cardVariants} className="card h-100 border-0 shadow-sm">
                        <div className="card-body d-flex align-items-center">
                          <div className={`fa-icon-wrapper bg-primary bg-opacity-10`}>
                            <FontAwesomeIcon icon={faServer} className="text-primary" />
                          </div>
                          <div>
                            <h6 className="text-muted mb-1">Total Devices</h6>
                            <h4 className="mb-0 fw-bold">{metrics.totalDevices}</h4>
                          </div>
                        </div>
                      </motion.div>
                    </Col>
                    <Col>
                      <motion.div variants={cardVariants} className="card h-100 border-0 shadow-sm">
                        <div className="card-body d-flex align-items-center">
                          <div className={`fa-icon-wrapper bg-success bg-opacity-10`}>
                            <FontAwesomeIcon icon={faArrowUp} className="text-success" />
                          </div>
                          <div>
                            <h6 className="text-muted mb-1">Active Devices</h6>
                            <h4 className="mb-0 fw-bold">{metrics.activeDevices}</h4>
                          </div>
                        </div>
                      </motion.div>
                    </Col>
                    <Col>
                      <motion.div variants={cardVariants} className="card h-100 border-0 shadow-sm">
                        <div className="card-body d-flex align-items-center">
                          <div className={`fa-icon-wrapper bg-danger bg-opacity-10`}>
                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-danger" />
                          </div>
                          <div>
                            <h6 className="text-muted mb-1">Offline Devices</h6>
                            <h4 className="mb-0 fw-bold">{metrics.offlineDevices}</h4>
                          </div>
                        </div>
                      </motion.div>
                    </Col>
                    <Col>
                      <motion.div variants={cardVariants} className="card h-100 border-0 shadow-sm">
                        <div className="card-body d-flex align-items-center">
                          <div className={`fa-icon-wrapper bg-warning bg-opacity-10`}>
                            <FontAwesomeIcon icon={faShoppingCart} className="text-warning" />
                          </div>
                          <div>
                            <h6 className="text-muted mb-1">Pending Updates</h6>
                            <h4 className="mb-0 fw-bold">{metrics.pendingUpdates}</h4>
                          </div>
                        </div>
                      </motion.div>
                    </Col>
                    <Col>
                      <motion.div variants={cardVariants} className="card h-100 border-0 shadow-sm">
                        <div className="card-body d-flex align-items-center">
                          <div className={`fa-icon-wrapper bg-info bg-opacity-10`}>
                            <FontAwesomeIcon icon={faSync} className="text-info" />
                          </div>
                          <div>
                            <h6 className="text-muted mb-1">Recent Activity</h6>
                            <h4 className="mb-0 fw-bold">{metrics.recentActivity}</h4>
                          </div>
                        </div>
                      </motion.div>
                    </Col>
                  </Row>
                );
              })()}
              
              {/* Rest of the site summary content */}
              <div className="site-level-summary card-spacing">
                <Row className="g-0">
                  <Col lg={6} className="h-100">
                    <motion.div variants={cardVariants} className="h-100">
                      <Card 
                        className={`border-0 ${darkMode ? 'bg-dark text-white' : ''}`}
                        style={{ 
                          backgroundColor: darkMode ? '#2d2d2d' : '',
                          borderRadius: '8px',
                          margin: '1px',
                          height: '100%'
                        }}
                      >
                        <Card.Header 
                          className={`border-0 py-2 ${darkMode ? 'bg-dark' : 'bg-primary bg-opacity-10'}`}
                          style={{ borderRadius: '8px 8px 0 0' }}
                        >
                          <h6 className="mb-0 d-flex align-items-center">
                            <FontAwesomeIcon icon={faBuilding} className="me-2" />
                            {devices[0]?.site_name || 'Site'} 
                          </h6>
                        </Card.Header>
                        <Card.Body className="p-3">
                          <div className="mb-2">
                            <h3 className="mb-0 fw-bold text-primary">{devices.length}</h3>
                            <small className={`text-${darkMode ? 'light' : 'muted'}`}>Total Devices</small>
                          </div>
                          
                          {(() => {
                            // Calculate active/inactive devices
                            const activeDevices = devices.filter(d => getDeviceStatus(d.last_seen) === 'active').length;
                            const inactiveDevices = devices.length - activeDevices;
                            
                            // Calculate device types
                            const deviceTypes = devices.reduce((acc, device) => {
                              const type = device.device_type || 'Unknown';
                              acc[type] = (acc[type] || 0) + 1;
                              return acc;
                            }, {});
                            
                            // Get top 3 device types
                            const topDeviceTypes = Object.entries(deviceTypes)
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 3);
                            
                            return (
                              <>
                                <div className="mb-2">
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className={darkMode ? 'text-light' : ''}>Active Devices</span>
                                    <h6 className="mb-0 text-success">{activeDevices}</h6>
                                  </div>
                                  <div className="d-flex justify-content-between align-items-center">
                                    <span className={darkMode ? 'text-light' : ''}>Inactive Devices</span>
                                    <h6 className="mb-0 text-danger">{inactiveDevices}</h6>
                                  </div>
                                </div>
                                
                                <div>
                                  <h6 className="mb-2">Device Types</h6>
                                  {topDeviceTypes.map(([type, count], index) => (
                                    <div key={index} className="d-flex justify-content-between align-items-center mb-1">
                                      <span className={`${darkMode ? 'text-light' : ''} small`}>{type}</span>
                                      <Badge 
                                        bg={index === 0 ? 'primary' : index === 1 ? 'info' : 'secondary'} 
                                        className="rounded-pill"
                                      >
                                        {count}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </>
                            );
                          })()}
                        </Card.Body>
                      </Card>
                    </motion.div>
                  </Col>
                  <Col lg={6}>
                    <Row className="g-0 h-100">
                      <Col xs={12} className="mb-1 h-50">
                        <motion.div variants={cardVariants} className="h-100">
                          <Card 
                            className={`border-0 ${darkMode ? 'bg-dark text-white' : ''}`}
                            style={{ 
                              backgroundColor: darkMode ? '#2d2d2d' : '',
                              borderRadius: '8px',
                              margin: '1px',
                              height: '100%'
                            }}
                          >
                            <Card.Body className="p-3">
                              <h6 className="mb-3 d-flex align-items-center">
                                <FontAwesomeIcon icon={faDesktop} className="me-2" />
                                OS Distribution Across Sites
                              </h6>
                              <div className="d-flex flex-wrap justify-content-around gap-2">
                                {(() => {
                                  const osDistribution = getOSDistribution(devices);
                                  return Object.entries(osDistribution).map(([os, count], index) => (
                                    <motion.div
                                      key={os}
                                      className="text-center"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ delay: 0.1 + (index * 0.05) }}
                                    >
                                      <div 
                                        className={`mb-2 p-2 rounded-circle d-flex align-items-center justify-content-center ${
                                          darkMode ? 'bg-dark' : 'bg-light'
                                        }`}
                                        style={{ 
                                          width: '70px', 
                                          height: '70px',
                                          border: '2px solid #0d6efd'
                                        }}
                                      >
                                        <h4 className="mb-0 fw-bold">{count}</h4>
                                      </div>
                                      <div className={`small ${darkMode ? 'text-light' : ''}`}>{os}</div>
                                    </motion.div>
                                  ));
                                })()}
                              </div>
                            </Card.Body>
                          </Card>
                        </motion.div>
                      </Col>
                      <Col xs={12} className="mt-1 h-50">
                        <motion.div variants={cardVariants} className="h-100">
                          <Card 
                            className={`border-0 ${darkMode ? 'bg-dark text-white' : ''}`}
                            style={{ 
                              backgroundColor: darkMode ? '#2d2d2d' : '',
                              borderRadius: '8px',
                              margin: '1px',
                              height: '100%'
                            }}
                          >
                            <Card.Body className="p-3">
                              <h6 className="mb-3 d-flex align-items-center">
                                <FontAwesomeIcon icon={faHeartbeat} className="me-2" />
                                Device Health Overview
                              </h6>
                              <Row className="g-2">
                                <Col xs={6}>
                                  <div className="border-end">
                                    <div className="text-center">
                                      {(() => {
                                        // Count online devices
                                        const onlineDevices = devices.filter(device => {
                                          return device.last_seen === 'Currently Online' || 
                                                (device.last_seen && new Date(device.last_seen) > new Date(Date.now() - 24 * 60 * 60 * 1000));
                                        }).length;
                                        return (
                                          <>
                                            <h3 className="mb-1 text-success">{onlineDevices}</h3>
                                            <small className={`${darkMode ? 'text-light' : 'text-muted'}`}>Online Now</small>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </Col>
                                <Col xs={6}>
                                  <div className="text-center">
                                    {(() => {
                                      // Count offline devices
                                      const offlineDevices = getDevicesNotSeenInDays(devices, 7).length;
                                      return (
                                        <>
                                          <h3 className="mb-1 text-warning">{offlineDevices}</h3>
                                          <small className={`${darkMode ? 'text-light' : 'text-muted'}`}>Offline &gt;7 Days</small>
                                        </>
                                      );
                                    })()}
                                  </div>
                                </Col>
                                <Col xs={12}>
                                  <div className="mt-3">
                                    {(() => {
                                      // Count OS versions
                                      const osVersions = devices.reduce((acc, device) => {
                                        const os = device.operating_system || 'Unknown';
                                        acc[os] = (acc[os] || 0) + 1;
                                        return acc;
                                      }, {});
                                      
                                      // Get top 2 OS versions
                                      const topOSVersions = Object.entries(osVersions)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 2);
                                      
                                      return topOSVersions.map(([os, count], index) => (
                                        <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                                          <small className={darkMode ? 'text-light' : ''}>{os}</small>
                                          <small className={index === 0 ? 'text-success' : 'text-warning'}>
                                            {count} devices
                                          </small>
                                        </div>
                                      ));
                                    })()}
                                  </div>
                                </Col>
                              </Row>
                            </Card.Body>
                          </Card>
                        </motion.div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </div>
            </motion.div>
          )}
          
          {/* Device Health & Usage */}
          {activeTab === 'device-health' && (
            <div>
              <h5 className="mb-4">Device Health & Usage Analytics</h5>
              
              <div className="mb-4">
                <h6>Devices Not Seen in Last 7 Days</h6>
                <Card className={darkMode ? 'bg-secondary text-white' : ''}>
                  <Card.Body>
                    <div className="table-responsive">
                      <Table className={`table-sm ${darkMode ? 'table-dark' : ''}`}>
                        <thead>
                          <tr>
                            <th>Hostname</th>
                            <th>Site</th>
                            <th>Last User</th>
                            <th>Last Seen</th>
                            <th>Device Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getDevicesNotSeenInDays(devices, 7).slice(0, 5).map((device, index) => (
                            <tr key={index}>
                              <td>{device.device_hostname}</td>
                              <td>{device.site_name}</td>
                              <td>{device.last_user}</td>
                              <td>{device.last_seen}</td>
                              <td>{device.device_type}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                      {getDevicesNotSeenInDays(devices, 7).length > 5 && (
                        <div className="text-center mt-2">
                          <small>
                            Showing 5 of {getDevicesNotSeenInDays(devices, 7).length} inactive devices
                          </small>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </div>
              
              <div className="mt-4">
                <h6>CPU Models Distribution</h6>
                <Card className={darkMode ? 'bg-secondary text-white' : ''}>
                  <Card.Body>
                    <div className="table-responsive">
                      <Table className={`table-sm ${darkMode ? 'table-dark' : ''}`}>
                        <thead>
                          <tr>
                            <th>CPU Model</th>
                            <th>Count</th>
                            <th>% of Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(devices.reduce((acc, device) => {
                            const cpu = device.device_cpu || 'Unknown';
                            acc[cpu] = (acc[cpu] || 0) + 1;
                            return acc;
                          }, {}))
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([cpu, count], index) => (
                              <tr key={index}>
                                <td>{cpu}</td>
                                <td>{count}</td>
                                <td>{((count / devices.length) * 100).toFixed(1)}%</td>
                              </tr>
                            ))
                          }
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>
          )}
          
          {/* Software Compliance */}
          {activeTab === 'software-compliance' && (
            <div>
              <h5 className="mb-4">Software Compliance Analytics</h5>
              
              <Row>
                <Col lg={6} className="mb-4">
                  <h6>OS Version Distribution</h6>
                  <Card className={darkMode ? 'bg-secondary text-white' : ''}>
                    <Card.Body>
                      <div className="table-responsive">
                        <Table className={`table-sm ${darkMode ? 'table-dark' : ''}`}>
                          <thead>
                            <tr>
                              <th>Operating System</th>
                              <th>Count</th>
                              <th>% of Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(getOSVersions(devices))
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 7)
                              .map(([os, count], index) => (
                                <tr key={index}>
                                  <td>{os}</td>
                                  <td>{count}</td>
                                  <td>{((count / devices.length) * 100).toFixed(1)}%</td>
                                </tr>
                              ))
                            }
                          </tbody>
                        </Table>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col lg={6} className="mb-4">
                  <h6>Devices with Outdated OS</h6>
                  <Card className={darkMode ? 'bg-secondary text-white' : ''}>
                    <Card.Body>
                      <div className="table-responsive">
                        <Table className={`table-sm ${darkMode ? 'table-dark' : ''}`}>
                          <thead>
                            <tr>
                              <th>Hostname</th>
                              <th>Site</th>
                              <th>OS Version</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getOutdatedOSDevices(devices).slice(0, 7).map((device, index) => (
                              <tr key={index}>
                                <td>{device.device_hostname}</td>
                                <td>{device.site_name}</td>
                                <td>{device.operating_system}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                        {getOutdatedOSDevices(devices).length > 7 && (
                          <div className="text-center mt-2">
                            <small>
                              Showing 7 of {getOutdatedOSDevices(devices).length} devices with outdated OS
                            </small>
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <div className="mt-2">
                <h6>Devices Missing OS Information</h6>
                <Card className={darkMode ? 'bg-secondary text-white' : ''}>
                  <Card.Body>
                    {devices.filter(d => !d.operating_system).length === 0 ? (
                      <div className="alert alert-success">
                        No devices missing OS information
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table className={`table-sm ${darkMode ? 'table-dark' : ''}`}>
                          <thead>
                            <tr>
                              <th>Hostname</th>
                              <th>Site</th>
                              <th>Device Type</th>
                              <th>Last User</th>
                            </tr>
                          </thead>
                          <tbody>
                            {devices.filter(d => !d.operating_system).slice(0, 5).map((device, index) => (
                              <tr key={index}>
                                <td>{device.device_hostname}</td>
                                <td>{device.site_name}</td>
                                <td>{device.device_type}</td>
                                <td>{device.last_user}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </div>
            </div>
          )}
          
          {/* Inventory Changes */}
          {activeTab === 'inventory-changes' && (
            <div>
              <h5 className="mb-4">Inventory Changes Analytics</h5>
              <div className="alert alert-info">
                <strong>Note:</strong> This dashboard would track changes over time, requiring historical data.
                In a real implementation, you would see:
                <ul className="mb-0">
                  <li>Weekly device additions/removals</li>
                  <li>User changes per device</li>
                  <li>MAC address changes (for security monitoring)</li>
                  <li>Hardware upgrade trends</li>
                </ul>
              </div>
              
              <Card className={darkMode ? 'bg-secondary text-white' : ''}>
                <Card.Body>
                  <h6>Current Inventory Snapshot</h6>
                  <div className="d-flex flex-wrap">
                    <div className="me-4 mb-3">
                      <div className="h3 mb-0">{devices.length}</div>
                      <div className="text-muted">Total Devices</div>
                    </div>
                    <div className="me-4 mb-3">
                      <div className="h3 mb-0">
                        {new Set(devices.map(d => d.site_name)).size}
                      </div>
                      <div className="text-muted">Sites</div>
                    </div>
                    <div className="me-4 mb-3">
                      <div className="h3 mb-0">
                        {new Set(devices.map(d => d.device_type)).size}
                      </div>
                      <div className="text-muted">Device Types</div>
                    </div>
                    <div className="mb-3">
                      <div className="h3 mb-0">
                        {devices.filter(d => d.last_seen === 'Currently Online').length}
                      </div>
                      <div className="text-muted">Currently Online</div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          )}
          
          {/* Downloadable Reports */}
          {activeTab === 'reports' && (
            <div>
              <h5 className="mb-4">Downloadable Inventory Reports</h5>
              <Row>
                <Col md={4} className="mb-3">
                  <Card className={darkMode ? 'bg-secondary text-white' : ''}>
                    <Card.Body className="text-center py-4">
                      <div className="mb-3">
                        <FontAwesomeIcon icon={faCircle} className="text-danger" size="2x" />
                      </div>
                      <h5>Pending Maintenance</h5>
                      <p className="text-muted">Devices not seen in 7+ days</p>
                      <Button 
                        variant="outline-primary"
                        onClick={() => handleDownloadReport('maintenance')}
                      >
                        Download CSV
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={4} className="mb-3">
                  <Card className={darkMode ? 'bg-secondary text-white' : ''}>
                    <Card.Body className="text-center py-4">
                      <div className="mb-3">
                        <FontAwesomeIcon icon={faCircle} className="text-warning" size="2x" />
                      </div>
                      <h5>Upcoming Upgrades</h5>
                      <p className="text-muted">Outdated OS or old CPU models</p>
                      <Button 
                        variant="outline-primary"
                        onClick={() => handleDownloadReport('upgrades')}
                      >
                        Download CSV
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={4} className="mb-3">
                  <Card className={darkMode ? 'bg-secondary text-white' : ''}>
                    <Card.Body className="text-center py-4">
                      <div className="mb-3">
                        <FontAwesomeIcon icon={faCircle} className="text-info" size="2x" />
                      </div>
                      <h5>AAM Site Export</h5>
                      <p className="text-muted">All AAM location devices</p>
                      <Button 
                        variant="outline-primary"
                        onClick={() => handleDownloadReport('site')}
                      >
                        Download CSV
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <div className="mt-3">
                <h6>Custom Report Builder</h6>
                <Card className={darkMode ? 'bg-secondary text-white' : ''}>
                  <Card.Body>
                    <p>
                      In a full implementation, users could create custom reports by:
                    </p>
                    <ul>
                      <li>Selecting specific data fields</li>
                      <li>Filtering by site, device type, status, etc.</li>
                      <li>Choosing output format (CSV, PDF, Excel)</li>
                      <li>Scheduling automated reports</li>
                    </ul>
                  </Card.Body>
                </Card>
              </div>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer 
        className={`border-top ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
      >
        <Button 
          variant={darkMode ? "outline-light" : "secondary"} 
          onClick={onHide}
          className="px-4"
        >
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Import the AddProduct component
const AddProduct = ({ show, onHide, onSave }) => {
  // Simplified version - you would expand this as needed
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Add Product</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Form would go here */}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={onSave}>Save</Button>
      </Modal.Footer>
    </Modal>
  );
};

// Update the component to accept data prop
const ProductList = ({ data, siteName }) => {
  // If data is provided, use it; otherwise, fetch data
  const [devices, setDevices] = useState(data || []);
  const [loading, setLoading] = useState(!data);
  const [importSuccess, setImportSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeviceType, setSelectedDeviceType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const { darkMode } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkActionData, setBulkActionData] = useState({
    category: '',
    status: '',
    price: ''
  });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const { user } = useAuth();
  
  // Add state for active category and view options
  const [activeCategory, setActiveCategory] = useState('Server-Physical');
  const [viewOption, setViewOption] = useState('all-devices');
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showDeviceTypeDropdown, setShowDeviceTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  // Add analytics modal state
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Add device modal state
  const [showAddDevice, setShowAddDevice] = useState(false);
  
  // Add edit device modal state
  const [showEditDevice, setShowEditDevice] = useState(false);
  const [deviceToEdit, setDeviceToEdit] = useState(null);

  // Create refs for dropdown elements
  const viewDropdownRef = useRef(null);
  const deviceTypeDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(event.target)) {
        setShowViewDropdown(false);
      }
      if (deviceTypeDropdownRef.current && !deviceTypeDropdownRef.current.contains(event.target)) {
        setShowDeviceTypeDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    price: ''
  });

  // Use the exclusive device categories to prevent devices from being counted in multiple categories
  const deviceCategories = getExclusiveDeviceCategories();

  // Get filtered devices by category with view option filtering
  const getFilteredDevicesByCategory = (categoryKey) => {
    return devices.filter(device => {
      // Apply search filter
      const matchesSearch = !searchTerm || (
        device?.device_hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device?.device_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device?.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device?.site_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Apply category filter
      const matchesCategory = deviceCategories[categoryKey].filter(device);
      
      // Apply status filter
      let matchesStatus = true;
      if (filterStatus !== 'all') {
        const status = getStatusColor(device.last_seen);
        if (filterStatus === 'online' && status !== 'success') {
          matchesStatus = false;
        } else if (filterStatus === 'offline' && status !== 'danger') {
          matchesStatus = false;
        } else if (filterStatus === 'warning' && status !== 'warning') {
          matchesStatus = false;
        }
      }
      
      // Apply view filter
      let matchesView = true;
      if (viewOption === 'active-devices') {
        const status = getStatusColor(device.last_seen);
        if (status === 'danger') {
          matchesView = false;
        }
      } else if (viewOption === 'inactive-devices') {
        const status = getStatusColor(device.last_seen);
        if (status !== 'danger') {
          matchesView = false;
        }
      }
      
      return matchesSearch && matchesCategory && matchesStatus && matchesView;
    });
  };

  // Mock notification function
  const addNotification = (type, message) => {
    console.log(`${type}: ${message}`);
  };

  // Fetch devices with import
  const fetchDevicesWithImport = async () => {
    try {
      setLoading(true);
      setError(null);
      setImportSuccess(false);
      const token = localStorage.getItem('token');
      
      // First, trigger the import of CSV data from the server
      console.log('Importing device data from server file...');
      // FIXED: Use the new API configuration that ensures correct production URL
      const importResponse = await fetch(`${API_CONFIG.API_BASE_URL}/devices/import-server-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!importResponse.ok) {
        console.warn('Import may have failed, but continuing to fetch devices:', await importResponse.text());
      } else {
        const importResult = await importResponse.json();
        console.log('Import successful:', importResult);
        setImportSuccess(true);
        
        // Auto-hide import success message after 5 seconds
        setTimeout(() => {
          setImportSuccess(false);
        }, 5000);
      }
      
      // Then fetch the devices data
      // FIXED: Use the new API configuration that ensures correct production URL
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/devices/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch devices');
      }

      const data = await response.json();
      console.log("Here is the data:", data);
      
      setDevices(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching devices:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Update devices when data prop changes
  useEffect(() => {
    if (data && data.length > 0) {
      setDevices(data);
      
      // Debug logging to understand device types
      console.log("Device types in data:", 
        data.map(d => ({ 
          hostname: d.device_hostname,
          type: d.device_type,
          model: d.device_model
        }))
      );
      
      // FIXED: Categorize all devices and count by exclusive category
      console.log("=== EXCLUSIVE CATEGORIZATION RESULTS ===");
      const categoryCounts = {
        'Server-Physical': 0,
        'Server-VM': 0,
        'Cell-phones-ATT': 0,
        'Cell-phones-Verizon': 0,
        'DLALION-License': 0,
        'Desktop': 0,
        'Laptop': 0,
        'Other': 0
      };
      
      // Count each device only once in the proper category
      data.forEach(device => {
        const category = categorizeDeviceExclusive(device);
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
      
      // Log the results
      console.log("Exclusive category counts:", categoryCounts);
      console.log("Total device count:", data.length);
      console.log("Sum of exclusive categories:", 
        Object.values(categoryCounts).reduce((sum, count) => sum + count, 0));
      
      // Count devices per category for debugging non-exclusive counts
      console.log("=== NON-EXCLUSIVE CATEGORIZATION (LEGACY) ===");
      Object.entries(deviceCategories).forEach(([key, category]) => {
        const count = data.filter(device => category.filter(device)).length;
        console.log(`Category ${category.name}: ${count} devices`);
      });
      
      // FIXED: Add more detailed debugging for server categories
      console.log("== DETAILED SERVER CATEGORY DEBUGGING ==");
      
      // Count using both strict and non-strict methods
      const physicalServersStrict = data.filter(device => isServerPhysicalStrict(device)).length;
      const physicalServersNonStrict = data.filter(device => isServerPhysical(device)).length;
      const virtualServers = data.filter(device => isServerVM(device)).length;
      
      console.log(`Physical Servers (Strict): ${physicalServersStrict}`);
      console.log(`Physical Servers (Non-Strict): ${physicalServersNonStrict}`);
      console.log(`Virtual Servers: ${virtualServers}`);
      console.log(`Difference between strict and non-strict: ${physicalServersNonStrict - physicalServersStrict}`);
      
      // Show some examples of devices categorized differently between strict and non-strict
      const strictOnly = data.filter(device => !isServerPhysicalStrict(device) && isServerPhysical(device));
      console.log(`${strictOnly.length} devices categorized as physical servers in non-strict but not in strict`);
      if (strictOnly.length > 0) {
        console.log("Examples of devices categorized differently:", 
          strictOnly.slice(0, 5).map(d => ({ 
            hostname: d.device_hostname,
            type: d.device_type,
            model: d.device_model,
            cpu: d.device_cpu,
            os: d.operating_system
          }))
        );
      }
      
      // Analyze overlapping devices
      console.log("== ANALYZING OVERLAPPING DEVICE CATEGORIZATION ==");
      const serversAndDesktops = data.filter(device => 
        isServerPhysicalStrict(device) && isDesktop(device));
      console.log(`Devices categorized as both servers and desktops: ${serversAndDesktops.length}`);
      if (serversAndDesktops.length > 0) {
        console.log("Examples of server/desktop overlap:", 
          serversAndDesktops.slice(0, 5).map(d => ({ 
            hostname: d.device_hostname,
            type: d.device_type,
            model: d.device_model,
            cpu: d.device_cpu
          }))
        );
      }
      
      setLoading(false);
    } else if (data) {
      // If data is provided but empty, still update state
      setDevices([]);
      setLoading(false);
    }
  }, [data]);

  // Fetch devices if no data was provided
  useEffect(() => {
    if (!data) {
      fetchDevicesWithImport();
    }
  }, []);

  // Filter devices based on search and filters
  const filteredDevices = devices.filter(device => {
    const matchesSearch = (
      device?.device_hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device?.device_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device?.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device?.site_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesType = selectedDeviceType === 'all' || device?.device_type === selectedDeviceType;
    const matchesStatus = filterStatus === 'all' || device?.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Update form data when current product changes
  useEffect(() => {
    if (currentProduct) {
      setFormData(currentProduct);
    } else {
      setFormData({
        name: '',
        category: '',
        quantity: '',
        price: ''
      });
    }
  }, [currentProduct]);

  // Modal handlers
  const handleModalShow = (product = null) => {
    setCurrentProduct(product);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setCurrentProduct(null);
    setShowModal(false);
  };

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (currentProduct) {
      // Update existing product
      setDevices(devices.map(p => 
        p.id === currentProduct.id ? { ...formData, id: p.id } : p
      ));
      addNotification('success', 'Product updated successfully');
    } else {
      // Add new product
      setDevices([...devices, { ...formData, id: Date.now() }]);
      addNotification('success', 'Product added successfully');
    }
    
    handleModalClose();
  };

  // Delete handler
  const handleDelete = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setDevices(devices.filter(p => p.id !== productId));
      addNotification('success', 'Product deleted successfully');
    }
  };

  // Sort handler
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Handle bulk selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedDevices(filteredDevices.map(device => device.id));
    } else {
      setSelectedDevices([]);
    }
  };

  const handleSelectDevice = (deviceId, checked) => {
    if (checked) {
      setSelectedDevices(prev => [...prev, deviceId]);
    } else {
      setSelectedDevices(prev => prev.filter(id => id !== deviceId));
    }
  };

  // Bulk action handlers
  const handleBulkAction = (action) => {
    setBulkAction(action);
    setShowBulkActionModal(true);
  };

  const executeBulkAction = () => {
    switch (bulkAction) {
      case 'delete':
        // Delete selected products
        setDevices(devices.filter(p => !selectedDevices.includes(p.id)));
        addNotification('success', `${selectedDevices.length} products deleted`);
        break;
      case 'category':
        // Update category for selected products
        setDevices(devices.map(p => 
          selectedDevices.includes(p.id) 
            ? { ...p, category: bulkActionData.category }
            : p
        ));
        addNotification('success', `Category updated for ${selectedDevices.length} products`);
        break;
      case 'status':
        // Update status for selected products
        setDevices(devices.map(p => 
          selectedDevices.includes(p.id) 
            ? { ...p, status: bulkActionData.status }
            : p
        ));
        addNotification('success', `Status updated for ${selectedDevices.length} products`);
        break;
      case 'export':
        // Export selected products
        handleExportSelected();
        break;
    }
    setShowBulkActionModal(false);
    setSelectedDevices([]);
    setBulkActionData({ category: '', status: '', price: '' });
  };

  const handleExportSelected = () => {
    const selectedData = devices.filter(p => selectedDevices.includes(p.id));
    // Implementation for export functionality
    console.log('Exporting:', selectedData);
    addNotification('success', 'Export started');
  };

  // Categories for dropdowns
  const categories = ['Electronics', 'Clothing', 'Food', 'Books'];

  // Animation variants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.3 
      }
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    if (dateString === 'Currently Online') return 'Online';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get status color
  const getStatusColor = (lastSeen) => {
    if (!lastSeen) return 'danger';
    if (lastSeen === 'Currently Online') return 'success';
    
      const date = new Date(lastSeen);
      const now = new Date();
      const diffDays = (now - date) / (1000 * 60 * 60 * 24);
      
      if (diffDays <= 1) return 'success';
      if (diffDays <= 7) return 'warning';
      return 'danger';
  };

  // Get device type color based on device type
  const getDeviceTypeColor = (deviceType) => {
    if (!deviceType) return 'secondary';
    
    const type = deviceType.toLowerCase();
    
    if (type.includes('laptop')) return 'info';
    if (type.includes('desktop')) return 'primary';
    if (type.includes('server')) return 'danger';
    if (type.includes('virtual')) return 'warning';
    if (type.includes('all-in-one')) return 'success';
    if (type.includes('micro')) return 'indigo';
    if (type.includes('tower')) return 'primary';
    if (type.includes('small form factor') || type.includes('sff')) return 'royal-blue';
    if (type.includes('custom')) return 'purple';
    
    return 'secondary';
  };

  // Get device type icon
  const getDeviceTypeIcon = (deviceType) => {
    if (!deviceType) return faDesktop;
    
    const type = deviceType.toLowerCase();
    
    if (type.includes('laptop')) return faLaptop;
    if (type.includes('server') && type.includes('vm')) return faCloud;
    if (type.includes('server')) return faServer;
    if (type.includes('phone')) return faMobileAlt;
    if (type.includes('license')) return faKey;
    
    return faDesktop; // Default for desktop and others
  };

  // Extract unique device types for filtering
  const deviceTypes = React.useMemo(() => {
    const types = new Set();
    devices.forEach(device => {
      if (device.device_type) {
        types.add(device.device_type);
      }
    });
    return ['all', ...Array.from(types).sort()];
  }, [devices]);

  // Function to render the device table for a specific category
  const renderDeviceTable = (categoryKey) => {
    const categoryDevices = getFilteredDevicesByCategory(categoryKey);
    
    return (
      <div className={`table-container border rounded-3 ${darkMode ? 'dark-mode' : ''}`}
        style={{ backgroundColor: darkMode ? '#292929' : '' }}>
        <div className="table-scroll" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table className={`mb-0 ${darkMode ? 'table-dark' : ''}`}>
            <thead>
              <tr className={darkMode ? 'bg-dark' : 'bg-white sticky-top'} style={{ backgroundColor: darkMode ? '#252525' : '' }}>
                <th className="py-3 px-4 col-fixed" style={{ backgroundColor: darkMode ? '#252525' : '' }}>
                  <Form.Check 
                    type="checkbox" 
                    className="mt-0"
                    onChange={handleSelectAll}
                    checked={selectedDevices.length === categoryDevices.length}
                  />
                </th>
                <th className="py-3 px-4" style={{ backgroundColor: darkMode ? '#252525' : '' }}>Site Name</th>
                <th className="py-3 px-4" style={{ backgroundColor: darkMode ? '#252525' : '' }}>Device Hostname</th>
                <th className="py-3 px-4" style={{ backgroundColor: darkMode ? '#252525' : '' }}>Description</th>
                <th className="py-3 px-4" style={{ backgroundColor: darkMode ? '#252525' : '' }}>Last User</th>
                <th className="py-3 px-4" style={{ backgroundColor: darkMode ? '#252525' : '' }}>Last Seen</th>
                <th className="py-3 px-4" style={{ backgroundColor: darkMode ? '#252525' : '' }}>Device Type</th>
                <th className="py-3 px-4" style={{ backgroundColor: darkMode ? '#252525' : '' }}>Model</th>
                <th className="py-3 px-4" style={{ backgroundColor: darkMode ? '#252525' : '' }}>OS</th>
                <th className="py-3 px-4" style={{ backgroundColor: darkMode ? '#252525' : '' }}>Serial Number</th>
                <th className="py-3 px-4" style={{ backgroundColor: darkMode ? '#252525' : '' }}>CPU</th>
                <th className="py-3 px-4" style={{ backgroundColor: darkMode ? '#252525' : '' }}>MAC Address(es)</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: darkMode ? '#292929' : '' }}>
              {categoryDevices.length > 0 ? (
                categoryDevices.map((device) => (
                  <motion.tr
                    key={device.id || `${device.device_hostname}-${device.serial_number}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={selectedDevices.includes(device.id) ? 'selected-row' : ''}
                    style={{ 
                      backgroundColor: darkMode 
                        ? (categoryDevices.indexOf(device) % 2 === 0 ? '#292929' : '#323232') 
                        : ''
                    }}
                  >
                    <td className="py-2 px-4">
                      <Form.Check
                        type="checkbox"
                        className="mt-0"
                        checked={selectedDevices.includes(device.id)}
                        onChange={(e) => handleSelectDevice(device.id, e.target.checked)}
                      />
                    </td>
                    <td className="py-2 px-4">
                      <div className="d-flex align-items-center gap-2">
                        <span className={`text-${getStatusColor(device.last_seen)}`}>●</span>
                        {device.site_name}
                        <FontAwesomeIcon icon={faArrowUpRightFromSquare} size="xs" className="ms-1 text-muted" />
                      </div>
                    </td>
                    <td className="py-2 px-4">{device.device_hostname}</td>
                    <td className="py-2 px-4">{device.device_description}</td>
                    <td className="py-2 px-4">{device.last_user}</td>
                    <td className="py-2 px-4">{formatDate(device.last_seen)}</td>
                    <td className="py-2 px-4">
                      <Badge 
                        bg={getDeviceTypeColor(device.device_type)}
                        text={darkMode ? 'light' : 'dark'}
                        className="bg-opacity-10 d-flex align-items-center gap-1"
                        style={{ width: 'fit-content' }}
                      >
                        <FontAwesomeIcon icon={getDeviceTypeIcon(device.device_type)} size="xs" />
                        {device.device_type || 'Unknown'}
                      </Badge>
                    </td>
                    <td className="py-2 px-4">{device.device_model}</td>
                    <td className="py-2 px-4">{device.operating_system}</td>
                    <td className="py-2 px-4">{device.serial_number}</td>
                    <td className="py-2 px-4">{device.device_cpu}</td>
                    <td className="py-2 px-4">
                      {Array.isArray(device.mac_addresses) 
                        ? device.mac_addresses.join(', ')
                        : device.mac_addresses}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="12" className="text-center py-4">No devices found in this category</td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>
    );
  };

  // Handle adding a new device
  const handleAddDevice = (newDevice) => {
    // Add the new device to the devices array
    setDevices(prevDevices => [...prevDevices, newDevice]);
    // Show success message
    setImportSuccess(true);
    setTimeout(() => {
      setImportSuccess(false);
    }, 5000);
  };

  // Handle edit device - opens edit modal with the selected device
  const handleEditDevice = () => {
    if (selectedDevices.length !== 1) return;
    
    // Find the selected device
    const selectedDevice = devices.find(d => d.id === selectedDevices[0]);
    if (selectedDevice) {
      setDeviceToEdit(selectedDevice);
      setShowEditDevice(true);
    } else {
      console.error('Selected device not found');
    }
  };
  
  // Handle delete devices - deletes all selected devices
  const handleDeleteDevices = async () => {
    if (selectedDevices.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedDevices.length} device(s)?`)) {
      return;
    }
    
    setLoading(true);
    const deletePromises = selectedDevices.map(deviceId => {
      return axios.delete(`/api/devices/${deviceId}`)
        .then(response => {
          console.log(`Device ${deviceId} deleted successfully`);
          return { success: true, deviceId };
        })
        .catch(error => {
          console.error(`Error deleting device ${deviceId}:`, error);
          return { success: false, deviceId, error };
        });
    });
    
    try {
      const results = await Promise.all(deletePromises);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      
      // Remove successfully deleted devices from the state
      const successfullyDeletedIds = results
        .filter(r => r.success)
        .map(r => r.deviceId);
      
      setDevices(prevDevices => 
        prevDevices.filter(device => !successfullyDeletedIds.includes(device.id))
      );
      
      // Reset selection
      setSelectedDevices([]);
      
      // Show feedback
      setImportSuccess(true);
      
      if (failCount > 0) {
        setError(`Deleted ${successCount} device(s), but failed to delete ${failCount} device(s).`);
      } else {
        console.log(`Successfully deleted ${successCount} device(s)`);
      }
    } catch (error) {
      console.error('Error during device deletion:', error);
      setError('An error occurred while deleting devices.');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setImportSuccess(false);
        setError(null);
      }, 5000);
    }
  };
  
  // Handle edit success - updates the device in the devices list
  const handleEditSuccess = (updatedDevice) => {
    if (!updatedDevice) return;
    
    // Update the device in the devices array
    setDevices(prevDevices => 
      prevDevices.map(device => 
        device.id === updatedDevice.id ? updatedDevice : device
      )
    );
    
    // Reset selection
    setSelectedDevices([]);
    
    // Show success message
    setImportSuccess(true);
    console.log(`Device ${updatedDevice.id} updated successfully`);
    
    setTimeout(() => {
      setImportSuccess(false);
    }, 5000);
  };

  if (loading) {
    return (
      <div className={`w-100 h-100 overflow-hidden ${darkMode ? 'dark-mode bg-dark' : 'bg-light'}`}>
        <ThemeToggle />
        <Container fluid className="h-100 p-4">
          <div className={`${darkMode ? 'dark-mode bg-dark' : 'bg-white'} rounded-3 p-4 h-100 d-flex flex-column justify-content-center align-items-center`} 
            style={{ backgroundColor: darkMode ? '#202020' : '' }}>
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h5 className={`mt-3 ${darkMode ? 'text-light' : ''}`}>
              Loading device inventory...
            </h5>
            <p className="text-muted">
              Importing and processing device data
            </p>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-3" role="alert">
        Error: {error}
      </div>
    );
  }

  return (
    <div className={`w-100 h-100 overflow-hidden ${darkMode ? 'dark-mode bg-dark' : 'bg-light'}`}>
      <ThemeToggle />
      <Container fluid className="h-100 p-4">
        <div className={`${darkMode ? 'dark-mode bg-dark' : 'bg-white'} rounded-3 p-4 h-100`} 
          style={{ backgroundColor: darkMode ? '#202020' : '' }}>
          {/* Import success alert */}
          {importSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="alert alert-success mb-3"
            >
              <FontAwesomeIcon icon={faSync} className="me-2" />
              Device data successfully imported and refreshed!
            </motion.div>
          )}
          
          {/* Error alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="alert alert-danger mb-3"
            >
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              Error: {error}
            </motion.div>
          )}

          {/* Header Controls */}
          <div className="d-flex flex-wrap gap-2 mb-3">
            {/* Add Device Button */}
            <Button 
              variant="primary" 
              size="sm" 
              className="d-flex align-items-center gap-2 add-device-btn"
              onClick={() => setShowAddDevice(true)}
            >
              <FontAwesomeIcon icon={faPlus} className="me-1" />
              Add Device
            </Button>
            
            {/* Edit Button - Only active when exactly one device is selected */}
            <Button 
              variant={darkMode ? "dark" : "light"} 
              size="sm" 
              className={`${darkMode ? 'border-secondary text-light' : 'border'} d-flex align-items-center gap-2`}
              style={{ backgroundColor: darkMode ? '#252525' : '' }}
              onClick={handleEditDevice}
              disabled={selectedDevices.length !== 1}
            >
              <FontAwesomeIcon icon={faEdit} className="me-1" />
              Edit Device
            </Button>
            
            {/* Delete Button - Only active when at least one device is selected */}
            <Button 
              variant="danger" 
              size="sm" 
              className="d-flex align-items-center gap-2"
              onClick={handleDeleteDevices}
              disabled={selectedDevices.length === 0}
            >
              <FontAwesomeIcon icon={faTrash} className="me-1" />
              Delete {selectedDevices.length > 0 ? `(${selectedDevices.length})` : ''}
            </Button>
            
            <div className="dropdown" ref={viewDropdownRef}>
            <Button 
              variant={darkMode ? "dark" : "light"} 
              size="sm" 
              className={`${darkMode ? 'border-secondary text-light' : 'border'} d-flex align-items-center gap-2`}
              style={{ backgroundColor: darkMode ? '#252525' : '' }}
                onClick={() => {
                  setShowViewDropdown(!showViewDropdown);
                  setShowDeviceTypeDropdown(false);
                  setShowStatusDropdown(false);
                }}
            >
                {viewOption === 'all-devices' ? 'All Devices' : 
                 viewOption === 'active-devices' ? 'Active Devices' : 'Inactive Devices'} 
                <FontAwesomeIcon icon={faChevronDown} size="xs" />
            </Button>
              <div className={`dropdown-menu ${showViewDropdown ? 'show' : ''}`} style={{ minWidth: '200px' }}>
                <button 
                  className={`dropdown-item ${viewOption === 'all-devices' ? 'active' : ''}`}
                  onClick={() => {
                    setViewOption('all-devices');
                    setShowViewDropdown(false);
                  }}
                >
                  All Devices
                </button>
                <button 
                  className={`dropdown-item ${viewOption === 'active-devices' ? 'active' : ''}`}
                  onClick={() => {
                    setViewOption('active-devices');
                    setShowViewDropdown(false);
                  }}
                >
                  Active Devices Only
                </button>
                <button 
                  className={`dropdown-item ${viewOption === 'inactive-devices' ? 'active' : ''}`}
                  onClick={() => {
                    setViewOption('inactive-devices');
                    setShowViewDropdown(false);
                  }}
                >
                  Inactive Devices Only
                </button>
              </div>
            </div>
            
            <div className="dropdown" ref={deviceTypeDropdownRef}>
            <Button 
              variant={darkMode ? "dark" : "light"} 
              size="sm" 
              className={`${darkMode ? 'border-secondary text-light' : 'border'} d-flex align-items-center gap-2`}
              style={{ backgroundColor: darkMode ? '#252525' : '' }}
                onClick={() => {
                  setShowDeviceTypeDropdown(!showDeviceTypeDropdown);
                  setShowViewDropdown(false);
                  setShowStatusDropdown(false);
                }}
              >
                <FontAwesomeIcon icon={getDeviceTypeIcon(selectedDeviceType)} className="me-1" />
              Device Type <FontAwesomeIcon icon={faChevronDown} size="xs" />
            </Button>
              <div className={`dropdown-menu ${showDeviceTypeDropdown ? 'show' : ''}`} style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <button 
                  className="dropdown-item" 
                  onClick={() => {
                    setSelectedDeviceType('all');
                    setShowDeviceTypeDropdown(false);
                  }}
                >
                  All Device Types
                </button>
                <div className="dropdown-divider"></div>
                {Object.entries(deviceCategories).map(([key, category]) => (
                    <button 
                    key={key}
                    className="dropdown-item d-flex align-items-center gap-2" 
                    onClick={() => {
                      setActiveCategory(key);
                      setShowDeviceTypeDropdown(false);
                    }}
                  >
                        <FontAwesomeIcon 
                      icon={
                        key === 'Server-Physical' ? faServer :
                        key === 'Server-VM' ? faCloud :
                        key === 'Cell-phones-ATT' || key === 'Cell-phones-Verizon' ? faMobileAlt :
                        key === 'DLALION-License' ? faKey :
                        key === 'Desktop' ? faDesktop :
                        key === 'Laptop' ? faLaptop : 
                        faCircle
                      }
                    />
                    {category.name}
                    </button>
                ))}
            </div>
            </div>
            
            <div className="dropdown" ref={statusDropdownRef}>
            <Button 
              variant={darkMode ? "dark" : "light"} 
              size="sm" 
              className={`${darkMode ? 'border-secondary text-light' : 'border'} d-flex align-items-center gap-2`}
              style={{ backgroundColor: darkMode ? '#252525' : '' }}
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowViewDropdown(false);
                  setShowDeviceTypeDropdown(false);
                }}
            >
              Status <FontAwesomeIcon icon={faChevronDown} size="xs" />
            </Button>
              <div className={`dropdown-menu ${showStatusDropdown ? 'show' : ''}`}>
                <button 
                  className={`dropdown-item ${filterStatus === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setFilterStatus('all');
                    setShowStatusDropdown(false);
                  }}
                >
                  All Statuses
                </button>
                <button 
                  className={`dropdown-item ${filterStatus === 'online' ? 'active' : ''}`}
                  onClick={() => {
                    setFilterStatus('online');
                    setShowStatusDropdown(false);
                  }}
                >
                  <span className="text-success me-2">●</span> Online
                </button>
                <button 
                  className={`dropdown-item ${filterStatus === 'offline' ? 'active' : ''}`}
                  onClick={() => {
                    setFilterStatus('offline');
                    setShowStatusDropdown(false);
                  }}
                >
                  <span className="text-danger me-2">●</span> Offline
                </button>
                <button 
                  className={`dropdown-item ${filterStatus === 'warning' ? 'active' : ''}`}
                  onClick={() => {
                    setFilterStatus('warning');
                    setShowStatusDropdown(false);
                  }}
                >
                  <span className="text-warning me-2">●</span> Not Seen Recently
                </button>
              </div>
            </div>
            
            {/* Refresh Button */}
            <Button 
              variant={darkMode ? "dark" : "light"} 
              size="sm" 
              className={`${darkMode ? 'border-secondary text-light' : 'border'} d-flex align-items-center gap-2`}
              style={{ backgroundColor: darkMode ? '#252525' : '' }}
              onClick={fetchDevicesWithImport}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faSync} className={`me-1 ${loading ? 'fa-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </Button>
            
            {/* Inventory Analytics Button */}
            <Button 
              variant={darkMode ? "dark" : "light"} 
              size="sm" 
              className={`${darkMode ? 'border-secondary text-light' : 'border'} d-flex align-items-center gap-2`}
              style={{ backgroundColor: darkMode ? '#252525' : '' }}
              onClick={() => setShowAnalytics(true)}
            >
              <FontAwesomeIcon icon={faChartLine} className="me-1" />
              Inventory Analytics
            </Button>
            
            {/* Search Input */}
            <div className="ms-auto">
              <InputGroup size="sm">
                <InputGroup.Text 
                  className={darkMode ? 'bg-dark border-secondary' : 'bg-white'}
                  style={{ backgroundColor: darkMode ? '#252525' : '' }}
                >
                  <FontAwesomeIcon icon={faSearch} className={darkMode ? 'text-light' : 'text-muted'} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search devices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={darkMode ? 'bg-dark text-light border-secondary' : ''}
                  style={{ backgroundColor: darkMode ? '#252525' : '' }}
                />
              </InputGroup>
            </div>
          </div>

          {/* Device Category Tabs */}
          <Tab.Container activeKey={activeCategory} onSelect={setActiveCategory}>
            <div className="mb-4">
              <Nav variant="tabs" className="category-tabs">
                {Object.entries(deviceCategories).map(([key, category]) => {
                  const count = getFilteredDevicesByCategory(key).length;
                  return (
                    <Nav.Item key={key}>
                      <Nav.Link 
                        eventKey={key}
                        className={`${darkMode ? 'text-light' : ''} d-flex align-items-center gap-2 category-tab`}
                      style={{ 
                          backgroundColor: activeCategory === key 
                            ? darkMode ? '#494949' : '#e9e9e9' // Light grayish color for active tab
                            : 'transparent',
                          borderRadius: '4px 4px 0 0'
                        }}
                      >
                        {/* Add appropriate icon based on category */}
                        <FontAwesomeIcon 
                          icon={
                            key === 'Server-Physical' ? faServer :
                            key === 'Server-VM' ? faCloud :
                            key === 'Cell-phones-ATT' || key === 'Cell-phones-Verizon' ? faMobileAlt :
                            key === 'DLALION-License' ? faKey :
                            key === 'Desktop' ? faDesktop :
                            key === 'Laptop' ? faLaptop : 
                            faCircle
                          } 
                          className={`me-1 ${activeCategory === key ? 'text-primary' : ''}`}
                        />
                        {category.name}
                        <Badge 
                          bg={activeCategory === key ? 'primary' : 'secondary'}
                          className="rounded-pill"
                        >
                          {count}
                        </Badge>
                      </Nav.Link>
                    </Nav.Item>
                  );
                })}
              </Nav>
          </div>

            <Tab.Content>
              {Object.keys(deviceCategories).map(categoryKey => (
                <Tab.Pane key={categoryKey} eventKey={categoryKey}>
                  {renderDeviceTable(categoryKey)}
                </Tab.Pane>
              ))}
            </Tab.Content>
          </Tab.Container>

          {/* Table Stats */}
          <div className="mt-3 text-muted">
            <small>
              Showing {getFilteredDevicesByCategory(activeCategory).length} of {devices.length} devices
            </small>
          </div>
        </div>
      </Container>

      {/* Add Product Modal */}
      <AddProduct
        show={showModal}
        onHide={handleModalClose}
        onSave={handleSubmit}
      />

      {/* Analytics Modal */}
      <AnalyticsModal
        show={showAnalytics}
        onHide={() => setShowAnalytics(false)}
        devices={devices}
      />

      {/* Bulk Action Modal */}
      <Modal show={showBulkActionModal} onHide={() => setShowBulkActionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {bulkAction === 'delete' ? 'Confirm Delete' :
             bulkAction === 'category' ? 'Update Category' :
             bulkAction === 'status' ? 'Update Status' :
             'Export Products'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {bulkAction === 'delete' ? (
            <p>Are you sure you want to delete {selectedDevices.length} products?</p>
          ) : bulkAction === 'category' ? (
            <Form.Group>
              <Form.Label>Select Category</Form.Label>
              <Form.Select
                value={bulkActionData.category}
                onChange={(e) => setBulkActionData({ ...bulkActionData, category: e.target.value })}
              >
                <option value="">Select a category...</option>
                {categories.map((cat, index) => (
                  <option key={index} value={cat}>{cat}</option>
                ))}
              </Form.Select>
            </Form.Group>
          ) : bulkAction === 'status' ? (
            <Form.Group>
              <Form.Label>Select Status</Form.Label>
              <Form.Select
                value={bulkActionData.status}
                onChange={(e) => setBulkActionData({ ...bulkActionData, status: e.target.value })}
              >
                <option value="">Select a status...</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </Form.Select>
            </Form.Group>
          ) : (
            <p>Export {selectedDevices.length} selected products</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulkActionModal(false)}>
            Cancel
          </Button>
          <Button 
            variant={bulkAction === 'delete' ? 'danger' : 'primary'}
            onClick={executeBulkAction}
          >
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx="true">{`
        /* Base Styles */
        .table-container {
          width: 100%;
          height: calc(100vh - 350px); /* Adjusted to account for tabs */
          position: relative;
          border: 1px solid #dee2e6;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        
        .table-scroll {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: scroll;
        }
        
        table {
          width: auto;
          min-width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        thead {
          position: sticky;
          top: 0;
          z-index: 2;
          background: white;
        }

        th {
          position: sticky;
          top: 0;
          background: white;
          font-weight: 500;
          border-bottom: 2px solid #dee2e6;
          padding: 1rem;
          white-space: nowrap;
          z-index: 2;
        }

        td {
          padding: 1rem;
          white-space: nowrap;
          border-bottom: 1px solid #dee2e6;
        }

        /* Enhanced Nav tab styling */
        .nav-tabs {
          border-bottom: 1px solid #dee2e6;
        }
        
        .category-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .nav-tabs .nav-link {
          border: none;
          border-bottom: 2px solid transparent;
          color: #6c757d;
          padding: 0.75rem 1rem;
          transition: all 0.2s ease;
        }
        
        .category-tab {
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
          border-bottom: none !important;
          border-top: 3px solid transparent !important;
          transition: all 0.2s ease;
        }

        .nav-tabs .nav-link.active {
          border-color: #0d6efd;
          color: #0d6efd;
          background-color: #e9e9e9 !important; /* Light grayish color for active tab */
          font-weight: 500;
          border-top-color: #0d6efd !important;
          box-shadow: 0 -2px 5px rgba(0,0,0,0.05), 0 2px 5px rgba(0,0,0,0.03);
          position: relative;
          z-index: 1;
        }
        
        .nav-tabs .nav-link.active:after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 1px;
          background-color: #e9e9e9;
        }
        
        .dark-mode .nav-tabs .nav-link.active:after {
          background-color: #494949;
        }

        .nav-tabs .nav-link:hover:not(.active) {
          background-color: #f5f5f5;
          border-color: #e0e0e0;
        }

        .dark-mode .nav-tabs .nav-link:hover:not(.active) {
          background-color: #333;
          border-color: #444;
        }

        .dark-mode .nav-tabs {
          border-bottom-color: #444;
        }

        .dark-mode .nav-tabs .nav-link {
          color: #aaa;
        }

        .dark-mode .nav-tabs .nav-link.active {
          border-color: #0d6efd;
          color: #fff;
          background-color: #494949 !important; /* Darker grayish color for dark mode */
        }

        /* Dark mode styles */
        .dark-mode .table-container {
          border-color: #333;
          background-color: #292929;
        }

        .dark-mode .table-scroll {
          background-color: #292929;
        }

        .dark-mode table {
          color: #e0e0e0;
        }

        .dark-mode thead {
          background: #292929;
        }

        .dark-mode th {
          background: #292929;
          border-bottom-color: #444;
          color: #ffffff;
          font-weight: 500;
        }

        .dark-mode td {
          border-bottom-color: #3a3a3a;
          color: #e0e0e0;
        }
        
        /* Override Bootstrap table styles */
        .table-dark {
          --bs-table-bg: #292929 !important;
          --bs-table-striped-bg: #323232 !important;
          --bs-table-hover-bg: #3a3a3a !important;
          color: #e0e0e0 !important;
          border-color: #333 !important;
        }
        
        /* Dropdown Styling */
        .dropdown {
          position: relative;
        }
        
        .dropdown-menu {
          position: absolute;
          z-index: 1000;
          top: 100%;
          left: 0;
          margin-top: 2px;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          border: 1px solid #dee2e6;
          background-color: white;
          display: none;
        }
        
        .dropdown-menu.show {
          display: block;
        }
        
        .dropdown-item {
          padding: 8px 16px;
          cursor: pointer;
          white-space: nowrap;
          transition: background-color 0.2s ease;
        }
        
        .dropdown-item:hover {
          background-color: #f8f9fa;
        }
        
        .dropdown-divider {
          margin: 4px 0;
          border-top: 1px solid #dee2e6;
        }

        .dark-mode .dropdown-menu {
          background-color: #333;
          border-color: #444;
        }

        .dark-mode .dropdown-item {
          color: #e0e0e0;
        }

        .dark-mode .dropdown-item:hover {
          background-color: #444;
        }
        
        .dark-mode .dropdown-divider {
          border-top-color: #444;
        }

        /* Add Device Button Styling */
        .add-device-btn {
          background-color: #4a90e2;
          border-color: #4a90e2;
          transition: all 0.2s ease;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .add-device-btn:hover {
          background-color: #3a80d2;
          border-color: #3a80d2;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
      `}</style>

      {/* Add Device Modal */}
      <AddDeviceModal 
        show={showAddDevice} 
        onHide={() => setShowAddDevice(false)} 
        onSuccess={(newDevice) => {
          // Add the new device to the existing devices array
          if (newDevice) {
            console.log('New device added:', newDevice);
            setDevices(prevDevices => [...prevDevices, newDevice]);
          } else {
            // If no device data was returned, fetch all devices again
            setLoading(true);
            fetchDevicesWithImport();
          }
          
          // Show import success message
          setImportSuccess(true);
          setTimeout(() => {
            setImportSuccess(false);
          }, 5000);
        }}
        siteName={siteName}
      />

      {/* Edit Device Modal */}
      <EditDeviceModal 
        show={showEditDevice} 
        onHide={() => setShowEditDevice(false)}
        device={deviceToEdit}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default ProductList;