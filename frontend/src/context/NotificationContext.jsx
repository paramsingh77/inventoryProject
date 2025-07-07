import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  faExclamationTriangle,
  faInfoCircle,
  faShoppingCart,
  faBox,
  faTag,
  faTruck
} from '@fortawesome/free-solid-svg-icons';
import { AnimatePresence } from 'framer-motion';
import WebSocketService from '../services/websocket';
import ModernToast from '../components/common/ModernToast';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only connect if not already connected
    if (!isConnected) {
      WebSocketService.connect();
      setIsConnected(true);
    }

    // Subscribe to different notification types - only if we're connected
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

    if (isConnected) {
      Object.entries(notificationTypes).forEach(([type, handler]) => {
        WebSocketService.subscribe(type, handler);
      });
    }

    return () => {
      // Don't disconnect on every unmount - this is a global service
      // WebSocketService.disconnect();
    };
  }, [isConnected]);

  const getNotificationConfig = (type) => {
    const configs = {
      inventory_update: {
        icon: faBox,
        variant: 'success',
        title: 'Inventory Update'
      },
      low_stock_alert: {
        icon: faExclamationTriangle,
        variant: 'warning',
        title: 'Low Stock Alert'
      },
      order_status: {
        icon: faShoppingCart,
        variant: 'success',
        title: 'Order Status'
      },
      price_change: {
        icon: faTag,
        variant: 'success',
        title: 'Price Update'
      },
      purchase_order: {
        icon: faTruck,
        variant: 'success',
        title: 'Purchase Order'
      }
    };
    return configs[type] || { icon: faInfoCircle, variant: 'success', title: 'Notification' };
  };

  const playNotificationSound = () => {
    // Sound notifications disabled
    // No need to log this as it's expected behavior
  };

  const addNotification = (type, message, data = {}) => {
    const config = getNotificationConfig(type);
    const newNotification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type,
      message,
      data,
      timestamp: new Date(),
      read: false,
      ...config
    };

    setNotifications(prev => {
      const updatedNotifications = [newNotification, ...prev];
      return updatedNotifications.slice(0, 10);
    });
    
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

// Memoized Toast component to prevent unnecessary re-renders
const NotificationToast = React.memo(({ notification, onClose, onRead }) => {
  return (
    <ModernToast
      notification={notification}
      onClose={onClose}
      onRead={onRead}
    />
  );
});

// Optimized NotificationList using memoization
const NotificationList = React.memo(() => {
  const { notifications, markAsRead, clearNotification } = useContext(NotificationContext);

  // Only show the 5 most recent notifications to avoid cluttering the UI
  const visibleNotifications = useMemo(() => {
    return notifications.slice(0, 5);
  }, [notifications]);

  // Memoize the handlers to prevent unnecessary re-renders
  const handleClose = useCallback((id) => {
    clearNotification(id);
  }, [clearNotification]);

  const handleRead = useCallback((id) => {
    markAsRead(id);
  }, [markAsRead]);

  return (
    <div
      className="position-fixed"
      style={{ 
        top: '1rem', 
        right: '1rem', 
        zIndex: 1050,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end'
      }}
    >
      <AnimatePresence>
        {visibleNotifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={() => handleClose(notification.id)}
            onRead={() => handleRead(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});

export const useNotification = () => useContext(NotificationContext); 