import React, { useState, useEffect } from 'react';
import { Table, Badge, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { purchaseOrders as initialPOs } from '../../../data/samplePOData';

const POList = ({ filter = 'all' }) => {
  const [purchaseOrders, setPurchaseOrders] = useState(initialPOs || []);

  // Filter purchase orders based on status
  const filteredPOs = purchaseOrders.filter(po => {
    if (filter === 'all') return true;
    return po.status === filter;
  });

  // Listen for new POs from CreatePO component
  useEffect(() => {
    const handleNewPO = (event) => {
      if (event.detail?.type === 'NEW_PO') {
        setPurchaseOrders(prev => [event.detail.po, ...prev]);
      }
    };

    window.addEventListener('purchaseOrder', handleNewPO);
    return () => window.removeEventListener('purchaseOrder', handleNewPO);
  }, []);

  const getStatusBadge = (status) => {
    const colors = {
      'pending_approval': 'warning',
      'approved': 'success',
      'rejected': 'danger',
      'in_progress': 'info',
      'completed': 'primary',
      'cancelled': 'secondary'
    };
    return <Badge bg={colors[status] || 'secondary'}>
      {(status || '').replace('_', ' ').toUpperCase()}
    </Badge>;
  };

  return (
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
        {filteredPOs.map((order) => (
          <tr key={order.id || order.poNumber}>
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
                <Button variant="light" size="sm" title="Edit">
                  <FontAwesomeIcon icon={faEdit} />
                </Button>
                <Button variant="light" size="sm" className="text-danger" title="Delete">
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              </div>
            </td>
          </tr>
        ))}
        {filteredPOs.length === 0 && (
          <tr>
            <td colSpan="6" className="text-center py-4 text-muted">
              No purchase orders found
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
};

export default POList; 