import React, { createContext, useContext, useState, useCallback } from "react";
import { FaTimes } from "react-icons/fa";
import "./Notifications.css";

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const closeNotification = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, closing: true } : n
      )
    );

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 300); // ⏱ fadeOut duration
  }, []);

  const addNotification = useCallback(
  (message, type = "info", duration) => {
    const id = Math.random().toString(36).slice(2);

    const timeout = typeof duration === "number" ? duration : 7000;

    setNotifications(prev => [
      ...prev,
      { id, message, type, closing: false }
    ]);

    if (timeout > 0) {
      setTimeout(() => closeNotification(id), timeout);
    }
  },
  [closeNotification]
);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}

      <div className="notification-wrapper">
        {notifications.map(n => (
          <div
            key={n.id}
            className={`notification ${n.type} ${n.closing ? "closing" : ""}`}
          >
            <span className="notification-text">{n.message}</span>

            <FaTimes
              className="notification-close"
              onClick={() => closeNotification(n.id)}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
