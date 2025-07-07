import React from 'react';
import { Card, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExchangeAlt, faInfoCircle, faMoneyBillWave, faHistory, faChartBar } from '@fortawesome/free-solid-svg-icons';

const SupplierTransactions = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ fontFamily: 'Afacad, sans-serif' }}
    >
      <Card className="shadow-sm">
        <Card.Header className="d-flex align-items-center">
          <FontAwesomeIcon 
            icon={faExchangeAlt} 
            className="text-primary me-2" 
            size="lg"
          />
          <h5 className="mb-0 fw-semibold">Supplier Transactions</h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="info" className="d-flex align-items-center">
            <FontAwesomeIcon icon={faInfoCircle} className="text-primary me-2" />
            <div>
              This feature is currently in development. You'll be able to track and manage supplier transactions here soon.
            </div>
          </Alert>
          
          <div className="text-center p-4">
            <div className="py-4">
              <div className="d-flex justify-content-center gap-5 mb-4">
                <div className="text-center">
                  <FontAwesomeIcon icon={faMoneyBillWave} size="2x" className="text-success mb-2" />
                  <p className="mb-0">Payments</p>
                </div>
                <div className="text-center">
                  <FontAwesomeIcon icon={faHistory} size="2x" className="text-warning mb-2" />
                  <p className="mb-0">Transaction History</p>
                </div>
                <div className="text-center">
                  <FontAwesomeIcon icon={faChartBar} size="2x" className="text-info mb-2" />
                  <p className="mb-0">Spend Analytics</p>
                </div>
              </div>
              
              <h4 className="text-muted">Transaction Management</h4>
              <p className="text-muted">
                Track all financial interactions with suppliers in one place.<br/>
                Monitor payments, review transaction history, and analyze spending patterns.<br/>
                Coming soon!
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default SupplierTransactions; 