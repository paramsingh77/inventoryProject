import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileInvoice, faEye, faLink, faDownload } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const InvoiceCard = ({ invoice, onView, onDownload, onLink }) => {
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'processed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      default: return 'secondary';
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-3 h-100 shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <FontAwesomeIcon icon={faFileInvoice} className="me-2 text-primary" />
            <span className="text-truncate" style={{ maxWidth: '200px' }} title={invoice.filename}>
              {invoice.filename}
            </span>
          </div>
          <Badge bg={getStatusColor(invoice.status)}>
            {invoice.status || 'Unknown'}
          </Badge>
        </Card.Header>
        
        <Card.Body>
          <div className="mb-3">
            <small className="text-muted d-block">Invoice Number:</small>
            <strong>{invoice.invoice_number || 'Undetected'}</strong>
          </div>
          
          <div className="mb-3">
            <small className="text-muted d-block">Vendor:</small>
            <strong>{invoice.vendor || 'Unknown'}</strong>
          </div>
          
          <div className="mb-3">
            <small className="text-muted d-block">Amount:</small>
            <strong>{invoice.amount ? `$${Number(invoice.amount).toFixed(2)}` : 'N/A'}</strong>
          </div>
          
          <div className="mb-3">
            <small className="text-muted d-block">Extracted on:</small>
            <strong>{formatDate(invoice.extraction_date)}</strong>
          </div>
          
          {invoice.po_id && (
            <div className="mb-3">
              <small className="text-muted d-block">Linked to PO:</small>
              <strong>{invoice.po_number || invoice.po_id}</strong>
            </div>
          )}
        </Card.Body>
        
        <Card.Footer className="bg-white border-top-0">
          <div className="d-flex justify-content-between">
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={() => onView(invoice)}
            >
              <FontAwesomeIcon icon={faEye} className="me-1" /> View
            </Button>
            
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={() => onDownload(invoice)}
            >
              <FontAwesomeIcon icon={faDownload} className="me-1" /> Download
            </Button>
            
            {!invoice.po_id && (
              <Button 
                variant="outline-success" 
                size="sm" 
                onClick={() => onLink(invoice)}
              >
                <FontAwesomeIcon icon={faLink} className="me-1" /> Link to PO
              </Button>
            )}
          </div>
        </Card.Footer>
      </Card>
    </motion.div>
  );
};

export default InvoiceCard; 