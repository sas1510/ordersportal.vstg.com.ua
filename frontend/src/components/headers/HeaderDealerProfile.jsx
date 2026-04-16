// // import { useState, useEffect } from "react";
// // import axiosInstance from "../../api/axios";
// // import { useTheme } from "../../hooks/useTheme";
// // // import line1 from "../../assets/icons/line-1.svg"; // Перевірте шлях до файлів
// // import "./HeaderDealerProfile.css"; 

// // const BALANCE_CACHE_KEY = "dealer_balance_cache";

// // export default function HeaderDealerProfile() {
// //   const { theme } = useTheme();

// //   // 1. Отримання даних з кешу
// //   const cached = (() => {
// //     try {
// //       return JSON.parse(localStorage.getItem(BALANCE_CACHE_KEY));
// //     } catch {
// //       return null;
// //     }
// //   })();

// //   const [balance, setBalance] = useState(cached?.sum ?? 0);
// //   const [fullName, setFullName] = useState(cached?.full_name ?? "Завантаження...");
// //   const moneyIcon = "/assets/icons/money-icon.png"; // Перевірте, чи папка називається icon чи icons
// //   const profileIcon = "/assets/icons/profile-icon.png";

// //   // 2. Фонове оновлення через API
// //   useEffect(() => {
// //     let isMounted = true;

// //     async function fetchBalance() {
// //       try {
// //         const response = await axiosInstance.get("/balance/");
// //         const data = response.data;

// //         if (!isMounted) return;

// //         setBalance(data.sum);
// //         setFullName(data.full_name || "Дилер Ім'я");

// //         localStorage.setItem(
// //           BALANCE_CACHE_KEY,
// //           JSON.stringify({
// //             sum: data.sum,
// //             full_name: data.full_name,
// //             updatedAt: Date.now(),
// //           })
// //         );
// //       } catch (error) {
// //         console.error("Помилка отримання балансу:", error);
// //       }
// //     }

// //     fetchBalance();
// //     return () => { isMounted = false; };
// //   }, []);

// //   // 3. Форматування балансу (без знаку валюти, якщо хочете як у макеті, або з ним)
// //   const formattedBalance = new Intl.NumberFormat("uk-UA", {
// //     minimumFractionDigits: 0,
// //   }).format(balance) + " грн";

// //   return (
// //     <div className={`profile-box ${theme}`}>
// //       <div className="profile-menu-container">
// //         {/* Фоновий прямокутник */}
// //         <div className="profile-rectangle" />

// //         {/* Секція Ім'я */}
// //         <div className="profile-name-text">{fullName}</div>
// //         <img className="profile-img-icon" alt="Profile" src={profileIcon} />

// //         {/* Розділювач (Лінія) */}
// //         <div className="profile-separator-line" />
// //         {/* <img className="profile-separator-line" alt="Line" src={line1} /> */}

// //         {/* Секція Балансу */}
// //         <div className="profile-balance-text">{formattedBalance}</div>
// //         <img className="profile-money-img-icon" alt="Money" src={moneyIcon} />
// //       </div>
// //     </div>
// //   );
// // }


// import { useState, useEffect } from "react";
// import axiosInstance from "../../api/axios";
// import { useTheme } from "../../hooks/useTheme";
// import "./HeaderDealerProfile.css"; 

// const BALANCE_CACHE_KEY = "dealer_balance_cache";

// export default function HeaderDealerProfile() {
//   const { theme } = useTheme();

//   // 1. Отримання даних з кешу
//   const cached = (() => {
//     try {
//       return JSON.parse(localStorage.getItem(BALANCE_CACHE_KEY));
//     } catch {
//       return null;
//     }
//   })();

//   const [balance, setBalance] = useState(cached?.sum ?? 0);
//   const [fullName, setFullName] = useState(cached?.full_name ?? "Завантаження...");
  
//   const moneyIcon = "/assets/icons/money-icon.png";
//   const profileIcon = "/assets/icons/profile-icon.png";

//   // --- ЛОГІКА ОБРОБКИ ІМЕНІ ---
// const formatName = (name) => {
//   if (!name || name === "Завантаження...") return name;

