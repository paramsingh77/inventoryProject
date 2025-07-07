import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Nav } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxes } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';

const UserSideNav = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;
  
  // Get user location from currentUser
  const userLocation = currentUser?.location || 'Unknown Location';
  
  return (
    <div className="sidebar-wrapper">
      <div className="site-name mb-4">
        {userLocation}
      </div>
      
      <Nav className="flex-column">
        <Nav.Link 
          as={Link} 
          to="/user/inventory" 
          className={pathname.includes('/user/inventory') ? 'active' : ''}
        >
          <FontAwesomeIcon icon={faBoxes} className="me-2" />
          Inventory
        </Nav.Link>
      </Nav>
    </div>
  );
};

export default UserSideNav; 