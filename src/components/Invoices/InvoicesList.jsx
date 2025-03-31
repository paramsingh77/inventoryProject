import React, { useState, useEffect, useCallback } from 'react';
import { Table, Form, Button, Badge, Spinner, Toast, ToastContainer } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faEye, faSearch, faFilter, faFileInvoice, faBell, faUpload } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL;

const InvoicesList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  
  // Connect to socket when component mounts
  useEffect(() => {
    const newSocket = io(API_URL);
    setSocket(newSocket);
    
    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);
  
  // Handle socket events
  useEffect(() => {
    if (!socket) return;
    
    // Listen for new invoices
    socket.on('newInvoice', (data) => {
      // Add notification
      setNotifications(prev => [
        {
          id: Date.now(),
          title: 'New Invoice',
          message: `New invoice has been received and needs processing.`,
          type: 'info'
        },
        ...prev
      ]);
      
      // Refresh the list
      fetchInvoices();
    });
    
    // Listen for processed invoices
    socket.on('invoiceProcessed', (data) => {
      setNotifications(prev => [
        {
          id: Date.now(),
          title: 'Invoice Processed',
          message: `Invoice has been linked to PO #${data.orderNumber}`,
          type: 'success'
        },
        ...prev
      ]);
      
      // Refresh the list
      fetchInvoices();
    });
    
    return () => {
      socket.off('newInvoice');
      socket.off('invoiceProcessed');
    };
  }, [socket]);
  
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/invoices`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setInvoices(data);
      console.log('Loaded invoices:', data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      setError(`Failed to load invoices: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);
  
  useEffect(() => {
    fetchInvoices();
    
    // Poll for updates every 60 seconds as a backup to websockets
    const interval = setInterval(() => {
      fetchInvoices();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [fetchInvoices]);
  
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      !searchTerm.trim() || 
      invoice.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = 
      statusFilter === 'all' || 
      invoice.status?.toLowerCase() === statusFilter;
      
    return matchesSearch && matchesStatus;
  });
  
  const handleViewInvoice = (invoice) => {
    window.open(invoice.fileUrl, '_blank');
  };
  
  const handleDownloadInvoice = (invoice) => {
    const link = document.createElement('a');
    link.href = invoice.fileUrl;
    link.download = invoice.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const getStatusBadge = (status) => {
    switch(status?.toLowerCase()) {
      case 'processed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'danger';
      default:
        return 'secondary';
    }
  };
  
  const handleManualUpload = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const formData = new FormData();
      formData.append('invoiceFile', file);
      
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/invoices`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload invoice');
        }
        
        await fetchInvoices();
        alert('Invoice uploaded successfully!');
      } catch (error) {
        console.error('Upload failed:', error);
        setError(`Upload failed: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fileInput.click();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container-fluid"
    >
      {/* Notifications */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1060 }}>
        <AnimatePresence>
          {notifications.map(notification => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Toast 
                onClose={() => removeNotification(notification.id)} 
                bg={notification.type}
                delay={5000}
                autohide
              >
                <Toast.Header>
                  <FontAwesomeIcon icon={faBell} className="me-2" />
                  <strong className="me-auto">{notification.title}</strong>
                  <small>just now</small>
                </Toast.Header>
                <Toast.Body className={notification.type === 'success' ? 'text-white' : ''}>
                  {notification.message}
                </Toast.Body>
              </Toast>
            </motion.div>
          ))}
        </AnimatePresence>
      </ToastContainer>
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="m-0">
          <FontAwesomeIcon icon={faFileInvoice} className="me-2" />
          Invoice PDFs
        </h4>
        <Button 
          variant="outline-primary" 
          onClick={() => fetchInvoices()}
          className="d-flex align-items-center"
        >
          <FontAwesomeIcon icon={faFilter} className="me-2" />
          Refresh
        </Button>
        <Button 
          variant="primary" 
          onClick={handleManualUpload}
          className="ms-2"
        >
          <FontAwesomeIcon icon={faUpload} className="me-2" />
          Upload Invoice
        </Button>
      </div>
      
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <Form className="mb-0">
            <div className="row g-2">
              <div className="col-md-8">
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <FontAwesomeIcon icon={faSearch} />
                  </span>
                  <Form.Control
                    type="search"
                    placeholder="Search by invoice filename, vendor, or number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-start-0"
                  />
                </div>
              </div>
              <div className="col-md-4">
                <Form.Select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="processed">Processed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </Form.Select>
              </div>
            </div>
          </Form>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading invoices...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="card text-center py-5">
          <div className="card-body">
            <FontAwesomeIcon 
              icon={faFileInvoice} 
              style={{ fontSize: '3rem', color: '#ccc' }} 
              className="mb-3" 
            />
            <h5>No invoices found</h5>
            <p className="text-muted">
              {searchTerm 
                ? "No matches found for your search criteria" 
                : "No invoice PDFs have been extracted yet"}
            </p>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="table-responsive">
            <Table hover className="table-striped">
              <thead className="table-light">
                <tr>
                  <th>Filename</th>
                  <th>Invoice Number</th>
                  <th>Vendor</th>
                  <th>Invoice Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Extraction Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice, index) => (
                  <motion.tr
                    key={invoice.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td>{invoice.filename}</td>
                    <td>{invoice.invoiceNumber || 'N/A'}</td>
                    <td>{invoice.vendor || 'Unknown'}</td>
                    <td>{invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'N/A'}</td>
                    <td>${invoice.amount ? Number(invoice.amount).toFixed(2) : 'N/A'}</td>
                    <td>
                      <Badge bg={getStatusBadge(invoice.status)}>
                        {invoice.status || 'Unknown'}
                      </Badge>
                    </td>
                    <td>{invoice.extractionDate ? new Date(invoice.extractionDate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          onClick={() => handleViewInvoice(invoice)}
                          title="View Invoice"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          size="sm" 
                          onClick={() => handleDownloadInvoice(invoice)}
                          title="Download Invoice"
                        >
                          <FontAwesomeIcon icon={faDownload} />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </Table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default InvoicesList; 