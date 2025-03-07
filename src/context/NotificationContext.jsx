import React, { createContext, useContext, useState, useEffect } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faExclamationTriangle,
  faInfoCircle,
  faCheckCircle,
  faShoppingCart,
  faBox,
  faTag,
  faTruck
} from '@fortawesome/free-solid-svg-icons';
import WebSocketService from '../services/websocket';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    WebSocketService.connect();

    // Subscribe to different notification types
    const notificationTypes = {
      inventory_update: handleInventoryUpdate,
      low_stock_alert: handleLowStockAlert,
      order_status: handleOrderStatus,
      price_change: handlePriceChange,
      product_update: handleProductUpdate,
      category_update: handleCategoryUpdate,
      purchase_order: handlePurchaseOrder,
      stock_movement: handleStockMovement
    };

    Object.entries(notificationTypes).forEach(([type, handler]) => {
      WebSocketService.subscribe(type, handler);
    });

    return () => {
      WebSocketService.disconnect();
    };
  }, []);

  const getNotificationConfig = (type) => {
    const configs = {
      inventory_update: {
        icon: faBox,
        variant: 'info',
        title: 'Inventory Update'
      },
      low_stock_alert: {
        icon: faExclamationTriangle,
        variant: 'warning',
        title: 'Low Stock Alert'
      },
      order_status: {
        icon: faShoppingCart,
        variant: 'primary',
        title: 'Order Status'
      },
      price_change: {
        icon: faTag,
        variant: 'success',
        title: 'Price Update'
      },
      purchase_order: {
        icon: faTruck,
        variant: 'info',
        title: 'Purchase Order'
      }
    };
    return configs[type] || { icon: faInfoCircle, variant: 'info', title: 'Notification' };
  };

  const playNotificationSound = () => {
    const audio = new Audio('/notification-sound.mp3');
    audio.play().catch(error => {
      console.log('Failed to play notification sound:', error);
    });
  };

  const addNotification = (type, message, data = {}) => {
    const config = getNotificationConfig(type);
    const newNotification = {
      id: Date.now(),
      type,
      message,
      data,
      timestamp: new Date(),
      read: false,
      ...config
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Play notification sound
    playNotificationSound();

    // Auto remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== newNotification.id));
    }, 5000);
  };

  // Handlers for different notification types
  const handleInventoryUpdate = (data) => {
    addNotification('inventory_update', 
      `Inventory updated for ${data.productName}`,
      data
    );
  };

  const handleLowStockAlert = (data) => {
    addNotification('low_stock_alert',
      `Low stock alert: ${data.productName} (${data.currentStock} remaining)`,
      data
    );
  };

  const handleOrderStatus = (data) => {
    addNotification('order_status',
      `Order #${data.orderNumber} ${data.status}`,
      data
    );
  };

  const handlePriceChange = (data) => {
    addNotification('price_change',
      `Price updated for ${data.productName}`,
      data
    );
  };

  const handleProductUpdate = (data) => {
    addNotification('product_update',
      `Product ${data.productName} has been ${data.action}`,
      data
    );
  };

  const handleCategoryUpdate = (data) => {
    addNotification('category_update',
      `Category ${data.categoryName} has been ${data.action}`,
      data
    );
  };

  const handlePurchaseOrder = (data) => {
    addNotification('purchase_order',
      `New purchase order #${data.poNumber} created`,
      data
    );
  };

  const handleStockMovement = (data) => {
    addNotification('stock_movement',
      `Stock movement recorded for ${data.productName}`,
      data
    );
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  const clearNotification = (notificationId) => {
    setNotifications(prev =>
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        removeNotification
      }}
    >
      {children}
      <NotificationList />
    </NotificationContext.Provider>
  );
};

const NotificationList = () => {
  const { notifications, markAsRead, clearNotification } = useContext(NotificationContext);

  return (
    <ToastContainer
      className="position-fixed"
      style={{ top: '1rem', right: '1rem', zIndex: 1050 }}
    >
      {notifications.slice(0, 5).map((notification) => (
        <Toast
          key={notification.id}
          onClose={() => clearNotification(notification.id)}
          show={true}
          bg={notification.variant}
          className="mb-2"
          onClick={() => markAsRead(notification.id)}
        >
          <Toast.Header>
            <FontAwesomeIcon icon={notification.icon} className="me-2" />
            <strong className="me-auto">{notification.title}</strong>
            <small>
              {new Date(notification.timestamp).toLocaleTimeString()}
            </small>
          </Toast.Header>
          <Toast.Body className={notification.variant === 'light' ? '' : 'text-white'}>
            {notification.message}
          </Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
};

export const useNotification = () => useContext(NotificationContext); 