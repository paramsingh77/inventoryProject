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

  const inventoryModules = [
    {
      id: 'products',
      title: 'Product List',
      icon: faList,
      description: 'View, add, edit, and manage all products in your inventory',
      component: ProductList,
      stats: { value: '1,234', label: 'Total Products' }
    },
    {
      id: 'categories',
      title: 'Categories',
      icon: faBoxes,
      description: 'Manage and organize product categories and subcategories',
      component: Categories,
      stats: { value: '8', label: 'Categories' }
    },
    {
      id: 'stock-alerts',
      title: 'Stock Alerts',
      icon: faBell,
      description: 'View and manage low stock alerts and notifications',
      component: StockAlerts,
      stats: { value: '15', label: 'Active Alerts' }
    },
    // {
    //   id: 'reports',
    //   title: 'Generate Reports',
    //   icon: faFileAlt,
    //   description: 'Create and download detailed inventory reports',
    //   component: GenerateReports,
    //   stats: { value: '45', label: 'Reports Generated' }
    // }
  ];

  const handleModuleClick = (moduleId) => {
    setActiveModule(moduleId);
  };

  const handleBack = () => {
    setActiveModule(null);
  };

  const filteredModules = inventoryModules.filter(module =>
    module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    // Get the current user from localStorage or context
    const userRole = localStorage.getItem('userRole');
    const assignedSite = localStorage.getItem('assignedSite');
    
    setUser({
      role: userRole,
      assigned_site: assignedSite
    });
    
    // Set the selected site based on user role
    if (userRole === 'admin') {
      // Admin can select any site, but we'll default to the first one
      setSelectedSite('');
    } else {
      // Regular users are locked to their assigned site
      setSelectedSite(assignedSite);
    }
    
    // Initial data fetch
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const siteToFetch = user?.role === 'admin' 
        ? selectedSite // Admin can select site
        : user?.assigned_site; // Regular user is locked to their site
        
      // Fetch inventory for the appropriate site
      const siteParam = siteToFetch ? `?site=${siteToFetch}` : '';
      const response = await fetch(`http://localhost:2000/api/inventory${siteParam}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory data');
      }
      
      const data = await response.json();
      setInventoryData(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      // Don't use mock data, just set an empty array
      setInventoryData([]);
    }
  };

  // Add this function to provide mock inventory data as fallback
  const getMockInventoryData = () => {
    return []; // Return an empty array instead of mock data since you want to use real data
  };

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

              {/* Quick Stats */}
              <Row className="g-3 mb-4">
                {inventoryModules.map(module => (
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
            </motion.div>
          ) : (
            <motion.div
              key="active-module"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Button
                variant="light"
                className="mb-4"
                onClick={handleBack}
              >
                <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                Back to Inventory
              </Button>
              {(() => {
                const ModuleComponent = inventoryModules.find(m => m.id === activeModule)?.component;
                return ModuleComponent ? <ModuleComponent data={inventoryData} /> : null;
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </NotificationProvider>
  );
};

export default Inventory; 