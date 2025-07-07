import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faExclamationCircle, 
  faInfoCircle,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import './ModernToast.css';

const ModernToast = ({ notification, onClose, onRead }) => {
  const getIcon = () => {
    switch (notification.variant) {
      case 'success':
        return faCheckCircle;
      case 'error':
        return faExclamationCircle;
      case 'warning':
        return faExclamationCircle;
      default:
        return faInfoCircle;
    }
  };

  const getColors = () => {
    switch (notification.variant) {
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
      case 'info':
        return {
          bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          border: '#3b82f6',
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
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="modern-toast"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        color: colors.text,
        marginBottom: '12px',
        minWidth: '320px',
        maxWidth: '400px',
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer'
      }}
      onClick={onRead}
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
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
            <FontAwesomeIcon 
              icon={getIcon()} 
              style={{ 
                color: colors.icon, 
                fontSize: '18px', 
                marginRight: '12px',
                marginTop: '2px'
              }} 
            />
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontWeight: '600', 
                fontSize: '14px', 
                marginBottom: '4px',
                color: colors.text
              }}>
                {notification.title}
              </div>
              <div style={{ 
                fontSize: '13px', 
                opacity: 0.95,
                lineHeight: '1.4',
                color: colors.text
              }}>
                {notification.message}
              </div>
              <div style={{ 
                fontSize: '11px', 
                opacity: 0.8,
                marginTop: '6px',
                color: colors.text
              }}>
                {new Date(notification.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
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
          transition={{ duration: 5, ease: "linear" }}
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

export default ModernToast; 