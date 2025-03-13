import React, { useState, useEffect } from 'react';
import { 
    Table, 
    Button, 
    Badge, 
    Card, 
    Container,
    Row,
    Col,
    Modal,
    Form,
    InputGroup
} from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCheck, 
    faTimes, 
    faEye, 
    faEdit,
    faComment,
    faSearch,
    faFilter,
    faFileInvoice,
    faBell
} from '@fortawesome/free-solid-svg-icons';
import { useNotification } from '../../context/NotificationContext';
import { io } from 'socket.io-client';
import axios from 'axios';

const OrderApprovals = () => {
    const [pendingOrders, setPendingOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [comments, setComments] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    const { addNotification } = useNotification();

    // Connect to socket and fetch pending orders
    useEffect(() => {
        setLoading(true);
        
        // Initialize socket connection first
        const newSocket = io(process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:2000', {
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            transports: ['websocket', 'polling'] // Try websocket first, fallback to polling
        });
        
        newSocket.on('connect', () => {
            console.log('Socket connected for admin approval notifications');
            setSocket(newSocket);
        });
        
        newSocket.on('disconnect', () => {
            console.log('Socket disconnected from admin notification service');
        });
        
        newSocket.on('connect_error', (error) => {
            console.error('Admin socket connection error:', error);
            addNotification('error', `Connection error: ${error.message}`);
        });
        
        // Listen for purchase order approval requests
        newSocket.on('po_approval_requested', (data) => {
            console.log('New purchase order approval requested:', data);
            
            // Add the new order to the pending list at the beginning (or just refresh orders from API)
            fetchPendingOrders();
            
            // Show notification about the new request
            addNotification('info', `New purchase order ${data.poNumber} requires approval`);
            // Add a more prominent second notification
            addNotification('warning', `${data.requestedBy} requested approval for ${data.poNumber}`);
        });
        
        // Listen for direct notifications (admin-to-admin)
        newSocket.on('direct_po_notification', (data) => {
            console.log('Received direct PO notification:', data);
            
            // Different visual indication for admin-to-admin messages
            addNotification('info', `💼 Admin ${data.requestedBy} created PO ${data.poNumber} requiring approval`);
            
            // Refresh orders from the API
            fetchPendingOrders();
        });
        
        setSocket(newSocket);
        
        // Fetch pending orders from API
        fetchPendingOrders();
        
        // Clean up on unmount
        return () => {
            if (newSocket) {
                console.log('Admin: Disconnecting socket');
                newSocket.disconnect();
            }
        };
    }, []); // Empty dependency array to only run once

    // Function to fetch pending orders from the API
    const fetchPendingOrders = async () => {
        try {
            setLoading(true);
            
            // Call the API to get pending orders
            const response = await axios.get('/api/purchase-orders/pending');
            console.log('Fetched pending orders:', response.data);
            
            // Format the orders to match the component's expected format
            const formattedOrders = response.data.map(order => ({
                id: order.id,
                poId: order.id,
                poNumber: order.order_number,
                vendorName: order.supplier_name || order.vendor_name || 'Not specified',
                vendorEmail: order.supplier_email || order.vendor_email || order.vendorEmail || '',
                contactPerson: order.contact_person || order.contactPerson || '',
                phoneNumber: order.phone_number || order.phoneNumber || '',
                requestedBy: order.ordered_by_name || order.username || 'Unknown',
                department: order.department || 'Not specified',
                date: new Date(order.order_date || order.created_at).toISOString().split('T')[0],
                total: parseFloat(order.total_amount || 0),
                items: order.items || [],
                notes: order.notes || '',
                fromAdmin: order.from_admin || false
            }));
            
            setPendingOrders(formattedOrders);
        } catch (error) {
            console.error('Error fetching pending orders:', error);
            addNotification('error', 'Failed to load pending orders');
            // Keep a minimal set of orders if the API fails
            setPendingOrders([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter orders based on search term
    const filteredOrders = pendingOrders.filter(order => 
        order.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // View order details
    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        setShowOrderModal(true);
    };

    // Close order details modal
    const handleCloseModal = () => {
        setSelectedOrder(null);
        setShowOrderModal(false);
        setComments('');
    };

    // Update handle approve function to use the API
    const handleApproveOrder = async (orderId) => {
        try {
            // Call API to approve the order
            const response = await axios.patch(`/api/purchase-orders/${orderId}/status`, { 
                status: 'approved',
                comments: comments || '', // Ensure comments is always a string
                username: localStorage.getItem('username') || 'Admin',
                vendorEmail: selectedOrder.vendorEmail // Pass vendor email to backend
            });
            
            console.log(`Order ${orderId} approved:`, response.data);
            
            // Update local state by removing the approved order
            setPendingOrders(prev => prev.filter(order => order.id !== orderId));
            
            // Send notification via socket
            if (socket) {
                socket.emit('po_status_update', {
                    poId: orderId,
                    poNumber: selectedOrder.poNumber,
                    status: 'approved',
                    approvedBy: localStorage.getItem('username') || 'Admin',
                    comments: comments || ''
                });
            }
            
            // Show notification
            addNotification('success', `Purchase order ${selectedOrder.poNumber} approved and sent to vendor`);
            
            // Close modal
            handleCloseModal();
        } catch (error) {
            console.error('Error approving order:', error);
            addNotification('error', `Failed to approve order: ${error.response?.data?.message || error.message}`);
        }
    };

    // Update handle reject function to use the API
    const handleRejectOrder = async (orderId) => {
        if (!comments.trim()) {
            addNotification('warning', 'Please provide a reason for rejection');
            return;
        }
        
        try {
            // Call API to reject the order
            const response = await axios.patch(`/api/purchase-orders/${orderId}/status`, { 
                status: 'rejected',
                comments: comments || '', // Ensure comments is always a string
                username: localStorage.getItem('username') || 'Admin'
            });
            
            console.log(`Order ${orderId} rejected:`, response.data);
            
            // Update local state by removing the rejected order
            setPendingOrders(prev => prev.filter(order => order.id !== orderId));
            
            // Send notification via socket
            if (socket) {
                socket.emit('po_status_update', {
                    poId: orderId,
                    poNumber: selectedOrder.poNumber,
                    status: 'rejected',
                    rejectedBy: localStorage.getItem('username') || 'Admin',
                    reason: comments
                });
            }
            
            // Show notification
            addNotification('warning', `Purchase order ${selectedOrder.poNumber} rejected`);
            
            // Close modal
            handleCloseModal();
        } catch (error) {
            console.error('Error rejecting order:', error);
            addNotification('error', `Failed to reject order: ${error.response?.data?.message || error.message}`);
        }
    };

    return (
        <Container fluid>
            <Card className="shadow-sm border-0 mb-4">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="mb-0">
                            <FontAwesomeIcon icon={faBell} className="me-2 text-primary" />
                            Purchase Orders Pending Approval
                        </h5>
                        <InputGroup style={{ width: '300px' }}>
                            <InputGroup.Text className="bg-white">
                                <FontAwesomeIcon icon={faSearch} className="text-muted" />
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Search by PO number, vendor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </div>
                    
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2 text-muted">Loading pending approvals...</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-5">
                            <FontAwesomeIcon icon={faCheck} className="text-success mb-3" size="2x" />
                            <h5>No Purchase Orders Pending Approval</h5>
                            <p className="text-muted">All purchase orders have been processed.</p>
                        </div>
                    ) : (
                        <Table responsive hover className="align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th>PO Number</th>
                                    <th>Vendor Information</th>
                                    <th>Requested By</th>
                                    <th>Department</th>
                                    <th>Date</th>
                                    <th>Total</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {filteredOrders.map(order => (
                                        <motion.tr 
                                            key={order.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <td className="fw-medium text-primary">{order.poNumber}</td>
                                            <td>
                                                <div className="vendor-info">
                                                    <div className="fw-medium">{order.vendorName || 'Not specified'}</div>
                                                    {order.vendorEmail && (
                                                        <small className="text-muted d-block">
                                                            {order.vendorEmail}
                                                        </small>
                                                    )}
                                                    {order.contactPerson && (
                                                        <small className="text-muted d-block">
                                                            Contact: {order.contactPerson}
                                                        </small>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{order.requestedBy}</td>
                                            <td>{order.department}</td>
                                            <td>{order.date}</td>
                                            <td className="fw-medium">${parseFloat(order.total || 0).toFixed(2)}</td>
                                            <td>
                                                <div className="d-flex justify-content-end gap-2">
                                                    <Button 
                                                        variant="light" 
                                                        size="sm"
                                                        onClick={() => handleViewOrder(order)}
                                                        title="View Details"
                                                    >
                                                        <FontAwesomeIcon icon={faEye} className="text-primary" />
                                                    </Button>
                                                    <Button 
                                                        variant="success" 
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setShowOrderModal(true);
                                                        }}
                                                        title="Approve"
                                                    >
                                                        <FontAwesomeIcon icon={faCheck} />
                                                    </Button>
                                                    <Button 
                                                        variant="danger" 
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setShowOrderModal(true);
                                                        }}
                                                        title="Reject"
                                                    >
                                                        <FontAwesomeIcon icon={faTimes} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
            
            {/* Order Details Modal */}
            <Modal 
                show={showOrderModal} 
                onHide={handleCloseModal}
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FontAwesomeIcon icon={faFileInvoice} className="me-2 text-primary" />
                        Purchase Order {selectedOrder?.poNumber}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedOrder && (
                        <>
                            <Row className="mb-4">
                                <Col md={6}>
                                    <h6 className="mb-3">Order Information</h6>
                                    <Table borderless size="sm">
                                        <tbody>
                                            <tr>
                                                <td className="fw-medium">PO Number:</td>
                                                <td>{selectedOrder.poNumber}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Vendor:</td>
                                                <td>{selectedOrder.vendorName}</td>
                                            </tr>
                                            {selectedOrder.vendorEmail && (
                                                <tr>
                                                    <td className="fw-medium">Vendor Email:</td>
                                                    <td>{selectedOrder.vendorEmail}</td>
                                                </tr>
                                            )}
                                            {selectedOrder.contactPerson && (
                                                <tr>
                                                    <td className="fw-medium">Contact Person:</td>
                                                    <td>{selectedOrder.contactPerson}</td>
                                                </tr>
                                            )}
                                            {selectedOrder.phoneNumber && (
                                                <tr>
                                                    <td className="fw-medium">Phone:</td>
                                                    <td>{selectedOrder.phoneNumber}</td>
                                                </tr>
                                            )}
                                            <tr>
                                                <td className="fw-medium">Date:</td>
                                                <td>{selectedOrder.date}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Total:</td>
                                                <td className="fw-medium">${parseFloat(selectedOrder.total || 0).toFixed(2)}</td>
                                            </tr>
                                        </tbody>
                                    </Table>
                                </Col>
                                <Col md={6}>
                                    <h6 className="mb-3">Requester Information</h6>
                                    <Table borderless size="sm">
                                        <tbody>
                                            <tr>
                                                <td className="fw-medium">Requested By:</td>
                                                <td>{selectedOrder.requestedBy}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Department:</td>
                                                <td>{selectedOrder.department}</td>
                                            </tr>
                                        </tbody>
                                    </Table>
                                </Col>
                            </Row>
                            
                            <h6 className="mb-3">Order Items</h6>
                            <Table responsive className="mb-4">
                                <thead className="bg-light">
                                    <tr>
                                        <th>Item</th>
                                        <th className="text-end">Quantity</th>
                                        <th className="text-end">Unit Price</th>
                                        <th className="text-end">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                        selectedOrder.items.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.notes || item.name || 'Item #' + (index + 1)}</td>
                                                <td className="text-end">{item.quantity || 0}</td>
                                                <td className="text-end">${parseFloat(item.unit_price || item.price || 0).toFixed(2)}</td>
                                                <td className="text-end">${parseFloat((item.quantity || 0) * (item.unit_price || item.price || 0)).toFixed(2)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center py-3 text-muted">
                                                No items available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="border-top">
                                    <tr>
                                        <td colSpan="3" className="text-end fw-medium">Total:</td>
                                        <td className="text-end fw-medium">${parseFloat(selectedOrder.total || 0).toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            </Table>
                            
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    <FontAwesomeIcon icon={faComment} className="me-2" />
                                    Comments / Reason
                                </Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="Add comments or reason for rejection..."
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                />
                                <Form.Text className="text-muted">
                                    Comments are required when rejecting a purchase order.
                                </Form.Text>
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={handleCloseModal}>
                        Cancel
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={() => handleRejectOrder(selectedOrder?.id)}
                    >
                        <FontAwesomeIcon icon={faTimes} className="me-2" />
                        Reject
                    </Button>
                    <Button 
                        variant="success" 
                        onClick={() => handleApproveOrder(selectedOrder?.id)}
                    >
                        <FontAwesomeIcon icon={faCheck} className="me-2" />
                        Approve
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default OrderApprovals; 