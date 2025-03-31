import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Nav, Tab } from 'react-bootstrap';
import { SiteProvider } from '../context/SiteContext';

// Temporarily remove problematic imports
// import { SiteProvider } from '../context/SiteContext';
// import { PurchaseOrderProvider } from '../context/PurchaseOrderContext';
// import SiteInventory from '../components/Inventory/SiteInventory';

const SitePage = () => {
  const { siteName } = useParams();
  const decodedSiteName = decodeURIComponent(siteName);
  
  console.log('SitePage rendering for site:', decodedSiteName);

  return (
    <SiteProvider siteName={decodedSiteName}>
      <Container fluid>
        <Row className="mb-4">
          <Col>
            <h2>{decodedSiteName}</h2>
          </Col>
        </Row>
        
        <Tab.Container defaultActiveKey="dashboard">
          <Row>
            <Col md={2}>
              <Nav variant="pills" className="flex-column mb-4">
                <Nav.Item>
                  <Nav.Link eventKey="dashboard">Dashboard</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="inventory">Inventory</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="orders">Orders</Nav.Link>
                </Nav.Item>
              </Nav>
            </Col>
            <Col md={10}>
              <Tab.Content>
                <Tab.Pane eventKey="dashboard">
                  <h3>Dashboard for {decodedSiteName}</h3>
                  <p>Site dashboard content will appear here.</p>
                </Tab.Pane>
                <Tab.Pane eventKey="inventory">
                  <h3>Inventory for {decodedSiteName}</h3>
                  <p>Site inventory content will appear here.</p>
                </Tab.Pane>
                <Tab.Pane eventKey="orders">
                  <h3>Orders for {decodedSiteName}</h3>
                  <p>Site orders content will appear here.</p>
                </Tab.Pane>
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </Container>
    </SiteProvider>
  );
};

export default SitePage; 