import React from 'react';
import { Card, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileContract, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const SupplierContracts = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ fontFamily: 'Afacad, sans-serif' }}
    >
      <Card className="shadow-sm">
        <Card.Header className="d-flex align-items-center">
          <FontAwesomeIcon 
            icon={faFileContract} 
            className="text-primary me-2" 
            size="lg"
          />
          <h5 className="mb-0 fw-semibold">Supplier Contracts</h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="info" className="d-flex align-items-center">
            <FontAwesomeIcon icon={faInfoCircle} className="text-primary me-2" />
            <div>
              This feature is currently in development. You'll be able to manage supplier contracts here soon.
            </div>
          </Alert>
          <div className="text-center p-5">
            <div className="py-5">
              <FontAwesomeIcon icon={faFileContract} size="4x" className="text-muted mb-3" />
              <h4 className="text-muted">Contract Management</h4>
              <p className="text-muted">
                Track and manage supplier contracts, terms, renewals, and compliance in one place.
                <br />
                Coming soon!
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default SupplierContracts; 