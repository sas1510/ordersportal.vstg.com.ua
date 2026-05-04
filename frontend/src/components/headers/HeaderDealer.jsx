import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useContext, useCallback } from "react";
import { useMediaQuery } from "react-responsive";
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import axiosInstance, { getAccessToken } from "../../api/axios";
import { useNotification } from "../../hooks/useNotification";
import NotificationDrawer from "../../pages/NotificationPage";
import HeaderDealerProfile from "./HeaderDealerProfile";
import logo from "../../assets/icons/logo-vst.svg";
import "./HeaderDealerProfile.css";



const NAV_LINKS = [
  { title: "Акції WDS", to: "/promo-wds-codes", highlight: true },
  { title: "Замовлення", to: "/orders" },
  { title: "Рекламації", to: "/complaints" },
  { title: "Дозамовлення", to: "/additional-orders" },
  { title: "Файли", to: "/files" },
  { title: "Відео", to: "/videos" },
  { title: "Оплата", to: "/payment" },
];

const FINANCE_SUBMENU = [
  { title: "Рух коштів", to: "/finance/cash-flow" },
  { title: "Аналітика", to: "/finance/statistics" },
  { title: "Рахунки", to: "/finance/customer-bills" },
];


const BALANCE_CACHE_KEY = "dealer_balance_cache";

export default function HeaderDealer() {
  const isMobile = useMediaQuery({ maxWidth: 1180 });
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const { addNotification } = useNotification();

  const [profileOpen, setProfileOpen] = useState(false);

  // --- СТАН ДАНИХ ---
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const socket = useRef(null);
  const reconnectTimer = useRef(null);

  const profileRef = useRef();

  

  const bellIcon = "/assets/icons/bell-icon.png"; 
  const exitIcon = "/assets/icons/exit-icon.png";

  // --- UI СТАН ---
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFinanceMenu, setShowFinanceMenu] = useState(false);
  const financeRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const moneyIcon = "/assets/icons/MoneyIconSubMenu.png"; // Перевірте, чи папка називається icon чи icons
  const profileIcon = "/assets/icons/ProfileIconSubMenu.png";
  const closeIcon = "/assets/icons/CloseButton.png";
  const polygonIcon = "/assets/icons/PolygonOpenProfileSubmenu.png";
  const menuIcon = "/assets/icons/Menu_Button.png";

  /* ================= ЗАВАНТАЖЕННЯ ДАНИХ (HTTP) ================= */
  const fetchInitialData = useCallback(async () => {
    try {
      const [countRes, listRes] = await Promise.all([
        axiosInstance.get("/notifications/count/"),
        axiosInstance.get("/notifications/"),
      ]);
      if (countRes.data.status === "success") setUnreadCount(countRes.data.unreadCount);
      if (listRes.data.status === "success") setNotifications(listRes.data.data);
    } catch (err) {
      console.error("Помилка завантаження сповіщень:", err);
    }
  }, []);




  // 1. Отримання даних з кешу
  const cached = (() => {
    try {
      return JSON.parse(localStorage.getItem(BALANCE_CACHE_KEY));
    } catch {
      return null;
    }
  })();

  const [balance, setBalance] = useState(cached?.sum ?? 0);
  const [fullName, setFullName] = useState(cached?.full_name ?? "Завантаження...");
  const [currency, setCurrency] = useState(cached?.currency ?? "грн");

  // 2. Фонове оновлення через API
  useEffect(() => {
    let isMounted = true;

    async function fetchBalance() {
      try {
        const response = await axiosInstance.get("/balance/");
        const data = response.data;

        if (!isMounted) return;

        setBalance(data.sum);
        setFullName(data.full_name || "Дилер Ім'я");
        setCurrency(data.currency || "грн");
        localStorage.setItem(
          BALANCE_CACHE_KEY,
          JSON.stringify({
            sum: data.sum,
            full_name: data.full_name,
            currency: data.currency,
            updatedAt: Date.now(),
          })
        );
      } catch (error) {
        console.error("Помилка отримання балансу:", error);
      }
    }

    fetchBalance();
    return () => { isMounted = false; };
  }, []);

  // 3. Форматування балансу
  const formattedBalance = new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: 0,
  }).format(balance) + " грн";

  /* ================= WEBSOCKET LOGIC ================= */
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    let pingInterval;
    let isCleanup = false;

    const connectNotifyWS = async () => {
      if (isCleanup) return;
      if (socket.current?.readyState === WebSocket.OPEN || socket.current?.readyState === WebSocket.CONNECTING) return;

      // try {
      //   await axiosInstance.get("/notifications/count/");
      // } catch {
      //   reconnectTimer.current = setTimeout(connectNotifyWS, 5000);
      //   return;
      // }

      const token = getAccessToken();
      if (!token) return;

      const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
      const ws_host = window.location.host;

      socket.current = new WebSocket(`${ws_scheme}://${ws_host}/ws/notifications/?token=${token}`);

      socket.current.onopen = () => {
        pingInterval = setInterval(() => {
          if (socket.current?.readyState === WebSocket.OPEN) {
            socket.current.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);
      };

      socket.current.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === "initial_notifications") setUnreadCount(data.unread_count);

        if (["new_notification", "NEW_CHAT_MESSAGE", "notification_message"].includes(data.type)) {
          const payload = data.data || data;
          setUnreadCount((prev) => prev + 1);
          const newEntry = {
            id: payload.id || Date.now(),
            message: payload.text || payload.message || "Нове повідомлення",
            eventType: payload.type || "NEW_MESSAGE",
            createdAt: payload.timestamp || new Date().toISOString(),
            isRead: false,
            authorName: payload.author_name,
          };
          setNotifications((prev) => [newEntry, ...prev]);
          addNotification(`🔔 ${payload.author_name || ""}: ${newEntry.message}`, "info", 6000);
        }
      };

      socket.current.onclose = () => {
        clearInterval(pingInterval);
        if (!isCleanup) reconnectTimer.current = setTimeout(connectNotifyWS, 5000);
      };
    };

    connectNotifyWS();
    return () => {
      isCleanup = true;
      clearInterval(pingInterval);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (socket.current) {
        socket.current.onclose = null;
        socket.current.close();
      }
    };
  }, [addNotification]);


