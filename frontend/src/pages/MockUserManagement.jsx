import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faEdit, faTrash, faSearch, faFilter, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const MockUserManagement = () => {
  const [users, setUsers] = useState([
    { 
      id: 1, 
      username: 'admin', 
      email: 'admin@example.com',
      full_name: 'John Doe',
      role: 'admin',
      status: 'active',
      assigned_site: null,
      last_login: '2023-06-01T10:30:00Z'
    },
    { 
      id: 2, 
      username: 'manager1', 
      email: 'manager@example.com',
      full_name: 'Jane Smith',
      role: 'manager',
      status: 'active',
      assigned_site: 'Main Hospital',
      last_login: '2023-06-02T09:15:00Z'
    },
    { 
      id: 3, 
      username: 'user1', 
      email: 'user1@example.com',
      full_name: 'Bob Wilson',
      role: 'user',
      status: 'inactive',
      assigned_site: 'North Wing',
      last_login: '2023-05-28T14:20:00Z'
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  
  // Sites for dropdown
  const sites = [
    { id: 'main', name: 'Main Hospital' },
    { id: 'north', name: 'North Wing' },
    { id: 'south', name: 'South Wing' },
    { id: 'east', name: 'East Wing' },
    { id: 'west', name: 'West Wing' }
  ];
  
  // Rest of your component using the mock data
  // ...
  
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <Link to="/users" className="btn btn-outline-secondary">
            <FontAwesomeIcon icon={faChevronLeft} className="me-2" />
            Back to Users
          </Link>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col>
          <h2>User Management (Mock)</h2>
          <p className="text-muted">This is a mock implementation with local data for testing</p>
        </Col>
        <Col xs="auto">
          <Button variant="primary">
            <FontAwesomeIcon icon={faUserPlus} className="me-2" />
            Add User
          </Button>
        </Col>
      </Row>
      
      <Card>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Assigned Site</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.full_name || user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <Badge bg={user.status === 'active' ? 'success' : 'secondary'}>
                      {user.status}
                    </Badge>
                  </td>
                  <td>{user.assigned_site || 'All Sites'}</td>
                  <td>
                    <Button variant="outline-primary" size="sm" className="me-2">
                      <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    <Button variant="outline-danger" size="sm">
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default MockUserManagement; 