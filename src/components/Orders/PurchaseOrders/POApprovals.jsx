import React from 'react';
import { Table, Badge, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faEye } from '@fortawesome/free-solid-svg-icons';

const POApprovals = () => {
  const pendingApprovals = [
    {
      id: 'PO-004',
      supplier: 'Tech Supplies Inc',
      date: '2024-01-21',
      total: 3500.00,
      requestedBy: 'John Doe',
      priority: 'High'
    },
    {
      id: 'PO-005',
      supplier: 'Office Solutions',
      date: '2024-01-21',
      total: 1200.00,
      requestedBy: 'Jane Smith',
      priority: 'Medium'
    }
  ];

  const getPriorityBadge = (priority) => {
    const colors = {
      'High': 'danger',
      'Medium': 'warning',
      'Low': 'info'
    };
    return <Badge bg={colors[priority]}>{priority}</Badge>;
  };

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
            <td>{po.id}</td>
            <td>{po.supplier}</td>
            <td>{po.date}</td>
            <td>${po.total.toFixed(2)}</td>
            <td>{po.requestedBy}</td>
            <td>{getPriorityBadge(po.priority)}</td>
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