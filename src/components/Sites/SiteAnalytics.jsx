import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';

const SiteAnalytics = ({ siteData }) => {
  // Calculate analytics
  const totalDevices = siteData.devices.length;
  const activeDevices = siteData.devices.filter(d => d.status === 'active').length;
  const inactiveDevices = totalDevices - activeDevices;
  
  // Count device types
  const deviceTypes = siteData.devices.reduce((acc, device) => {
    const type = device.device_type || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  
  // Get top 3 device types
  const topDeviceTypes = Object.entries(deviceTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <Row className="g-3 mb-4">
      <Col md={3}>
        <Card className="h-100 shadow-sm">
          <Card.Body className="text-center">
            <h3 className="mb-0">{totalDevices}</h3>
            <p className="text-muted mb-0">Total Devices</p>
          </Card.Body>
        </Card>
      </Col>
      
      <Col md={3}>
        <Card className="h-100 shadow-sm">
          <Card.Body className="text-center">
            <h3 className="mb-0">{activeDevices}</h3>
            <p className="text-muted mb-0">Active Devices</p>
          </Card.Body>
        </Card>
      </Col>
      
      <Col md={3}>
        <Card className="h-100 shadow-sm">
          <Card.Body className="text-center">
            <h3 className="mb-0">{inactiveDevices}</h3>
            <p className="text-muted mb-0">Inactive Devices</p>
          </Card.Body>
        </Card>
      </Col>
      
      <Col md={3}>
        <Card className="h-100 shadow-sm">
          <Card.Body>
            <h6 className="text-center mb-3">Top Device Types</h6>
            {topDeviceTypes.map(([type, count], index) => (
              <div key={index} className="d-flex justify-content-between mb-1">
                <span>{type}</span>
                <span className="badge bg-primary">{count}</span>
              </div>
            ))}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default SiteAnalytics; 