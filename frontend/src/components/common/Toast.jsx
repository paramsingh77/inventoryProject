import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faExclamationCircle, 
  faInfoCircle,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const Toast = ({ message, type = 'success', onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return faCheckCircle;
      case 'error':
        return faExclamationCircle;
      default:
        return faInfoCircle;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: '#10b981',
          icon: '#ffffff',
          text: '#ffffff'
        };
      case 'error':
        return {
          bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          border: '#ef4444',
          icon: '#ffffff',
          text: '#ffffff'
        };
      case 'warning':
        return {
          bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          border: '#f59e0b',
          icon: '#ffffff',
          text: '#ffffff'
        };
      default:
        return {
          bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: '#10b981',
          icon: '#ffffff',
          text: '#ffffff'
        };
    }
  };

  const colors = getColors();

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1050,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        color: colors.text,
        minWidth: '280px',
        maxWidth: '350px',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Green arrow indicator */}
      <div
        style={{
          position: 'absolute',
          left: '0',
          top: '0',
          bottom: '0',
          width: '4px',
          background: '#ffffff',
          borderRadius: '0 2px 2px 0'
        }}
      />
      
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <FontAwesomeIcon 
              icon={getIcon()} 
              style={{ 
                color: colors.icon, 
                fontSize: '16px', 
                marginRight: '12px'
              }} 
            />
            <span style={{ 
              fontSize: '14px',
              color: colors.text,
              lineHeight: '1.4'
            }}>
              {message}
            </span>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: colors.text,
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                marginLeft: '8px',
                opacity: 0.7,
                transition: 'opacity 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '1'}
              onMouseLeave={(e) => e.target.style.opacity = '0.7'}
            >
              <FontAwesomeIcon icon={faTimes} size="sm" />
            </button>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          height: '3px',
          background: 'rgba(255, 255, 255, 0.3)',
          width: '100%',
          overflow: 'hidden'
        }}
      >
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 3, ease: "linear" }}
          style={{
            height: '100%',
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '0 2px 2px 0'
          }}
        />
      </div>
    </motion.div>
  );
};

export default Toast; 