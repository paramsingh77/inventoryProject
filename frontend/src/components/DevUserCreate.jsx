import React, { useState } from 'react';
import api from '../utils/api';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';

const DevUserCreate = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'user'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await api.post('/auth/create-user', {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role
      });
      
      setSuccess(true);
      setCreatedUser(response.data.data.user);
      
      // Clear form
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: 'user'
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container className="mt-5">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h2 className="text-center mb-0">Create User (Development Only)</h2>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && (
            <Alert variant="success">
              User created successfully!
            </Alert>
          )}
          
          {createdUser && (
            <Alert variant="info">
              <h5>Created User Details:</h5>
              <p><strong>Name:</strong> {createdUser.name}</p>
              <p><strong>Email:</strong> {createdUser.email}</p>
              <p><strong>Role:</strong> {createdUser.role}</p>
            </Alert>
          )}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Name (Optional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <div className="input-group">
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="8"
                />
                <Button 
                  variant="outline-secondary"
                  onClick={toggleShowPassword}
                  type="button"
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </Button>
              </div>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Confirm password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength="8"
              />
            </Form.Group>
            
            <Button 
              variant="primary" 
              type="submit" 
              className="w-100"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </Form>
        </Card.Body>
        <Card.Footer className="text-muted text-center">
          <small>⚠️ For development purposes only - not for production use</small>
        </Card.Footer>
      </Card>
    </Container>
  );
};

export default DevUserCreate; 