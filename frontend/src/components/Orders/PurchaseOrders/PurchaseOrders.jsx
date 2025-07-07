import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Badge, Nav, Tab, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faPlus, 
  faEdit, 
  faTrash,
  faEye,
  faFileInvoice,
  faCheckCircle,
  faHourglassHalf,
  faTruck,
  faTimes,
  faSyncAlt,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useNotification } from '../../../context/NotificationContext';
import { usePurchaseOrders } from '../../../context/PurchaseOrderContext';
import CreatePO from './CreatePO';
import POInvoices from './POInvoices';
import POList from './POList';
import socket from '../../../utils/socket';

const PurchaseOrders = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isRefreshingSocket, setIsRefreshingSocket] = useState(false);
  const [filter, setFilter] = useState('all');

  const { 
    purchaseOrders, 
    loading, 
    error, 
    fetchPurchaseOrders,
    refreshPurchaseOrders 
  } = usePurchaseOrders();
  const { addNotification } = useNotification();

  // Initial fetch when component mounts
  useEffect(() => {
    // Socket connection status checks
    if (!socket.connected) {
      console.log('Socket not connected - attempting to connect...');
      socket.reconnect();
    }

    const checkSocketConnection = () => {
      if (!socket.connected) {
        addNotification('warning', 'Real-time connection is not available. Some updates may be delayed.');
      }
    };

    // Check socket connection after a delay
    const timer = setTimeout(checkSocketConnection, 3000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [addNotification]);

  const handleSocketRefresh = () => {
    setIsRefreshingSocket(true);
    
    try {
      socket.disconnect();
      setTimeout(() => {
        socket.reconnect();
        setTimeout(() => {
          // After reconnection, refresh data
          refreshPurchaseOrders();
          setIsRefreshingSocket(false);
        }, 1000);
      }, 500);
    } catch (err) {
      console.error('Error refreshing socket connection:', err);
      setIsRefreshingSocket(false);
      addNotification('error', 'Failed to refresh connection. Please reload the page.');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'pending': 'warning',
      'approved': 'info',
      'delivered': 'success',
      'cancelled': 'danger',
      'rejected': 'danger'
    };
    return <Badge bg={colors[status?.toLowerCase()] || 'secondary'}>{status?.toUpperCase()}</Badge>;
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': faHourglassHalf,
      'approved': faCheckCircle,
      'delivered': faTruck,
      'cancelled': faTimes,
      'rejected': faTimes
    };
    return icons[status?.toLowerCase()] || faHourglassHalf;
  };

  const handleCreatePO = () => {
    setShowCreateModal(true);
  };

  const handlePOCreated = (newPO) => {
    // The event listener will handle adding the new PO
    setShowCreateModal(false);
    refreshPurchaseOrders(); // Refresh the list to ensure the new PO appears
  };

  const filteredOrders = purchaseOrders.filter(order => {
    // Filter by search term
    return order.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getTabCount = (status) => {
    if (status === 'all') return purchaseOrders.length;
    return purchaseOrders.filter(order => order.status?.toLowerCase() === status.toLowerCase()).length;
  };

  // Render content
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
                <POList filter={activeTab} />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Create PO Modal */}
      <CreatePO 
        show={showCreateModal} 
        onHide={() => setShowCreateModal(false)}
        onPOCreated={handlePOCreated}
      />
    </motion.div>
  );
};

export default PurchaseOrders; 