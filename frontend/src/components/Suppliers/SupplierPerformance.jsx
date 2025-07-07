import React from 'react';
import { Card, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const SupplierPerformance = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ fontFamily: 'Afacad, sans-serif' }}
    >
      <Card className="shadow-sm">
        <Card.Header className="d-flex align-items-center">
          <FontAwesomeIcon 
            icon={faChartLine} 
            className="text-primary me-2" 
            size="lg"
          />
          <h5 className="mb-0 fw-semibold">Supplier Performance</h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="info" className="d-flex align-items-center">
            <FontAwesomeIcon icon={faInfoCircle} className="text-primary me-2" />
            <div>
              This feature is currently in development. You'll be able to view supplier performance metrics here soon.
            </div>
          </Alert>
          <div className="text-center p-5">
            <div className="py-5">
              <FontAwesomeIcon icon={faChartLine} size="4x" className="text-muted mb-3" />
              <h4 className="text-muted">Performance Analytics</h4>
              <p className="text-muted">
                Track supplier performance with metrics like on-time delivery, quality ratings, and response times.
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

export default SupplierPerformance; 