import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import { suppliers } from '../../../data/samplePOData';

const BasicInfo = ({ formData, setFormData }) => {
  return (
    <div>
      <Row className="g-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Supplier</Form.Label>
            <Form.Select
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              required
            >
              <option value="">Select Supplier</option>
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
            <Form.Label>Supplier Reference</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter supplier reference"
              value={formData.supplierRef}
              onChange={(e) => setFormData({ ...formData, supplierRef: e.target.value })}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>Delivery Date</Form.Label>
            <Form.Control
              type="date"
              value={formData.deliveryDate}
              onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>Payment Terms</Form.Label>
            <Form.Select
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
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
  );
};

export default BasicInfo; 