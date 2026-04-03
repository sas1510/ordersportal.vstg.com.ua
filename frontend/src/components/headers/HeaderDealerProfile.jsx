// HeaderDealerProfile.jsx

import { useState, useEffect } from "react";
import axiosInstance from "../../api/axios";
import { useTheme } from "../../hooks/useTheme"; // 👈 ІМПОРТУЄМО useTheme
import "./HeaderAdmin.css";

const BALANCE_CACHE_KEY = "dealer_balance_cache";

export default function HeaderDealerProfile() {
  const { theme } = useTheme();

  const cached = (() => {
    try {
      return JSON.parse(localStorage.getItem(BALANCE_CACHE_KEY));
    } catch {
      return null;
    }
  })();

  const [balance, setBalance] = useState(cached?.sum ?? 0);
  const [fullName, setFullName] = useState(cached?.full_name ?? "Дилер Ім'я");

  // 👉 2. фонове оновлення
  useEffect(() => {
    let isMounted = true;

    async function fetchBalance() {
      try {
        const response = await axiosInstance.get("/balance/");
        const data = response.data;

        if (!isMounted) return;

        setBalance(data.sum);
        setFullName(data.full_name || "Дилер Ім'я");

        // 👉 3. оновлюємо кеш
        localStorage.setItem(
          BALANCE_CACHE_KEY,
          JSON.stringify({
            sum: data.sum,
            full_name: data.full_name,
            updatedAt: Date.now(),
          }),
        );
      } catch (error) {
        console.error("Помилка отримання балансу:", error);
      }
    }

    fetchBalance();
    return () => {
      isMounted = false;
    };
  }, []);

  const formattedBalance = new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    minimumFractionDigits: 0,
  }).format(balance);

  // 2. Додаємо динамічні класи або стилі, якщо необхідно
  // Наприклад, змінюємо клас, який впливає на колір, якщо він не повністю керується CSS-змінними.
  const profileClasses = `profile-item-column ${theme === "dark" ? "dark-profile" : ""}`;

  return (
    // 3. Застосовуємо динамічний клас
    <li className={profileClasses}>
      {/* Ім’я */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "4px",
        }}
      >
        {/* Колір іконки 'dealer-icon' повинен бути стилізований у CSS через .dark-theme .dealer-icon */}
        <div className="icon icon-user font-size-20 text-info dealer-icon"></div>
        <div className="name no-wrap">{fullName}</div>
      </div>

      <div className="divider"></div>

      {/* Баланс */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {/* Колір іконки 'money-icon' повинен бути стилізований у CSS через .dark-theme .money-icon */}
        <div className="icon icon-coin-dollar font-size-20 text-success money-icon"></div>
        {/* Колір балансу 'text-warning' повинен бути стилізований у CSS через .dark-theme .text-warning */}
        <div className="balance text-warning font-size-20 no-wrap">
          {formattedBalance}
        </div>
      </div>
    </li>
  );
}
