import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Table, Badge, Button, Alert, Spinner, Modal, Row, Col, Form, Tabs, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faEye, faFilePdf, faSpinner, faSearchPlus, faSearchMinus, faUndoAlt, faRedoAlt, faDownload, faExclamationTriangle, faFileInvoice } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import api from '../../../utils/api';
import socket from '../../../utils/socket';
import { generatePOPdf } from '../../../utils/pdfGenerator';
import PODocument from './PODocument';
import { useNotification } from '../../../context/NotificationContext';
import { Button as AntButton, Card, Space, Divider, Skeleton, Typography } from 'antd';
import { 
  FilePdfOutlined, 
  DownloadOutlined, 
  ZoomInOutlined, 
  ZoomOutOutlined,
  RotateLeftOutlined,
  RotateRightOutlined 
} from '@ant-design/icons';
import './POStyles.css';
import './fonts.css';
import PDFStorage from '../../../utils/pdfStorage.js';
import PurchaseOrderService from '../../../services/PurchaseOrderService';
import EmailService from './EmailService';

// Add these constant definitions at the top of the file
const AUTO_REFRESH_ENABLED = true; // Enable auto-refresh by default
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds between refreshes
const REFRESH_DEBOUNCE_TIME = 10000; // 10 seconds minimum between manual refreshes

// Simple email status display component
const EmailStatus = ({ status, message }) => {
  const statusColors = {
    'sending': 'text-primary',
    'success': 'text-success',
    'error': 'text-danger',
    'warning': 'text-warning'
  };
  
  if (!status) return null;
  
  return (
    <div className={`email-status-container mt-2 mb-2 ${statusColors[status] || ''}`}>
      <div className="d-flex align-items-center">
        {status === 'sending' && (
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        )}
        {status === 'success' && (
          <FontAwesomeIcon icon={faCheck} className="me-2" />
        )}
        {status === 'error' && (
          <FontAwesomeIcon icon={faTimes} className="me-2" />
        )}
        {status === 'warning' && (
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
};

// IndexedDB utility functions
const initIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PODatabase', 2); // Increased version to update schema
    request.onerror = (event) => reject('IndexedDB error: ' + event.target.error);
    request.onsuccess = (event) => resolve(event.target.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create or update PDFs store
      if (!db.objectStoreNames.contains('PDFs')) {
        db.createObjectStore('PDFs', { keyPath: 'id' });
      }
      
      // Create or update PurchaseOrders store
      if (!db.objectStoreNames.contains('PurchaseOrders')) {
        const poStore = db.createObjectStore('PurchaseOrders', { keyPath: 'id' });
        poStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

const storePDFInIndexedDB = async (id, pdfData) => {
  const db = await initIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['PDFs'], 'readwrite');
    const store = transaction.objectStore('PDFs');
    const request = store.put({ id, pdfData });
    request.onerror = () => reject('Error storing PDF in IndexedDB');
    request.onsuccess = () => resolve();
  });
};

const getPDFFromIndexedDB = async (id) => {
  const db = await initIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['PDFs'], 'readonly');
    const store = transaction.objectStore('PDFs');
    const request = store.get(id);
    request.onerror = () => reject('Error retrieving PDF from IndexedDB');
    request.onsuccess = () => resolve(request.result ? request.result.pdfData : null);
  });
};

// PDF storage utility that tries multiple storage methods
const storePDF = async (id, pdfBlob) => {
    const reader = new FileReader();
    reader.readAsDataURL(pdfBlob);
    reader.onloadend = async function() {
        const pdfData = reader.result;
        try {
            localStorage.setItem(`po_pdf_${id}`, pdfData);
        } catch (storageError) {
            console.warn('Could not store PDF:', storageError);
        }
    };
};

// Add a debounce time constant
const CACHE_KEY = 'purchase_orders_cache';

