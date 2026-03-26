// // import { Link, useLocation, useNavigate } from "react-router-dom";
// // import { useState, useRef, useEffect, useContext } from "react";
// // import { useMediaQuery } from "react-responsive";
// // import { AuthContext } from "../../context/AuthContext";
// // import { RoleContext } from "../../context/RoleContext";
// // import { useTheme } from "../../context/ThemeContext"; // 👈 ІМПОРТ КОНТЕКСТУ ТЕМИ
// // import "./HeaderAdmin.css"; 
// // import HeaderDealerProfile from "./HeaderDealerProfile";
// // import axiosInstance from "../../api/axios";
// // import NotificationDrawer from "../../pages/NotificationPage";


// // const NAV_LINKS = [
// //   { title: "Акції WDS", to: "/promo-wds-codes", icon: "icon-fire", className: "highlight"  },
// //   { title: "Замовлення", to: "/orders", icon: "icon-calculator" },
// //   { title: "Рекламації", to: "/complaints", icon: "icon-tools2" },
// //   { title: "Дозамовлення", to: "/additional-orders", icon: "icon-add-to-list" },

// //   { title: "Файли", to: "/files", icon: "icon-document-file-pdf" },
// //   { title: "Відео", to: "/videos", icon: "icon-youtube" },
// //   { title: "Оплата", to: "/finance/payment", icon: "icon-wallet"   },
// // //   { title: "SOS", to: "/emergency-contacts", icon: "icon-stats" },
// // ];

// // const FINANCE_SUBMENU = [
// //   { title: "Рух коштів", to: "/finance/cash-flow" },
// //   { title: "Аналітика", to: "/finance/statistics" },
// // //   { title: "Оплата", to: "/finance/payment" },
// //   { title: "Рахунки", to: "/finance/customer-bills" },
// // ];

// // export default function HeaderDealer() {
// //   const isMobile = useMediaQuery({ maxWidth: 1459 });
// //   const navigate = useNavigate();
// //   const location = useLocation();

// //   const { logout } = useContext(AuthContext);
// //   const { role } = useContext(RoleContext);
// //   // 👈 Отримуємо тему та toggleTheme
// //   const { theme, toggleTheme } = useTheme(); 
// //   const [unreadCount, setUnreadCount] = useState(0); 

// //   const [isNotificationOpen, setIsNotificationOpen] = useState(false);

// //   const fetchUnreadCount = async () => {
// //     try {
// //       const res = await axiosInstance.get('/notifications/count/');
// //       if (res.data.status === 'success') {
// //         setUnreadCount(res.data.unreadCount);
// //       }
// //     } catch (err) {
// //       console.error("Помилка отримання кількості сповіщень:", err);
// //     }
// //   };

// //   useEffect(() => {
// //     // Викликаємо відразу
// //     fetchUnreadCount();

// //     // Встановлюємо інтервал оновлення (наприклад, кожні 60 секунд)
// //     const interval = setInterval(() => {
// //       fetchUnreadCount();
// //     }, 600000); 

// //     return () => clearInterval(interval);
// //   }, []);

// //   // 4. Додаємо ефект для скидання лічильника, якщо користувач перейшов на сторінку сповіщень
// //   useEffect(() => {
// //     if (location.pathname === '/notifications') {
// //       // Можна або почекати поки сторінка сама позначить як прочитані, 
// //       // або просто візуально обнулити тут
// //       // setUnreadCount(0); 
// //     }
// //   }, [location.pathname]);

// //   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
// //   const [showFinanceMenu, setShowFinanceMenu] = useState(false);
// //   const [showFinanceMenuMobile, setShowFinanceMenuMobile] = useState(false);

// //   const [showProfileMenuMobile, setShowProfileMenuMobile] = useState(false);


// //   const [profileOpen, setProfileOpen] = useState(false);
// //   const profileRef = useRef();

// //   const financeRef = useRef();
// //   const mobileMenuRef = useRef();
// //   const toggleProfileMenuMobile = () => {
// //     setShowProfileMenuMobile(prev => !prev);
// //     setShowFinanceMenuMobile(false); 
// //     };


// //   useEffect(() => {
// //     setShowFinanceMenu(false);
// //     setShowFinanceMenuMobile(false);
// //     setMobileMenuOpen(false);
// //     setProfileOpen(false);
// //     setShowProfileMenuMobile(false);
// //   }, [location]);

// //   useEffect(() => {
// //   function handleClickOutside(event) {
// //     if (financeRef.current && !financeRef.current.contains(event.target)) {
// //       setShowFinanceMenu(false);
// //     }

// //     if (profileRef.current && !profileRef.current.contains(event.target)) {
// //       setProfileOpen(false);
// //     }

// //     if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
// //       setMobileMenuOpen(false);
// //       setShowFinanceMenuMobile(false);
// //       setShowProfileMenuMobile(false);
// //     }
// //   }

// //   document.addEventListener("mousedown", handleClickOutside);
// //   return () => document.removeEventListener("mousedown", handleClickOutside);
// // }, []);


// //   const handleLogout = async () => {
// //     await logout();
// //     navigate("/home");
// //   };

