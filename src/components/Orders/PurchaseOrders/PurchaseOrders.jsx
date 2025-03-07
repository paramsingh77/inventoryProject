import React, { useState } from 'react';
import { Table, Button, Form, InputGroup, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faPlus, 
  faEdit, 
  faTrash,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';

const PurchaseOrders = () => {
  const [orders] = useState([
    { 
      id: 'PO-001', 
      supplier: 'Tech Supplies Inc', 
      date: '2024-01-20', 
      total: 2500.00,
      status: 'Pending'
    },
    { 
      id: 'PO-002', 
      supplier: 'Office Solutions', 
      date: '2024-01-19', 
      total: 1800.00,
      status: 'Approved'
    },
    { 
      id: 'PO-003', 
      supplier: 'Global Electronics', 
      date: '2024-01-18', 
      total: 3200.00,
      status: 'Delivered'
    }
  ]);

  const { addNotification } = useNotification();

  const getStatusBadge = (status) => {
    const colors = {
      'Pending': 'warning',
      'Approved': 'info',
      'Delivered': 'success',
      'Cancelled': 'danger'
    };
    return <Badge bg={colors[status]}>{status}</Badge>;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Purchase Orders</h4>
        <Button variant="primary" className="d-flex align-items-center gap-2">
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
          />
        </InputGroup>
      </div>

      <div className="bg-white rounded-3 shadow-sm">
        <Table hover responsive className="mb-0">
          <thead className="bg-light">
            <tr>
              <th>PO Number</th>
              <th>Supplier</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.supplier}</td>
                <td>{order.date}</td>
                <td>${order.total.toFixed(2)}</td>
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
          </tbody>
        </Table>
      </div>
    </motion.div>
  );
};

export default PurchaseOrders; 