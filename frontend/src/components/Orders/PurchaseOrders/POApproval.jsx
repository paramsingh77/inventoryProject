import React, { useState } from 'react';
import { Form } from 'react-bootstrap';

const POApproval = () => {
  const [poData, setPOData] = useState({});

  return (
    <div>
      {/* Add this to your PO details display */}
      <Form.Group className="mb-3">
        <Form.Label>Vendor Email</Form.Label>
        <Form.Control
          type="email"
          value={poData.vendorEmail || poData.vendor?.email || ''}
          onChange={(e) => setPOData({...poData, vendorEmail: e.target.value})}
          placeholder="Enter vendor email for notifications"
        />
        <Form.Text className="text-muted">
          This email will be used for sending PO approval notifications
        </Form.Text>
      </Form.Group>
    </div>
  );
};

export default POApproval; 