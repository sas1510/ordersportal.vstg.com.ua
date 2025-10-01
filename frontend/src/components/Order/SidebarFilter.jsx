
import React, { useState } from 'react';


// Sidebar Filter Component
const SidebarFilter = ({ onFilterChange, activeFilter }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filterItems = [
    { id: 'all',  icon: "icon-calculator", label: 'Всі прорахунки', count: 12354 },
    { id: 'new',  icon: "icon-bolt", label: 'Нові прорахунки', count: 1234 },
    { id: 'processing', icon: "icon-spin-alt", label: 'В обробці', count: 1234 },
    { id: 'payment',  icon: "icon-coin-dollar" , label: 'Очікують оплату', count: 1234 },
    { id: 'confirmation',  icon: "icon-clipboard" , label: 'Очікують підтвердження', count: 12345 },
    { id: 'production', icon: "icon-cogs" , label: 'Замовлення у виробництві', count: 123 },
    { id: 'ready', icon: "icon-layers2", label: 'Готові замовлення', count: 123 },
    { id: 'delivered',  icon: "icon-shipping", label: 'Доставлені замовлення', count: 123 },
    { id: 'rejected', icon: "icon-circle-with-cross" , label: 'Відмова', count: 123 }
  ];

  const handleNewCalculation = () => {
    console.log('Створення нового прорахунку');
  };

  return (
    <div className="content-filter">
      <input 
        type="text" 
        className="search-orders" 
        placeholder="номер прорахунку, замовлення"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <button className="btn-add-calc" onClick={handleNewCalculation}>
        <span style={{ fontSize: '20px' }}>+</span>
        <span>Новий прорахунок</span>
      </button>

      <ul className="filter">
        {filterItems.map((item) => (
          <li 
            key={item.id}
            className={activeFilter === item.id ? 'active' : ''}
            onClick={() => onFilterChange(item.id)}
          >
            <i className={item.icon}></i>
            <span>{item.label}</span>
            <span>{item.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SidebarFilter;