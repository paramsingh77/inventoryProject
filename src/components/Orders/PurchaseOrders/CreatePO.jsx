import React, { useState } from 'react';
import {
  Modal,
  Form,
  Button,
  Row,
  Col,
  Table,
  InputGroup,
  Image,
  Spinner
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSave,
  faPlus,
  faTrash,
  faSearch,
  faTimes,
  faFileInvoice,
  faPaperPlane
} from '@fortawesome/free-solid-svg-icons';
import { useNotification } from '../../../context/NotificationContext';
import { suppliers, products } from '../../../data/samplePOData';
import BasicInfo from './BasicInfo';
import ItemsSelection from './ItemsSelection';
import AdditionalDetails from './AdditionalDetails';
import companyLogo from '../../../images/image copy.png';
import { motion } from 'framer-motion';
import { generatePOPdf, generateOptimizedPOPdf } from '../../../utils/pdfGenerator';
import {
  sendPurchaseOrderEmail,
  sendPurchaseOrderWithPdf,
  testFileUpload
} from '../../../services/emailService';

// Helper Functions - Move outside component
const generatePONumber = () => {
  const prefix = 'PO';
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

const styles = {
  container: {
    fontFamily: 'Afacad, sans-serif'
  },
  stepContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    position: 'relative',
    padding: '0 1rem',
    marginBottom: '2rem'
  },
  stepLine: {
    position: 'absolute',
    top: '20px',
    left: '0',
    right: '0',
    height: '2px',
    background: '#dee2e6',
    zIndex: 1
  },
  step: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
    background: '#fff',
    padding: '0 1rem'
  },
  stepNumber: (isActive) => ({
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: isActive ? '#0d6efd' : '#e9ecef',
    color: isActive ? '#fff' : '#6c757d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.5rem',
    fontWeight: '600',
    fontSize: '1rem'
  }),
  stepTitle: {
    fontSize: '0.9rem',
    color: '#6c757d',
    fontWeight: '500'
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#344767',
    marginBottom: '1rem'
  },
  formLabel: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#344767'
  }
};

const RequiredLabel = ({ children }) => (
  <Form.Label style={styles.formLabel}>
    {children} <span className="text-danger">*</span>
  </Form.Label>
);