// //   const navLinks = NAV_LINKS.map((link) => (
// //     <li key={link.to} className={`${location.pathname.startsWith(link.to) ? "active" : ""} ${link.className || ""}`}>
// //       <Link to={link.to} className="menu-link">
// //         <span className={`icon ${link.icon}`}></span>
// //         <span>{link.title}</span>
// //       </Link>
// //     </li>
// //   ));

// //   const toggleFinanceMenu = () => {
// //     setShowFinanceMenu(prev => !prev);
// //     setProfileOpen(false); 
// //     };

// //   const toggleFinanceMenuMobile = () => {
// //     setShowFinanceMenuMobile(prev => !prev);
// //     setShowProfileMenuMobile(false); // 👈 ЗАКРИВАЄМО ПРОФІЛЬ
// //     };


// //   return (
// //     <header className="portal-header ">
// //       <div className="flex items-center">
// //         <Link to={"/dashboard"}>
// //           <img src="/header_logo.svg" alt="Логотип" className="height-logo" />
// //         </Link>
// //       </div>

// //       {!isMobile ? (
// //         <nav className="menu z-1000"  ref={financeRef}>
// //           <ul>
// //             {navLinks}
            

// //             <li>
// //               <button className="menu-link" onClick={toggleFinanceMenu}>
// //                 <i className="icon icon-coin-dollar"></i>
// //                 Фінанси ▾
// //               </button>
// //               {showFinanceMenu && (
// //                 <ul className="submenu">
// //                   {FINANCE_SUBMENU.map(item => (
// //                     <li key={item.to}>
// //                       <Link to={item.to} className="menu-link" onClick={() => setShowFinanceMenu(false)}>
// //                         {item.title}
// //                       </Link>
// //                     </li>
// //                   ))}
// //                 </ul>
// //               )}
// //             </li>

// //                         <li ref={profileRef}>
// //   <button
// //     className="menu-link dealer-profile-link"
// //     onClick={() => {
// //         setProfileOpen(prev => !prev);
// //         setShowFinanceMenu(false); // 👈 ЗАКРИВАЄМО ФІНАНСИ
// //     }}

// //   >
// //     <HeaderDealerProfile />

// //   </button>

// //   {profileOpen && (
// //     <ul className="submenu">
// //       <li>
// //         <Link
// //           to="/change-password"
// //           className="menu-link"
// //           onClick={() => setProfileOpen(false)}
// //         >
// //            Змінити пароль
// //         </Link>
// //       </li>

// //       {/* <li>
// //         <Link
// //           to="/edit-addresses"
// //           className="menu-link"
// //           onClick={() => setProfileOpen(false)}
// //         >
// //            Адреси доставки
// //         </Link>
// //       </li> */}
// //       <li>
// //       <Link
// //         to="/emergency-contacts"
// //         className="menu-link menu-link--sos" // Можна додати спец. клас для червоного кольору
// //         onClick={() => setProfileOpen(false)}
// //       >
// //        Гаряча лінія 
// //       </Link> 
// //       {/* Зворотний зв'язок*/ }
// //     </li>
// //     </ul>
// //   )}
// // </li>


// //       <li className="theme-toggle-item">
// //           <div 
// //                             className="theme-toggle-btn"  >
// //           <div 
// //                             className="menu-link notification-link" 
// //                             onClick={() => setIsNotificationOpen(true)}
// //                             style={{ cursor: 'pointer', position: 'relative' }}
// //                         >
// //             <i className="fa fa-bell material-icons"   style={{ 
// //                                 color: theme === "light" ? "#f4ffaf" : "#ffc107",
// //                                 fontSize: '18px',
// //                                 fontStyle: 'normal'
// //                             }}></i>
// //             {unreadCount > 0 && (
// //           <span className="notification-badge">
// //             {unreadCount > 99 ? '99+' : unreadCount}
// //           </span>
// //         )}
// //           </div>
// //           </div>

// //       </li>







// //             {/* 👈 КНОПКА ТЕМИ (DESKTOP) */}
// //             <li className="theme-toggle-item">
// //               <button 
// //                   className="theme-toggle-btn" 
// //                   onClick={toggleTheme} 
// //                   title="Перемкнути тему"
// //               >
// //                   <i 
// //                       // 👈 ВИКОРИСТОВУЄМО КЛАС MATERIAL ICONS
// //                       className="material-icons" 
// //                       style={{ 
// //                           color: theme === "light" ? "#f4ffaf" : "#ffc107",
// //                           fontSize: '20px', // Material Icons часто вимагають 24px або 18px
// //                           fontStyle: 'normal' // Щоб уникнути курсиву від тегу <i>
// //                       }}
// //                   >
// //                       {/* Динамічний текст іконки Material Icons */}
// //                       {theme === "light" ? "brightness_3" : "wb_sunny"} 
// //                   </i>

// //               </button>
// //           </li>
// //       
// //              <li className="logout-item">
// //                 <button
// //                   className="menu-link logout-icon"
// //                   onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
// //                   title="Вийти"
// //                 >
// //                   <i className="fa fa-sign-out-alt"></i>

