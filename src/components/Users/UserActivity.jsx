import React from 'react';
import { Card, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserEdit, 
  faSignInAlt, 
  faSignOutAlt,
  faCog
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const UserActivity = () => {
  const activities = [
    {
      id: 1,
      user: 'John Doe',
      action: 'Login',
      details: 'Logged in from 192.168.1.1',
      timestamp: '2024-01-20 09:30:00',
      icon: faSignInAlt
    },
    {
      id: 2,
      user: 'Jane Smith',
      action: 'Profile Update',
      details: 'Updated profile information',
      timestamp: '2024-01-20 10:15:00',
      icon: faUserEdit
    },
    {
      id: 3,
      user: 'Bob Wilson',
      action: 'Settings Change',
      details: 'Modified notification settings',
      timestamp: '2024-01-20 11:00:00',
      icon: faCog
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h4 className="mb-4">User Activity Log</h4>
      
      <Card className="border-0 shadow-sm">
        <Table responsive hover className="mb-0">
          <thead className="bg-light">
            <tr>
              <th>Action</th>
              <th>User</th>
              <th>Details</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {activities.map(activity => (
              <tr key={activity.id}>
                <td>
                  <FontAwesomeIcon 
                    icon={activity.icon} 
                    className="me-2 text-primary"
                  />
                  {activity.action}
                </td>
                <td>{activity.user}</td>
                <td>{activity.details}</td>
                <td>{activity.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </motion.div>
  );
};

export default UserActivity; 