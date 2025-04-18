import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { database } from '@/firebaseConfig';
import { ref, onValue, update, push, remove } from 'firebase/database';

// Notification data type
export type Notification = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  formattedTimestamp: string;
  type: 'warning' | 'error' | 'success' | 'info';
  read: boolean;
  relatedEvent?: string | null;
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    const time = date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const day = date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    return `${time} - ${day}`;
  };

  useEffect(() => {
    // Reference to notifications in Firebase
    const notificationsRef = ref(database, 'notifications/device1');
    
    // Create a real-time listener for notifications
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      try {
        setIsLoading(true);
        if (snapshot.exists()) {
          const notificationsData = snapshot.val();
          const formattedNotifications: Notification[] = [];
          
          // Process and format notifications
          Object.keys(notificationsData).forEach(key => {
            const notification = notificationsData[key];
            formattedNotifications.push({
              id: key,
              title: notification.title,
              message: notification.message,
              timestamp: notification.timestamp,
              formattedTimestamp: formatTimestamp(notification.timestamp),
              type: notification.type as 'warning' | 'error' | 'success' | 'info',
              read: notification.read,
              relatedEvent: notification.relatedEvent
            });
          });
          
          // Sort notifications by timestamp (newest first)
          formattedNotifications.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          
          setNotifications(formattedNotifications);
          setError(null);
        } else {
          setNotifications([]);
        }
      } catch (err) {
        setError(`Failed to load notifications: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    }, (error) => {
      setError(`Database error: ${error.message}`);
      setIsLoading(false);
    });

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, []);

  // Mark notification as read in Firebase
  const markAsRead = async (id: string) => {
    try {
      const notificationRef = ref(database, `notifications/device1/${id}`);
      await update(notificationRef, { read: true });
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (err) {
      setError(`Failed to mark notification as read: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Clear all notifications in Firebase
  const clearAll = async () => {
    try {
      const notificationsRef = ref(database, 'notifications/device1');
      await remove(notificationsRef);
      
      // Update local state
      setNotifications([]);
    } catch (err) {
      setError(`Failed to clear notifications: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Create a new notification (used by the app to generate local notifications)
  const createNotification = async (notification: {
    title: string;
    message: string;
    type: 'warning' | 'error' | 'success' | 'info';
    relatedEvent?: string;
  }) => {
    try {
      const notificationsRef = ref(database, 'notifications/device1');
      const newNotification = {
        ...notification,
        timestamp: new Date().toISOString(),
        read: false
      };
      
      await push(notificationsRef, newNotification);
    } catch (err) {
      setError(`Failed to create notification: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    const COLORS = {
      primary: '#0095ff',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
    };
    
    switch (type) {
      case 'warning':
        return React.createElement(Ionicons, { name: "warning", size: 24, color: COLORS.warning });
      case 'error':
        return React.createElement(Ionicons, { name: "alert-circle", size: 24, color: COLORS.error });
      case 'success':
        return React.createElement(Ionicons, { name: "checkmark-circle", size: 24, color: COLORS.success });
      default:
        return React.createElement(Ionicons, { name: "information-circle", size: 24, color: COLORS.primary });
    }
  };

  const getTitleColor = (type: string) => {
    const COLORS = {
      primary: '#0095ff',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
      text: '#1a1a1a',
    };
    
    switch (type) {
      case 'warning':
        return COLORS.warning;
      case 'error':
        return COLORS.error;
      case 'success':
        return COLORS.success;
      default:
        return COLORS.text;
    }
  };

  return {
    notifications,
    isLoading,
    error,
    markAsRead,
    clearAll,
    createNotification,
    getNotificationIcon,
    getTitleColor,
  };
}
