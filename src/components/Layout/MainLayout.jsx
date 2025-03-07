import { useState } from 'react';
import { Nav } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import TopNav from './TopNav';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBox,
  faUsers,
  faShoppingCart,
  faTruck,
  faChartLine,
  faCog,
  faAngleRight,
  faAngleLeft,
  faHome
} from '@fortawesome/free-solid-svg-icons';
import Dashboard from '../../pages/Dashboard';
import Inventory from '../../pages/Inventory';
import Users from '../../pages/Users';
import Orders from '../../pages/Orders';
import Suppliers from '../../pages/Suppliers';
import Reports from '../../pages/Reports';
import Settings from '../../pages/Settings';

const MainLayout = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', icon: faHome, label: 'Dashboard', component: Dashboard },
    { id: 'inventory', icon: faBox, label: 'Inventory', component: Inventory },
    { id: 'users', icon: faUsers, label: 'Users', component: Users },
    { id: 'orders', icon: faShoppingCart, label: 'Orders', component: Orders },
    { id: 'suppliers', icon: faTruck, label: 'Suppliers', component: Suppliers },
    { id: 'reports', icon: faChartLine, label: 'Reports', component: Reports },
    { id: 'settings', icon: faCog, label: 'Settings', component: Settings }
  ];

  const ActiveComponent = menuItems.find(item => item.id === activeSection)?.component || Dashboard;

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <motion.div
        initial={{ width: 240 }}
        animate={{ width: isExpanded ? 240 : 70 }}
        className="bg-white border-end vh-100 position-fixed"
        style={{ zIndex: 1030 }}
      >
        <div className="d-flex flex-column h-100">
          {/* Logo Area */}
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
            <motion.h5 
              initial={{ opacity: 1 }}
              animate={{ opacity: isExpanded ? 1 : 0 }}
              className="m-0 fw-bold"
              style={{ fontFamily: 'Afacad, sans-serif' }}
            >
              AAM Inventory
            </motion.h5>
            <button
              className="btn btn-light btn-sm rounded-circle"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <FontAwesomeIcon icon={isExpanded ? faAngleLeft : faAngleRight} />
            </button>
          </div>

          {/* Navigation */}
          <Nav className="flex-column p-3 gap-2">
            {menuItems.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Nav.Link
                  onClick={() => setActiveSection(item.id)}
                  className={`rounded-3 d-flex align-items-center ${
                    activeSection === item.id ? 'bg-light' : ''
                  }`}
                >
                  <FontAwesomeIcon icon={item.icon} className="text-secondary" />
                  <motion.span
                    initial={{ opacity: 1 }}
                    animate={{ opacity: isExpanded ? 1 : 0 }}
                    className="ms-3 text-black"
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
      <div style={{ marginLeft: isExpanded ? '240px' : '70px', width: '100%' }}>
        <TopNav />
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="workspace-window bg-white"
            style={{
              margin: '20px',
              borderRadius: '12px',
              minHeight: 'calc(100vh - 100px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            <div className="window-header p-3 border-bottom d-flex align-items-center">
              <div className="me-2 d-flex gap-2">
                <span className="rounded-circle" style={{ width: 12, height: 12, backgroundColor: '#ff5f57' }}></span>
                <span className="rounded-circle" style={{ width: 12, height: 12, backgroundColor: '#febc2e' }}></span>
                <span className="rounded-circle" style={{ width: 12, height: 12, backgroundColor: '#28c840' }}></span>
              </div>
              <small className="text-secondary ms-2">
                {menuItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
              </small>
            </div>
            <div className="window-content p-4">
              <ActiveComponent />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MainLayout; 