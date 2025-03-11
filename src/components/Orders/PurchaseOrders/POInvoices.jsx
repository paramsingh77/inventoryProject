import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Modal, Badge, Tabs, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDownload, 
  faEye, 
  faPrint,
  faFileInvoice,
  faTimes,
  faCheckCircle,
  faTimesCircle,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import PODocument from './PODocument';
import { purchaseOrders as samplePOs } from '../../../data/samplePOData';
import { useNotification } from '../../../context/NotificationContext';
import socket from '../../../utils/socket';

const POInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('received');
  const { addNotification } = useNotification();

  useEffect(() => {
    // Initialize with sample data
    setInvoices(samplePOs || []);
    
    // Listen for new invoices
    const handleNewInvoice = (event) => {
      if (event.detail?.type === 'NEW_INVOICE') {
        const newInvoice = {
          ...event.detail.invoice,
          status: 'Received',
          poReference: event.detail.poReference,
          receivedDate: new Date().toISOString()
        };
        
        setInvoices(prev => {
          // Check if we already have this invoice
          const exists = prev.some(inv => 
            inv.invoiceNumber === newInvoice.invoiceNumber || 
            (inv.poReference === newInvoice.poReference && newInvoice.poReference)
          );
          
          if (!exists) {
            addNotification('success', 'New invoice received');
            return [newInvoice, ...prev];
          }
          return prev;
        });
      }
    };

    // Listen for invoice status changes
    const handleInvoiceStatusChange = (event) => {
      if (
        event.detail?.type === 'INVOICE_APPROVED' || 
        event.detail?.type === 'INVOICE_REJECTED'
      ) {
        const { invoice } = event.detail;
        
        setInvoices(prev => prev.map(inv => {
          if (inv.invoiceNumber === invoice.invoiceNumber) {
            return { ...inv, status: invoice.status };
          }
          return inv;
        }));
        
        const action = event.detail.type === 'INVOICE_APPROVED' ? 'approved' : 'rejected';
        addNotification('success', `Invoice ${invoice.invoiceNumber} has been ${action}`);
      }
    };

    // Add Socket.IO event listener for new invoices
    socket.on('newInvoice', (data) => {
      console.log('Socket.IO newInvoice event received in POInvoices:', data);
      if (data.type === 'NEW_INVOICE') {
        const newInvoice = {
          ...data.invoice,
          status: 'Received',
          poReference: data.poReference,
          receivedDate: new Date().toISOString()
        };
        
        setInvoices(prev => {
          // Check if we already have this invoice
          const exists = prev.some(inv => 
            inv.invoiceNumber === newInvoice.invoiceNumber || 
            (inv.poReference === newInvoice.poReference && newInvoice.poReference)
          );
          
          if (!exists) {
            addNotification('success', 'New invoice received via Socket.IO');
            return [newInvoice, ...prev];
          }
          return prev;
        });
      }
    });

    window.addEventListener('invoice', handleNewInvoice);
    window.addEventListener('invoice', handleInvoiceStatusChange);
    
    return () => {
      window.removeEventListener('invoice', handleNewInvoice);
      window.removeEventListener('invoice', handleInvoiceStatusChange);
      socket.off('newInvoice');
    };
  }, [addNotification]);

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowModal(true);
  };

  const handleDownload = (invoice) => {
    try {
      const pdfWindow = window.open('', '_blank');
      pdfWindow.document.write(`
        <html>
          <body>
            ${document.querySelector('.po-invoice-modal .modal-body').innerHTML}
          </body>
        </html>
      `);
      pdfWindow.document.close();
      pdfWindow.print();
      pdfWindow.close();
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  const handlePrint = (invoice) => {
    try {
      const printContent = document.querySelector('.po-invoice-modal .modal-body');
      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error('Error printing invoice:', error);
    }
  };

  // Add a function to dispatch an event to update the PO status
  const updatePOStatus = (poReference, status) => {
    // Dispatch event to update PO status
    const poUpdateEvent = new CustomEvent('invoice', {
      detail: {
        type: 'UPDATE_PO_STATUS',
        poReference,
        status
      }
    });
    window.dispatchEvent(poUpdateEvent);
  };

  const handleApproveInvoice = (invoice) => {
    // Update invoice status
    setInvoices(prev => prev.map(inv => {
      if (inv.invoiceNumber === invoice.invoiceNumber) {
        return { ...inv, status: 'Approved' };
      }
      return inv;
    }));
    
    // Update PO status
    if (invoice.poReference) {
      updatePOStatus(invoice.poReference, 'Approved');
    }
    
    // Dispatch event for invoice status change
    const invoiceEvent = new CustomEvent('invoice', {
      detail: {
        type: 'INVOICE_APPROVED',
        poReference: invoice.poReference,
        invoice: { ...invoice, status: 'Approved' }
      }
    });
    window.dispatchEvent(invoiceEvent);
    
    addNotification('success', `Invoice ${invoice.invoiceNumber} has been approved`);
  };

  const handleRejectInvoice = (invoice) => {
    // Update invoice status
    setInvoices(prev => prev.map(inv => {
      if (inv.invoiceNumber === invoice.invoiceNumber) {
        return { ...inv, status: 'Rejected' };
      }
      return inv;
    }));
    
    // Update PO status
    if (invoice.poReference) {
      updatePOStatus(invoice.poReference, 'Rejected');
    }
    
    // Dispatch event for invoice status change
    const invoiceEvent = new CustomEvent('invoice', {
      detail: {
        type: 'INVOICE_REJECTED',
        poReference: invoice.poReference,
        invoice: { ...invoice, status: 'Rejected' }
      }
    });
    window.dispatchEvent(invoiceEvent);
    
    addNotification('warning', `Invoice ${invoice.invoiceNumber} has been rejected`);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Received': { bg: 'info', icon: faClock },
      'Approved': { bg: 'success', icon: faCheckCircle },
      'Rejected': { bg: 'danger', icon: faTimesCircle },
      'Paid': { bg: 'primary', icon: faCheckCircle }
    };
    
    const config = statusConfig[status] || statusConfig['Received'];
    
    return (
      <div className="d-flex align-items-center">
        <FontAwesomeIcon icon={config.icon} className={`text-${config.bg} me-2`} />
        <Badge bg={config.bg}>{status}</Badge>
      </div>
    );
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (activeTab === 'all') return true;
    return invoice.status?.toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 pt-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">
              <FontAwesomeIcon icon={faFileInvoice} className="me-2 text-primary" />
              Invoices
            </h5>
          </div>
          
          <Tabs
            activeKey={activeTab}
            onSelect={setActiveTab}
            className="mb-3"
          >
            <Tab eventKey="all" title="All Invoices" />
            <Tab eventKey="received" title="Received" />
            <Tab eventKey="approved" title="Approved" />
            <Tab eventKey="rejected" title="Rejected" />
            <Tab eventKey="paid" title="Paid" />
          </Tabs>
        </Card.Header>
        
        <Card.Body className="p-0">
          <Table hover responsive className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>Invoice #</th>
                <th>PO Reference</th>
                <th>Vendor</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.invoiceNumber || invoice.poNumber}>
                  <td>{invoice.invoiceNumber || 'N/A'}</td>
                  <td>{invoice.poReference || invoice.poNumber}</td>
                  <td>{invoice.vendor?.name || 'N/A'}</td>
                  <td>{new Date(invoice.receivedDate || invoice.createdAt).toLocaleDateString()}</td>
                  <td>${invoice.totalAmount?.toFixed(2) || '0.00'}</td>
                  <td>
                    {getStatusBadge(invoice.status || 'Received')}
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        variant="light"
                        size="sm"
                        title="View Invoice"
                        onClick={() => handleViewInvoice(invoice)}
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        title="Download Invoice"
                        onClick={() => handleDownload(invoice)}
                      >
                        <FontAwesomeIcon icon={faDownload} />
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        title="Print Invoice"
                        onClick={() => handlePrint(invoice)}
                      >
                        <FontAwesomeIcon icon={faPrint} />
                      </Button>
                      
                      {(invoice.status === 'Received' || !invoice.status) && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            title="Approve Invoice"
                            onClick={() => handleApproveInvoice(invoice)}
                          >
                            <FontAwesomeIcon icon={faCheckCircle} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            title="Reject Invoice"
                            onClick={() => handleRejectInvoice(invoice)}
                          >
                            <FontAwesomeIcon icon={faTimesCircle} />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    No invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        size="xl"
        className="po-invoice-modal"
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title>
            <FontAwesomeIcon icon={faFileInvoice} className="me-2" />
            {selectedInvoice?.invoiceNumber 
              ? `Invoice #${selectedInvoice.invoiceNumber}` 
              : 'Purchase Order Invoice'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedInvoice && (
            <div className="bg-white rounded shadow-sm">
              <PODocument poData={selectedInvoice} />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowModal(false)}>
            <FontAwesomeIcon icon={faTimes} className="me-2" />
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={() => handleDownload(selectedInvoice)}
          >
            <FontAwesomeIcon icon={faDownload} className="me-2" />
            Download
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => handlePrint(selectedInvoice)}
          >
            <FontAwesomeIcon icon={faPrint} className="me-2" />
            Print
          </Button>
          
          {selectedInvoice && (selectedInvoice.status === 'Received' || !selectedInvoice.status) && (
            <>
              <Button 
                variant="success" 
                onClick={() => {
                  handleApproveInvoice(selectedInvoice);
                  setShowModal(false);
                }}
              >
                <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                Approve
              </Button>
              <Button 
                variant="danger" 
                onClick={() => {
                  handleRejectInvoice(selectedInvoice);
                  setShowModal(false);
                }}
              >
                <FontAwesomeIcon icon={faTimesCircle} className="me-2" />
                Reject
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </motion.div>
  );
};

export default POInvoices;