import React from 'react';
import { Form } from 'react-bootstrap';

const AdditionalDetails = ({ formData, setFormData }) => {
  return (
    <div>
      <Form.Group className="mb-3">
        <Form.Label>Notes</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          placeholder="Enter any additional notes or instructions..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </Form.Group>

      <Form.Group>
        <Form.Label>Attachments</Form.Label>
        <Form.Control
          type="file"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files);
            setFormData({ ...formData, attachments: files });
          }}
        />
        <Form.Text className="text-muted">
          Upload any relevant documents (quotes, specifications, etc.)
        </Form.Text>
      </Form.Group>
    </div>
  );
};

export default AdditionalDetails; 