// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { useState, useRef, useEffect, useContext } from "react";
// import { useMediaQuery } from "react-responsive";
// import { AuthContext } from "../../context/AuthContext";
// import HeaderUserProfile from "./HeaderUserProfile";
// import "./HeaderAdmin.css";
// import { useTheme } from "../../hooks/useTheme"; // 👈 ІМПОРТ КОНТЕКСТУ ТЕМИ

// const NAV_LINKS = [
//   {
//     title: "Акції WDS",
//     to: "/promo-wds-codes",
//     icon: "icon-fire",
//     className: "highlight",
//   },
//   { title: "Прорахунки", to: "/admin-order", icon: "icon-calculator" },
//   { title: "Рекламації", to: "/admin-reclamation", icon: "icon-tools2" },
//   {
//     title: "Дозамовлення",
//     to: "/admin-additional-order",
//     icon: "icon-add-to-list",
//   },
//   { title: "Файли", to: "/files", icon: "icon-document-file-pdf" },
//   { title: "Відео", to: "/videos", icon: "icon-youtube" },
//   { title: "Статистика SOS", to: "/urgentLogs", icon: "icon-stats" },
// ];

// const FINANCE_SUBMENU = [
//   // { title: "Взаєморозрахунки", to: "/finance/settlements" },
//   { title: "Рух коштів", to: "/finance/cash-flow" },
//   { title: "Аналітика", to: "/finance/statistics" },
//   // { title: "Оплата", to: "/finance/payments" },
//   { title: "Рахунки", to: "/finance/customer-bills" },
// ];

// const SETTINGS_SUBMENU = [
//   { title: "Користувачі", to: "/users-list" },
//   { title: "Менеджер TG", to: "/manager-qr" },
// ];

// export default function HeaderAdmin() {
//   const isMobile = useMediaQuery({ query: "(max-width: 1459px)" });
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { logout } = useContext(AuthContext);

//   const [showSettings, setShowSettings] = useState(false);
//   const [showFinanceMenu, setShowFinanceMenu] = useState(false);
//   const [showSettingsMobile, setShowSettingsMobile] = useState(false);
//   const [showFinanceMenuMobile, setShowFinanceMenuMobile] = useState(false);
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

//   const headerRef = useRef();
//   const settingsRef = useRef();
//   const financeRef = useRef();
//   const { theme, toggleTheme } = useTheme();

//   const handleLogout = async () => {
//     await logout();
//     navigate("/home");
//   };

//   useEffect(() => {
//     setMobileMenuOpen(false);
//     setShowSettings(false);
//     setShowFinanceMenu(false);
//     setShowSettingsMobile(false);
//     setShowFinanceMenuMobile(false);
//   }, [location, isMobile]);

//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (headerRef.current && !headerRef.current.contains(event.target)) {
//         setMobileMenuOpen(false);
//         setShowFinanceMenu(false);
//         setShowSettings(false);
//         setShowFinanceMenuMobile(false);
//         setShowSettingsMobile(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const navLinks = NAV_LINKS.map((link) => (
//     <li
//       key={link.to}
//       className={`${location.pathname.startsWith(link.to) ? "active" : ""} ${link.className || ""}`}
//     >
//       <Link to={link.to} className="menu-link">
//         <span className={`icon ${link.icon}`}></span>
//         <span>{link.title}</span>
//       </Link>
//     </li>
//   ));

//   return (
//     <header className="portal-header" ref={headerRef}>
//       <div className="flex items-center">
//         <Link to="/dashboard">
//           <img src="/header_logo.svg" alt="Логотип" className="height-logo" />
//         </Link>
//       </div>

//       {!isMobile ? (
//         <nav className="menu" ref={financeRef}>
//           <ul>
//             {navLinks}

//             <li>
//               <button
//                 className="menu-link"
//                 onClick={() => {
//                   setShowFinanceMenu((prev) => !prev);
//                   setShowSettings(false);
//                 }}
//               >
//                 <span className="icon icon-coin-dollar"></span>
//                 Фінанси ▾
//               </button>
//               {showFinanceMenu && (
//                 <ul className="submenu">
//                   {FINANCE_SUBMENU.map((item) => (
//                     <li key={item.to}>
//                       <Link
//                         to={item.to}
//                         className="menu-link"
//                         onClick={() => setShowFinanceMenu(false)}
//                       >
//                         {item.title}
//                       </Link>
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </li>

