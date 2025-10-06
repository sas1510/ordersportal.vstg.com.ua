import React, { useState, useEffect } from 'react'
import { fetchData } from '../../services/api'
import { getMockData } from '../../services/mockData'
import CalculationList from './CalculationList'
import FilterBar from './FilterBar'
import PaginationBar from './PaginationBar'
import Modal from '../Modal/Modal'
import './Portal.css'

const USE_MOCK_DATA = true // Змініть на false для використання справжнього API

const Portal = () => {
  const [data, setData] = useState(null)
  const [filteredItems, setFilteredItems] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState({
    status: 0,
    month: 0,
    name: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      let response
      if (USE_MOCK_DATA) {
        // Використовуємо мокап дані
        response = await getMockData()
      } else {
        // Використовуємо справжній API
        response = await fetchData('', '/calcs-api')
      }
      
      if (response.status === 'success') {
        if (Object.keys(response.data).length > 0) {
          setData(response.data)
          setFilteredItems(response.data)
        } else {
          setError('Немає даних для відображення')
        }
      } else {
        setError('База даних в процесі оновлення, спробуйте через кілька хвилин')
      }
    } catch (err) {
      setError('Помилка завантаження даних')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredItems = (statusFilter, monthFilter, nameFilter) => {
    if (!data) return {}

    let filtered = { ...data }

    // Filter by status
    if (statusFilter !== 0) {
      const statusMap = {
        '1': 'Новий',
        '2': 'В обробці',
        '3': 'Очикуємо оплату',
        '4': 'Підтверджений',
        '5': 'Очикуємо підтвердження',
        '6': 'У виробництві',
        '7': 'Готовий',
        '8': 'Відвантажений',
        '9': 'Відмова'
      }

      const targetStatus = statusMap[statusFilter]
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([key, item]) => {
          // Check if item has orders with target status
          if (item.items && Object.keys(item.items).length > 0) {
            return Object.values(item.items).some(
              order => order.internals?.Статус === targetStatus
            )
          }
          return targetStatus === 'Новий'
        })
      )
    }

    // Filter by month
    if (monthFilter !== 0) {
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([key, item]) => {
          const calcDate = new Date(item.internals?.ДатаПросчета)
          return (calcDate.getMonth() + 1) === parseInt(monthFilter)
        })
      )
    }

    // Filter by name/search
    if (nameFilter) {
      const query = nameFilter.toLowerCase()
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([key, item]) => {
          const calcNumber = item.internals?.name?.toLowerCase() || ''
          return calcNumber.includes(query)
        })
      )
    }

    return filtered
  }

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    const filtered = getFilteredItems(
      newFilter.status,
      newFilter.month,
      newFilter.name
    )
    setFilteredItems(filtered)
  }

  const getStatusSummary = () => {
    if (!data) return {}

    const summary = {
      'Всі': 0,
      'Новий': 0,
      'В обробці': 0,
      'Очикуємо оплату': 0,
      'Підтверджений': 0,
      'Очикуємо підтвердження': 0,
      'У виробництві': 0,
      'Готовий': 0,
      'Відвантажений': 0,
      'Відмова': 0
    }

    Object.values(data).forEach(item => {
      summary['Всі'] += 1

      if (item.items && Object.keys(item.items).length > 0) {
        Object.values(item.items).forEach(order => {
          const status = order.internals?.Статус
          if (status && summary.hasOwnProperty(status)) {
            summary[status] += 1
          }
        })
      } else {
        summary['Новий'] += 1
      }
    })

    return summary
  }

  if (loading) {
    return <div className="loading-spinner">Завантаження...</div>
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <h3>Помилка</h3>
        <p>{error}</p>
        <button onClick={loadData} className="btn btn-primary">
          Спробувати знову
        </button>
      </div>
    )
  }

  return (
    <section className="portal-section">
      <div className="portal-container">
        <FilterBar
          filter={filter}
          onFilterChange={handleFilterChange}
          statusSummary={getStatusSummary()}
        />

        <CalculationList items={filteredItems} />

        <PaginationBar
          filter={filter}
          onFilterChange={handleFilterChange}
          data={data}
        />
      </div>
    </section>
  )
}

export default Portal
