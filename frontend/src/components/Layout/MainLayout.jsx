import { useState, useEffect } from 'react';
import { Nav, Container, Button } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import TopNav from './TopNav';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faBox,
  faUsers,
  faShoppingCart,
  faTruck,
  faChartLine,
  faCog,
  faAngleRight,
  faAngleLeft,
  faSignOutAlt,
  faArrowRight,
  faStore
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';

const MainLayout = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { darkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [currentSiteName, setCurrentSiteName] = useState(null);
  const { directLogout, user } = useAuth();
  
  // Extract site name from URL or state
  useEffect(() => {
    // First check URL params
    if (params.siteName) {
      setCurrentSiteName(params.siteName);
    } 
    // Then check location state
    else if (location.state && location.state.siteName) {
      setCurrentSiteName(location.state.siteName);
    }
    // Finally check localStorage
    else {
      const lastSelectedSite = localStorage.getItem('lastSelectedSite');
      if (lastSelectedSite) {
        try {
          const siteData = JSON.parse(lastSelectedSite);
          setCurrentSiteName(siteData.siteName);
        } catch (e) {
          console.error("Error parsing stored site data:", e);
        }
      }
    }
  }, [params, location]);

  // Generate menu items with dynamic paths based on current site
  const getMenuItems = () => {
    // For admin users, show all menu items
    if (user?.role === 'admin') {
      // If no site is selected, use static paths
      if (!currentSiteName) {
        return [
          { path: '/dashboard', icon: faHome, label: 'Dashboard' },
          { path: '/inventory', icon: faBox, label: 'Inventory' },
          // IT Store not shown if no site selected
          { path: '/users', icon: faUsers, label: 'Users' },
          { path: '/orders', icon: faShoppingCart, label: 'Orders' },
          { path: '/suppliers', icon: faTruck, label: 'Suppliers' },
          { path: '/settings', icon: faCog, label: 'Settings' }
        ];
      }
      
      // With site context, use site-specific paths
      return [
        { path: `/inventory/${currentSiteName}/dashboard`, icon: faHome, label: 'Dashboard' },
        { path: `/inventory/${currentSiteName}/inventory`, icon: faBox, label: 'Inventory' },
        { path: `/inventory/${currentSiteName}/store`, icon: faStore, label: 'IT Store' },
        { path: `/inventory/${currentSiteName}/users`, icon: faUsers, label: 'Users' },
        { path: `/inventory/${currentSiteName}/orders`, icon: faShoppingCart, label: 'Orders' },
        { path: `/inventory/${currentSiteName}/suppliers`, icon: faTruck, label: 'Suppliers' },
        { path: `/inventory/${currentSiteName}/settings`, icon: faCog, label: 'Settings' }
      ];
    }
    
    // For regular users, show inventory and store
    return [
      { path: `/inventory/${user?.assigned_site}/inventory`, icon: faBox, label: 'Inventory' },
      { path: `/inventory/${user?.assigned_site}/store`, icon: faStore, label: 'IT Store' }
    ];
  };
  
  const menuItems = getMenuItems();
  
  // Get the current section from the URL path
  const getCurrentSection = () => {
    const pathParts = location.pathname.split('/');
    // If we're in a site-specific route, the section is the last part
    if (pathParts.length >= 3 && pathParts[1] === 'inventory') {
      return pathParts[pathParts.length - 1];
    }
    // Otherwise, use the first path segment
    return pathParts[1] || 'dashboard';
  };

  // Check if a path is active based on the current URL
  const isActivePath = (path) => {
    // For site-specific paths, match the last segment
    if (path.includes('/inventory/') && location.pathname.includes('/inventory/')) {
      const pathSegments = path.split('/');
      const currentSegments = location.pathname.split('/');
      
      // Match the last segment (the section)
      const pathSection = pathSegments[pathSegments.length - 1];
      const currentSection = currentSegments[currentSegments.length - 1];
      
      return pathSection === currentSection;
    }
    
    // For general paths, direct match
    return location.pathname === path;
  };

  return (
    <Container fluid>
      <div className={`d-flex ${darkMode ? 'dark-theme' : ''}`}>
        {/* Sidebar */}
        <motion.div
          initial={{ width: 240 }}
          animate={{ width: isExpanded ? 240 : 70 }}
          className={`vh-100 position-fixed ${darkMode ? 'bg-black' : 'bg-white'}`}
          style={{ 
            zIndex: 1030,
            borderRight: darkMode ? '1px solid #2a2a2a' : '1px solid #e5e5e5'
          }}
        >
          <div className="d-flex flex-column h-100">
            {/* Logo Area */}
            <div className={`p-3 border-bottom d-flex justify-content-between align-items-center ${darkMode ? 'border-dark' : ''}`}>
              <motion.h5 
                initial={{ opacity: 1 }}
                animate={{ opacity: isExpanded ? 1 : 0 }}
                className={`m-0 fw-bold ${darkMode ? 'text-white' : ''}`}
                style={{ fontFamily: 'Afacad, sans-serif' }}
              >
                {currentSiteName ? currentSiteName : 'AAM Inventory'}
              </motion.h5>
              <button
                className={`btn ${darkMode ? 'btn-dark' : 'btn-light'} btn-sm rounded-circle`}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <FontAwesomeIcon icon={isExpanded ? faAngleLeft : faAngleRight} />
              </button>
            </div>

            {/* Navigation */}
            <Nav className="flex-column p-3 gap-2">
              {menuItems.map((item) => (
                <motion.div
                  key={item.path}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Nav.Link
                    onClick={() => navigate(item.path)}
                    className={`rounded-3 d-flex align-items-center ${
                      isActivePath(item.path) 
                        ? 'bg-secondary text-white' 
                        : darkMode ? 'text-light' : ''
                    }`}
                    style={{
                      backgroundColor: isActivePath(item.path) ? '#444444' : '',
                      fontWeight: isActivePath(item.path) ? 'bold' : 'normal'
                    }}
                  >
                    <FontAwesomeIcon 
                      icon={item.icon} 
                      className={isActivePath(item.path) ? 'text-white' : darkMode ? 'text-light' : 'text-secondary'} 
                    />
                    <motion.span
                      initial={{ opacity: 1 }}
                      animate={{ opacity: isExpanded ? 1 : 0 }}
                      className={`ms-3 ${isActivePath(item.path) ? 'text-white' : darkMode ? 'text-light' : 'text-black'}`}
                    >
                      {item.label}
                    </motion.span>
                  </Nav.Link>
                </motion.div>
              ))}
            </Nav>
          </div>
        </motion.div>

        {/* Main Content */}
        <div style={{ 
          marginLeft: isExpanded ? '240px' : '70px', 
          width: '100%',
          backgroundColor: darkMode ? '#121212' : '#ffffff'
        }}>
          <TopNav />
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={`workspace-window`}
              style={{
                margin: '20px',
                borderRadius: '12px',
                minHeight: '70vh',
                height: 'fit-content',
                backgroundColor: darkMode ? '#121212' : '#ffffff',
                boxShadow: darkMode 
                  ? '0 4px 12px rgba(0,0,0,0.3)'
                  : '0 4px 12px rgba(0,0,0,0.05)'
              }}
            >
              <div className={`window-header p-3 border-bottom d-flex align-items-center ${
                darkMode ? 'border-dark' : ''
              }`}>
                <div className="me-2 d-flex gap-2">
                  <span className="rounded-circle" style={{ width: 12, height: 12, backgroundColor: '#ff5f57' }}></span>
                  <span className="rounded-circle" style={{ width: 12, height: 12, backgroundColor: '#febc2e' }}></span>
                  <span className="rounded-circle" style={{ width: 12, height: 12, backgroundColor: '#28c840' }}></span>
                </div>
                <small className={`ms-2 ${darkMode ? 'text-light' : 'text-secondary'}`}>
                  {getCurrentSection().charAt(0).toUpperCase() + getCurrentSection().slice(1)}
                </small>
              </div>
              <div className="window-content p-4">
                {children}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Emergency logout button */}
        {/* <div className="position-fixed top-0 end-0 m-3 z-index-1000">
          <Button 
            variant="danger" 
            size="sm"
            onClick={directLogout}
            title="Emergency Logout"
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
          </Button>
        </div> */}

        {/* Look for a fixed position button or icon that appears on all pages */}
        <div className="position-fixed bottom-0 end-0 m-3" style={{ zIndex: 1000 }}>
          <Button variant="danger" className="rounded-circle p-2">
            <FontAwesomeIcon icon={faArrowRight} />
          </Button>
        </div>
      </div>

      <style jsx="true">{`        .dark-theme {
          background-color: #121212;
        }
        
        .dark-theme .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .nav-link.active, .nav-link.active:hover {
          background-color: #444444 !important;
          color: #000000 !important;
        }

        .dark-theme .window-header {
          background-color: #121212;
          border-bottom: 1px solid #2a2a2a;
        }
      `}</style>
    </Container>
  );
};

export default MainLayout; 
