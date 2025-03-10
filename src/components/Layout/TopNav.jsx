import { Navbar, Container, Nav, NavDropdown, Button } from 'react-bootstrap';
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
  faUserTie
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const TopNav = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();

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
        <Container fluid>
          <div className="d-flex align-items-center gap-4 ms-auto">
            <motion.div whileHover={{ scale: 1.1 }}>
              <Button variant={darkMode ? 'dark' : 'white'} className="p-0">
                <FontAwesomeIcon 
                  icon={faBell} 
                  className={darkMode ? 'text-light' : 'text-dark'} 
                  style={{ fontSize: '1.25rem' }} 
                />
              </Button>
            </motion.div>
            <NavDropdown 
              title={
                <FontAwesomeIcon 
                  icon={faUser} 
                  className={darkMode ? 'text-light' : 'text-dark'} 
                  style={{ fontSize: '1.25rem' }} 
                />
              } 
              id="basic-nav-dropdown"
              align="end"
              className={`fw-medium ${darkMode ? 'dark-dropdown' : ''}`}
            >
              <NavDropdown.Item href="/profile" className={darkMode ? 'text-light bg-dark' : ''}>
                Profile
              </NavDropdown.Item>
              <NavDropdown.Item href="/settings" className={darkMode ? 'text-light bg-dark' : ''}>
                Settings
              </NavDropdown.Item>
              <NavDropdown.Divider className={darkMode ? 'bg-dark' : ''} />
              <NavDropdown.Item href="/logout" className={darkMode ? 'text-danger bg-dark' : 'text-secondary'}>
                Logout
              </NavDropdown.Item>
            </NavDropdown>
          </div>
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