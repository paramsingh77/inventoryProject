import React, { useState, useEffect } from 'react';
import { Table, Form, Button, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faFileExport } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const API_URL = process.env.REACT_APP_API_URL;

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/purchase-order/history`);
      if (!response.ok) throw new Error('Failed to fetch order history');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredOrders = orders.filter(order => 
    order.order_id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export functionality to be implemented');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Order History</h4>
        <Button variant="outline-primary" onClick={handleExport}>
          <FontAwesomeIcon icon={faFileExport} className="me-2" />
          Export
        </Button>
      </div>

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
              <tr key={order.order_id}>
                <td>{order.order_id}</td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                <td>{order.customer_name}</td>
                <td>${Number(order.total).toFixed(2)}</td>
                <td>
                  <Badge bg={getStatusBadgeVariant(order.status)}>
                    {order.status}
                  </Badge>
                </td>
                <td>
                  <Badge bg={getPaymentStatusBadge(order.payment_status)}>
                    {order.payment_status}
                  </Badge>
                </td>
                <td>
                  <Button variant="link" className="p-0" title="View Details">
                    <FontAwesomeIcon icon={faEye} />
                  </Button>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </motion.div>
  );
};

export default OrderHistory; 