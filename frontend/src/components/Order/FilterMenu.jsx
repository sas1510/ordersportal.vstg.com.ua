// FilterMenu.jsx
import React, { useState } from "react";

import '../Order/portalorder.css';

const FILTER_ITEMS = [
  { id: "all", label: "Всі прорахунки", icon: "icon-calculator" },
  { id: "new", label: "Нові прорахунки", icon: "icon-bolt" },
  { id: "processing", label: "В обробці", icon: "icon-spin-alt" },
  { id: "waiting-payment", label: "Очикують оплату", icon: "icon-coin-dollar" },
  { id: "waiting-confirm", label: "Очикують підтвердження", icon: "icon-clipboard" },
  { id: "production", label: "Замовлення у виробництві", icon: "icon-cogs" },
  { id: "ready", label: "Готові замовлення", icon: "icon-layers2" },
  { id: "delivered", label: "Доставлені замовлення", icon: "icon-shipping" },
  { id: "rejected", label: "Відмова", icon: "icon-circle-with-cross" },
];

export default function FilterMenu({ calculations = [], onSelect }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchValue, setSearchValue] = useState("");

  const handleFilterClick = (id) => {
    setActiveFilter(id);
    if (onSelect) onSelect(id, searchValue);
  };

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
    if (onSelect) onSelect(activeFilter, e.target.value);
  };

  // Підрахунок кількості елементів для кожного фільтру
  const getCount = (filterId) => {
    switch (filterId) {
      case "all": return calculations.reduce((acc, c) => acc + c.items.length, 0);
      case "new": return calculations.reduce((acc, c) => acc + c.items.filter(o => o['ЭтапВыполненияЗаказа'] === "Новий").length, 0);
      case "processing": return calculations.reduce((acc, c) => acc + c.items.filter(o => o['ЭтапВыполненияЗаказа'] === "В обробці").length, 0);
      case "waiting-payment": return calculations.reduce((acc, c) => acc + c.items.filter(o => parseFloat(o['СуммаЗаказа']) - parseFloat(o['ОплаченоПоЗаказу']) > 0).length, 0);
      case "waiting-confirm": return calculations.reduce((acc, c) => acc + c.items.filter(o => o['СостояниеЗаказа'] !== "Подтверждено").length, 0);
      case "production": return calculations.reduce((acc, c) => acc + c.items.filter(o => !!o['ФактическаяДатаПроизводстваМакс']).length, 0);
      case "ready": return calculations.reduce((acc, c) => acc + c.items.filter(o => !!o['ФактическаяДатаГотовностиМакс']).length, 0);
      case "delivered": return calculations.reduce((acc, c) => acc + c.items.filter(o => !!o['ДатаРеализации']).length, 0);
      case "rejected": return calculations.reduce((acc, c) => acc + c.items.filter(o => o['ЭтапВыполненияЗаказа'] === "Відмова").length, 0);
      default: return 0;
    }
  };

  return (
    <div className="content-filter column">
      <input
        type="text"
        className="search-orders"
        placeholder="номер прорахунку, замовлення"
        value={searchValue}
        onChange={handleSearchChange}
      />

      <ul className="filter column">
        <li className="delimiter"></li>
        <li className="btn btn-add-calc row ">
          <span className="icon icon-plus3 font-size-16"></span>
          <span className="w-100 uppercase font-size-16">Новий прорахунок</span>
        </li>
        <li className="delimiter"></li>
        {/* <div className="content-filter"> */}
        {FILTER_ITEMS.map(item => (
          <li
            key={item.id}
            className={`filter-item ${activeFilter === item.id ? "active" : ""}`}
            onClick={() => handleFilterClick(item.id)}
          >
            <span className={`icon ${item.icon} font-size-24`}></span>
            <span className="w-100">{item.label}</span>
            <span>{getCount(item.id)}</span>
          </li>
        ))}
        {/* </div> */}
      </ul>
    </div>
  );
}