useEffect(() => {
  const handleClickOutside = (event) => {

    if (financeRef.current && !financeRef.current.contains(event.target)) {
      setShowFinanceMenu(false);
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

  useEffect(() => {
    setShowFinanceMenu(false);
    setMobileMenuOpen(false);
    setProfileOpen(false);
  }, [location]);


  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  return (
    <header className="w-[calc(100%-20px)]  flex flex-col items-center bg-transparent z-50 font-['Inter'] mx-[10px]">
 
<div className="w-full max-w-[1334px] h-2 md:h-[12px]  rounded-t-sm"  style={{ backgroundColor: 'var(--header-decorative)' }} />


  <div className={`w-full max-w-[1334px] h-12 md:h-[70px]  flex items-center shadow-lg relative 
 rounded-bl-[25px] rounded-br-[25px]` } style={{ backgroundColor: 'var(--header-bg)' }}>
    

    <Link to="/dashboard" className="ml-[16px] flex-shrink-0 mr-4">
      <img src={logo} alt="Вікна Стиль" className="h-[35px] w-auto" />
    </Link>

    {!isMobile ? (
      <>

        <nav className="flex h-full flex-grow">
          <ul className="flex h-full w-full items-center">
            {NAV_LINKS.map((link) => (
         
              <li key={link.to} className="h-full flex-1">
                <Link
  to={link.to}
  className={`h-full flex items-center justify-center px-1 text-[13px] font-bold transition-all text-center 
    ${location.pathname.startsWith(link.to) 
      ? "bg-[var(--header-accent)] text-[var(--header-active-text)]" 
      : "text-[var(--header-text)] hover:bg-[var(--header-profile-bg)] hover:text-[var(--header-accent)]"
    }`}
>
  {link.title}
</Link>
              </li>
            ))}
            
       
            <li className="h-full relative flex-1" ref={financeRef}>
              <button 
                onClick={() => setShowFinanceMenu(!showFinanceMenu)}
                className={`w-full h-full px-2 text-[14px] font-bold flex items-center justify-center gap-1 transition-colors`}
                style={{
                  backgroundColor: showFinanceMenu || location.pathname.includes("/finance") ? 'var(--header-accent)' : 'transparent',
                  color: showFinanceMenu || location.pathname.includes("/finance") ? 'var(--header-active-text)' : 'var(--header-text)'
                }}
              >
                Фінанси <span className={`transition-transform ${showFinanceMenu ? "rotate-180" : ""}`}>▾</span>
              </button>

              {showFinanceMenu && (
                <ul className="absolute top-full left-0 w-full bg-white shadow-xl  border-t border-gray-100 py-2 z-[1001]">
                  {FINANCE_SUBMENU.map((item) => (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className="block px-4 py-3 text-[14px] font-medium text-[#44403E] hover:bg-[#6B98BF] hover:text-white transition-colors"
                        onClick={() => setShowFinanceMenu(false)}
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


        <div className="ml-auto flex items-center h-full flex-shrink-0">
          <div 
    className=" h-full flex flex-col justify-center border-l border-r border-gray-200 relative" 
    style={{ backgroundColor: 'var(--header-profile-bg)' }}
    ref={profileRef}
  >
    <button
      className="h-full w-full focus:outline-none transition-colors hover:bg-gray-200"
      onClick={() => {
        setProfileOpen((prev) => !prev);
        setShowFinanceMenu(false);
      }}
    >
     
      <HeaderDealerProfile 
        balance={balance} 
        currency={currency} 
        fullName={fullName} 
      />
    </button>

    {profileOpen && (
      <ul className="absolute top-full w-full right-0  bg-white shadow-xl border-t border-gray-100 py-2 z-[1001]">
        <li>
          <Link
            to="/change-password"
            className="block px-4 py-3 text-[14px] font-medium text-[#44403E] hover:bg-[#6B98BF] hover:text-white transition-colors"
            onClick={() => setProfileOpen(false)}
          >
            Змінити пароль
          </Link>
        </li>
        <li>
          <Link
            to="/emergency-contacts"
            className="block px-4 py-3 text-[14px] font-medium text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => setProfileOpen(false)}
          >
            Гаряча лінія
          </Link>
        </li>
      </ul>
    )}
  </div>

      
          <div className="flex items-center px-3 gap-7">
            <div className="relative cursor-pointer" onClick={() => setIsNotificationOpen(true)}>
              <img src={bellIcon} alt="Сповіщення" className="w-[20px] h-[20px] object-contain" />
              {unreadCount > 0 && (
                <div className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-[#B4D947] rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-[#44403E] text-[9px] font-black">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                </div>
              )}
            </div>

            {/* <button onClick={toggleTheme} className="text-[#44403E] text-lg hover:scale-110 transition-transform">
              <i className={theme === "light" ? "fas fa-moon" : "fas fa-sun"}></i>
            </button> */}

            <button onClick={() => { logout(); navigate("/home"); }} className="text-[#44403E] hover:text-red-500 text-lg">
               <img src={exitIcon} alt="Вихід" className="w-[20px] h-[20px] object-contain" />
            </button>
          </div>
        </div>
      </>

        ) : (

        <div className="ml-auto flex items-center gap-5 mr-4" ref={mobileMenuRef}>
    
             <div className="relative cursor-pointer mr-2" onClick={() => setIsNotificationOpen(true)}>
              <img src={bellIcon} alt="Сповіщення" className="w-[20px] h-[20px]" />
              {unreadCount > 0 && (
                <div className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-[#B4D947] rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-[#44403E] text-[9px] font-black">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                </div>
              )}
            </div>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="text-[#44403E] text-2xl focus:outline-none"
            >
              <img src={menuIcon} alt="Меню" className="w-[20px] h-[20px] " />
            </button>


{mobileMenuOpen && (
  <div className="fixed inset-0 z-[2000] " style={{backgroundColor: 'color-mix(in srgb, var(--header-profile-bg), transparent 60%)'}}>
    <div 
      ref={mobileMenuRef}
      className="absolute top-0 right-0 w-[85%] max-w-[350px] h-full rounded-tl-[20px] rounded-bl-[20px] flex flex-col font-['Inter'] shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden"
      style={{ backgroundColor: 'var(--header-bg)', color: 'var(--header-text)' }}
    >
 
      <div className=" flex items-center justify-end">
        <button onClick={() => setMobileMenuOpen(false)} className="p-2">
          <img src={closeIcon} alt="Закрити" className="w-[30px] h-[30px] object-contain" />
        </button>
      </div>


      <div className="flex-grow overflow-y-auto w-full">
  
<nav className="flex flex-col w-full">
  {NAV_LINKS.map((link) => {
    const isActive = location.pathname === link.to;
    return (
      <div key={link.to} className="relative w-full group">
        <Link
          to={link.to}
          className={`flex items-center w-full py-3 px-[15%] text-xl font-bold transition-colors ${
            isActive 
              ? "bg-[#6B98BF] text-[#FFFFFF]" 
              : "text-[#44403E] hover:bg-gray-50"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        >
          {link.title}
        </Link>
        <div className="absolute bottom-0 left-[5%] right-[5%] border-t border-dotted border-[#B4D947]" />
      </div>
    );
  })}


  <div className="relative flex flex-col w-full">
    <button 
      onClick={() => setShowFinanceMenu(!showFinanceMenu)}
      className={`w-full py-3 px-[15%] flex items-center group ${
        location.pathname.includes("/finance") ? "text-[#6B98BF]" : "text-[#44403E]"
      }`}
    >
      <span className="text-xl font-bold">Фінанси</span>
      <span className={`text-[12px] transition-transform ml-2 ${showFinanceMenu ? 'rotate-180' : ''}`}>▼</span>
    </button>
    
    {showFinanceMenu && (
      <div className="bg-[#F9FFE6]/50 mx-[10%] rounded-lg overflow-hidden">
        {FINANCE_SUBMENU.map((sub) => {
          const isSubActive = location.pathname === sub.to;
          return (
            <Link
              key={sub.to}
              to={sub.to}
              className={`flex py-2 px-[10%] text-[16px] font-semibold border-b border-[#44403E]/20 border-dotted last:border-0 ${
                isSubActive ? "bg-[#B4D947]/20 text-[#234461]" : "text-[#44403E]"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {sub.title}
            </Link>
          );
        })}
      </div>
    )}
  </div>
</nav>

<div className="bg-[#EEEEEE] relative shrink-0 w-full flex flex-col transition-all mt-2 duration-300">

  <div className="absolute top-0 left-[5%] right-[5%]" />

  <button 
    onClick={() => setProfileOpen(!profileOpen)}
    className="flex items-center px-[15%] gap-4 py-2 w-full hover:bg-gray-200/50 transition-colors"
  >
    <img className="object-contain mr-6" src={profileIcon} alt="profile" />
    <div className="flex items-center justify-between flex-grow min-w-0">
      <span className="text-[#234461] text-xl font-bold truncate">{fullName}</span>
      <img 
        className={`w-5 h-5 object-contain ml-2  transition-transform ${profileOpen ? 'rotate-180' : ''}`} 
        src={polygonIcon} 
        alt="polygon" 
      />
    </div>
  </button>


  {profileOpen && (
    <div className="flex flex-col items-center w-full py-2 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="w-[75%] bg-white rounded-sm flex flex-col overflow-hidden">
        <Link
          to="/change-password"
          className="px-6 py-2 text-[#44403E] text-base font-bold font-['Inter'] hover:bg-gray-50 border-b border-dotted border-[#B4D947]"
          onClick={() => { setProfileOpen(false); setMobileMenuOpen(false); }}
        >
          Змінити пароль
        </Link>
        <Link
          to="/emergency-contacts"
          className="px-6 py-2 text-[#44403E] text-base font-bold font-['Inter'] hover:bg-gray-50"
          onClick={() => { setProfileOpen(false); setMobileMenuOpen(false); }}
        >
          Гаряча лінія
        </Link>
      </div>
    </div>
  )}


  <div className="mx-[5%] border-t border-dotted border-[#44403E]/50" />


  <div className="flex items-center px-[15%] gap-4 py-3 pb-2">
    <img className="object-contain mr-4" src={moneyIcon} alt="money" />
    <span className="text-[#44403E] text-xl font-normal whitespace-nowrap">{formattedBalance}</span>
  </div>
</div>
      </div>



  
      <div className="relative bg-white shrink-0 py-6 w-full">
        <div className="absolute top-0 left-[5%] right-[5%] border-t border-dotted border-[#44403E]/50" />
        <button 
          onClick={() => { logout(); navigate("/home"); }}
          className="flex items-center justify-center gap-3 w-full"
        >
          <img className="w-7 h-6 mr-2" src={exitIcon} alt="exit" />
          <span className="text-[#44403E] text-xl font-bold">Вихід</span>
        </button>
      </div>
    </div>
  </div>
)}


         </div>
        )}
      </div>


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