//             <li ref={settingsRef}>
//               <button
//                 className="menu-link"
//                 onClick={() => {
//                   setShowSettings((prev) => !prev);
//                   setShowFinanceMenu(false);
//                 }}
//               >
//                 Налаштування ▾
//               </button>
//               {showSettings && (
//                 <ul className="submenu">
//                   {SETTINGS_SUBMENU.map((item) => (
//                     <li key={item.to}>
//                       <Link
//                         to={item.to}
//                         className="menu-link"
//                         onClick={() => setShowSettings(false)}
//                       >
//                         {item.title}
//                       </Link>
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </li>

//             <li className="dealer-size">
//               <Link to="/change-password" className="dealer-profile-link">
//                 <HeaderUserProfile />
//               </Link>
//             </li>
//             <li className="theme-toggle-item">
//               <button
//                 className="theme-toggle-btn"
//                 onClick={toggleTheme}
//                 title="Перемкнути тему"
//               >
//                 <i
//                   // 👈 ВИКОРИСТОВУЄМО КЛАС MATERIAL ICONS
//                   className={theme === "light" ? "fas fa-moon" : "fas fa-sun"}
//                   style={{
//                     color: theme === "light" ? "#f4ffaf" : "#ffc107",
//                     fontSize: "20px", // Material Icons часто вимагають 24px або 18px
//                     fontStyle: "normal", // Щоб уникнути курсиву від тегу <i>
//                   }}
//                 >
//                 </i>
//               </button>
//             </li>
//             <li className="logout-item">
//               <button
//                 className="menu-link logout-icon"
//                 onClick={() => {
//                   handleLogout();
//                   setMobileMenuOpen(false);
//                 }}
//                 title="Вийти"
//               >
//                 <i className="fa fa-sign-out-alt"></i>
//               </button>
//             </li>
//           </ul>
//         </nav>
//       ) : (
//         <div className="mobile-menu">
//           <button
//             className="menu-toggle"
//             onClick={() => setMobileMenuOpen((prev) => !prev)}
//           >
//             ☰
//           </button>
//           {mobileMenuOpen && (
//             <div className="mobile-menu-content">
//               <ul>
//                 {navLinks}

//                 <li>
//                   <div
//                     className="menu-link"
//                     onClick={() => {
//                       setShowFinanceMenuMobile((prev) => !prev);
//                       setShowSettingsMobile(false);
//                     }}
//                   >
//                     <span className="icon icon-coin-dollar"></span>
//                     Фінанси ▾
//                   </div>
//                   {showFinanceMenuMobile && (
//                     <ul className="submenu">
//                       {FINANCE_SUBMENU.map((item) => (
//                         <li key={item.to}>
//                           <Link
//                             to={item.to}
//                             className="menu-link"
//                             onClick={() => setMobileMenuOpen(false)}
//                           >
//                             {item.title}
//                           </Link>
//                         </li>
//                       ))}
//                     </ul>
//                   )}
//                 </li>

//                 <li>
//                   <div
//                     className="menu-link"
//                     onClick={() => {
//                       setShowSettingsMobile((prev) => !prev);
//                       setShowFinanceMenu(false);
//                     }}
//                   >
//                     Налаштування ▾
//                   </div>
//                   {showSettingsMobile && (
//                     <ul className="submenu">
//                       {SETTINGS_SUBMENU.map((item) => (
//                         <li key={item.to}>
//                           <Link
//                             to={item.to}
//                             className="menu-link"
//                             onClick={() => setMobileMenuOpen(false)}
//                           >
//                             {item.title}
//                           </Link>
//                         </li>
//                       ))}
//                     </ul>
//                   )}
//                 </li>
//                 <li className="theme-toggle-item">
//                   <button
//                     className="theme-toggle-btn"
//                     onClick={toggleTheme}
//                     title="Перемкнути тему"
//                   >
//                     <i
//                       // 👈 ВИКОРИСТОВУЄМО КЛАС MATERIAL ICONS
//                       className={theme === "light" ? "fas fa-moon" : "fas fa-sun"}
//                       style={{
//                         color: theme === "light" ? "#f4ffaf" : "#ffc107",
//                         fontSize: "20px", // Material Icons часто вимагають 24px або 18px
//                         fontStyle: "normal", // Щоб уникнути курсиву від тегу <i>
//                       }}
//                     >
                  
