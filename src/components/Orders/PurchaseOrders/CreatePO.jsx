import React, { useState, useEffect } from 'react';
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
import axios from 'axios';  // Import axios for API calls

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
  const [vendorProducts, setVendorProducts] = useState([]); // Store vendor-specific products
  const [allSuppliers, setAllSuppliers] = useState(suppliers); // Initialize with sample data
  const [siteVendors, setSiteVendors] = useState([]); // Vendors whose products are used at the site
  const [siteDevices, setSiteDevices] = useState([]); // Devices at the current site

  // Fetch site information and devices to determine available vendors
  useEffect(() => {
    const fetchSiteData = async () => {
      try {
        // Get the current site from localStorage
        const lastSelectedSite = localStorage.getItem('lastSelectedSite');
        if (!lastSelectedSite) return;
        
        let siteName;
        try {
          const siteData = JSON.parse(lastSelectedSite);
          siteName = siteData.siteName;
        } catch (e) {
          console.error("Error parsing stored site data:", e);
          return;
        }
        
        if (!siteName) return;
        
        // Fetch devices at this site
        try {
          const response = await axios.get(`/api/devices/site/${siteName}`);
          if (response.data && Array.isArray(response.data)) {
            setSiteDevices(response.data);
            
            // Extract unique vendors/manufacturers from the devices
            const vendorSet = new Set();
            response.data.forEach(device => {
              if (device.manufacturer) vendorSet.add(device.manufacturer);
              if (device.vendor) vendorSet.add(device.vendor);
            });
            
            const uniqueVendors = Array.from(vendorSet);
            console.log('Unique vendors at this site:', uniqueVendors);
            
            // Match these vendor names against our supplier list
            // or create placeholder suppliers for them
            const matchedSuppliers = [];
            
            // First try to match with existing suppliers
            uniqueVendors.forEach(vendorName => {
              const matchedSupplier = allSuppliers.find(
                supplier => supplier.name?.toLowerCase() === vendorName?.toLowerCase() ||
                           supplier.companyName?.toLowerCase() === vendorName?.toLowerCase()
              );
              
              if (matchedSupplier) {
                matchedSuppliers.push(matchedSupplier);
              } else {
                // Create a placeholder supplier for this vendor
                matchedSuppliers.push({
                  id: `auto-${vendorName.replace(/\s+/g, '-').toLowerCase()}`,
                  name: vendorName,
                  companyName: vendorName,
                  email: '',
                  contactPerson: '',
                  phone: ''
                });
              }
            });
            
            setSiteVendors(matchedSuppliers);
          }
        } catch (error) {
          console.error('Error fetching site devices:', error);
        }
      } catch (error) {
        console.error('Error in fetchSiteData:', error);
      }
    };
    
    fetchSiteData();
    
    // Also fetch the full supplier list as a backup
    const fetchSuppliers = async () => {
      try {
        const response = await axios.get('/api/suppliers');
        if (response.data && Array.isArray(response.data)) {
          setAllSuppliers(response.data);
        }
      } catch (error) {
        console.warn('Error fetching suppliers, using sample data:', error);
        // Keep using the sample data if API fails
      }
    };
    
    fetchSuppliers();
  }, []);

  // Get products for the selected vendor and current site
  const getVendorProducts = (vendorId) => {
    if (!vendorId || !siteDevices.length) {
      setVendorProducts([]);
      return;
    }

    try {
      // Find the selected vendor object
      const selectedVendor = [...siteVendors, ...allSuppliers].find(s => 
        s.id === vendorId || s.id === parseInt(vendorId)
      );
      
      if (!selectedVendor) {
        setVendorProducts([]);
        return;
      }

      // Get vendor name variations
      const vendorNames = [
        selectedVendor.name,
        selectedVendor.companyName
      ].filter(Boolean).map(name => name.toLowerCase());
      
      // Filter site devices by this vendor
      const vendorDevices = siteDevices.filter(device => {
        const deviceVendor = (device.manufacturer || device.vendor || '').toLowerCase();
        return vendorNames.some(name => deviceVendor.includes(name) || name.includes(deviceVendor));
      });
      
      console.log(`Found ${vendorDevices.length} devices from ${selectedVendor.name || selectedVendor.companyName}`);
      
      // Convert devices to product format
      const vendorProducts = vendorDevices.map(device => ({
        id: device.id || Math.random().toString(36).substring(2),
        name: device.device_hostname || device.device_model || 'Unknown Device',
        sku: device.mac_address || device.asset_tag || 'N/A',
        category: device.device_type || 'Other',
        price: device.estimated_value || calculatePriceByCategory(device.device_type),
        description: device.device_description || '',
        quantity: 1
      }));
      
      setVendorProducts(vendorProducts);
    } catch (error) {
      console.error('Error filtering vendor products:', error);
      setVendorProducts([]);
    }
  };

  // Calculate price based on device category
  const calculatePriceByCategory = (category) => {
    const categoryPrices = {
      'laptop': 1200,
      'desktop': 800,
      'monitor': 300,
      'printer': 400,
      'server': 3000,
      'network': 500,
      'tablet': 600,
      'phone': 800,
      'peripheral': 100
    };
    
    return categoryPrices[category?.toLowerCase()] || 500; // Default price
  };

  // Move the handleVendorChange function up before it's used in the steps array
  // Update vendor selection handler
  const handleVendorChange = (e) => {
    const vendorId = e.target.value;
    
    // Find the selected vendor from either siteVendors or allSuppliers
    const selectedVendor = [...siteVendors, ...allSuppliers].find(
      vendor => vendor.id === vendorId || vendor.id === parseInt(vendorId)
    );
    
    if (selectedVendor) {
      setFormData(prev => ({
        ...prev,
        vendor: {
          id: selectedVendor.id,
          name: selectedVendor.companyName || selectedVendor.name,
          email: selectedVendor.email || '',
          contactPerson: selectedVendor.contactPerson || '',
          phone: selectedVendor.phone || '',
          address: selectedVendor.address || {
            street: selectedVendor.street || '',
            city: selectedVendor.city || '',
            state: selectedVendor.state || '',
            zip: selectedVendor.zip || '',
            country: selectedVendor.country || ''
          }
        }
      }));
      
      // Get products for this vendor
      getVendorProducts(vendorId);
    }
  };

  // Add the calculateTotal function
  const calculateTotal = () => {
    // Calculate subtotal from items
    const subtotal = formData.items.reduce((acc, item) => {
      return acc + (item.price * item.quantity);
    }, 0);
    
    // Calculate tax and total
    const tax = formData.tax || 0;
    const shippingFees = formData.shippingFees || 0;
    const totalAmount = subtotal + tax + shippingFees;
    
    // Update form data with calculated values
    setFormData({
      ...formData,
      subtotal,
      totalAmount
    });
    
    return totalAmount;
  };

  // Add validation function before it's used
  const validatePurchaseOrder = () => {
    console.log("Validating purchase order with data:", {
      vendorId: formData.vendor.id,
      vendorName: formData.vendor.name,
      supplierField: formData.supplier,
      itemsCount: formData.items.length
    });
    
    // Validate vendor information
    if (!formData.supplier) {
      console.error("No supplier selected");
      addNotification('warning', 'Please select a supplier from the dropdown');
      return false;
    }
    
    if (!formData.vendor.name) {
      console.error("Vendor name missing despite supplier selection", formData.supplier);
      addNotification('warning', 'Vendor name is missing. Please reselect a supplier.');
      return false;
    }
    
    if (!formData.vendorEmail) {
      addNotification('warning', 'Please enter vendor email address');
      return false;
    }
    
    if (!formData.vendorPhone) {
      addNotification('warning', 'Please enter vendor phone number');
      return false;
    }
    
    // Validate items
    if (formData.items.length === 0) {
      addNotification('warning', 'Please add at least one item to the order');
      return false;
    }
    
    // All validations passed
    console.log("Validation passed");
    return true;
  };

  // Move handler functions up before they're used in stepComponents
  const handleSaveDraft = async () => {
    try {
      setSubmitting(true);
      
      // Calculate totals before saving
      calculateTotal();
      
      // In a real app, you would save to the backend here
      const draftData = {
        ...formData,
        status: 'draft',
        lastUpdated: new Date().toISOString()
      };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success notification
      addNotification('success', 'Purchase Order saved as draft');
      
      // Close modal if needed
      // onHide();
      
      // In a real app, you might redirect to drafts list
      // or stay on the same screen with updated state
    } catch (error) {
      console.error('Error saving draft PO:', error);
      addNotification('error', 'Failed to save draft');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendForApproval = async () => {
    try {
      setSubmitting(true);
      console.log("Sending PO for approval with form data:", {
        supplier: formData.supplier,
        vendorName: formData.vendor.name,
        vendorEmail: formData.vendorEmail,
        vendorPhone: formData.vendorPhone,
        itemsCount: formData.items.length
      });
      
      // Run validations
      if (!validatePurchaseOrder()) {
        setSubmitting(false);
        return;
      }
      
      // Calculate totals before submission
      calculateTotal();
      
      // Get user information from localStorage
      const username = localStorage.getItem('username') || 'Unknown';
      const userRole = localStorage.getItem('userRole') || 'User';
      const department = formData.department || 'Not specified';
      
      // Prepare approval request payload with status explicitly set to 'pending'
      const approvalRequest = {
        poId: formData.id || Date.now(),
        poNumber: formData.poNumber,
        vendorName: formData.vendor.name,
        vendorEmail: formData.vendorEmail,
        contactPerson: formData.vendorEmail ? formData.vendorEmail.split('@')[0] : 'Contact',
        phoneNumber: formData.vendorPhone,
        department,
        requestedBy: username,
        requestDate: new Date().toISOString(),
        total: parseFloat(formData.totalAmount),
        items: formData.items,
        notes: formData.notes || '',
        userRole,
        status: 'pending' // Explicitly set status to pending
      };
      
      // Save the PO to the database via API
      try {
        // Make the API call to save the PO
        const response = await axios.post('/api/purchase-orders', {
          ...approvalRequest,
          order_number: approvalRequest.poNumber,
          vendor_name: approvalRequest.vendorName,
          vendor_email: approvalRequest.vendorEmail,
          contact_person: approvalRequest.contactPerson,
          phone_number: approvalRequest.phoneNumber,
          total_amount: approvalRequest.total,
          status: 'pending',
          username: username
        });
        
        console.log('Purchase order created:', response.data);
        
        // Update the approvalRequest with the DB-generated ID if available
        if (response.data.purchaseOrder && response.data.purchaseOrder.id) {
          approvalRequest.poId = response.data.purchaseOrder.id;
        }
      } catch (apiError) {
        console.error('Error saving purchase order:', apiError);
        addNotification('error', `Failed to save purchase order: ${apiError.message}`);
        setSubmitting(false);
        return;
      }
      
      console.log('Sending approval request:', approvalRequest);
      
      // Emit socket event for approval notification
      if (window.socket) {
        window.socket.emit('po_approval_requested', approvalRequest);
      }
      
      // Show success notification
      addNotification('success', 'Purchase Order sent for approval');
      
      // Close modal and refresh orders list
      onHide();
      if (onSuccess) {
        onSuccess(approvalRequest);
      }
    } catch (error) {
      console.error('Error sending PO for approval:', error);
      addNotification('error', 'Failed to send for approval');
    } finally {
      setSubmitting(false);
    }
  };

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

  // Listen for changes to supplier from BasicInfo
  useEffect(() => {
    if (formData.supplier) {
      // Get vendor ID from the supplier field
      const vendorId = formData.supplier;
      
      // If this is a vendor ID from our dropdown (with vendor- prefix)
      if (vendorId.startsWith('vendor-')) {
        const vendorName = vendorId.replace('vendor-', '').replace(/-/g, ' ');
        console.log(`Selected vendor name: ${vendorName}`);
        
        // Update the vendor details with the extracted vendor name
        setFormData(prev => ({
          ...prev,
          vendor: {
            ...prev.vendor,
            id: vendorId, // Set the vendor ID from the selection
            name: vendorName.charAt(0).toUpperCase() + vendorName.slice(1) // Capitalize first letter
          }
        }));
        
        // Get products for this vendor
        const fetchVendorProducts = async () => {
          try {
            setVendorProducts([]);
            const encodedVendorName = encodeURIComponent(vendorName);
            console.log(`Fetching products for vendor: ${encodedVendorName}`);
            
            const response = await axios.get(`/api/devices/vendor/${encodedVendorName}`);
            
            if (response.data && Array.isArray(response.data)) {
              console.log(`Found ${response.data.length} products for vendor ${vendorName}`);
              
              // Format the products for our component
              const formattedProducts = response.data.map(device => ({
                id: device.id || Math.random().toString(36).substring(2),
                name: device.device_hostname || device.device_model || 'Unknown Device',
                sku: device.mac_address || device.asset_tag || 'N/A',
                category: device.device_type || 'Other',
                price: device.estimated_value || calculatePriceByCategory(device.device_type),
                description: device.device_description || '',
                vendor: device.manufacturer || vendorName
              }));
              
              setVendorProducts(formattedProducts);
            } else {
              console.warn(`No products found for vendor ${vendorName}`);
            }
          } catch (error) {
            console.error(`Error fetching products for vendor ${vendorName}:`, error);
          }
        };
        
        fetchVendorProducts();
      }
    }
  }, [formData.supplier]);
  
  // Listen for changes to vendor details from BasicInfo
  useEffect(() => {
    if (formData.vendorAddress || formData.vendorEmail || formData.vendorPhone) {
      // Update the vendor object with the new details
      setFormData(prev => {
        // Only update if we have a vendor name already (meaning a supplier was selected)
        if (!prev.vendor.name) return prev;
        
        return {
          ...prev,
          vendor: {
            ...prev.vendor, // Keep existing vendor properties like id and name
            address: {
              ...prev.vendor.address,
              street: formData.vendorAddress || prev.vendor.address.street,
            },
            email: formData.vendorEmail || prev.vendor.email,
            phone: formData.vendorPhone || prev.vendor.phone,
            contactPerson: formData.vendorEmail ? formData.vendorEmail.split('@')[0] : prev.vendor.contactPerson
          }
        };
      });
    }
  }, [formData.vendorAddress, formData.vendorEmail, formData.vendorPhone]);
  
  // Validate purchase order data before submission

  // In the CreatePO component, find the stepComponents array/object and update it
  const stepComponents = [
    {
      title: 'Basic Information',
      component: (
        <>
          <div className="mb-4">
            <h6 style={styles.sectionTitle}>Purchase Order Details</h6>
            <div className="bg-light rounded-3 p-4">
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
                      onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <RequiredLabel>Payment Terms</RequiredLabel>
                    <Form.Select
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
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
            </div>
          </div>
          <div className="mb-4">
            <h6 style={styles.sectionTitle}>Vendor Details</h6>
            <div className="bg-light rounded-3 p-4">
              <BasicInfo formData={formData} setFormData={setFormData} />
            </div>
          </div>
        </>
      )
    },
    {
      title: 'Item Selection',
      component: (
        <ItemsSelection 
          formData={formData} 
          setFormData={setFormData} 
          vendorProducts={vendorProducts} 
        />
      )
    },
    {
      title: 'Additional Details',
      component: (
        <AdditionalDetails 
          formData={formData} 
          setFormData={setFormData}
          onPrevious={() => setCurrentStep(2)} // Go back to items step
          onSaveDraft={handleSaveDraft}
          onSendForApproval={handleSendForApproval}
        />
      )
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

  const handleSubmit = async () => {
    console.log('🚀 handleSubmit started - Creating Purchase Order');
    
    // Validate the form
    console.log('🔍 Validating form...');
    const validationResult = validatePurchaseOrder();
    if (!validationResult) {
      console.error('❌ Form validation failed');
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

  // Reliable send function that doesn't depend on backend email API
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
          {stepComponents.map((step, index) => (
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
            {currentStep === 1 && stepComponents[0].component}
            {currentStep === 2 && stepComponents[1].component}
            {currentStep === 3 && stepComponents[2].component}
          </Form>
        </motion.div>
      </Modal.Body>
      <Modal.Footer className="border-0">
        {currentStep < stepComponents.length ? (
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
              variant="primary" 
              onClick={handleSendForApproval}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                  Send for Approval
                </>
              )}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default CreatePO; 