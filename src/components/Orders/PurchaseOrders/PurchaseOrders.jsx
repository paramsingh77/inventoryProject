import React, { useState, useEffect } from 'react';
import { Table, Button, Form, InputGroup, Badge, Nav, Tab, Row, Col, Card } from 'react-bootstrap';
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
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useNotification } from '../../../context/NotificationContext';
import CreatePO from './CreatePO';
import POInvoices from './POInvoices';
import socket from '../../../utils/socket';
import axios from 'axios';

const PurchaseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const { addNotification } = useNotification();

  // Fetch purchase orders from API
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/purchase-orders');
      console.log('Fetched purchase orders:', response.data);
      
      // Format the orders to match our component structure
      const formattedOrders = response.data.map(order => ({
        id: order.id,
        poNumber: order.order_number,
        supplier: order.supplier_name || order.vendor_name || 'Unknown Vendor',
        vendor: { 
          name: order.supplier_name || order.vendor_name || 'Unknown Vendor',
          email: order.supplier_email || order.vendor_email || ''
        },
        date: new Date(order.order_date || order.created_at).toISOString().split('T')[0],
        createdAt: order.created_at,
        total: parseFloat(order.total_amount || 0),
        totalAmount: parseFloat(order.total_amount || 0),
        status: order.status || 'Pending',
        hasInvoice: order.has_invoice || false,
        items: order.items || []
      }));
      
      setOrders(formattedOrders);
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError('Failed to load purchase orders');
      addNotification('error', 'Failed to load purchase orders');
      
      // Keep demo data for development if API fails
      if (orders.length === 0) {
        setOrders([
          { 
            id: 'PO-001', 
            poNumber: 'PO-001',
            supplier: 'Tech Supplies Inc', 
            vendor: { name: 'Tech Supplies Inc', email: 'info@techsupplies.com' },
            date: '2024-01-20', 
            createdAt: '2024-01-20',
            total: 2500.00,
            totalAmount: 2500.00,
            status: 'pending',
            hasInvoice: false
          },
          { 
            id: 'PO-002', 
            poNumber: 'PO-002',
            supplier: 'Office Solutions', 
            vendor: { name: 'Office Solutions', email: 'orders@officesolutions.com' },
            date: '2024-01-19', 
            createdAt: '2024-01-19',
            total: 1800.00,
            totalAmount: 1800.00,
            status: 'approved',
            hasInvoice: true
          },
          { 
            id: 'PO-003', 
            poNumber: 'PO-003',
            supplier: 'Global Electronics', 
            vendor: { name: 'Global Electronics', email: 'sales@globalelectronics.com' },
            date: '2024-01-18', 
            createdAt: '2024-01-18',
            total: 3200.00,
            totalAmount: 3200.00,
            status: 'delivered',
            hasInvoice: true
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch when component mounts
  useEffect(() => {
    fetchPurchaseOrders();
    
    // Setup socket connection for real-time updates
    socket.on('po_status_update', (data) => {
      console.log('Socket.IO po_status_update event received:', data);
      // Update order status when a socket notification is received
      setOrders(prev => prev.map(order => {
        if (order.id === data.poId || order.poNumber === data.poNumber) {
          return {
            ...order,
            status: data.status
          };
        }
        return order;
      }));
      
      addNotification('info', `PO ${data.poNumber} status updated to ${data.status}`);
    });
    
    return () => {
      socket.off('po_status_update');
    };
  }, [addNotification]);

  useEffect(() => {
    // Listen for new POs
    const handleNewPO = (event) => {
      if (event.detail?.type === 'NEW_PO') {
        const newPO = {
          ...event.detail.po,
          id: event.detail.po.id || event.detail.po.poId || event.detail.po.poNumber,
          supplier: event.detail.po.vendor?.name || 'Unknown Vendor',
          date: new Date().toISOString().split('T')[0],
          total: event.detail.po.totalAmount,
          status: event.detail.po.status || 'pending',
          hasInvoice: false
        };
        
        // Add the new PO and refresh from API to ensure synced data
        setOrders(prev => [newPO, ...prev]);
        fetchPurchaseOrders();
        
        addNotification('success', 'New purchase order created successfully');
      }
    };

    // Listen for new invoices
    const handleNewInvoice = (event) => {
      if (event.detail?.type === 'NEW_INVOICE' && event.detail.poReference) {
        // Update the PO status when an invoice is received
        setOrders(prev => prev.map(order => {
          if (order.poNumber === event.detail.poReference) {
            return {
              ...order,
              status: 'approved', // Change status to Approved when invoice is received
              hasInvoice: true
            };
          }
          return order;
        }));
        addNotification('success', `Invoice received for PO ${event.detail.poReference}`);
      } else if (event.detail?.type === 'UPDATE_PO_STATUS' && event.detail.poReference) {
        // Update the PO status based on the event
        setOrders(prev => prev.map(order => {
          if (order.poNumber === event.detail.poReference) {
            return {
              ...order,
              status: event.detail.status,
              hasInvoice: true
            };
          }
          return order;
        }));
        addNotification('info', `PO ${event.detail.poReference} status updated to ${event.detail.status}`);
      }
    };

    window.addEventListener('purchaseOrder', handleNewPO);
    window.addEventListener('invoice', handleNewInvoice);
    
    return () => {
      window.removeEventListener('purchaseOrder', handleNewPO);
      window.removeEventListener('invoice', handleNewInvoice);
    };
  }, [addNotification]);

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
    fetchPurchaseOrders(); // Refresh the list to ensure the new PO appears
  };

  const filteredOrders = orders.filter(order => {
    // Filter by search term
    const matchesSearch = 
      order.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by tab
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && order.status?.toLowerCase() === activeTab.toLowerCase();
  });

  const getTabCount = (status) => {
    if (status === 'all') return orders.length;
    return orders.filter(order => order.status?.toLowerCase() === status.toLowerCase()).length;
  };

  // Render content
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Purchase Orders</h4>
        <Button 
          variant="primary" 
          className="d-flex align-items-center gap-2"
          onClick={handleCreatePO}
        >
          <FontAwesomeIcon icon={faPlus} />
          Create PO
        </Button>
      </div>

      <div className="bg-light rounded-3 p-4 mb-4">
        <InputGroup>
          <InputGroup.Text className="bg-white border-end-0">
            <FontAwesomeIcon icon={faSearch} className="text-secondary" />
          </InputGroup.Text>
          <Form.Control
            placeholder="Search purchase orders..."
            className="border-start-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
      </div>

      {loading && <p className="text-center">Loading purchase orders...</p>}
      {error && <p className="text-center text-danger">{error}</p>}

      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white border-0 pt-3">
            <Nav variant="tabs">
              <Nav.Item>
                <Nav.Link eventKey="all">
                  All Orders <Badge bg="secondary" pill>{getTabCount('all')}</Badge>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="pending">
                  Pending <Badge bg="warning" pill>{getTabCount('pending')}</Badge>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="approved">
                  Approved <Badge bg="info" pill>{getTabCount('approved')}</Badge>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="delivered">
                  Delivered <Badge bg="success" pill>{getTabCount('delivered')}</Badge>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="rejected">
                  Rejected <Badge bg="danger" pill>{getTabCount('rejected')}</Badge>
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Header>
          <Card.Body>
            <Tab.Content>
              <Tab.Pane eventKey={activeTab}>
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>PO Number</th>
                      <th>Vendor</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id || order.poNumber}>
                        <td>{order.poNumber}</td>
                        <td>{order.vendor?.name || 'N/A'}</td>
                        <td>{order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}</td>
                        <td>${(order.total || 0).toFixed(2)}</td>
                        <td>{getStatusBadge(order.status)}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button variant="light" size="sm" title="View Details">
                              <FontAwesomeIcon icon={faEye} />
                            </Button>
                            {order.status === 'pending' && (
                              <Button variant="light" size="sm" title="Edit">
                                <FontAwesomeIcon icon={faEdit} />
                              </Button>
                            )}
                            <Button 
                              variant="light" 
                              size="sm" 
                              className="text-danger" 
                              title="Delete"
                              disabled={order.status !== 'pending'} // Only allow delete for pending orders
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">
                          {loading ? 'Loading purchase orders...' : 'No purchase orders found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Tab.Pane>
            </Tab.Content>
          </Card.Body>
        </Card>
      </Tab.Container>

      <CreatePO
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSuccess={handlePOCreated}
      />
    </motion.div>
  );
};

export default PurchaseOrders; 