//                     </i>
//                   </button>
//                 </li>

//                 <li>
//                   <button className="menu-link logout" onClick={logout}>
//                     Вийти
//                   </button>
//                 </li>
//               </ul>
//             </div>
//           )}
//         </div>
//       )}
//     </header>
//   );
// }


import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useContext, useCallback } from "react";
import { useMediaQuery } from "react-responsive";
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import HeaderUserProfile from "./HeaderUserProfile";
import logo from "../../assets/icons/logo-vst.svg";
import "./HeaderAdmin.css";

const NAV_LINKS = [
  { title: "Акції WDS", to: "/promo-wds-codes" },
  { title: "Замовлення", to: "/admin-order" },
  { title: "Рекламації", to: "/admin-reclamation" },
  { title: "Дозамовлення", to: "/admin-additional-order" },
  { title: "Файли", to: "/files" },
  { title: "Відео", to: "/videos" },

];

const FINANCE_SUBMENU = [
  { title: "Рух коштів", to: "/finance/cash-flow" },
  { title: "Аналітика", to: "/finance/statistics" },
  { title: "Рахунки", to: "/finance/customer-bills" },
];

const SETTINGS_SUBMENU = [
  { title: "Користувачі", to: "/users-list" },
  { title: "Менеджер TG", to: "/manager-qr" },
  { title: "Статистика SOS", to: "/urgentLogs" },
];

