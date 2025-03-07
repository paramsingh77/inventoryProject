import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSave, 
  faTimes, 
  faCloudUpload,
  faTrash
} from '@fortawesome/free-solid-svg-icons';

const AddProduct = ({ show, onHide, onSave }) => {
  const [product, setProduct] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    quantity: '',
    description: '',
    minStockLevel: '',
    location: '',
    supplier: '',
    images: [],
    specifications: [{ key: '', value: '' }]
  });

  const [validated, setValidated] = useState(false);
  const [imagePreview, setImagePreview] = useState([]);

  const handleInputChange = (field, value) => {
    setProduct({ ...product, [field]: value });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview([...imagePreview, ...previews]);
    setProduct({ ...product, images: [...product.images, ...files] });
  };

  const removeImage = (index) => {
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    const newImages = product.images.filter((_, i) => i !== index);
    setImagePreview(newPreviews);
    setProduct({ ...product, images: newImages });
  };

  const addSpecification = () => {
    setProduct({
      ...product,
      specifications: [...product.specifications, { key: '', value: '' }]
    });
  };

  const removeSpecification = (index) => {
    const newSpecs = product.specifications.filter((_, i) => i !== index);
    setProduct({ ...product, specifications: newSpecs });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    onSave(product);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Product</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light">
          <div className="bg-white rounded p-4">
            <h6 className="mb-4">Basic Information</h6>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Product Name</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={product.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                  <Form.Control.Feedback type="invalid">
                    Please provide a product name.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>SKU</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={product.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    required
                    value={product.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                  >
                    <option value="">Select Category</option>
                    <option value="electronics">Electronics</option>
                    <option value="clothing">Clothing</option>
                    <option value="food">Food</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Price</Form.Label>
                  <Form.Control
                    type="number"
                    required
                    value={product.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    required
                    value={product.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Minimum Stock Level</Form.Label>
                  <Form.Control
                    type="number"
                    value={product.minStockLevel}
                    onChange={(e) => handleInputChange('minStockLevel', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>

          <div className="bg-white rounded p-4 mt-3">
            <h6 className="mb-4">Product Details</h6>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={product.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </Form.Group>

            <h6 className="mb-3">Specifications</h6>
            {product.specifications.map((spec, index) => (
              <Row key={index} className="g-2 mb-2">
                <Col>
                  <Form.Control
                    placeholder="Key"
                    value={spec.key}
                    onChange={(e) => {
                      const newSpecs = [...product.specifications];
                      newSpecs[index].key = e.target.value;
                      setProduct({ ...product, specifications: newSpecs });
                    }}
                  />
                </Col>
                <Col>
                  <Form.Control
                    placeholder="Value"
                    value={spec.value}
                    onChange={(e) => {
                      const newSpecs = [...product.specifications];
                      newSpecs[index].value = e.target.value;
                      setProduct({ ...product, specifications: newSpecs });
                    }}
                  />
                </Col>
                <Col xs="auto">
                  <Button 
                    variant="light" 
                    onClick={() => removeSpecification(index)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </Col>
              </Row>
            ))}
            <Button 
              variant="light" 
              className="mt-2"
              onClick={addSpecification}
            >
              Add Specification
            </Button>
          </div>

          <div className="bg-white rounded p-4 mt-3">
            <h6 className="mb-4">Images</h6>
            <div className="d-flex flex-wrap gap-3 mb-3">
              {imagePreview.map((preview, index) => (
                <div key={index} className="position-relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                    className="rounded"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    className="position-absolute top-0 end-0 rounded-circle"
                    onClick={() => removeImage(index)}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </Button>
                </div>
              ))}
            </div>
            <div className="d-flex justify-content-center align-items-center p-4 border-dashed rounded">
              <div className="text-center">
                <FontAwesomeIcon icon={faCloudUpload} className="fs-1 text-secondary mb-2" />
                <p className="mb-0">Drag and drop images here or</p>
                <label className="btn btn-link p-0">
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  browse
                </label>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide}>
            <FontAwesomeIcon icon={faTimes} className="me-2" />
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            <FontAwesomeIcon icon={faSave} className="me-2" />
            Save Product
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddProduct; 