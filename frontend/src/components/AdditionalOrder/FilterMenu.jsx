// FilterMenuSidebar.jsx
import React, { useState } from "react";
import '../Order/portalorder.css';

const FILTER_ITEMS = [
  { id: "all", label: "Всі прорахунки", icon: "icon-calculator" },
  { id: "new", label: "Нові прорахунки", icon: "icon-bolt" },
  { id: "processing", label: "В обробці", icon: "icon-spin-alt" },
  { id: "waiting-payment", label: "Очікують оплату", icon: "icon-coin-dollar" },
  { id: "waiting-confirm", label: "Очікують підтвердження", icon: "icon-clipboard" },
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

  const getCount = (filterId) => {
    if (!Array.isArray(calculations)) return 0;

    return calculations.reduce((acc, calc) => {
      const items = Array.isArray(calc.order) ? calc.order : [];
      switch (filterId) {
        case "all": return acc + items.length;
        case "new": return acc + items.filter(o => o.execution_stage === "Новий").length;
        case "processing": return acc + items.filter(o => o.execution_stage === "В обробці").length;
        case "waiting-payment": return acc + items.filter(o => parseFloat(o.amount || 0) - parseFloat(o.paid || 0) > 0).length;
        case "waiting-confirm": return acc + items.filter(o => o.status !== "Подтверждено").length;
        case "production": return acc + items.filter(o => !!o.fact_production_max).length;
        case "ready": return acc + items.filter(o => !!o.fact_ready_max).length;
        case "delivered": return acc + items.filter(o => !!o.realization_date).length;
        case "rejected": return acc + items.filter(o => o.execution_stage === "Відмова").length;
        default: return acc;
      }
    }, 0);
  };

  return (
    <div style={{ width: '300px' }}>
      <input
        type="text"
        className="search-orders"
        placeholder="номер прорахунку, замовлення"
        value={searchValue}
        onChange={handleSearchChange}
      />

      <ul className="filter">
        <li className="delimiter"></li>
        <li className="btn btn-add-calc">
          <span className="icon icon-plus3" style={{ marginRight: "8px", fontSize: '20px' }}> </span>
          <span className="uppercase">Новий прорахунок</span>
        </li>
        <li className="delimiter"></li>

        <div className="content-filter">
          {FILTER_ITEMS.map(item => (
            <li
              key={item.id}
              className={`filter-item ${activeFilter === item.id ? "active" : ""}`}
              onClick={() => handleFilterClick(item.id)}
            >
              <span className={`icon ${item.icon} font-size-24`}></span>
              <span style={{ flex: 1, marginLeft: '8px' }}>{item.label}</span>
              <span>{getCount(item.id)}</span>
            </li>
          ))}
        </div>
      </ul>
    </div>
  );
}