const POApprovals = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPO, setSelectedPO] = useState(null);
  const [completePoDetails, setCompletePoDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [pdfRotation, setPdfRotation] = useState(0);
  const [transitionClass, setTransitionClass] = useState('');
  const { addNotification } = useNotification();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastErrorTime, setLastErrorTime] = useState(0);
  const [apiFailureCount, setApiFailureCount] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const [notificationsDisabled, setNotificationsDisabled] = useState(false);
  const [apiRetryCount, setApiRetryCount] = useState(0);
  const [fetchError, setFetchError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfError, setPdfError] = useState(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  
  // Add email-related states
  const [emailStatus, setEmailStatus] = useState(null); // 'sending', 'success', 'error', 'warning'
  const [emailMessage, setEmailMessage] = useState('');
  
  // Add socket event protection mechanism
  const socketEventRef = useRef({
    lastEvents: {},
    processingEvents: false
  });
  
  // Socket event handler refs to prevent recreation
  const socketHandlers = useRef({
    poApprovalRequested: null,
    poStatusUpdate: null
  });
  
  // Debounce function to prevent multiple rapid API calls
  const debounce = (func, wait) => {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  };
  
  // Improved error notification system that can be completely disabled
  const showErrorNotification = (message) => {
    if (notificationsDisabled) return;
    
    const now = Date.now();
    // Even stricter limit - only one error notification per 2 minutes max
    if (now - lastErrorTime > 120000) {
      addNotification('error', message);
      setLastErrorTime(now);
      
      // After showing 3 error notifications, disable them completely
      if (apiFailureCount >= 2) {
        console.log('Disabling error notifications after multiple failures');
        setNotificationsDisabled(true);
      }
    }
  };

  // Add last cache check timestamp
  const [lastCacheCheck, setLastCacheCheck] = useState(Date.now());

  const getCachedPurchaseOrders = async () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const cacheAge = Date.now() - timestamp;
        
        // Only use cache if it's less than 5 minutes old
        if (cacheAge < REFRESH_DEBOUNCE_TIME) {
          return data;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const storePurchaseOrders = async (data) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      // Silent fail
    }
  };

  // First, add a mounted ref to prevent memory leaks
  const isMountedRef = useRef(true);

  // Then simplify the entire fetch function
  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/purchase-orders/pending');
      
      // Log the response to see what we're getting
      console.log('Pending approvals response:', response.data);
      
      // Process the data to ensure vendor names and totals are properly formatted
      const processedApprovals = response.data.map(po => ({
        ...po,
        // Ensure vendor name is displayed
        vendor_name: po.vendor_name || 'Unknown Vendor',
        // Ensure total is a number
        total_amount: parseFloat(po.total_amount || 0).toFixed(2)
      }));
      
      setPendingApprovals(processedApprovals);
    } catch (err) {
      setError('Failed to load pending approvals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
    // Set up refresh interval if needed
    const interval = setInterval(fetchApprovals, 30000);
    return () => clearInterval(interval);
  }, []);

  // Add retry button for when we have errors
  const handleRetry = () => {
    setError(null);
    setApiFailureCount(0); // Reset failure count on manual retry
    setApiRetryCount(0);
    setNotificationsDisabled(false); // Re-enable notifications on manual retry
    fetchApprovals(); // Force a new fetch
  };

  useEffect(() => {
    if (pdfBlob) {
      const timer = setTimeout(() => {
        try {
          const iframes = document.querySelectorAll('.pdf-iframe-container iframe');
          iframes.forEach(iframe => {
            if (iframe.contentDocument) {
              const style = document.createElement('style');
              style.textContent = `
                @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&display=swap');
                body, * {
                  font-family: 'Afacad', sans-serif !important;
                }
              `;
              iframe.contentDocument.head.appendChild(style);
            }
          });
        } catch (error) {
          console.error('Error injecting font into iframe:', error);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [pdfBlob]);

  // Add cleanup for blob URL when component unmounts or PDF changes
  useEffect(() => {
    if (pdfBlob) {
      // Create blob URL with explicit PDF MIME type
      const blob = new Blob([pdfBlob], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setPdfUrl(null);
      };
    }
  }, [pdfBlob]);

  const getPriorityBadge = (total) => {
    let priority = 'Low';
    if (total >= 5000) {
      priority = 'High';
    } else if (total >= 1000) {
      priority = 'Medium';
    }
    
    const colors = {
      'High': 'danger',
      'Medium': 'warning',
      'Low': 'info'
    };
    return <Badge bg={colors[priority]}>{priority}</Badge>;
  };

  // Add function to fetch complete PO details
  const fetchCompletePoDetails = async (poId) => {
    try {
      const response = await api.get(`/api/purchase-orders/${poId}`);
      if (response.data) {
        // Extract vendor data with careful fallbacks for every field
        const vendorData = {
          name: response.data.vendor_name || 'Vendor Name Not Available',
          companyName: response.data.vendor_company || response.data.company_name || response.data.vendor_name || 'Company Name Not Available',
          contactPerson: response.data.contact_person || response.data.contact_name || response.data.vendor_name || 'Contact Not Available',
          email: response.data.vendor_email || response.data.email || 'Email Not Available',
          phone: response.data.phone_number || response.data.vendor_phone || 'Phone Not Available',
          address: {
            street: response.data.vendor_address || response.data.address || '123 Vendor Street',
            city: response.data.vendor_city || response.data.city || 'City',
            state: response.data.vendor_state || response.data.state || 'State',
            zip: response.data.vendor_zip || response.data.zip || '12345',
            full: response.data.vendor_address ? 
              `${response.data.vendor_address}, ${response.data.vendor_city || 'City'}, ${response.data.vendor_state || 'State'} ${response.data.vendor_zip || '12345'}` : null
          }
        };
        
        // Convert numeric values with safety checks
        const convertToNumber = (val) => {
          if (val === null || val === undefined) return 0;
          const num = Number(val);
          return isNaN(num) ? 0 : num;
        };
        
        // Process items ensuring numeric values
        const items = (response.data.items || []).map(item => {
          const quantity = convertToNumber(item.quantity);
          const unitPrice = convertToNumber(item.unit_price || item.price);
          
          return {
            id: item.id || Math.random().toString(36).substr(2, 9),
            sku: item.sku || item.id || 'SKU-' + Math.floor(Math.random() * 10000),
            name: item.name || 'Item Name Not Available',
            description: item.description || item.notes || 'No description available',
            quantity: quantity,
            unitPrice: unitPrice
          };
        });
        
        // Calculate financial data
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const taxRate = convertToNumber(response.data.tax_rate) || 10;
        const tax = subtotal * (taxRate / 100);
        const shippingFees = convertToNumber(response.data.shipping_fee) || 50;
        const totalAmount = convertToNumber(response.data.total_amount) || subtotal + tax + shippingFees;
        
        // Create processed data object
        const processedData = {
          poNumber: response.data.order_number || 'PO-' + Date.now(),
          createdAt: response.data.created_at || new Date().toISOString(),
          vendor: vendorData,
          items: items,
          subtotal: subtotal,
          tax: tax,
          taxRate: taxRate,
          shippingFees: shippingFees,
          totalAmount: totalAmount,
          paymentTerms: response.data.payment_terms || 'Net 30',
          deliveryDate: response.data.expected_delivery || response.data.delivery_date || new Date(Date.now() + 14*24*60*60*1000).toLocaleDateString(),
          shippingTerms: response.data.shipping_terms || 'Standard Delivery',
          shippingMethod: response.data.shipping_method || 'Ground',
          termsAndConditions: response.data.terms || 'Standard terms and conditions apply.',
          requestedBy: response.data.ordered_by_name || localStorage.getItem('username') || 'Admin'
        };
        
        setCompletePoDetails(processedData);
        return processedData;
      }
    } catch (error) {
      addNotification('error', 'Failed to load complete purchase order details');
    }
    return null;
  };

  // Add a helper function to convert selectedPO to the format expected by PODocument 
  const convertToPoDocFormat = (po) => {
    if (!po) return null;
    
    // Log the PO to see what we're working with
    console.log('Converting PO to doc format:', po);
    
    // Ensure all vendor information is properly extracted with fallbacks
    const vendorName = po.vendor_name || po.vendor || 'Vendor Not Available';
    const contactPerson = po.contact_person || 'Contact Not Available';
    const vendorEmail = po.vendor_email || po.email || 'Email Not Available';
    const vendorPhone = po.phone_number || po.phone || 'Phone Not Available';
    const vendorAddress = po.vendor_address || po.address || '123 Vendor Street';
    
    // Parse address if it exists
    let street = vendorAddress;
    let city = po.city || 'City';
    let state = po.state || 'State';
    let zip = po.zip || '12345';
    
    // Ensure delivery date is properly formatted
    const deliveryDate = po.delivery_date || po.expected_delivery || new Date().toISOString();
    
    // Convert all numeric values to ensure they are numbers
    const convertToNumber = (val) => {
      if (val === null || val === undefined) return 0;
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };
    
    // Process items to ensure all numeric values are numbers
    const items = (po.items || []).map(item => ({
      id: item.id || Math.random().toString(36).substr(2, 9),
      sku: item.id || item.sku || 'SKU' + Math.floor(Math.random() * 1000),
      name: item.name || 'Item',
      description: item.description || item.notes || '',
      quantity: convertToNumber(item.quantity),
      unitPrice: convertToNumber(item.unit_price || item.price),
    }));
    
    // Calculate financial data
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxRate = convertToNumber(po.tax_rate) || 10;
    const tax = subtotal * (taxRate / 100);
    const shippingFees = convertToNumber(po.shipping_fees) || 50;
    const totalAmount = subtotal + tax + shippingFees;
    
    return {
      poNumber: po.order_number || po.id || 'PO-' + Date.now(),
      createdAt: po.created_at || new Date().toISOString(),
      vendor: {
        name: vendorName,
        companyName: po.vendor_company || vendorName,
        contactPerson: contactPerson,
        email: vendorEmail,
        phone: vendorPhone,
        address: {
          street: street,
          city: city,
          state: state,
          zip: zip,
          full: `${street}, ${city}, ${state} ${zip}`,
        }
      },
      shippingTerms: po.shipping_terms || 'Standard Delivery',
      shippingMethod: po.shipping_method || 'Ground',
      deliveryDate: deliveryDate,
      items: items,
      subtotal: subtotal,
      tax: tax,
      taxRate: taxRate,
      shippingFees: shippingFees,
      totalAmount: totalAmount,
      requestedBy: po.ordered_by_name || localStorage.getItem('username') || 'Admin'
    };
  };

  const handleViewPO = async (po) => {
    setSelectedPO(po);
    setShowModal(true);
    setPdfBlob(null);
    setPdfLoading(true);
    setCompletePoDetails(null);
    
    // Defer API calls to not block the UI
    setTimeout(async () => {
      try {
        // Use a fallback first to show something quickly
        const fallbackData = convertToPoDocFormat(po);
        setCompletePoDetails(fallbackData);
        setPdfLoading(false);
        
        // Then try to get complete details in the background
        try {
          const response = await api.get(`/api/purchase-orders/${po.id}`);
          if (response.data) {
            const processedDetails = await fetchCompletePoDetails(po.id);
            if (processedDetails) {
              setCompletePoDetails(processedDetails);
            }
          }
        } catch (error) {
          // Already showing fallback data, so just log the error
        }
        
        // Load PDF in a separate operation to avoid blocking UI
        loadPdfData(po.id);
        
      } catch (error) {
        setPdfLoading(false);
      }
    }, 100);
  };

  // Separate PDF loading into its own function to avoid blocking the UI
  const loadPdfData = async (poId) => {
    try {
      // First try to get the PDF from the server
      try {
        const response = await api.get(`/api/purchase-orders/${poId}/pdf`, {
          responseType: 'blob'
        });
        setPdfBlob(response.data);
        return;
      } catch (error) {
        // Continue with local storage approach
      }
      
      // Rest of the existing PDF loading logic
      let pdfData = localStorage.getItem(`po_pdf_${poId}`);
      
      if (!pdfData) {
        pdfData = await getPDFFromIndexedDB(`po_pdf_${poId}`);
      }
      
      if (pdfData) {
        const byteCharacters = atob(pdfData.split(',')[1]);
        const byteArrays = [];
        
        // Process in smaller chunks to prevent UI freezing
        const chunkSize = 1024 * 1024; // 1MB chunks
        for (let offset = 0; offset < byteCharacters.length; offset += chunkSize) {
          const chunk = byteCharacters.slice(offset, offset + chunkSize);
          const chunkArray = new Uint8Array(chunk.length);
          for (let i = 0; i < chunk.length; i++) {
            chunkArray[i] = chunk.charCodeAt(i);
          }
          byteArrays.push(chunkArray);
        }
        
        const retrievedBlob = new Blob(byteArrays, { type: 'application/pdf' });
        setPdfBlob(retrievedBlob);
      }
    } catch (error) {
      // Keep functionality but remove console.error
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPO(null);
    setRejectionReason('');
    setPdfBlob(null);
  };

  const handleApprovePO = async () => {
    try {
      // Reset email status
      setEmailStatus(null);
      setEmailMessage('');
      
      // Ensure we have complete PO details
      const poData = completePoDetails || convertToPoDocFormat(selectedPO);

      // Start approval process immediately, without waiting for PDF generation
      setPdfLoading(true);
      
      // First approve the PO - update status
      const response = await api.patch(`/api/purchase-orders/${selectedPO.id}/status`, {
        status: 'approved',
        comments: `Approved by ${localStorage.getItem('username') || 'Admin'} on ${new Date().toLocaleDateString()}`,
        total_amount: typeof poData.totalAmount === 'number' ? poData.totalAmount : parseFloat(poData.totalAmount || 0)
      });
      
      addNotification('success', `Purchase order ${poData.poNumber} approved successfully`);

      // Remove from pending approvals list immediately
      setPendingApprovals(current => 
        current.filter(po => po.id !== selectedPO.id)
      );
      
      // Generate PDF in background - don't block UI
      setTimeout(async () => {
        try {
          // Generate or get PDF
          let currentPdfBlob = pdfBlob;
          if (!currentPdfBlob) {
            try {
              const blob = await generatePOPdf(poData, true);
              if (blob) {
                currentPdfBlob = new Blob([blob], { type: 'application/pdf' });
                setPdfBlob(currentPdfBlob);
                await storePDF(selectedPO.id, currentPdfBlob);
              }
            } catch (pdfError) {
              // Fallback to simple text document if necessary
              currentPdfBlob = new Blob([`Purchase Order ${poData.poNumber} - ${new Date().toLocaleDateString()}`], 
                                        { type: 'text/plain' });
            }
          }
          
          // Send email if we have vendor email
          const vendorName = poData.vendor?.name || poData.vendor_name || 'Vendor';
          const vendorEmail = poData.vendor?.email || poData.vendor_email || '';
          
          if (vendorEmail) {
            setEmailStatus('sending');
            setEmailMessage(`Sending purchase order to ${vendorEmail}...`);
            
            try {
              // Create a File from the Blob
              const pdfFile = new File(
                [currentPdfBlob], 
                `PO-${poData.poNumber}.pdf`, 
                { type: 'application/pdf', lastModified: new Date() }
              );
              
              // Try using EmailService
              const emailResult = await EmailService.sendPOEmail({
                id: selectedPO.id,
                order_number: poData.poNumber,
                vendor_name: vendorName,
                vendor_email: vendorEmail,
                total_amount: poData.totalAmount?.toFixed(2) || '0.00'
              }, pdfFile);
              
              if (emailResult.success) {
                setEmailStatus('success');
                setEmailMessage('Purchase order successfully sent to vendor');
              } else {
                throw new Error(emailResult.error || 'Email service failed');
              }
            } catch (emailError) {
              setEmailStatus('error');
              setEmailMessage('Failed to send email to vendor. Please try sending it manually.');
            }
          } else {
            setEmailStatus('warning');
            setEmailMessage('Vendor email not available. Please add vendor email address.');
          }
        } finally {
          setPdfLoading(false);
        }
      }, 100);
      
      // Let the UI show the approval for a moment before closing
      setTimeout(() => {
        handleCloseModal();
      }, 3000);
      
    } catch (error) {
      setEmailStatus('error');
      setEmailMessage('Error approving purchase order');
      addNotification('error', `Failed to approve purchase order: ${error.message || 'Unknown error'}`);
      setPdfLoading(false);
    }
  };

  const handleRejectPO = async () => {
    if (!rejectionReason.trim()) {
      addNotification('warning', 'Please provide a reason for rejection');
      return;
    }
    
    try {
      // Reset email status
      setEmailStatus(null);
      setEmailMessage('');
      
      const poData = completePoDetails || convertToPoDocFormat(selectedPO);
      
      // Update PO status in the database
      const response = await api.patch(`/api/purchase-orders/${selectedPO.id}/status`, {
        status: 'rejected',
        comments: `Rejected: ${rejectionReason}`
      });
      
      addNotification('warning', `Purchase order ${poData.poNumber} rejected`);
      
      // Format vendor details
      const vendorName = poData.vendor?.name || poData.vendor_name || 'Vendor';
      const vendorEmail = poData.vendor?.email || poData.vendor_email || '';
      
      // Send rejection email to vendor
      if (vendorEmail) {
        setEmailStatus('sending');
        setEmailMessage(`Sending rejection notification to ${vendorEmail}...`);
        
        try {
          // Try using EmailService component first
          const emailResult = await EmailService.sendRejectionEmail({
            order_number: poData.poNumber,
            vendor_name: vendorName,
            vendor_email: vendorEmail
          }, rejectionReason);
          
          if (emailResult.success) {
            setEmailStatus('success');
            setEmailMessage('Rejection notification sent to vendor');
            addNotification('info', 'Rejection notification sent to vendor');
          } else {
            // If EmailService fails, try fallback method
            setEmailStatus('warning');
            setEmailMessage('Primary email method failed, trying alternative...');
            throw new Error(emailResult.error || 'Failed to send rejection email');
          }
        } catch (emailServiceError) {
          // Fallback to direct API call
          try {
            // Prepare email content for rejection notification
            const formData = new FormData();
            formData.append('to', vendorEmail);
            formData.append('subject', `Purchase Order ${poData.poNumber} Rejected`);
            formData.append('message', `Dear ${vendorName},

Your purchase order ${poData.poNumber} has been rejected.

Reason for Rejection: ${rejectionReason}

If you have any questions about this decision or would like to submit a revised purchase order, please contact us.

Best regards,
${localStorage.getItem('username') || 'Admin'}`);
            
            await api.post('/api/purchase-orders/send-email', formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              },
              timeout: 30000 // 30 second timeout
            });
            
            setEmailStatus('success');
            setEmailMessage('Rejection notification sent to vendor');
            addNotification('info', 'Rejection notification sent to vendor');
          } catch (fallbackError) {
            setEmailStatus('error');
            setEmailMessage('Failed to send notification to vendor. Please contact them manually.');
            addNotification('warning', 'Vendor was not notified of the rejection. Please contact them manually.');
          }
        }
      } else {
        setEmailStatus('warning');
        setEmailMessage('Vendor email not available. Please notify vendor manually.');
        addNotification('warning', 'Vendor email not available. Please notify vendor manually.');
      }
      
      // Remove from pending approvals list
      setPendingApprovals(current => 
        current.filter(po => po.id !== selectedPO.id)
      );
      
      // Let the email status show for a moment before closing
      setTimeout(() => {
        handleCloseModal();
      }, 2000);
    } catch (error) {
      setEmailStatus('error');
      setEmailMessage(`Error: ${error.response?.data?.message || error.message}`);
      addNotification('error', `Failed to reject purchase order: ${error.response?.data?.message || error.message}`);
    }
  };

  // Socket.IO event listeners
  useEffect(() => {
    // Listen for PO updates from email processing
    socket.on('po_update', (data) => {
      console.log('Received PO update:', data);
      
      // Show notification
      addNotification('info', `Purchase Order ${data.poNumber} has been updated`);
      
      // Refresh the PO list
      fetchPendingApprovals();
    });

    // Listen for new invoice notifications
    socket.on('po_invoice_received', (data) => {
      addNotification('success', `New invoice received for PO ${data.poNumber}`);
      fetchPendingApprovals();
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off('po_update');
      socket.off('po_invoice_received');
    };
  }, []);

  // Fetch POs with their latest status
  const fetchPendingApprovals = async () => {
    try {
      const response = await api.get('/api/purchase-orders/pending');
      setPendingApprovals(response.data);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      addNotification('error', 'Failed to fetch pending approvals');
    }
  };

  // Status badge component with real-time updates
  const StatusBadge = ({ status, poNumber }) => {
    const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case 'shipped': return 'primary';
        case 'delivered': return 'success';
        case 'delayed': return 'warning';
        case 'cancelled': return 'danger';
        default: return 'secondary';
      }
    };

    return (
      <Badge bg={getStatusColor(status)}>
        {status || 'Pending'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading pending approvals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
        <div className="d-flex justify-content-end">
          <Button variant="outline-danger" onClick={handleRetry}>
            Retry
          </Button>
        </div>
      </Alert>
    );
  }

  if (pendingApprovals.length === 0) {
    return (
      <Alert variant="info">
        <p>No pending purchase orders found.</p>
      </Alert>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Table hover responsive>
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Supplier</th>
              <th>Date</th>
              <th>Total</th>
              <th>Requested By</th>
              <th>Priority</th>
              <th>Actions</th>
            </tr>
            </thead>
          <tbody>
            {pendingApprovals.map(po => {
              // Calculate total amount for each PO
              const subtotal = (po.items || []).reduce((sum, item) => {
                const itemTotal = (item.quantity || 0) * (item.unit_price || item.price || 0);
                return sum + itemTotal;
              }, 0);
              const tax = subtotal * 0.1;
              const shippingFees = 50;
              const totalAmount = subtotal + tax + shippingFees;

              return (
                <tr key={po.id}>
                  <td>{po.order_number}</td>
                  <td>{po.vendor_name}</td>
                  <td>{new Date(po.created_at).toLocaleDateString()}</td>
                  <td>${totalAmount.toFixed(2)}</td>
                  <td>{po.ordered_by_name}</td>
                  <td>{getPriorityBadge(totalAmount)}</td>
                  <td>
                    <Space>
                      <AntButton
                        size="small"
                        icon={<FontAwesomeIcon icon={faEye} />}
                        onClick={() => handleViewPO(po)}
                      >
                        View
                      </AntButton>
                    </Space>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </motion.div>

      <Modal 
        show={showModal} 
        onHide={handleCloseModal} 
        size="lg"
        backdrop="static"
        contentClassName="afacad-font"
      >
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&display=swap');
              .afacad-font {
                font-family: 'Afacad', sans-serif;
              }
            `}
          </style>
        <Modal.Header closeButton>
          <Modal.Title>Purchase Order Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPO && (
            <div className="pdf-viewer-container bg-white p-3 rounded shadow-sm" style={{ minHeight: '600px' }}>
              {pdfLoading ? (
                <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '400px' }}>
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">Loading complete purchase order data...</p>
                </div>
              ) : (
                <div className="d-flex flex-column">
                  <div className="bg-white p-4 border rounded position-relative" 
                    style={{
                      minHeight: '400px',
                      transform: `scale(${pdfZoom / 100}) rotate(${pdfRotation}deg)`,
                      transformOrigin: 'top left'
                    }}>
                    {/* Header with PDF-like title */}
                    <div className="text-center mb-2">
                      <h3 className="fs-4 fw-bold">Purchase Order {(completePoDetails || selectedPO)?.poNumber || (completePoDetails || selectedPO)?.order_number}</h3>
                      <p className="text-muted mb-0">PDF Preview</p>
                    </div>
                    
                    {/* Render with complete PO details or best available fallback */}
                    <PODocument 
                      poData={completePoDetails || convertToPoDocFormat(selectedPO)}
                    />
                    
                    {/* PDF Controls */}
                    <div className="position-absolute top-0 end-0 m-3 bg-white rounded shadow p-2">
                      <div className="btn-group">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setPdfZoom(prev => Math.min(prev + 10, 200))}
                          title="Zoom In"
                        >
                          <FontAwesomeIcon icon={faSearchPlus} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setPdfZoom(prev => Math.max(prev - 10, 50))}
                          title="Zoom Out"
                        >
                          <FontAwesomeIcon icon={faSearchMinus} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setPdfRotation(prev => (prev - 90) % 360)}
                          title="Rotate Left"
                        >
                          <FontAwesomeIcon icon={faUndoAlt} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setPdfRotation(prev => (prev + 90) % 360)}
                          title="Rotate Right"
                        >
                          <FontAwesomeIcon icon={faRedoAlt} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => {
                            // Use complete details if available
                            const poData = completePoDetails || convertToPoDocFormat(selectedPO);
                            
                            // Generate PDF on-demand for download
                            generatePOPdf(poData);
                          }}
                          title="Download PDF"
                        >
                          <FontAwesomeIcon icon={faDownload} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Help text */}
                  <div className="alert alert-info mt-3">
                    <p className="mb-0">
                      <FontAwesomeIcon icon={faFilePdf} className="me-2" />
                      Click the download button to save as PDF.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={3}>
              Rejection Reason:
            </Form.Label>
            <Col sm={9}>
              <Form.Control
                as="textarea"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection (required for rejection)"
              />
            </Col>
          </Form.Group>
          
          {/* Email status indicator */}
          <div className="w-100 mb-3">
            <EmailStatus status={emailStatus} message={emailMessage} />
          </div>
          
          <Space>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleRejectPO}>
              <FontAwesomeIcon icon={faTimes} className="me-2" />
              Reject
            </Button>
            <Button variant="success" onClick={handleApprovePO}>
              <FontAwesomeIcon icon={faCheck} className="me-2" />
              Approve
            </Button>
          </Space>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default POApprovals;
/**
 * Socket event processor with global throttling
 * This protects against backend triggered rapid refreshes
 */
class SocketEventHandler {
  constructor() {
    this.lastEventTime = {};
    this.pendingEvents = {};
    this.isProcessing = false;
  }

  // Check if an event should be processed based on type and throttling
  shouldProcessEvent(eventType) {
    const now = Date.now();
    const lastTime = this.lastEventTime[eventType] || 0;
    
    // Different event types have different throttle times
    const throttleTimes = {
      'po_approval_requested': 8000,  // 8 seconds
      'po_status_update': 5000,       // 5 seconds
      'default': 10000                // 10 seconds default
    };
    
    const throttleTime = throttleTimes[eventType] || throttleTimes.default;
    
    // Check if enough time has passed since last event of this type
    if (now - lastTime < throttleTime) {
      return false;
    }
    
    this.lastEventTime[eventType] = now;
    return true;
  }
  
  // Queue event for processing
  queueEvent(eventType, data, callback) {
    // Store in pending events
    if (!this.pendingEvents[eventType]) {
      this.pendingEvents[eventType] = [];
    }
    
    // Add to queue, but prevent duplicates based on poId if present
    if (data && data.poId) {
      const exists = this.pendingEvents[eventType].some(item => 
        item.data && item.data.poId === data.poId
      );
      
      if (exists) {
        return;
      }
    }
    
    this.pendingEvents[eventType].push({ data, callback });
    
    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processEvents();
    }
  }
  
  // Process queued events with batching
  processEvents() {
    this.isProcessing = true;
    
    setTimeout(() => {
      // Process each event type queue
      Object.keys(this.pendingEvents).forEach(eventType => {
        if (this.pendingEvents[eventType].length > 0 && this.shouldProcessEvent(eventType)) {
          // Take only the latest event of each type
          const event = this.pendingEvents[eventType].pop();
          
          // Call the handler
          if (event && typeof event.callback === 'function') {
            event.callback(event.data);
          }
          
          // Clear other pending events of this type
          this.pendingEvents[eventType] = [];
        }
      });
      
      this.isProcessing = false;
      
      // Check if there are still pending events
      const hasPending = Object.values(this.pendingEvents).some(queue => queue.length > 0);
      if (hasPending) {
        this.processEvents();
      }
    }, 500); // Wait 500ms to batch events
  }
}

// Create a global socket event handler
const globalSocketHandler = new SocketEventHandler();
