import React, { useState, useEffect } from 'react';
import { Table, Form, Button, Badge, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faFileExport, faSpinner, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { API_CONFIG } from '../../../utils/apiConfig';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('%c OrderHistory component mounted', 'background: #222; color: #bada55');
    console.log('API URL:', API_CONFIG.API_BASE_URL);
    
    document.title = "Order History - Debug Mode";
  }, []);

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      console.log('First order object keys:', Object.keys(orders[0]));
      console.log('First order sample:', orders[0]);
    }
  }, [orders]);

  const fetchOrderHistory = async () => {
    console.log('%c Fetching order history...', 'color: blue; font-size: 12px');
    setError(null);
    
    try {
      setLoading(true);
      const url = `${API_CONFIG.API_BASE_URL}/purchase-orders/history`;
      console.log('🔍 Calling URL:', url);
      
      const response = await fetch(url);
      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', response.headers);
      console.log('📊 Response for this is:', response);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error text:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('📋 Received data:', data);
      console.log('📋 Data length:', data.length);
      if (!Array.isArray(data)) {
        setError('Order history data is not an array.');
        setLoading(false);
        return;
      }
      setOrders(data);
    } catch (error) {
      console.error('❌ Fetch error:', error);
      setError(`Failed to fetch data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  console.log('Orders:', orders);

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'refunded':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return `$${Number(amount).toFixed(2)}`;
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm.trim()) return true;
    
    const search = searchTerm.toLowerCase();
    
    const idMatches = 
      (order.id?.toString()?.toLowerCase()?.includes(search)) ||
      (order.order_id?.toString()?.toLowerCase()?.includes(search)) ||
      (order.order_number?.toString()?.toLowerCase()?.includes(search));
    
    const nameMatches = 
      (order.customer_name?.toLowerCase()?.includes(search)) ||
      (order.customer?.toLowerCase()?.includes(search)) ||
      (order.supplier_name?.toLowerCase()?.includes(search)) ||
      (order.vendor_name?.toLowerCase()?.includes(search));
    
    return idMatches || nameMatches;
  });
  console.log('Filtered orders:', filteredOrders);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Order History</h4>
        <Button variant="outline-primary" onClick={() => console.log('Export')}>
          <FontAwesomeIcon icon={faFileExport} className="me-2" />
          Export
        </Button>
      </div>

      {/* <div className="mb-3 p-2 bg-light">
        <small>API URL: {API_CONFIG.API_BASE_URL}</small><br/>
        <small>Current timestamp: {new Date().toISOString()}</small>
      </div> */}
      
      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}

      <div className="bg-light p-3 rounded mb-4">
        <Form.Control
          type="search"
          placeholder="Search orders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-5 bg-white rounded shadow-sm">
          <div className="p-4">
            <FontAwesomeIcon icon={faFileAlt} style={{ fontSize: '3rem', color: '#ccc' }} className="mb-3" />
            <h5>No approved or rejected orders found</h5>
            <p className="text-muted">
              Orders will appear here once they have been approved or rejected.
            </p>
            {/* Add a debug button in development mode */}
            {process.env.NODE_ENV === 'development' && (
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={() => window.open(`${API_CONFIG.API_BASE_URL}/purchase-orders/debug-all`, '_blank')}
              >
                Check All Orders
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Table responsive hover className="bg-white rounded shadow-sm">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id || order.order_id}>
                <td>{order.order_number || order.id || '-'}</td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                <td>{order.customer_name || order.supplier_name || '-'}</td>
                <td>${Number(order.total || order.total_amount || 0).toFixed(2)}</td>
                <td>
                  <Badge bg={getStatusBadgeVariant(order.status)}>
                    {order.status || 'N/A'}
                  </Badge>
                </td>
                <td>
                  <Badge bg={getPaymentStatusBadge(order.payment_status)}>
                    {order.payment_status || 'N/A'}
                  </Badge>
                </td>
                <td>
                  <Button variant="link" className="p-0" title="View Details">
                    <FontAwesomeIcon icon={faEye} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </motion.div>
  );
};

export default OrderHistory; 