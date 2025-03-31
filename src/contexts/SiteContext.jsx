import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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
      const response = await axios.get('/api/sites');
      setSites(response.data);
      
      // If there's a site in localStorage, set it as current
      const savedSiteId = localStorage.getItem('selectedSiteId');
      if (savedSiteId && response.data.length > 0) {
        const site = response.data.find(s => s.id === savedSiteId) || response.data[0];
        setCurrentSite(site);
      } else if (response.data.length > 0) {
        // Default to first site if none is saved
        setCurrentSite(response.data[0]);
      }
    } catch (err) {
      setError('Failed to fetch sites');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const changeSite = (site) => {
    setCurrentSite(site);
    localStorage.setItem('selectedSiteId', site.id);
    localStorage.setItem('selectedSiteName', site.name);
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