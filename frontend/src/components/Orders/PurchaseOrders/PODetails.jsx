<Form.Group className="mb-3">
  <Form.Label>Vendor Email</Form.Label>
  <Form.Control
    type="email"
    value={poData.vendor_email || ''}
    onChange={(e) => setPOData({...poData, vendor_email: e.target.value})}
    placeholder="Enter vendor email for notifications"
  />
  <Form.Text className="text-muted">
    This email will be used for sending PO notifications
  </Form.Text>
</Form.Group> 