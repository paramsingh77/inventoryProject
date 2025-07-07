import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileInvoice, 
  faFileDownload, 
  faLink, 
  faSearch, 
  faSync
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { getReceivedInvoices } from '../../services/emailService';

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await getReceivedInvoices();
      setInvoices(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { color: 'warning', text: 'Pending' },
      'linked': { color: 'success', text: 'Linked to PO' },
      'processed': { color: 'info', text: 'Processed' },
      'error': { color: 'danger', text: 'Error' }
    };
    
    const { color, text } = statusMap[status] || { color: 'secondary', text: status };
    
    return (
      <Badge bg={color} className="px-3 py-2 rounded-pill">
        {text}
      </Badge>
    );
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              <FontAwesomeIcon icon={faFileInvoice} className="me-2 text-primary" />
              Received Invoices
            </h4>
            <Button 
              variant="outline-primary" 
              className="d-flex align-items-center"
              onClick={fetchInvoices}
            >
              <FontAwesomeIcon icon={faSync} className="me-2" />
              Refresh
            </Button>
          </div>
        </Col>
      </Row>
      
      <Card className="shadow-sm border-0 rounded-3">
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Loading invoices...</p>
            </div>
          ) : error ? (
            <div className="text-center py-5">
              <p className="text-danger">{error}</p>
              <Button variant="primary" onClick={fetchInvoices}>
                Try Again
              </Button>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No invoices found. They will appear here when vendors reply to your POs.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Vendor</th>
                    <th>Received Date</th>
                    <th>PO Reference</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <motion.tr 
                      key={invoice.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ backgroundColor: '#f8f9fa' }}
                    >
                      <td>
                        <div className="fw-medium">{invoice.invoiceNumber || 'Unknown'}</div>
                        <small className="text-muted">{invoice.filename}</small>
                      </td>
                      <td>{invoice.vendorName || invoice.senderEmail}</td>
                      <td>{formatDate(invoice.receivedDate)}</td>
                      <td>
                        {invoice.poReference ? (
                          <Badge bg="info" className="px-3 py-2 rounded-pill">
                            PO-{invoice.poReference}
                          </Badge>
                        ) : (
                          <Badge bg="light" text="dark" className="px-3 py-2 rounded-pill">
                            No Reference
                          </Badge>
                        )}
                      </td>
                      <td>{getStatusBadge(invoice.status)}</td>
                      <td>
                        {invoice.amount ? (
                          <div className="fw-bold">
                            ${parseFloat(invoice.amount).toFixed(2)}
                          </div>
                        ) : (
                          <span className="text-muted">Not extracted</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button size="sm" variant="outline-primary" title="View Invoice">
                            <FontAwesomeIcon icon={faSearch} />
                          </Button>
                          <Button size="sm" variant="outline-success" title="Link to PO">
                            <FontAwesomeIcon icon={faLink} />
                          </Button>
                          <Button size="sm" variant="outline-secondary" title="Download">
                            <FontAwesomeIcon icon={faFileDownload} />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default InvoiceList; 