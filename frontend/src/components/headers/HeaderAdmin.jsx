import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useContext } from "react";
import { useMediaQuery } from "react-responsive";
import { AuthContext } from "../../context/AuthContext";
import HeaderUserProfile from "./HeaderUserProfile";
import "./HeaderAdmin.css";
import { useTheme } from "../../context/ThemeContext"; // 👈 ІМПОРТ КОНТЕКСТУ ТЕМИ


const NAV_LINKS = [
  { title: "Акції WDS", to: "/promo-wds-codes", icon: "icon-fire", className: "highlight" },
  { title: "Прорахунки", to: "/admin-order", icon: "icon-calculator" },
  { title: "Рекламації", to: "/admin-reclamation", icon: "icon-tools2" },
  { title: "Дозамовлення", to: "/admin-additional-order", icon: "icon-add-to-list" },
  { title: "Файли", to: "/files", icon: "icon-document-file-pdf" },
  { title: "Відео", to: "/videos", icon: "icon-youtube" },
  { title: "Статистика SOS", to: "/urgentLogs", icon: "icon-stats" },
];



const FINANCE_SUBMENU = [
  // { title: "Взаєморозрахунки", to: "/finance/settlements" },
  { title: "Рух коштів", to: "/finance/cash-flow" },
  { title: "Аналітика", to: "/finance/statistics" },
  // { title: "Оплата", to: "/finance/payments" },
  { title: "Рахунки", to: "/finance/customer-bills" },
];


const SETTINGS_SUBMENU = [

  { title: "Користувачі", to: "/users-list" },

];

export default function HeaderAdmin() {
  const isMobile = useMediaQuery({ query: "(max-width: 1459px)" });
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const [showSettings, setShowSettings] = useState(false);
  const [showFinanceMenu, setShowFinanceMenu] = useState(false);
  const [showSettingsMobile, setShowSettingsMobile] = useState(false);
  const [showFinanceMenuMobile, setShowFinanceMenuMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const headerRef = useRef();
  const settingsRef = useRef();
  const financeRef = useRef();
  const { theme, toggleTheme } = useTheme(); 

  
  const handleLogout = async () => {
    await logout();
    navigate("/home");
  };



  useEffect(() => {
    setMobileMenuOpen(false);
    setShowSettings(false);
    setShowFinanceMenu(false);
    setShowSettingsMobile(false);
    setShowFinanceMenuMobile(false);
  }, [location, isMobile]);


  useEffect(() => {
    function handleClickOutside(event) {
      if (headerRef.current && !headerRef.current.contains(event.target)) {

        setMobileMenuOpen(false);
        setShowFinanceMenu(false);
        setShowSettings(false);
        setShowFinanceMenuMobile(false);
        setShowSettingsMobile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  


  const navLinks = NAV_LINKS.map(link => (
    <li
      key={link.to}
      className={`${location.pathname.startsWith(link.to) ? "active" : ""} ${link.className || ""}`}
    >
      <Link to={link.to} className="menu-link">
        <span className={`icon ${link.icon}`}></span>
        <span>{link.title}</span>
      </Link>
    </li>
  ));


  return (
    <header className="portal-header" ref={headerRef}>
      <div className="flex items-center">
        <Link to="/dashboard">
          <img src="/header_logo.svg" alt="Логотип" className="height-logo" />
        </Link>
      </div>

      {!isMobile ? (
        <nav className="menu" ref={financeRef}>
          <ul>
            {navLinks}

            <li>
              <button className="menu-link" onClick={() => { setShowFinanceMenu(prev => !prev); setShowSettings(false); }}>
                 <span className="icon icon-coin-dollar"></span>
                Фінанси ▾
              </button>
              {showFinanceMenu && (
                <ul className="submenu">
                  {FINANCE_SUBMENU.map(item => (
                    <li key={item.to}>
                      <Link to={item.to} className="menu-link" onClick={() => setShowFinanceMenu(false)}>
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>

            <li ref={settingsRef}>
              <button className="menu-link" onClick={() => { setShowSettings(prev => !prev); setShowFinanceMenu(false);}}>
                Налаштування ▾
              </button>
              {showSettings && (
                <ul className="submenu" >

                  {SETTINGS_SUBMENU.map(item => (
                    <li key={item.to}>
                      <Link to={item.to} className="menu-link" onClick={() => setShowSettings(false)}>
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
  

            <li className="dealer-size"><Link to="/change-password" className="dealer-profile-link"><HeaderUserProfile /></Link></li>
                      <li className="theme-toggle-item">
              <button 
                  className="theme-toggle-btn" 
                  onClick={toggleTheme} 
                  title="Перемкнути тему"
              >
                  <i 
                      // 👈 ВИКОРИСТОВУЄМО КЛАС MATERIAL ICONS
                      className="material-icons" 
                      style={{ 
                          color: theme === "light" ? "#f4ffaf" : "#ffc107",
                          fontSize: '20px', // Material Icons часто вимагають 24px або 18px
                          fontStyle: 'normal' // Щоб уникнути курсиву від тегу <i>
                      }}
                  >
                      {/* Динамічний текст іконки Material Icons */}
                      {theme === "light" ? "brightness_3" : "wb_sunny"} 
                  </i>

              </button>
          </li>
            <li className="logout-item">
                <button
                  className="menu-link logout-icon"
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  title="Вийти"
                >
                  <i className="fa fa-sign-out-alt"></i>

                </button>
              </li>
          </ul>
        </nav>
      ) : (
        <div className="mobile-menu">
          <button className="menu-toggle" onClick={() => setMobileMenuOpen(prev => !prev)}>☰</button>
          {mobileMenuOpen && (
            <div className="mobile-menu-content">
              <ul>
                {navLinks}

                <li>
                  <div className="menu-link" onClick={() => { setShowFinanceMenuMobile(prev => !prev); setShowSettingsMobile(false); }}>
                     <span className="icon icon-coin-dollar"></span>
                    Фінанси ▾
                  </div>
                  {showFinanceMenuMobile && (
                    <ul className="submenu">
                      {FINANCE_SUBMENU.map(item => (
                        <li key={item.to}>
                          <Link to={item.to} className="menu-link" onClick={() => setMobileMenuOpen(false)}>
                            {item.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>

                <li>
                  <div className="menu-link" onClick={() => { setShowSettingsMobile(prev => !prev); setShowFinanceMenu(false);}}>
                    Налаштування ▾
                  </div>
                  {showSettingsMobile && (
                    <ul className="submenu">

                      {SETTINGS_SUBMENU.map(item => (
                        <li key={item.to}>
                          <Link to={item.to} className="menu-link" onClick={() => setMobileMenuOpen(false)}>
                            {item.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
                  <li className="theme-toggle-item">
                    <button 
                        className="theme-toggle-btn" 
                        onClick={toggleTheme} 
                        title="Перемкнути тему"
                    >
                        <i 
                            // 👈 ВИКОРИСТОВУЄМО КЛАС MATERIAL ICONS
                            className="material-icons" 
                            style={{ 
                                color: theme === "light" ? "#f4ffaf" : "#ffc107",
                                fontSize: '20px', // Material Icons часто вимагають 24px або 18px
                                fontStyle: 'normal' // Щоб уникнути курсиву від тегу <i>
                            }}
                        >
                            {/* Динамічний текст іконки Material Icons */}
                            {theme === "light" ? "brightness_3" : "wb_sunny"} 
                        </i>

                    </button>
                </li>

                <li>
                  <button className="menu-link logout" onClick={logout}>Вийти</button>
                </li>
              </ul>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
