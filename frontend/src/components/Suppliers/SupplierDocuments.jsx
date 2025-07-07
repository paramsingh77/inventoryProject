import React from 'react';
import { Card, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faInfoCircle, faFileContract, faFilePdf, faFileInvoice } from '@fortawesome/free-solid-svg-icons';

const SupplierDocuments = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ fontFamily: 'Afacad, sans-serif' }}
    >
      <Card className="shadow-sm">
        <Card.Header className="d-flex align-items-center">
          <FontAwesomeIcon 
            icon={faFileAlt} 
            className="text-primary me-2" 
            size="lg"
          />
          <h5 className="mb-0 fw-semibold">Supplier Documents</h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="info" className="d-flex align-items-center">
            <FontAwesomeIcon icon={faInfoCircle} className="text-primary me-2" />
            <div>
              This feature is currently in development. You'll be able to manage supplier documents here soon.
            </div>
          </Alert>
          
          <div className="text-center p-4">
            <div className="py-4">
              <div className="d-flex justify-content-center gap-4 mb-4">
                <div className="text-center">
                  <FontAwesomeIcon icon={faFileContract} size="2x" className="text-secondary mb-2" />
                  <p className="mb-0">Contracts</p>
                </div>
                <div className="text-center">
                  <FontAwesomeIcon icon={faFilePdf} size="2x" className="text-danger mb-2" />
                  <p className="mb-0">Certificates</p>
                </div>
                <div className="text-center">
                  <FontAwesomeIcon icon={faFileInvoice} size="2x" className="text-primary mb-2" />
                  <p className="mb-0">Invoices</p>
                </div>
              </div>
              
              <h4 className="text-muted">Document Management</h4>
              <p className="text-muted">
                Store and organize all supplier-related documents in one centralized location.<br/>
                Easily access contracts, certificates, compliance documents, and more.<br/>
                Coming soon!
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default SupplierDocuments; 