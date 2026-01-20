import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useContext } from "react";
import { useMediaQuery } from "react-responsive";
import { AuthContext } from "../../context/AuthContext";
import { RoleContext } from "../../context/RoleContext";
import { useTheme } from "../../context/ThemeContext"; // 👈 ІМПОРТ КОНТЕКСТУ ТЕМИ
import "./HeaderAdmin.css"; 
import HeaderDealerProfile from "./HeaderDealerProfile";


const NAV_LINKS = [
  { title: "Акції WDS", to: "/promo-wds-codes", icon: "icon-fire", className: "highlight"  },
  { title: "Замовлення", to: "/orders", icon: "icon-calculator" },
  { title: "Рекламації", to: "/complaints", icon: "icon-tools2" },
  { title: "Дозамовлення", to: "/additional-orders", icon: "icon-add-to-list" },

  { title: "Файли", to: "/files", icon: "icon-document-file-pdf" },
  { title: "Відео", to: "/videos", icon: "icon-youtube" },
  { title: "SOS", to: "/emergency-contacts", icon: "icon-stats" },
];

const FINANCE_SUBMENU = [
  { title: "Рух коштів", to: "/finance/paymentMovement" },
  { title: "Аналітика", to: "/finance/analytics" },
  { title: "Оплата", to: "/finance/payment" },
  { title: "Рахунки", to: "/finance/customer-bills" },
];

export default function HeaderDealer() {
  const isMobile = useMediaQuery({ maxWidth: 1459 });
  const navigate = useNavigate();
  const location = useLocation();

  const { logout } = useContext(AuthContext);
  const { role } = useContext(RoleContext);
  // 👈 Отримуємо тему та toggleTheme
  const { theme, toggleTheme } = useTheme(); 

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFinanceMenu, setShowFinanceMenu] = useState(false);
  const [showFinanceMenuMobile, setShowFinanceMenuMobile] = useState(false);

  const [showProfileMenuMobile, setShowProfileMenuMobile] = useState(false);


  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef();

  const financeRef = useRef();
  const mobileMenuRef = useRef();
  const toggleProfileMenuMobile = () => {
    setShowProfileMenuMobile(prev => !prev);
    setShowFinanceMenuMobile(false); 
    };


  useEffect(() => {
    setShowFinanceMenu(false);
    setShowFinanceMenuMobile(false);
    setMobileMenuOpen(false);
    setProfileOpen(false);
    setShowProfileMenuMobile(false);
  }, [location]);

  useEffect(() => {
  function handleClickOutside(event) {
    if (financeRef.current && !financeRef.current.contains(event.target)) {
      setShowFinanceMenu(false);
    }

    if (profileRef.current && !profileRef.current.contains(event.target)) {
      setProfileOpen(false);
    }

    if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
      setMobileMenuOpen(false);
      setShowFinanceMenuMobile(false);
      setShowProfileMenuMobile(false);
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
    <li key={link.to} className={`${location.pathname.startsWith(link.to) ? "active" : ""} ${link.className || ""}`}>
      <Link to={link.to} className="menu-link">
        <span className={`icon ${link.icon}`}></span>
        <span>{link.title}</span>
      </Link>
    </li>
  ));

  const toggleFinanceMenu = () => {
    setShowFinanceMenu(prev => !prev);
    setProfileOpen(false); 
    };

  const toggleFinanceMenuMobile = () => {
    setShowFinanceMenuMobile(prev => !prev);
    setShowProfileMenuMobile(false); // 👈 ЗАКРИВАЄМО ПРОФІЛЬ
    };


  return (
    <header className="portal-header ">
      <div className="flex items-center">
        <Link to={"/dashboard"}>
          <img src="/header_logo.svg" alt="Логотип" className="height-logo" />
        </Link>
      </div>

      {!isMobile ? (
        <nav className="menu z-1000"  ref={financeRef}>
          <ul>
            {navLinks}
            

            <li>
              <button className="menu-link" onClick={toggleFinanceMenu}>
                <i className="icon icon-coin-dollar"></i>
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

                        <li ref={profileRef}>
  <button
    className="menu-link dealer-profile-link"
    onClick={() => {
        setProfileOpen(prev => !prev);
        setShowFinanceMenu(false); // 👈 ЗАКРИВАЄМО ФІНАНСИ
    }}

  >
    <HeaderDealerProfile />

  </button>

  {profileOpen && (
    <ul className="submenu">
      <li>
        <Link
          to="/change-password"
          className="menu-link"
          onClick={() => setProfileOpen(false)}
        >
           Змінити пароль
        </Link>
      </li>

      <li>
        <Link
          to="/edit-addresses"
          className="menu-link"
          onClick={() => setProfileOpen(false)}
        >
           Адреси доставки
        </Link>
      </li>
    </ul>
  )}
</li>

            {/* 👈 КНОПКА ТЕМИ (DESKTOP) */}
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
        <div className="mobile-menu" ref={mobileMenuRef}>
    {/* Кнопка бургер-меню */}
    <button
      onClick={() => setMobileMenuOpen(prev => !prev)}
      className="menu-toggle"
    >
      ☰
    </button>

    {/* Вміст меню */}
    {mobileMenuOpen && (
      <div className="mobile-menu-content">
        <ul>
          {navLinks}

          {/* Фінанси */}
          <li>
          <div className="menu-link" onClick={toggleFinanceMenuMobile}>
            Фінанси ▾
          </div>
          {showFinanceMenuMobile && (
            <div className="submenu-wrapper">
              <ul className="submenu">
                {FINANCE_SUBMENU.map(item => (
                  <li key={item.to}>
                    <Link to={item.to} className="menu-link" onClick={() => setMobileMenuOpen(false)}>
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>

{/* ПРОФІЛЬ — як Фінанси */}
<li>
  <div className="menu-link" onClick={toggleProfileMenuMobile}>
    Профіль ▾
  </div>

  {showProfileMenuMobile && (
    <div className="submenu-wrapper">
      <ul className="submenu">
        <li>
          <Link
            to="/change-password"
            className="menu-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Змінити пароль
          </Link>
        </li>

        <li>
          <Link
            to="/edit-addresses"
            className="menu-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Адреси доставки
          </Link>
        </li>
      </ul>
    </div>
  )}
</li>


            {/* 👈 КНОПКА ТЕМИ (MOBILE) */}
       
         

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
          {/* Кнопка Вихід */}
          <li className="logout-item">
            <button
              className="menu-link logout-icon"
              onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
              title="Вийти"
            >
              <i className="fa fa-sign-out-alt"></i>
                <span>Вихід</span>
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