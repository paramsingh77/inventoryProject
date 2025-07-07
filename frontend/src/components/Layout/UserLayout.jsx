import React, { useState } from 'react';
import { Container, Nav } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBoxes, 
  faAngleLeft, 
  faAngleRight
} from '@fortawesome/free-solid-svg-icons';
import { useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TopNav from './TopNav';

const UserLayout = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();
  const { siteName } = useParams();
  const decodedSiteName = siteName ? decodeURIComponent(siteName) : '';
  const { currentUser } = useAuth();
  
  // Get the current section from the URL path
  const getCurrentSection = () => {
    return 'Inventory';
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <TopNav />
      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <motion.div
          initial={{ width: 240 , height: '100%', marginTop: '-56px'}}
          animate={{ width: isExpanded ? 240 : 70 }}
          className="h-100 position-fixed bg-white"
          style={{ 
            zIndex: 1030,
            borderRight: '1px solid #e5e5e5',
            top: '56px' // Adjust based on your TopNav height
          }}
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
                {decodedSiteName}
              </motion.h5>
              <button
                className="btn btn-light btn-sm rounded-circle"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <FontAwesomeIcon icon={isExpanded ? faAngleLeft : faAngleRight} />
              </button>
            </div>

            {/* Navigation - Only Inventory for User */}
            <Nav className="flex-column p-3 gap-2">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Nav.Link
                  className="rounded-3 d-flex align-items-center bg-secondary text-white"
                  style={{
                    backgroundColor: '#444444',
                    fontWeight: 'bold'
                  }}
                >
                  <FontAwesomeIcon 
                    icon={faBoxes} 
                    className="text-white" 
                  />
                  <motion.span
                    initial={{ opacity: 1 }}
                    animate={{ opacity: isExpanded ? 1 : 0 }}
                    className="ms-3 text-white"
                  >
                    Inventory
                  </motion.span>
                </Nav.Link>
              </motion.div>
            </Nav>
          </div>
        </motion.div>

        {/* Main Content - Fixed the width calculation */}
        <div style={{ 
          marginLeft: isExpanded ? '240px' : '70px',
          width: `calc(100% - ${isExpanded ? 240 : 70}px)`,
          transition: 'margin-left 0.2s ease-in-out, width 0.2s ease-in-out'
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="workspace-window"
              style={{
                margin: '20px',
                borderRadius: '12px',
                minHeight: '70vh',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}
            >
              <div className="window-header p-3 border-bottom d-flex align-items-center">
                <div className="me-2 d-flex gap-2">
                  <span className="rounded-circle" style={{ width: 12, height: 12, backgroundColor: '#ff5f57' }}></span>
                  <span className="rounded-circle" style={{ width: 12, height: 12, backgroundColor: '#febc2e' }}></span>
                  <span className="rounded-circle" style={{ width: 12, height: 12, backgroundColor: '#28c840' }}></span>
                </div>
                <small className="ms-2 text-secondary">
                  {getCurrentSection()}
                </small>
              </div>
              <div className="window-content p-4">
                {children}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default UserLayout; 