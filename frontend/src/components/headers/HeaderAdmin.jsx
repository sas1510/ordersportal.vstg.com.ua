import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useContext } from "react";
import { useMediaQuery } from "react-responsive";
import { AuthContext } from "../../context/AuthContext";
import { RoleContext } from "../../context/RoleContext";
import "./HeaderAdmin.css";
import HeaderUserProfile from "./HeaderUserProfile";




/** головні пункти меню */
const NAV_LINKS = [
  { title: "Акції WDS", to: "/promo", icon: "icon-fire", className: "highlight"  },
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
  const isMobile = useMediaQuery({ maxWidth: 1459 });
  const navigate = useNavigate();
  const location = useLocation();

  const { logout } = useContext(AuthContext);

  const [showSettings, setShowSettings] = useState(false);
  const [showFinanceMenu, setShowFinanceMenu] = useState(false);
  const [showFinanceMenuMobile, setShowFinanceMenuMobile] = useState(false);
  const [showSettingsMobile, setShowSettingsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const settingsRef = useRef();
  const financeRef = useRef();
  const mobileMenuRef = useRef();

  useEffect(() => {
    setShowSettings(false);
    setShowFinanceMenu(false);
    setShowFinanceMenuMobile(false);
    setShowSettingsMobile(false);
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
      if (financeRef.current && !financeRef.current.contains(event.target)) {
        setShowFinanceMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
        setShowFinanceMenuMobile(false);
        setShowSettingsMobile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/home");
  };

  const navLinks = NAV_LINKS.map((link) => (
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

  const toggleSettingsMenu = () => {
    setShowSettings((prev) => {
      if (!prev) setShowFinanceMenu(false);
      return !prev;
    });
    setShowFinanceMenuMobile(false);
    setShowSettingsMobile(false);
  };
  const toggleFinanceMenu = () => {
    setShowFinanceMenu((prev) => {
      if (!prev) setShowSettings(false);
      return !prev;
    });
    setShowFinanceMenuMobile(false);
    setShowSettingsMobile(false);
  };
  const toggleFinanceMenuMobile = () => {
    setShowFinanceMenuMobile((prev) => {
      if (!prev) setShowSettingsMobile(false);
      return !prev;
    });
  };
  const toggleSettingsMenuMobile = () => {
    setShowSettingsMobile((prev) => {
      if (!prev) setShowFinanceMenuMobile(false);
      return !prev;
    });
  };

  return (
    <header className="portal-header">
      <div className="flex items-center">
        <Link to={"/dashboard"}>
          <img src="/header_logo.svg" alt="Логотип" className="h-10" />
        </Link>
      </div>

      {!isMobile ? (
        <nav className="menu" ref={financeRef}>
          <ul>
            {navLinks}
            <li>
              
              {/* <i className="fa-solid fa-fire"></i> */}

              <button className="menu-link" onClick={toggleFinanceMenu}>
                <i className="icon icon-coin-dollar"></i>
                Фінанси ▾
              </button>
              {showFinanceMenu && (
                <ul className="submenu">
                  {FINANCE_SUBMENU.map((item) => (
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
              <button className="menu-link" onClick={toggleSettingsMenu}>
                Налаштування ▾
              </button>
              {showSettings && (
                <ul className="submenu">
                  {SETTINGS_SUBMENU.map((item) => (
                    <li key={item.to}>
                      <Link to={item.to} className="menu-link" onClick={() => setShowSettings(false)}>
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
            
                          <li className="dealer-size">
                          <HeaderUserProfile />
                        </li>
            

                              <li className="logout-item">
                                <button
                                  className="logout-icon "
                                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                                  title="Вийти"
                                >
                                  <i className="fa fa-sign-out-alt"></i>
                                </button>
                              </li>


          </ul>
        </nav>
      ) : (
        <div className="mobile-menu" ref={mobileMenuRef}>
          <button onClick={() => setMobileMenuOpen((prev) => !prev)} className="menu-toggle">
            ☰
          </button>
          {mobileMenuOpen && (
            <div className="mobile-menu-content">
              <ul>
                {navLinks}
                <li>
                  <button className="menu-link" onClick={toggleFinanceMenuMobile}>
                    Фінанси ▾
                  </button>
                  {showFinanceMenuMobile && (
                    <ul className="submenu">
                      {FINANCE_SUBMENU.map((item) => (
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
                  <button className="menu-link" onClick={toggleSettingsMenuMobile}>
                    Налаштування ▾
                  </button>
                  {showSettingsMobile && (
                    <ul className="submenu">
                      {SETTINGS_SUBMENU.map((item) => (
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
                  <button className="menu-link logout" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                    Вийти
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
