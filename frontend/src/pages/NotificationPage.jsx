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


// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axiosInstance from '../api/axios';
// import { 
//     FaBell, FaCheckDouble, FaEnvelopeOpen, 
//     FaInfoCircle, FaExclamationTriangle, FaTimes, 
//     FaMobileAlt // Додаємо іконку для пушів
// } from 'react-icons/fa';
// import './NotificationPage.css'; 

// // Імпортуємо функцію підписки (шлях підкоригуй під свій проект)
// import { subscribeToPush } from '../utils/useWebPush'; 

// const NotificationDrawer = ({ isOpen, onClose, notifications, setNotifications, unreadCount, setUnreadCount }) => {
//     const [loading] = useState(false);
//     const [subscribing, setSubscribing] = useState(false); // Стан для лоадера кнопки підписки
//     const navigate = useNavigate();

//     React.useEffect(() => {
//         document.body.style.overflow = isOpen ? 'hidden' : 'unset';
//     }, [isOpen]);

//     // Логіка увімкнення браузерних сповіщень
//     const handleSubscribe = async () => {
//         setSubscribing(true);
//         try {
//             // Тут викликаємо функцію, яку ми створили раніше
//             await subscribeToPush(); 
//             alert("Браузерні сповіщення активовано!");
//         } catch (err) {
//             console.error("Помилка підписки на пуші:", err);
//             alert("Не вдалося увімкнути сповіщення. Перевірте дозволи браузера.");
//         } finally {
//             setSubscribing(false);
//         }
//     };

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
//                 if (yearVal) { url += `&year=${yearVal}`; }
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
//                         {/* КНОПКА УВІМКНУТИ ПУШІ */}
//                         <button 
//                             onClick={handleSubscribe} 
//                             className={`btn-subscribe-push ${subscribing ? 'loading' : ''}`} 
//                             title="Увімкнути сповіщення на робочий стіл"
//                         >
//                             <FaMobileAlt size={16} />
//                             <span className="btn-text">Push</span>
//                         </button>

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


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { 
    FaBell, FaCheckDouble, FaEnvelopeOpen, 
    FaInfoCircle, FaExclamationTriangle, FaTimes, 
    FaMobileAlt, FaClock , FaBellSlash
} from 'react-icons/fa';
import './NotificationPage.css'; 
import { useNotification } from '../components/notification/Notifications';
import { subscribeToPush, unsubscribeFromPush } from '../utils/useWebPush'; 


const NotificationDrawer = ({ isOpen, onClose, notifications, setNotifications, unreadCount, setUnreadCount }) => {
    const [loading] = useState(false);

    const [permissionStatus, setPermissionStatus] = useState(
        window.Notification ? window.Notification.permission : 'default'
    );


    const [subscribing, setSubscribing] = useState(false); 
    const navigate = useNavigate();

    const { addNotification } = useNotification();



    const handleSubscribe = async () => {
        setSubscribing(true);
        try {
            await subscribeToPush(); 
            // Оновлюємо статус після успішної підписки
            setPermissionStatus(window.Notification.permission);
            addNotification("Браузерні сповіщення активовано!", "success");
        } catch (err) {
            console.error("Помилка підписки на пуші:", err);
            addNotification("Не вдалося увімкнути сповіщення.", "danger");
        } finally {
            setSubscribing(false);
        }
    };

    const handleUnsubscribe = async () => {
        setSubscribing(true);
        try {
            await unsubscribeFromPush(); // Ця функція має видаляти токен з БД на бекенді
            setPermissionStatus('default'); 
            addNotification("Сповіщення вимкнено", "info");
        } catch (err) {
            addNotification("Помилка при вимкненні сповіщень", "danger");
        } finally {
            setSubscribing(false);
        }
    };


    const handleNavigation = async (notification) => {
        // 1. Позначаємо як прочитане
        if (!notification.isRead) {
            try {
                await axiosInstance.patch(`/notifications/${notification.id}/mark-read/`, { is_read: true });
                
                setUnreadCount(prev => Math.max(0, prev - 1));
                setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
            } catch (err) { 
                console.error("Помилка при позначенні прочитаним:", err); 
            }
        }

        onClose(); 

        // 2. Логіка переходів (залишається без змін)
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
    };

    const handleMarkAllRead = async () => {
        try {
            await axiosInstance.post('/notifications/mark-read/');
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) { console.error(err); }
    };


    useEffect(() => {
        if (isOpen && window.Notification) {
            setPermissionStatus(window.Notification.permission);
        }
        document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    }, [isOpen]);

    const getIcon = (type) => {
        switch (type) {
            case 'NEW_CHAT_MESSAGE': 
            case 'NEW_MESSAGE': 
                return <FaEnvelopeOpen className="text-info" style={{color: '#17a2b8'}} />;
            case 'STATUS_CHANGED': 
                return <FaInfoCircle className="text-success" style={{color: '#28a745'}} />;

            case 'ORDER_STUCK_REMINDER': 
                return <FaClock className="text-warning" style={{color: '#ffc107'}} />;
            default: 
                return <FaExclamationTriangle className="text-warning" style={{color: '#ffc107'}} />;
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
                        {/* Кнопка ВВІМКНУТИ (якщо статус default) */}
                        {permissionStatus === 'default' && (
                            <button 
                                onClick={handleSubscribe} 
                                className={`btn-subscribe-push ${subscribing ? 'loading' : ''}`}
                                disabled={subscribing}
                            >
                                <FaBell size={14} />
                                <span className="btn-text">{subscribing ? '...' : 'Ввімкнути'}</span>
                            </button>
                        )}

                        {/* Кнопка ВИМКНУТИ (якщо статус granted) */}
                        {permissionStatus === 'granted' && (
                            <button 
                                onClick={handleUnsubscribe} 
                                className={`btn-unsubscribe-push ${subscribing ? 'loading' : ''}`}
                                disabled={subscribing}
                                title="Вимкнути сповіщення на цьому пристрої"
                            >
                                <FaBellSlash size={14} />
                                <span className="btn-text">{subscribing ? '...' : 'Вимкнути'}</span>
                            </button>
                        )}

                        {/* Статус ЗАБЛОКОВАНО (якщо denied) */}
                        {permissionStatus === 'denied' && (
                            <div className="status-blocked" title="Доступ заблоковано в браузері">
                                <FaExclamationTriangle color="#dc3545" />
                            </div>
                        )}

                        {/* {unreadCount > 0 && ( */}
                            <button onClick={handleMarkAllRead} className="btn-mark-read" title="Позначити всі як прочитані" disabled={unreadCount === 0}>
                                <FaCheckDouble size={14} /> 
                            </button>
                        {/* )} */}
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
                                className={`drawer-item ${!n.isRead ? 'unread' : ''} ${n.eventType === 'ORDER_STUCK_REMINDER' ? 'system-reminder' : ''}`}
                                onClick={() => handleNavigation(n)}
                            >
                                <div className="item-icon">{getIcon(n.eventType)}</div>
                                <div className="item-body">
                                    <div className="item-meta">
                                        {/* Для нагадувань пишемо "Система", для решти - тип транзакції */}
                                        <span className="item-type">
                                            {n.eventType === 'ORDER_STUCK_REMINDER' ? 'Нагадування' : (n.transactionType || 'Системне')}
                                        </span>
                                        <span className="item-date">
                                            {new Date(n.createdAt).toLocaleDateString('uk-UA')}
                                        </span>
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