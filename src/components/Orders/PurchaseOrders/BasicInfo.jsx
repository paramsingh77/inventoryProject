import React, { useState, useEffect } from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { motion } from 'framer-motion';

const BasicInfo = ({ formData = {}, setFormData, errors = {} }) => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                        address: vendor.address || 'N/A'
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
            setFormData(prev => ({
                ...prev,
                vendor: {
                    ...prev.vendor,
                    id: selectedVendor.id,
                    name: selectedVendor.name,
                    email: selectedVendor.email,
                    phone: selectedVendor.phone,
                    address: selectedVendor.address
                }
            }));
        }
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