export default function HeaderAdmin() {
  // Для адмінки ліміт трохи більший, бо пунктів меню багато
  const isMobile = useMediaQuery({ maxWidth: 1460 }); 
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();

  // --- UI СТАН ---
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFinanceMenu, setShowFinanceMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const financeRef = useRef(null);
  const settingsRef = useRef(null);
  const profileRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const exitIcon = "/assets/icons/exit-icon.png";
  const closeIcon = "/assets/icons/CloseButton.png";
  const profileIcon = "/assets/icons/ProfileIconSubMenu.png";
  const polygonIcon = "/assets/icons/PolygonOpenProfileSubmenu.png";

  // Обробка кліку зовні для закриття всіх меню
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (financeRef.current && !financeRef.current.contains(event.target)) {
        setShowFinanceMenu(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Блокування скролу при відкритому мобільному меню
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [mobileMenuOpen]);

  // Закриття всього при зміні сторінки
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowFinanceMenu(false);
    setShowSettings(false);
    setProfileOpen(false);
  }, [location]);

  const handleLogoutAction = () => {
    logout();
    navigate("/home");
  };

  return (
    <header className="w-full flex flex-col items-center bg-transparent z-50 font-['Inter']">
      {/* 1. Декоративна смуга (як у дилера) */}
      <div className="w-full max-w-[1334px] h-2 md:h-[12px] bg-[#B4D947] rounded-t-sm" />

      {/* 2. Основна панель */}
      <div className="w-full max-w-[1334px] h-12 md:h-[70px] bg-white flex items-center shadow-sm relative rounded-bl-[25px] rounded-br-[25px]">
        
        {/* Логотип */}
        <Link to="/dashboard" className="ml-[33px] flex-shrink-0 mr-4">
          <img src={logo} alt="Вікна Стиль" className="h-[35px] w-auto" />
        </Link>

        {!isMobile ? (
          <>
            {/* Навігація Desktop */}
            <nav className="flex h-full flex-grow">
              <ul className="flex h-full w-full items-center">
                {NAV_LINKS.map((link) => (
                  <li key={link.to} className="h-full flex-1">
                    <Link
                      to={link.to}
                      className={`h-full flex items-center justify-center px-1 text-[13px] font-bold transition-all text-center ${
                        location.pathname.startsWith(link.to) 
                          ? "bg-[#6B98BF] text-white" 
                          : "text-[#44403E] hover:bg-gray-50 hover:text-[#6B98BF]"
                      }`}
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
                
                {/* Фінанси */}
                <li className="h-full relative flex-1" ref={financeRef}>
                  <button 
                    onClick={() => { setShowFinanceMenu(!showFinanceMenu); setShowSettings(false); }}
                    className={`w-full h-full px-2 text-[13px] font-bold flex items-center justify-center gap-1 transition-colors ${
                      showFinanceMenu || location.pathname.includes("/finance")
                        ? "text-[#6B98BF] bg-gray-50"
                        : "text-[#44403E] hover:bg-gray-50"
                    }`}
                  >
                    Фінанси ▾
                  </button>
                  {showFinanceMenu && (
                    <ul className="absolute top-full left-0 w-48 bg-white shadow-xl border-t border-gray-100 py-2 z-[1001]">
                      {FINANCE_SUBMENU.map((item) => (
                        <li key={item.to}>
                          <Link
                            to={item.to}
                            className="block px-4 py-3 text-[14px] font-medium text-[#44403E] hover:bg-[#6B98BF] hover:text-white transition-colors"
                          >
                            {item.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>

                {/* Налаштування */}
                <li className="h-full relative flex-1" ref={settingsRef}>
                  <button 
                    onClick={() => { setShowSettings(!showSettings); setShowFinanceMenu(false); }}
                    className={`w-full h-full px-2 text-[13px] font-bold flex items-center justify-center gap-1 transition-colors ${
                      showSettings ? "text-[#6B98BF] bg-gray-50" : "text-[#44403E] hover:bg-gray-50"
                    }`}
                  >
                    Налашт. ▾
                  </button>
                  {showSettings && (
                    <ul className="absolute top-full left-0 w-48 bg-white shadow-xl border-t border-gray-100 py-2 z-[1001]">
                      {SETTINGS_SUBMENU.map((item) => (
                        <li key={item.to}>
                          <Link
                            to={item.to}
                            className="block px-4 py-3 text-[14px] font-medium text-[#44403E] hover:bg-[#6B98BF] hover:text-white transition-colors"
                          >
                            {item.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              </ul>
            </nav>

            {/* Правий блок: Профіль, Тема, Вихід */}
            <div className="ml-auto flex items-center h-full flex-shrink-0">
              <div 
                className="bg-[#EEEEEE] h-full flex flex-col justify-center border-l border-r border-gray-200 relative min-w-[180px]"
                ref={profileRef}
              >
                <button
                  className="h-full w-full focus:outline-none transition-colors hover:bg-gray-200"
                  onClick={() => setProfileOpen(!profileOpen)}
                >
                  <HeaderUserProfile />
                </button>

                {profileOpen && (
                  <ul className="absolute top-full w-full right-0 bg-white shadow-xl border-t border-gray-100 py-2 z-[1001]">
                    <li>
                      <Link
                        to="/change-password"
                        className="block px-4 py-3 text-[14px] font-medium text-[#44403E] hover:bg-[#6B98BF] hover:text-white transition-colors"
                      >
                        Змінити пароль
                      </Link>
                    </li>
                  </ul>
                )}
              </div>

              <div className="flex items-center px-6 gap-6">
                <button onClick={toggleTheme} className="text-[#44403E] text-lg hover:scale-110 transition-transform">
                  <i className={theme === "light" ? "fas fa-moon" : "fas fa-sun"}></i>
                </button>

                <button onClick={handleLogoutAction} className="hover:opacity-70 transition-opacity">
                  <img src={exitIcon} alt="Вихід" className="w-[20px] h-[20px] object-contain" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* МОБІЛЬНЕ МЕНЮ (Бургер) */
          <div className="ml-auto flex items-center gap-5 mr-4">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="text-[#44403E] text-2xl focus:outline-none"
            >
              ☰
            </button>
            
            {mobileMenuOpen && (
              <div className="fixed inset-0 bg-black/40 z-[2000]">
                <div 
                  ref={mobileMenuRef}
                  className="absolute top-0 right-0 w-[85%] max-w-[350px] h-full bg-white rounded-tl-[20px] rounded-bl-[20px] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden"
                >
                  {/* Кнопка закриття */}
                  <div className="flex items-center justify-end p-2">
                    <button onClick={() => setMobileMenuOpen(false)}>
                      <img src={closeIcon} alt="Закрити" className="w-[30px] h-[30px]" />
                    </button>
                  </div>

                  {/* Скрол-зоні меню */}
                  <div className="flex-grow overflow-y-auto w-full">
                    <nav className="flex flex-col w-full">
                      {NAV_LINKS.map((link) => (
                        <div key={link.to} className="relative w-full">
                          <Link
                            to={link.to}
                            className={`flex items-center w-full py-4 px-[15%] text-xl font-bold transition-colors ${
                              location.pathname === link.to ? "bg-[#6B98BF] text-white" : "text-[#44403E]"
                            }`}
                          >
                            {link.title}
                          </Link>
                          <div className="absolute bottom-0 left-[5%] right-[5%] border-t border-dashed border-[#B4D947]" />
                        </div>
                      ))}

                      {/* Фінанси (Моб) */}
                      <div className="relative flex flex-col w-full">
                        <button 
                          onClick={() => setShowFinanceMenu(!showFinanceMenu)}
                          className="w-full py-4 px-[15%] flex items-center justify-between text-[#44403E]"
                        >
                          <span className="text-xl font-bold">Фінанси</span>
                          <span className={`transition-transform ${showFinanceMenu ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                        {showFinanceMenu && (
                          <div className="bg-[#F9FFE6]/50 mx-[5%] rounded-lg mb-2">
                            {FINANCE_SUBMENU.map((sub) => (
                              <Link key={sub.to} to={sub.to} className="block py-3 px-[10%] text-lg font-semibold text-[#44403E] border-b border-dashed border-gray-200 last:border-0">
                                {sub.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Налаштування (Моб) */}
                      <div className="relative max-w-[319px] left-[5%] right-[5%] flex flex-col w-full border-t border-dashed border-[#B4D947]">
                        <button 
                          onClick={() => setShowSettings(!showSettings)}
                          className="w-full py-4 px-[12%] flex items-center justify-between text-[#44403E]"
                        >
                          <span className="text-xl font-bold">Налаштування</span>
                          <span className={`transition-transform ${showSettings ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                        {showSettings && (
                          <div className="bg-[#F9FFE6]/50 mx-[5%] rounded-lg mb-2">
                            {SETTINGS_SUBMENU.map((sub) => (
                              <Link key={sub.to} to={sub.to} className="block py-3 px-[10%] text-lg font-semibold text-[#44403E] border-b border-dashed border-gray-200 last:border-0">
                                {sub.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </nav>

                    {/* Блок профілю в мобільному меню */}
                    <div className="bg-[#EEEEEE] mt-4 w-full">
                      <button 
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex items-center px-[15%] gap-4 py-4 w-full"
                      >
                        <img className="w-6 h-6 object-contain" src={profileIcon} alt="profile" />
                        <span className="text-[#234461] text-xl font-bold flex-grow text-left">Профіль</span>
                        <img className={`w-4 transition-transform ${profileOpen ? 'rotate-180' : ''}`} src={polygonIcon} alt="poly" />
                      </button>
                      {profileOpen && (
                        <div className="px-[15%] pb-4 flex flex-col gap-2">
                          <Link to="/change-password" title="password-change" className="text-[#44403E] text-lg font-medium">Змінити пароль</Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Кнопка виходу (Моб) */}
                  <div className="bg-white p-8">
                    <button 
                      onClick={handleLogoutAction}
                      className="flex items-center justify-center gap-3 w-full py-3 border-t border-dashed border-gray-300"
                    >
                      <img className="w-7 h-6" src={exitIcon} alt="exit" />
                      <span className="text-[#44403E] text-xl font-bold">Вихід</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}