// //                 </button>
// //               </li>
// //           </ul>
// //         </nav>
// //       ) : (
// //         <div className="mobile-menu" ref={mobileMenuRef}>
// //     {/* Кнопка бургер-меню */}
// //     <button
// //       onClick={() => setMobileMenuOpen(prev => !prev)}
// //       className="menu-toggle"
// //     >
// //       ☰
// //     </button>

// //     {/* Вміст меню */}
// //     {mobileMenuOpen && (
// //       <div className="mobile-menu-content">
// //         <ul>
// //           {navLinks}

// //           {/* Фінанси */}
// //           <li>
// //           <div className="menu-link" onClick={toggleFinanceMenuMobile}>
// //             Фінанси ▾
// //           </div>
// //           {showFinanceMenuMobile && (
// //             <div className="submenu-wrapper">
// //               <ul className="submenu">
// //                 {FINANCE_SUBMENU.map(item => (
// //                   <li key={item.to}>
// //                     <Link to={item.to} className="menu-link" onClick={() => setMobileMenuOpen(false)}>
// //                       {item.title}
// //                     </Link>
// //                   </li>
// //                 ))}
// //               </ul>
// //             </div>
// //           )}
// //         </li>

// // {/* ПРОФІЛЬ — як Фінанси */}
// // <li>
// //   <div className="menu-link" onClick={toggleProfileMenuMobile}>
// //     Профіль ▾
// //   </div>

// //   {showProfileMenuMobile && (
// //     <div className="submenu-wrapper">
// //       <ul className="submenu">
// //         <li>
// //           <Link
// //             to="/change-password"
// //             className="menu-link"
// //             onClick={() => setMobileMenuOpen(false)}
// //           >
// //             Змінити пароль
// //           </Link>
// //         </li>

// //         {/* <li>
// //           <Link
// //             to="/edit-addresses"
// //             className="menu-link"
// //             onClick={() => setMobileMenuOpen(false)}
// //           >
// //             Адреси доставки
// //           </Link>
// //         </li> */}
// //         <li>
// //         <Link
// //           to="/emergency-contacts"
// //           className="menu-link menu-link--sos" // Можна додати спец. клас для червоного кольору
// //           onClick={() => setProfileOpen(false)}
// //         >
// //         Гаряча лінія 
// //         </Link> 
// //         {/* Зворотний зв'язок*/ }
// //       </li>
        
// //       </ul>
// //     </div>
// //   )}
// // </li>



       
          


// //      <li className="theme-toggle-item">
// //           <div 
// //               className="theme-toggle-btn"  >
// //           <div 
// //               className="menu-link notification-link" 
// //               onClick={() => setIsNotificationOpen(true)}
// //               style={{ cursor: 'pointer', position: 'relative' , gap: '0px'}}
// //             >
// //             <i className="fa fa-bell material-icons"   style={{ 
// //                                 color: theme === "light" ? "#f4ffaf" : "#ffc107",
// //                                 fontSize: '18px',
// //                                 fontStyle: 'normal',
// //                                 marginLeft: unreadCount > 0 ? '14px' : '0px'
// //                             }}></i>
// //             {unreadCount > 0 && (
// //           <span className="notification-badge">
// //             {unreadCount > 99 ? '99+' : unreadCount}
// //           </span>
// //         )}
// //           </div>
// //           </div>

// //       </li>

         

// //           <li className="theme-toggle-item">
// //               <button 
// //                   className="theme-toggle-btn" 
// //                   onClick={toggleTheme} 
// //                   title="Перемкнути тему"
// //               >
// //                   <i 
// //                       // 👈 ВИКОРИСТОВУЄМО КЛАС MATERIAL ICONS
// //                       className="material-icons" 
// //                       style={{ 
// //                           color: theme === "light" ? "#f4ffaf" : "#ffc107",
// //                           fontSize: '20px', // Material Icons часто вимагають 24px або 18px
// //                           fontStyle: 'normal' // Щоб уникнути курсиву від тегу <i>
// //                       }}
// //                   >
// //                       {/* Динамічний текст іконки Material Icons */}
// //                       {theme === "light" ? "brightness_3" : "wb_sunny"} 
// //                   </i>

// //               </button>
// //           </li>
// //           {/* Кнопка Вихід */}
// //           <li className="logout-item">
// //             <button
// //               className="menu-link logout-icon"
// //               onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
// //               title="Вийти"
// //             >
// //               <i className="fa fa-sign-out-alt"></i>
// //                 <span>Вихід</span>
// //             </button>
// //           </li>
// //         </ul>
// //       </div>
// //     )}
// //   </div>
// //       )}
// // <NotificationDrawer 
// //                 isOpen={isNotificationOpen} 
// //                 onClose={() => {
// //                     setIsNotificationOpen(false);
// //                     fetchUnreadCount(); // Оновлюємо цифру в шапці після закриття
// //                 }} 
// //             />
// //     </header>
// //   );
// // }


// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { useState, useRef, useEffect, useContext, useCallback } from "react";
// import { useMediaQuery } from "react-responsive";
// import { AuthContext } from "../../context/AuthContext";
// import { RoleContext } from "../../context/RoleContext";
// import { useTheme } from "../../context/ThemeContext";
// import "./HeaderAdmin.css"; 
// import HeaderDealerProfile from "./HeaderDealerProfile";
// import axiosInstance from "../../api/axios";
// import NotificationDrawer from "../../pages/NotificationPage";
// import { useNotification } from "../notification/Notifications.jsx"; // Імпорт хука сповіщень

// const NAV_LINKS = [
//   { title: "Акції WDS", to: "/promo-wds-codes", icon: "icon-fire", className: "highlight" },
//   { title: "Замовлення", to: "/orders", icon: "icon-calculator" },
//   { title: "Рекламації", to: "/complaints", icon: "icon-tools2" },
//   { title: "Дозамовлення", to: "/additional-orders", icon: "icon-add-to-list" },
//   { title: "Файли", to: "/files", icon: "icon-document-file-pdf" },
//   { title: "Відео", to: "/videos", icon: "icon-youtube" },
//   { title: "Оплата", to: "/finance/payment", icon: "icon-wallet" },
// ];

// const FINANCE_SUBMENU = [
//   { title: "Рух коштів", to: "/finance/cash-flow" },
//   { title: "Аналітика", to: "/finance/statistics" },
//   { title: "Рахунки", to: "/finance/customer-bills" },
// ];

// export default function HeaderDealer() {
//   const isMobile = useMediaQuery({ maxWidth: 1459 });
//   const navigate = useNavigate();
//   const location = useLocation();

//   const { logout } = useContext(AuthContext);
//   const { role } = useContext(RoleContext);
//   const { theme, toggleTheme } = useTheme(); 
//   const { addNotification } = useNotification();

//   const [unreadCount, setUnreadCount] = useState(0); 
//   const [isNotificationOpen, setIsNotificationOpen] = useState(false);
//   const socket = useRef(null);

//   /* ================= LOAD INITIAL COUNT (HTTP) ================= */
//   const fetchUnreadCount = useCallback(async () => {
//     try {
//       const res = await axiosInstance.get('/notifications/count/');
//       if (res.data.status === 'success') {
//         setUnreadCount(res.data.unreadCount);
//       }
//     } catch (err) {
//       console.error("Помилка отримання кількості сповіщень:", err);
//     }
//   }, []);

//  /* ================= WEBSOCKET FOR NOTIFICATIONS ================= */
//   useEffect(() => {
//     // 1. Початкове завантаження (HTTP)
//     fetchUnreadCount();

//     const token = localStorage.getItem("access");
//     if (!token) return;

//     const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
//     const ws_host = window.location.host;
//     let reconnectTimer;

//     const connectNotifyWS = () => {
//       if (socket.current && socket.current.readyState === WebSocket.OPEN) return;

//       socket.current = new WebSocket(`${ws_scheme}://${ws_host}/ws/notifications/?token=${token}`);

//       socket.current.onmessage = (e) => {
//         const data = JSON.parse(e.data);

//         // Обробка початкового стану від сокета (якщо бекенд шле його при connect)
//         if (data.type === "initial_notifications") {
//           setUnreadCount(data.unread_count);
//         }

//         // Обробка нових повідомлень (ChatMessage) або сповіщень
//         // Перевіряємо обидва варіанти 'type' залежно від того, що шле ваш бекенд
//         if (data.type === "new_notification" || data.type === "NEW_CHAT_MESSAGE" || data.type === "notification_message") {
          
//           // Отримуємо дані з вкладеного об'єкта 'data', якщо бекенд шле структуру {type:..., data: {...}}
//           const payload = data.data || data;

//           // 1. Оновлюємо лічильник локально
//           setUnreadCount(prev => prev + 1);
          
//           // 2. Виводимо спливаюче повідомлення (Toast)
//           const messageText = payload.text || payload.message || "Нове повідомлення у чаті";
//           const author = payload.author_name ? `${payload.author_name}: ` : "";
          
//           addNotification(`🔔 ${author}${messageText}`, "info", 6000);
//         }
//       };

//       socket.current.onclose = (e) => {
//         if (!e.wasClean) {
//           console.log("WS closed. Reconnecting...");
//           reconnectTimer = setTimeout(connectNotifyWS, 5000);
//         }
//       };
//     };

//     connectNotifyWS();

//     return () => {
//       if (reconnectTimer) clearTimeout(reconnectTimer);
//       if (socket.current) {
//         socket.current.close();
//         socket.current = null;
//       }
//     };
//   }, [addNotification, fetchUnreadCount]); 



//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [showFinanceMenu, setShowFinanceMenu] = useState(false);
//   const [showFinanceMenuMobile, setShowFinanceMenuMobile] = useState(false);
//   const [showProfileMenuMobile, setShowProfileMenuMobile] = useState(false);
//   const [profileOpen, setProfileOpen] = useState(false);

//   const profileRef = useRef();
//   const financeRef = useRef();
//   const mobileMenuRef = useRef();

//   const toggleProfileMenuMobile = () => {
//     setShowProfileMenuMobile(prev => !prev);
//     setShowFinanceMenuMobile(false); 
//   };

