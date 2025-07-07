import React from 'react';
import { useSite, SiteProvider } from '../context/SiteContext';

const TestContent = () => {
  const { sites, currentSite } = useSite();
  
  return (
    <div>
      <h2>SiteContext Test</h2>
      <p>Sites available: {sites?.length || 0}</p>
      <p>Current site: {currentSite?.name || 'None selected'}</p>
    </div>
  );
};

const SiteContextTest = () => (
  <SiteProvider>
    <TestContent />
  </SiteProvider>
);

export default SiteContextTest; 