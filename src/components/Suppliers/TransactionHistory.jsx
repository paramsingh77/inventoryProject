import React, { useState } from 'react';
import { Card, Table, Form, InputGroup, Badge, Button, Row, Col, Modal } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faFileDownload,
  faFilter,
  faSort,
  faEye,
  faTimes,
  faReceipt,
  faFileInvoice,
  faMoneyBillWave,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';

const styles = {
  container: {
    fontFamily: 'Afacad, sans-serif'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#344767'
  },
  header: {
    background: '#f8f9fa',
    borderBottom: '1px solid #dee2e6',
    padding: '1rem'
  },
  badge: {
    fontSize: '0.75rem',
    fontWeight: '500'
  },
  modalTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#344767'
  },
  detailLabel: {
    fontSize: '0.875rem',
    color: '#67748e',
    fontWeight: '500'
  },
  detailValue: {
    fontSize: '0.875rem',
    color: '#344767'
  }
};

const TransactionHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [transactionType, setTransactionType] = useState('all');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Sample transaction data
  const transactions = [
    {
      id: 1,
      date: '2024-01-15',
      supplier: 'Acme Supplies',
      type: 'purchase_order',
      reference: 'PO-2024-001',
      amount: 15000.00,
      status: 'completed',
      paymentMethod: 'bank_transfer',
      items: [
        { name: 'Product A', quantity: 100, price: 50.00 },
        { name: 'Product B', quantity: 200, price: 50.00 }
      ],
      paymentDetails: {
        bankName: 'City Bank',
        accountNumber: '****4567',
        transactionId: 'TXN123456'
      },
      notes: 'Regular monthly order'
    },
    {
      id: 2,
      date: '2024-01-16',
      supplier: 'Global Trading Co.',
      type: 'payment',
      reference: 'PAY-2024-002',
      amount: 8500.00,
      status: 'pending',
      paymentMethod: 'wire_transfer',
      items: [],
      paymentDetails: {
        bankName: 'Global Bank',
        accountNumber: '****7890',
        transactionId: 'TXN789012'
      },
      notes: 'Advance payment for upcoming order'
    }
  ];

  const getStatusBadge = (status) => {
    const badges = {
      completed: { bg: 'success', icon: faReceipt },
      pending: { bg: 'warning', icon: faMoneyBillWave },
      cancelled: { bg: 'danger', icon: faTimes },
      processing: { bg: 'info', icon: faFileInvoice }
    };
    return (
      <Badge 
        bg={badges[status].bg} 
        style={styles.badge}
        className="d-flex align-items-center gap-1"
      >
        <FontAwesomeIcon icon={badges[status].icon} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetails(true);
  };

  const TransactionDetailsModal = () => (
    <Modal
      show={showDetails}
      onHide={() => setShowDetails(false)}
      size="lg"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title style={styles.modalTitle}>
          Transaction Details - {selectedTransaction?.reference}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="g-4">
          {/* Basic Information */}
          <Col md={6}>
            <Card className="h-100">
              <Card.Body>
                <h6 className="mb-3">Basic Information</h6>
                <div className="mb-2">
                  <div style={styles.detailLabel}>Date</div>
                  <div style={styles.detailValue}>
                    {new Date(selectedTransaction?.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="mb-2">
                  <div style={styles.detailLabel}>Supplier</div>
                  <div style={styles.detailValue}>{selectedTransaction?.supplier}</div>
                </div>
                <div className="mb-2">
                  <div style={styles.detailLabel}>Type</div>
                  <div style={styles.detailValue}>
                    {selectedTransaction?.type.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </div>
                </div>
                <div className="mb-2">
                  <div style={styles.detailLabel}>Status</div>
                  <div>{getStatusBadge(selectedTransaction?.status)}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Payment Details */}
          <Col md={6}>
            <Card className="h-100">
              <Card.Body>
                <h6 className="mb-3">Payment Details</h6>
                <div className="mb-2">
                  <div style={styles.detailLabel}>Amount</div>
                  <div style={styles.detailValue}>
                    ${selectedTransaction?.amount.toFixed(2)}
                  </div>
                </div>
                <div className="mb-2">
                  <div style={styles.detailLabel}>Payment Method</div>
                  <div style={styles.detailValue}>
                    {selectedTransaction?.paymentMethod.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </div>
                </div>
                <div className="mb-2">
                  <div style={styles.detailLabel}>Bank Name</div>
                  <div style={styles.detailValue}>
                    {selectedTransaction?.paymentDetails.bankName}
                  </div>
                </div>
                <div className="mb-2">
                  <div style={styles.detailLabel}>Transaction ID</div>
                  <div style={styles.detailValue}>
                    {selectedTransaction?.paymentDetails.transactionId}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Items Table (if applicable) */}
          {selectedTransaction?.items.length > 0 && (
            <Col md={12}>
              <Card>
                <Card.Body>
                  <h6 className="mb-3">Items</h6>
                  <Table responsive hover size="sm">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTransaction.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td>${item.price.toFixed(2)}</td>
                          <td>${(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          )}

          {/* Notes */}
          <Col md={12}>
            <Card>
              <Card.Body>
                <h6 className="mb-3">Notes</h6>
                <p className="mb-0">{selectedTransaction?.notes}</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={styles.container}
    >
      <Card className="shadow-sm">
        {/* Header */}
        <div style={styles.header}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 style={styles.title}>Transaction History</h5>
            <Button variant="primary" size="sm">
              <FontAwesomeIcon icon={faFileDownload} className="me-2" />
              Export
            </Button>
          </div>

          {/* Filters */}
          <div className="d-flex gap-3 flex-wrap">
            <InputGroup style={{ maxWidth: '300px' }}>
              <InputGroup.Text>
                <FontAwesomeIcon icon={faSearch} />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>

            <Form.Select
              style={{ width: 'auto' }}
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </Form.Select>

            <Form.Select
              style={{ width: 'auto' }}
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="purchase_order">Purchase Orders</option>
              <option value="payment">Payments</option>
              <option value="refund">Refunds</option>
            </Form.Select>
          </div>
        </div>

        {/* Transactions Table */}
        <Table responsive hover>
          <thead>
            <tr>
              <th>Date</th>
              <th>Supplier</th>
              <th>Type</th>
              <th>Reference</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Payment Method</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => (
              <motion.tr
                key={transaction.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <td>{new Date(transaction.date).toLocaleDateString()}</td>
                <td>{transaction.supplier}</td>
                <td>
                  {transaction.type.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </td>
                <td>{transaction.reference}</td>
                <td>${transaction.amount.toFixed(2)}</td>
                <td>{getStatusBadge(transaction.status)}</td>
                <td>
                  {transaction.paymentMethod.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </td>
                <td>
                  <Button 
                    variant="light" 
                    size="sm"
                    onClick={() => handleViewDetails(transaction)}
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {showDetails && <TransactionDetailsModal />}
      </AnimatePresence>
    </motion.div>
  );
};

export default TransactionHistory; 