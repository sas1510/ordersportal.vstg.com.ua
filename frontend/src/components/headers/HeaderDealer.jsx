import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useContext } from "react";
import { useMediaQuery } from "react-responsive";
import { AuthContext } from "../../context/AuthContext";
import { RoleContext } from "../../context/RoleContext";
import "./HeaderAdmin.css"; // Використовуємо ті ж стилі
import HeaderDealerProfile from "./HeaderDealerProfile";


const NAV_LINKS = [
  { title: "Акції WDS", to: "/promo", icon: "icon-fire", className: "highlight"  },
  { title: "Замовлення", to: "/orders", icon: "icon-calculator" },
  { title: "Рекламації", to: "/complaints", icon: "icon-tools2" },
  { title: "Дозамовлення", to: "/additional-orders", icon: "icon-add-to-list" },

  { title: "Файли", to: "/files", icon: "icon-document-file-pdf" },
  { title: "Відео", to: "/videos", icon: "icon-youtube" },
  { title: "Статистика SOS", to: "/emergency-contacts", icon: "icon-stats" },
];

const FINANCE_SUBMENU = [
  { title: "Взаєморозрахунки", to: "/finance/settlements" },
  { title: "Рух коштів", to: "/finance/money-flow" },
  { title: "Аналітика", to: "/finance/analytics" },
  { title: "Оплата", to: "/finance/payments" },
  { title: "Акція WDS", to: "/promo" },
  { title: "Рахунки", to: "/finance/bills" },
];

export default function HeaderDealer() {
  const isMobile = useMediaQuery({ maxWidth: 1459 });
  const navigate = useNavigate();
  const location = useLocation();

  const { logout } = useContext(AuthContext);
  const { role } = useContext(RoleContext);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFinanceMenu, setShowFinanceMenu] = useState(false);
  const [showFinanceMenuMobile, setShowFinanceMenuMobile] = useState(false);

  const financeRef = useRef();
  const mobileMenuRef = useRef();

  useEffect(() => {
    setShowFinanceMenu(false);
    setShowFinanceMenuMobile(false);
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (financeRef.current && !financeRef.current.contains(event.target)) {
        setShowFinanceMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
        setShowFinanceMenuMobile(false);
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

  const toggleFinanceMenu = () => setShowFinanceMenu(prev => !prev);
  const toggleFinanceMenuMobile = () => setShowFinanceMenuMobile(prev => !prev);

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

            {/* Профіль дилера */}
       

            <li className="dealer-size">
              <HeaderDealerProfile />
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
          <button onClick={() => setMobileMenuOpen(prev => !prev)} className="menu-toggle">☰</button>
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
            </div>
          )}
        </div>
      )}
    </header>
  );
}
