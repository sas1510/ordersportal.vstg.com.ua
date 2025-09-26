import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from 'react-responsive';
import { AuthContext } from "../../context/AuthContext";
import { RoleContext } from "../../context/RoleContext";

export default function HeaderAdmin() {
  const isMobile = useMediaQuery({ maxWidth: 1459 });
  const navigate = useNavigate();
  const location = useLocation();

  const { logout } = useContext(AuthContext);  // новий AuthContext
  const { role, setRole } = useContext(RoleContext);

  const [showSettings, setShowSettings] = useState(false);
  const [showFinanceMenu, setShowFinanceMenu] = useState(false);
  const [showFinanceMenuMobile, setShowFinanceMenuMobile] = useState(false);
  const [showSettingsMobile, setShowSettingsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const settingsRef = useRef();
  const financeRef = useRef();
  const mobileMenuRef = useRef();

  // Закриваємо меню при зміні маршруту
  useEffect(() => {
    setShowSettings(false);
    setShowFinanceMenu(false);
    setShowFinanceMenuMobile(false);
    setShowSettingsMobile(false);
    setMobileMenuOpen(false);
  }, [location]);

  // Обробник кліку поза межами
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

  // Новий handleLogout через AuthContext
  const handleLogout = async () => {
    await logout();  // очищає токени та роль
    navigate("/home");
  };

  // Навігаційні посилання з уніфікованими стилями
  const navLinks = (
    <>
      <Link
        to="/promo"
        className="text-white hover:text-blue-500 text-base focus:outline-none"
        onClick={() => setMobileMenuOpen(false)}
      >
        Акція WDS
      </Link>
      <Link
        to="/orders"
        className="text-white hover:text-blue-500 text-base focus:outline-none"
        onClick={() => setMobileMenuOpen(false)}
      >
        Замовлення
      </Link>
      <Link
        to="/complaints"
        className="text-white hover:text-blue-500 text-base focus:outline-none"
        onClick={() => setMobileMenuOpen(false)}
      >
        Рекламації
      </Link>
      <Link
        to="/additional-orders"
        className="text-white hover:text-blue-500 text-base focus:outline-none"
        onClick={() => setMobileMenuOpen(false)}
      >
        Дозамовлення
      </Link>
      <Link
        to="/orders-fin"
        className="text-white hover:text-blue-500 text-base focus:outline-none"
        onClick={() => setMobileMenuOpen(false)}
      >
        Статус
      </Link>
      <Link
        to="/files"
        className="text-white hover:text-blue-500 text-base focus:outline-none"
        onClick={() => setMobileMenuOpen(false)}
      >
        Файли
      </Link>
      <Link
        to="/videos"
        className="text-white hover:text-blue-500 text-base focus:outline-none"
        onClick={() => setMobileMenuOpen(false)}
      >
        Відео
      </Link>
      <Link
        to="/urgentLogs"
        className="text-white hover:text-blue-500 text-base focus:outline-none"
        onClick={() => setMobileMenuOpen(false)}
      >
        Статистика SOS
      </Link>
      <Link
        to="/change-password"
        className="text-white hover:text-blue-500 text-base focus:outline-none"
        onClick={() => setMobileMenuOpen(false)}
      >
        Змінити пароль
      </Link>
    </>
  );

  // Відкриваємо тільки одне меню одночасно
  const toggleSettingsMenu = () => {
    setShowSettings(prev => {
      if (!prev) setShowFinanceMenu(false);
      return !prev;
    });
    setShowFinanceMenuMobile(false);
    setShowSettingsMobile(false);
  };

  const toggleFinanceMenu = () => {
    setShowFinanceMenu(prev => {
      if (!prev) setShowSettings(false);
      return !prev;
    });
    setShowFinanceMenuMobile(false);
    setShowSettingsMobile(false);
  };

  const toggleFinanceMenuMobile = () => {
    setShowFinanceMenuMobile(prev => {
      if (!prev) setShowSettingsMobile(false);
      return !prev;
    });
  };

  const toggleSettingsMenuMobile = () => {
    setShowSettingsMobile(prev => {
      if (!prev) setShowFinanceMenuMobile(false);
      return !prev;
    });
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-[#45403e] shadow-md text-white py-4 px-6 flex justify-between items-center z-50">

      {/* Логотип */}
      <div className="flex items-center">
        <Link to={"/dashboard"}>
          <img src="/header_logo.svg" alt="Логотип" className="h-10" />
        </Link>
      </div>

      {!isMobile ? (
        <>
      {/* Десктоп меню */}
      
      <nav className="hidden lg:flex gap-4 text-base font-medium items-center" ref={financeRef}>
        {navLinks}

        {/* Фінанси десктоп */}
        <div className="relative">
          <button
            onClick={toggleFinanceMenu}
            className="text-white hover:text-blue-500 flex items-center gap-1 focus:outline-none"
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

      {/* Десктоп Налаштування + Вийти */}
      <div
        className="hidden lg:flex gap-4 text-base font-medium items-center relative"
        ref={settingsRef}
      >
        <button
          onClick={toggleSettingsMenu}
          className="text-white hover:text-blue-500 text-base focus:outline-none"
        >
          Налаштування ▾
        </button>
        {showSettings && (
          <div className="bg-white text-gray-700 rounded shadow-md mt-2 absolute left-0 top-full min-w-[180px] z-50">
            <Link
              to="/organizations"
              className="block px-4 py-2 text-base hover:bg-gray-100"
              onClick={() => setShowSettings(false)}
            >
              Організації
            </Link>
            <Link
              to="/regions"
              className="block px-4 py-2 text-base hover:bg-gray-100"
              onClick={() => setShowSettings(false)}
            >
              Регіони
            </Link>
            <Link
              to="/users"
              className="block px-4 py-2 text-base hover:bg-gray-100"
              onClick={() => setShowSettings(false)}
            >
              Користувачі
            </Link>
            <Link
              to="/contacts"
              className="block px-4 py-2 text-base hover:bg-gray-100"
              onClick={() => setShowSettings(false)}
            >
              Контакти
            </Link>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-base"
        >
          Вийти
        </button>
      </div>
        </>
      ) : (
        <>
      {/* Мобільне меню */}
          <div ref={mobileMenuRef}>
            <button
              onClick={() => setMobileMenuOpen(prev => {
                if (!prev) {
                  setShowFinanceMenuMobile(false);
                  setShowSettingsMobile(false);
                }
                return !prev;
              })}
              className="text-white focus:outline-none text-2xl select-none"
              aria-label="Відкрити меню"
            >
              ☰
            </button>

        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 w-full font-medium bg-[#45403e] flex flex-col gap-3 p-4 text-base z-50 transition-all duration-300 ease-in-out">
            {/* Навігаційні посилання без Фінансів */}
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

            {/* Налаштування мобільне меню */}
            <div>
              <button
                onClick={toggleSettingsMenuMobile}
                className="text-left hover:text-blue-500 w-full"
              >
                Налаштування ▾
              </button>
              {showSettingsMobile && (
                <div className="bg-white text-gray-700 rounded shadow-md mt-2 flex flex-col">
                  <Link
                    to="/organizations"
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Організації
                  </Link>
                  <Link
                    to="/regions"
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Регіони
                  </Link>
                  <Link
                    to="/users"
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Користувачі
                  </Link>
                  <Link
                    to="/contacts"
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Контакти
                  </Link>
                </div>
              )}
            </div>

            {/* Кнопка Вийти мобільна */}
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="bg-red-500 hover:bg-red-600 w-20 text-white px-2 py-1  rounded-md "
            >
              Вийти
            </button>
          </div>
        )}
      </div>

      
        </>
      )}
    </header>
  );
}
