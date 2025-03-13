import React from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faSave, 
  faPaperPlane
} from '@fortawesome/free-solid-svg-icons';

const AdditionalDetails = ({ formData, setFormData, onPrevious, onSaveDraft, onSendForApproval }) => {
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

      <Form.Group className="mb-4">
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

      {/* Action Buttons */}
      <Row className="mt-4">
        <Col xs={12} className="d-flex justify-content-between">
          <Button 
            variant="light" 
            onClick={onPrevious}
            className="d-flex align-items-center"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Previous
          </Button>

          <div className="d-flex gap-2">
            <Button 
              variant="outline-primary" 
              onClick={onSaveDraft}
              className="d-flex align-items-center"
            >
              <FontAwesomeIcon icon={faSave} className="me-2" />
              Save as Draft
            </Button>
            
            <Button 
              variant="primary" 
              onClick={onSendForApproval}
              className="d-flex align-items-center"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
              Send for Approval
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default AdditionalDetails; 