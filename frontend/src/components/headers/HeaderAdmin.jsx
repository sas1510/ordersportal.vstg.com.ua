import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useContext } from "react";
import { useMediaQuery } from "react-responsive";
import { AuthContext } from "../../context/AuthContext";
import HeaderUserProfile from "./HeaderUserProfile";
import "./HeaderAdmin.css";

/** головні пункти меню */
const NAV_LINKS = [
  { title: "Акції WDS", to: "/promo", icon: "icon-fire", className: "highlight" },
  { title: "Прорахунки", to: "/orders", icon: "icon-calculator" },
  { title: "Рекламації", to: "/complaints", icon: "icon-tools2" },
  { title: "Дозамовлення", to: "/additional-orders", icon: "icon-add-to-list" },
  { title: "Статус", to: "/orders-fin", icon: "icon-file-text" },
  { title: "Файли", to: "/files", icon: "icon-document-file-pdf" },
  { title: "Відео", to: "/videos", icon: "icon-youtube" },
  { title: "Статистика SOS", to: "/urgentLogs", icon: "icon-stats" },
];

/** підменю Фінанси */
const FINANCE_SUBMENU = [
  { title: "Взаєморозрахунки", to: "/finance/settlements" },
  { title: "Рух коштів", to: "/finance/money-flow" },
  { title: "Аналітика", to: "/finance/analytics" },
  { title: "Оплата", to: "/finance/payments" },
  { title: "Акція WDS", to: "/promo" },
  { title: "Рахунки", to: "/finance/bills" },
];

/** підменю Налаштування */
const SETTINGS_SUBMENU = [
  { title: "Організації", to: "/organizations" },
  { title: "Регіони", to: "/regions" },
  { title: "Користувачі", to: "/users" },
  { title: "Контакти", to: "/contacts" },
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

  
  const handleLogout = async () => {
    await logout();
    navigate("/home");
  };


  // закриття всіх меню при переході сторінки або зміни розміру
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowSettings(false);
    setShowFinanceMenu(false);
    setShowSettingsMobile(false);
    setShowFinanceMenuMobile(false);
  }, [location, isMobile]);

  // закриття при кліку поза меню
  useEffect(() => {
    function handleClickOutside(event) {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        // закриваємо ВСІ меню
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
    <li key={link.to} className={`${location.pathname.startsWith(link.to) ? "active" : ""} ${link.className || ""}`}>
      <Link to={link.to} className="menu-link">{link.title}</Link>
    </li>
  ));

  return (
    <header className="portal-header" ref={headerRef}>
      <div className="flex items-center">
        <Link to="/dashboard">
          <img src="/header_logo.svg" alt="Логотип" className="h-10" />
        </Link>
      </div>

      {!isMobile ? (
        <nav className="menu" ref={financeRef}>
          <ul>
            {navLinks}

            <li>
              <button className="menu-link" onClick={() => { setShowFinanceMenu(prev => !prev); setShowSettings(false); }}>
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
              <button className="menu-link" onClick={() => { setShowSettings(prev => !prev); setShowFinanceMenu(false); }}>
                Налаштування ▾
              </button>
              {showSettings && (
                <ul className="submenu" style={{ display: showFinanceMenu ? "flex" : "none" }}>

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

            <li className="dealer-size"><HeaderUserProfile /></li>
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
                  <div className="menu-link" onClick={() => { setShowSettingsMobile(prev => !prev); setShowFinanceMenuMobile(false); }}>
                    Налаштування ▾
                  </div>
                  {showSettingsMobile && (
                    <ul className="submenu" style={{ display: showFinanceMenu ? "flex" : "none" }}>

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
