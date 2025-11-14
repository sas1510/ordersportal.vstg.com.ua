import React from "react";

const YearMonthFilter = ({ selectedYear, onYearChange }) => {
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
    { id: 12, label: 'Груд.', count: 8 }
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '14px',
      backgroundColor: '#fff',
      borderBottom: '1px solid #d4d4d4'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <span style={{ fontSize: '14px', color: '#595959' }}>ЗВІТНИЙ РІК:</span>
        <select 
          value={selectedYear} 
          onChange={(e) => onYearChange(e.target.value)}
          style={{
            padding: '5px 10px',
            border: '1px solid #d4d4d4',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '5px', marginLeft: 'auto' }}>
        {months.map(month => (
          <button
            key={month.id}
            style={{
              padding: '5px 10px',
              border: '1px solid #d4d4d4',
              borderRadius: '3px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#2d2826'
            }}
          >
            {month.label} {month.count !== null && `(${month.count})`}
          </button>
        ))}
      </div>
    </div>
  );
};

export default YearMonthFilter;
