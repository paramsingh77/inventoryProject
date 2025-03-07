import React, { useState } from 'react';
import { Offcanvas, ListGroup, Badge, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCheck, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useNotification } from '../context/NotificationContext';

const NotificationCenter = ({ show, onHide }) => {
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    markAsRead,
    clearNotification 
  } = useNotification();
  const [filter, setFilter] = useState('all');

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'read') return notif.read;
    return true;
  });

  return (
    <Offcanvas show={show} onHide={onHide} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title className="d-flex align-items-center">
          <FontAwesomeIcon icon={faBell} className="me-2" />
          Notifications
          {unreadCount > 0 && (
            <Badge bg="danger" className="ms-2">
              {unreadCount}
            </Badge>
          )}
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <div className="d-flex justify-content-between mb-3">
          <div className="btn-group">
            <Button
              variant={filter === 'all' ? 'primary' : 'light'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'primary' : 'light'}
              onClick={() => setFilter('unread')}
            >
              Unread
            </Button>
            <Button
              variant={filter === 'read' ? 'primary' : 'light'}
              onClick={() => setFilter('read')}
            >
              Read
            </Button>
          </div>
          <Button variant="link" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        </div>

        <ListGroup>
          {filteredNotifications.map((notification) => (
            <ListGroup.Item
              key={notification.id}
              className={`d-flex justify-content-between align-items-start ${
                !notification.read ? 'bg-light' : ''
              }`}
            >
              <div className="ms-2 me-auto">
                <div className="fw-bold">
                  <FontAwesomeIcon
                    icon={notification.icon}
                    className={`me-2 text-${notification.variant}`}
                  />
                  {notification.title}
                </div>
                <p className="mb-1">{notification.message}</p>
                <small className="text-muted">
                  {new Date(notification.timestamp).toLocaleString()}
                </small>
              </div>
              <div className="d-flex gap-2">
                {!notification.read && (
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => markAsRead(notification.id)}
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </Button>
                )}
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => clearNotification(notification.id)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default NotificationCenter; 