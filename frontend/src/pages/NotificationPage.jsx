// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axiosInstance from '../api/axios';
// import { FaBell, FaCheckDouble, FaEnvelopeOpen, FaInfoCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
// import './NotificationPage.css'; 

// const NotificationDrawer = ({ isOpen, onClose, notifications, setNotifications, unreadCount, setUnreadCount }) => {
//     const [loading] = useState(false);
//     const navigate = useNavigate();


//     React.useEffect(() => {
//         document.body.style.overflow = isOpen ? 'hidden' : 'unset';
//     }, [isOpen]);

//     const handleNavigation = async (notification) => {

//         if (!notification.isRead) {
//             try {
//                 await axiosInstance.patch(`/notifications/${notification.id}/`, { is_read: true });
//                 setUnreadCount(prev => Math.max(0, prev - 1));
//                 setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
//             } catch (err) { console.error(err); }
//         }

//         onClose(); 

//         if (notification.eventType === 'NEW_CHAT_MESSAGE') {
//             let basePath = '';
//             if (notification.transactionType === 'Прорахунок') basePath = '/orders';
//             else if (notification.transactionType === 'Рекламація') basePath = '/complaints';
//             else if (notification.transactionType === 'Доп. замовлення') basePath = '/additional-orders';

//             if (basePath) {

//                 const searchVal = notification.doc_number;
//                 const yearVal = notification.docYear;
                
//                 let url = `${basePath}?search=${searchVal}`;
//                 if (yearVal) {
//                     url += `&year=${yearVal}`;
//                 }
                
//                 navigate(url);
//             }
//         }
//     };

//     const handleMarkAllRead = async () => {
//         try {
//             await axiosInstance.post('/notifications/mark-read/');
//             setUnreadCount(0);
//             setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
//         } catch (err) { console.error(err); }
//     };

//     const getIcon = (type) => {
//         switch (type) {
//             case 'NEW_CHAT_MESSAGE': 
//             case 'NEW_MESSAGE': return <FaEnvelopeOpen className="text-info" style={{color: '#17a2b8'}} />;
//             case 'STATUS_CHANGED': return <FaInfoCircle className="text-success" style={{color: '#28a745'}} />;
//             default: return <FaExclamationTriangle className="text-warning" style={{color: '#ffc107'}} />;
//         }
//     };

//     return (
//         <>
//             <div className={`drawer-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>
//             <div className={`notification-drawer ${isOpen ? 'open' : ''}`}>
//                 <div className="drawer-header">
//                     <div className="drawer-header-title">
//                         <FaBell className="text-info" />
//                         <h3 className="m-0">Сповіщення</h3>
//                         {unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}
//                     </div>
//                     <div className='icon-together'>
//                         {unreadCount > 0 && (
//                             <button onClick={handleMarkAllRead} className="btn-mark-read" title="Позначити всі як прочитані">
//                                 <FaCheckDouble size={14} /> 
//                             </button>
//                         )}
//                         <button className="close-btn" onClick={onClose}><FaTimes /></button>
//                     </div>
//                 </div>

//                 <div className="drawer-content">
//                     {loading ? (
//                         <div className="loading-state">Завантаження...</div>
//                     ) : notifications.length === 0 ? (
//                         <div className="empty-state">У вас немає сповіщень</div>
//                     ) : (
//                         notifications.map((n) => (
//                             <div 
//                                 key={n.id} 
//                                 className={`drawer-item ${!n.isRead ? 'unread' : ''}`}
//                                 onClick={() => handleNavigation(n)}
//                             >
//                                 <div className="item-icon">{getIcon(n.eventType)}</div>
//                                 <div className="item-body">
//                                     <div className="item-meta">
//                                         <span className="item-type">{n.transactionType || 'Системне'}</span>
//                                         <span className="item-date">{new Date(n.createdAt).toLocaleDateString('uk-UA')}</span>
//                                     </div>
//                                     <p className="item-message">{n.message}</p>
//                                 </div>
//                             </div>
//                         ))
//                     )}
//                 </div>
//             </div>
//         </>
//     );
// };

// export default NotificationDrawer;


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { 
    FaBell, FaCheckDouble, FaEnvelopeOpen, 
    FaInfoCircle, FaExclamationTriangle, FaTimes, 
    FaMobileAlt // Додаємо іконку для пушів
} from 'react-icons/fa';
import './NotificationPage.css'; 

// Імпортуємо функцію підписки (шлях підкоригуй під свій проект)
import { subscribeToPush } from '../utils/useWebPush'; 

const NotificationDrawer = ({ isOpen, onClose, notifications, setNotifications, unreadCount, setUnreadCount }) => {
    const [loading] = useState(false);
    const [subscribing, setSubscribing] = useState(false); // Стан для лоадера кнопки підписки
    const navigate = useNavigate();

    React.useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    }, [isOpen]);

    // Логіка увімкнення браузерних сповіщень
    const handleSubscribe = async () => {
        setSubscribing(true);
        try {
            // Тут викликаємо функцію, яку ми створили раніше
            await subscribeToPush(); 
            alert("Браузерні сповіщення активовано!");
        } catch (err) {
            console.error("Помилка підписки на пуші:", err);
            alert("Не вдалося увімкнути сповіщення. Перевірте дозволи браузера.");
        } finally {
            setSubscribing(false);
        }
    };

    const handleNavigation = async (notification) => {
        if (!notification.isRead) {
            try {
                await axiosInstance.patch(`/notifications/${notification.id}/`, { is_read: true });
                setUnreadCount(prev => Math.max(0, prev - 1));
                setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
            } catch (err) { console.error(err); }
        }

        onClose(); 

        if (notification.eventType === 'NEW_CHAT_MESSAGE') {
            let basePath = '';
            if (notification.transactionType === 'Прорахунок') basePath = '/orders';
            else if (notification.transactionType === 'Рекламація') basePath = '/complaints';
            else if (notification.transactionType === 'Доп. замовлення') basePath = '/additional-orders';

            if (basePath) {
                const searchVal = notification.doc_number;
                const yearVal = notification.docYear;
                let url = `${basePath}?search=${searchVal}`;
                if (yearVal) { url += `&year=${yearVal}`; }
                navigate(url);
            }
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
            case 'NEW_CHAT_MESSAGE': 
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
                        {/* КНОПКА УВІМКНУТИ ПУШІ */}
                        <button 
                            onClick={handleSubscribe} 
                            className={`btn-subscribe-push ${subscribing ? 'loading' : ''}`} 
                            title="Увімкнути сповіщення на робочий стіл"
                        >
                            <FaMobileAlt size={16} />
                            <span className="btn-text">Push</span>
                        </button>

                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="btn-mark-read" title="Позначити всі як прочитані">
                                <FaCheckDouble size={14} /> 
                            </button>
                        )}
                        <button className="close-btn" onClick={onClose}><FaTimes /></button>
                    </div>
                </div>

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