import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faEye } from '@fortawesome/free-solid-svg-icons';
import api from '../../../utils/api';
import socket from '../../../utils/socket';

const POApprovals = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/purchase-orders/pending');
      console.log('Pending approvals:', response.data);
      setPendingApprovals(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      setError('Failed to load pending approvals: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Fetching pending approvals');
    fetchPendingApprovals();
    
    socket.on('po_approval_requested', (data) => {
      console.log('New PO approval requested:', data);
      fetchPendingApprovals();
    });
    
    socket.on('po_status_update', (data) => {
      console.log('PO status updated:', data);
      if (data.status !== 'pending') {
        setPendingApprovals(current => 
          current.filter(po => po.id !== data.poId)
        );
      } else {
        fetchPendingApprovals();
      }
    });

    return () => {
      socket.off('po_approval_requested');
      socket.off('po_status_update');
    };
  }, []);

  const getPriorityBadge = (total) => {
    let priority = 'Low';
    if (total >= 5000) {
      priority = 'High';
    } else if (total >= 1000) {
      priority = 'Medium';
    }
    
    const colors = {
      'High': 'danger',
      'Medium': 'warning',
      'Low': 'info'
    };
    return <Badge bg={colors[priority]}>{priority}</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading pending approvals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
      </Alert>
    );
  }

  if (pendingApprovals.length === 0) {
    return (
      <Alert variant="info">
        <p>No pending purchase orders found.</p>
      </Alert>
    );
  }

  return (
    <Table hover responsive>
      <thead>
        <tr>
          <th>PO Number</th>
          <th>Supplier</th>
          <th>Date</th>
          <th>Total</th>
          <th>Requested By</th>
          <th>Priority</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {pendingApprovals.map((po) => (
          <tr key={po.id}>
            <td>{po.order_number}</td>
            <td>{po.vendor_name || po.vendor_email}</td>
            <td>{new Date(po.created_at).toLocaleDateString()}</td>
            <td>${parseFloat(po.total_amount || 0).toFixed(2)}</td>
            <td>{po.ordered_by_name || 'System'}</td>
            <td>{getPriorityBadge(parseFloat(po.total_amount || 0))}</td>
            <td>
              <div className="d-flex gap-2">
                <Button variant="success" size="sm" title="Approve">
                  <FontAwesomeIcon icon={faCheck} />
                </Button>
                <Button variant="danger" size="sm" title="Reject">
                  <FontAwesomeIcon icon={faTimes} />
                </Button>
                <Button variant="light" size="sm" title="View Details">
                  <FontAwesomeIcon icon={faEye} />
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default POApprovals; 