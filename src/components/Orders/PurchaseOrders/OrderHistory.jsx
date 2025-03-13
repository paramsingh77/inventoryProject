import React from 'react';
import { Table, Button, Form, InputGroup, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faFileDownload, 
  faEye 
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const OrderHistory = () => {
  const orders = [
    {
      id: 'ORD-001',
      date: '2024-01-15',
      customer: 'Tech Corp',
      total: 1500.00,
      status: 'Completed',
      paymentStatus: 'Paid'
    },
    {
      id: 'ORD-002',
      date: '2024-01-14',
      customer: 'Office Solutions',
      total: 2300.00,
      status: 'Completed',
      paymentStatus: 'Pending'
    },
    {
      id: 'ORD-003',
      date: '2024-01-13',
      customer: 'Global Industries',
      total: 3200.00,
      status: 'Cancelled',
      paymentStatus: 'Refunded'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Order History</h4>
        <Button variant="light">
          <FontAwesomeIcon icon={faFileDownload} className="me-2" />
          Export
        </Button>
      </div>

      <div className="bg-light rounded-3 p-4 mb-4">
        <InputGroup>
          <InputGroup.Text className="bg-white border-end-0">
            <FontAwesomeIcon icon={faSearch} className="text-secondary" />
          </InputGroup.Text>
          <Form.Control
            placeholder="Search orders..."
            className="border-start-0"
          />
        </InputGroup>
      </div>

      <div className="bg-white rounded-3 shadow-sm">
        <Table hover responsive className="mb-0">
          <thead className="bg-light">
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
            {orders.map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.date}</td>
                <td>{order.customer}</td>
                <td>${parseFloat(order.total || 0).toFixed(2)}</td>
                <td>
                  <Badge bg={order.status === 'Completed' ? 'success' : 
                           order.status === 'Cancelled' ? 'danger' : 'warning'}>
                    {order.status}
                  </Badge>
                </td>
                <td>
                  <Badge bg={order.paymentStatus === 'Paid' ? 'success' :
                           order.paymentStatus === 'Refunded' ? 'info' : 'warning'}>
                    {order.paymentStatus}
                  </Badge>
                </td>
                <td>
                  <Button variant="light" size="sm" title="View Details">
                    <FontAwesomeIcon icon={faEye} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </motion.div>
  );
};

export default OrderHistory; 