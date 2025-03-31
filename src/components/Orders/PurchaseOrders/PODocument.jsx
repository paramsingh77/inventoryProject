import React from 'react';
import { Container, Row, Col, Table } from 'react-bootstrap';
// Use a direct import to the image
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
    department = 'IT Department',
    // Use logoUrl if provided from PDF generator
    logoUrl = null
  } = poData || {};

  // Use logoUrl from props if available, otherwise use imported logo
  const logoSrc = logoUrl || companyLogo;

  // Handle vendor data display
  const {
    name: vendorName = 'N/A',
    companyName: vendorCompanyName = 'N/A',
    contactPerson = 'N/A',
    email = 'N/A',
    phone = 'N/A',
    address = {}
  } = vendor || {};

  // Handle address data display
  const {
    street = 'N/A',
    city = 'N/A',
    state = 'N/A',
    zip = 'N/A',
    full = null
  } = address || {};

  // Process vendor display data - ensure we show something meaningful
  const displayVendorName = vendorName !== 'N/A' ? vendorName : 'Vendor Not Specified';
  const displayCompanyName = vendorCompanyName !== 'N/A' ? vendorCompanyName : 'Company Not Specified';
  const displayContactPerson = contactPerson !== 'N/A' ? contactPerson : (vendorName !== 'N/A' ? vendorName : 'Contact Not Specified');
  const displayEmail = email !== 'N/A' ? email : 'Email Not Provided';
  const displayPhone = phone !== 'N/A' ? phone : 'Phone Not Provided';
  
  // Process address display
  const displayStreet = street !== 'N/A' ? street : 'Street Not Provided';
  const displayCity = city !== 'N/A' ? city : '';
  const displayState = state !== 'N/A' ? state : '';
  const displayZip = zip !== 'N/A' ? zip : '';
  // Use full address if provided, otherwise construct from components
  const displayCityStateZip = full || [displayCity, displayState, displayZip].filter(Boolean).join(', ') || 'Address Details Not Provided';

  // Process shipping information display
  const displayShippingTerms = shippingTerms || 'Standard Delivery';
  const displayShippingMethod = shippingMethod || 'Ground';
  const displayDeliveryDate = deliveryDate ? 
    (typeof deliveryDate === 'string' ? deliveryDate : new Date(deliveryDate).toLocaleDateString()) 
    : 'Not Specified';

  // Calculate total amount from items to ensure accuracy
  const calculatedSubtotal = items.reduce((total, item) => {
    const quantity = typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 0;
    const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice) || 0;
    return total + (quantity * unitPrice);
  }, 0);
  
  // Use calculated subtotal if the provided one is zero
  const displaySubtotal = subtotal === 0 ? calculatedSubtotal : subtotal;
  const displayTax = tax === 0 ? displaySubtotal * (taxRate / 100) : tax;
  const displayTotal = totalAmount === 0 ? displaySubtotal + displayTax + shippingFees : totalAmount;

  // Updated color palette to match logo (red and blue)
  const colors = {
    primary: '#1E4D8C', // Deep blue from logo
    secondary: '#F8F9FA',
    border: '#DEE2E6',
    headerBg: '#F8F9FA',
    headerText: '#1E4D8C',
    accent: '#D42F31' // Red accent from logo
  };

  return (
    <Container className="bg-white py-5 px-4" style={{ 
      width: '100%',
      maxWidth: '794px', // A4 width at 96 DPI
      margin: '0 auto',
      boxSizing: 'border-box',
      fontFamily: 'Helvetica, Arial, sans-serif',
      fontSize: '12px',
      boxShadow: '0 0 10px rgba(0,0,0,0.05)',
      borderRadius: '4px',
    }}>
      {/* Header - Updated with larger logo */}
      <Row className="mb-5">
        <Col md={6}>
          {/* Logo implementation - using React way */}
          <div 
            style={{ 
              height: '75px', 
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center'
            }}
            className="logo-container"
          >
            <img 
              src={logoSrc} 
              alt="AAM Inventory" 
              style={{ 
                height: '100%', 
                maxWidth: '100%',
                objectFit: 'contain'
              }} 
              crossOrigin="anonymous"
            />
          </div>
          <div className="mt-3" style={{ color: '#555' }}>
            <p className="mb-1" style={{ fontWeight: '500' }}>{companyName}</p>
            <p className="mb-1">{companyAddress}</p>
            <p className="mb-1">{department}</p>
            <p className="mb-1">Phone: (555) 123-4567</p>
            <p className="mb-1">Email: info@aaminventory.com</p>
          </div>
        </Col>
        <Col md={6} className="text-end">
          <h2 style={{ 
            color: colors.primary, 
            fontSize: '28px', 
            fontWeight: '600',
            letterSpacing: '0.5px',
            marginBottom: '20px'
          }}>PURCHASE ORDER</h2>
          <div style={{ 
            backgroundColor: colors.headerBg, 
            padding: '15px', 
            borderRadius: '4px',
            border: `1px solid ${colors.border}`
          }}>
            <Row className="mb-2">
              <Col xs={6} className="text-start">
                <strong style={{ color: colors.primary }}>PO NUMBER</strong>
              </Col>
              <Col xs={6} className="text-end">
                <span style={{ fontWeight: '500' }}>{poNumber}</span>
              </Col>
            </Row>
            <Row>
              <Col xs={6} className="text-start">
                <strong style={{ color: colors.primary }}>DATE</strong>
              </Col>
              <Col xs={6} className="text-end">
                <span style={{ fontWeight: '500' }}>{new Date(createdAt).toLocaleDateString()}</span>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* Vendor & Shipping Info */}
      <Row className="mb-4">
        <Col md={6} className="pe-md-2">
          <div style={{ 
            backgroundColor: colors.headerBg,
            color: colors.headerText,
            padding: '8px 15px',
            marginBottom: '10px',
            borderRadius: '4px 4px 0 0',
            fontWeight: '600',
            borderBottom: `2px solid ${colors.primary}`,
            fontSize: '14px'
          }}>
            VENDOR
          </div>
          <div style={{ 
            padding: '15px', 
            border: `1px solid ${colors.border}`,
            borderRadius: '0 0 4px 4px',
            backgroundColor: 'white'
          }}>
            <p className="mb-1"><strong style={{ color: colors.primary }}>NAME</strong></p>
            <p className="mb-3">{displayContactPerson}</p>
            
            <p className="mb-1"><strong style={{ color: colors.primary }}>COMPANY NAME</strong></p>
            <p className="mb-3">{displayCompanyName}</p>
            
            <p className="mb-1"><strong style={{ color: colors.primary }}>ADDRESS</strong></p>
            <p className="mb-1">{displayStreet}</p>
            <p className="mb-3">{displayCityStateZip}</p>
            
            <p className="mb-1"><strong style={{ color: colors.primary }}>PHONE</strong></p>
            <p className="mb-3">{displayPhone}</p>
            
            <p className="mb-1"><strong style={{ color: colors.primary }}>EMAIL</strong></p>
            <p className="mb-0">{displayEmail}</p>
          </div>
        </Col>
        <Col md={6} className="ps-md-2 mt-4 mt-md-0">
          <div style={{ 
            backgroundColor: colors.headerBg,
            color: colors.headerText,
            padding: '8px 15px',
            marginBottom: '10px',
            borderRadius: '4px 4px 0 0',
            fontWeight: '600',
            borderBottom: `2px solid ${colors.primary}`,
            fontSize: '14px'
          }}>
            SHIPPING INFORMATION
          </div>
          <div style={{ 
            padding: '15px', 
            border: `1px solid ${colors.border}`,
            borderRadius: '0 0 4px 4px',
            backgroundColor: 'white',
            height: 'calc(100% - 44px)' // Align with vendor box height
          }}>
            <Row className="mb-4">
              <Col xs={6}>
                <p className="mb-1"><strong style={{ color: colors.primary }}>SHIPPING TERMS</strong></p>
                <p>{displayShippingTerms}</p>
              </Col>
              <Col xs={6}>
                <p className="mb-1"><strong style={{ color: colors.primary }}>SHIPPING METHOD</strong></p>
                <p>{displayShippingMethod}</p>
              </Col>
            </Row>
            <Row>
              <Col xs={12}>
                <p className="mb-1"><strong style={{ color: colors.primary }}>DELIVERY DATE</strong></p>
                <p>{displayDeliveryDate}</p>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* Items Table */}
      <div className="mb-4">
        <Table responsive className="w-100" style={{ 
          tableLayout: 'fixed',
          borderCollapse: 'collapse',
          border: `1px solid ${colors.border}`,
        }}>
          <thead>
            <tr style={{ 
              backgroundColor: colors.headerBg,
              color: colors.headerText,
              fontSize: '13px',
              fontWeight: '600'
            }}>
              <th style={{ 
                width: '10%',
                padding: '10px 15px',
                borderBottom: `2px solid ${colors.primary}`,
                textAlign: 'left'
              }}>Code</th>
              <th style={{ 
                width: '45%',
                padding: '10px 15px',
                borderBottom: `2px solid ${colors.primary}`,
                textAlign: 'left'
              }}>Product Description</th>
              <th style={{ 
                width: '15%',
                padding: '10px 15px',
                borderBottom: `2px solid ${colors.primary}`,
                textAlign: 'center'
              }}>Quantity</th>
              <th style={{ 
                width: '15%',
                padding: '10px 15px',
                borderBottom: `2px solid ${colors.primary}`,
                textAlign: 'right'
              }}>Unit Price ($)</th>
              <th style={{ 
                width: '15%',
                padding: '10px 15px',
                borderBottom: `2px solid ${colors.primary}`,
                textAlign: 'right'
              }}>Amount ($)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id || index} style={{ borderBottom: `1px solid ${colors.border}` }}>
                <td style={{ padding: '10px 15px', verticalAlign: 'top' }}>{item.sku}</td>
                <td style={{ padding: '10px 15px', verticalAlign: 'top' }}>
                  <div style={{ wordWrap: 'break-word' }}>
                    <span style={{ fontWeight: '500' }}>{item.name}</span>
                    {item.description && (
                      <div style={{ marginTop: '4px', color: '#666', fontSize: '11px' }}>
                        {item.description}
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ padding: '10px 15px', textAlign: 'center', verticalAlign: 'top' }}>
                  {typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 0}
                </td>
                <td style={{ padding: '10px 15px', textAlign: 'right', verticalAlign: 'top' }}>
                  {(typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice) || 0).toFixed(2)}
                </td>
                <td style={{ padding: '10px 15px', textAlign: 'right', verticalAlign: 'top' }}>
                  {((typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 0) * 
                    (typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice) || 0)).toFixed(2)}
                </td>
              </tr>
            ))}
            {/* Add empty row if fewer than 2 items to maintain space */}
            {items.length < 2 && (
              <tr style={{ height: '40px', borderBottom: `1px solid ${colors.border}` }}>
                <td colSpan="5" style={{ padding: '10px 15px' }}>&nbsp;</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="4" style={{ padding: '10px 15px', textAlign: 'right', fontWeight: '600' }}>Subtotal</td>
              <td style={{ padding: '10px 15px', textAlign: 'right', borderTop: `1px solid ${colors.border}` }}>${displaySubtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan="4" style={{ padding: '10px 15px', textAlign: 'right' }}>Tax ({taxRate}%)</td>
              <td style={{ padding: '10px 15px', textAlign: 'right' }}>${displayTax.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan="4" style={{ padding: '10px 15px', textAlign: 'right' }}>Shipping & Handling</td>
              <td style={{ padding: '10px 15px', textAlign: 'right' }}>${shippingFees.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan="4" style={{ 
                padding: '12px 15px', 
                textAlign: 'right', 
                fontWeight: '600',
                fontSize: '14px',
                color: colors.primary,
                backgroundColor: colors.headerBg
              }}>Total Amount</td>
              <td style={{ 
                padding: '12px 15px', 
                textAlign: 'right', 
                fontWeight: '600',
                fontSize: '14px',
                backgroundColor: colors.headerBg
              }}>${displayTotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </Table>
      </div>

      {/* Terms and Notes */}
      <Row className="mb-5">
        <Col md={12}>
          <div style={{ 
            backgroundColor: colors.headerBg,
            color: colors.headerText,
            padding: '8px 15px',
            marginBottom: '10px',
            borderRadius: '4px 4px 0 0',
            fontWeight: '600',
            borderBottom: `2px solid ${colors.primary}`,
            fontSize: '14px'
          }}>
            TERMS & CONDITIONS
          </div>
          <div style={{ 
            padding: '15px', 
            border: `1px solid ${colors.border}`,
            borderRadius: '0 0 4px 4px',
            backgroundColor: 'white'
          }}>
            <p style={{ fontWeight: '600', marginBottom: '8px', color: colors.primary }}>Note:</p>
            <p className="mb-2">Payment shall be {paymentTerms || 'net 30'} days upon receipt of the items above.</p>
            <p className="mb-0">{termsAndConditions || 'Standard terms and conditions apply.'}</p>
          </div>
        </Col>
      </Row>

      {/* Signatures */}
      <Row className="mt-5">
        <Col md={6}>
          <div style={{ 
            borderTop: `1px solid ${colors.border}`, 
            paddingTop: '10px'
          }}>
            <p className="mb-1" style={{ color: '#666' }}>Prepared by</p>
            <p className="mb-0" style={{ fontWeight: '500' }}>{requestedBy}</p>
          </div>
        </Col>
        <Col md={6}>
          <div style={{ 
            borderTop: `1px solid ${colors.border}`, 
            paddingTop: '10px'
          }}>
            <p className="mb-1" style={{ color: '#666' }}>Approved by</p>
            <p className="mb-0">_____________________</p>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default PODocument; 