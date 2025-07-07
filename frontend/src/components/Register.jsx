import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Alert, Form, Button, Container, Row, Col, Card } from 'react-bootstrap';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        assigned_site: '',
        full_name: ''
    });
    const [sites, setSites] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingSites, setLoadingSites] = useState(true);

    // Fetch available sites on component mount
    useEffect(() => {
        const fetchSites = async () => {
            try {
                setLoadingSites(true);
                
                // Update the endpoint to match your API structure
                const response = await api.get('/sites');
                
                // Check response structure and extract sites correctly
                if (response.data && Array.isArray(response.data)) {
                    // If the response itself is an array
                    setSites(response.data);
                } else if (response.data && Array.isArray(response.data.sites)) {
                    // If the response has a sites property that's an array
                    setSites(response.data.sites);
                } else if (response.data && typeof response.data === 'object') {
                    // If the response is an object with site data
                    const siteArray = Object.values(response.data);
                    if (siteArray.length > 0) {
                        setSites(siteArray);
                    } else {
                        setSites([]);
                    }
                } else {
                    // Fallback
                    setSites([]);
                    console.warn('Unexpected sites data format:', response.data);
                }
            } catch (err) {
                console.error('Error fetching sites:', err);
                // Don't show error to user unless needed
                // setError('Failed to load sites. Please try again later.');
            } finally {
                setLoadingSites(false);
            }
        };

        fetchSites();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
        
        // Clear assigned site if role is admin
        if (name === 'role' && value === 'admin') {
            setFormData(prevState => ({
                ...prevState,
                assigned_site: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }
        
        // Validate site selection for non-admin users
        if (formData.role === 'user' && !formData.assigned_site) {
            setError('Please select an assigned site for this user');
            setLoading(false);
            return;
        }

        try {
            // Add detailed console logging
            console.log('Sending registration request with data:', {
                ...formData,
                password: '******', // Don't log actual password
                confirmPassword: '******'
            });
            
            // Make sure API endpoint matches your backend route
            const response = await api.post('/auth/register', {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                name: formData.full_name,
                role: formData.role,
                assigned_site: formData.assigned_site === '' ? null : formData.assigned_site
            });

            console.log('Registration response:', response.data);

            if (response.data.success) {
                // Registration successful, redirect to login
                navigate('/login');
            } else {
                setError(response.data.message || 'Registration failed');
            }
        } catch (err) {
            console.error('Registration error details:', err);
            
            // More specific error handling
            if (err.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Error response data:', err.response.data);
                console.error('Error response status:', err.response.status);
                
                if (err.response.status === 400) {
                    setError(err.response.data.message || 'Invalid registration information');
                } else if (err.response.status === 409) {
                    setError('User with this email or username already exists');
                } else if (err.response.status === 500) {
                    setError('Server error. Please try again later');
                } else {
                    setError(err.response.data.message || 'Error creating account. Please try again.');
                }
            } else if (err.request) {
                // The request was made but no response was received
                console.error('Error request:', err.request);
                setError('No response from server. Please check your connection and try again.');
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error message:', err.message);
                setError('Error creating account: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-white border-0 pt-4">
                            <h2 className="text-center">Register New User</h2>
                        </Card.Header>
                        <Card.Body className="px-4 py-4">
                            {error && <Alert variant="danger">{error}</Alert>}
                            
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Full Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>Username</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
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
                                                onChange={handleChange}
                                                required
                                                minLength="8"
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
                                                onChange={handleChange}
                                                required
                                                minLength="8"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Role</Form.Label>
                                            <Form.Select
                                                name="role"
                                                value={formData.role}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                                <option value="manager">Manager</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Assigned Site</Form.Label>
                                            <Form.Select
                                                name="assigned_site"
                                                value={formData.assigned_site}
                                                onChange={handleChange}
                                                required={formData.role === 'user'}
                                                disabled={formData.role === 'admin' || loadingSites}
                                            >
                                                <option value="">Select Site</option>
                                                {sites && sites.length > 0 ? (
                                                    sites.map(site => (
                                                        <option 
                                                            key={site.id || site._id || site.name} 
                                                            value={site.id || site._id || site.name}
                                                        >
                                                            {site.name || site.siteName || site.site_name}
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option value="" disabled>No sites available</option>
                                                )}
                                            </Form.Select>
                                            {formData.role === 'admin' && (
                                                <small className="text-muted">
                                                    Admins have access to all sites
                                                </small>
                                            )}
                                            {loadingSites && (
                                                <small className="text-muted">Loading sites...</small>
                                            )}
                                        </Form.Group>
                                    </Col>
                                </Row>
                                
                                <div className="d-grid mt-4">
                                    <Button 
                                        variant="primary" 
                                        type="submit" 
                                        disabled={loading}
                                    >
                                        {loading ? 'Creating Account...' : 'Register'}
                                    </Button>
                                </div>
                            </Form>
                            
                            <div className="mt-4 text-center">
                                <p>
                                    Already have an account? <a href="/login">Login</a>
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Register;