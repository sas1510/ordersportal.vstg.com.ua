import React, { useState } from 'react';

const FilterMenu = () => {
  const [search, setSearch] = useState('');

  const filters = [
    { icon: 'icon-calculator', label: 'Всі прорахунки', count: 12354 },
    { icon: 'icon-bolt', label: 'Нові прорахунки', count: 1234 },
    { icon: 'icon-spin-alt', label: 'В обробці', count: 1234 },
    { icon: 'icon-coin-dollar', label: 'Очикують оплату', count: 1234 },
    { icon: 'icon-clipboard', label: 'Очикують підтвердження', count: 12345 },
    { icon: 'icon-cogs', label: 'Замовлення у виробництві', count: 123 },
    { icon: 'icon-layers2', label: 'Готові замовлення', count: 123 },
    { icon: 'icon-shipping', label: 'Доставлені замовлення', count: 123 },
    { icon: 'icon-circle-with-cross', label: 'Відмова', count: 123 },
  ];

  return (
    <div className="content-filter column">
      <input
        type="text"
        className="search-orders"
        placeholder="номер прорахунку, замовлення"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <ul className="filter column align-center">
        <li className="delimiter"></li>
        <li className="btn btn-add-calc row align-center">
          <span className="icon icon-plus3 font-size-24"></span>
          <span className="w-100 uppercase">Новий прорахунок</span>
        </li>
        <li className="delimiter"></li>
        {filters.map((f, idx) => (
          <li key={idx} className="filter-item">
            <span className={`icon ${f.icon} font-size-24`}></span>
            <span className="w-100">{f.label}</span>
            <span>{f.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FilterMenu;
