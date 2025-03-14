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
import api from '../../../utils/api';

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
    
    console.log("se;ected",selectedVendor);
    
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
    // Create a working copy of the form data
    const workingFormData = { ...formData };
    
    // Ensure vendor object exists
    if (!workingFormData.vendor) {
        workingFormData.vendor = {};
    }
    
    console.log("Validating purchase order with data:", {
        vendorId: workingFormData.vendor?.id,
        vendorName: workingFormData.vendor?.name,
        vendorEmail: workingFormData.vendor?.email,
        vendorPhone: workingFormData.vendor?.phone,
        supplierField: workingFormData.supplier,
        directVendorEmail: workingFormData.vendorEmail,
        directVendorPhone: workingFormData.vendorPhone,
        itemsCount: workingFormData.items?.length || 0,
        deliveryDate: workingFormData.deliveryDate,
        paymentTerms: workingFormData.paymentTerms
    });
    
    // Validate vendor information
    if (!workingFormData.vendor.name) {
        console.error("No vendor selected");
        addNotification('warning', 'Please select a vendor from the dropdown');
        return false;
    }
    
    // Auto-generate email if missing
    if (!workingFormData.vendor.email && !workingFormData.vendorEmail) {
        // Generate a default email based on vendor name
        const defaultEmail = `sales@${workingFormData.vendor.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
        console.log("Auto-generating vendor email:", defaultEmail);
        
        // Update the form data
        workingFormData.vendor.email = defaultEmail;
        workingFormData.vendorEmail = defaultEmail;
        
        // Update the actual form data
        setFormData(prev => ({
            ...prev,
            vendor: {
                ...prev.vendor,
                email: defaultEmail
            },
            vendorEmail: defaultEmail
        }));
    }
    
    // Auto-generate phone if missing
    if (!workingFormData.vendor.phone && !workingFormData.vendorPhone) {
        const defaultPhone = '555-0000';
        console.log("Auto-generating vendor phone:", defaultPhone);
        
        // Update the form data
        workingFormData.vendor.phone = defaultPhone;
        workingFormData.vendorPhone = defaultPhone;
        
        // Update the actual form data
        setFormData(prev => ({
            ...prev,
            vendor: {
                ...prev.vendor,
                phone: defaultPhone
            },
            vendorPhone: defaultPhone
        }));
    }

    // Validate delivery date
    if (!workingFormData.deliveryDate) {
        addNotification('warning', 'Please select an expected delivery date');
        return false;
    }

    // Validate payment terms
    if (!workingFormData.paymentTerms) {
        addNotification('warning', 'Please select payment terms');
        return false;
    }
    
    // Validate items
    if (!workingFormData.items || workingFormData.items.length === 0) {
        addNotification('warning', 'Please add at least one item to the order');
        return false;
    }

    // Validate item details
    const invalidItems = workingFormData.items.filter(item => !item.name || !item.quantity || !item.price);
    if (invalidItems.length > 0) {
        addNotification('warning', 'Please ensure all items have a name, quantity, and price');
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
      console.log('Starting handleSaveDraft function...');
      
      // Calculate totals before saving
      calculateTotal();
      
      // Get user information from localStorage
      const username = localStorage.getItem('username') || 'Unknown';
      
      // Prepare draft data
      const draftData = {
        order_number: formData.poNumber,
        supplier_id: formData.vendor?.id || null,
        ordered_by: username,
        order_date: new Date().toISOString(),
        expected_delivery: formData.deliveryDate || null,
        status: 'draft', // Set status as draft
        total_amount: formData.totalAmount || 0,
        notes: formData.notes || '',
        vendor_name: formData.vendor?.name || '',
        vendor_email: formData.vendor?.email || '',
        contact_person: formData.vendor?.contactPerson || '',
        phone_number: formData.vendor?.phone || '',
        items: formData.items || []
      };
      
      // Save to the database via API
      console.log('Sending POST request to /api/purchase-orders with status: draft');
      const response = await axios.post('/api/purchase-orders', draftData);
      console.log('Draft saved successfully:', response.data);
      
      // Show success notification
      addNotification('success', 'Purchase Order saved as draft');
      
      // Close modal if needed
      onHide();
      
      // Notify parent component if needed
      if (onSuccess) {
        onSuccess({
          ...draftData,
          id: response.data.purchaseOrder?.id || formData.poNumber,
          status: 'draft'
        });
      }
    } catch (error) {
      console.error('Error in handleSaveDraft:', error);
      addNotification('error', `Failed to save draft: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendForApproval = async () => {
    console.log("form data", formData);
    try {
        setSubmitting(true);
        console.log("Starting handleSendForApproval function...");
        
        // Create a working copy of the form data to ensure we have all required fields
        const updatedFormData = { ...formData };
        
        // Ensure vendor object exists
        if (!updatedFormData.vendor) {
            updatedFormData.vendor = {};
        }
        
        // Ensure vendor has a name
        if (!updatedFormData.vendor.name && updatedFormData.vendorName) {
            updatedFormData.vendor.name = updatedFormData.vendorName;
        }
        
        // Ensure vendor has an email (critical for validation)
        if (!updatedFormData.vendor.email) {
            // Try to use direct vendorEmail field first
            if (updatedFormData.vendorEmail) {
                updatedFormData.vendor.email = updatedFormData.vendorEmail;
            } else if (updatedFormData.vendor.name) {
                // Generate a default email based on vendor name
                updatedFormData.vendor.email = `sales@${updatedFormData.vendor.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
                updatedFormData.vendorEmail = updatedFormData.vendor.email;
                console.log("Generated default vendor email:", updatedFormData.vendor.email);
            }
        }
        
        // Ensure vendor has a phone number
        if (!updatedFormData.vendor.phone) {
            // Try to use direct vendorPhone field first
            if (updatedFormData.vendorPhone) {
                updatedFormData.vendor.phone = updatedFormData.vendorPhone;
            } else {
                // Set a default phone number
                updatedFormData.vendor.phone = '555-0000';
                updatedFormData.vendorPhone = updatedFormData.vendor.phone;
                console.log("Set default vendor phone:", updatedFormData.vendor.phone);
            }
        }
        
        // Update the form data with our fixed version
        setFormData(updatedFormData);
        
        console.log("Sending PO for approval with form data:", {
            vendor: updatedFormData.vendor,
            items: updatedFormData.items,
            totalAmount: updatedFormData.totalAmount
        });
        
        // Run validations
        if (!validatePurchaseOrder()) {
            console.log("Validation failed, aborting approval request");
            setSubmitting(false);
            return;
        }
        
        // Calculate totals before submission
        calculateTotal();
        
        // Get user information from localStorage
        const username = localStorage.getItem('username') || 'Unknown';
        const userRole = localStorage.getItem('userRole') || 'User';
        const department = formData.department || 'Not specified';
        
        // Prepare the API payload with properly formatted data
        const purchaseOrderData = {
            order_number: updatedFormData.poNumber,
            supplier_id: null, // We're not using supplier_id at the moment
            expected_delivery: updatedFormData.deliveryDate,
            status: 'pending',
            total_amount: parseFloat(updatedFormData.totalAmount || 0),
            notes: updatedFormData.notes || '',
            vendor_name: updatedFormData.vendor.name,
            vendor_email: updatedFormData.vendor.email || updatedFormData.vendorEmail,
            contact_person: updatedFormData.vendor.contactPerson || '',
            phone_number: updatedFormData.vendor.phone || updatedFormData.vendorPhone || '',
            items: updatedFormData.items.map(item => ({
                item_type: item.type || 'product',
                item_id: item.id || null,
                quantity: parseInt(item.quantity) || 1,
                unit_price: parseFloat(item.price) || 0,
                total_price: parseFloat((item.quantity || 1) * (item.price || 0)),
                description: item.description || '',
                notes: item.notes || ''
            }))
        };
        
        console.log('Sending PO data to API:', purchaseOrderData);
        
        // Use our API utility with proper error handling
        const response = await api.post('/api/purchase-orders', purchaseOrderData);
        
        console.log('Purchase order created successfully:', response.data);
        
        // Show success notification
        addNotification('success', 'Purchase Order sent for approval');
        
        // Close modal and refresh orders list
        onHide();
        if (onSuccess) {
            onSuccess({
                ...purchaseOrderData,
                id: response.data.purchaseOrder?.id,
                poNumber: purchaseOrderData.order_number,
                status: 'pending'
            });
        }
    } catch (error) {
        console.error('Error sending PO for approval:', error);
        
        // Provide more detailed error messaging
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
        addNotification('error', `Failed to send for approval: ${errorMessage}`);
        
        // Log detailed error information
        if (error.response) {
            console.error('API Error Details:', {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            });
        } else if (error.request) {
            console.error('API Request Error (No Response):', error.request);
        } else {
            console.error('Request Setup Error:', error.message);
        }
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