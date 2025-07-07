import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Button, Form, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileAlt, 
  faHourglassHalf, 
  faCheckCircle, 
  faFileInvoice,
  faCheckDouble,
  faSyncAlt,
  faPlus,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import { useNotification } from '../../context/NotificationContext';
import { usePurchaseOrders } from '../../context/PurchaseOrderContext';
import POList from './PurchaseOrders/POList';
import POInvoices from './PurchaseOrders/POInvoices';
import CreatePO from './PurchaseOrders/CreatePO';
import { motion } from 'framer-motion';

// FIXED: Simplified PO flow - Only 'All POs' and PO creation remain. Approval and status sub-tabs removed for clarity and safety.
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
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleCreatePO = () => {
    setShowCreateModal(true);
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
                  <Form.Group style={{ width: '300px' }}>
                    <InputGroup>
                      <InputGroup.Text>
                        <FontAwesomeIcon icon={faSearch} />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Search by PO number or vendor"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </Form.Group>
                  <Button 
                    variant="primary" 
                    onClick={handleCreatePO}
                    className="d-flex align-items-center gap-1"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Create PO</span>
                  </Button>
                </div>
                <POList filter="all" />
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