//   // 1. Прибираємо все, що в дужках
//   // "WINDOWS STYLE ITALY (WINDOWS STYLE TRADING SRL)" -> "WINDOWS STYLE ITALY"
//   let cleanName = name.split('(')[0].trim();

//   // 2. Обрізаємо, якщо назва занадто довга
//   // Ставимо ліміт, наприклад, 20 символів
//   const maxLength = 15; 

//   if (cleanName.length > maxLength) {
//     // Обрізаємо до maxLength і додаємо три крапки
//     return cleanName.substring(0, maxLength).trim() + "...";
//   }

//   return cleanName;
// };

//   // 2. Фонове оновлення через API
//   useEffect(() => {
//     let isMounted = true;

//     async function fetchBalance() {
//       try {
//         const response = await axiosInstance.get("/balance/");
//         const data = response.data;

//         if (!isMounted) return;

//         setBalance(data.sum);
//         setFullName(data.full_name || "Дилер Ім'я");

//         localStorage.setItem(
//           BALANCE_CACHE_KEY,
//           JSON.stringify({
//             sum: data.sum,
//             full_name: data.full_name,
//             updatedAt: Date.now(),
//           })
//         );
//       } catch (error) {
//         console.error("Помилка отримання балансу:", error);
//       }
//     }

//     fetchBalance();
//     return () => { isMounted = false; };
//   }, []);

//   const formattedBalance = new Intl.NumberFormat("uk-UA", {
//     minimumFractionDigits: 2, // Додав 2 знаки після коми, як на скриншоті
//   }).format(balance) + " грн";

//   return (
//     <div className={`profile-box ${theme}`}>
//       <div className="profile-menu-container">
//         <div className="profile-rectangle" />

//         {/* Секція Ім'я з використанням функції formatName */}
//         <div className="profile-name-text" title={fullName}>
//           {formatName(fullName)}
//         </div>
//         <img className="profile-img-icon" alt="Profile" src={profileIcon} />

//         <div className="profile-separator-line" />

//         {/* Секція Балансу */}
//         <div className="profile-balance-text">{formattedBalance}</div>
//         <img className="profile-money-img-icon" alt="Money" src={moneyIcon} />
//       </div>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import axiosInstance from "../../api/axios";
import { useTheme } from "../../hooks/useTheme";
import "./HeaderDealerProfile.css"; 

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

  // Тепер зберігаємо і суму, і назву валюти
  const [balance, setBalance] = useState(cached?.sum ?? 0);
  const [currency, setCurrency] = useState(cached?.currency ?? "грн");
  const [fullName, setFullName] = useState(cached?.full_name ?? "Завантаження...");
  
  const moneyIcon = "/assets/icons/money-icon.png";
  const profileIcon = "/assets/icons/profile-icon.png";

  const formatName = (name) => {
    if (!name || name === "Завантаження...") return name;
    let cleanName = name.split('(')[0].trim();
    const maxLength = 15; 
    return cleanName.length > maxLength ? cleanName.substring(0, maxLength).trim() + "..." : cleanName;
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchBalance() {
      try {
        const response = await axiosInstance.get("/balance/");
        const data = response.data; // Очікуємо { sum: 100.50, currency: "EUR", full_name: "..." }

        if (!isMounted) return;

        setBalance(data.sum);
        setCurrency(data.currency || "грн");
        setFullName(data.full_name || "Дилер Ім'я");

        localStorage.setItem(
          BALANCE_CACHE_KEY,
          JSON.stringify({
            sum: data.sum,
            currency: data.currency,
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

  // Форматуємо лише число
  const formattedAmount = new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance);

  return (
    <div className={`profile-box ${theme}`}>
      <div className="profile-menu-container">
        <div className="profile-rectangle" />

        <div className="profile-name-text" title={fullName}>
          {formatName(fullName)}
        </div>
        <img className="profile-img-icon" alt="Profile" src={profileIcon} />

        <div className="profile-separator-line" />

        {/* Секція Балансу з валютою меншим шрифтом */}
        <div className="profile-balance-text">
          {formattedAmount}
          <span className="profile-currency-label">
             {currency}
          </span>
        </div>
        <img className="profile-money-img-icon" alt="Money" src={moneyIcon} />
      </div>
    </div>
  );
}