import React, { createContext, useContext, useState, useCallback } from "react";
import { FaTimes } from "react-icons/fa";
import "./Notifications.css";

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(
    (message, type = "info", duration = 20000) => {
      const id = Math.random().toString(36).substr(2, 9);

      setNotifications((prev) => [...prev, { id, message, type }]);

      if (duration !== 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }
    },
    [removeNotification]
  );

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}

      <div className="notification-wrapper">
        {notifications.map((n) => (
          <div key={n.id} className={`notification ${n.type}`}>
            <span className="notification-text">{n.message}</span>

            {/* ✖ закрити */}
            <FaTimes
              className="notification-close"
              onClick={() => removeNotification(n.id)}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
