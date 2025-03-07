import React from 'react';
import { Card, Table, Form, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const RoleManagement = () => {
  const roles = [
    {
      id: 1,
      name: 'Admin',
      permissions: ['all'],
      users: 3
    },
    {
      id: 2,
      name: 'Manager',
      permissions: ['view', 'edit', 'create'],
      users: 5
    },
    {
      id: 3,
      name: 'User',
      permissions: ['view'],
      users: 16
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Role Management</h4>
        <Button variant="primary">
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Add Role
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Table responsive hover className="mb-0">
          <thead className="bg-light">
            <tr>
              <th>Role Name</th>
              <th>Permissions</th>
              <th>Users</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role.id}>
                <td>{role.name}</td>
                <td>
                  {role.permissions.map(permission => (
                    <span key={permission} className="badge bg-light text-dark me-1">
                      {permission}
                    </span>
                  ))}
                </td>
                <td>{role.users}</td>
                <td>
                  <Button variant="light" size="sm" className="me-2">
                    <FontAwesomeIcon icon={faEdit} />
                  </Button>
                  <Button variant="light" size="sm" className="text-danger">
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </motion.div>
  );
};

export default RoleManagement; 