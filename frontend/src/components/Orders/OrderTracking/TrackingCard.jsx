import React from 'react';
import { Card, Badge, ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTruck, 
  faBuilding,
  faFileInvoice,
  faBoxes,
  faClock,
  faCircleInfo
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import './TrackingCard.css';

const getStatusBadge = (status) => {
  const statusMap = {
    'shipped': { bg: 'primary', label: 'Shipped' },
    'in_transit': { bg: 'info', label: 'In Transit' },
    'delivered': { bg: 'success', label: 'Delivered' },
    'delayed': { bg: 'warning', label: 'Delayed' },
    'cancelled': { bg: 'danger', label: 'Cancelled' },
    'pending': { bg: 'secondary', label: 'Pending' }
  };
  
  const defaultStatus = { bg: 'secondary', label: status?.toUpperCase() || 'Unknown' };
  const statusInfo = statusMap[status?.toLowerCase()] || defaultStatus;
  
  return (
    <Badge 
      bg={statusInfo.bg} 
      className="tracking-status-badge"
    >
      {statusInfo.label}
    </Badge>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch (e) {
    return dateString;
  }
};

const getTimeAgo = (dateString) => {
  if (!dateString) return 'Never';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);
    
    if (diffDays > 1) return `${diffDays} days ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffHr >= 1) return `${diffHr} hours ago`;
    if (diffMin >= 1) return `${diffMin} minutes ago`;
    return 'Just now';
  } catch (e) {
    return 'Unknown';
  }
};

const TrackingCard = ({ order }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className="tracking-card-container"
    >
      <Card className="tracking-card h-100">
        <Card.Header className="d-flex justify-content-between align-items-center bg-white border-bottom-0 pt-3">
          <div className="d-flex align-items-center">
            <FontAwesomeIcon icon={faFileInvoice} className="text-primary me-2" />
            <h6 className="mb-0">{order.order_number || 'PO-' + order.id}</h6>
          </div>
          {getStatusBadge(order.shipping_status)}
        </Card.Header>
        
        <Card.Body className="pt-2">
          <ListGroup variant="flush" className="tracking-info-list">
            <ListGroup.Item className="px-0">
              <div className="tracking-info-label">
                <FontAwesomeIcon icon={faBuilding} className="me-2 text-primary" />
                Vendor
              </div>
              <div className="tracking-info-value">
                {order.vendor_name || 'Unknown Vendor'}
              </div>
            </ListGroup.Item>

            {order.items && order.items.length > 0 && (
              <ListGroup.Item className="px-0">
                <div className="tracking-info-label">
                  <FontAwesomeIcon icon={faBoxes} className="me-2 text-primary" />
                  Items
                </div>
                <div className="tracking-info-value">
                  {order.items.map((item, index) => (
                    <div key={index} className="tracking-item d-flex justify-content-between">
                      <span>{item.description || item.notes}</span>
                      <Badge bg="light" text="dark" className="ms-2">
                        Qty: {item.quantity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ListGroup.Item>
            )}

            {order.current_location && (
              <ListGroup.Item className="px-0">
                <div className="tracking-info-label">
                  <FontAwesomeIcon icon={faTruck} className="me-2 text-primary" />
                  Current Location
                </div>
                <div className="tracking-info-value">
                  {order.current_location}
                </div>
              </ListGroup.Item>
            )}

            {order.notes && (
              <ListGroup.Item className="px-0">
                <div className="tracking-info-label">
                  <FontAwesomeIcon icon={faCircleInfo} className="me-2 text-primary" />
                  Additional Info
                </div>
                <div className="tracking-info-value">
                  {order.notes}
                </div>
              </ListGroup.Item>
            )}
          </ListGroup>
        </Card.Body>

        <Card.Footer className="bg-white border-top-0">
          <small className="text-muted d-flex align-items-center">
            <FontAwesomeIcon icon={faClock} className="me-2" />
            Last updated {getTimeAgo(order.last_status_update)}
          </small>
        </Card.Footer>
      </Card>
    </motion.div>
  );
};

export default TrackingCard; 