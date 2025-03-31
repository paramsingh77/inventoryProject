import { Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBox, 
  faUsers, 
  faShoppingCart, 
  faTruck, 
  faChartLine, 
  faCog 
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const navigate = useNavigate();

  const menuItems = [
    { path: '/inventory', icon: faBox},
    { path: '/users', icon: faUsers},
    { path: '/orders', icon: faShoppingCart},
    { path: '/suppliers', icon: faTruck },
    { path: '/settings', icon: faCog },
  ];

  return (
    <motion.div
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="bg-primary bg-gradient text-white"
      style={{ width: '250px', minHeight: '100vh' }}
    >
      <div className="p-4">
        <h4 className="text-center fw-bold mb-5">Inventory Pro</h4>
        <Nav className="flex-column gap-2">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.path}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Nav.Link 
                onClick={() => navigate(item.path)}
                className="text-white rounded p-3 d-flex align-items-center"
              >
                <FontAwesomeIcon icon={item.icon} className="me-3" />
                <span className="fw-medium">{item.label}</span>
              </Nav.Link>
            </motion.div>
          ))}
        </Nav>
      </div>
    </motion.div>
  );
};

export default Sidebar; 