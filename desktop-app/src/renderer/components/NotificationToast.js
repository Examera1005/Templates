/**
 * Notification Toast Component
 * Toast notifications for user feedback
 */

import React, { useEffect } from 'react';

export const NotificationToast = ({ notification, onRemove }) => {
  const { id, type, title, message, timeout, timestamp } = notification;

  // Auto-remove notification after timeout
  useEffect(() => {
    if (timeout !== false && timeout > 0) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [id, timeout, onRemove]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm3.707 5.293L6.414 10.586 4.293 8.464a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l6-6a1 1 0 00-1.414-1.414z" />
          </svg>
        );
      case 'warning':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8.982 1.566a1.13 1.13 0 00-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5a.905.905 0 01.9.995l-.35 3.507a.552.552 0 01-1.1 0L7.1 5.995A.905.905 0 018 5zm.002 6a1 1 0 110 2 1 1 0 010-2z" />
          </svg>
        );
      case 'error':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm3.707 10.293a1 1 0 01-1.414 1.414L8 9.414l-2.293 2.293a1 1 0 01-1.414-1.414L6.586 8 4.293 5.707a1 1 0 011.414-1.414L8 6.586l2.293-2.293a1 1 0 011.414 1.414L9.414 8l2.293 2.293z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 12H7V7h2v5zm0-6H7V4h2v2z" />
          </svg>
        );
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  return (
    <div className={`notification ${type}`}>
      <div className="notification-icon">
        {getIcon()}
      </div>
      
      <div className="notification-content">
        <div className="notification-message">
          {title && <strong>{title}: </strong>}
          {message}
        </div>
        {timestamp && (
          <div className="notification-time">
            {formatTime(timestamp)}
          </div>
        )}
      </div>
      
      <button 
        className="notification-close" 
        onClick={() => onRemove(id)}
        aria-label="Close notification"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
};

// Notifications Container Component
export const NotificationsContainer = ({ notifications, onRemoveNotification }) => {
  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className="notifications-container">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onRemove={onRemoveNotification}
        />
      ))}
    </div>
  );
};