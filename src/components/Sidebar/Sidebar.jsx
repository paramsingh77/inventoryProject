import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSite } from '../../contexts/SiteContext';
import { faDashboard, faBuilding, faBoxes, faShoppingCart, faTruck, faUsers, faCog } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Sidebar = () => {
  const { user } = useAuth();
  const { currentSite } = useSite();

  const menuItems = user?.role === 'admin' ? [
    { path: '/dashboard', icon: faDashboard, text: 'Dashboard' },
    { path: '/sites', icon: faBuilding, text: 'Sites' },
    { path: '/inventory', icon: faBoxes, text: 'Inventory' },
    { path: '/orders', icon: faShoppingCart, text: 'Orders' },
    { path: '/suppliers', icon: faTruck, text: 'Suppliers' },
    { path: '/users', icon: faUsers, text: 'Users' },
    { path: '/settings', icon: faCog, text: 'Settings' }
  ] : [
    { path: '/inventory', icon: faBoxes, text: 'Inventory' }
  ];

  return (
    <div className="sidebar">
      {currentSite && (
        <div className="site-info mb-4">
          <h6>{currentSite.name}</h6>
        </div>
      )}
      {/* Rest of your sidebar code */}
    </div>
  );
};

export default Sidebar; 