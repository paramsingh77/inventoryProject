import React, { useState } from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes } from '@fortawesome/free-solid-svg-icons';

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

const AddSupplier = () => {
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
    
    // Banking Information
    bankName: '',
    accountNumber: '',
    swiftCode: '',
    
    // Additional Details
    paymentTerms: '',
    creditLimit: '',
    supplierCategory: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Supplier Data:', formData);
    // Add API call here
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
          
          <Form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="mb-4">
              <h6 style={styles.section}>Basic Information</h6>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Company Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Business Type</Form.Label>
                    <Form.Select
                      value={formData.businessType}
                      onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="corporation">Corporation</option>
                      <option value="partnership">Partnership</option>
                      <option value="sole_proprietorship">Sole Proprietorship</option>
                      <option value="llc">LLC</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Registration Number</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Tax ID</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                    />
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
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Website</Form.Label>
                    <Form.Control
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                    />
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
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>City</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>State/Province</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Postal Code</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Country</Form.Label>
                    <Form.Select
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      required
                    >
                      <option value="">Select Country</option>
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="CA">Canada</option>
                      {/* Add more countries */}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Banking Information */}
            <div className="mb-4">
              <h6 style={styles.section}>Banking Information</h6>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Bank Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Account Number</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Submit Buttons */}
            <div className="d-flex justify-content-end gap-2">
              <Button variant="light">
                <FontAwesomeIcon icon={faTimes} className="me-2" />
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                <FontAwesomeIcon icon={faSave} className="me-2" />
                Save Supplier
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default AddSupplier; 