import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const userRole = user?.role;

  return (
    <div className="sidebar">
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/inventory">Inventory</Link>
      <Link to="/orders">Orders</Link>
      <Link to="/suppliers">Suppliers</Link>
      <Link to="/settings">Settings</Link>
      
      {/* Only show User Management for admins */}
      {userRole === 'admin' && (
        <Link 
          to="/users" 
          className={location.pathname === '/users' ? 'active' : ''}
        >
          <FontAwesomeIcon icon={faUsers} className="me-2" />
          User Management
        </Link>
      )}

      {process.env.NODE_ENV === 'development' && (
        <Link 
          to="/mock-users" 
          className={location.pathname === '/mock-users' ? 'active' : ''}
        >
          <FontAwesomeIcon icon={faUsers} className="me-2" />
          User Management (Mock)
        </Link>
      )}
    </div>
  );
};

export default Sidebar; 