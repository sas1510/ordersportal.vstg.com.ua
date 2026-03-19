import React, { useState } from 'react'
import './CalculationCard.css'

const CalculationCard = ({ id, calculation }) => {
  const [expanded, setExpanded] = useState(false)

  const internals = calculation.internals || {}
  const orders = calculation.items || {}
  const ordersArray = Object.entries(orders)

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('uk-UA')
  }

  const getStatusClass = (status) => {
    const statusClasses = {
      'Новий': 'status-new',
      'В обробці': 'status-processing',
      'Очикуємо оплату': 'status-waiting-payment',
      'Підтверджений': 'status-confirmed',
      'Очикуємо підтвердження': 'status-waiting-confirm',
      'У виробництві': 'status-production',
      'Готовий': 'status-ready',
      'Відвантажений': 'status-shipped',
      'Відмова': 'status-cancelled'
    }
    return statusClasses[status] || 'status-default'
  }

  return (
    <div className={`calculation-card ${expanded ? 'expanded' : ''}`}>
      <div className="card-header" onClick={() => setExpanded(!expanded)}>
        <div className="card-title">
          <h3>{internals.name || 'Без назви'}</h3>
          <span className="calc-date">
            {formatDate(internals.ДатаПросчета)}
          </span>
        </div>
        <div className="card-meta">
          <span className="orders-count">
            Замовлень: {ordersArray.length}
          </span>
          <button className="expand-btn">
            {expanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="card-body">
          {ordersArray.length > 0 ? (
            <div className="orders-list">
              {ordersArray.map(([orderKey, order]) => (
                <div key={orderKey} className="order-item">
                  <div className="order-header">
                    <span className="order-name">
                      {order.internals?.Название || 'Без назви'}
                    </span>
                    <span className={`order-status ${getStatusClass(order.internals?.Статус)}`}>
                      {order.internals?.Статус || 'Невідомо'}
                    </span>
                  </div>
                  <div className="order-details">
                    <span>Клієнт: {order.internals?.Клиент || 'N/A'}</span>
                    <span>Дата: {formatDate(order.internals?.Дата)}</span>
                    {order.internals?.Сума && (
                      <span>Сума: {order.internals.Сума} грн</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-orders">
              <p>Немає замовлень</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CalculationCard
