import React, { useContext, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const InventoryManagement = ({ siteName }) => {
  const { user, checkSiteAccess } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  useEffect(() => {
    if (siteName && !checkSiteAccess(siteName)) {
      addNotification('error', 'You do not have access to this site');
      navigate('/inventory');
    }
  }, [siteName, checkSiteAccess, navigate, addNotification]);

  return (
    // Rest of the component code
  );
};

export default InventoryManagement; 