import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faList,
  faPlus,
  faBoxes,
  faBell,
  faFileAlt,
  faSearch,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import ProductList from '../components/Inventory/ProductList';
import Categories from '../components/Inventory/Categories';
import StockAlerts from '../components/Inventory/StockAlerts';
import GenerateReports from '../components/Inventory/GenerateReports';
import { NotificationProvider } from '../context/NotificationContext';
import axios from 'axios';
// import NotificationTester from '../components/testing/NotificationTester';

const InventoryCard = ({ title, icon, description, onClick }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className="h-100 border-0 shadow-sm cursor-pointer"
        onClick={onClick}
        style={{ cursor: 'pointer' }}
      >
        <Card.Body className="p-4">
          <div className="d-flex align-items-center mb-3">
            <div className="rounded-3 p-3 bg-primary bg-opacity-10 me-3">
              <FontAwesomeIcon icon={icon} className="text-primary fs-4" />
            </div>
            <h5 className="mb-0" style={{ fontFamily: 'Afacad, sans-serif' }}>
              {title}
            </h5>
          </div>
          <p className="text-secondary mb-0 small">
            {description}
          </p>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

const Inventory = () => {
  const [activeModule, setActiveModule] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inventoryData, setInventoryData] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [user, setUser] = useState(null);
  const [siteStats, setSiteStats] = useState({
    total: 0,
    active: 0,
    offline: 0,
    recent: 0,
    pending: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  // Function to fetch site-specific stats
  const fetchSiteStats = async (siteName) => {
    try {
      if (!siteName) return;
      
      setStatsLoading(true);
      setStatsError(null);
      
      // FIXED: Use proper API endpoint for site-specific stats
      console.log(`Fetching stats for site: ${siteName}`);
      const response = await axios.get(`/api/devices/site-stats/${encodeURIComponent(siteName)}`);
      
      if (response.data) {
        console.log(`Received stats for ${siteName}:`, response.data);
        // Ensure that we convert any null values to 0
        const cleanedStats = {
          total: response.data.total || 0,
          active: response.data.active || 0,
          offline: response.data.offline || 0,
          recent: response.data.recent || 0,
          pending: response.data.pending || 0
        };
        console.log('Setting stats to:', cleanedStats);
        setSiteStats(cleanedStats);
      }
    } catch (error) {
      console.error('Error fetching site stats:', error);
      setStatsError('Failed to load site statistics');
      // Reset stats to zero values on error
      setSiteStats({
        total: 0,
        active: 0,
        offline: 0,
        recent: 0,
        pending: 0
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleModuleClick = (moduleId) => {
    setActiveModule(moduleId);
  };

  const handleBack = () => {
    setActiveModule(null);
  };

  const fetchInventory = async () => {
    try {
      const siteToFetch = user?.role === 'admin' 
        ? selectedSite // Admin can select site
        : user?.assigned_site; // Regular user is locked to their site
      
      if (siteToFetch) {
        // Update the selected site to ensure stats are fetched
        setSelectedSite(siteToFetch);
      }
        
      // Fetch inventory for the appropriate site
      const siteParam = siteToFetch ? `?site=${siteToFetch}` : '';
      const response = await axios.get(`/api/inventory${siteParam}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      setInventoryData(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      // Don't use mock data, just set an empty array
      setInventoryData([]);
    }
  };

  useEffect(() => {
    // Get the current user from localStorage or context
    const userRole = localStorage.getItem('userRole');
    const assignedSite = localStorage.getItem('assignedSite');
    
    setUser({
      role: userRole,
      assigned_site: assignedSite
    });
    
    // Set the selected site based on user role or previously cached selection
    if (userRole === 'admin') {
      // Try to get previously selected site from localStorage first
      const lastSelectedSite = localStorage.getItem('lastSelectedSite');
      setSelectedSite(lastSelectedSite || '');
    } else {
      // Regular users are locked to their assigned site
      setSelectedSite(assignedSite);
    }
  }, []);

  // Separate useEffect to fetch inventory after user state is set
  useEffect(() => {
    if (user) {
      fetchInventory();
    }
  }, [user, selectedSite, fetchInventory]); // Add fetchInventory as dependency

  useEffect(() => {
    // When the selected site changes, fetch site-specific stats and cache the selection
    if (selectedSite) {
      // Cache the selected site for persistence across page refreshes
      localStorage.setItem('lastSelectedSite', selectedSite);
      
      // FIXED: Ensure we fetch site-specific stats when site changes
      fetchSiteStats(selectedSite);
    }
  }, [selectedSite, fetchSiteStats]); // Add fetchSiteStats as dependency

  // Add a useEffect to log when siteStats changes
  useEffect(() => {
    console.log('Site stats updated:', siteStats);
  }, [siteStats]);

  return (
    <NotificationProvider>
      <Container fluid>
        {/* <Row className="mt-4">
          <Col>
            <NotificationTester />
          </Col>
        </Row> */}
        <AnimatePresence mode="wait">
          {!activeModule ? (
            <motion.div
              key="inventory-home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Search Bar */}
              <div className="position-relative mb-4">
                <div className="position-absolute top-50 start-0 translate-middle-y ms-3">
                  <FontAwesomeIcon icon={faSearch} className="text-secondary" />
                </div>
                <input
                  type="text"
                  className="form-control form-control-lg ps-5 border-0 bg-light"
                  placeholder="Search inventory modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    borderRadius: '12px',
                    fontFamily: 'Afacad, sans-serif'
                  }}
                />
              </div>

              {/* Site Selection (for admin only) */}
              {user?.role === 'admin' && (
                <Row className="mb-4">
                  <Col>
                    <Card className="border-0 shadow-sm">
                      <Card.Body>
                        <h5 className="mb-3">Select Site</h5>
                        <select 
                          className="form-select"
                          value={selectedSite}
                          onChange={(e) => {
                            setSelectedSite(e.target.value);
                          }}
                        >
                          <option value="">All Sites</option>
                          <option value="Dameron Hospital">Dameron Hospital</option>
                          <option value="American Advance Management">American Advance Management</option>
                          <option value="Phoenix Specilaty Hospital">Phoenix Specialty Hospital</option>
                          <option value="Centeral Valley Specialty Hospital">Central Valley Specialty Hospital</option>
                          <option value="Coalinga Regional Medical Center">Coalinga Regional Medical Center</option>
                          <option value="Orchard Hospital">Orchard Hospital</option>
                          <option value="Gllen Medical Center">Glenn Medical Center</option>
                          <option value="Sonoma Specialty Hospital">Sonoma Specialty Hospital</option>
                          <option value="Kentfiled San Francisco">Kentfield San Francisco</option>
                          <option value="Kentfiled Marin">Kentfield Marin</option>
                          <option value="Aurora">Aurora</option>
                          <option value="Salt Lake Specialty Hospital">Salt Lake Specialty Hospital</option>
                          <option value="Baton Rouge Specialty Hospital">Baton Rouge Specialty Hospital</option>
                          <option value="Madera Community Hospital">Madera Community Hospital</option>
                          <option value="Colusa Medical Center">Colusa Medical Center</option>
                          <option value="Williams">Williams</option>
                          <option value="West Huschle">West Huschle</option>
                          <option value="Amarillo Specialty Hospital">Amarillo Specialty Hospital</option>
                        </select>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* Define inventory modules here, inside the render function */}
              {(() => {
                const inventoryModules = [
                  {
                    id: 'products',
                    title: 'Product List',
                    icon: faList,
                    description: 'View, add, edit, and manage all products in your inventory',
                    component: ProductList,
                    stats: { 
                      value: siteStats.total > 0 ? siteStats.total.toLocaleString() : '0', 
                      label: 'Total Products' 
                    }
                  },
                  {
                    id: 'categories',
                    title: 'Categories',
                    icon: faBoxes,
                    description: 'Manage and organize product categories and subcategories',
                    component: Categories,
                    stats: { 
                      value: siteStats.active > 0 ? siteStats.active.toLocaleString() : '0', 
                      label: 'Active Products' 
                    }
                  },
                  {
                    id: 'stock-alerts',
                    title: 'Stock Alerts',
                    icon: faBell,
                    description: 'View and manage low stock alerts and notifications',
                    component: StockAlerts,
                    stats: { 
                      value: siteStats.offline > 0 ? siteStats.offline.toLocaleString() : '0', 
                      label: 'Inactive Products' 
                    }
                  }
                ];

                const filteredModules = inventoryModules.filter(module =>
                  module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  module.description.toLowerCase().includes(searchQuery.toLowerCase())
                );

                return (
                  <>
                    {/* Quick Stats */}
                    <Row className="g-3 mb-4">
                      <Col xs={12}>
                        <h4 className="mb-3">
                          {selectedSite ? `${selectedSite} Inventory Stats` : 'Inventory Stats'}
                        </h4>
                        {statsLoading && (
                          <div className="text-center py-2">
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Loading statistics...
                          </div>
                        )}
                        {statsError && (
                          <div className="alert alert-danger py-2" role="alert">
                            {statsError}
                          </div>
                        )}
                      </Col>
                      {!statsLoading && inventoryModules.map(module => (
                        <Col key={module.id} md={3}>
                          <Card className="border-0 shadow-sm">
                            <Card.Body>
                              <div className="d-flex align-items-center">
                                <div className="rounded-3 p-3 bg-primary bg-opacity-10 me-3">
                                  <FontAwesomeIcon icon={module.icon} className="text-primary" />
                                </div>
                                <div>
                                  <h6 className="text-secondary mb-1">{module.stats.label}</h6>
                                  <h3 className="mb-0">{module.stats.value}</h3>
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>

                    {/* Module Cards */}
                    <Row className="g-4">
                      {filteredModules.map((module) => (
                        <Col key={module.id} md={6} lg={4}>
                          <motion.div
                            whileHover={{ y: -5 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Card 
                              className="h-100 border-0 shadow-sm cursor-pointer"
                              onClick={() => handleModuleClick(module.id)}
                              style={{ cursor: 'pointer' }}
                            >
                              <Card.Body className="p-4">
                                <div className="d-flex align-items-center mb-3">
                                  <div className="rounded-3 p-3 bg-primary bg-opacity-10 me-3">
                                    <FontAwesomeIcon icon={module.icon} className="text-primary fs-4" />
                                  </div>
                                  <h5 className="mb-0">{module.title}</h5>
                                </div>
                                <p className="text-secondary mb-0">
                                  {module.description}
                                </p>
                              </Card.Body>
                            </Card>
                          </motion.div>
                        </Col>
                      ))}
                    </Row>
                  </>
                )
              })()}
            </motion.div>
          ) : (
            <motion.div
              key="active-module"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="mb-4">
                <Button 
                  variant="light" 
                  className="d-flex align-items-center border-0 shadow-sm"
                  onClick={handleBack}
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                  Back to Inventory
                </Button>
              </div>

              <div className="mb-4">
                <h4>{selectedSite ? `${selectedSite} - ` : ''}
                  {activeModule === 'products' && 'Product List'}
                  {activeModule === 'categories' && 'Categories'}
                  {activeModule === 'stock-alerts' && 'Stock Alerts'}
                </h4>
                {statsLoading && (
                  <div className="text-center py-2">
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Loading data...
                  </div>
                )}
                {statsError && (
                  <div className="alert alert-danger py-2" role="alert">
                    {statsError}
                  </div>
                )}
              </div>
              
              {(() => {
                // Define modules again for the active view
                const inventoryModules = [
                  {
                    id: 'products',
                    title: 'Product List',
                    icon: faList,
                    description: 'View, add, edit, and manage all products in your inventory',
                    component: ProductList,
                    stats: { 
                      value: siteStats.total > 0 ? siteStats.total.toLocaleString() : '0', 
                      label: 'Total Products' 
                    }
                  },
                  {
                    id: 'categories',
                    title: 'Categories',
                    icon: faBoxes,
                    description: 'Manage and organize product categories and subcategories',
                    component: Categories,
                    stats: { 
                      value: siteStats.active > 0 ? siteStats.active.toLocaleString() : '0', 
                      label: 'Active Products' 
                    }
                  },
                  {
                    id: 'stock-alerts',
                    title: 'Stock Alerts',
                    icon: faBell,
                    description: 'View and manage low stock alerts and notifications',
                    component: StockAlerts,
                    stats: { 
                      value: siteStats.offline > 0 ? siteStats.offline.toLocaleString() : '0', 
                      label: 'Inactive Products' 
                    }
                  }
                ];
                
                return inventoryModules.map(module => (
                  module.id === activeModule && (
                    <div key={module.id}>
                      <h3 className="mb-4">{module.title}</h3>
                      <module.component data={inventoryData} siteName={selectedSite} />
                    </div>
                  )
                ));
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </NotificationProvider>
  );
};

export default Inventory; 