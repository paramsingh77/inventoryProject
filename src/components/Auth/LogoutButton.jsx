import React from 'react';
import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

const LogoutButton = () => {
  const handleLogout = () => {
    // Clear all localStorage
    localStorage.clear();
    
    // Force redirect to login page
    window.location.replace('/login');
  };

  return (
    <Button 
      variant="outline-danger" 
      onClick={handleLogout}
      className="d-flex align-items-center gap-2"
    >
      <FontAwesomeIcon icon={faSignOutAlt} />
      <span>Logout</span>
    </Button>
  );
};

export default LogoutButton; 