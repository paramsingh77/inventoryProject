import React, { useEffect, useState } from 'react';
import { useNotification } from '../../../context/NotificationContext';
import api from '../../../utils/api';
import socket from '../../../utils/socket';

const BackgroundChecks = () => {
  const { addNotification } = useNotification();
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(0);
  const [checkInterval, setCheckInterval] = useState(5 * 60 * 1000); // 5 minutes default

  // Debounce function to prevent multiple rapid API calls
  const debounce = (func, wait) => {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  };

  const checkEmailsAndNotifications = async () => {
    const now = Date.now();
    
    // Prevent checking if already in progress or too soon since last check
    if (isChecking || now - lastCheckTime < checkInterval) {
      return;
    }

    setIsChecking(true);
    setLastCheckTime(now);

    try {
      // Check for new emails
      const emailResponse = await api.get('/notifications/check-emails', {
        timeout: 5000 // 5 second timeout
      });

      if (emailResponse.data.hasNewEmails) {
        addNotification('info', 'New emails received');
      }

      // Check for system notifications
      const notificationResponse = await api.get('/notifications/system', {
        timeout: 5000
      });

      if (notificationResponse.data.notifications?.length > 0) {
        notificationResponse.data.notifications.forEach(notification => {
          addNotification(notification.type, notification.message);
        });
      }

      // Adjust check interval based on response
      if (emailResponse.data.hasNewEmails || notificationResponse.data.notifications?.length > 0) {
        setCheckInterval(2 * 60 * 1000); // More frequent checks if there are updates
      } else {
        setCheckInterval(5 * 60 * 1000); // Back to normal interval if no updates
      }

    } catch (error) {
      console.error('Background check error:', error);
      // Increase interval on error to reduce load
      setCheckInterval(10 * 60 * 1000); // 10 minutes
    } finally {
      setIsChecking(false);
    }
  };

  // Debounced version of check function
  const debouncedCheck = debounce(checkEmailsAndNotifications, 1000);

  useEffect(() => {
    // Set up background check interval
    const interval = setInterval(debouncedCheck, checkInterval);

    // Set up socket listeners for real-time updates
    const handleNewEmail = (data) => {
      addNotification('info', 'New email received');
      debouncedCheck(); // Trigger immediate check
    };

    const handleSystemNotification = (data) => {
      addNotification(data.type, data.message);
      debouncedCheck(); // Trigger immediate check
    };

    socket.on('new_email', handleNewEmail);
    socket.on('system_notification', handleSystemNotification);

    // Cleanup
    return () => {
      clearInterval(interval);
      socket.off('new_email', handleNewEmail);
      socket.off('system_notification', handleSystemNotification);
    };
  }, [checkInterval]);

  // This component doesn't render anything
  return null;
};

export default BackgroundChecks; 