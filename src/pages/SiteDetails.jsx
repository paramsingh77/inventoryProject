import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/Layout/MainLayout';
import Inventory from './Inventory';

const SiteDetails = () => {
  const { siteName } = useParams();
  const { user, checkSiteAccess } = useAuth();
  
  // Redirect if user doesn't have access to this site
  const hasAccess = checkSiteAccess(siteName);
  
  useEffect(() => {
    // Set the current site in localStorage for persistence
    if (siteName && hasAccess) {
      localStorage.setItem('lastSelectedSite', siteName);
    }
  }, [siteName, hasAccess]);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return (
    <MainLayout>
      <Inventory siteName={siteName} />
    </MainLayout>
  );
};

export default SiteDetails; 