import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Nav, Tab, Spinner, Alert, Button } from 'react-bootstrap';
import axios from 'axios';
import { motion } from 'framer-motion';
import DeviceInventory from './DeviceInventory';
import SiteOrders from '../Orders/SiteOrders';
import SiteSuppliers from '../Suppliers/SiteSuppliers';
import SiteUsers from '../Users/SiteUsers';
import SiteAnalytics from './SiteAnalytics';

const SiteDashboard = () => {
  const { siteName } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [siteData, setSiteData] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory');

  useEffect(() => {
    fetchSiteData();
    
    // Store the selected site in localStorage
    localStorage.setItem('selectedSiteName', siteName);
    
    // Dispatch both a storage event and a custom event for maximum compatibility
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('siteChanged', { 
      detail: { siteName } 
    }));
    
    // Also update URL with the site parameter for bookmarking
    const url = new URL(window.location.href);
    url.searchParams.set('site', siteName);
    window.history.replaceState({}, '', url);
    
  }, [siteName]);

  const fetchSiteData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching data for site: ${siteName}`);
      const response = await axios.get(`/api/sites/${siteName}/data`);
      setSiteData(response.data);
    } catch (err) {
      console.error('Error fetching site data:', err);
      setError(err.response?.data?.error || 'Failed to fetch site data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => navigate('/sites')}>
            Back to Sites
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Container fluid className="mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>{siteName} Dashboard</h2>
          <Button variant="outline-primary" onClick={() => navigate('/sites')}>
            Back to Sites
          </Button>
        </div>
        
        <SiteAnalytics siteData={siteData} />
        
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <Row className="mt-4">
            <Col md={3} lg={2}>
              <Nav variant="pills" className="flex-column">
                <Nav.Item>
                  <Nav.Link eventKey="inventory" className="d-flex align-items-center">
                    <i className="bi bi-box me-2"></i> Inventory
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="orders" className="d-flex align-items-center">
                    <i className="bi bi-cart me-2"></i> Orders
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="suppliers" className="d-flex align-items-center">
                    <i className="bi bi-truck me-2"></i> Suppliers
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="users" className="d-flex align-items-center">
                    <i className="bi bi-people me-2"></i> Users
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="settings" className="d-flex align-items-center">
                    <i className="bi bi-gear me-2"></i> Settings
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Col>
            
            <Col md={9} lg={10}>
              <Tab.Content>
                <Tab.Pane eventKey="inventory">
                  <DeviceInventory siteData={siteData} siteName={siteName} />
                </Tab.Pane>
                
                <Tab.Pane eventKey="orders">
                  <SiteOrders siteName={siteName} />
                </Tab.Pane>
                
                <Tab.Pane eventKey="suppliers">
                  <SiteSuppliers siteName={siteName} />
                </Tab.Pane>
                
                <Tab.Pane eventKey="users">
                  <SiteUsers siteName={siteName} />
                </Tab.Pane>
                
                <Tab.Pane eventKey="settings">
                  <Card>
                    <Card.Header>
                      <h5 className="mb-0">Site Settings</h5>
                    </Card.Header>
                    <Card.Body>
                      <p>Configure settings for {siteName}</p>
                      {/* Settings form will go here */}
                    </Card.Body>
                  </Card>
                </Tab.Pane>
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </Container>
    </motion.div>
  );
};

export default SiteDashboard; 