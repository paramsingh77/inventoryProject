import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDownload, 
  faEye, 
  faPrint,
  faFileInvoice,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import PODocument from './PODocument';
import { purchaseOrders as samplePOs } from '../../../data/samplePOData';

const POInvoices = () => {
  const [invoices, setInvoices] = useState(samplePOs || []);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const handleNewInvoice = (event) => {
      if (event.detail?.type === 'NEW_PO') {
        const newPO = event.detail.po;
        setInvoices(prev => [newPO, ...prev]);
      }
    };

    window.addEventListener('purchaseOrder', handleNewInvoice);
    return () => window.removeEventListener('purchaseOrder', handleNewInvoice);
  }, []);

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-4">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h6 className="mb-0">
              <FontAwesomeIcon icon={faFileInvoice} className="me-2" />
              Purchase Order Invoices
            </h6>
          </div>

          <Table hover responsive>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Vendor</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.poNumber}>
                  <td>{invoice.poNumber}</td>
                  <td>{invoice.vendor?.name || 'N/A'}</td>
                  <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                  <td>${invoice.totalAmount?.toFixed(2) || '0.00'}</td>
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
                    </div>
                  </td>
                </tr>
              ))}
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
            Purchase Order Invoice
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
        </Modal.Footer>
      </Modal>
    </motion.div>
  );
};

export default POInvoices;