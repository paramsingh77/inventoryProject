import React from 'react';
import { Table, Badge, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { usePurchaseOrders } from '../../../context/PurchaseOrderContext';
import { motion } from 'framer-motion';

const POList = ({ filter = 'all' }) => {
  const { 
    getFilteredPurchaseOrders, 
    loading, 
    error, 
    deletePurchaseOrder 
  } = usePurchaseOrders();

  const purchaseOrders = getFilteredPurchaseOrders(filter);

  const getStatusBadge = (status) => {
    const colors = {
      'pending': 'warning',
      'approved': 'success',
      'rejected': 'danger',
      'in_progress': 'info',
      'completed': 'primary',
      'cancelled': 'secondary'
    };
    return (
      <Badge bg={colors[status?.toLowerCase()] || 'secondary'}>
        {(status || '').replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
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
          {purchaseOrders.map((order) => (
            <motion.tr
              key={order.id || order.poNumber}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <td>{order.poNumber}</td>
              <td>{order.vendor?.name || 'N/A'}</td>
              <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
              <td>${(order.totalAmount || 0).toFixed(2)}</td>
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
                  {order.status === 'pending' && (
                    <Button 
                      variant="light" 
                      size="sm" 
                      className="text-danger" 
                      title="Delete"
                      onClick={() => deletePurchaseOrder(order.id || order.poNumber)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  )}
                </div>
              </td>
            </motion.tr>
          ))}
          {purchaseOrders.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center py-4 text-muted">
                No purchase orders found
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </motion.div>
  );
};

export default POList; 