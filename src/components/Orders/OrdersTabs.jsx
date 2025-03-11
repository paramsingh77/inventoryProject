import React, { useState, useEffect } from 'react';
import { 
    Table, 
    Button, 
    Badge, 
    Modal, 
    Form, 
    Row, 
    Col,
    InputGroup,
    Nav,
    Tab,
    Card
} from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faPlus, 
    faEdit, 
    faTrash, 
    faEye,
    faFileInvoice,
    faPaperPlane,
    faCheck,
    faTimes,
    faSearch,
    faFilter,
    faArrowRight,
    faArrowLeft,
    faShoppingCart,
    faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const OrdersTabs = () => {
    const [orders, setOrders] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeStep, setActiveStep] = useState(1);
    const [newOrder, setNewOrder] = useState({
        // Basic Info
        poNumber: '',
        department: '',
        requestDate: new Date().toISOString().split('T')[0],
        priority: 'normal',
        
        // Vendor Info
        vendorName: '',
        vendorEmail: '',
        contactPerson: '',
        phoneNumber: '',
        
        // Items
        selectedDevices: [],
        customItems: [],
        
        // Additional Info
        notes: '',
        status: 'draft'
    });

    // Mock vendor devices with vendor information
    const [vendorDevices, setVendorDevices] = useState([
        { 
            id: 1, 
            name: 'Laptop HP EliteBook', 
            price: 1299.99, 
            category: 'Laptops',
            vendor: 'HP',
            sku: 'HP-LT-001'
        },
        { 
            id: 2, 
            name: 'HP Monitor 27"', 
            price: 299.99, 
            category: 'Monitors',
            vendor: 'HP',
            sku: 'HP-MN-001'
        },
        { 
            id: 3, 
            name: 'HP LaserJet Pro', 
            price: 399.99, 
            category: 'Printers',
            vendor: 'HP',
            sku: 'HP-PR-001'
        },
        { 
            id: 4, 
            name: 'Dell XPS 13', 
            price: 1499.99, 
            category: 'Laptops',
            vendor: 'Dell',
            sku: 'DL-LT-001'
        },
        { 
            id: 5, 
            name: 'Dell UltraSharp Monitor', 
            price: 449.99, 
            category: 'Monitors',
            vendor: 'Dell',
            sku: 'DL-MN-001'
        },
        { 
            id: 6, 
            name: 'Lenovo ThinkPad X1', 
            price: 1399.99, 
            category: 'Laptops',
            vendor: 'Lenovo',
            sku: 'LN-LT-001'
        },
        { 
            id: 7, 
            name: 'Lenovo Monitor', 
            price: 279.99, 
            category: 'Monitors',
            vendor: 'Lenovo',
            sku: 'LN-MN-001'
        }
    ]);

    // Add these new states after the existing state declarations
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [inventoryProducts, setInventoryProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [vendors, setVendors] = useState(['Dell', 'HP', 'Lenovo', 'Apple', 'Microsoft', 'VMware', 'ASUS', 'Custom Build']);

    // Add new state for bulk selection
    const [allSelected, setAllSelected] = useState(false);

    // Mock data for demonstration
    useEffect(() => {
        setOrders([
            {
                id: 1,
                poNumber: 'PO-2024-001',
                vendorName: 'Tech Supplies Inc.',
                date: '2024-03-10',
                status: 'pending',
                total: 1500.00
            },
            {
                id: 2,
                poNumber: 'PO-2024-002',
                vendorName: 'Office Solutions Ltd.',
                date: '2024-03-11',
                status: 'approved',
                total: 2300.50
            },
            {
                id: 3,
                poNumber: 'PO-2024-003',
                vendorName: 'Hardware Plus',
                date: '2024-03-12',
                status: 'draft',
                total: 850.75
            },
            {
                id: 4,
                poNumber: 'PO-2024-004',
                vendorName: 'Global Electronics',
                date: '2024-03-13',
                status: 'sent',
                total: 3200.00
            },
            {
                id: 5,
                poNumber: 'PO-2024-005',
                vendorName: 'IT Supplies Co.',
                date: '2024-03-14',
                status: 'rejected',
                total: 1750.25
            }
        ]);
    }, []);

    // Add this function to fetch inventory data
    const fetchInventoryProducts = async () => {
        try {
            setLoading(true);
            console.log("Fetching inventory products...");
            
            let products = [];
            try {
                const response = await axios.get('/api/devices/all');
                console.log("API Response:", response.data?.length || 0, "devices found");
                
                // Extract vendor from device_model more accurately
                products = response.data.map(device => {
                    // More accurate vendor extraction logic
                    let vendor = 'Unknown';
                    const model = device.device_model || '';
                    
                    // Standard vendor detection
                    if (model.toLowerCase().includes('dell') || 
                        model.toLowerCase().includes('optiplex') || 
                        model.toLowerCase().includes('latitude') || 
                        model.toLowerCase().includes('inspiron') || 
                        model.toLowerCase().includes('vostro')) {
                        vendor = 'Dell';
                    } else if (model.toLowerCase().includes('hp') || 
                        model.toLowerCase().includes('elitebook') || 
                        model.toLowerCase().includes('compaq') || 
                        model.toLowerCase().includes('probook') || 
                        model.toLowerCase().includes('prodesk')) {
                        vendor = 'HP';
                    } else if (model.toLowerCase().includes('lenovo') || 
                        model.toLowerCase().includes('thinkpad') || 
                        model.toLowerCase().includes('thinkcentre') || 
                        model.toLowerCase().includes('12e3') ||
                        model.toLowerCase().includes('20tds')) {
                        vendor = 'Lenovo';
                    } else if (model.toLowerCase().includes('vmware') || 
                        model.toLowerCase().includes('virtual platform')) {
                        vendor = 'VMware';
                    } else if (model.toLowerCase().includes('apple') || 
                        model.toLowerCase().includes('mac')) {
                        vendor = 'Apple';
                    } else if (model.toLowerCase().includes('microsoft') || 
                        model.toLowerCase().includes('surface')) {
                        vendor = 'Microsoft';
                    } else if (model.toLowerCase().includes('asus')) {
                        vendor = 'ASUS';
                    } else if (model.toLowerCase().includes('stealth')) {
                        vendor = 'Custom Build';
                    }
                    
                    // Calculate a unit price based on device type (for demo purposes)
                    let price = 0;
                    if (device.device_type?.toLowerCase().includes('laptop')) {
                        price = 1200 + Math.floor(Math.random() * 800);
                    } else if (device.device_type?.toLowerCase().includes('desktop')) {
                        price = 800 + Math.floor(Math.random() * 600);
                    } else if (device.device_type?.toLowerCase().includes('server')) {
                        price = 2500 + Math.floor(Math.random() * 1500);
                    } else if (device.device_type?.toLowerCase().includes('virtual')) {
                        price = 400 + Math.floor(Math.random() * 300);
                    } else {
                        price = 500 + Math.floor(Math.random() * 500);
                    }
                    
                    return {
                        id: device.id,
                        sku: device.serial_number || `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                        name: device.device_hostname || 'Unnamed Device',
                        model: device.device_model || 'Unknown Model',
                        fullName: `${device.device_model || 'Unknown'} - ${device.device_hostname || 'Unnamed'}`,
                        category: device.device_type || 'Unknown Type',
                        price: price,
                        vendor: vendor,
                        quantity: 0,
                        description: device.device_description || `${vendor} ${device.device_model || 'Device'}`,
                        status: device.status || 'active',
                        specs: `${device.device_cpu || ''} ${device.operating_system || ''}`.trim() || 'No specifications available'
                    };
                });
            } catch (apiError) {
                console.error("API Error:", apiError);
                // Use fallback mock data if API fails
                products = vendorDevices;
            }
            
            console.log("Total products after processing:", products.length);
            setInventoryProducts(products);
            setFilteredProducts(products);
            
            // Extract unique vendors for the dropdown, but keep existing default vendors
            if (products.length > 0) {
                const productVendors = [...new Set(products.map(p => p.vendor))].filter(v => v && v !== 'Unknown').sort();
                console.log("Extracted vendors:", productVendors);
                
                // Combine with existing vendors but remove duplicates
                const uniqueVendors = [...new Set([...vendors, ...productVendors])].sort();
                console.log("Final vendor list:", uniqueVendors);
                setVendors(uniqueVendors);
            }
        } catch (error) {
            console.error('Error in fetchInventoryProducts:', error);
            // Fallback to mock data if there's an error
            setInventoryProducts(vendorDevices);
            setFilteredProducts(vendorDevices);
        } finally {
            setLoading(false);
        }
    };

    // Add useEffect to fetch data when component mounts
    useEffect(() => {
        fetchInventoryProducts();
    }, []);

    // Add this function to filter products
    const filterProducts = (searchTerm, vendorName) => {
        return inventoryProducts.filter(product => {
            const matchesSearch = !searchTerm || 
                (product.name?.toLowerCase() || '').includes((searchTerm || '').toLowerCase()) ||
                (product.sku?.toLowerCase() || '').includes((searchTerm || '').toLowerCase()) ||
                (product.category?.toLowerCase() || '').includes((searchTerm || '').toLowerCase()) ||
                (product.model?.toLowerCase() || '').includes((searchTerm || '').toLowerCase()) ||
                (product.specs?.toLowerCase() || '').includes((searchTerm || '').toLowerCase()) ||
                (product.description?.toLowerCase() || '').includes((searchTerm || '').toLowerCase());
            
            const matchesVendor = !vendorName || 
                ((product.vendor || '').toLowerCase() === (vendorName || '').toLowerCase());
            
            return matchesSearch && matchesVendor;
        });
    };

    // Add this effect to handle search and filtering
    useEffect(() => {
        const filtered = filterProducts(productSearchTerm, newOrder.vendorName);
        setFilteredProducts(filtered);
    }, [productSearchTerm, newOrder.vendorName, inventoryProducts]);

    const handleCreateOrder = (e) => {
        e.preventDefault();
        const total = newOrder.selectedDevices.reduce((sum, device) => 
            sum + (device.price * device.quantity), 0) +
            newOrder.customItems.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0);

        const order = {
            id: orders.length + 1,
            poNumber: `PO-2024-${String(orders.length + 1).padStart(3, '0')}`,
            vendorName: newOrder.vendorName,
            date: new Date().toISOString().split('T')[0],
            status: 'draft',
            total
        };

        setOrders([...orders, order]);
        setShowCreateModal(false);
        resetNewOrder();
    };

    const resetNewOrder = () => {
        setNewOrder({
            poNumber: '',
            department: '',
            requestDate: new Date().toISOString().split('T')[0],
            priority: 'normal',
            vendorName: '',
            vendorEmail: '',
            contactPerson: '',
            phoneNumber: '',
            selectedDevices: [],
            customItems: [],
            notes: '',
            status: 'draft'
        });
    };

    const handleDeviceSelection = (deviceId, isSelected) => {
        if (isSelected) {
            // Find the device from filteredProducts instead of vendorDevices
            const device = filteredProducts.find(d => d.id === deviceId);
            if (device) {
                setNewOrder(prev => ({
                    ...prev,
                    selectedDevices: [...prev.selectedDevices, { ...device, quantity: 0 }]
                }));
            }
        } else {
            setNewOrder(prev => ({
                ...prev,
                selectedDevices: prev.selectedDevices.filter(d => d.id !== deviceId)
            }));
        }
    };

    // Add this function to handle selecting/deselecting all products
    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        setAllSelected(isChecked);
        
        if (isChecked) {
            // Select all filtered products
            const productsToAdd = filteredProducts
                .filter(product => !newOrder.selectedDevices.some(d => d.id === product.id))
                .map(product => ({ ...product, quantity: 0 }));
            
            setNewOrder(prev => ({
                ...prev,
                selectedDevices: [...prev.selectedDevices, ...productsToAdd]
            }));
        } else {
            // Deselect all products
            setNewOrder(prev => ({
                ...prev,
                selectedDevices: []
            }));
        }
    };

    // Fix the updateDeviceQuantity function to handle possible NaN values
    const updateDeviceQuantity = (deviceId, quantity) => {
        // Ensure quantity is a valid number, defaulting to 0 if NaN
        const validQuantity = isNaN(quantity) ? 0 : quantity;
        
        setNewOrder(prev => ({
            ...prev,
            selectedDevices: prev.selectedDevices.map(device =>
                device.id === deviceId ? { ...device, quantity: validQuantity } : device
            )
        }));
    };

    const addCustomItem = () => {
        setNewOrder(prev => ({
            ...prev,
            customItems: [...prev.customItems, { description: '', quantity: 0, price: 0 }]
        }));
    };

    const updateCustomItem = (index, field, value) => {
        setNewOrder(prev => ({
            ...prev,
            customItems: prev.customItems.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const removeCustomItem = (index) => {
        setNewOrder(prev => ({
            ...prev,
            customItems: prev.customItems.filter((_, i) => i !== index)
        }));
    };

    const calculateTotals = () => {
        const deviceTotal = newOrder.selectedDevices.reduce(
            (sum, device) => sum + (device.price * device.quantity), 0
        );
        const customTotal = newOrder.customItems.reduce(
            (sum, item) => sum + (item.price * item.quantity), 0
        );
        const subtotal = deviceTotal + customTotal;
        const tax = subtotal * 0.10; // 10% tax
        const total = subtotal + tax;
        
        return { subtotal, tax, total };
    };

    const getStatusBadge = (status) => {
        const variants = {
            draft: 'secondary',
            pending: 'primary',
            approved: 'success',
            rejected: 'danger',
            sent: 'info'
        };
        return (
            <Badge bg={variants[status] || 'secondary'} className="px-3 py-2">
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'all' || order.status === activeTab;
        return matchesSearch && matchesTab;
    });

    // Function to handle step navigation
    const handleNextStep = () => {
        setActiveStep(prev => Math.min(prev + 1, 3));
    };

    const handlePrevStep = () => {
        setActiveStep(prev => Math.max(prev - 1, 1));
    };

    // Function to check if current step is valid
    const isStepValid = () => {
        switch (activeStep) {
            case 1:
                return newOrder.department && newOrder.vendorName && newOrder.vendorEmail;
            case 2:
                return (newOrder.selectedDevices.length > 0 || newOrder.customItems.length > 0) &&
                       calculateTotals().total > 0;
            case 3:
                return true;
            default:
                return false;
        }
    };

    // Add this after the isStepValid function
    const getVendorProducts = (vendorName) => {
        return vendorDevices.filter(device => 
            device.vendor.toLowerCase() === vendorName.toLowerCase()
        );
    };

    // Update the vendor name change handler in the form
    const handleVendorChange = (e) => {
        const vendorName = e.target.value;
        setNewOrder(prev => ({
            ...prev,
            vendorName,
            selectedDevices: [] // Reset selected devices when vendor changes
        }));
    };

    return (
        <div className="bg-white p-4 rounded-3 shadow-sm">
            {/* Search and Filter Bar */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center">
                    <InputGroup style={{ width: '300px' }}>
                        <Form.Control
                            type="text"
                            placeholder="Search PO number or vendor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border-end-0"
                        />
                        <InputGroup.Text className="bg-white border-start-0">
                            <FontAwesomeIcon icon={faSearch} className="text-primary" />
                        </InputGroup.Text>
                    </InputGroup>
                </div>
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Button 
                        variant="primary" 
                        onClick={() => setShowCreateModal(true)}
                        className="d-flex align-items-center px-4"
                    >
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Create Purchase Order
                    </Button>
                </motion.div>
            </div>

            {/* Status Tabs */}
            <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                <Nav className="mb-4 border-bottom">
                    <Nav.Item>
                        <Nav.Link 
                            eventKey="all" 
                            className={`border-0 px-4 ${activeTab === 'all' ? 'text-primary fw-medium' : 'text-secondary'}`}
                        >
                            All Orders
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link 
                            eventKey="draft" 
                            className={`border-0 px-4 ${activeTab === 'draft' ? 'text-primary fw-medium' : 'text-secondary'}`}
                        >
                            Drafts
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link 
                            eventKey="pending" 
                            className={`border-0 px-4 ${activeTab === 'pending' ? 'text-primary fw-medium' : 'text-secondary'}`}
                        >
                            Pending
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link 
                            eventKey="approved" 
                            className={`border-0 px-4 ${activeTab === 'approved' ? 'text-primary fw-medium' : 'text-secondary'}`}
                        >
                            Approved
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link 
                            eventKey="sent" 
                            className={`border-0 px-4 ${activeTab === 'sent' ? 'text-primary fw-medium' : 'text-secondary'}`}
                        >
                            Sent
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link 
                            eventKey="rejected" 
                            className={`border-0 px-4 ${activeTab === 'rejected' ? 'text-primary fw-medium' : 'text-secondary'}`}
                        >
                            Rejected
                        </Nav.Link>
                    </Nav.Item>
                </Nav>

                <Tab.Content>
                    <Tab.Pane eventKey={activeTab}>
                        <Card className="border-0">
                            <Card.Body className="p-0">
                                <Table responsive hover className="align-middle mb-0">
                                    <thead>
                                        <tr className="bg-light">
                                            <th className="border-bottom py-3">PO Number</th>
                                            <th className="border-bottom py-3">Vendor</th>
                                            <th className="border-bottom py-3">Date</th>
                                            <th className="border-bottom py-3">Status</th>
                                            <th className="border-bottom py-3">Total</th>
                                            <th className="border-bottom py-3 text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.map(order => (
                                            <motion.tr
                                                key={order.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <td className="fw-medium text-primary">{order.poNumber}</td>
                                                <td>{order.vendorName}</td>
                                                <td>{order.date}</td>
                                                <td>{getStatusBadge(order.status)}</td>
                                                <td className="fw-medium">${order.total.toFixed(2)}</td>
                                                <td>
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <Button 
                                                            variant="light" 
                                                            size="sm"
                                                            title="View Details"
                                                            className="border-0"
                                                        >
                                                            <FontAwesomeIcon icon={faEye} className="text-primary" />
                                                        </Button>
                                                        {order.status === 'pending' && (
                                                            <Button 
                                                                variant="light" 
                                                                size="sm"
                                                                title="Approve"
                                                                className="border-0"
                                                            >
                                                                <FontAwesomeIcon icon={faCheck} className="text-success" />
                                                            </Button>
                                                        )}
                                                        {order.status === 'approved' && (
                                                            <Button 
                                                                variant="light" 
                                                                size="sm"
                                                                title="Send to Vendor"
                                                                className="border-0"
                                                            >
                                                                <FontAwesomeIcon icon={faPaperPlane} className="text-info" />
                                                            </Button>
                                                        )}
                                                        {order.status === 'draft' && (
                                                            <>
                                                                <Button 
                                                                    variant="light" 
                                                                    size="sm"
                                                                    title="Edit"
                                                                    className="border-0"
                                                                >
                                                                    <FontAwesomeIcon icon={faEdit} className="text-warning" />
                                                                </Button>
                                                                <Button 
                                                                    variant="light" 
                                                                    size="sm"
                                                                    title="Delete"
                                                                    className="border-0"
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} className="text-danger" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </Table>
                                {filteredOrders.length === 0 && (
                                    <div className="text-center py-5">
                                        <p className="text-muted mb-0">No purchase orders found</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Tab.Pane>
                </Tab.Content>
            </Tab.Container>

            {/* Create PO Modal */}
            <Modal 
                show={showCreateModal} 
                onHide={() => {
                    setShowCreateModal(false);
                    setActiveStep(1);
                }}
                size="lg"
                dialogClassName="modal-90w"
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="text-primary h5">Create Purchase Order</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-2">
                    {/* Progress Steps */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        position: 'relative',
                        padding: '0 1rem',
                        marginBottom: '2rem'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '20px',
                            left: '0',
                            right: '0',
                            height: '2px',
                            background: '#e9ecef',
                            zIndex: 1
                        }}></div>
                        {[
                            { step: 1, title: 'Basic Information' },
                            { step: 2, title: 'Order Items' },
                            { step: 3, title: 'Review & Submit' }
                        ].map(({ step, title }) => (
                            <motion.div
                                key={step}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    position: 'relative',
                                    zIndex: 2,
                                    background: '#fff',
                                    padding: '0 1rem'
                                }}
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    border: '2px solid',
                                    borderColor: activeStep === step ? '#0d6efd' : 
                                               activeStep > step ? '#198754' : '#dee2e6',
                                    color: activeStep === step ? '#0d6efd' : 
                                          activeStep > step ? '#198754' : '#6c757d',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '0.5rem',
                                    fontWeight: '600',
                                    fontSize: '1rem',
                                    backgroundColor: '#ffffff'
                                }}>
                                    {activeStep > step ? (
                                        <FontAwesomeIcon icon={faCheck} className="text-success" />
                                    ) : (
                                        <span>{step}</span>
                                    )}
                                </div>
                                <div style={{
                                    fontSize: '0.9rem',
                                    color: activeStep === step ? '#0d6efd' : 
                                          activeStep > step ? '#198754' : '#6c757d',
                                    fontWeight: activeStep === step ? '500' : '400'
                                }}>
                                    {title}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <Form onSubmit={handleCreateOrder}>
                        {/* Step 1: Basic & Vendor Information */}
                        {activeStep === 1 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="mb-4">
                                    <h6 className="mb-3 fw-medium">Basic & Vendor Information</h6>
                                    <div className="bg-light rounded-3 p-4">
                                        <Row className="g-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Department</Form.Label>
                                                    <Form.Select
                                                        value={newOrder.department}
                                                        onChange={(e) => setNewOrder({
                                                            ...newOrder,
                                                            department: e.target.value
                                                        })}
                                                        required
                                                    >
                                                        <option value="">Select department</option>
                                                        <option value="it">IT</option>
                                                        <option value="hr">HR</option>
                                                        <option value="finance">Finance</option>
                                                        <option value="operations">Operations</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Priority</Form.Label>
                                                    <Form.Select
                                                        value={newOrder.priority}
                                                        onChange={(e) => setNewOrder({
                                                            ...newOrder,
                                                            priority: e.target.value
                                                        })}
                                                    >
                                                        <option value="normal">Normal</option>
                                                        <option value="high">High</option>
                                                        <option value="urgent">Urgent</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Vendor Name</Form.Label>
                                                    <Form.Select
                                                        value={newOrder.vendorName}
                                                        onChange={handleVendorChange}
                                                        required
                                                    >
                                                        <option value="">Select Vendor</option>
                                                        {vendors.map(vendor => (
                                                            <option key={vendor} value={vendor}>{vendor}</option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Vendor Email</Form.Label>
                                                    <Form.Control
                                                        type="email"
                                                        value={newOrder.vendorEmail}
                                                        onChange={(e) => setNewOrder({
                                                            ...newOrder,
                                                            vendorEmail: e.target.value
                                                        })}
                                                        required
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Contact Person</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={newOrder.contactPerson}
                                                        onChange={(e) => setNewOrder({
                                                            ...newOrder,
                                                            contactPerson: e.target.value
                                                        })}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Phone Number</Form.Label>
                                                    <Form.Control
                                                        type="tel"
                                                        value={newOrder.phoneNumber}
                                                        onChange={(e) => setNewOrder({
                                                            ...newOrder,
                                                            phoneNumber: e.target.value
                                                        })}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Order Items */}
                        {activeStep === 2 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="mb-4">
                                    <h6 className="mb-3 fw-medium">Order Items</h6>
                                    <div className="bg-light rounded-3 p-4">
                                        {/* Vendor Devices Selection */}
                                        <div className="mb-4">
                                            <h6 className="mb-3">Available {newOrder.vendorName} Products</h6>
                                            
                                            {/* Add search bar */}
                                            <div className="mb-3">
                                                <InputGroup>
                                                    <InputGroup.Text className="bg-white">
                                                        <FontAwesomeIcon icon={faSearch} className="text-muted" />
                                                    </InputGroup.Text>
                                                    <Form.Control
                                                        placeholder="Search by model, hostname, specs, or serial number..."
                                                        value={productSearchTerm}
                                                        onChange={(e) => setProductSearchTerm(e.target.value)}
                                                    />
                                                </InputGroup>
                                            </div>

                                            <div className="table-responsive">
                                                <Table hover>
                                                    <thead className="bg-light">
                                                        <tr>
                                                            <th>
                                                                <Form.Check
                                                                    type="checkbox"
                                                                    onChange={handleSelectAll}
                                                                    checked={allSelected}
                                                                    label="Select All"
                                                                />
                                                            </th>
                                                            <th>SKU/Serial</th>
                                                            <th>Device Info</th>
                                                            <th>Type</th>
                                                            <th>Price ($)</th>
                                                            <th>Quantity</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {loading ? (
                                                            <tr>
                                                                <td colSpan="6" className="text-center py-4">
                                                                    <div className="d-flex justify-content-center">
                                                                        <div className="spinner-border text-primary" role="status">
                                                                            <span className="visually-hidden">Loading products...</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-2">Loading products...</div>
                                                                </td>
                                                            </tr>
                                                        ) : newOrder.vendorName ? (
                                                            filteredProducts.length > 0 ? (
                                                                filteredProducts.map(product => (
                                                                    <tr key={product.id}>
                                                                        <td>
                                                                            <Form.Check
                                                                                type="checkbox"
                                                                                onChange={(e) => handleDeviceSelection(product.id, e.target.checked)}
                                                                                checked={newOrder.selectedDevices.some(d => d.id === product.id)}
                                                                                disabled={product.status !== 'active'}
                                                                            />
                                                                        </td>
                                                                        <td>{product.sku}</td>
                                                                        <td>
                                                                            <div className="fw-medium">{product.name}</div>
                                                                            <small className="text-muted d-block">
                                                                                <span className="fw-medium">Model:</span> {product.model}
                                                                            </small>
                                                                            <small className="text-muted d-block">{product.specs}</small>
                                                                        </td>
                                                                        <td>
                                                                            <Badge 
                                                                                bg={
                                                                                    product.category?.toLowerCase().includes('laptop') ? 'info' :
                                                                                    product.category?.toLowerCase().includes('desktop') ? 'primary' :
                                                                                    product.category?.toLowerCase().includes('server') ? 'danger' :
                                                                                    'secondary'
                                                                                }
                                                                                className="text-white"
                                                                            >
                                                                                {product.category}
                                                                            </Badge>
                                                                        </td>
                                                                        <td className="fw-medium">${product.price.toFixed(2)}</td>
                                                                        <td style={{ width: '120px' }}>
                                                                            <Form.Control
                                                                                type="number"
                                                                                min="0"
                                                                                value={newOrder.selectedDevices.find(d => d.id === product.id)?.quantity || 0}
                                                                                onChange={(e) => {
                                                                                    // Convert to number and handle NaN
                                                                                    const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                                                                                    updateDeviceQuantity(product.id, value);
                                                                                }}
                                                                                disabled={!newOrder.selectedDevices.some(d => d.id === product.id)}
                                                                                size="sm"
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan="6" className="text-center py-4">
                                                                        <div className="mb-2">
                                                                            <FontAwesomeIcon icon={faSearch} className="text-muted me-2" size="lg" />
                                                                        </div>
                                                                        No products found matching your search
                                                                    </td>
                                                                </tr>
                                                            )
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="6" className="text-center py-4">
                                                                    <div className="mb-2">
                                                                        <FontAwesomeIcon icon={faInfoCircle} className="text-primary me-2" size="lg" />
                                                                    </div>
                                                                    Please select a vendor to view available products
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </div>

                                        {/* Custom Items */}
                                        <div>
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h6 className="mb-0">Custom Items</h6>
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="sm"
                                                    onClick={addCustomItem}
                                                >
                                                    <FontAwesomeIcon icon={faPlus} className="me-1" />
                                                    Add Custom Item
                                                </Button>
                                            </div>
                                            {newOrder.customItems.map((item, index) => (
                                                <Row key={index} className="mb-3 align-items-end">
                                                    <Col md={5}>
                                                        <Form.Group>
                                                            <Form.Label>Description</Form.Label>
                                                            <Form.Control
                                                                placeholder="Item description"
                                                                value={item.description}
                                                                onChange={(e) => updateCustomItem(index, 'description', e.target.value)}
                                                                required
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={3}>
                                                        <Form.Group>
                                                            <Form.Label>Quantity</Form.Label>
                                                            <Form.Control
                                                                type="number"
                                                                min="0"
                                                                value={item.quantity}
                                                                onChange={(e) => updateCustomItem(index, 'quantity', parseInt(e.target.value))}
                                                                required
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={3}>
                                                        <Form.Group>
                                                            <Form.Label>Unit Price ($)</Form.Label>
                                                            <Form.Control
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={item.price}
                                                                onChange={(e) => updateCustomItem(index, 'price', parseFloat(e.target.value))}
                                                                required
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={1}>
                                                        <Button 
                                                            variant="outline-danger" 
                                                            size="sm"
                                                            onClick={() => removeCustomItem(index)}
                                                            className="w-100"
                                                        >
                                                            <FontAwesomeIcon icon={faTimes} />
                                                        </Button>
                                                    </Col>
                                                </Row>
                                            ))}
                                        </div>

                                        {/* Order Summary */}
                                        <div className="mt-4">
                                            <Row>
                                                <Col md={8}></Col>
                                                <Col md={4}>
                                                    <div className="border-top pt-2">
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Subtotal:</span>
                                                            <span>${calculateTotals().subtotal.toFixed(2)}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Tax (10%):</span>
                                                            <span>${calculateTotals().tax.toFixed(2)}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between fw-bold">
                                                            <span>Total:</span>
                                                            <span>${calculateTotals().total.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Review & Submit */}
                        {activeStep === 3 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="mb-4">
                                    <h6 className="mb-3 fw-medium">Review Your Order</h6>
                                    <div className="bg-light rounded-3 p-4">
                                        <Row className="mb-4">
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <h6 className="mb-2">Basic Information</h6>
                                                    <div className="bg-white rounded-3 p-3">
                                                        <p className="mb-1"><strong>Department:</strong> {newOrder.department}</p>
                                                        <p className="mb-1"><strong>Request Date:</strong> {newOrder.requestDate}</p>
                                                        <p className="mb-0"><strong>Priority:</strong> {newOrder.priority}</p>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div>
                                                    <h6 className="mb-2">Vendor Information</h6>
                                                    <div className="bg-white rounded-3 p-3">
                                                        <p className="mb-1"><strong>Vendor:</strong> {newOrder.vendorName}</p>
                                                        <p className="mb-1"><strong>Email:</strong> {newOrder.vendorEmail}</p>
                                                        <p className="mb-1"><strong>Contact Person:</strong> {newOrder.contactPerson || 'Not specified'}</p>
                                                        <p className="mb-0"><strong>Phone:</strong> {newOrder.phoneNumber || 'Not specified'}</p>
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>

                                        <div className="mb-4">
                                            <h6 className="mb-2">Selected Items</h6>
                                            <div className="bg-white rounded-3 p-3">
                                                <Table className="table-borderless mb-0">
                                                    <thead>
                                                        <tr>
                                                            <th>Item</th>
                                                            <th>Quantity</th>
                                                            <th>Unit Price</th>
                                                            <th className="text-end">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {newOrder.selectedDevices.map((device, index) => (
                                                            <tr key={`device-${index}`}>
                                                                <td>
                                                                    <div>{device.name}</div>
                                                                    <small className="text-muted d-block">
                                                                        Model: {device.model} | Type: {device.category} | SKU: {device.sku}
                                                                    </small>
                                                                </td>
                                                                <td>{device.quantity}</td>
                                                                <td>${device.price.toFixed(2)}</td>
                                                                <td className="text-end">${(device.price * device.quantity).toFixed(2)}</td>
                                                            </tr>
                                                        ))}
                                                        {newOrder.customItems.map((item, index) => (
                                                            <tr key={`custom-${index}`}>
                                                                <td>
                                                                    <div>{item.description}</div>
                                                                    <small className="text-muted">Custom Item</small>
                                                                </td>
                                                                <td>{item.quantity}</td>
                                                                <td>${item.price.toFixed(2)}</td>
                                                                <td className="text-end">${(item.price * item.quantity).toFixed(2)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="border-top">
                                                        <tr>
                                                            <td colSpan="3" className="text-end"><strong>Subtotal:</strong></td>
                                                            <td className="text-end">${calculateTotals().subtotal.toFixed(2)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td colSpan="3" className="text-end"><strong>Tax (10%):</strong></td>
                                                            <td className="text-end">${calculateTotals().tax.toFixed(2)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                                                            <td className="text-end"><strong>${calculateTotals().total.toFixed(2)}</strong></td>
                                                        </tr>
                                                    </tfoot>
                                                </Table>
                                            </div>
                                        </div>

                                        <div>
                                            <h6 className="mb-2">Notes</h6>
                                            <div className="bg-white rounded-3 p-3">
                                                <Form.Control
                                                    as="textarea"
                                                    rows={3}
                                                    placeholder="Add any additional notes for this purchase order..."
                                                    value={newOrder.notes}
                                                    onChange={(e) => setNewOrder({
                                                        ...newOrder,
                                                        notes: e.target.value
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="d-flex justify-content-between mt-4 pt-4 border-top">
                            <Button 
                                variant="outline-secondary"
                                onClick={handlePrevStep}
                                disabled={activeStep === 1}
                                className="px-4"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                                Previous
                            </Button>
                            <div>
                                <Button 
                                    variant="outline-secondary" 
                                    className="me-2"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setActiveStep(1);
                                    }}
                                >
                                    Cancel
                                </Button>
                                {activeStep < 3 ? (
                                    <Button 
                                        variant="primary"
                                        onClick={handleNextStep}
                                        disabled={!isStepValid()}
                                        className="px-4"
                                    >
                                        Next
                                        <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                                    </Button>
                                ) : (
                                    <>
                                        <Button 
                                            variant="outline-primary" 
                                            className="me-2"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setNewOrder(prev => ({ ...prev, status: 'draft' }));
                                                handleCreateOrder(e);
                                            }}
                                        >
                                            Save as Draft
                                        </Button>
                                        <Button 
                                            variant="primary"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setNewOrder(prev => ({ ...prev, status: 'pending' }));
                                                handleCreateOrder(e);
                                            }}
                                        >
                                            Submit for Approval
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default OrdersTabs; 