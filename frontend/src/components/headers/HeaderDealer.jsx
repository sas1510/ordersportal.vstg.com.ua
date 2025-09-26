import { Link } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { AuthContext } from "../../context/AuthContext"; // імпорт AuthContext
import { RoleContext } from "../../context/RoleContext";

export default function HeaderDealer() {
  const isMobile = useMediaQuery({ maxWidth: 1459 });
  const navigate = useNavigate();

  const { logout } = useContext(AuthContext); // отримуємо logout
  const { role, setRole } = useContext(RoleContext); // роль користувача

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFinanceMenu, setShowFinanceMenu] = useState(false);
  const [showFinanceMenuMobile, setShowFinanceMenuMobile] = useState(false);

  const menuRef = useRef();
  const financeRef = useRef();

  const handleLogout = async () => {
    await logout();  // викликаємо logout з AuthContext
    navigate("/home");
  };

  // Закриття меню при кліку поза межами
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
        setShowFinanceMenuMobile(false);
      }
      if (financeRef.current && !financeRef.current.contains(event.target)) {
        setShowFinanceMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  
  // Закрити підменю при відкритті іншого
  const toggleFinanceMenu = () => {
    setShowFinanceMenu((prev) => {
      if (!prev) setShowFinanceMenuMobile(false);
      return !prev;
    });
  };

  const toggleFinanceMenuMobile = () => {
    setShowFinanceMenuMobile((prev) => {
      if (!prev) setShowFinanceMenu(false);
      return !prev;
    });
  };

  const navLinks = (
    <>
      <Link to="/promo" className="hover:text-blue-500" onClick={() => setMobileMenuOpen(false)}>Акція WDS</Link>
      <Link to="/orders" className="hover:text-blue-500" onClick={() => setMobileMenuOpen(false)}>Замовлення</Link>
      <Link to="/complaints" className="hover:text-blue-500" onClick={() => setMobileMenuOpen(false)}>Рекламації</Link>
      <Link to="/additional-orders" className="hover:text-blue-500" onClick={() => setMobileMenuOpen(false)}>Дозамовлення</Link>
      <Link to="/orders-fin" className="hover:text-blue-500" onClick={() => setMobileMenuOpen(false)}>Статус</Link>
      <Link to="/files" className="hover:text-blue-500" onClick={() => setMobileMenuOpen(false)}>Файли</Link>
      <Link to="/videos" className="hover:text-blue-500" onClick={() => setMobileMenuOpen(false)}>Відео</Link>
      <Link to="/emergency-contacts" className="hover:text-blue-500" onClick={() => setMobileMenuOpen(false)}>SOS</Link>
                    <Link
                    to="/change-password"
                    className="text-white hover:text-blue-500 text-base focus:outline-none"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Змінити пароль
                  </Link>
    </>
  );

  return (
    <header className="fixed top-0 left-0 w-full bg-[#45403e] shadow-md text-white py-4 px-6 flex justify-between items-center z-50">
      <div style={styles.left}>
        <Link to={"/dashboard"}>
          <img src="/header_logo.svg" alt="Логотип" style={styles.logo} />
        </Link>
      </div>

      {/* Відображаємо меню залежно від ширини */}
      {!isMobile && (
        <nav className="flex gap-4 text-base font-medium text-white items-center" ref={financeRef}>
          {navLinks}

          {/* Фінанси десктоп з дропдауном */}
          <div className="relative">
            <button
              onClick={toggleFinanceMenu}
              className="hover:text-blue-500 flex items-center gap-1 focus:outline-none"
            >
              Фінанси ▾
            </button>
            {showFinanceMenu && (
              <div className="absolute bg-white text-gray-700 rounded shadow-md mt-2 min-w-[180px] z-50">
                <Link
                  to="/finance/settlements"
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setShowFinanceMenu(false)}
                >
                  Взаєморозрахунки
                </Link>
                <Link
                  to="/finance/money-flow"
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setShowFinanceMenu(false)}
                >
                  Рух коштів
                </Link>
                <Link
                  to="/finance/analytics"
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setShowFinanceMenu(false)}
                >
                  Аналітика
                </Link>
                <Link
                  to="/finance/payments"
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setShowFinanceMenu(false)}
                >
                  Оплата
                </Link>
                <Link
                  to="/promo"
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setShowFinanceMenu(false)}
                >
                  Акція WDS
                </Link>
                <Link
                  to="/finance/bills"
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setShowFinanceMenu(false)}
                >
                  Рахунки
                </Link>

              </div>
            )}
          </div>
        </nav>
      )}

      {/* Мобільне меню */}
      {isMobile && (
        <div className="" ref={menuRef}>
          <button
            onClick={() => {
              setMobileMenuOpen(prev => {
                if (!prev) setShowFinanceMenuMobile(false);
                return !prev;
              });
            }}
            className="text-white focus:outline-none text-2xl select-none"
            aria-label="Відкрити меню"
          >
            ☰
          </button>

          <div
            className={`absolute top-16 font-medium left-0 w-full bg-[#45403e] flex flex-col gap-3 p-4 text-base z-50
              transition-all duration-300 ease-in-out overflow-hidden
              ${mobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"}`}
            style={{ pointerEvents: mobileMenuOpen ? "auto" : "none" }}
          >
            {navLinks}

            {/* Фінанси мобільне меню */}
            <div>
              <button
                onClick={toggleFinanceMenuMobile}
                className="text-left hover:text-blue-500 w-full"
              >
                Фінанси ▾
              </button>
              {showFinanceMenuMobile && (
                <div className="bg-white text-gray-700 rounded shadow-md mt-2 flex flex-col">
                  <Link
                    to="/finance/settlements"
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Взаєморозрахунки
                  </Link>
                  <Link
                    to="/finance/money-flow"
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Рух коштів
                  </Link>
                  <Link
                    to="/finance/analytics"
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Аналітика
                  </Link>
                  <Link
                    to="/finance/payments"
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Оплата
                  </Link>
                  <Link
                    to="/promo"
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Акція WDS
                  </Link>
                  <Link
                    to="/finance/bills"
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Рахунки
                  </Link>
    
                </div>
              )}
            </div>

            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
                setShowFinanceMenuMobile(false);
              }}
              className="bg-red-500 w-20 hover:bg-red-600 text-white px-3 py-1 rounded-md"
            >
              Вийти
            </button>
          </div>
        </div>
      )}

      {/* Кнопка Вийти для десктопу */}
      {!isMobile && (
        <div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-base"
          >
            Вийти
          </button>
        </div>
      )}
    </header>
  );
}

const styles = {
  left: {
    display: "flex",
    alignItems: "center",
  },
  logo: {
    height: "40px",
    marginRight: "15px",
  },
};
