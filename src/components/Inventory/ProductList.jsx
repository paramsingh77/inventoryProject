import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Form, InputGroup, Dropdown, Badge, Modal, ButtonGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faFilter, 
  faSort, 
  faEdit, 
  faTrash, 
  faEye,
  faFileExport,
  faPlus,
  faCheck,
  faBoxes,
  faTags,
  faDownload
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import AddProduct from './AddProduct';
import { useNotification } from '../../context/NotificationContext';

const ProductList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkActionData, setBulkActionData] = useState({
    category: '',
    status: '',
    price: ''
  });

  const [products, setProducts] = useState([
    { id: 1, name: 'Product 1', category: 'Electronics', quantity: 50, price: 299.99 },
    { id: 2, name: 'Product 2', category: 'Clothing', quantity: 100, price: 49.99 },
    { id: 3, name: 'Product 3', category: 'Books', quantity: 75, price: 19.99 },
  ]);
  
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const { addNotification } = useNotification();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    price: ''
  });

  useEffect(() => {
    if (currentProduct) {
      setFormData(currentProduct);
    } else {
      setFormData({
        name: '',
        category: '',
        quantity: '',
        price: ''
      });
    }
  }, [currentProduct]);

  const handleModalShow = (product = null) => {
    setCurrentProduct(product);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setCurrentProduct(null);
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (currentProduct) {
      // Update existing product
      setProducts(products.map(p => 
        p.id === currentProduct.id ? { ...formData, id: p.id } : p
      ));
      addNotification('success', 'Product updated successfully');
    } else {
      // Add new product
      setProducts([...products, { ...formData, id: Date.now() }]);
      addNotification('success', 'Product added successfully');
    }
    
    handleModalClose();
  };

  const handleDelete = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== productId));
      addNotification('success', 'Product deleted successfully');
    }
  };

  const categories = ['Electronics', 'Clothing', 'Food', 'Books'];

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'In Stock': 'success',
      'Low Stock': 'warning',
      'Out of Stock': 'danger'
    };
    return (
      <Badge bg={statusColors[status]} className="px-2 py-1">
        {status}
      </Badge>
    );
  };

  const handleAddProduct = (newProduct) => {
    // Here you would typically make an API call to save the product
    console.log('New product:', newProduct);
    // Then update your products list
    // setProducts([...products, { ...newProduct, id: products.length + 1 }]);
  };

  // Bulk selection handlers
  const handleSelectAll = (checked) => {
    setSelectedProducts(checked ? products.map(p => p.id) : []);
  };

  const handleSelectProduct = (productId, checked) => {
    setSelectedProducts(prev => 
      checked 
        ? [...prev, productId]
        : prev.filter(id => id !== productId)
    );
  };

  // Bulk action handlers
  const handleBulkAction = (action) => {
    setBulkAction(action);
    setShowBulkActionModal(true);
  };

  const executeBulkAction = () => {
    switch (bulkAction) {
      case 'delete':
        // Delete selected products
        setProducts(products.filter(p => !selectedProducts.includes(p.id)));
        addNotification('success', `${selectedProducts.length} products deleted`);
        break;
      case 'category':
        // Update category for selected products
        setProducts(products.map(p => 
          selectedProducts.includes(p.id) 
            ? { ...p, category: bulkActionData.category }
            : p
        ));
        addNotification('success', `Category updated for ${selectedProducts.length} products`);
        break;
      case 'status':
        // Update status for selected products
        setProducts(products.map(p => 
          selectedProducts.includes(p.id) 
            ? { ...p, status: bulkActionData.status }
            : p
        ));
        addNotification('success', `Status updated for ${selectedProducts.length} products`);
        break;
      case 'export':
        // Export selected products
        handleExportSelected();
        break;
    }
    setShowBulkActionModal(false);
    setSelectedProducts([]);
    setBulkActionData({ category: '', status: '', price: '' });
  };

  const handleExportSelected = () => {
    const selectedData = products.filter(p => selectedProducts.includes(p.id));
    // Implementation for export functionality
    console.log('Exporting:', selectedData);
    addNotification('success', 'Export started');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Product List</h4>
        <div className="d-flex gap-2">
          <Button 
            variant="primary" 
            className="d-flex align-items-center gap-2"
            onClick={() => handleModalShow()}
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Product
          </Button>
          <Button variant="light" className="d-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faFileExport} />
            Export
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar - Show when items are selected */}
      {selectedProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-light p-3 rounded-3 mb-4"
        >
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>{selectedProducts.length}</strong> items selected
            </div>
            <ButtonGroup>
              <Button 
                variant="outline-primary"
                onClick={() => handleBulkAction('category')}
              >
                <FontAwesomeIcon icon={faBoxes} className="me-2" />
                Update Category
              </Button>
              <Button 
                variant="outline-primary"
                onClick={() => handleBulkAction('status')}
              >
                <FontAwesomeIcon icon={faTags} className="me-2" />
                Update Status
              </Button>
              <Button 
                variant="outline-success"
                onClick={() => handleBulkAction('export')}
              >
                <FontAwesomeIcon icon={faDownload} className="me-2" />
                Export Selected
              </Button>
              <Button 
                variant="outline-danger"
                onClick={() => handleBulkAction('delete')}
              >
                <FontAwesomeIcon icon={faTrash} className="me-2" />
                Delete Selected
              </Button>
            </ButtonGroup>
          </div>
        </motion.div>
      )}

      {/* Filters and Search */}
      <div className="bg-light rounded-3 p-4 mb-4">
        <div className="row g-3">
          <div className="col-md-4">
            <InputGroup>
              <InputGroup.Text className="bg-white border-end-0">
                <FontAwesomeIcon icon={faSearch} className="text-secondary" />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-start-0"
              />
            </InputGroup>
          </div>
          <div className="col-md-3">
            <Dropdown>
              <Dropdown.Toggle variant="white" className="w-100 text-start">
                <FontAwesomeIcon icon={faFilter} className="me-2" />
                {selectedCategory === 'all' ? 'All Categories' : selectedCategory}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setSelectedCategory('all')}>
                  All Categories
                </Dropdown.Item>
                {categories.map((category) => (
                  <Dropdown.Item 
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3 shadow-sm">
        <Table hover responsive className="mb-0">
          <thead className="bg-light">
            <tr>
              <th>
                <Form.Check
                  type="checkbox"
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  checked={selectedProducts.length === products.length}
                />
              </th>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                Product Name
                <FontAwesomeIcon 
                  icon={faSort} 
                  className="ms-2 text-secondary"
                />
              </th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <motion.tr
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ backgroundColor: '#f8f9fa' }}
              >
                <td>
                  <Form.Check
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                  />
                </td>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>{product.category}</td>
                <td>${product.price}</td>
                <td>{product.quantity}</td>
                <td>{getStatusBadge(product.status)}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="light" 
                      size="sm"
                      className="btn-icon"
                      title="View Details"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </Button>
                    <Button 
                      variant="light" 
                      size="sm"
                      className="btn-icon"
                      title="Edit Product"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    <Button 
                      variant="light" 
                      size="sm"
                      className="btn-icon text-danger"
                      title="Delete Product"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </Table>

        {/* Pagination */}
        <div className="d-flex justify-content-between align-items-center p-3 border-top">
          <div className="text-secondary small">
            Showing 1-10 of 100 products
          </div>
          <div className="d-flex gap-2">
            <Button variant="light" size="sm">Previous</Button>
            <Button variant="primary" size="sm">Next</Button>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      <AddProduct
        show={showModal}
        onHide={handleModalClose}
        onSave={handleSubmit}
      />

      {/* Bulk Action Modal */}
      <Modal show={showBulkActionModal} onHide={() => setShowBulkActionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {bulkAction === 'delete' ? 'Confirm Delete' :
             bulkAction === 'category' ? 'Update Category' :
             bulkAction === 'status' ? 'Update Status' :
             'Export Products'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {bulkAction === 'delete' ? (
            <p>Are you sure you want to delete {selectedProducts.length} products?</p>
          ) : bulkAction === 'category' ? (
            <Form.Group>
              <Form.Label>Select Category</Form.Label>
              <Form.Select
                value={bulkActionData.category}
                onChange={(e) => setBulkActionData({ ...bulkActionData, category: e.target.value })}
              >
                <option value="">Select a category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          ) : bulkAction === 'status' ? (
            <Form.Group>
              <Form.Label>Select Status</Form.Label>
              <Form.Select
                value={bulkActionData.status}
                onChange={(e) => setBulkActionData({ ...bulkActionData, status: e.target.value })}
              >
                <option value="">Select a status...</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </Form.Select>
            </Form.Group>
          ) : (
            <p>Export {selectedProducts.length} selected products</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulkActionModal(false)}>
            Cancel
          </Button>
          <Button 
            variant={bulkAction === 'delete' ? 'danger' : 'primary'}
            onClick={executeBulkAction}
          >
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </motion.div>
  );
};

export default ProductList; 