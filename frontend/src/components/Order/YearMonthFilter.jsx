import React, { useState } from 'react';

const YearMonthFilter = ({ selectedYear, onYearChange, selectedMonth, onMonthChange }) => {
  const months = [
    { id: 'all', label: 'Весь рік', count: null },
    { id: 1, label: 'Січ.', count: 4 },
    { id: 2, label: 'Лют.', count: 1 },
    { id: 3, label: 'Бер.', count: 2 },
    { id: 4, label: 'Квіт.', count: 4 },
    { id: 5, label: 'Трав.', count: 1 },
    { id: 6, label: 'Черв.', count: 4 },
    { id: 7, label: 'Лип.', count: 2 },
    { id: 8, label: 'Сер.', count: 2 },
    { id: 9, label: 'Вер.', count: 4 },
    { id: 10, label: 'Жов.', count: 8 },
    { id: 11, label: 'Лис.', count: 0 },
    { id: 12, label: 'Груд.', count: 8 },
  ];

  return (
    <div className="flex items-center gap-3 p-3 bg-white border-b border-gray-300">
      {/* Рік */}
      <div className="flex items-center gap-2">
        <span className="text-gray-600 text-sm">ЗВІТНИЙ РІК:</span>
        <div className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded">
          <span>📅</span>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="border-none outline-none text-sm cursor-pointer"
          >
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
        </div>
      </div>

      {/* Місяці */}
      <div className="flex gap-1 ml-auto">
        {months.map((month) => (
          <button
            key={month.id}
            disabled={month.count === 0}
            onClick={() => onMonthChange(month.id)}
            className={`
              px-2 py-1 rounded border text-xs transition-all
              ${month.count === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-800 hover:bg-gray-200'}
              ${selectedMonth === month.id ? 'bg-blue-500 text-white border-blue-500' : ''}
            `}
          >
            {month.label} {month.count !== null && `(${month.count})`}
          </button>
        ))}
      </div>
    </div>
  );
};

export default YearMonthFilter;
