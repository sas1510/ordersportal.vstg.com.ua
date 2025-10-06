import React, { useState, useEffect } from 'react'
import { getMockData } from '../../services/mockData'
import {CalculationItem2} from '../Orders1/OrderComponents'
import './PortalOriginal.css'

const PortalOriginal = () => {
  const [data, setData] = useState(null)
  const [filteredItems, setFilteredItems] = useState({})
  const [filter, setFilter] = useState({
    status: 0,
    month: 0,
    name: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const response = await getMockData()
      if (response.status === 'success') {
        setData(response.data)
        setFilteredItems(response.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusSummary = () => {
    if (!data) return {}
    const summary = {
      'Всі': 0,
      'Новій': 0,
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
        summary['Новій'] += 1
      }
    })
    return summary
  }

  const getMonthSummary = () => {
    if (!data) return {}
    const summary = {}
    for (let i = 1; i <= 12; i++) summary[i] = 0

    Object.values(data).forEach(item => {
      const calcDate = new Date(item.internals?.ДатаПросчета)
      const month = calcDate.getMonth() + 1
      if (summary.hasOwnProperty(month)) {
        summary[month] += 1
      }
    })
    return summary
  }

  const handleFilterClick = (value) => {
    setFilter({ ...filter, status: value })
    const filtered = getFilteredItems(value, filter.month, filter.name)
    setFilteredItems(filtered)
  }

  const handleMonthClick = (month) => {
    const newMonth = filter.month === month ? 0 : month
    setFilter({ ...filter, month: newMonth })
    const filtered = getFilteredItems(filter.status, newMonth, filter.name)
    setFilteredItems(filtered)
  }

  const handleSearchChange = (e) => {
    const name = e.target.value
    setFilter({ ...filter, name })
    const filtered = getFilteredItems(filter.status, filter.month, name)
    setFilteredItems(filtered)
  }

  const handleClearSearch = () => {
    setFilter({ ...filter, name: '' })
    const filtered = getFilteredItems(filter.status, filter.month, '')
    setFilteredItems(filtered)
  }

  const getFilteredItems = (statusFilter, monthFilter, nameFilter) => {
    if (!data) return {}
    let filtered = { ...data }

    if (statusFilter !== 0) {
      const statusMap = {
        1: 'Новій',
        2: 'В обробці',
        3: 'Очикуємо оплату',
        4: 'Підтверджений',
        5: 'Очикуємо підтвердження',
        6: 'У виробництві',
        7: 'Готовий',
        8: 'Відвантажений',
        9: 'Відмова'
      }
      const targetStatus = statusMap[statusFilter]
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([key, item]) => {
          if (item.items && Object.keys(item.items).length > 0) {
            return Object.values(item.items).some(
              order => order.internals?.Статус === targetStatus
            )
          }
          return targetStatus === 'Новій'
        })
      )
    }

    if (monthFilter !== 0) {
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([key, item]) => {
          const calcDate = new Date(item.internals?.ДатаПросчета)
          return (calcDate.getMonth() + 1) === parseInt(monthFilter)
        })
      )
    }

    if (nameFilter) {
      const query = nameFilter.toLowerCase()
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([key, item]) => {
          const calcName = item.internals?.name?.toLowerCase() || ''
          if (calcName.includes(query)) return true
          
          if (item.items) {
            return Object.values(item.items).some(order => {
              const orderName = order.internals?.Название?.toLowerCase() || ''
              return orderName.includes(query)
            })
          }
          return false
        })
      )
    }

    return filtered
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('uk-UA')
  }

  const sortedItems = Object.values(filteredItems).sort((a, b) => {
    const dateA = new Date(a.internals?.ДатаПросчета)
    const dateB = new Date(b.internals?.ДатаПросчета)
    return dateB - dateA
  })

  const statusSummary = getStatusSummary()
  const monthSummary = getMonthSummary()

  if (loading) {
    return <div className="loading-spinner">Завантаження...</div>
  }

  return (
    <>
      <div className="portal-header row">
        <div className="logo w-15 align-center"></div>
        <div className="row menu w-100 align-center">
          <ul>
            <li className="row align-center w-100 menu-item active">
              <span className="icon icon-calculator font-size-24"></span>
              <span>Прорахунки</span>
            </li>
          </ul>
        </div>
        <div className="row profile w-25 left">
          <div className="column w-100 gap-3">
            <div className="row w-100 gap-14 border-bottom align-center">
              <div className="icon icon-user right font-size-20 text-info"></div>
              <div className="name w-100 no-wrap">Тестовий користувач</div>
            </div>
            <div className="row w-100 gap-14 align-center">
              <div className="icon icon-coin-dollar right font-size-20 text-success"></div>
              <div className="balance w-100 text-warning font-size-20 no-wrap">
                0 грн
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="column portal-body">
        <div className="content-summary row w-100">
          <div className="year-selector row gap-14">
            <span>Звітний рік:</span>
            <span className="icon icon-calendar2 font-size-24 text-info"></span>
            <select name="year" id="year">
              <option value="2025" selected>2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
          <div className="by-month-pagination-wrapper">
            <ul className="gap-7 row no-wrap" id="by-month-pagination">
              <li 
                className={`pagination-item ${filter.month === 0 ? 'active' : ''}`}
                onClick={() => handleMonthClick(0)}
              >
                Весь рік
              </li>
              {[
                { num: 1, label: 'Січ.' },
                { num: 2, label: 'Лют.' },
                { num: 3, label: 'Бер.' },
                { num: 4, label: 'Квіт.' },
                { num: 5, label: 'Трав.' },
                { num: 6, label: 'Черв.' },
                { num: 7, label: 'Лип.' },
                { num: 8, label: 'Сер.' },
                { num: 9, label: 'Вер.' },
                { num: 10, label: 'Жов.' },
                { num: 11, label: 'Лис.' },
                { num: 12, label: 'Груд.' }
              ].map(month => (
                <li
                  key={month.num}
                  className={`pagination-item ${filter.month === month.num ? 'active' : ''} ${monthSummary[month.num] === 0 ? 'disabled' : ''}`}
                  onClick={() => monthSummary[month.num] > 0 && handleMonthClick(month.num)}
                >
                  {month.label} <span className="text-grey">({monthSummary[month.num] || 0})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="content-wrapper row w-100 h-100">
          <div className="content-filter column">
            <input
              type="text"
              className="search-orders"
              placeholder="номер прорахунку, замовлення"
              name="search"
              value={filter.name}
              onChange={handleSearchChange}
            />
            <span
              className="icon icon-cancel2 font-size-24 clear-search"
              title="Очистити пошук"
              onClick={handleClearSearch}
            ></span>
            <ul className="filter column align-center">
              <li className="delimiter"></li>
              <li className={`filter-item ${filter.status === 0 ? 'active' : ''}`} onClick={() => handleFilterClick(0)}>
                <span className="icon icon-calculator font-size-24"></span>
                <span className="w-100">Всі прорахунки</span>
                <span>{statusSummary['Всі']}</span>
              </li>
              <li className={`filter-item ${filter.status === 1 ? 'active' : ''}`} onClick={() => handleFilterClick(1)}>
                <span className="icon icon-bolt font-size-24"></span>
                <span className="w-100">Очикують обробки</span>
                <span className={statusSummary['Новій'] === 0 ? 'disabled' : ''}>{statusSummary['Новій']}</span>
              </li>
              <li className={`filter-item ${filter.status === 2 ? 'active' : ''}`} onClick={() => handleFilterClick(2)}>
                <span className="icon icon-spin-alt font-size-24"></span>
                <span className="w-100">В обробці</span>
                <span className={statusSummary['В обробці'] === 0 ? 'disabled' : ''}>{statusSummary['В обробці']}</span>
              </li>
              <li className={`filter-item ${filter.status === 3 ? 'active' : ''}`} onClick={() => handleFilterClick(3)}>
                <span className="icon icon-coin-dollar font-size-24"></span>
                <span className="w-100">Очикують оплату</span>
                <span className={statusSummary['Очикуємо оплату'] === 0 ? 'disabled' : ''}>{statusSummary['Очикуємо оплату']}</span>
              </li>
              <li className={`filter-item ${filter.status === 4 ? 'active' : ''}`} onClick={() => handleFilterClick(4)}>
                <span className="icon icon-checkmark font-size-24"></span>
                <span className="w-100">Підтверджені</span>
                <span className={statusSummary['Підтверджений'] === 0 ? 'disabled' : ''}>{statusSummary['Підтверджений']}</span>
              </li>
              <li className={`filter-item ${filter.status === 5 ? 'active' : ''}`} onClick={() => handleFilterClick(5)}>
                <span className="icon icon-question font-size-24"></span>
                <span className="w-100">Очикують підтвердження</span>
                <span className={statusSummary['Очикуємо підтвердження'] === 0 ? 'disabled' : ''}>{statusSummary['Очикуємо підтвердження']}</span>
              </li>
              <li className={`filter-item ${filter.status === 6 ? 'active' : ''}`} onClick={() => handleFilterClick(6)}>
                <span className="icon icon-cog font-size-24"></span>
                <span className="w-100">У виробництві</span>
                <span className={statusSummary['У виробництві'] === 0 ? 'disabled' : ''}>{statusSummary['У виробництві']}</span>
              </li>
              <li className={`filter-item ${filter.status === 7 ? 'active' : ''}`} onClick={() => handleFilterClick(7)}>
                <span className="icon icon-checkmark2 font-size-24"></span>
                <span className="w-100">Готові</span>
                <span className={statusSummary['Готовий'] === 0 ? 'disabled' : ''}>{statusSummary['Готовий']}</span>
              </li>
              <li className={`filter-item ${filter.status === 8 ? 'active' : ''}`} onClick={() => handleFilterClick(8)}>
                <span className="icon icon-truck font-size-24"></span>
                <span className="w-100">Відвантажені</span>
                <span className={statusSummary['Відвантажений'] === 0 ? 'disabled' : ''}>{statusSummary['Відвантажений']}</span>
              </li>
              <li className={`filter-item ${filter.status === 9 ? 'active' : ''}`} onClick={() => handleFilterClick(9)}>
                <span className="icon icon-cancel font-size-24"></span>
                <span className="w-100">Відмова</span>
                <span className={statusSummary['Відмова'] === 0 ? 'disabled' : ''}>{statusSummary['Відмова']}</span>
              </li>
            </ul>
          </div>

          <div className="content" id="content">
            <div className="items-wrapper column gap-14" id="items-wrapper">
              {sortedItems.length === 0 ? (
                <div className="no-data column align-center h-100">
                  <div className="font-size-24 text-grey">Немає прорахунків для відображення</div>
                </div>
              ) : (
                sortedItems.map((calc, index) => (
                  <CalculationItem2 key={index} calc={calc} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="column portal-footer align-center">
        <span>© 2015-2025 Вікна Стиль. Всі права захищені.</span>
      </div>
    </>
  )
}




export default PortalOriginal
