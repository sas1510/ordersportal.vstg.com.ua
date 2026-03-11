import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios'; // Перевірте шлях до axios
import { FaBell, FaCheckDouble, FaEnvelopeOpen, FaInfoCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import './NotificationPage.css'; 

const NotificationDrawer = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
            fetchUnreadCount();
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/notifications/');
            if (res.data.status === 'success') {
                setNotifications(res.data.data);
            }
        } catch (err) {
            console.error("Помилка завантаження", err);
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
        } catch (err) { console.error(err); }
    };

    const handleNavigation = async (notification) => {
        if (!notification.isRead) {
            try {
                await axiosInstance.patch(`/notifications/${notification.id}/`, { is_read: true });
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (err) { console.error(err); }
        }

        onClose(); 

        if (notification.eventType === 'NEW_MESSAGE') {
            let path = '';
            if (notification.transactionType === 'Прорахунок') path = '/orders';
            else if (notification.transactionType === 'Рекламація') path = '/complaints';
            else if (notification.transactionType === 'Доп. замовлення') path = '/additional-orders';
            
            if (path) navigate(`${path}?search=${notification.newValue || ''}`);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await axiosInstance.post('/notifications/mark-read/');
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) { console.error(err); }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'NEW_MESSAGE': return <FaEnvelopeOpen className="text-info" style={{color: '#17a2b8'}} />;
            case 'STATUS_CHANGED': return <FaInfoCircle className="text-success" style={{color: '#28a745'}} />;
            default: return <FaExclamationTriangle className="text-warning" style={{color: '#ffc107'}} />;
        }
    };

    return (
        <>
            <div className={`drawer-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>
            <div className={`notification-drawer ${isOpen ? 'open' : ''}`}>
                <div className="drawer-header">
                    <div className="drawer-header-title">
                        <FaBell className="text-info" />
                        <h3 className="m-0">Сповіщення</h3>
                        {unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}
                    </div>
                    <div className='icon-together'>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="btn-mark-read" title="Позначити всі як прочитані">
                        <FaCheckDouble size={14} /> 
                      </button>
                   )}
                    <button className="close-btn" onClick={onClose}><FaTimes /></button>
                    </div>
                </div>
{/* 
                <div className="drawer-actions">
                   {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="btn-mark-read">
                        <FaCheckDouble size={12} /> Позначити всі як прочитані
                      </button>
                   )}
                </div> */}

                <div className="drawer-content">
                    {loading ? (
                        <div className="loading-state">Завантаження...</div>
                    ) : notifications.length === 0 ? (
                        <div className="empty-state">У вас немає сповіщень</div>
                    ) : (
                        notifications.map((n) => (
                            <div 
                                key={n.id} 
                                className={`drawer-item ${!n.isRead ? 'unread' : ''}`}
                                onClick={() => handleNavigation(n)}
                            >
                                <div className="item-icon">{getIcon(n.eventType)}</div>
                                <div className="item-body">
                                    <div className="item-meta">
                                        <span className="item-type">{n.transactionType || 'Системне'}</span>
                                        <span className="item-date">{new Date(n.createdAt).toLocaleDateString('uk-UA')}</span>
                                    </div>
                                    <p className="item-message">{n.message}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default NotificationDrawer;