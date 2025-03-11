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

const PurchaseOrders = () => {
  const [orders, setOrders] = useState([
    { 
      id: 'PO-001', 
      poNumber: 'PO-001',
      supplier: 'Tech Supplies Inc', 
      vendor: { name: 'Tech Supplies Inc', email: 'info@techsupplies.com' },
      date: '2024-01-20', 
      createdAt: '2024-01-20',
      total: 2500.00,
      totalAmount: 2500.00,
      status: 'Pending',
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
      status: 'Approved',
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
      status: 'Delivered',
      hasInvoice: true
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const { addNotification } = useNotification();

  useEffect(() => {
    // Listen for new POs
    const handleNewPO = (event) => {
      if (event.detail?.type === 'NEW_PO') {
        const newPO = {
          ...event.detail.po,
          id: event.detail.po.poNumber,
          supplier: event.detail.po.vendor?.name || 'Unknown Vendor',
          date: new Date().toISOString().split('T')[0],
          total: event.detail.po.totalAmount,
          status: 'Pending',
          hasInvoice: false
        };
        setOrders(prev => [newPO, ...prev]);
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
              status: 'Approved', // Change status to Approved when invoice is received
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
    
    // Socket.IO event listeners
    socket.on('newInvoice', (data) => {
      console.log('Socket.IO newInvoice event received:', data);
      if (data.type === 'NEW_INVOICE' && data.poReference) {
        // Update the PO status when an invoice is received via Socket.IO
        setOrders(prev => prev.map(order => {
          if (order.poNumber === data.poReference) {
            return {
              ...order,
              status: 'Approved', // Change status to Approved when invoice is received
              hasInvoice: true
            };
          }
          return order;
        }));
        addNotification('success', `Invoice received for PO ${data.poReference}`);
      }
    });
    
    return () => {
      window.removeEventListener('purchaseOrder', handleNewPO);
      window.removeEventListener('invoice', handleNewInvoice);
      socket.off('newInvoice');
    };
  }, [addNotification]);

  const getStatusBadge = (status) => {
    const colors = {
      'Pending': 'warning',
      'Approved': 'info',
      'Delivered': 'success',
      'Cancelled': 'danger'
    };
    return <Badge bg={colors[status]}>{status}</Badge>;
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Pending': faHourglassHalf,
      'Approved': faCheckCircle,
      'Delivered': faTruck,
      'Cancelled': faTimes
    };
    return icons[status] || faHourglassHalf;
  };

  const handleCreatePO = () => {
    setShowCreateModal(true);
  };

  const handlePOCreated = (newPO) => {
    setShowCreateModal(false);
    // The PO will be added via the event listener
  };

  const filteredOrders = orders.filter(order => {
    // Filter by search term
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by tab
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && order.status.toLowerCase() === activeTab.toLowerCase();
  });

  const getTabCount = (status) => {
    if (status === 'all') return orders.length;
    return orders.filter(order => order.status.toLowerCase() === status.toLowerCase()).length;
  };

  // Debug: Log orders to console to verify status changes
  useEffect(() => {
    console.log('Current orders:', orders);
  }, [orders]);

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
                <Nav.Link eventKey="cancelled">
                  Cancelled <Badge bg="danger" pill>{getTabCount('cancelled')}</Badge>
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Header>
          <Card.Body>
            <Tab.Content>
              <Tab.Pane eventKey={activeTab}>
                <Table hover responsive className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>PO Number</th>
                      <th>Supplier</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Invoice</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>{order.supplier}</td>
                        <td>{order.date}</td>
                        <td>${order.total.toFixed(2)}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FontAwesomeIcon 
                              icon={getStatusIcon(order.status)} 
                              className={`text-${getStatusBadge(order.status).props.bg} me-2`} 
                            />
                            {getStatusBadge(order.status)}
                          </div>
                        </td>
                        <td>
                          {order.hasInvoice ? (
                            <Badge bg="success" pill>Received</Badge>
                          ) : (
                            <Badge bg="light" text="dark" pill>Pending</Badge>
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button variant="light" size="sm" title="View Details">
                              <FontAwesomeIcon icon={faEye} />
                            </Button>
                            <Button variant="light" size="sm" title="Edit">
                              <FontAwesomeIcon icon={faEdit} />
                            </Button>
                            <Button variant="light" size="sm" title="Delete">
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Tab.Pane>
            </Tab.Content>
          </Card.Body>
        </Card>
      </Tab.Container>

      {/* Invoices Section */}
      <div className="mt-5">
        <POInvoices />
      </div>

      {/* Create PO Modal */}
      <CreatePO 
        show={showCreateModal} 
        onHide={() => setShowCreateModal(false)}
        onSuccess={handlePOCreated}
      />
    </motion.div>
  );
};

export default PurchaseOrders; 