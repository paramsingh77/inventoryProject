import React from 'react';
import { Table, Button, Badge, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faEye, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const POReceiving = () => {
  const receivingOrders = [
    {
      id: 'PO-006',
      supplier: 'Tech Supplies Inc',
      expectedDate: '2024-01-22',
      items: [
        { name: 'Laptop', quantity: 5, received: 0 },
        { name: 'Mouse', quantity: 10, received: 0 }
      ],
      status: 'Pending'
    },
    {
      id: 'PO-007',
      supplier: 'Office Solutions',
      expectedDate: '2024-01-21',
      items: [
        { name: 'Desk Chair', quantity: 3, received: 2 },
        { name: 'Filing Cabinet', quantity: 2, received: 2 }
      ],
      status: 'Partial'
    }
  ];

  const getStatusBadge = (status) => {
    const colors = {
      'Pending': 'warning',
      'Partial': 'info',
      'Complete': 'success',
      'Issue': 'danger'
    };
    return <Badge bg={colors[status]}>{status}</Badge>;
  };

  return (
    <Table hover responsive>
      <thead>
        <tr>
          <th>PO Number</th>
          <th>Supplier</th>
          <th>Expected Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {receivingOrders.map((order) => (
          <tr key={order.id}>
            <td>{order.id}</td>
            <td>{order.supplier}</td>
            <td>{order.expectedDate}</td>
            <td>{getStatusBadge(order.status)}</td>
            <td>
              <div className="d-flex gap-2">
                <Button variant="success" size="sm" title="Mark as Received">
                  <FontAwesomeIcon icon={faCheck} />
                </Button>
                <Button variant="warning" size="sm" title="Report Issue">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
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

export default POReceiving; 