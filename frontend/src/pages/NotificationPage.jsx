import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { FaBell, FaCheckDouble, FaEnvelopeOpen, FaInfoCircle, FaExclamationTriangle, FaExternalLinkAlt } from 'react-icons/fa';
import { useNotification } from '../components/notification/Notifications';
import { useTheme } from '../context/ThemeContext';
import './NotificationPage.css';

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const isDark = theme === "dark";

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/notifications/');
      if (res.data.status === 'success') {
        setNotifications(res.data.data);
      }
    } catch (err) {
      addNotification('Помилка завантаження сповіщень', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await axiosInstance.get('/notifications/count/');
      if (res.data.status === 'success') {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error("Не вдалося оновити лічильник", err);
    }
  };

  const markAsReadSingle = async (id) => {
    try {
      await axiosInstance.patch(`/notifications/${id}/`, { is_read: true });
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Помилка оновлення статусу", err);
    }
  };

  const handleNavigation = async (notification) => {
    if (!notification.isRead) {
      await markAsReadSingle(notification.id);
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
    }

    if (notification.eventType === 'NEW_MESSAGE') {
      let path = '';
      if (notification.transactionType === 'Прорахунок') path = '/orders';
      else if (notification.transactionType === 'Рекламація') path = '/complaints';
      else if (notification.transactionType === 'Доп. замовлення') path = '/additional-orders';

      if (path) {
        navigate(`${path}?search=${notification.newValue || ''}`);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axiosInstance.post('/notifications/mark-read/');
      addNotification('Всі сповіщення позначено як прочитані', 'success');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      addNotification('Не вдалося оновити статус', 'error');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'NEW_MESSAGE': return <FaEnvelopeOpen className="text-info" />;
      case 'STATUS_CHANGED': return <FaInfoCircle className="text-success" />;
      default: return <FaExclamationTriangle className="text-warning" />;
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="portal-body column p-14 gap-14">
      {/* HEADER */}
      <div className="row w-100 ai-center jc-space-between border-bottom p-7">
        <div className="row ai-center gap-14">
          <h2 className="window-title row ai-center gap-7">
            <FaBell className="text-info" /> Сповіщення
          </h2>
          {unreadCount > 0 && (
            <span className="label label-danger no-uppercase">+{unreadCount} нових</span>
          )}
        </div>
        {unreadCount > 0 && (
          <div onClick={handleMarkAllRead} className="clickTrigger text-info font-size-14 row ai-center gap-7">
            <FaCheckDouble /> Позначити всі як прочитані
          </div>
        )}
      </div>

      {loading ? (
        <div className="center py-10 text-grey">Завантаження...</div>
      ) : notifications.length === 0 ? (
        <div className="center py-10 text-grey font-size-18">У вас поки немає сповіщень</div>
      ) : (
        <div className="notification-list column gap-1">
          {notifications.map((n) => (
            <div 
              key={n.id} 
              onClick={() => handleNavigation(n)}
              className={`notification-item p-14 border-bottom clickTrigger ${!n.isRead ? 'unread' : 'read'}`}
            >
              {/* Використовуємо GRID для ідеального вирівнювання колонок */}
             <div className="notification-grid">
  <div className="notification-icon-col">
    {getIcon(n.eventType)}
  </div>
  
  <div className="notification-content-col column">
    {/* Перший рядок: Тип та Дата */}
    <div className="notification-header-row">
      <span className="text-info text-bold font-size-12 uppercase">
        {n.transactionType || 'Системне'}
      </span>
      <span className="text-grey font-size-11">{formatDate(n.createdAt)}</span>
    </div>
    
    {/* Другий рядок: Текст повідомлення */}
    <p className={`notification-text m-0 font-size-14 ${!n.isRead ? 'text-dark text-bold' : 'text-grey'}`}>
      {n.message}
    </p>
    
    {/* Третій рядок: Посилання */}
    {n.eventType === 'NEW_MESSAGE' && (
      <div className="notification-link-row text-info font-size-11 text-bold uppercase link-hover">
        <FaExternalLinkAlt size={12} /> 
        <span>Перейти до {n.transactionType}</span>
      </div>
    )}
  </div>
</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationPage;