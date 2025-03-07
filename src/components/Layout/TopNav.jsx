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

const TopNav = () => {
  const navigate = useNavigate();

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
      <Navbar bg="white" expand="lg" style={{ height: '80px' }}>
        <Container fluid>
          <div className="d-flex align-items-center gap-4 ms-auto">
            <motion.div whileHover={{ scale: 1.1 }}>
              <Button variant="white" className="p-0">
                <FontAwesomeIcon icon={faBell} className="text-dark fs-5" />
              </Button>
            </motion.div>
            <NavDropdown 
              title={
                <FontAwesomeIcon icon={faUser} className="text-dark fs-5" />
              } 
              id="basic-nav-dropdown"
              align="end"
              className="fw-medium"
            >
              <NavDropdown.Item href="/profile" className="py-2">Profile</NavDropdown.Item>
              <NavDropdown.Item href="/settings" className="py-2">Settings</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="/logout" className="py-2 text-secondary">Logout</NavDropdown.Item>
            </NavDropdown>
          </div>
          <Navbar.Brand 
            href="/" 
            className="position-absolute start-50  fw-bold fs-2 text-dark m-0"
            style={{ fontFamily: 'Afacad, sans-serif', top: '50%', transform: 'translate(-50%, -50%)' }}
          >
            AAM Inventory
          </Navbar.Brand>
        </Container>
      </Navbar>
     
    </>
  );
};

export default TopNav; 