import React from 'react';
import { Card, Accordion, ListGroup, Badge } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faQuestionCircle, 
  faPlus, 
  faSearch, 
  faFilter, 
  faSortAmountDown, 
  faFileExport, 
  faEdit,
  faTrash
} from '@fortawesome/free-solid-svg-icons';

const SupplierDocs = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ fontFamily: 'Afacad, sans-serif' }}
    >
      <Card className="shadow-sm">
        <Card.Header className="d-flex align-items-center">
          <FontAwesomeIcon 
            icon={faQuestionCircle} 
            className="text-primary me-2" 
            size="lg"
          />
          <h5 className="mb-0 fw-semibold">Supplier Management Documentation</h5>
        </Card.Header>
        <Card.Body>
          <p className="lead mb-4">
            Welcome to the Supplier Management module! This guide will help you understand how to use the various features available.
          </p>

          <Accordion className="mb-4">
            <Accordion.Item eventKey="0">
              <Accordion.Header>
                <FontAwesomeIcon icon={faPlus} className="me-2 text-primary" />
                Adding a New Supplier
              </Accordion.Header>
              <Accordion.Body>
                <p>To add a new supplier to the system:</p>
                <ListGroup variant="flush" numbered>
                  <ListGroup.Item>Click the "Add New Supplier" button on the main Suppliers page</ListGroup.Item>
                  <ListGroup.Item>Fill in the required information in the form:
                    <ul className="mt-2">
                      <li><Badge bg="primary">Required</Badge> Company Name</li>
                      <li><Badge bg="primary">Required</Badge> Contact Email</li>
                      <li><Badge bg="primary">Required</Badge> Phone Number</li>
                      <li><Badge bg="secondary">Optional</Badge> Company Website</li>
                      <li><Badge bg="secondary">Optional</Badge> Address Information</li>
                      <li><Badge bg="secondary">Optional</Badge> Tax ID</li>
                    </ul>
                  </ListGroup.Item>
                  <ListGroup.Item>Select the supplier category and status</ListGroup.Item>
                  <ListGroup.Item>Click "Save" to add the supplier to the system</ListGroup.Item>
                </ListGroup>
                <p className="mt-3">
                  Once added, the supplier will appear in the supplier list and can be managed from there.
                </p>
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="1">
              <Accordion.Header>
                <FontAwesomeIcon icon={faSearch} className="me-2 text-primary" />
                Finding and Filtering Suppliers
              </Accordion.Header>
              <Accordion.Body>
                <p>The supplier list offers several ways to find specific suppliers:</p>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <FontAwesomeIcon icon={faSearch} className="me-2 text-primary" />
                    <strong>Search</strong>: Use the search bar to find suppliers by name, contact person, email, or other fields
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <FontAwesomeIcon icon={faFilter} className="me-2 text-primary" />
                    <strong>Filter by Status</strong>: Filter suppliers by their status (Active, Inactive, Pending)
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <FontAwesomeIcon icon={faFilter} className="me-2 text-primary" />
                    <strong>Filter by Category</strong>: View suppliers from specific categories only
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <FontAwesomeIcon icon={faSortAmountDown} className="me-2 text-primary" />
                    <strong>Sorting</strong>: Click on column headers to sort suppliers by that field
                  </ListGroup.Item>
                </ListGroup>
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="2">
              <Accordion.Header>
                <FontAwesomeIcon icon={faEdit} className="me-2 text-primary" />
                Managing Existing Suppliers
              </Accordion.Header>
              <Accordion.Body>
                <p>For each supplier in the list, you can perform several actions:</p>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <FontAwesomeIcon icon={faEdit} className="me-2 text-primary" />
                    <strong>Edit Supplier</strong>: Update supplier information by clicking the Edit option in the actions menu
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <FontAwesomeIcon icon={faTrash} className="me-2 text-danger" />
                    <strong>Delete Supplier</strong>: Remove a supplier from the system (requires confirmation)
                  </ListGroup.Item>
                </ListGroup>
                <div className="alert alert-warning mt-3">
                  <strong>Note:</strong> Deleting a supplier will remove all their information from the system. This action cannot be undone.
                </div>
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="3">
              <Accordion.Header>
                <FontAwesomeIcon icon={faFileExport} className="me-2 text-primary" />
                Future Features
              </Accordion.Header>
              <Accordion.Body>
                <p>The following features are coming soon to the Supplier Management module:</p>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <Badge bg="info">Coming Soon</Badge> Supplier Contracts Management
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Badge bg="info">Coming Soon</Badge> Supplier Performance Tracking
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Badge bg="info">Coming Soon</Badge> Transaction History
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Badge bg="info">Coming Soon</Badge> Document Management
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Badge bg="info">Coming Soon</Badge> Export Supplier Data
                  </ListGroup.Item>
                </ListGroup>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>

          <div className="alert alert-info">
            <FontAwesomeIcon icon={faQuestionCircle} className="me-2" />
            <strong>Need More Help?</strong> Contact the system administrator for additional assistance with supplier management.
          </div>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default SupplierDocs; 