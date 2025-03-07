import React, { useState } from 'react';
import { Table, Button, Form, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faSearch } from '@fortawesome/free-solid-svg-icons';
import { products } from '../../../data/samplePOData';

const ItemsSelection = ({ formData, setFormData }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const addItem = (product) => {
    setFormData({
      ...formData,
      items: [...formData.items, { ...product, quantity: 1 }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateQuantity = (index, quantity) => {
    const newItems = formData.items.map((item, i) => {
      if (i === index) {
        return { ...item, quantity: parseInt(quantity) || 0 };
      }
      return item;
    });
    setFormData({ ...formData, items: newItems });
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-4">
        <h6 className="mb-3">Selected Items</h6>
        <Table responsive>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {formData.items.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td style={{ width: '150px' }}>
                  <Form.Control
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(index, e.target.value)}
                  />
                </td>
                <td>${item.price}</td>
                <td>${(item.price * item.quantity).toFixed(2)}</td>
                <td>
                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => removeItem(index)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <div>
        <h6 className="mb-3">Add Items</h6>
        <InputGroup className="mb-3">
          <InputGroup.Text>
            <FontAwesomeIcon icon={faSearch} />
          </InputGroup.Text>
          <Form.Control
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>

        <Table responsive>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>${product.price}</td>
                <td>
                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => addItem(product)}
                    disabled={formData.items.some(item => item.id === product.id)}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default ItemsSelection; 