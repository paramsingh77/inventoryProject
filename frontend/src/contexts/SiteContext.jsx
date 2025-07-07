import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { getSites } from '../services/sites.service';

// Export the context so it can be accessed directly if needed
export const SiteContext = createContext();

export const useSite = () => {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return context;
};

export const SiteProvider = ({ children }) => {
  const [currentSite, setCurrentSite] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSites = async () => {
    try {
      setLoading(true);
      const data = await getSites();
      setSites(data);
      
      // If there's a site in localStorage, set it as current
      const savedSiteId = localStorage.getItem('selectedSiteId');
      if (savedSiteId && data.length > 0) {
        const site = data.find(s => s.id === savedSiteId) || data[0];
        setCurrentSite(site);
      } else if (data.length > 0) {
        // Default to first site if none is saved
        setCurrentSite(data[0]);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const changeSite = (site) => {
    console.log('🔵 [SITE_CONTEXT] Setting selected site:', { 
      siteId: site.id, 
      siteName: site.name,
      timestamp: new Date().toISOString()
    });
    
    localStorage.setItem('selectedSiteId', site.id);
    localStorage.setItem('selectedSiteName', site.name);
    setCurrentSite(site);
  };

  return (
    <SiteContext.Provider value={{ 
      currentSite, 
      sites, 
      loading, 
      error, 
      changeSite, 
      fetchSites 
    }}>
      {children}
    </SiteContext.Provider>
  );
}; 