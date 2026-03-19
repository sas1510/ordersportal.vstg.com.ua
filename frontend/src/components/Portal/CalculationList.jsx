import React from 'react'
import CalculationCard from './CalculationCard'
import './CalculationList.css'


const CalculationList = ({ items }) => {
  const itemsArray = Object.entries(items || {})

  if (itemsArray.length === 0) {
    return (
      <div className="empty-state">
        <p>Немає даних для відображення</p>
      </div>
    )
  }

  return (
    <div className="calculation-list">
      {itemsArray.map(([key, item]) => (
        <CalculationCard key={key} id={key} calculation={item} />
      ))}
    </div>
  )
}

export default CalculationList
