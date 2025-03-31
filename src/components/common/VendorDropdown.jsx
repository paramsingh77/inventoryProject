import React, { useState, useEffect } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import SupplierService from '../../services/SupplierService';

/**
 * A reusable vendor dropdown component that fetches suppliers/vendors
 * and displays them in a dropdown select
 */
const VendorDropdown = ({
  id = 'vendor-select',
  name = 'vendor',
  value = '',
  onChange,
  isInvalid = false,
  disabled = false,
  placeholder = 'Select a vendor',
  required = false,
  className = '',
  activeOnly = true,
  errorMessage = ''
}) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching vendors for dropdown...');
        const vendorItems = await SupplierService.getSuppliersForDropdown(activeOnly);
        
        setVendors(vendorItems);
        console.log(`Loaded ${vendorItems.length} vendors for dropdown`);
      } catch (err) {
        console.error('Error fetching vendors:', err);
        setError('Failed to load vendors');
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, [activeOnly]);

  return (
    <>
      <Form.Select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        isInvalid={isInvalid}
        disabled={disabled || loading}
        required={required}
        className={className}
      >
        <option value="">{placeholder}</option>
        {vendors.map(vendor => (
          <option key={vendor.id} value={vendor.id}>
            {vendor.name}
          </option>
        ))}
      </Form.Select>
      
      {loading && <div className="text-muted mt-1"><Spinner size="sm" animation="border" /> Loading vendors...</div>}
      {error && <div className="text-danger mt-1">{error}</div>}
      {isInvalid && errorMessage && (
        <Form.Control.Feedback type="invalid">
          {errorMessage}
        </Form.Control.Feedback>
      )}
    </>
  );
};

export default VendorDropdown; 