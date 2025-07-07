import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faTimes, faExclamationTriangle, faEye } from '@fortawesome/free-solid-svg-icons';
import { generatePOPdfForViewing } from '../../../utils/poPdfGenerator';

/**
 * POPdfViewer - Modal component for viewing and downloading PO PDFs
 * @param {Object} props - Component props
 * @param {boolean} props.show - Whether the modal is visible
 * @param {Function} props.onHide - Function to call when modal is closed
 * @param {Object} props.poData - Purchase order data to display
 */
const POPdfViewer = ({ show, onHide, poData }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  /**
   * Normalizes PO data to ensure all required fields are present
   * @param {Object} order - Raw PO data
   * @returns {Object} Normalized PO data
   */
  const normalizePOData = (order) => {
    if (!order) return null;

    const vendor = order.vendor || {};
    const address = vendor.address || {};
    
    // Helper function to parse address string into components
    const parseAddress = (addressString) => {
      if (!addressString || typeof addressString !== 'string') {
        return { street: 'Not Provided', city: 'Not Provided', state: 'Not Provided', zip: 'Not Provided' };
      }
      
      // Try to parse comma-separated address
      const parts = addressString.split(',').map(part => part.trim());
      
      if (parts.length >= 4) {
        // Format: street, city, state zip
        const zipMatch = parts[3].match(/(\d{5}(-\d{4})?)/);
        return {
          street: parts[0] || 'Not Provided',
          city: parts[1] || 'Not Provided',
          state: parts[2] || 'Not Provided',
          zip: zipMatch ? zipMatch[1] : parts[3] || 'Not Provided',
          full: addressString
        };
      } else if (parts.length >= 3) {
        // Format: street, city state zip
        const lastPart = parts[2];
        const stateZipMatch = lastPart.match(/([A-Z]{2})\s+(\d{5}(-\d{4})?)/);
        if (stateZipMatch) {
          return {
            street: parts[0] || 'Not Provided',
            city: parts[1] || 'Not Provided',
            state: stateZipMatch[1] || 'Not Provided',
            zip: stateZipMatch[2] || 'Not Provided',
            full: addressString
          };
        }
      }
      
      // Fallback: treat as street address
      return {
        street: addressString,
        city: 'Not Provided',
        state: 'Not Provided',
        zip: 'Not Provided',
        full: addressString
      };
    };
    
    return {
      ...order,
      // PO Number - try multiple possible sources
      poNumber: order.poNumber || order.order_number || order.id || order.po_number || 'PO-' + Date.now(),
      
      // Vendor information - comprehensive mapping with address parsing
      vendor: {
        name: vendor.name || order.vendorName || order.vendor_name || order.supplier || order.supplier_name || 'Not Provided',
        companyName: vendor.companyName || vendor.company_name || vendor.company || order.vendorCompany || vendor.name || order.vendor_name || 'Not Provided',
        contactPerson: vendor.contactPerson || vendor.contact_person || vendor.contact || vendor.name || order.vendor_name || 'Not Provided',
        email: vendor.email || order.vendor_email || order.vendorEmail || order.supplier_email || 'Not Provided',
        phone: vendor.phone || vendor.phoneNumber || vendor.phone_number || order.vendor_phone || order.supplier_phone || 'Not Provided',
        address: {
          street: address.street || address.address || address.line1 || address.line_1 || parseAddress(order.supplier_address || vendor.address).street,
          city: address.city || parseAddress(order.supplier_address || vendor.address).city,
          state: address.state || address.province || parseAddress(order.supplier_address || vendor.address).state,
          zip: address.zip || address.zipCode || address.postal_code || address.postalCode || parseAddress(order.supplier_address || vendor.address).zip,
          full: address.full || address.complete || parseAddress(order.supplier_address || vendor.address).full
        }
      },
      
      // Dates - handle various date formats
      createdAt: order.createdAt || order.created_at || order.date || order.orderDate || new Date(),
      deliveryDate: order.deliveryDate || order.expected_delivery || order.delivery_date || order.expectedDelivery || 'Not Specified',
      
      // Financial data
      subtotal: order.subtotal || order.sub_total || 0,
      tax: order.tax || order.taxAmount || 0,
      taxRate: order.taxRate || order.tax_rate || 10,
      shippingFees: order.shippingFees || order.shipping_fees || order.shipping || 0,
      totalAmount: order.totalAmount || order.total || order.total_amount || 0,
      
      // Items - ensure array structure
      items: Array.isArray(order.items) ? order.items.map(item => ({
        ...item,
        name: item.name || item.product_name || item.productName || item.description || 'Unnamed Item',
        quantity: item.quantity || item.qty || 0,
        unitPrice: item.unitPrice || item.unit_price || item.price || item.unitPrice || 0,
        description: item.description || item.desc || item.name || 'No description'
      })) : [],
      
      // Additional details
      paymentTerms: order.paymentTerms || order.payment_terms || 'Net 30',
      shippingTerms: order.shippingTerms || order.shipping_terms || 'Standard Delivery',
      shippingMethod: order.shippingMethod || order.shipping_method || 'Ground',
      termsAndConditions: order.termsAndConditions || order.terms_and_conditions || order.terms || '',
      requestedBy: order.requestedBy || order.requested_by || order.requester || 'IT Manager',
      
      // Company details
      companyName: order.companyName || 'AAM Inventory',
      companyAddress: order.companyAddress || '700 17th Street, Modesto, CA 95354',
      department: order.department || 'IT Department'
    };
  };

  /**
   * Generates PDF and creates a blob URL for viewing
   */
  const generatePdfForViewing = async () => {
    if (!poData) return;

    setLoading(true);
    setError(null);

    try {
      const normalizedData = normalizePOData(poData);
      if (!normalizedData) {
        throw new Error('Invalid PO data provided');
      }

      console.log('Generating PDF for PO:', normalizedData.poNumber);
      
      // Generate high-quality PDF blob
      const pdfBlob = await generatePOPdfForViewing(normalizedData, true);
      
      // Create blob URL for iframe viewing
      const blobUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(blobUrl);
      
      console.log('PDF generated successfully for viewing');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError(err.message || 'Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Downloads the generated PDF
   */
  const handleDownload = async () => {
    if (!poData) return;

    setDownloadLoading(true);
    setError(null);

    try {
      const normalizedData = normalizePOData(poData);
      if (!normalizedData) {
        throw new Error('Invalid PO data provided');
      }

      console.log('Generating PDF for download:', normalizedData.poNumber);
      
      // Generate and download PDF
      await generatePOPdfForViewing(normalizedData, false);
      
      console.log('PDF downloaded successfully');
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError(err.message || 'Failed to download PDF. Please try again.');
    } finally {
      setDownloadLoading(false);
    }
  };

  /**
   * Handles modal close and cleanup
   */
  const handleClose = () => {
    // Clean up blob URL to prevent memory leaks
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setError(null);
    setLoading(false);
    setDownloadLoading(false);
    onHide();
  };

  // Generate PDF when modal opens and poData is available
  useEffect(() => {
    if (show && poData && !pdfUrl && !loading) {
      generatePdfForViewing();
    }
  }, [show, poData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <Modal 
      show={show} 
      onHide={handleClose}
      size="lg"
      centered
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faEye} className="me-2" />
          View Purchase Order PDF
          {poData && (
            <span className="text-muted ms-2">- {poData.poNumber || poData.order_number || poData.id}</span>
          )}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-0">
        {error && (
          <Alert variant="danger" className="m-3">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            <strong>Error:</strong> {error}
          </Alert>
        )}
        
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Generating PDF...</p>
          </div>
        )}
        
        {!loading && !error && pdfUrl && (
          <div style={{ height: '70vh', position: 'relative' }}>
            <iframe
              src={pdfUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '4px'
              }}
              title="Purchase Order PDF"
            />
          </div>
        )}
        
        {!loading && !error && !pdfUrl && (
          <div className="text-center py-5">
            <p className="text-muted">No PDF available to display</p>
          </div>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button 
          variant="outline-secondary" 
          onClick={handleClose}
        >
          <FontAwesomeIcon icon={faTimes} className="me-2" />
          Close
        </Button>
        
        <Button 
          variant="primary" 
          onClick={handleDownload}
          disabled={downloadLoading || !poData}
        >
          {downloadLoading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Downloading...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faDownload} className="me-2" />
              Download PDF
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default POPdfViewer; 