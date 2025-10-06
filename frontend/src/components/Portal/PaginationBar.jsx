import React from 'react'
import './PaginationBar.css'

const PaginationBar = ({ filter, onFilterChange, data }) => {
  const months = [
    { value: 1, label: 'Січень' },
    { value: 2, label: 'Лютий' },
    { value: 3, label: 'Березень' },
    { value: 4, label: 'Квітень' },
    { value: 5, label: 'Травень' },
    { value: 6, label: 'Червень' },
    { value: 7, label: 'Липень' },
    { value: 8, label: 'Серпень' },
    { value: 9, label: 'Вересень' },
    { value: 10, label: 'Жовтень' },
    { value: 11, label: 'Листопад' },
    { value: 12, label: 'Грудень' }
  ]

  const getMonthCount = (monthValue) => {
    if (!data) return 0
    
    return Object.values(data).filter(item => {
      const calcDate = new Date(item.internals?.ДатаПросчета)
      return (calcDate.getMonth() + 1) === monthValue
    }).length
  }

  const handleMonthClick = (monthValue) => {
    const newMonth = filter.month === monthValue ? 0 : monthValue
    onFilterChange({ ...filter, month: newMonth })
  }

  return (
    <div className="pagination-bar">
      <div className="pagination-title">Фільтр по місяцях:</div>
      <div className="pagination-items">
        <button
          className={`pagination-item ${filter.month === 0 ? 'active' : ''}`}
          onClick={() => handleMonthClick(0)}
        >
          Всі місяці
        </button>
        {months.map((month) => {
          const count = getMonthCount(month.value)
          if (count === 0) return null
          
          return (
            <button
              key={month.value}
              className={`pagination-item ${filter.month === month.value ? 'active' : ''}`}
              onClick={() => handleMonthClick(month.value)}
            >
              {month.label} ({count})
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default PaginationBar
