import React, { useState } from 'react';
import { Table, Button, Form, InputGroup, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faEdit,
  faTrash,
  faPlus,
  faFilter
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';

const UserList = () => {
  const [users] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Manager', status: 'Active' },
    { id: 3, name: 'Bob Wilson', email: 'bob@example.com', role: 'User', status: 'Inactive' },
  ]);

  const { addNotification } = useNotification();

  const handleDelete = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      addNotification('success', 'User deleted successfully');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">User Management</h4>
        <Button variant="primary" className="d-flex align-items-center gap-2">
          <FontAwesomeIcon icon={faPlus} />
          Add User
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-light rounded-3 p-4 mb-4">
        <div className="row g-3">
          <div className="col-md-4">
            <InputGroup>
              <InputGroup.Text className="bg-white border-end-0">
                <FontAwesomeIcon icon={faSearch} className="text-secondary" />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search users..."
                className="border-start-0"
              />
            </InputGroup>
          </div>
          <div className="col-md-3">
            <Dropdown>
              <Dropdown.Toggle variant="white" className="w-100 text-start">
                <FontAwesomeIcon icon={faFilter} className="me-2" />
                All Roles
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item>All Roles</Dropdown.Item>
                <Dropdown.Item>Admin</Dropdown.Item>
                <Dropdown.Item>Manager</Dropdown.Item>
                <Dropdown.Item>User</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3 shadow-sm">
        <Table hover responsive className="mb-0">
          <thead className="bg-light">
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ backgroundColor: '#f8f9fa' }}
              >
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <span className={`badge bg-${user.status === 'Active' ? 'success' : 'secondary'}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="light" 
                      size="sm"
                      className="btn-icon"
                      title="Edit User"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    <Button 
                      variant="light" 
                      size="sm"
                      className="btn-icon text-danger"
                      title="Delete User"
                      onClick={() => handleDelete(user.id)}
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
    </motion.div>
  );
};

export default UserList; 