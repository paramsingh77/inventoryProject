import React, { useState } from 'react';
import { Card, Table, Form, Button, InputGroup, Badge, Dropdown } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faFilter,
  faEdit,
  faTrash,
  faEllipsisV,
  faFileExport,
  faSort,
  faCheck,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

const styles = {
  container: {
    fontFamily: 'Afacad, sans-serif'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#344767'
  },
  header: {
    background: '#f8f9fa',
    borderBottom: '1px solid #dee2e6',
    padding: '1rem'
  },
  table: {
    fontSize: '0.875rem'
  },
  badge: {
    fontSize: '0.75rem',
    fontWeight: '500'
  }
};

const SupplierList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all'
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'companyName',
    direction: 'asc'
  });

  // Sample data - replace with API call
  const suppliers = [
    {
      id: 1,
      companyName: 'Acme Supplies',
      contactPerson: 'John Doe',
      email: 'john@acme.com',
      phone: '+1 234-567-8900',
      category: 'Hardware',
      status: 'active',
      rating: 4.5,
      lastOrder: '2024-01-15'
    },
    // Add more sample data
  ];

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleFilter = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'success',
      inactive: 'secondary',
      pending: 'warning',
      blocked: 'danger'
    };
    return (
      <Badge bg={badges[status]} style={styles.badge}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={styles.container}
    >
      <Card className="shadow-sm">
        {/* Header */}
        <div style={styles.header}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 style={styles.title}>Supplier Management</h5>
            <Button variant="primary" size="sm">
              <FontAwesomeIcon icon={faFileExport} className="me-2" />
              Export
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="d-flex gap-3">
            <InputGroup>
              <InputGroup.Text>
                <FontAwesomeIcon icon={faSearch} />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>

            <Dropdown>
              <Dropdown.Toggle variant="light" size="sm">
                <FontAwesomeIcon icon={faFilter} className="me-2" />
                Status
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => handleFilter('status', 'all')}>
                  All
                  {filters.status === 'all' && (
                    <FontAwesomeIcon icon={faCheck} className="ms-2" />
                  )}
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleFilter('status', 'active')}>
                  Active
                  {filters.status === 'active' && (
                    <FontAwesomeIcon icon={faCheck} className="ms-2" />
                  )}
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleFilter('status', 'inactive')}>
                  Inactive
                  {filters.status === 'inactive' && (
                    <FontAwesomeIcon icon={faCheck} className="ms-2" />
                  )}
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown>
              <Dropdown.Toggle variant="light" size="sm">
                <FontAwesomeIcon icon={faFilter} className="me-2" />
                Category
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => handleFilter('category', 'all')}>
                  All Categories
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleFilter('category', 'hardware')}>
                  Hardware
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleFilter('category', 'software')}>
                  Software
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        {/* Table */}
        <Table responsive hover style={styles.table}>
          <thead>
            <tr>
              <th onClick={() => handleSort('companyName')} style={{ cursor: 'pointer' }}>
                Company Name
                <FontAwesomeIcon 
                  icon={faSort} 
                  className="ms-2"
                  opacity={sortConfig.key === 'companyName' ? 1 : 0.3}
                />
              </th>
              <th>Contact Person</th>
              <th>Contact Info</th>
              <th>Category</th>
              <th>Status</th>
              <th onClick={() => handleSort('rating')} style={{ cursor: 'pointer' }}>
                Rating
                <FontAwesomeIcon 
                  icon={faSort} 
                  className="ms-2"
                  opacity={sortConfig.key === 'rating' ? 1 : 0.3}
                />
              </th>
              <th onClick={() => handleSort('lastOrder')} style={{ cursor: 'pointer' }}>
                Last Order
                <FontAwesomeIcon 
                  icon={faSort} 
                  className="ms-2"
                  opacity={sortConfig.key === 'lastOrder' ? 1 : 0.3}
                />
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(supplier => (
              <motion.tr
                key={supplier.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <td>{supplier.companyName}</td>
                <td>{supplier.contactPerson}</td>
                <td>
                  <div>{supplier.email}</div>
                  <div className="text-muted">{supplier.phone}</div>
                </td>
                <td>{supplier.category}</td>
                <td>{getStatusBadge(supplier.status)}</td>
                <td>{supplier.rating}</td>
                <td>{new Date(supplier.lastOrder).toLocaleDateString()}</td>
                <td>
                  <Dropdown align="end">
                    <Dropdown.Toggle variant="light" size="sm" className="border-0">
                      <FontAwesomeIcon icon={faEllipsisV} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item>
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Edit
                      </Dropdown.Item>
                      <Dropdown.Item className="text-danger">
                        <FontAwesomeIcon icon={faTrash} className="me-2" />
                        Delete
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </motion.div>
  );
};

export default SupplierList; 