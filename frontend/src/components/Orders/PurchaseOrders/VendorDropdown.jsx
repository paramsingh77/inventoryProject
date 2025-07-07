import React from 'react';
import { Form } from 'react-bootstrap';
import './styles.css';

/**
 * A reusable vendor dropdown component for Purchase Orders
 */
const VendorDropdown = ({
  vendors = [],
  value = '',
  onChange,
  isInvalid = false,
  disabled = false,
  placeholder = 'Select a vendor',
  required = false,
  errorMessage = ''
}) => {
  const handleChange = (e) => {
    const selectedValue = e.target.value;
    console.log('VendorDropdown - Selected value:', selectedValue);
    
    if (onChange) {
      onChange(selectedValue);
    }
  };

  // Simplified component that just renders the dropdown with provided vendors
  return (
    <Form.Group>
      <Form.Label>Vendor {required && <span className="text-danger">*</span>}</Form.Label>
      <Form.Select
        value={value}
        onChange={handleChange}
        isInvalid={isInvalid}
        disabled={disabled}
        required={required}
      >
        <option value="">{placeholder}</option>
        {vendors && vendors.map(vendor => (
          <option key={vendor.id} value={vendor.id}>
            {vendor.name}
          </option>
        ))}
      </Form.Select>
      {isInvalid && errorMessage && (
        <Form.Control.Feedback type="invalid">
          {errorMessage}
        </Form.Control.Feedback>
      )}
    </Form.Group>
  );
};

export default VendorDropdown; 