import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faExpand, faMinus } from '@fortawesome/free-solid-svg-icons';

const WindowView = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style={{ 
          backgroundColor: 'rgba(0,0,0,0.2)', 
          backdropFilter: 'blur(5px)',
          zIndex: 1040 
        }}
      >
        <motion.div
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          exit={{ y: 50 }}
          className="bg-white rounded-4 shadow-lg"
          style={{ 
            width: '95%', 
            height: '90vh',
            maxWidth: '1400px'
          }}
        >
          {/* Window Header */}
          <div className="d-flex align-items-center p-3 border-bottom bg-light rounded-top-4">
            <div className="d-flex gap-2 me-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="btn btn-sm rounded-circle"
                style={{ backgroundColor: '#ff5f57', width: 28, height: 28 }}
                onClick={onClose}
              >
                <FontAwesomeIcon icon={faTimes} className="text-white" size="xs" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="btn btn-sm rounded-circle"
                style={{ backgroundColor: '#febc2e', width: 28, height: 28 }}
              >
                <FontAwesomeIcon icon={faMinus} className="text-white" size="xs" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="btn btn-sm rounded-circle"
                style={{ backgroundColor: '#28c840', width: 28, height: 28 }}
              >
                <FontAwesomeIcon icon={faExpand} className="text-white" size="xs" />
              </motion.button>
            </div>
            <div className="text-secondary small">{title}</div>
          </div>

          {/* Window Content */}
          <div className="p-4 overflow-auto" style={{ height: 'calc(90vh - 60px)' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {children}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WindowView; 