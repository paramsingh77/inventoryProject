import React from 'react';
import { Toast as BootstrapToast } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faExclamationCircle, 
  faInfoCircle 
} from '@fortawesome/free-solid-svg-icons';

const Toast = ({ message, type = 'info', onClose }) => {
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

  const getVariant = () => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'danger';
      default:
        return 'info';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1050
      }}
    >
      <BootstrapToast 
        onClose={onClose}
        show={true}
        delay={3000}
        autohide
        className="d-flex align-items-center"
      >
        <BootstrapToast.Body className={`text-${getVariant()} d-flex align-items-center`}>
          <FontAwesomeIcon icon={getIcon()} className="me-2" />
          {message}
        </BootstrapToast.Body>
      </BootstrapToast>
    </div>
  );
};

export default Toast; 