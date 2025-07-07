import React, { useState } from 'react';
import { Table, Button, Form, InputGroup, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faSave,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';

const Categories = () => {
  const [categories, setCategories] = useState([
    { id: 1, name: 'Electronics', description: 'Electronic devices and accessories', subCategories: ['Phones', 'Laptops'] },
    { id: 2, name: 'Phones', description: 'Cell Phones and lanes', subCategories: ['IP', 'Wireless'] }
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { showNotification } = useNotification();

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    subCategories: []
  });

  const handleAddCategory = () => {
    if (!newCategory.name) {
      showNotification('error', 'Category name is required');
      return;
    }

    const categoryId = Date.now();
    setCategories([...categories, { ...newCategory, id: categoryId }]);
    setNewCategory({ name: '', description: '', subCategories: [] });
    setShowAddModal(false);
    showNotification('success', 'Category added successfully');
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategory(category);
    setShowAddModal(true);
  };

  const handleUpdateCategory = () => {
    const updatedCategories = categories.map(cat =>
      cat.id === editingCategory.id ? { ...newCategory, id: cat.id } : cat
    );
    setCategories(updatedCategories);
    setShowAddModal(false);
    setEditingCategory(null);
    setNewCategory({ name: '', description: '', subCategories: [] });
    showNotification('success', 'Category updated successfully');
  };

  const handleDeleteCategory = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(cat => cat.id !== categoryId));
      showNotification('success', 'Category deleted successfully');
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Categories</h4>
        <Button 
          variant="primary"
          onClick={() => {
            setEditingCategory(null);
            setNewCategory({ name: '', description: '', subCategories: [] });
            setShowAddModal(true);
          }}
        >
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Add Category
        </Button>
      </div>

      <div className="bg-light rounded-3 p-4 mb-4">
        <InputGroup>
          <InputGroup.Text className="bg-white border-end-0">
            <FontAwesomeIcon icon={faSearch} className="text-secondary" />
          </InputGroup.Text>
          <Form.Control
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-start-0"
          />
        </InputGroup>
      </div>

      <div className="bg-white rounded-3 shadow-sm">
        <Table hover responsive className="mb-0">
          <thead className="bg-light">
            <tr>
              <th>Category Name</th>
              <th>Description</th>
              <th>Subcategories</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.map((category) => (
              <motion.tr
                key={category.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <td>{category.name}</td>
                <td>{category.description}</td>
                <td>{category.subCategories.join(', ')}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="light" 
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    <Button 
                      variant="light" 
                      size="sm"
                      className="text-danger"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Add/Edit Category Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Category Name</Form.Label>
              <Form.Control
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Subcategories</Form.Label>
              <InputGroup className="mb-2">
                <Form.Control
                  placeholder="Add subcategory"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (e.target.value.trim()) {
                        setNewCategory({
                          ...newCategory,
                          subCategories: [...newCategory.subCategories, e.target.value.trim()]
                        });
                        e.target.value = '';
                      }
                    }
                  }}
                />
              </InputGroup>
              <div className="d-flex flex-wrap gap-2">
                {newCategory.subCategories.map((sub, index) => (
                  <div key={index} className="badge bg-light text-dark p-2">
                    {sub}
                    <button
                      type="button"
                      className="btn-close ms-2"
                      onClick={() => {
                        const newSubs = newCategory.subCategories.filter((_, i) => i !== index);
                        setNewCategory({ ...newCategory, subCategories: newSubs });
                      }}
                    />
                  </div>
                ))}
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowAddModal(false)}>
            <FontAwesomeIcon icon={faTimes} className="me-2" />
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
          >
            <FontAwesomeIcon icon={faSave} className="me-2" />
            {editingCategory ? 'Update' : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>
    </motion.div>
  );
};

export default Categories; 