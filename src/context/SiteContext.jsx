import React, { createContext, useContext, useState, useEffect } from 'react';
import { sitesService } from '../services/sites.service';

const SiteContext = createContext();

export const useSite = () => {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return context;
};

export const SiteProvider = ({ children }) => {
  const [sites, setSites] = useState([]);
  const [currentSite, setCurrentSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        setLoading(true);
        const data = await sitesService.getSites();
        setSites(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSites();
  }, []);

  const selectSite = (siteId) => {
    const site = sites.find(s => s.id === siteId);
    setCurrentSite(site);
  };

  return (
    <SiteContext.Provider value={{ 
      sites, 
      currentSite, 
      selectSite, 
      loading, 
      error 
    }}>
      {children}
    </SiteContext.Provider>
  );
}; 