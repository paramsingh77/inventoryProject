import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Badge, 
  Button, 
  Spinner, 
  Form,
  Modal
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileInvoice, 
  faFileDownload, 
  faLink, 
  faArrowLeft,
  faCheckCircle,
  faExclamationTriangle,
  faBuilding,
  faCalendar,
  faUser,
  faEnvelope,
  faHashtag
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoiceById, linkInvoiceToPO } from '../../services/emailService';

const InvoiceDetail = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [poNumber, setPoNumber] = useState('');
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [invoiceId]);

  const fetchInvoiceDetails = async () => {
    setLoading(true);
    try {
      const data = await getInvoiceById(invoiceId);
      setInvoice(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching invoice details:', err);
      setError('Failed to load invoice details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkToPO = async () => {
    if (!poNumber.trim()) return;
    
    setLinking(true);
    try {
      await linkInvoiceToPO(invoiceId, poNumber);
      fetchInvoiceDetails(); // Refresh data
      setShowLinkModal(false);
      alert('Invoice successfully linked to PO!');
    } catch (err) {
      console.error('Error linking invoice to PO:', err);
      alert('Failed to link invoice to PO. Please try again.');
    } finally {
      setLinking(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <Button 
                variant="light" 
                className="me-3 rounded-circle"
                onClick={() => navigate('/invoices')}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </Button>
              <h4 className="mb-0">
                <FontAwesomeIcon icon={faFileInvoice} className="me-2 text-primary" />
                Invoice Details
              </h4>
            </div>
            {invoice && (
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-success" 
                  className="d-flex align-items-center"
                  onClick={() => setShowLinkModal(true)}
                >
                  <FontAwesomeIcon icon={faLink} className="me-2" />
                  Link to PO
                </Button>
                <Button 
                  variant="outline-primary" 
                  className="d-flex align-items-center"
                >
                  <FontAwesomeIcon icon={faFileDownload} className="me-2" />
                  Download
                </Button>
              </div>
            )}
          </div>
        </Col>
      </Row>
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading invoice details...</p>
        </div>
      ) : error ? (
        <div className="text-center py-5">
          <p className="text-danger">{error}</p>
          <Button variant="primary" onClick={fetchInvoiceDetails}>
            Try Again
          </Button>
        </div>
      ) : invoice ? (
        <Row>
          <Col lg={8}>
            <Card className="shadow-sm border-0 rounded-3 mb-4">
              <Card.Body>
                <h5 className="border-bottom pb-3 mb-4">Invoice Information</h5>
                <Row className="mb-4">
                  <Col md={6}>
                    <div className="mb-3">
                      <div className="text-muted mb-1 small">
                        <FontAwesomeIcon icon={faHashtag} className="me-1" />
                        Invoice Number
                      </div>
                      <div className="fw-bold">{invoice.invoiceNumber || 'Not extracted'}</div>
                    </div>
                    <div className="mb-3">
                      <div className="text-muted mb-1 small">
                        <FontAwesomeIcon icon={faCalendar} className="me-1" />
                        Invoice Date
                      </div>
                      <div>{formatDate(invoice.invoiceDate)}</div>
                    </div>
                    <div>
                      <div className="text-muted mb-1 small">
                        <FontAwesomeIcon icon={faCalendar} className="me-1" />
                        Due Date
                      </div>
                      <div>{formatDate(invoice.dueDate)}</div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <div className="text-muted mb-1 small">
                        <FontAwesomeIcon icon={faBuilding} className="me-1" />
                        Vendor Name
                      </div>
                      <div className="fw-bold">{invoice.vendorName || 'Not extracted'}</div>
                    </div>
                    <div className="mb-3">
                      <div className="text-muted mb-1 small">
                        <FontAwesomeIcon icon={faEnvelope} className="me-1" />
                        Sender Email
                      </div>
                      <div>{invoice.senderEmail}</div>
                    </div>
                    <div>
                      <div className="text-muted mb-1 small">
                        <FontAwesomeIcon icon={faCalendar} className="me-1" />
                        Received On
                      </div>
                      <div>{formatDate(invoice.receivedDate)}</div>
                    </div>
                  </Col>
                </Row>
                <h5 className="border-bottom pb-3 mb-4">Amount Details</h5>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <div className="text-muted mb-1 small">Subtotal</div>
                      <div>{formatCurrency(invoice.subtotal)}</div>
                    </div>
                    <div className="mb-3">
                      <div className="text-muted mb-1 small">Tax</div>
                      <div>{formatCurrency(invoice.tax)}</div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <div className="text-muted mb-1 small">Shipping</div>
                      <div>{formatCurrency(invoice.shipping)}</div>
                    </div>
                    <div>
                      <div className="text-muted mb-1 small">Total Amount</div>
                      <div className="h4 text-primary">{formatCurrency(invoice.amount)}</div>
                    </div>
                  </Col>
                </Row>
                
                {invoice.poReference && (
                  <>
                    <h5 className="border-bottom pb-3 mb-4 mt-4">PO Reference</h5>
                    <div>
                      <Badge bg="success" className="px-3 py-2 fs-6">
                        <FontAwesomeIcon icon={faLink} className="me-2" />
                        Linked to PO-{invoice.poReference}
                      </Badge>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4}>
            <Card className="shadow-sm border-0 rounded-3 mb-4">
              <Card.Body>
                <h5 className="border-bottom pb-3 mb-4">Invoice Preview</h5>
                <div className="text-center py-5 bg-light rounded">
                  <FontAwesomeIcon icon={faFileInvoice} className="text-primary" style={{ fontSize: '4rem' }} />
                  <p className="mt-3">{invoice.filename}</p>
                  <Button variant="primary" className="mt-2">
                    <FontAwesomeIcon icon={faFileDownload} className="me-2" />
                    Download Invoice
                  </Button>
                </div>
              </Card.Body>
            </Card>
            
            <Card className="shadow-sm border-0 rounded-3">
              <Card.Body>
                <h5 className="border-bottom pb-3 mb-4">Processing Status</h5>
                <div className="mb-3">
                  <div className="text-muted mb-2 small">Status</div>
                  <div>
                    {invoice.status === 'linked' ? (
                      <Badge bg="success" className="px-3 py-2">
                        <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                        Linked to PO
                      </Badge>
                    ) : invoice.status === 'pending' ? (
                      <Badge bg="warning" className="px-3 py-2">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                        Pending
                      </Badge>
                    ) : (
                      <Badge bg="secondary" className="px-3 py-2">
                        {invoice.status}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="text-muted mb-2 small">Data Extraction</div>
                  <div className="progress">
                    <div 
                      className="progress-bar bg-success" 
                      role="progressbar" 
                      style={{ width: `${invoice.extractionConfidence || 0}%` }} 
                      aria-valuenow={invoice.extractionConfidence || 0} 
                      aria-valuemin="0" 
                      aria-valuemax="100"
                    >
                      {invoice.extractionConfidence || 0}%
                    </div>
                  </div>
                  <div className="mt-1 small text-muted">
                    Data extraction confidence
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : (
        <div className="text-center py-5">
          <p className="text-muted">Invoice not found.</p>
          <Button variant="primary" onClick={() => navigate('/invoices')}>
            Back to Invoices
          </Button>
        </div>
      )}
      
      {/* Link to PO Modal */}
      <Modal show={showLinkModal} onHide={() => !linking && setShowLinkModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Link Invoice to Purchase Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Purchase Order Number</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Enter PO Number" 
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                disabled={linking}
              />
              <Form.Text className="text-muted">
                Enter the Purchase Order number you want to link this invoice to.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLinkModal(false)} disabled={linking}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleLinkToPO} disabled={!poNumber.trim() || linking}>
            {linking ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Linking...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faLink} className="me-2" />
                Link to PO
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default InvoiceDetail; 