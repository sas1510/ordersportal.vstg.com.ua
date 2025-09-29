import { useState, useEffect } from "react";
import axiosInstance from "../../api/axios"; // твій налаштований axios з токенами

export default function HeaderDealerProfile() {
  const [balance, setBalance] = useState(0);
  const [fullName, setFullName] = useState("Дилер Ім'я");

  useEffect(() => {
    async function fetchBalance() {
      try {
        const response = await axiosInstance.get("/balance/");
        const data = response.data;
        setBalance(data.sum);
        setFullName(data.full_name || "Дилер Ім'я");
      } catch (error) {
        console.error("Помилка отримання балансу:", error);
      }
    }
    fetchBalance();
  }, []);

  const formattedBalance = new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    minimumFractionDigits: 0,
  }).format(balance);

  return (
    <li className="profile-item-column">
      {/* Ім’я */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <div className="icon icon-user font-size-20 text-info dealer-icon"></div>
        <div className="name no-wrap">{fullName}</div>
      </div>

      <div className="divider"></div>

      {/* Баланс */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div className="icon icon-coin-dollar font-size-20 text-success money-icon"></div>
        <div className="balance text-warning font-size-20 no-wrap">{formattedBalance}</div>
      </div>
    </li>
  );
}
