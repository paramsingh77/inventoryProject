import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Badge, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faEdit, 
  faTrash, 
  faSyncAlt, 
  faExclamationTriangle, 
  faEnvelope 
} from '@fortawesome/free-solid-svg-icons';
import { usePurchaseOrders } from '../../../context/PurchaseOrderContext';
import { motion, AnimatePresence } from 'framer-motion';
import PODocument from './PODocument';
import { normalizePOFromAPI, preparePOForPdf } from '../../../utils/poUtils';
import api from '../../../utils/api';

// PropTypes for better development experience
const POList = ({ filter = 'all' }) => {
  // Context hooks
  const { 
    getFilteredPurchaseOrders, 
    loading, 
    error, 
    retryCount,
    deletePurchaseOrder,
    purchaseOrders,
    refreshPurchaseOrders
  } = usePurchaseOrders();

  // Local state
  const [newlyAddedPOs, setNewlyAddedPOs] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sendingEmailForPO, setSendingEmailForPO] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Memoized filtered orders
  const filteredOrders = useMemo(() => {        
    return purchaseOrders.filter(order => {
      if (filter === 'all') return true;
      if (filter === 'draft') return order.status === 'draft';
      return false;
    });
  }, [purchaseOrders, filter]);

  // Track newly added POs for animation
  useEffect(() => {
    const currentIds = new Set(purchaseOrders.map(po => po.id));
    const newIds = [...currentIds].filter(id => !newlyAddedPOs.includes(id));
    
    if (newIds.length > 0) {
      setNewlyAddedPOs(prev => [...prev, ...newIds]);
      
      // Remove "new" status after 5 seconds
      setTimeout(() => {
        setNewlyAddedPOs(prev => prev.filter(id => !newIds.includes(id)));
      }, 5000);
    }
  }, [purchaseOrders, newlyAddedPOs]);

  // Status badge component
  const getStatusBadge = useCallback((status) => {
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
  }, []);

  // Calculate total amount for an order
  const calculateOrderTotal = useCallback((order) => {
    // Use the utility functions for consistent calculation
    const normalized = normalizePOFromAPI(order);
    const enriched = preparePOForPdf(normalized);
    
    return `$${parseFloat(enriched.totalAmount).toFixed(2)}`;
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await refreshPurchaseOrders();
    } catch (err) {
      console.error('Error refreshing purchase orders:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshPurchaseOrders]);

  // Handle send vendor email
  const handleSendVendorEmail = useCallback(async (order) => {
    try {
      setSendingEmailForPO(order.id);
      
      if (!order.vendor_email && !order.vendor?.email) {
        throw new Error(`No vendor email found for PO ${order.poNumber}`);
      }
      
      const response = await fetch(`/purchase-orders/${order.id}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          poNumber: order.poNumber,
          vendorEmail: order.vendor_email || order.vendor?.email,
          includePdf: true
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }
      
      alert(`Email with PO PDF sent successfully to vendor for ${order.poNumber}`);
      console.log(`Email sent successfully for PO ${order.poNumber}`);
    } catch (error) {
      console.error('Error sending vendor email:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSendingEmailForPO(null);
    }
  }, []);

  // Handle view PO PDF
  const handleViewPOPdf = useCallback(async (order) => {
    try {
      setPdfLoading(true);
      console.log('🔍 POList - Original order data:', order);
      
      // 1. Fetch full vendor details using vendor ID or name
      const vendorId = order.vendor?.id || order.supplier_id || order.supplier?.id;
      const vendorName = order.vendor?.name || order.vendor_name || order.supplier?.name;
      
      let fullVendor = {};
      let enrichedOrder = { ...order };
      
      if (vendorId || vendorName) {
        console.log('🔍 POList - Fetching full vendor details...', { vendorId, vendorName });
        
        try {
          let response;
          let vendorData = null;
          
          if (vendorId) {
            // Try to fetch by ID first
            try {
              response = await api.get(`/suppliers/${vendorId}`);
              if (response?.data) {
                vendorData = response.data.data || response.data;
              }
            } catch (idError) {
              console.warn('🔍 POList - Failed to fetch by ID, trying by name:', idError);
            }
          }
          
          // If no vendor data found by ID, try by name
          if (!vendorData && vendorName) {
            try {
              response = await api.get(`/suppliers/by-name/${encodeURIComponent(vendorName)}`);
              if (response?.data) {
                vendorData = response.data.data || response.data;
              }
            } catch (nameError) {
              console.warn('🔍 POList - Failed to fetch by name, trying search:', nameError);
              
              // Fallback: search through all suppliers
              try {
                const allSuppliersResponse = await api.get('/suppliers');
                if (allSuppliersResponse?.data) {
                  const suppliers = allSuppliersResponse.data;
                  const matchingSupplier = suppliers.find(supplier => 
                    supplier.name && supplier.name.toLowerCase().includes(vendorName.toLowerCase())
                  );
                  if (matchingSupplier) {
                    vendorData = matchingSupplier;
                  }
                }
              } catch (searchError) {
                console.warn('🔍 POList - Failed to search through all suppliers:', searchError);
              }
            }
          }
          
          if (vendorData) {
            console.log('🔍 POList - Fetched vendor data:', vendorData);
            
            fullVendor = {
              id: vendorData.id,
              name: vendorData.name,
              companyName: vendorData.name,
              contactPerson: vendorData.contact_person,
              email: vendorData.email,
              phone: vendorData.phone,
              address: {
                street: vendorData.address || '123 Vendor Street',
                city: 'City',
                state: 'State',
                zip: '12345',
                country: 'USA',
                full: vendorData.address || '123 Vendor Street, City, State 12345'
              }
            };
            
            // 2. Merge into PO
            enrichedOrder = {
              ...enrichedOrder,
              vendor: {
                ...enrichedOrder.vendor,
                ...fullVendor
              },
              // Update flat fields for backward compatibility
              vendor_name: vendorData.name || enrichedOrder.vendor_name,
              vendor_email: vendorData.email || enrichedOrder.vendor_email,
              contact_person: vendorData.contact_person || enrichedOrder.contact_person,
              phone_number: vendorData.phone || enrichedOrder.phone_number,
              vendor_address: vendorData.address || enrichedOrder.vendor_address,
              // Update supplier object
              supplier: {
                id: vendorData.id,
                name: vendorData.name,
                email: vendorData.email,
                phone: vendorData.phone,
                address: vendorData.address,
                contact_person: vendorData.contact_person
              }
            };
            
            console.log('🔍 POList - Order enriched with vendor data:', enrichedOrder);
          }
        } catch (vendorError) {
          console.warn('🔍 POList - Failed to fetch vendor details, using existing:', vendorError);
          fullVendor = order.vendor || {};
        }
      } else {
        console.log('🔍 POList - No vendor ID or name available, using existing data');
      }
      
      // 3. Normalize & prepare for PDF
      const normalized = normalizePOFromAPI(enrichedOrder);
      const finalPO = preparePOForPdf(normalized);
      
      console.log('🔍 POList - Normalized PO data:', normalized);
      console.log('🔍 POList - Final PO data for PDF:', finalPO);
      
      // Additional debugging for items with product links
      if (finalPO.items && finalPO.items.length > 0) {
        console.log('🔍 POList - Items with product links in final PO:', 
          finalPO.items.map(item => ({
            name: item.name,
            productLink: item.productLink,
            hasProductLink: !!item.productLink,
            productLinkType: typeof item.productLink
          }))
        );
      }
      
      setSelectedPO(finalPO);
      setShowPdfModal(true);
    } catch (error) {
      console.error('🔍 POList - Error in handleViewPOPdf:', error);
      // Fallback to original data if processing fails
      const normalized = normalizePOFromAPI(order);
      const enriched = preparePOForPdf(normalized);
      setSelectedPO(enriched);
      setShowPdfModal(true);
    } finally {
      setPdfLoading(false);
    }
  }, []);

  // Handle delete PO
  const handleDeletePO = useCallback((orderId) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      deletePurchaseOrder(orderId);
    }
  }, [deletePurchaseOrder]);

  // Handle close PDF modal
  const handleClosePdfModal = useCallback(() => {
    setShowPdfModal(false);
    setSelectedPO(null);
    setPdfLoading(false);
  }, []);

  // FIXED: Show delete and PDF icons for 'draft' or 'pending' POs
  const showDeleteIcon = (po) => po.status === 'draft' || po.status === 'pending';
  const showPdfIcon = (po) => !!po.id;

  // Header component
  const renderHeader = () => (
    <div className="d-flex justify-content-between align-items-center mb-3">
      <h5 className="mb-0">
        {filter === 'all' ? 'All Purchase Orders' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Purchase Orders`}
      </h5>
      <Button 
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
        <span>{isRefreshing || loading ? 'Refreshing...' : 'Refresh'}</span>
      </Button>
    </div>
  );

  // Error alert component
  const renderErrorAlert = () => (
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
  );

  // Loading spinner component
  const renderLoadingSpinner = () => (
    <div className="text-center py-5">
      <Spinner animation="border" variant="primary" />
      <p className="mt-2 text-muted">
        Loading purchase orders
        {retryCount > 0 && ` (Attempt ${retryCount + 1})`}...
      </p>
    </div>
  );

  // Table row component
  const renderTableRow = (order) => {
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
        <td>
          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
        </td>
        <td>{calculateOrderTotal(order)}</td>
        <td>
          <div className="d-flex gap-2">
            {showPdfIcon(order) && (
              <Button 
                variant="light" 
                size="sm" 
                title="View Details" 
                onClick={() => handleViewPOPdf(order)}
                disabled={pdfLoading}
              >
                {pdfLoading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <FontAwesomeIcon icon={faEye} />
                )}
              </Button>
            )}
            
            {showDeleteIcon(order) && (
              <Button 
                variant="light" 
                size="sm" 
                className="text-danger" 
                title="Delete"
                onClick={() => handleDeletePO(order.id || order.poNumber)}
              >
                <FontAwesomeIcon icon={faTrash} />
              </Button>
            )}
          </div>
        </td>
      </motion.tr>
    );
  };

  // Empty state component
  const renderEmptyState = () => (
    <tr>
      <td colSpan="5" className="text-center py-4 text-muted">
        No purchase orders found
        {filter !== 'all' && (
          <div className="mt-2">
            <small>No {filter} purchase orders available</small>
          </div>
        )}
      </td>
    </tr>
  );

  // Loading state
  if (loading && !filteredOrders.length) {
    return (
      <div>
        {renderHeader()}
        {renderLoadingSpinner()}
      </div>
    );
  }

  // Error state for invalid data
  if (!Array.isArray(filteredOrders)) {
    return (
      <Alert variant="danger">
        <strong>Error:</strong> Purchase orders data is not an array.<br/>
        Please contact support or try refreshing the page.
      </Alert>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {renderHeader()}
      
      {error && renderErrorAlert()}
      
      {(loading || isRefreshing) && filteredOrders.length > 0 && (
        <div className="position-relative mb-3">
          <div className="position-absolute top-0 end-0">
            <Spinner animation="border" variant="primary" size="sm" />
            <span className="ms-2 text-muted small">Updating...</span>
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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {filteredOrders.map(renderTableRow)}
            {filteredOrders.length === 0 && !loading && !error && renderEmptyState()}
          </AnimatePresence>
        </tbody>
      </Table>
      
      {/* PDF Preview Modal */}
      <Modal 
        show={showPdfModal} 
        onHide={handleClosePdfModal} 
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Purchase Order PDF Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {pdfLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Loading purchase order details...</p>
            </div>
          ) : selectedPO ? (
            <PODocument poData={selectedPO} />
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">No purchase order data available</p>
            </div>
          )}
        </Modal.Body>
      </Modal>
      
      {/* Styles for new PO highlight effect */}
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