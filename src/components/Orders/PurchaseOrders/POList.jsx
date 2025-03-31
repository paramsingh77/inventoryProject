import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEdit, faTrash, faSyncAlt, faExclamationTriangle, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { usePurchaseOrders } from '../../../context/PurchaseOrderContext';
import { motion, AnimatePresence } from 'framer-motion';

const POList = ({ filter = 'all' }) => {
  const { 
    getFilteredPurchaseOrders, 
    loading, 
    error, 
    retryCount,
    deletePurchaseOrder,
    purchaseOrders,
    refreshPurchaseOrders
  } = usePurchaseOrders();

  // Track newly added POs to animate them specially
  const [newlyAddedPOs, setNewlyAddedPOs] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sendingEmailForPO, setSendingEmailForPO] = useState(null);
  const filteredPOs = getFilteredPurchaseOrders(filter);

  // When purchaseOrders changes, detect newly added ones
  useEffect(() => {
    // This will run whenever purchaseOrders changes
    const currentIds = new Set(purchaseOrders.map(po => po.id));
    const newIds = [...currentIds].filter(id => !newlyAddedPOs.includes(id));
    
    if (newIds.length > 0) {
      // Add new IDs to the newlyAddedPOs list
      setNewlyAddedPOs(prev => [...prev, ...newIds]);
      
      // Remove the "new" status after 5 seconds
      setTimeout(() => {
        setNewlyAddedPOs(prev => prev.filter(id => !newIds.includes(id)));
      }, 5000);
    }
  }, [purchaseOrders]);

  const getStatusBadge = (status) => {
    const colors = {
      'pending': 'warning',
      'approved': 'success',
      'rejected': 'danger',
      'in_progress': 'info',
      'completed': 'primary',
      'cancelled': 'secondary'
    };
    return (
      <Badge bg={colors[status?.toLowerCase()] || 'secondary'}>
        {(status || '').replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshPurchaseOrders();
    } catch (err) {
      console.error('Error refreshing purchase orders:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSendVendorEmail = async (order) => {
    try {
      setSendingEmailForPO(order.id);
      
      // Check if vendor email exists
      if (!order.vendor_email && !order.vendor?.email) {
        throw new Error(`No vendor email found for PO ${order.poNumber}`);
      }
      
      // Send the email notification with PDF attachment
      const response = await fetch(`/api/purchase-orders/${order.id}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          poNumber: order.poNumber,
          vendorEmail: order.vendor_email || order.vendor?.email,
          includePdf: true  // Request PDF attachment
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }
      
      // Show success notification
      alert(`Email with PO PDF sent successfully to vendor for ${order.poNumber}`);
      console.log(`Email sent successfully for PO ${order.poNumber}`);
    } catch (error) {
      console.error('Error sending vendor email:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSendingEmailForPO(null);
    }
  };

  const renderHeader = () => (
    <div className="d-flex justify-content-between align-items-center mb-3">
      <h5 className="mb-0">{filter === 'all' ? 'All Purchase Orders' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Purchase Orders`}</h5>
      {/* <Button 
        variant="outline-primary" 
        size="sm" 
        onClick={handleRefresh} 
        disabled={isRefreshing || loading}
        className="d-flex align-items-center gap-1"
      >
        <FontAwesomeIcon 
          icon={faSyncAlt} 
          className={isRefreshing || loading ? 'fa-spin' : ''} 
        />
        <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
      </Button> */}
    </div>
  );

  if (loading && !filteredPOs.length) {
    return (
      <div>
        {renderHeader()}
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">
            Loading purchase orders
            {retryCount > 0 && ` (Attempt ${retryCount + 1})`}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {renderHeader()}
      
      {error && (
        <Alert variant="danger" className="d-flex align-items-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          <div>
            <strong>Error:</strong> {error}
            <div>
              <Button 
                variant="outline-danger" 
                size="sm" 
                className="mt-2" 
                onClick={handleRefresh}
              >
                Try Again
              </Button>
            </div>
          </div>
        </Alert>
      )}
      
      {(loading || isRefreshing) && filteredPOs.length > 0 && (
        <div className="position-relative mb-3">
          <div className="position-absolute top-0 end-0">
            <Spinner animation="border" variant="primary" size="sm" />
            <span className="ms-2 text-muted small">
              Updating...
            </span>
          </div>
        </div>
      )}

      <Table striped hover responsive>
        <thead>
          <tr>
            <th>PO Number</th>
            <th>Vendor</th>
            <th>Date</th>
            <th>Total</th>
            <th>Status</th>
            {/* <th>Site</th> */}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {filteredPOs.map((order) => {
              const isNew = newlyAddedPOs.includes(order.id);
              
              return (
                <motion.tr
                  key={order.id || order.poNumber}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    backgroundColor: isNew ? ['#fff', '#e6f7ff', '#fff'] : '#fff'
                  }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ 
                    duration: isNew ? 0.5 : 0.3,
                    backgroundColor: { duration: 2, repeat: 0 }
                  }}
                  className={isNew ? 'new-po-highlight' : ''}
                >
                  <td>{order.poNumber}</td>
                  <td>{order.vendor?.name || 'N/A'}</td>
                  <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    {(() => {
                      // Calculate total if it's zero or missing
                      let total = order.totalAmount || order.total || 0;
                      
                      // If total is still zero but we have items, calculate from items
                      if (total === 0 && order.items && order.items.length > 0) {
                        const subtotal = order.items.reduce((sum, item) => {
                          const quantity = parseFloat(item.quantity || 0);
                          const unitPrice = parseFloat(item.unit_price || item.price || 0);
                          return sum + (quantity * unitPrice);
                        }, 0);
                        
                        // Add default tax and shipping
                        const tax = subtotal * 0.1; // 10% tax
                        const shipping = 50; // $50 shipping
                        total = subtotal + tax + shipping;
                      }
                      
                      // Return formatted total
                      return `$${parseFloat(total).toFixed(2)}`;
                    })()}
                  </td>
                  <td>{getStatusBadge(order.status)}</td>
                  {/* <td>{order.site_name}</td> */}
                  <td>
                    <div className="d-flex gap-2">
                      <Button variant="light" size="sm" title="View Details">
                        <FontAwesomeIcon icon={faEye} />
                      </Button>
                      
                      {order.status === 'pending' && (
                        <Button variant="light" size="sm" title="Edit">
                          <FontAwesomeIcon icon={faEdit} />
                        </Button>
                      )}
                      
                      {order.status === 'approved' && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleSendVendorEmail(order)}
                          disabled={sendingEmailForPO === order.id}
                          title="Send email to vendor"
                        >
                          {sendingEmailForPO === order.id ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            <FontAwesomeIcon icon={faEnvelope} />
                          )}
                        </Button>
                      )}
                      
                      {order.status === 'pending' && (
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="text-danger" 
                          title="Delete"
                          onClick={() => deletePurchaseOrder(order.id || order.poNumber)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </AnimatePresence>
          {filteredPOs.length === 0 && !loading && !error && (
            <tr>
              <td colSpan="6" className="text-center py-4 text-muted">
                No purchase orders found
                {filter !== 'all' && (
                  <div className="mt-2">
                    <small>No {filter} purchase orders available</small>
                  </div>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </Table>
      
      {/* Add some CSS for the highlight effect */}
      <style jsx>{`
        .new-po-highlight {
          animation: pulse 2s;
        }
        
        @keyframes pulse {
          0% { background-color: #ffffff; }
          30% { background-color: #e6f7ff; }
          100% { background-color: #ffffff; }
        }
      `}</style>
    </motion.div>
  );
};

export default POList; 