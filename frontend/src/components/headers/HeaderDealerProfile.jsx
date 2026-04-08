import { useState, useEffect } from "react";
import axiosInstance from "../../api/axios";
import { useTheme } from "../../hooks/useTheme";
// import line1 from "../../assets/icons/line-1.svg"; // Перевірте шлях до файлів
import "./HeaderDealerProfile.css"; 

const BALANCE_CACHE_KEY = "dealer_balance_cache";

export default function HeaderDealerProfile() {
  const { theme } = useTheme();

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
  const moneyIcon = "/assets/icons/money-icon.png"; // Перевірте, чи папка називається icon чи icons
  const profileIcon = "/assets/icons/profile-icon.png";

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

        localStorage.setItem(
          BALANCE_CACHE_KEY,
          JSON.stringify({
            sum: data.sum,
            full_name: data.full_name,
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

  // 3. Форматування балансу (без знаку валюти, якщо хочете як у макеті, або з ним)
  const formattedBalance = new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: 0,
  }).format(balance) + " грн";

  return (
    <div className={`profile-box ${theme}`}>
      <div className="profile-menu-container">
        {/* Фоновий прямокутник */}
        <div className="profile-rectangle" />

        {/* Секція Ім'я */}
        <div className="profile-name-text">{fullName}</div>
        <img className="profile-img-icon" alt="Profile" src={profileIcon} />

        {/* Розділювач (Лінія) */}
        <div className="profile-separator-line" />
        {/* <img className="profile-separator-line" alt="Line" src={line1} /> */}

        {/* Секція Балансу */}
        <div className="profile-balance-text">{formattedBalance}</div>
        <img className="profile-money-img-icon" alt="Money" src={moneyIcon} />
      </div>
    </div>
  );
}