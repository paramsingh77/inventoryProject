import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileAlt, 
  faHourglassHalf, 
  faCheckCircle, 
  faFileInvoice,
  faCheckDouble,
  faSyncAlt,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import { useNotification } from '../../context/NotificationContext';
import { usePurchaseOrders } from '../../context/PurchaseOrderContext';
import POList from './PurchaseOrders/POList';
import POInvoices from './PurchaseOrders/POInvoices';
import CreatePO from './PurchaseOrders/CreatePO';
import { motion } from 'framer-motion';

const PurchaseOrders = ({ siteName }) => {
  const { 
    purchaseOrders, 
    loading, 
    error, 
    fetchPurchaseOrders,
    refreshPurchaseOrders,
    addPurchaseOrder
  } = usePurchaseOrders();
  
  const { addNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('all');
  const [prevTab, setPrevTab] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    // Component mount effect
  }, [addNotification]);

  // Handle tab change with better control
  const handleTabChange = (tabKey) => {
    if (tabKey !== prevTab) {
      setPrevTab(activeTab);
      setActiveTab(tabKey);
      
      // Clear any error states when changing tabs
      if (error) {
        // Reset error state if you have one
      }
    }
  };

  // Handle successful PO creation
  const handlePOCreated = (newPO) => {
    console.log('PO created:', newPO);
    
    // Calculate total amount from items if not provided
    if (!newPO.totalAmount && newPO.items && newPO.items.length > 0) {
      // Calculate subtotal
      const subtotal = newPO.items.reduce((sum, item) => 
        sum + (parseFloat(item.quantity) * parseFloat(item.unitPrice || item.price)), 0);
      
      // Calculate tax if provided, or use default tax rate
      const taxAmount = newPO.tax || (subtotal * 0.1); // 10% default tax
      
      // Add shipping fees if provided
      const shippingFees = parseFloat(newPO.shippingFees || 0);
      
      // Calculate total
      const totalAmount = subtotal + taxAmount + shippingFees;
      
      // Update newPO with calculated values
      newPO.subtotal = subtotal;
      newPO.totalAmount = totalAmount;
    }
    
    // Add the new PO to state with complete data
    addPurchaseOrder(newPO);
    
    // Refresh the list to ensure we have the latest data
    refreshPurchaseOrders();
    
    // Show success notification
    addNotification('success', 'Purchase order created successfully');
    
    // Switch to the Pending tab to show the new PO
    handleTabChange('pending');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Container fluid>
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Nav variant="tabs" className="mb-0" activeKey={activeTab} onSelect={handleTabChange}>
                    <Nav.Item>
                      <Nav.Link eventKey="all">
                        <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                        All POs
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="pending">
                        <FontAwesomeIcon icon={faHourglassHalf} className="me-2" />
                        Pending
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="approved">
                        <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                        Approved
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="completed">
                        <FontAwesomeIcon icon={faCheckDouble} className="me-2" />
                        Completed
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="invoices">
                        <FontAwesomeIcon icon={faFileInvoice} className="me-2" />
                        PO Invoices
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                  
                  <div>
                    <Button 
                      variant="primary" 
                      className="me-2"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <FontAwesomeIcon icon={faPlus} className="me-2" />
                      Create PO
                    </Button>
                    
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => refreshPurchaseOrders()}
                      disabled={loading}
                    >
                      <FontAwesomeIcon icon={faSyncAlt} className={loading ? "fa-spin me-2" : "me-2"} />
                      Refresh
                    </Button>
                  </div>
                </div>
                
                {activeTab === 'invoices' ? (
                  <POInvoices />
                ) : (
                  <POList filter={activeTab} />
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Create PO Modal */}
      <CreatePO 
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSuccess={handlePOCreated}
        siteName={siteName}
      />
    </motion.div>
  );
};

export default PurchaseOrders; 