//   const toggleFinanceMenuMobile = () => {
//     setShowFinanceMenuMobile(prev => !prev);
//     setShowProfileMenuMobile(false);
//   };

//   const toggleFinanceMenu = () => {
//     setShowFinanceMenu(prev => !prev);
//     setProfileOpen(false); 
//   };

//   useEffect(() => {
//     setShowFinanceMenu(false);
//     setShowFinanceMenuMobile(false);
//     setMobileMenuOpen(false);
//     setProfileOpen(false);
//     setShowProfileMenuMobile(false);
//   }, [location]);

//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (financeRef.current && !financeRef.current.contains(event.target)) setShowFinanceMenu(false);
//       if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
//       if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
//         setMobileMenuOpen(false);
//         setShowFinanceMenuMobile(false);
//         setShowProfileMenuMobile(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleLogout = async () => {
//     await logout();
//     navigate("/home");
//   };

//   const navLinks = NAV_LINKS.map((link) => (
//     <li key={link.to} className={`${location.pathname.startsWith(link.to) ? "active" : ""} ${link.className || ""}`}>
//       <Link to={link.to} className="menu-link">
//         <span className={`icon ${link.icon}`}></span>
//         <span>{link.title}</span>
//       </Link>
//     </li>
//   ));

//   return (
//     <header className="portal-header ">
//       <div className="flex items-center">
//         <Link to={"/dashboard"}>
//           <img src="/header_logo.svg" alt="Логотип" className="height-logo" />
//         </Link>
//       </div>

//       {!isMobile ? (
//         <nav className="menu z-1000" ref={financeRef}>
//           <ul>
//             {navLinks}
//             <li>
//               <button className="menu-link" onClick={toggleFinanceMenu}>
//                 <i className="icon icon-coin-dollar"></i>
//                 Фінанси ▾
//               </button>
//               {showFinanceMenu && (
//                 <ul className="submenu">
//                   {FINANCE_SUBMENU.map(item => (
//                     <li key={item.to}>
//                       <Link to={item.to} className="menu-link" onClick={() => setShowFinanceMenu(false)}>
//                         {item.title}
//                       </Link>
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </li>

//             <li ref={profileRef}>
//               <button
//                 className="menu-link dealer-profile-link"
//                 onClick={() => {
//                     setProfileOpen(prev => !prev);
//                     setShowFinanceMenu(false);
//                 }}
//               >
//                 <HeaderDealerProfile />
//               </button>
//               {profileOpen && (
//                 <ul className="submenu">
//                   <li><Link to="/change-password" title="Змінити пароль" className="menu-link" onClick={() => setProfileOpen(false)}>Змінити пароль</Link></li>
//                   <li><Link to="/emergency-contacts" className="menu-link menu-link--sos" onClick={() => setProfileOpen(false)}>Гаряча лінія</Link></li>
//                 </ul>
//               )}
//             </li>

//             <li className="theme-toggle-item">
//                 <div className="theme-toggle-btn">
//                   <div 
//                     className="menu-link notification-link" 
//                     onClick={() => setIsNotificationOpen(true)}
//                     style={{ cursor: 'pointer', position: 'relative' }}
//                   >
//                     <i className="fa fa-bell material-icons" style={{ 
//                         color: theme === "light" ? "#f4ffaf" : "#ffc107",
//                         fontSize: '18px',
//                         fontStyle: 'normal'
//                     }}></i>
//                     {unreadCount > 0 && (
//                       <span className="notification-badge">
//                         {unreadCount > 99 ? '99+' : unreadCount}
//                       </span>
//                     )}
//                   </div>
//                 </div>
//             </li>

//             <li className="theme-toggle-item">
//               <button className="theme-toggle-btn" onClick={toggleTheme} title="Перемкнути тему">
//                   <i className="material-icons" style={{ color: theme === "light" ? "#f4ffaf" : "#ffc107", fontSize: '20px', fontStyle: 'normal' }}>
//                       {theme === "light" ? "brightness_3" : "wb_sunny"} 
//                   </i>
//               </button>
//             </li>

