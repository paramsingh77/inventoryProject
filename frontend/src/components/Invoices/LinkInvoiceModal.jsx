import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faLink } from '@fortawesome/free-solid-svg-icons';

const API_URL = process.env.REACT_APP_API_URL;

const LinkInvoiceModal = ({ show, invoice, onClose, onSuccess }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    if (show && searchTerm.length >= 3) {
      searchOrders();
    }
  }, [searchTerm, show]);
  
  const searchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/purchase-orders/search?term=${searchTerm}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Failed to search orders:', error);
      setError(`Failed to search orders: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLinkInvoice = async () => {
    try {
      if (!selectedOrder) {
        setError('Please select a purchase order');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/api/invoices/${invoice.id}/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ poId: selectedOrder.id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to link invoice');
      }
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to link invoice:', error);
      setError(`Failed to link invoice: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Link Invoice to Purchase Order</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {success ? (
          <Alert variant="success">
            Invoice successfully linked to purchase order!
          </Alert>
        ) : (
          <>
            <p>Link invoice <strong>{invoice?.filename}</strong> to a purchase order:</p>
            
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form.Group className="mb-3">
              <Form.Label>Search for Purchase Order</Form.Label>
              <div className="input-group">
                <Form.Control
                  type="search"
                  placeholder="Search by PO number or vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={loading}
                />
                <Button 
                  variant="outline-secondary"
                  onClick={searchOrders}
                  disabled={loading || searchTerm.length < 3}
                >
                  <FontAwesomeIcon icon={faSearch} />
                </Button>
              </div>
              <Form.Text className="text-muted">
                Enter at least 3 characters to search
              </Form.Text>
            </Form.Group>
            
            {loading ? (
              <div className="text-center py-3">
                <Spinner animation="border" size="sm" />
                <span className="ms-2">Searching...</span>
              </div>
            ) : orders.length === 0 ? (
              searchTerm.length >= 3 && (
                <div className="text-center py-3 text-muted">
                  No purchase orders found matching "{searchTerm}"
                </div>
              )
            ) : (
              <Form.Group>
                <Form.Label>Select Purchase Order</Form.Label>
                {orders.map(order => (
                  <div 
                    key={order.id} 
                    className={`border rounded p-2 mb-2 cursor-pointer ${selectedOrder?.id === order.id ? 'border-primary bg-light' : ''}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="d-flex justify-content-between">
                      <strong>{order.order_number}</strong>
                      <span>${order.total_amount}</span>
                    </div>
                    <div className="small text-muted">
                      Vendor: {order.vendor_name || order.supplier_name || 'Unknown'}
                    </div>
                    <div className="small text-muted">
                      Date: {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </Form.Group>
            )}
          </>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {success ? 'Close' : 'Cancel'}
        </Button>
        
        {!success && (
          <Button 
            variant="primary" 
            onClick={handleLinkInvoice} 
            disabled={loading || !selectedOrder}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Linking...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faLink} className="me-2" />
                Link Invoice
              </>
            )}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default LinkInvoiceModal; 