import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faBoxes, 
  faTags, 
  faBuilding 
} from '@fortawesome/free-solid-svg-icons';

const DashboardCards = ({ siteData }) => {
  return (
    <Row className="g-4 mb-4">
      <Col md={3}>
        <Card className="h-100">
          <Card.Body>
            <div className="d-flex align-items-center">
              <div className="rounded-circle p-3 bg-primary bg-opacity-10">
                <FontAwesomeIcon icon={faUsers} className="text-primary" />
              </div>
              <div className="ms-3">
                <h6 className="mb-1">Total Employees</h6>
                <h3 className="mb-0">{siteData.employeeCount}</h3>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
      {/* Similar cards for Suppliers, Categories, and Products */}
    </Row>
  );
};

export default DashboardCards; 