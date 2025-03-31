import React, { useState } from 'react';
import { Form, Button, Alert, ProgressBar } from 'react-bootstrap';
import { useSite } from '../../contexts/SiteContext';

const SiteDataUpload = () => {
  const { currentSite } = useSite();
  const [file, setFile] = useState(null);
  const [dataType, setDataType] = useState('inventory');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const response = await fetch(
        `/api/sites/${currentSite.id}/upload/${dataType}`,
        {
          method: 'POST',
          body: formData
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      // Handle success
    } catch (error) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Form onSubmit={handleUpload}>
      <Form.Group>
        <Form.Label>Data Type</Form.Label>
        <Form.Select 
          value={dataType} 
          onChange={(e) => setDataType(e.target.value)}
        >
          <option value="inventory">Inventory</option>
          <option value="suppliers">Suppliers</option>
          <option value="purchase_orders">Purchase Orders</option>
        </Form.Select>
      </Form.Group>

      <Form.Group>
        <Form.Label>Upload File (CSV)</Form.Label>
        <Form.Control 
          type="file" 
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])} 
        />
      </Form.Group>

      {uploading && <ProgressBar animated now={progress} />}
      {error && <Alert variant="danger">{error}</Alert>}

      <Button type="submit" disabled={!file || uploading}>
        Upload Data
      </Button>
    </Form>
  );
};

export default SiteDataUpload; 