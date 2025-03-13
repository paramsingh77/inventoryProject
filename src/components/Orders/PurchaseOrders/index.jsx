import React, { useState } from 'react';
import { Tab, Tabs, Card, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faClipboardList,
  faHourglassHalf,
  faCheck,
  faHistory,
  faExclamationTriangle,
  faFileInvoice
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import CreatePO from './CreatePO';
import POList from './POList';
import POApprovals from './POApprovals';
import POTracking from './POTracking';
import POReceiving from './POReceiving';
import POInvoices from './POInvoices';
import { useNotification } from '../../../context/NotificationContext';
import { usePurchaseOrders } from '../../../context/PurchaseOrderContext';

const PurchaseOrders = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [showCreatePO, setShowCreatePO] = useState(false);
  const { addNotification } = useNotification();
  const { purchaseOrders } = usePurchaseOrders();

  // Calculate status counts for badges
  const getStatusCount = (status) => {
    return purchaseOrders.filter(po => po.status === status).length;
  };

  const handleCreatePO = (poData) => {
    addNotification('success', 'Purchase Order created successfully');
    setShowCreatePO(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">Purchase Orders</h5>
        <Button variant="primary" onClick={() => setShowCreatePO(true)}>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Create PO
        </Button>
      </div>

      <Card>
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
          >
            <Tab
              eventKey="all"
              title={
                <span>
                  <FontAwesomeIcon icon={faClipboardList} className="me-2" />
                  All POs
                  <span className="badge bg-secondary ms-2">
                    {purchaseOrders.length}
                  </span>
                </span>
              }
            >
              <POList filter="all" />
            </Tab>
            <Tab
              eventKey="pending"
              title={
                <span>
                  <FontAwesomeIcon icon={faHourglassHalf} className="me-2" />
                  Pending
                  {getStatusCount('pending') > 0 && (
                    <span className="badge bg-warning ms-2">
                      {getStatusCount('pending')}
                    </span>
                  )}
                </span>
              }
            >
              <POList filter="pending" />
            </Tab>
            <Tab
              eventKey="approved"
              title={
                <span>
                  <FontAwesomeIcon icon={faCheck} className="me-2" />
                  Approved
                  {getStatusCount('approved') > 0 && (
                    <span className="badge bg-success ms-2">
                      {getStatusCount('approved')}
                    </span>
                  )}
                </span>
              }
            >
              <POList filter="approved" />
            </Tab>
            <Tab
              eventKey="completed"
              title={
                <span>
                  <FontAwesomeIcon icon={faHistory} className="me-2" />
                  Completed
                  {getStatusCount('completed') > 0 && (
                    <span className="badge bg-primary ms-2">
                      {getStatusCount('completed')}
                    </span>
                  )}
                </span>
              }
            >
              <POList filter="completed" />
            </Tab>
            <Tab
              eventKey="invoices"
              title={
                <span>
                  <FontAwesomeIcon icon={faFileInvoice} className="me-2" />
                  PO Invoices
                </span>
              }
            >
              <POInvoices />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      <CreatePO
        show={showCreatePO}
        onHide={() => setShowCreatePO(false)}
        onSuccess={handleCreatePO}
      />
    </motion.div>
  );
};

export default PurchaseOrders;

// Only export components that are actually imported
export {
  CreatePO,
  PurchaseOrders
}; 