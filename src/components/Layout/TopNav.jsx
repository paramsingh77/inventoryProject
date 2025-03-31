import React from 'react';
import { Navbar, Container, Button, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faUser,
  faBox, 
  faUsers, 
  faShoppingCart, 
  faTruck, 
  faChartLine, 
  faCog,
  faFileInvoice,
  faUserTie,
  faMoon,
  faSun,
  faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const TopNav = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, directLogout } = useAuth();

  const menuItems = [
    { path: '/inventory', icon: faBox, label: 'Inventory' },
    { path: '/users', icon: faUsers, label: 'Users' },
    { path: '/orders', icon: faShoppingCart, label: 'Orders' },
    { path: '/suppliers', icon: faTruck, label: 'Suppliers' },
    { path: '/reports', icon: faChartLine, label: 'Reports' },
    { path: '/settings', icon: faCog, label: 'Settings' },
  ];

  return (
    <>
      <Navbar 
        className={darkMode ? 'bg-black' : 'bg-white'} 
        expand="lg" 
        style={{ height: '80px' }}
      >
        <Container fluid className="position-relative">
          {/* Company name on the left */}
          <div className="d-flex align-items-center" style={{ position: 'absolute', left: '20px' }}>
            <h5 className={`m-0 fw-bold ${darkMode ? 'text-light' : 'text-dark'}`}>
              American Advance<br />Management
            </h5>
          </div>
          
          {/* Brand in the center */}
          <Navbar.Brand 
            href="/" 
            className={`position-absolute start-50 fw-bold fs-2 m-0 ${darkMode ? 'text-light' : 'text-dark'}`}
            style={{ 
              fontFamily: 'Afacad, sans-serif', 
              top: '50%', 
              transform: 'translate(-50%, -50%)' 
            }}
          >
            AAM Inventory
          </Navbar.Brand>
          
          {/* Right-aligned items in a single row */}
          <div className="d-flex align-items-center gap-3" style={{ position: 'absolute', right: '20px' }}>
            {/* Bell icon */}
            <motion.div whileHover={{ scale: 1.1 }}>
              <Button variant={darkMode ? 'dark' : 'white'} className="p-0 position-relative">
                <FontAwesomeIcon 
                  icon={faBell} 
                  className={darkMode ? 'text-light' : 'text-dark'} 
                  style={{ fontSize: '1.25rem' }} 
                />
                <Badge 
                  bg="danger" 
                  className="position-absolute top-0 start-100 translate-middle rounded-circle"
                  style={{ fontSize: '0.6rem', padding: '0.25rem' }}
                >
                  2
                </Badge>
              </Button>
            </motion.div>
            
            {/* Dark mode toggle */}
            <motion.div whileHover={{ scale: 1.1 }}>
              <Button 
                variant={darkMode ? 'dark' : 'white'} 
                className="p-0"
                onClick={toggleDarkMode}
              >
                <FontAwesomeIcon 
                  icon={darkMode ? faSun : faMoon} 
                  className={darkMode ? 'text-light' : 'text-dark'} 
                  style={{ fontSize: '1.25rem' }} 
                />
              </Button>
            </motion.div>
            
            {/* Logout button */}
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button 
                variant={darkMode ? 'outline-light' : 'outline-dark'} 
                size="sm"
                onClick={directLogout}
                className="d-flex align-items-center px-3 py-1"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
                <span>Logout</span>
              </Button>
            </motion.div>
          </div>
        </Container>
      </Navbar>

      <style jsx="true">{`
        .dark-dropdown .dropdown-menu {
          background-color:rgb(0, 0, 0);
          border-color:rgb(0, 0, 0);
        }
        
        .dark-dropdown .dropdown-item:hover {
          background-color:rgb(0, 0, 0);
        }
      `}</style>
    </>
  );
};

export default TopNav; 