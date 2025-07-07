import React, { useState } from 'react';
import { Button, Modal, Form, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { sendPurchaseOrderEmail } from '../../services/emailService';

const SendPOButton = ({ purchaseOrder }) => {
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailData, setEmailData] = useState({
    to: purchaseOrder?.vendor?.email || '',
    subject: `Purchase Order #${purchaseOrder?.poNumber || 'New'} from Your Company`,
    message: `Dear ${purchaseOrder?.vendor?.name || 'Vendor'},

Please find attached our Purchase Order #${purchaseOrder?.poNumber || 'New'} for your reference.

Kindly review and confirm receipt of this order. Please send the invoice to invoices@yourcompany.com with the PO number referenced in the subject line.

Thank you,
Your Company
`
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmailData(prev => ({ ...prev, [name]: value }));
  };

  const handleSendPO = async (e) => {
    e.preventDefault();
    setSending(true);
    
    try {
      // Call the email service to send the PO
      await sendPurchaseOrderEmail(purchaseOrder.id, emailData);
      
      // Show success message
      alert('Purchase order sent successfully to vendor!');
      setShowModal(false);
    } catch (error) {
      console.error('Error sending PO:', error);
      alert('Failed to send purchase order. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button 
          variant="primary" 
          className="d-flex align-items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
          <span>Send PO to Vendor</span>
        </Button>
      </motion.div>

      <Modal show={showModal} onHide={() => !sending && setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <div className="fa-icon-wrapper bg-primary bg-opacity-10 me-2">
              <FontAwesomeIcon icon={faFilePdf} className="text-primary" />
            </div>
            <span>Send Purchase Order</span>
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSendPO}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>To</Form.Label>
              <Form.Control 
                type="email" 
                name="to" 
                value={emailData.to} 
                onChange={handleChange}
                required
                disabled={sending}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control 
                type="text" 
                name="subject" 
                value={emailData.subject} 
                onChange={handleChange}
                required
                disabled={sending}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Message</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={6} 
                name="message" 
                value={emailData.message} 
                onChange={handleChange}
                required
                disabled={sending}
              />
            </Form.Group>
            <div className="bg-light p-3 rounded mb-3">
              <div className="d-flex align-items-center mb-2">
                <FontAwesomeIcon icon={faFilePdf} className="text-danger me-2" />
                <strong>Attachments</strong>
              </div>
              <p className="text-muted mb-0">
                PurchaseOrder-{purchaseOrder?.poNumber || 'New'}.pdf (Generated automatically)
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={sending}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={sending}>
              {sending ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Sending...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                  Send PO
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default SendPOButton; 