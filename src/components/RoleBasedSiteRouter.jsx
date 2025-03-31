import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SitePage from '../pages/SitePage';
import UserLayout from './Layout/UserLayout';
import UserInventoryView from '../pages/UserInventoryView';

const RoleBasedSiteRouter = () => {
  const { siteName } = useParams();
  const { currentUser } = useAuth();
  
  // If user is admin, show the regular SitePage
  if (currentUser?.role === 'admin') {
    return <SitePage />;
  }
  
  // Otherwise, show the user-specific view
  return (
    <UserLayout>
      <UserInventoryView />
    </UserLayout>
  );
};

export default RoleBasedSiteRouter; 