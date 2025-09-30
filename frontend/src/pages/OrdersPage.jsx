// OrdersPage.jsx
import React, { useState, useEffect } from "react";
import CalculationList from "../components/Order/CalculationList";
import { mockCalculations } from "../components/Order/mockCalculations";
import FilterMenu from "../components/Order/FilterMenu"; // 👈 імпорт меню

const OrdersPage = () => {
  const [allCalculations, setAllCalculations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    setAllCalculations(mockCalculations);
  }, []);

  const filteredCalculations = allCalculations
    .map((calc) => {
      const filteredOrders = calc.items.filter((order) => {
        let statusMatch = true;
        switch (activeFilter) {
          case "new": statusMatch = order['ЭтапВыполненияЗаказа'] === "Новий"; break;
          case "processing": statusMatch = order['ЭтапВыполненияЗаказа'] === "В обробці"; break;
          case "waiting-payment": statusMatch = parseFloat(order['СуммаЗаказа']) - parseFloat(order['ОплаченоПоЗаказу']) > 0; break;
          case "waiting-confirm": statusMatch = order['СостояниеЗаказа'] !== "Подтверждено"; break;
          case "production": statusMatch = !!order['ФактическаяДатаПроизводстваМакс']; break;
          case "ready": statusMatch = !!order['ФактическаяДатаГотовностиМакс']; break;
          case "delivered": statusMatch = !!order['ДатаРеализации']; break;
          case "rejected": statusMatch = order['ЭтапВыполненияЗаказа'] === "Відмова"; break;
          default: statusMatch = true;
        }

        const searchMatch = order.name.toLowerCase().includes(searchQuery.toLowerCase());
        return statusMatch && searchMatch;
      });

      return { ...calc, items: filteredOrders };
    })
    .filter((calc) => calc.items.length > 0);

  return (
    <div className="orders-page row gap-20 w-100" style={{ height: "100vh" , padding: "1% 10% 0 10%" }}>
      {/* Бокове меню */}
      <div className="sidebar">
        <FilterMenu
        calculations={allCalculations}   // 👈 передаємо всі дані
        onSelect={(filterId, searchValue) => {
          setActiveFilter(filterId);
          setSearchQuery(searchValue);
        }}
      />

      </div>

      {/* Контент */}
      <div className="calculations-wrapper column gap-14 w-100" style={{ height: "100%" }}>
          <h1>Список прорахунків та замовлень</h1>
          {/* Тут контейнер з прокруткою */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            <CalculationList calculations={filteredCalculations} />
          </div>
        </div>
      </div>
  );
};

export default OrdersPage;
