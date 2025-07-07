import React, { createContext, useContext, useState } from 'react';

// Create a new context that's separate from the original
export const SafeSiteContext = createContext();

// This hook never throws errors
export const useSafeSite = () => {
  const context = useContext(SafeSiteContext);
  return context || { 
    currentSite: { name: 'All Sites', id: 'default' },
    sites: [],
    loading: false,
    error: null,
    changeSite: () => console.log('Site context not available'),
    fetchSites: () => console.log('Site context not available')
  };
};

export const SafeSiteProvider = ({ children }) => {
  const [currentSite, setCurrentSite] = useState({ name: 'All Sites', id: 'default' });
  const [sites, setSites] = useState([]);
  
  const changeSite = (site) => {
    setCurrentSite(site);
    localStorage.setItem('selectedSiteId', site.id);
    localStorage.setItem('selectedSiteName', site.name);
  };
  
  const fetchSites = () => {
    console.log('Fetch sites called in SafeSiteProvider');
  };

  return (
    <SafeSiteContext.Provider value={{ 
      currentSite, 
      sites, 
      loading: false, 
      error: null, 
      changeSite, 
      fetchSites 
    }}>
      {children}
    </SafeSiteContext.Provider>
  );
}; 