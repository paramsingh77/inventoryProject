import React, { useState } from 'react';
import { Card, Form, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes, faCheck, faBug } from '@fortawesome/free-solid-svg-icons';
import SupplierService from '../../services/SupplierService';
import { useNotification } from '../../context/NotificationContext';

const styles = {
  container: {
    fontFamily: 'Afacad, sans-serif'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#344767',
    marginBottom: '1.5rem'
  },
  section: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#344767',
    marginBottom: '1rem'
  }
};

const AddSupplier = ({ onClose, onSuccess }) => {
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState({
    // Basic Information
    companyName: '',
    businessType: '',
    registrationNumber: '',
    taxId: '',
    yearEstablished: '',
    
    // Contact Information
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    
    // Address
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    
    // Additional Details
    paymentTerms: '',
    creditLimit: '',
    category: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields - Only enforce the most essential fields
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      addNotification('error', 'Please correct the errors in the form');
      return;
    }
    
    setIsSubmitting(true);
    setServerError(null);
    
    // Ensure category is set from the supplierCategory field
    const supplierData = {
      ...formData,
      category: formData.category || 'general'
    };

    console.log('Submitting supplier data:', supplierData);
    
    try {
      const response = await SupplierService.createSupplier(supplierData);
      
      console.log('Supplier created successfully:', response);
      
      // Check for success flag in response
      if (response && response.success === false) {
        throw new Error(response.message || 'Failed to create supplier');
      }
      
      setSubmitSuccess(true);
      addNotification('success', `Supplier "${formData.companyName}" created successfully`);
      
      // Call success callback if provided
      if (onSuccess) {
        // Handle both formats: response.data or just response
        const supplierData = response.data || response;
        onSuccess(supplierData);
      }
      
      // Reset form after 1.5 seconds
      setTimeout(() => {
        setFormData({
          companyName: '',
          businessType: '',
          registrationNumber: '',
          taxId: '',
          yearEstablished: '',
          contactPerson: '',
          email: '',
          phone: '',
          website: '',
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
          paymentTerms: '',
          creditLimit: '',
          category: '',
          notes: ''
        });
        setSubmitSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Error creating supplier:', error);
      // Handle different error formats
      let errorMessage = 'Failed to create supplier';
      
      if (error.response?.data?.message) {
        // API error with response
        errorMessage = error.response.data.message;
      } else if (error.message) {
        // Local error or custom error
        errorMessage = error.message;
      }
      
      setServerError(errorMessage);
      addNotification('error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={styles.container}
    >
      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <h5 style={styles.title}>Add New Supplier</h5>
          
          {submitSuccess && (
            <Alert variant="success" className="d-flex align-items-center">
              <FontAwesomeIcon icon={faCheck} className="me-2" />
              Supplier created successfully!
            </Alert>
          )}
          
          {serverError && (
            <Alert variant="danger" className="d-flex align-items-center">
              <FontAwesomeIcon icon={faBug} className="me-2" />
              {serverError}
            </Alert>
          )}
          
          <Form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="mb-4">
              <h6 style={styles.section}>Basic Information</h6>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Company Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      isInvalid={!!errors.companyName}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.companyName}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Business Type</Form.Label>
                    <Form.Select
                      value={formData.businessType}
                      onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                      isInvalid={!!errors.businessType}
                    >
                      <option value="">Select Type</option>
                      <option value="corporation">Corporation</option>
                      <option value="partnership">Partnership</option>
                      <option value="sole_proprietorship">Sole Proprietorship</option>
                      <option value="llc">LLC</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.businessType}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Tax ID</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                      isInvalid={!!errors.taxId}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.taxId}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Contact Information */}
            <div className="mb-4">
              <h6 style={styles.section}>Contact Information</h6>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Contact Person</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                      isInvalid={!!errors.contactPerson}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.contactPerson}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      isInvalid={!!errors.email}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      isInvalid={!!errors.phone}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.phone}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Website</Form.Label>
                    <Form.Control
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      isInvalid={!!errors.website}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.website}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Address */}
            <div className="mb-4">
              <h6 style={styles.section}>Address</h6>
              <Row className="g-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Street Address</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({...formData, street: e.target.value})}
                      isInvalid={!!errors.street}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.street}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>City</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      isInvalid={!!errors.city}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.city}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>State/Province</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      isInvalid={!!errors.state}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.state}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Postal Code</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                      isInvalid={!!errors.postalCode}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.postalCode}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Country</Form.Label>
                    <Form.Select
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      isInvalid={!!errors.country}
                    >
                      <option value="">Select Country</option>
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="JP">Japan</option>
                      <option value="CN">China</option>
                      <option value="IN">India</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.country}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Additional Details */}
            <div className="mb-4">
              <h6 style={styles.section}>Additional Details</h6>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Payment Terms</Form.Label>
                    <Form.Select
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
                      isInvalid={!!errors.paymentTerms}
                    >
                      <option value="">Select Payment Terms</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 45">Net 45</option>
                      <option value="Net 60">Net 60</option>
                      <option value="Net 90">Net 90</option>
                      <option value="Due on Receipt">Due on Receipt</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.paymentTerms}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Supplier Category</Form.Label>
                    <Form.Select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      isInvalid={!!errors.category}
                    >
                      <option value="">Select Category</option>
                      <option value="hardware">Hardware</option>
                      <option value="software">Software</option>
                      <option value="services">Services</option>
                      <option value="consulting">Consulting</option>
                      <option value="office">Office Supplies</option>
                      <option value="general">General</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.category}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      isInvalid={!!errors.notes}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.notes}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Form Legend */}
            <div className="mb-3">
              <small className="text-muted">
                Fields marked with <span className="text-danger">*</span> are required
              </small>
            </div>

            {/* Submit Buttons */}
            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="light" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                <FontAwesomeIcon icon={faTimes} className="me-2" />
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} className="me-2" />
                    Save Supplier
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default AddSupplier; 