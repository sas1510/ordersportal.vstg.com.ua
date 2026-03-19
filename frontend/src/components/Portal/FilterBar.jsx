import React from 'react'
import './FilterBar.css'

const FilterBar = ({ filter, onFilterChange, statusSummary }) => {
  const filters = [
    { value: 0, label: 'Всі' },
    { value: 1, label: 'Новий' },
    { value: 2, label: 'В обробці' },
    { value: 3, label: 'Очикуємо оплату' },
    { value: 4, label: 'Підтверджений' },
    { value: 5, label: 'Очикуємо підтвердження' },
    { value: 6, label: 'У виробництві' },
    { value: 7, label: 'Готовий' },
    { value: 8, label: 'Відвантажений' },
    { value: 9, label: 'Відмова' }
  ]

  const handleFilterClick = (value) => {
    onFilterChange({ ...filter, status: value })
  }

  const handleSearchChange = (e) => {
    onFilterChange({ ...filter, name: e.target.value })
  }

  return (
    <div className="filter-bar">
      <div className="search-box">
        <input
          type="text"
          className="search-input"
          placeholder="Пошук за номером просчету або замовлення..."
          value={filter.name}
          onChange={handleSearchChange}
        />
      </div>

      <div className="filter-buttons">
        {filters.map((f) => (
          <button
            key={f.value}
            className={`filter-item ${filter.status === f.value ? 'active' : ''}`}
            onClick={() => handleFilterClick(f.value)}
          >
            {f.label}
            {statusSummary && statusSummary[f.label] !== undefined && (
              <span className="filter-count">({statusSummary[f.label]})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default FilterBar
