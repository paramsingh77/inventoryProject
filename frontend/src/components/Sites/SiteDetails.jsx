import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Nav, Tab, Table, Alert, Spinner, Badge } from 'react-bootstrap';
import axios from 'axios';

const SiteDetails = () => {
  const { siteName } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [siteData, setSiteData] = useState(null);

  useEffect(() => {
    fetchSiteData();
  }, [siteName]);

  const fetchSiteData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching data for site: ${siteName}`);
      const response = await axios.get(`/sites/${siteName}/data`);
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
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <h2>{siteName} Details</h2>
      <p>Showing {siteData?.devices?.length || 0} devices</p>
      
      <Tab.Container defaultActiveKey="devices">
        <Row>
          <Col sm={3}>
            <Nav variant="pills" className="flex-column">
              <Nav.Item>
                <Nav.Link eventKey="devices">Devices</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="network">Network</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="users">Users</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="stats">Statistics</Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
          
          <Col sm={9}>
            <Tab.Content>
              <Tab.Pane eventKey="devices">
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Hostname</th>
                      <th>Type</th>
                      <th>OS</th>
                      <th>Last User</th>
                      <th>Last Seen</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siteData?.devices.map(device => (
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
                      </tr>
                    ))}
                    {siteData?.devices.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center">No devices found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Tab.Pane>
              
              <Tab.Pane eventKey="network">
                <h4>Network Information</h4>
                <p>Network information for {siteName} will be displayed here.</p>
              </Tab.Pane>
              
              <Tab.Pane eventKey="users">
                <h4>User Management</h4>
                <p>User management for {siteName} will be displayed here.</p>
              </Tab.Pane>
              
              <Tab.Pane eventKey="stats">
                <h4>Site Statistics</h4>
                <p>Statistics for {siteName} will be displayed here.</p>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default SiteDetails; 