const CreatePO = ({ show, onHide, onSuccess }) => {
  const { addNotification } = useNotification();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // PO Details
    poNumber: generatePONumber(),
    poDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    paymentTerms: '',
    approvalStatus: 'pending',

    // Company Details
    companyName: 'AAM Inventory',
    companyAddress: '700 17th Street, Modesto, CA 95354',
    department: 'IT Department',
    requestedBy: 'IT Manager',

    // Vendor Details
    vendor: {
      id: '',
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: ''
      }
    },

    // Order Items
    items: [],
    
    // Financial Details
    subtotal: 0,
    tax: 0,
    shippingFees: 0,
    totalAmount: 0,

    // Additional Details
    justification: '',
    shippingInstructions: '',
    warrantyInfo: '',
    termsAndConditions: '',

    // Approval Details
    approvedBy: {
      name: '',
      position: '',
      signature: null,
      date: null
    },
    departmentApproval: {
      required: false,
      name: '',
      position: '',
      signature: null,
      date: null
    },
    returnPolicyAccepted: false,
    specialInstructions: '',
    warrantyRequired: false,
    approvals: {
      requestedBy: {
        name: '',
        signature: null,
        date: null
      },
      departmentHead: {
        name: '',
        signature: null,
        date: null
      },
      finance: {
        name: '',
        signature: null,
        date: null
      }
    }
  });

  const [sendingEmail, setSendingEmail] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState(null);

  // Item Management Functions
  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * 0.1; // 10% tax
    const shippingFees = 50; // Fixed shipping fee
    const total = subtotal + tax + shippingFees;

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax,
      shippingFees,
      totalAmount: total
    }));
  };

  const addItem = () => {
    const newItem = {
      id: formData.items.length + 1,
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    };
    const updatedItems = [...formData.items, newItem];
    setFormData(prev => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
  };

  const updateItem = (index, field, value) => {
    const updatedItems = formData.items.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    });
    setFormData(prev => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
  };

  const removeItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
  };

  const steps = [
    {
      title: 'Basic Information',
      fields: [
        {
          section: 'Purchase Order Details',
          components: (
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={styles.formLabel}>PO Number</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.poNumber}
                    disabled
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={styles.formLabel}>Order Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.poDate}
                    disabled
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <RequiredLabel>Delivery Date</RequiredLabel>
                  <Form.Control
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => updateFormData('deliveryDate', e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <RequiredLabel>Payment Terms</RequiredLabel>
                  <Form.Select
                    value={formData.paymentTerms}
                    onChange={(e) => updateFormData('paymentTerms', e.target.value)}
                    required
                  >
                    <option value="">Select Terms</option>
                    <option value="net30">Net 30</option>
                    <option value="net60">Net 60</option>
                    <option value="immediate">Immediate</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          )
        },
        {
          section: 'Vendor Details',
          components: (
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <RequiredLabel>Vendor</RequiredLabel>
                  <Form.Select
                    value={formData.vendor.id}
                    onChange={(e) => {
                      const selectedVendor = suppliers.find(s => s.id === parseInt(e.target.value));
                      if (selectedVendor) {
                        setFormData(prev => ({
                          ...prev,
                          vendor: {
                            id: selectedVendor.id,
                            name: selectedVendor.name,
                            email: selectedVendor.email,
                            contactPerson: '',
                            phone: '',
                            address: selectedVendor.address || {
                              street: '',
                              city: '',
                              state: '',
                              zip: '',
                              country: ''
                            }
                          }
                        }));
                      }
                    }}
                    required
                  >
                    <option value="">Select Vendor</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <RequiredLabel>Contact Person</RequiredLabel>
                  <Form.Control
                    type="text"
                    value={formData.vendor.contactPerson || ''}
                    onChange={(e) => updateVendorDetails('contactPerson', e.target.value)}
                    placeholder="Enter contact person name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <RequiredLabel>Email</RequiredLabel>
                  <Form.Control
                    type="email"
                    value={formData.vendor.email || ''}
                    onChange={(e) => updateVendorDetails('email', e.target.value)}
                    placeholder="Enter vendor email"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <RequiredLabel>Phone</RequiredLabel>
                  <Form.Control
                    type="tel"
                    value={formData.vendor.phone || ''}
                    onChange={(e) => updateVendorDetails('phone', e.target.value)}
                    placeholder="Enter vendor phone"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <RequiredLabel>Address</RequiredLabel>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.vendor.address.street || ''}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        vendor: {
                          ...prev.vendor,
                          address: {
                            ...prev.vendor.address,
                            street: e.target.value
                          }
                        }
                      }));
                    }}
                    placeholder="Enter vendor address"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          )
        }
      ]
    },
    {
      title: 'Items',
      fields: [
        {
          section: 'Order Items',
          components: (
            <div>
              {/* Product Selector */}
              <div className="mb-4 bg-white p-3 rounded-3 border">
                <Form.Group>
                  <Form.Label style={styles.formLabel}>Add Product</Form.Label>
                  <InputGroup>
                    <Form.Select
                      onChange={(e) => {
                        const product = products.find(p => p.id === e.target.value);
                        if (product) {
                          const newItem = {
                            id: product.id,
                            name: product.name,
                            description: product.description,
                            quantity: 1,
                            unitPrice: product.price,
                            totalPrice: product.price,
                            sku: product.sku
                          };
                          const updatedItems = [...formData.items, newItem];
                          setFormData(prev => ({ ...prev, items: updatedItems }));
                          calculateTotals(updatedItems);
                        }
                      }}
                      value=""
                    >
                      <option value="">Select a product...</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - ${product.price} (SKU: {product.sku})
                        </option>
                      ))}
                    </Form.Select>
                    <Button 
                      variant="outline-secondary"
                      onClick={() => {
                        // Open product catalog modal if needed
                      }}
                    >
                      <FontAwesomeIcon icon={faSearch} className="me-2" />
                      Browse Catalog
                    </Button>
                  </InputGroup>
                </Form.Group>
              </div>

              {/* Items Table */}
              <Table responsive className="mb-3">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Item</th>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit Price ($)</th>
                    <th>Total ($)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.sku}</td>
                      <td>{item.name}</td>
                      <td>{item.description}</td>
                      <td style={{ width: '120px' }}>
                        <Form.Control
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td>${item.unitPrice.toFixed(2)}</td>
                      <td>${(item.quantity * item.unitPrice).toFixed(2)}</td>
                      <td>
                        <Button
                          variant="light"
                          size="sm"
                          className="text-danger"
                          onClick={() => removeItem(index)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="5" className="text-end">Subtotal:</td>
                    <td>${formData.subtotal.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan="5" className="text-end">Tax (10%):</td>
                    <td>${formData.tax.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan="5" className="text-end">Shipping:</td>
                    <td>${formData.shippingFees.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan="5" className="text-end fw-bold">Total:</td>
                    <td className="fw-bold">${formData.totalAmount.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </Table>
            </div>
          )
        }
      ]
    },
    {
      title: 'Additional Details',
      fields: [
        {
          section: 'Additional Information',
          components: (
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label style={styles.formLabel}>Justification</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.justification}
                    onChange={(e) => updateFormData('justification', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label style={styles.formLabel}>Special Instructions</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.specialInstructions}
                    onChange={(e) => updateFormData('specialInstructions', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Check
                  type="checkbox"
                  label="Warranty Required"
                  checked={formData.warrantyRequired}
                  onChange={(e) => updateFormData('warrantyRequired', e.target.checked)}
                />
              </Col>
              <Col md={6}>
                <Form.Check
                  type="checkbox"
                  label="Return Policy Accepted"
                  checked={formData.returnPolicyAccepted}
                  onChange={(e) => updateFormData('returnPolicyAccepted', e.target.checked)}
                />
              </Col>
            </Row>
          )
        }
      ]
    }
  ];

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateVendorDetails = (field, value) => {
    setFormData(prev => ({
      ...prev,
      vendor: {
        ...prev.vendor,
        [field]: value
      }
    }));
  };

  const validateForm = () => {
    const errors = [];

    // Vendor validation
    if (!formData.vendor.id) {
      errors.push('Please select a vendor');
    }
    if (!formData.vendor.contactPerson) {
      errors.push('Contact person is required');
    }
    if (!formData.vendor.email) {
      errors.push('Vendor email is required');
    }
    if (!formData.vendor.phone) {
      errors.push('Vendor phone is required');
    }
    if (!formData.vendor.address.street) {
      errors.push('Vendor address is required');
    }

    // PO Details validation
    if (!formData.deliveryDate) {
      errors.push('Delivery date is required');
    }
    if (!formData.paymentTerms) {
      errors.push('Payment terms are required');
    }

    // Items validation
    if (formData.items.length === 0) {
      errors.push('Please add at least one item');
    }

    // Show all validation errors
    if (errors.length > 0) {
      errors.forEach(error => {
        addNotification('error', error);
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Prepare the data for submission
      const purchaseOrderData = {
        ...formData,
        status: 'pending_approval',
        createdAt: new Date().toISOString(),
        poDate: new Date().toISOString(),
        subtotal: formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
        tax: formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * 0.1), 0), // 10% tax
        shippingFees: 50, // Default shipping fee
        totalAmount: formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * 1.1 + 50,
        items: formData.items.map(item => ({
          id: item.id,
          sku: item.sku || item.id,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice
        }))
      };

      // Submit the PO
      const response = await submitPurchaseOrder(purchaseOrderData);
      
      if (response.success) {
        // Generate optimized PDF
        addNotification('info', 'Generating PDF...');
        const pdfBlob = await generateOptimizedPOPdf(purchaseOrderData);
        setGeneratedPdfBlob(pdfBlob);
        
        // Log PDF size
        console.log(`Generated PDF size: ${(pdfBlob.size / (1024 * 1024)).toFixed(2)}MB`);
        
        // Create object URL for the PDF
        const pdfUrl = URL.createObjectURL(pdfBlob);
        purchaseOrderData.documentUrl = pdfUrl;

        // Show success message
        addNotification('success', 'Invoice is created and sent for approval');
        
        // Dispatch event with complete PO data
        window.dispatchEvent(new CustomEvent('purchaseOrder', {
          detail: {
            type: 'NEW_PO',
            po: purchaseOrderData
          }
        }));
        
        onSuccess(response);
        onHide();
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      addNotification('error', 'Failed to create Purchase Order. Please try again.');
    }
  };

  // Helper function to compress PDF blob
  const compressPdfBlob = async (pdfBlob) => {
    // If the PDF is already under 10MB, return it as is
    if (pdfBlob.size < 10 * 1024 * 1024) {
      console.log('PDF is already under 10MB, no compression needed');
      return pdfBlob;
    }
    
    console.log(`Original PDF size: ${(pdfBlob.size / (1024 * 1024)).toFixed(2)}MB`);
    
    try {
      // For PDFs generated with jsPDF, we can try to reduce the quality
      // This is a simple approach - for more advanced compression, you'd need a dedicated PDF library
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Create an image from the PDF
      const img = new Image();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Wait for the image to load
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = pdfUrl;
      });
      
      // Set canvas dimensions (reduce if needed)
      const scaleFactor = Math.min(1, 10 * 1024 * 1024 / pdfBlob.size); // Scale down if over 10MB
      canvas.width = img.width * scaleFactor;
      canvas.height = img.height * scaleFactor;
      
      // Draw the image on the canvas with reduced quality
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob with reduced quality
      const compressedBlob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'application/pdf', 0.7); // 0.7 quality (adjust as needed)
      });
      
      console.log(`Compressed PDF size: ${(compressedBlob.size / (1024 * 1024)).toFixed(2)}MB`);
      
      // Clean up
      URL.revokeObjectURL(pdfUrl);
      
      return compressedBlob;
    } catch (error) {
      console.error('Error compressing PDF:', error);
      // Return original if compression fails
      return pdfBlob;
    }
  };

  const handleSendEmail = async () => {
    if (!generatedPdfBlob) {
      addNotification('error', 'No PDF generated yet. Please save the PO first.');
      return;
    }
    
    setSendingEmail(true);
    try {
      // Log PDF blob details for debugging
      console.log('PDF Blob details:', {
        type: generatedPdfBlob.type,
        size: generatedPdfBlob.size,
        lastModified: generatedPdfBlob.lastModified
      });
      
      // Try to compress the PDF if it's large
      let pdfToSend = generatedPdfBlob;
      if (generatedPdfBlob.size > 10 * 1024 * 1024) {
        addNotification('info', 'PDF is large, attempting to compress...');
        pdfToSend = await compressPdfBlob(generatedPdfBlob);
        
        if (pdfToSend.size > 50 * 1024 * 1024) {
          addNotification('error', 'PDF is too large (over 50MB) even after compression. Please try creating a smaller document.');
          setSendingEmail(false);
          return;
        }
      }
      
      // Create email data
      const emailData = {
          to: formData.vendor.email,
          subject: `Purchase Order #${formData.poNumber} from ${formData.companyName}`,
          message: `Dear ${formData.vendor.contactPerson},

I hope this message finds you well.

Please find attached our Purchase Order (#${formData.poNumber}) for your reference.

Kindly review and confirm receipt of this order at your earliest convenience.
We would appreciate it if you could send the invoice to invoice.tester11@gmail.com, referencing the PO number in the subject line.

Thank you for your continued support and collaboration.

Best regards,
${formData.requestedBy}
${formData.companyName}`
        };
      
      // Prepare the file
      const fileName = `PO-${formData.poNumber}-${Date.now()}.pdf`;
      const file = new File([pdfToSend], fileName, { type: 'application/pdf' });
      
      // Create form data
      const formDataObj = new FormData();
      formDataObj.append('poId', formData.poNumber);
      formDataObj.append('to', emailData.to);
      formDataObj.append('subject', emailData.subject);
      formDataObj.append('message', emailData.message);
      formDataObj.append('pdfFile', file);
      
      // DIRECT APPROACH: Use fetch with explicit URL
      console.log('Attempting direct fetch to backend...');
      
      try {
        const fetchResponse = await fetch('http://localhost:2000/api/email/send-po-with-file', {
          method: 'POST',
          body: formDataObj,
          // Don't use credentials for cross-origin to avoid CORS preflight issues
          credentials: 'omit'
        });
        
        if (!fetchResponse.ok) {
          let errorMessage = 'Server responded with an error';
          try {
            const errorData = await fetchResponse.json();
            errorMessage = errorData.message || fetchResponse.statusText;
          } catch (e) {
            // If we can't parse JSON, just use status text
            errorMessage = fetchResponse.statusText;
          }
          throw new Error(`Server error: ${errorMessage}`);
        }
        
        const responseData = await fetchResponse.json();
        console.log('Email sent successfully:', responseData);
        addNotification('success', 'Purchase Order sent to vendor successfully');
        
        // Dispatch event to update PO list
        const poEvent = new CustomEvent('purchaseOrder', {
          detail: {
            type: 'NEW_PO',
            po: {
              ...formData,
              status: 'Pending', // Set initial status to Pending
              hasInvoice: false
            }
          }
        });
        window.dispatchEvent(poEvent);
        
        // Close modal and notify parent component
        if (onSuccess) {
          onSuccess(formData);
        }
        onHide();
      } catch (directError) {
        console.error('Direct fetch failed:', directError);
        
        // Show a more helpful error message
        let errorMessage = 'Failed to connect to the backend server.';
        
        if (directError.message.includes('Failed to fetch')) {
          errorMessage = `
            Backend connection failed. Please:
            1. Make sure your backend server is running
            2. Check if it's running on port 2000 (or update the code with the correct port)
            3. Try the test page at http://localhost:2000/api/health to diagnose the issue
          `;
        } else {
          errorMessage = directError.message;
        }
        
        addNotification('error', errorMessage);
      }
    } catch (error) {
      console.error('Error in send email process:', error);
      addNotification('error', 'Failed to send Purchase Order. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  };
  
  const submitPurchaseOrder = async (data) => {
    // This would typically be an API call
    // For now, we'll simulate a successful response
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          id: data.poNumber,
          message: 'Purchase Order created successfully'
        });
      }, 1000);
    });
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" style={styles.container}>
      <Modal.Header closeButton className="border-0">
        <Modal.Title as="h5" style={{ fontWeight: '600' }}>
          <FontAwesomeIcon icon={faFileInvoice} className="me-2 text-primary" />
          Create Purchase Order
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4">
        {/* Progress Steps */}
        <div style={styles.stepContainer}>
          <div style={styles.stepLine} />
          {steps.map((step, index) => (
            <motion.div
              key={index}
              style={styles.step}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div style={styles.stepNumber(currentStep === index + 1)}>
                {index + 1}
              </div>
              <div style={styles.stepTitle}>{step.title}</div>
            </motion.div>
          ))}
        </div>

        {/* Form Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Form>
            {steps[currentStep - 1].fields.map((field, index) => (
              <div key={index} className="mb-4">
                <h6 style={styles.sectionTitle}>{field.section}</h6>
                <div className="bg-light rounded-3 p-4">
                  {field.components}
                </div>
              </div>
            ))}
          </Form>
        </motion.div>
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button variant="light" onClick={onHide}>
          <FontAwesomeIcon icon={faTimes} className="me-2" />
          Cancel
        </Button>
        {currentStep > 1 && (
          <Button
            variant="secondary"
            onClick={() => setCurrentStep(prev => prev - 1)}
          >
            Previous
          </Button>
        )}
        {currentStep < steps.length ? (
          <motion.div whileHover={{ scale: 1.02 }}>
            <Button
              variant="primary"
              onClick={() => setCurrentStep(prev => prev + 1)}
            >
              Next
            </Button>
          </motion.div>
        ) : (
          <>
            <motion.div whileHover={{ scale: 1.02 }} className="me-2">
              <Button 
                variant="success" 
                onClick={handleSubmit}
              >
                <FontAwesomeIcon icon={faSave} className="me-2" />
                Create PO
              </Button>
            </motion.div>
            {generatedPdfBlob && (
              <motion.div whileHover={{ scale: 1.02 }}>
                <Button 
                  variant="primary" 
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                >
                  {sendingEmail ? (
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
              </motion.div>
            )}
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default CreatePO; 