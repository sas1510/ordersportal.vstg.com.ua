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
    <div className="" style={{ width: '300px' }}>
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