//             <li className="logout-item">
//               <button className="menu-link logout-icon" onClick={() => { handleLogout(); setMobileMenuOpen(false); }} title="Вийти">
//                 <i className="fa fa-sign-out-alt"></i>
//               </button>
//             </li>
//           </ul>
//         </nav>
//       ) : (
//         <div className="mobile-menu" ref={mobileMenuRef}>
//           <button onClick={() => setMobileMenuOpen(prev => !prev)} className="menu-toggle">☰</button>
//           {mobileMenuOpen && (
//             <div className="mobile-menu-content">
//               <ul>
//                 {navLinks}
//                 <li>
//                   <div className="menu-link" onClick={toggleFinanceMenuMobile}>Фінанси ▾</div>
//                   {showFinanceMenuMobile && (
//                     <div className="submenu-wrapper">
//                       <ul className="submenu">
//                         {FINANCE_SUBMENU.map(item => (
//                           <li key={item.to}><Link to={item.to} className="menu-link" onClick={() => setMobileMenuOpen(false)}>{item.title}</Link></li>
//                         ))}
//                       </ul>
//                     </div>
//                   )}
//                 </li>
//                 <li>
//                   <div className="menu-link" onClick={toggleProfileMenuMobile}>Профіль ▾</div>
//                   {showProfileMenuMobile && (
//                     <div className="submenu-wrapper">
//                       <ul className="submenu">
//                         <li><Link to="/change-password" className="menu-link" onClick={() => setMobileMenuOpen(false)}>Змінити пароль</Link></li>
//                         <li><Link to="/emergency-contacts" className="menu-link menu-link--sos" onClick={() => setProfileOpen(false)}>Гаряча лінія</Link></li>
//                       </ul>
//                     </div>
//                   )}
//                 </li>
//                 <li className="theme-toggle-item">
//                   <div className="theme-toggle-btn">
//                     <div className="menu-link notification-link" onClick={() => setIsNotificationOpen(true)} style={{ cursor: 'pointer', position: 'relative', gap: '0px' }}>
//                       <i className="fa fa-bell material-icons" style={{ color: theme === "light" ? "#f4ffaf" : "#ffc107", fontSize: '18px', fontStyle: 'normal', marginLeft: unreadCount > 0 ? '14px' : '0px' }}></i>
//                       {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
//                     </div>
//                   </div>
//                 </li>
//                 <li className="theme-toggle-item">
//                   <button className="theme-toggle-btn" onClick={toggleTheme} title="Перемкнути тему">
//                     <i className="material-icons" style={{ color: theme === "light" ? "#f4ffaf" : "#ffc107", fontSize: '20px', fontStyle: 'normal' }}>
//                       {theme === "light" ? "brightness_3" : "wb_sunny"}
//                     </i>
//                   </button>
//                 </li>
//                 <li className="logout-item">
//                   <button className="menu-link logout-icon" onClick={() => { handleLogout(); setMobileMenuOpen(false); }} title="Вийти">
//                     <i className="fa fa-sign-out-alt"></i>
//                     <span>Вихід</span>
//                   </button>
//                 </li>
//               </ul>
//             </div>
//           )}
//         </div>
//       )}
//       <NotificationDrawer 
//         isOpen={isNotificationOpen} 
//         onClose={() => {
//             setIsNotificationOpen(false);
//             fetchUnreadCount(); 
//         }} 
//       />
//     </header>
//   );
// }


import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useContext, useCallback } from "react";
import { useMediaQuery } from "react-responsive";
import { AuthContext } from "../../context/AuthContext";
import { RoleContext } from "../../context/RoleContext";
import { useTheme } from "../../context/ThemeContext";
import "./HeaderAdmin.css"; 
import HeaderDealerProfile from "./HeaderDealerProfile";
import axiosInstance, { getAccessToken } from "../../api/axios";
import NotificationDrawer from "../../pages/NotificationPage";
import { useNotification } from "../notification/Notifications.jsx";

const NAV_LINKS = [
    { title: "Акції WDS", to: "/promo-wds-codes", icon: "icon-fire", className: "highlight" },
    { title: "Замовлення", to: "/orders", icon: "icon-calculator" },
    { title: "Рекламації", to: "/complaints", icon: "icon-tools2" },
    { title: "Дозамовлення", to: "/additional-orders", icon: "icon-add-to-list" },
    { title: "Файли", to: "/files", icon: "icon-document-file-pdf" },
    { title: "Відео", to: "/videos", icon: "icon-youtube" },
    { title: "Оплата", to: "/finance/payment", icon: "icon-wallet" },
];

const FINANCE_SUBMENU = [
    { title: "Рух коштів", to: "/finance/cash-flow" },
    { title: "Аналітика", to: "/finance/statistics" },
    { title: "Рахунки", to: "/finance/customer-bills" },
];

