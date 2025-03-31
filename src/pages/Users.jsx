import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, InputGroup, Dropdown, Modal, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faEdit, faTrash, faSearch, faFilter, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useNotification } from '../context/NotificationContext';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [sites, setSites] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { addNotification } = useNotification();

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'user',
    status: 'active',
    assigned_site: ''
  });

  // Add site selection dropdown to user form
  const [availableSites, setAvailableSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');

  // Fetch users and sites on component mount
  useEffect(() => {
    fetchUsers();
    
    // Define fetchSites function here
    const fetchSites = async () => {
      try {
        console.log('Fetching sites for user assignment...');
        // Use the main sites endpoint
        const response = await api.get('/sites');
        console.log('Sites response:', response.data);
        
        if (Array.isArray(response.data) && response.data.length > 0) {
          setSites(response.data);
          setAvailableSites(response.data);
        } else {
          console.warn('No sites returned from API, using hardcoded site data');
          // Use the hardcoded site data from Sites.jsx
          const hardcodedSites = [
            { id: 'dameron', name: 'Dameron Hospital', location: 'Stockton' },
            { id: 'aam', name: 'American Advance Management', location: 'Modesto' },
            { id: 'phoenix', name: 'Phoenix Specialty Hospital', location: 'Phoenix' },
            { id: 'cvsh', name: 'Central Valley Specialty Hospital', location: '' },
            { id: 'crmc', name: 'Coalinga Regional Medical Center', location: 'Coalinga' },
            { id: 'orchard', name: 'Orchard Hospital', location: '' },
            { id: 'glenn', name: 'Glenn Medical Center', location: 'Willows' },
            { id: 'sonoma', name: 'Sonoma Specialty Hospital', location: 'Sonoma' },
            { id: 'kentfield-sf', name: 'Kentfield', location: 'San Francisco' },
            { id: 'kentfield-marin', name: 'Kentfield', location: 'Marin' },
            { id: 'aurora', name: 'Aurora', location: 'San Diego' },
            { id: 'slsh', name: 'Salt Lake Specialty Hospital', location: 'Salt Lake' },
            { id: 'brsh', name: 'Baton Rouge Specialty Hospital', location: 'Louisiana' },
            { id: 'madera', name: 'Madera Community Hospital', location: 'Madera' },
            { id: 'colusa', name: 'Colusa Medical Center', location: 'Colusa' },
            { id: 'williams', name: 'Williams', location: '' },
            { id: 'west-huschle', name: 'West Huschle', location: '' },
            { id: 'amarillo', name: 'Amarillo Specialty Hospital', location: 'Amarillo' }
          ];
          setSites(hardcodedSites);
          setAvailableSites(hardcodedSites);
        }
      } catch (error) {
        console.error('Error fetching sites:', error);
        // Use the hardcoded site data from Sites.jsx as fallback
        const hardcodedSites = [
          { id: 'dameron', name: 'Dameron Hospital', location: 'Stockton' },
          { id: 'aam', name: 'American Advance Management', location: 'Modesto' },
          { id: 'phoenix', name: 'Phoenix Specialty Hospital', location: 'Phoenix' },
          { id: 'cvsh', name: 'Central Valley Specialty Hospital', location: '' },
          { id: 'crmc', name: 'Coalinga Regional Medical Center', location: 'Coalinga' },
          { id: 'orchard', name: 'Orchard Hospital', location: '' },
          { id: 'glenn', name: 'Glenn Medical Center', location: 'Willows' },
          { id: 'sonoma', name: 'Sonoma Specialty Hospital', location: 'Sonoma' },
          { id: 'kentfield-sf', name: 'Kentfield', location: 'San Francisco' },
          { id: 'kentfield-marin', name: 'Kentfield', location: 'Marin' },
          { id: 'aurora', name: 'Aurora', location: 'San Diego' },
          { id: 'slsh', name: 'Salt Lake Specialty Hospital', location: 'Salt Lake' },
          { id: 'brsh', name: 'Baton Rouge Specialty Hospital', location: 'Louisiana' },
          { id: 'madera', name: 'Madera Community Hospital', location: 'Madera' },
          { id: 'colusa', name: 'Colusa Medical Center', location: 'Colusa' },
          { id: 'williams', name: 'Williams', location: '' },
          { id: 'west-huschle', name: 'West Huschle', location: '' },
          { id: 'amarillo', name: 'Amarillo Specialty Hospital', location: 'Amarillo' }
        ];
        setSites(hardcodedSites);
        setAvailableSites(hardcodedSites);
      }
    };
    
    // Call fetchSites
    fetchSites();
  }, []);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Make the API call to get users from the database
      const response = await api.get('/api/users');
      console.log('Users API response:', response.data);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      addNotification('error', 'Failed to fetch users');
      
      // Fallback to development mode if API fails
      if (process.env.NODE_ENV === 'development') {
        try {
          const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
          
          if (mockUsers.length > 0) {
            console.log('Using mock users from localStorage:', mockUsers);
            setUsers(mockUsers);
          } else {
            // Create default users
            const defaultUsers = [
              {
                id: '1',
                username: 'admin',
                email: 'admin@example.com',
                full_name: 'Admin User',
                role: 'admin',
                status: 'active',
                assigned_site: null,
                created_at: new Date().toISOString()
              },
              {
                id: '2',
                username: 'user',
                email: 'user@example.com',
                full_name: 'Regular User',
                role: 'user',
                status: 'active',
                assigned_site: 'Dameron Hospital',
                created_at: new Date().toISOString()
              }
            ];
            
            localStorage.setItem('mockUsers', JSON.stringify(defaultUsers));
            setUsers(defaultUsers);
          }
        } catch (e) {
          console.error('Error loading mock users:', e);
          setUsers([]);
        }
      } else {
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'All' ? true : user.role === roleFilter.toLowerCase();
    
    return matchesSearch && matchesRole;
  });

  // Handle input change for forms
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      full_name: '',
      role: 'user',
      status: 'active',
      assigned_site: ''
    });
  };

  // Open edit modal
  const handleEditClick = (user) => {
    setCurrentUser(user);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      password: '',
      confirmPassword: '',
      full_name: user.full_name || '',
      role: user.role || 'user',
      status: user.status || 'active',
      assigned_site: user.assigned_site || ''
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const handleDeleteClick = (user) => {
    setCurrentUser(user);
    setShowDeleteModal(true);
  };

  // Add user
  const handleAddUser = async (e) => {
    e.preventDefault();
    
    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        addNotification('error', 'Passwords do not match');
        return;
      }
      
      // Validate required fields
      if (!formData.username || !formData.email || !formData.password) {
        addNotification('error', 'Username, email and password are required');
        return;
      }
      
      // Validate site selection for non-admin users
      if (formData.role !== 'admin' && !formData.assigned_site) {
        addNotification('error', 'Please select a site for this user');
        return;
      }
      
      // Prepare user data for API
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name || '',
        role: formData.role,
        status: formData.status,
        assigned_site: formData.role === 'admin' ? null : formData.assigned_site
      };
      
      console.log('Sending user data to API:', userData);
      
      // Use the correct endpoint with /api prefix
      const response = await api.post('/api/users', userData);
      
      console.log('User created successfully:', response.data);
      
      // Add the new user to the state
      setUsers(prev => [...prev, response.data]);
      addNotification('success', 'User added successfully');
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding user:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        addNotification('error', 'Authentication failed. Please log in again.');
        // Optionally redirect to login page
      } else if (error.response?.status === 409) {
        addNotification('error', 'Username or email already exists');
      } else {
        const errorMessage = error.response?.data?.error || 
                            error.response?.data?.details || 
                            'Failed to add user';
        addNotification('error', errorMessage);
      }
    }
  };

  // Update user
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      addNotification('error', 'Passwords do not match');
      return;
    }
    
    try {
      console.log('Updating user with data:', {
        ...formData,
        password: formData.password ? '***REDACTED***' : '',
        confirmPassword: formData.confirmPassword ? '***REDACTED***' : ''
      });
      
      // Prepare update data
      const updateData = {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name || '',
        role: formData.role,
        status: formData.status,
        assigned_site: formData.role === 'admin' ? null : formData.assigned_site
      };
      
      // Only include password if it was changed
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      // Send update to API
      const response = await api.put(`/api/users/${currentUser.id}`, updateData);
      
      console.log('User updated successfully:', response.data);
      
      // Update user in state
      setUsers(prev => prev.map(user => 
        user.id === currentUser.id ? response.data : user
      ));
      
      addNotification('success', 'User updated successfully');
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error.response?.data?.error || 
                           error.response?.data?.details || 
                           'Failed to update user';
      addNotification('error', errorMessage);
      
      // Fallback for development mode
      if (process.env.NODE_ENV === 'development') {
        // Update user in the local state
        setUsers(prev => prev.map(user => 
          user.id === currentUser.id 
            ? {
                ...user,
                username: formData.username,
                email: formData.email,
                full_name: formData.full_name || '',
                role: formData.role,
                status: formData.status,
                assigned_site: formData.role === 'admin' ? null : formData.assigned_site,
                // Don't update password in the mock data
              }
            : user
        ));
        
        // Update in localStorage
        try {
          const existingUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
          const updatedUsers = existingUsers.map(user => 
            user.id === currentUser.id 
              ? {
                  ...user,
                  username: formData.username,
                  email: formData.email,
                  full_name: formData.full_name || '',
                  role: formData.role,
                  status: formData.status,
                  assigned_site: formData.role === 'admin' ? null : formData.assigned_site,
                }
              : user
          );
          localStorage.setItem('mockUsers', JSON.stringify(updatedUsers));
        } catch (e) {
          console.error('Error updating user in localStorage:', e);
        }
        
        addNotification('success', 'User updated successfully (Development Mode)');
        setShowEditModal(false);
        resetForm();
      }
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    try {
      console.log('Deleting user:', currentUser);
      
      // Send delete request to API
      await api.delete(`/api/users/${currentUser.id}`);
      
      // Remove user from state
      setUsers(prev => prev.filter(user => user.id !== currentUser.id));
      addNotification('success', 'User deleted successfully');
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error.response?.data?.error || 
                           error.response?.data?.details || 
                           'Failed to delete user';
      addNotification('error', errorMessage);
      
      // Fallback for development mode
      if (process.env.NODE_ENV === 'development') {
        // Remove user from the local state
        setUsers(prev => prev.filter(user => user.id !== currentUser.id));
        
        // Remove from localStorage
        try {
          const existingUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
          const updatedUsers = existingUsers.filter(user => user.id !== currentUser.id);
          localStorage.setItem('mockUsers', JSON.stringify(updatedUsers));
        } catch (e) {
          console.error('Error removing user from localStorage:', e);
        }
        
        addNotification('success', 'User deleted successfully (Development Mode)');
        setShowDeleteModal(false);
      }
    }
  };

  // Get badge variant based on user status
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'secondary';
      case 'suspended':
        return 'warning';
      default:
        return 'light';
    }
  };

  // At the top of your component
  useEffect(() => {
    // Debug token
    const token = localStorage.getItem('token');
    console.log('Current token:', token ? `${token.substring(0, 15)}...` : 'No token found');
    
    // Check token expiration
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        
        console.log('Token expires in:', Math.round((expirationTime - currentTime) / 1000 / 60), 'minutes');
        
        if (expirationTime < currentTime) {
          console.warn('Token has expired!');
          addNotification('warning', 'Your session has expired. Please log in again.');
        }
      } catch (e) {
        console.error('Error parsing token:', e);
      }
    }
  }, []);

  return (
    <Container fluid className="py-4">
      {/* Header and Navigation */}
      <Row className="mb-4">
        <Col>
          <Link to="/dashboard" className="text-decoration-none">
            <motion.div
              whileHover={{ x: -5 }}
              className="d-inline-flex align-items-center text-secondary mb-3"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="me-2" />
              Back to Dashboard
            </motion.div>
          </Link>
          <h2 className="mb-1">User Management</h2>
          <p className="text-muted">
            Manage system users and their permissions
          </p>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Row className="mb-4">
        <Col md={6} lg={4}>
          <InputGroup>
            <InputGroup.Text>
              <FontAwesomeIcon icon={faSearch} />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3} lg={3}>
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" id="dropdown-role" className="w-100">
              <FontAwesomeIcon icon={faFilter} className="me-2" />
              {roleFilter} Roles
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setRoleFilter('All')}>All Roles</Dropdown.Item>
              <Dropdown.Item onClick={() => setRoleFilter('Admin')}>Admin</Dropdown.Item>
              <Dropdown.Item onClick={() => setRoleFilter('User')}>User</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
        <Col md={3} lg={5} className="text-end">
          <Button 
            variant="primary" 
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            <FontAwesomeIcon icon={faUserPlus} className="me-2" />
            Add New User
          </Button>
                  </Col>
              </Row>

      {/* Users Table */}
      <Card>
        <Card.Body>
          <Table responsive hover className="align-middle">
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Assigned Site</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.full_name}</td>
                    <td>{user.email}</td>
                    <td>
                      <Badge bg={user.role === 'admin' ? 'primary' : 'info'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={getStatusBadge(user.status)}>
                        {user.status}
                      </Badge>
                    </td>
                    <td>
                      {user.role === 'admin' ? (
                        <Badge bg="secondary">All Sites</Badge>
                      ) : (
                        user.assigned_site || <Badge bg="danger">Not Assigned</Badge>
                      )}
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleEditClick(user)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDeleteClick(user)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
                        </Card.Body>
                      </Card>

      {/* Add User Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddUser}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
                  </Col>
              </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select 
                name="role" 
                value={formData.role} 
                onChange={handleInputChange}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Form.Group>
            
            {formData.role === 'user' && (
              <Form.Group className="mb-3">
                <Form.Label>Assigned Site</Form.Label>
                <Form.Select 
                  name="assigned_site"
                  value={formData.assigned_site}
                  onChange={handleInputChange}
                  required={formData.role === 'user'}
                >
                  <option value="">Select a site</option>
                  {sites.map(site => (
                    <option key={site.id || site.Name} value={site.name || site.Name}>
                      {site.name || site.Name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Regular users can only access their assigned site's inventory
                </Form.Text>
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Add User
              </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit User: {currentUser?.username}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateUser}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Leave blank to keep current password"
                  />
                  <Form.Text className="text-muted">
                    Leave blank to keep current password
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Leave blank to keep current password"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Assigned Site</Form.Label>
                  <Form.Select
                    name="assigned_site"
                    value={formData.assigned_site}
                    onChange={handleInputChange}
                    disabled={formData.role === 'admin'}
                    required={formData.role !== 'admin'}
                  >
                    <option value="">Select Site</option>
                    {sites.map(site => (
                      <option key={site.id} value={site.name}>
                        {site.name}
                      </option>
                    ))}
                  </Form.Select>
                  {formData.role === 'admin' && (
                    <Form.Text className="text-muted">
                      Admins have access to all sites
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateUser}>
              Update User
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete user <strong>{currentUser?.username}</strong>?
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteUser}>
            Delete User
          </Button>
        </Modal.Footer>
      </Modal>
      </Container>
  );
};

export default Users; 