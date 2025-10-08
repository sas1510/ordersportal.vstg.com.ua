import React, { createContext, useContext, useState, useCallback } from 'react';
import './Notifications.css';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
        <div className="notification-wrapper">
          {notifications.map(n => (
            <div key={n.id} className={`notification ${n.type}`}>
              {n.message}
            </div>
          ))}
        </div>

      </NotificationContext.Provider>
  );
};