export default function HeaderDealer() {
    const isMobile = useMediaQuery({ maxWidth: 1459 });
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useContext(AuthContext);
    const { theme, toggleTheme } = useTheme(); 
    const { addNotification } = useNotification();

    // СПІЛЬНИЙ СТАН
    const [unreadCount, setUnreadCount] = useState(0); 
    const [notifications, setNotifications] = useState([]); 
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const socket = useRef(null);
    const reconnectTimer = useRef(null);

    /* ================= ЗАВАНТАЖЕННЯ ДАНИХ (HTTP) ================= */
    const fetchInitialData = useCallback(async () => {
        try {
            const [countRes, listRes] = await Promise.all([
                axiosInstance.get('/notifications/count/'),
                axiosInstance.get('/notifications/')
            ]);
            if (countRes.data.status === 'success') setUnreadCount(countRes.data.unreadCount);
            if (listRes.data.status === 'success') setNotifications(listRes.data.data);
        } catch (err) {
            console.error("Помилка завантаження сповіщень:", err);
        }
    }, []);

    /* ================= WEBSOCKET LOGIC ================= */
    // 1. Окремий ефект для початкового завантаження даних
useEffect(() => {
    fetchInitialData();
}, [fetchInitialData]);

/* ================= WEBSOCKET LOGIC ================= */
useEffect(() => {
        let pingInterval;
        let isCleanup = false;

        const connectNotifyWS = async () => { // 2. Робимо функцію асинхронною
            if (isCleanup) return;
            
            // Якщо сокет вже в процесі підключення або відкритий - нічого не робимо
            if (socket.current?.readyState === WebSocket.OPEN || socket.current?.readyState === WebSocket.CONNECTING) return;

            console.log("Refreshing session before WS connection...");
            try {
                // 3. 🔥 "Прогріваємо" токен. 
                // Якщо токен прострочений, axios-інтерцептор автоматично оновить його через refresh-токен.
                await axiosInstance.get('/notifications/count/');
            } catch (err) {
                console.error("Could not refresh token for WS, retrying in 5s...");
                reconnectTimer.current = setTimeout(connectNotifyWS, 5000);
                return;
            }

            const token = getAccessToken(); // Беремо вже точно свіжий токен
            if (!token) return;

            const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
            const ws_host = window.location.host;

            console.log("Connecting to Notification WS with fresh token...");
            socket.current = new WebSocket(`${ws_scheme}://${ws_host}/ws/notifications/?token=${token}`);

            socket.current.onopen = () => {
                console.log("Notification WS Connected ✅");
                pingInterval = setInterval(() => {
                    if (socket.current?.readyState === WebSocket.OPEN) {
                        socket.current.send(JSON.stringify({ type: "ping" }));
                    }
                }, 30000);
            };

            socket.current.onmessage = (e) => {
                const data = JSON.parse(e.data);
                
                if (data.type === "initial_notifications") {
                    setUnreadCount(data.unread_count);
                }

                if (data.type === "new_notification" || data.type === "NEW_CHAT_MESSAGE" || data.type === "notification_message") {
                    const payload = data.data || data;
                    setUnreadCount(prev => prev + 1);
                    
                    const newEntry = {
                        id: payload.id || Date.now(),
                        message: payload.text || payload.message || "Нове повідомлення",
                        eventType: payload.type || 'NEW_MESSAGE',
                        createdAt: payload.timestamp || new Date().toISOString(),
                        isRead: false,
                        transactionType: payload.transactionType,
                        authorName: payload.author_name,
                        doc_number: payload.doc_number,
                        docYear: payload.docYear,
                    };
                    
                    setNotifications(prev => [newEntry, ...prev]);
                    addNotification(`🔔 ${payload.author_name || ''}: ${newEntry.message}`, "info", 6000);
                }
            };

            socket.current.onclose = (e) => {
                clearInterval(pingInterval);
                if (!isCleanup) {
                    console.log(`Notification WS closed (code ${e.code}). Reconnecting in 5s...`);
                    // Якщо код 4001 або звичайний обрив — через 5 секунд connectNotifyWS знову зробить refresh токена
                    reconnectTimer.current = setTimeout(connectNotifyWS, 5000);
                }
            };

            socket.current.onerror = (err) => {
                console.error("Notification WS Error:", err);
                socket.current?.close();
            };
        };

        connectNotifyWS();

        return () => {
            isCleanup = true;
            clearInterval(pingInterval);
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            if (socket.current) {
                socket.current.onclose = null; // Прибираємо рекурсію
                socket.current.close();
                socket.current = null;
            }
        };
    }, [addNotification]);


    /* ================= UI LOGIC ================= */
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showFinanceMenu, setShowFinanceMenu] = useState(false);
    const [showFinanceMenuMobile, setShowFinanceMenuMobile] = useState(false);
    const [showProfileMenuMobile, setShowProfileMenuMobile] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const profileRef = useRef();
    const financeRef = useRef();
    const mobileMenuRef = useRef();

    const toggleFinanceMenu = () => { setShowFinanceMenu(prev => !prev); setProfileOpen(false); };
    const toggleFinanceMenuMobile = () => { setShowFinanceMenuMobile(prev => !prev); setShowProfileMenuMobile(false); };
    const toggleProfileMenuMobile = () => { setShowProfileMenuMobile(prev => !prev); setShowFinanceMenuMobile(false); };

    useEffect(() => {
        setShowFinanceMenu(false); setShowFinanceMenuMobile(false); setMobileMenuOpen(false); setProfileOpen(false); setShowProfileMenuMobile(false);
    }, [location]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (financeRef.current && !financeRef.current.contains(event.target)) setShowFinanceMenu(false);
            if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setMobileMenuOpen(false); setShowFinanceMenuMobile(false); setShowProfileMenuMobile(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const navLinks = NAV_LINKS.map((link) => (
        <li key={link.to} className={`${location.pathname.startsWith(link.to) ? "active" : ""} ${link.className || ""}`}>
            <Link to={link.to} className="menu-link">
                <span className={`icon ${link.icon}`}></span>
                <span>{link.title}</span>
            </Link>
        </li>
    ));

    return (
        <header className="portal-header ">
            <div className="flex items-center">
                <Link to={"/dashboard"}><img src="/header_logo.svg" alt="Логотип" className="height-logo" /></Link>
            </div>

            {!isMobile ? (
                <nav className="menu z-1000" ref={financeRef}>
                    <ul>
                        {navLinks}
                        <li>
                            <button className="menu-link" onClick={toggleFinanceMenu}><i className="icon icon-coin-dollar"></i>Фінанси ▾</button>
                            {showFinanceMenu && (
                                <ul className="submenu">
                                    {FINANCE_SUBMENU.map(item => (
                                        <li key={item.to}><Link to={item.to} className="menu-link" onClick={() => setShowFinanceMenu(false)}>{item.title}</Link></li>
                                    ))}
                                </ul>
                            )}
                        </li>
                        <li ref={profileRef}>
                            <button className="menu-link dealer-profile-link" onClick={() => { setProfileOpen(prev => !prev); setShowFinanceMenu(false); }}><HeaderDealerProfile /></button>
                            {profileOpen && (
                                <ul className="submenu">
                                    <li><Link to="/change-password" password className="menu-link" onClick={() => setProfileOpen(false)}>Змінити пароль</Link></li>
                                    <li><Link to="/emergency-contacts" className="menu-link menu-link--sos" onClick={() => setProfileOpen(false)}>Гаряча лінія</Link></li>
                                </ul>
                            )}
                        </li>
                        <li className="theme-toggle-item">
                            <div className="theme-toggle-btn">
                                <div className="menu-link notification-link" onClick={() => setIsNotificationOpen(true)} style={{ cursor: 'pointer', position: 'relative' }}>
                                    <i className="fa fa-bell material-icons" style={{ color: theme === "light" ? "#f4ffaf" : "#ffc107", fontSize: '18px', fontStyle: 'normal' }}></i>
                                    {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                                </div>
                            </div>
                        </li>
                        <li className="theme-toggle-item">
                            <button className="theme-toggle-btn" onClick={toggleTheme} title="Перемкнути тему">
                                <i className="material-icons" style={{ color: theme === "light" ? "#f4ffaf" : "#ffc107", fontSize: '20px', fontStyle: 'normal' }}>{theme === "light" ? "brightness_3" : "wb_sunny"}</i>
                            </button>
                        </li>
                        <li className="logout-item">
                            <button className="menu-link logout-icon" onClick={() => { logout(); navigate("/home"); }} title="Вийти"><i className="fa fa-sign-out-alt"></i></button>
                        </li>
                    </ul>
                </nav>
            ) : (
                <div className="mobile-menu" ref={mobileMenuRef}>
                    <button onClick={() => setMobileMenuOpen(prev => !prev)} className="menu-toggle">☰</button>
                    {mobileMenuOpen && (
                        <div className="mobile-menu-content">
                            <ul>
                                {navLinks}
                                <li><div className="menu-link" onClick={toggleFinanceMenuMobile}>Фінанси ▾</div>
                                    {showFinanceMenuMobile && (
                                        <div className="submenu-wrapper">
                                            <ul className="submenu">{FINANCE_SUBMENU.map(item => (<li key={item.to}><Link to={item.to} className="menu-link" onClick={() => setMobileMenuOpen(false)}>{item.title}</Link></li>))}</ul>
                                        </div>
                                    )}
                                </li>
                                <li><div className="menu-link" onClick={toggleProfileMenuMobile}>Профіль ▾</div>
                                    {showProfileMenuMobile && (
                                        <div className="submenu-wrapper">
                                            <ul className="submenu">
                                                <li><Link to="/change-password" onClick={() => setMobileMenuOpen(false)}>Змінити пароль</Link></li>
                                                <li><Link to="/emergency-contacts" className="menu-link menu-link--sos" onClick={() => setMobileMenuOpen(false)}>Гаряча лінія</Link></li>
                                            </ul>
                                        </div>
                                    )}
                                </li>
                                <li className="theme-toggle-item">
                                    <div className="menu-link notification-link" onClick={() => setIsNotificationOpen(true)} style={{ cursor: 'pointer', position: 'relative' }}>
                                        <i className="fa fa-bell material-icons" style={{ color: theme === "light" ? "#f4ffaf" : "#ffc107", fontSize: '18px', fontStyle: 'normal' }}></i>
                                        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                                    </div>
                                </li>
                                <li className="theme-toggle-item">
                                    <button className="theme-toggle-btn" onClick={toggleTheme} title="Перемкнути тему">
                                        <i className="material-icons" style={{ color: theme === "light" ? "#f4ffaf" : "#ffc107", fontSize: '20px', fontStyle: 'normal' }}>{theme === "light" ? "brightness_3" : "wb_sunny"}</i>
                                    </button>
                                </li>
                                <li className="logout-item"><button className="menu-link logout-icon" onClick={() => { logout(); navigate("/home"); }}> <i className="fa fa-sign-out-alt"></i></button></li>
                            </ul>
                        </div>
                    )}
                </div>
            )}
            <NotificationDrawer 
                isOpen={isNotificationOpen} 
                notifications={notifications}
                setNotifications={setNotifications}
                unreadCount={unreadCount}
                setUnreadCount={setUnreadCount}
                onClose={() => setIsNotificationOpen(false)} 
            />
        </header>
    );
}