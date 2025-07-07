import React, { useState, useEffect } from 'react';
import { Card, Table, Form, Button, InputGroup, Badge, Dropdown, Modal, Spinner } from 'react-bootstrap';
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
  faTimes,
  faExclamationTriangle,
  faRefresh
} from '@fortawesome/free-solid-svg-icons';
import SupplierService from '../../services/SupplierService';
import { useNotification } from '../../context/NotificationContext';

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
  const { addNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all'
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'companyName',
    direction: 'asc'
  });
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch suppliers on component mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SupplierService.getAllSuppliers();
      
      console.log('API Response - Suppliers:', data);
      
      // Transform data for frontend if needed
      const formattedSuppliers = data.map(supplier => ({
        id: supplier.id,
        companyName: supplier.name,
        contactPerson: supplier.contact_person || 'N/A',
        email: supplier.email || 'N/A',
        phone: supplier.phone || 'N/A',
        category: supplier.category || 'General',
        status: supplier.status || 'active',
        rating: supplier.rating || 'N/A',
        lastOrder: supplier.last_order_date || new Date().toISOString().split('T')[0]
      }));
      
      console.log('Formatted Suppliers:', formattedSuppliers);
      setSuppliers(formattedSuppliers);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Failed to fetch suppliers. Please try again later.');
      addNotification('error', 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete supplier
  const handleDeleteClick = (supplier) => {
    setSupplierToDelete(supplier);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    
    try {
      setIsDeleting(true);
      await SupplierService.deleteSupplier(supplierToDelete.id);
      
      // Remove from state
      setSuppliers(suppliers.filter(s => s.id !== supplierToDelete.id));
      
      // Show success notification
      addNotification('success', `Supplier "${supplierToDelete.companyName}" deleted successfully`);
      
      // Close modal
      setShowDeleteModal(false);
      setSupplierToDelete(null);
    } catch (err) {
      console.error('Error deleting supplier:', err);
      addNotification('error', 'Failed to delete supplier');
    } finally {
      setIsDeleting(false);
    }
  };

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

  // Apply filters and sorting
  const filteredSuppliers = suppliers
    .filter(supplier => {
      // Text search
      const matchesSearch = searchTerm === '' || 
        Object.values(supplier).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      // Status filter
      const matchesStatus = filters.status === 'all' || 
        supplier.status === filters.status;
      
      // Category filter
      const matchesCategory = filters.category === 'all' || 
        supplier.category?.toLowerCase() === filters.category;
      
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      // Handle sorting
      const key = sortConfig.key;
      
      if (a[key] < b[key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge bg="success" style={styles.badge}>Active</Badge>;
      case 'inactive':
        return <Badge bg="secondary" style={styles.badge}>Inactive</Badge>;
      case 'pending':
        return <Badge bg="warning" style={styles.badge}>Pending</Badge>;
      default:
        return <Badge bg="light" text="dark" style={styles.badge}>{status}</Badge>;
    }
  };

  // Handle sync from inventory
  const handleSyncFromInventory = async () => {
    try {
      setIsSyncing(true);
      addNotification('info', 'Synchronizing suppliers from inventory. This may take a moment...');
      
      console.log('Starting supplier sync...');
      const result = await SupplierService.syncFromInventory();
      console.log('Sync result:', result);
      
      // Show success notification
      addNotification('success', result.message || 'Suppliers synchronized successfully');
      
      // Reload suppliers immediately to show the new data
      console.log('Reloading suppliers after sync...');
      await fetchSuppliers();
      console.log('Suppliers reloaded successfully');
    } catch (err) {
      console.error('Error syncing suppliers from inventory:', err);
      let errorMessage = 'Failed to sync suppliers from inventory';
      
      // Extract more detailed error message if available
      if (err.response && err.response.data) {
        errorMessage = err.response.data.error || err.response.data.message || errorMessage;
        if (err.response.data.details) {
          console.error('Error details:', err.response.data.details);
        }
      }
      
      addNotification('error', errorMessage);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={styles.container}
    >
      <Card className="shadow-sm">
        <Card.Header style={styles.header}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 style={styles.title}>Suppliers</h5>
            <div className="d-flex gap-2">
              <Button 
                variant={isSyncing ? "primary" : "outline-primary"}
                size="sm"
                onClick={handleSyncFromInventory}
                disabled={isSyncing}
                className="d-flex align-items-center"
              >
                <FontAwesomeIcon 
                  icon={faRefresh} 
                  className={isSyncing ? "me-2 fa-spin" : "me-2"} 
                />
                <span>{isSyncing ? 'Syncing...' : 'Sync from Inventory'}</span>
                {isSyncing && (
                  <Spinner 
                    animation="border" 
                    size="sm" 
                    role="status" 
                    className="ms-2"
                    style={{ width: '12px', height: '12px' }}
                  >
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                )}
              </Button>
              <Button 
                variant="light" 
                size="sm"
                onClick={fetchSuppliers}
                disabled={loading}
              >
                <FontAwesomeIcon 
                  icon={faRefresh} 
                  className={loading ? "me-2 fa-spin" : "me-2"} 
                />
                Refresh
              </Button>
            </div>
          </div>
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
        </Card.Header>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-3 text-muted">Loading suppliers...</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="text-center py-5">
            <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="text-danger mb-3" />
            <p className="text-danger">{error}</p>
            <Button variant="outline-primary" onClick={fetchSuppliers}>
              <FontAwesomeIcon icon={faRefresh} className="me-2" />
              Retry
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredSuppliers.length === 0 && (
          <div className="text-center py-5">
            <p className="text-muted">No suppliers found. Add your first supplier or try a different search.</p>
          </div>
        )}

        {/* Table with data */}
        {!loading && !error && filteredSuppliers.length > 0 && (
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
              {filteredSuppliers.map(supplier => (
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
                  <td>{supplier.lastOrder ? 
                      new Date(supplier.lastOrder).toLocaleDateString() : 
                      'No orders yet'}
                  </td>
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
                        <Dropdown.Item 
                          className="text-danger"
                          onClick={() => handleDeleteClick(supplier)}
                        >
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
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete supplier <strong>{supplierToDelete?.companyName}</strong>?
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Deleting...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faTrash} className="me-2" />
                Delete
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </motion.div>
  );
};

export default SupplierList; 