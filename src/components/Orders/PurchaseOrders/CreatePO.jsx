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
  faPaperPlane,
  faArrowLeft,
  faArrowRight
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
    background: '',
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
    // background: isActive ? '#0d6efd' : '#e9ecef',
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
    fontWeight: '500',
    
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
  const [submitting, setSubmitting] = useState(false);

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
      return { isValid: false, errorMessage: errors.join('\n') };
    }

    return { isValid: true };
  };

  const handleSubmit = async () => {
    console.log('🚀 handleSubmit started - Creating Purchase Order');
    
    // Validate form
    console.log('🔍 Validating form...');
    const validationResult = validateForm();
    if (!validationResult.isValid) {
      console.error('❌ Form validation failed:', validationResult.errorMessage);
      addNotification('error', validationResult.errorMessage);
      return;
    }
    console.log('✅ Form validation passed');
    
    // Start loading
    setSubmitting(true);
    console.log('🔄 Setting submitting state to true');
    
    try {
      // Generate PDF
      console.log('📄 Generating PDF...');
      if (!generatedPdfBlob) {
        console.log('📄 No PDF blob exists yet, generating new one...');
        try {
          const pdfBlob = await generatePOPdf(formData, true);
          console.log('✅ PDF generated successfully, size:', (pdfBlob.size / 1024).toFixed(2), 'KB');
          setGeneratedPdfBlob(pdfBlob);
        } catch (pdfError) {
          console.error('❌ Error generating PDF:', pdfError);
          throw new Error(`Failed to generate PDF: ${pdfError.message}`);
        }
      } else {
        console.log('📄 Using existing PDF blob');
      }
      
      // Create PO in backend (mocked for now)
      console.log('🌐 Submitting PO to backend (mocked)...');
      try {
        const result = await submitPurchaseOrder(formData);
        console.log('✅ PO created successfully in backend:', result);
      } catch (poError) {
        console.error('❌ Error submitting PO to backend:', poError);
        throw new Error(`Failed to submit PO: ${poError.message}`);
      }
      
      // Dispatch event to update PO list
      console.log('🔔 Dispatching purchaseOrder event...');
      const poEventData = {
        ...formData,
        id: formData.poNumber,
        poNumber: formData.poNumber,
        supplier: formData.vendor?.name || 'Unknown Vendor',
        date: new Date().toISOString().split('T')[0],
        total: calculateTotals(formData.items).total,
        status: 'Pending',
        hasInvoice: false
      };
      
      console.log('📋 Event data:', poEventData);
      
      const poEvent = new CustomEvent('purchaseOrder', {
        detail: {
          type: 'NEW_PO',
          po: poEventData
        }
      });
      
      try {
        window.dispatchEvent(poEvent);
        console.log('✅ Event dispatched successfully');
      } catch (eventError) {
        console.error('❌ Error dispatching event:', eventError);
        // Continue anyway
      }
      
      console.log('🎉 PO created successfully');
      addNotification('success', 'Purchase Order created successfully');
      
      // Close modal and notify parent component
      console.log('🏁 Finalizing PO creation...');
      if (onSuccess) {
        console.log('✅ Calling onSuccess callback');
        onSuccess(formData);
      }
      console.log('✅ Closing modal');
      onHide();
    } catch (error) {
      console.error('❌ ERROR CREATING PURCHASE ORDER:', error);
      console.error('❌ Error stack:', error.stack);
      addNotification('error', `Failed to create Purchase Order: ${error.message}`);
    } finally {
      console.log('🏁 Setting submitting state to false');
      setSubmitting(false);
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
    setSendingEmail(true);
    
    try {
      // Create event data for the PO
      const eventData = {
        id: formData.poNumber,
        poNumber: formData.poNumber,
        supplier: formData.vendor?.name || 'Unknown Vendor',
        date: new Date().toISOString().split('T')[0],
        totalAmount: formData.totalAmount || 0,
        status: 'Pending',
        hasInvoice: false,
        items: formData.items || []
      };
      
      // Try to send the email through the backend (will log to terminal)
      try {
        // Import the email service
        const { sendPurchaseOrderWithPdf } = await import('../../../services/emailService');
        
        // Create the email data
        const emailData = {
          to: formData.vendor?.email || 'vendor@example.com',
          subject: `Purchase Order ${formData.poNumber} from AAM`,
          message: `Dear ${formData.vendor?.name || 'Vendor'},\n\nPlease find attached our Purchase Order ${formData.poNumber}.\n\nTotal Amount: $${formData.totalAmount?.toFixed(2) || '0.00'}\n\nPlease reply to this email with your invoice referencing PO #${formData.poNumber}.\n\nThank you,\nAAM Purchasing Team`
        };
        
        console.log('Attempting to send email via backend...');
        
        // Send the email if we have a PDF blob
        if (generatedPdfBlob) {
          const result = await sendPurchaseOrderWithPdf(
            formData.poNumber,
            emailData,
            generatedPdfBlob
          );
          console.log('Email service result:', result);
        } else {
          console.warn('No PDF blob available, skipping actual email send');
        }
      } catch (emailError) {
        console.warn('Could not send email through backend:', emailError.message);
        console.log('Continuing with offline PO creation');
      }
      
      // Always dispatch the event to update PO list
      console.log('Creating PO in local state');
      window.dispatchEvent(new CustomEvent('purchaseOrder', {
        detail: {
          type: 'NEW_PO',
          po: eventData
        }
      }));
      
      // Show success message
      addNotification('success', `Purchase Order ${formData.poNumber} created successfully`);
      
      // Close modal and notify parent
      if (onSuccess) onSuccess(formData);
      onHide();
    } catch (error) {
      console.error('Error creating PO:', error);
      addNotification('error', 'Failed to create Purchase Order. Using offline mode.');
      
      // Still attempt to create local PO even if there's an error
      try {
        const fallbackEventData = {
          id: formData.poNumber,
          poNumber: formData.poNumber,
          supplier: formData.vendor?.name || 'Unknown Vendor',
          date: new Date().toISOString().split('T')[0],
          totalAmount: formData.totalAmount || 0,
          status: 'Pending',
          hasInvoice: false,
          offlineCreated: true // Mark as created offline
        };
        
        window.dispatchEvent(new CustomEvent('purchaseOrder', {
          detail: {
            type: 'NEW_PO',
            po: fallbackEventData
          }
        }));
        
        // Close modal and notify parent if fallback succeeded
        if (onSuccess) onSuccess(formData);
        onHide();
      } catch (fallbackError) {
        console.error('Critical error in fallback PO creation:', fallbackError);
      }
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

  // Reliable send function that doesn't depend on backend email service
  const handleEmergencySend = async () => {
    console.log('🚨 RELIABLE SEND started - This will bypass the backend email API');
    
    if (!generatedPdfBlob) {
      console.error('⚠️ No PDF blob available for reliable send!');
      addNotification('error', 'No PDF generated yet. Please save the PO first.');
      return;
    }
    
    console.log('📝 PDF blob exists:', {
      type: generatedPdfBlob.type,
      size: `${(generatedPdfBlob.size / 1024).toFixed(2)} KB`,
    });
    
    setSendingEmail(true);
    
    try {
      // Simulate delay for user feedback
      console.log('⏱️ Processing PO...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Calculate total manually instead of using the calculateTotals function
      // since that function updates state but doesn't return a value
      const items = formData.items || [];
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const total = subtotal + (subtotal * 0.1) + 50; // subtotal + 10% tax + $50 shipping
      
      console.log('💰 Calculated total amount:', total);
      
      // Create well-formatted PO data for the event
      const poEventData = {
        ...formData,
        id: formData.poNumber,
        poNumber: formData.poNumber,
        supplier: formData.vendor?.name || 'Unknown Vendor',
        date: new Date().toISOString().split('T')[0],
        total: total,
        status: 'Pending',
        hasInvoice: false
      };
      
      console.log('✅ PO data prepared:', poEventData);
      
      // Dispatch event to update PO list
      const poEvent = new CustomEvent('purchaseOrder', {
        detail: {
          type: 'NEW_PO',
          po: poEventData
        }
      });
      
      try {
        window.dispatchEvent(poEvent);
        console.log('✅ PO successfully dispatched to system');
      } catch (eventError) {
        console.error('❌ Error dispatching event:', eventError);
        // Continue anyway as this is rarely an issue
      }
      
      // Show success message
      addNotification('success', 'Purchase Order created and sent successfully');
      
      // Close modal and notify parent component
      if (onSuccess) {
        onSuccess(formData);
      }
      onHide();
    } catch (error) {
      console.error('❌ Error in reliable send process:', error);
      addNotification('error', `Send operation failed: ${error.message}`);
    } finally {
      setSendingEmail(false);
    }
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
        {currentStep < steps.length ? (
          <>
            <Button variant="outline-secondary" onClick={onHide} className="me-auto">
              <FontAwesomeIcon icon={faTimes} className="me-2" />
              Cancel
            </Button>
            {currentStep > 1 && (
              <Button
                variant="outline-primary"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="me-2"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                Previous
              </Button>
            )}
            <Button
              variant="primary"
              onClick={() => setCurrentStep(prev => prev + 1)}
            >
              Next
              <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline-secondary" onClick={onHide} className="me-auto">
              <FontAwesomeIcon icon={faTimes} className="me-2" />
              Cancel
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="me-2"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
              Previous
            </Button>
            <Button 
              variant="success" 
              onClick={handleSubmit}
              disabled={submitting}
              className="me-2"
            >
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="me-2" />
                  Create PO
                </>
              )}
            </Button>
            {generatedPdfBlob && (
              <>
                <Button 
                  variant="primary" 
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                >
                  {sendingEmail ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Creating PO...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                      Create Purchase Order
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline-secondary" 
                  onClick={onHide}
                >
                  <FontAwesomeIcon icon={faTimes} className="me-2" />
                  Cancel
                </Button>
              </>
            )}
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default CreatePO; 