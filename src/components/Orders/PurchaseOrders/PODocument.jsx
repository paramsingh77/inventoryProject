import React from 'react';
import { Container, Row, Col, Table } from 'react-bootstrap';
import companyLogo from '../../../images/image copy.png';

const PODocument = ({ poData }) => {
  // Add default values and null checks
  const {
    poNumber = '',
    createdAt = new Date(),
    vendor = {},
    items = [],
    subtotal = 0,
    tax = 0,
    taxRate = 10,
    shippingFees = 0,
    totalAmount = 0,
    paymentTerms = '',
    deliveryDate = '',
    shippingTerms = 'Standard Delivery',
    shippingMethod = 'Ground',
    termsAndConditions = '',
    requestedBy = 'IT Manager',
    // Add company details
    companyName = 'AAM Inventory',
    companyAddress = '700 17th Street, Modesto, CA 95354',
    department = 'IT Department'
  } = poData || {};

  const {
    name: vendorName = 'N/A',
    contactPerson = 'N/A',
    email = 'N/A',
    phone = 'N/A',
    address = {}
  } = vendor;

  const {
    street = 'N/A',
    city = 'N/A',
    state = 'N/A',
    zip = 'N/A'
  } = address;

  return (
    <Container className="p-4 bg-white" style={{ maxWidth: '850px' }}>
      {/* Header */}
      <Row className="mb-4">
        <Col md={6}>
          <img src={companyLogo} alt="AAM Inventory" style={{ height: '50px' }} />
          <div className="mt-3">
            <p className="mb-1">{companyName}</p>
            <p className="mb-1">{companyAddress}</p>
            <p className="mb-1">{department}</p>
            <p className="mb-1">Phone: (555) 123-4567</p>
            <p className="mb-1">Email: info@aaminventory.com</p>
          </div>
        </Col>
        <Col md={6} className="text-end">
          <h2 className="text-primary mb-4">PURCHASE ORDER</h2>
          <div className="bg-light p-3 rounded">
            <Row>
              <Col xs={6} className="text-start">
                <strong>PO NUMBER</strong>
              </Col>
              <Col xs={6} className="text-end">
                {poNumber}
              </Col>
            </Row>
            <Row className="mt-2">
              <Col xs={6} className="text-start">
                <strong>DATE</strong>
              </Col>
              <Col xs={6} className="text-end">
                {new Date(createdAt).toLocaleDateString()}
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* Vendor & Customer Info */}
      <Row className="mb-4">
        <Col md={6}>
          <div className="bg-primary text-white p-2 mb-2">
            <strong>VENDOR</strong>
          </div>
          <div className="p-3 border rounded">
            <p className="mb-1"><strong>NAME</strong></p>
            <p className="mb-2">{contactPerson}</p>
            <p className="mb-1"><strong>COMPANY NAME</strong></p>
            <p className="mb-2">{vendorName}</p>
            <p className="mb-1"><strong>ADDRESS</strong></p>
            <p className="mb-2">{street}</p>
            <p className="mb-2">{city}, {state} {zip}</p>
            <p className="mb-1"><strong>PHONE</strong></p>
            <p className="mb-2">{phone}</p>
            <p className="mb-1"><strong>EMAIL</strong></p>
            <p className="mb-2">{email}</p>
          </div>
        </Col>
        <Col md={6}>
          <div className="bg-primary text-white p-2 mb-2">
            <strong>SHIPPING INFORMATION</strong>
          </div>
          <div className="p-3 border rounded">
            <Row className="mb-3">
              <Col xs={6}>
                <strong>SHIPPING TERMS</strong>
                <p className="mb-0">{shippingTerms}</p>
              </Col>
              <Col xs={6}>
                <strong>SHIPPING METHOD</strong>
                <p className="mb-0">{shippingMethod}</p>
              </Col>
            </Row>
            <Row>
              <Col xs={12}>
                <strong>DELIVERY DATE</strong>
                <p className="mb-0">{new Date(deliveryDate).toLocaleDateString()}</p>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* Items Table */}
      <div className="mb-4">
        <Table bordered responsive>
          <thead className="bg-primary text-white">
            <tr>
              <th>Code</th>
              <th>Product Description</th>
              <th className="text-center">Quantity</th>
              <th className="text-end">Unit Price ($)</th>
              <th className="text-end">Amount ($)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.sku}</td>
                <td>{item.name}<br/><small>{item.description}</small></td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-end">{item.unitPrice.toFixed(2)}</td>
                <td className="text-end">{(item.quantity * item.unitPrice).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="4" className="text-end"><strong>Subtotal</strong></td>
              <td className="text-end">${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan="4" className="text-end">Tax ({taxRate}%)</td>
              <td className="text-end">${tax.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan="4" className="text-end">Shipping & Handling</td>
              <td className="text-end">${shippingFees.toFixed(2)}</td>
            </tr>
            <tr className="bg-light">
              <td colSpan="4" className="text-end"><strong>Total Amount</strong></td>
              <td className="text-end"><strong>${totalAmount.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </Table>
      </div>

      {/* Terms and Notes */}
      <Row className="mb-4">
        <Col md={12}>
          <div className="bg-primary text-white p-2 mb-2">
            <strong>TERMS & CONDITIONS</strong>
          </div>
          <div className="p-3 border rounded">
            <p className="mb-2"><strong>Note:</strong></p>
            <p className="mb-2">Payment shall be {paymentTerms} days upon receipt of the items above.</p>
            <p className="mb-0">{termsAndConditions}</p>
          </div>
        </Col>
      </Row>

      {/* Signatures */}
      <Row className="mt-5">
        <Col md={6}>
          <div className="border-top pt-2">
            <p className="mb-0">Prepared by</p>
            <p className="mb-0">{requestedBy}</p>
          </div>
        </Col>
        <Col md={6}>
          <div className="border-top pt-2">
            <p className="mb-0">Approved by</p>
            <p className="mb-0">_____________________</p>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default PODocument; 