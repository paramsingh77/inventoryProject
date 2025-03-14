import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Card, Button } from 'react-bootstrap';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

const RequiredLabel = ({ children }) => (
    <Form.Label>
        {children} <span className="text-danger">*</span>
    </Form.Label>
);

const BasicInfo = ({ formData = {}, setFormData, errors = {} }) => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingVendorDetails, setEditingVendorDetails] = useState(false);

    useEffect(() => {
        const fetchVendors = async () => {
            try {
                setLoading(true);
                setError(null);

                // Log the environment and URL
                console.log('Environment:', process.env.NODE_ENV);
                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:2000';
                console.log('API URL:', apiUrl);
                
                // Add headers for CORS
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    withCredentials: false
                };

                console.log('Making API call to:', `${apiUrl}/api/devices/vendors`);
                const response = await axios.get(`${apiUrl}/api/devices/vendors`, config);
                console.log('API Response:', response);
                
                if (response.data && Array.isArray(response.data)) {
                    const formattedVendors = response.data.map((vendor, index) => ({
                        id: vendor.id || index + 1,
                        name: vendor.name,
                        email: vendor.email || `sales@${vendor.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
                        phone: vendor.phone || 'N/A',
                        address: vendor.address || 'N/A',
                        contactPerson: vendor.contact_person || ''
                    }));
                    
                    console.log('Formatted Vendors:', formattedVendors);
                    setVendors(formattedVendors);
                } else {
                    console.error('Invalid data structure:', response.data);
                    throw new Error('Invalid vendor data received from server');
                }
            } catch (err) {
                console.error('Fetch Error:', err);
                console.error('Error Response:', err.response);
                console.error('Error Request:', err.request);
                console.error('Error Config:', err.config);
                setError(err.response?.data?.message || err.message || 'Failed to load vendors');
            } finally {
                setLoading(false);
            }
        };

        // Call the function
        console.log('Initializing vendor fetch...');
        fetchVendors();
    }, []);

    const handleVendorChange = (e) => {
        if (!setFormData) return; // Guard against undefined setFormData
        
        const selectedVendor = vendors.find(v => v.id === parseInt(e.target.value));
        if (selectedVendor) {
            // Generate fallback email and phone if not provided
            const vendorEmail = selectedVendor.email || `sales@${selectedVendor.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
            const vendorPhone = selectedVendor.phone || '555-0000'; // Default phone number
            
            // Update both supplier and vendor information consistently
            setFormData(prev => ({
                ...prev,
                supplier: `vendor-${selectedVendor.name.toLowerCase().replace(/\s+/g, '-')}`,
                // Set the vendor object
                vendor: {
                    id: selectedVendor.id,
                    name: selectedVendor.name,
                    email: vendorEmail,
                    phone: vendorPhone,
                    address: typeof selectedVendor.address === 'string' 
                        ? { street: selectedVendor.address } 
                        : selectedVendor.address || {},
                    contactPerson: selectedVendor.contact_person || selectedVendor.contactPerson || ''
                },
                // Also set these fields directly for backward compatibility
                vendorEmail: vendorEmail,
                vendorPhone: vendorPhone
            }));

            // Log the updated form data for debugging
            console.log('Updated vendor data:', {
                id: selectedVendor.id,
                name: selectedVendor.name,
                email: vendorEmail,
                phone: vendorPhone
            });
        }
    };

    const updateVendorField = (field, value) => {
        setFormData(prev => {
            const updatedVendor = {
                ...prev.vendor,
                [field]: value
            };
            
            // Keep vendorEmail and vendorPhone in sync with vendor object
            const updates = {
                ...prev,
                vendor: updatedVendor
            };
            
            // If updating email or phone, also update the direct fields
            if (field === 'email') {
                updates.vendorEmail = value;
            } else if (field === 'phone') {
                updates.vendorPhone = value;
            }
            
            return updates;
        });
        
        console.log(`Updated vendor ${field} to:`, value);
    };

    const updateVendorAddress = (field, value) => {
        setFormData(prev => {
            // Update the vendor address
            const updatedAddress = {
                ...prev.vendor.address,
                [field]: value
            };
            
            // Create a formatted address string for the vendorAddress field
            const addressString = [
                updatedAddress.street,
                updatedAddress.city,
                updatedAddress.state,
                updatedAddress.zip,
                updatedAddress.country
            ].filter(Boolean).join(', ');
            
            return {
                ...prev,
                vendor: {
                    ...prev.vendor,
                    address: updatedAddress
                },
                // Also update the direct vendorAddress field
                vendorAddress: addressString
            };
        });
        
        console.log(`Updated vendor address ${field} to:`, value);
    };

    // Early return if setFormData is not provided
    if (!setFormData) {
        return <div>Error: Form data handler not provided</div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>Purchase Order Number</Form.Label>
                <Col sm={9}>
                    <Form.Control
                        type="text"
                        value={formData.poNumber || ''}
                        onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                        isInvalid={!!errors.poNumber}
                        placeholder="Enter PO number"
                        disabled
                    />
                    <Form.Control.Feedback type="invalid">
                        {errors.poNumber}
                    </Form.Control.Feedback>
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>Vendor</Form.Label>
                <Col sm={9}>
                    <Form.Select
                        value={formData.vendor?.id || ''}
                        onChange={handleVendorChange}
                        isInvalid={!!errors.vendor_id}
                        disabled={loading}
                    >
                        <option value="">Select a vendor</option>
                        {vendors.map(vendor => (
                            <option key={vendor.id} value={vendor.id}>
                                {vendor.name}
                            </option>
                        ))}
                    </Form.Select>
                    {loading && <div className="text-muted mt-1">Loading vendors...</div>}
                    {error && (
                        <div className="text-danger mt-1">
                            {error}
                        </div>
                    )}
                    <Form.Control.Feedback type="invalid">
                        {errors.vendor_id}
                    </Form.Control.Feedback>
                </Col>
            </Form.Group>

            {/* Vendor Details Card */}
            {formData.vendor && formData.vendor.name && (
                <Card className="mb-4">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">Vendor Details</h6>
                        <Button 
                            variant={editingVendorDetails ? "success" : "light"} 
                            size="sm"
                            onClick={() => setEditingVendorDetails(!editingVendorDetails)}
                        >
                            <FontAwesomeIcon icon={editingVendorDetails ? faCheck : faEdit} className="me-1" />
                            {editingVendorDetails ? 'Done' : 'Edit'}
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Vendor Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.vendor.name || ''}
                                        onChange={(e) => updateVendorField('name', e.target.value)}
                                        disabled={!editingVendorDetails}
                                        isInvalid={!!errors.vendor_name}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Contact Person</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.vendor.contactPerson || ''}
                                        onChange={(e) => updateVendorField('contactPerson', e.target.value)}
                                        disabled={!editingVendorDetails}
                                        isInvalid={!!errors.contact_person}
                                        placeholder="Enter contact person name"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <RequiredLabel>Email</RequiredLabel>
                                    <Form.Control
                                        type="email"
                                        value={formData.vendor.email || ''}
                                        onChange={(e) => updateVendorField('email', e.target.value)}
                                        disabled={!editingVendorDetails}
                                        isInvalid={!!errors.vendor_email}
                                        placeholder="Enter vendor email (required)"
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.vendor_email || "Vendor email is required"}
                                    </Form.Control.Feedback>
                                    {!formData.vendor.email && (
                                        <div className="text-danger small mt-1">
                                            Vendor email is required to continue
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Phone</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.vendor.phone || ''}
                                        onChange={(e) => updateVendorField('phone', e.target.value)}
                                        disabled={!editingVendorDetails}
                                        isInvalid={!!errors.vendor_phone}
                                        placeholder="Enter vendor phone"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Address</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        value={typeof formData.vendor.address === 'string' 
                                            ? formData.vendor.address 
                                            : formData.vendor.address?.street || ''}
                                        onChange={(e) => updateVendorAddress('street', e.target.value)}
                                        disabled={!editingVendorDetails}
                                        isInvalid={!!errors.vendor_address}
                                        placeholder="Enter vendor address"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>Order Date</Form.Label>
                <Col sm={9}>
                    <Form.Control
                        type="date"
                        value={formData.poDate || ''}
                        onChange={(e) => setFormData({ ...formData, poDate: e.target.value })}
                        isInvalid={!!errors.poDate}
                        disabled
                    />
                    <Form.Control.Feedback type="invalid">
                        {errors.poDate}
                    </Form.Control.Feedback>
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>Expected Delivery Date</Form.Label>
                <Col sm={9}>
                    <Form.Control
                        type="date"
                        value={formData.deliveryDate || ''}
                        onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                        isInvalid={!!errors.deliveryDate}
                    />
                    <Form.Control.Feedback type="invalid">
                        {errors.deliveryDate}
                    </Form.Control.Feedback>
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>Payment Terms</Form.Label>
                <Col sm={9}>
                    <Form.Select
                        value={formData.paymentTerms || ''}
                        onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                        isInvalid={!!errors.paymentTerms}
                    >
                        <option value="">Select payment terms</option>
                        <option value="net30">Net 30</option>
                        <option value="net60">Net 60</option>
                        <option value="immediate">Immediate</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                        {errors.paymentTerms}
                    </Form.Control.Feedback>
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>Notes</Form.Label>
                <Col sm={9}>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Enter any additional notes"
                    />
                </Col>
            </Form.Group>
        </motion.div>
    );
};

export default BasicInfo; 