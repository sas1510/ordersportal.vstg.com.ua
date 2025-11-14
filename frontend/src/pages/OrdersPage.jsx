
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axiosInstance from '../api/axios';
// Припускаємо, що ви обгорнули CalculationItem/Mobile в React.memo для продуктивності
import { CalculationItem } from '../components/Orders/OrderComponents'; 
import { CalculationItemMobile } from '../components/Orders/CalculationItemMobile';
import '../components/Portal/PortalOriginal.css';
import AddOrderModal from '../components/Orders/AddOrderModal';
import NewCalculationModal from '../components/Orders/NewCalculationModal';
import DealerSelectModal from '../components/Orders/DealerSelectModal'; 
import useWindowWidth from '../hooks/useWindowWidth';
import { useTheme } from '../context/ThemeContext';


const PortalOriginal = () => {
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [calculationsData, setCalculationsData] = useState([]);
  // Видалено: const [filteredItems, setFilteredItems] = useState([]);
  const [filter, setFilter] = useState({ status: 'Всі', month: 0, name: '' }); 
  const [selectedYear, setSelectedYear] = useState('2025');
  const [loading, setLoading] = useState(true);
  const [expandedCalc, setExpandedCalc] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDealerModal, setShowDealerModal] = useState(false);
  const [dealer, setDealer] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 1024;
  const { theme, toggleTheme } = useTheme();

  // --- Мемоїзація функцій-обробників за допомогою useCallback ---
  
  const handleDealerSelect = useCallback((selectedDealer) => {
    if (selectedDealer === null) {
      setDealer(null);
      localStorage.removeItem('dealerId');
    } else {
      setDealer(selectedDealer);
      localStorage.setItem('dealerId', selectedDealer.id);
    }
    setShowDealerModal(false);
  }, []);

  // ОНОВЛЕНО: Працюємо лише з calculationsData, useMemo зробить фільтрацію
  const handleDeleteCalculation = useCallback((calcId) => {
    setCalculationsData(prev => prev.filter(calc => calc.id !== calcId));
  }, []);

  // ОНОВЛЕНО: Працюємо лише з calculationsData
  const handleUpdateCalculation = useCallback((updatedCalc) => {
    setCalculationsData(prev =>
      prev.map(calc => calc.id === updatedCalc.id ? updatedCalc : calc)
    );
  }, []);

  const handleAddClick = useCallback(() => setIsModalOpen(true), []);
  const handleClose = useCallback(() => setIsModalOpen(false), []);
  const handleSave = useCallback((newOrder) => {
    console.log("Новий прорахунок:", newOrder);
  }, []);
  
  const handleSaveCalculation = useCallback((newCalc) => {
    const formattedCalc = {
      id: newCalc.id || Math.random().toString(36).substr(2, 9),
      number: newCalc.name || `Прорахунок ${calculationsData.length + 1}`,
      dateRaw: newCalc.dateRaw || new Date().toISOString(),
      date: new Date(newCalc.dateRaw || new Date()).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' }),
      orders: [],
      orderCountInCalc: 0,
      constructionsCount: newCalc.ConstructionsCount || 0,
      constructionsQTY: newCalc.ConstructionsCount || 0,
      statuses: {},
      amount: 0,
      file: newCalc.file || null,
      message: newCalc.Comment || ''
    };

    setCalculationsData(prev => [formattedCalc, ...prev]);
    // Тригер для перерахунку memoizedFilteredAndSortedItems
    setFilter(prev => ({ ...prev }));
    setIsCalcModalOpen(false);
  }, [calculationsData.length]);

  const toggleCalc = useCallback((id) => setExpandedCalc(prev => prev === id ? null : id), []);
  const toggleOrder = useCallback((id) => setExpandedOrder(prev => prev === id ? null : id), []);

  // --- Мемоїзація дорогих обчислень за допомогою useMemo ---

  // 1. Обчислення зведеної статистики за статусами
  const statusSummary = useMemo(() => {
    const summary = { 'Всі': 0, 'Новий': 0, 'В обробці': 0, 'Очікуємо оплату': 0, 'Підтверджений': 0, 'Очікуємо підтвердження': 0, 'У виробництві': 0, 'Готовий': 0, 'Відвантажений': 0, 'Відмова': 0 };

    calculationsData.forEach(calc => {
      summary['Всі'] += calc.orders.length; 
      
      if (calc.orders.length === 0) {
          summary['Новий'] += 1;
      }
      
      calc.orders.forEach(order => {
        if (order.status && summary.hasOwnProperty(order.status)) {
          summary[order.status] += 1;
        }
      });
    });

    return summary;
  }, [calculationsData]);

  // 2. Обчислення зведеної статистики за місяцями
  const monthSummary = useMemo(() => {
    const summary = {};
    for (let i = 1; i <= 12; i++) summary[i] = 0;

    calculationsData.forEach(calc => {
      if (!calc.dateRaw) return;
      const date = new Date(calc.dateRaw);
      if (isNaN(date.getTime())) return;
      const month = date.getMonth() + 1;
      summary[month] += 1;
    });

    return summary;
  }, [calculationsData]);
  
  // 3. Функція фільтрації (для useMemo)
  const getFilteredItems = useCallback((statusFilter, monthFilter, nameFilter) => {
    let filtered = [...calculationsData];
    
    // Фільтр за статусом
    if (statusFilter && statusFilter !== 'Всі') {
      filtered = filtered.filter(calc => {
        if (calc.orders.length === 0) return statusFilter === 'Новий';
        return calc.orders.some(order => order.status === statusFilter);
      });
    }
    
    // Фільтр за місяцем
    if (monthFilter !== 0) {
      filtered = filtered.filter(calc => {
        if (!calc.dateRaw) return false;
        const date = new Date(calc.dateRaw);
        if (isNaN(date.getTime())) return false;
        const month = date.getMonth() + 1;
        return month === monthFilter;
      });
    }
    
    // Фільтр за назвою/номером
    if (nameFilter) {
      const query = nameFilter.toLowerCase();
      filtered = filtered.filter(calc => {
        if (calc.number.toLowerCase().includes(query)) return true;
        return calc.orders.some(order => order.number?.toLowerCase().includes(query));
      });
    }
    return filtered;
  }, [calculationsData]);

  // 4. Мемоїзація відфільтрованого списку та його сортування
  const memoizedFilteredAndSortedItems = useMemo(() => {
      // Викликаємо мемоїзовану функцію фільтрації
      const filtered = getFilteredItems(filter.status, filter.month, filter.name);
      
      // Сортування
      return filtered.sort((a, b) => new Date(b.dateRaw) - new Date(a.dateRaw));
  }, [filter, getFilteredItems]);
  
  // --- Обробники фільтрації, що оновлюють лише state `filter` ---
  
  const handleFilterClick = useCallback((statusKey) => {
    setFilter(prev => ({ ...prev, status: statusKey }));
  }, []);

  // ✅ ВИПРАВЛЕНО: Використовуємо функціональну форму, щоб уникнути залежності від filter.month
  const handleMonthClick = useCallback((month) => {
    setFilter(prev => {
        const newMonth = prev.month === month ? 0 : month;
        return { ...prev, month: newMonth };
    });
  }, []); 

  const handleSearchChange = useCallback((e) => {
    const name = e.target.value;
    setFilter(prev => ({ ...prev, name }));
  }, []);

  const handleClearSearch = useCallback(() => {
    setFilter(prev => ({ ...prev, name: '' }));
  }, []);
  
  // --- useEffect-и ---
  
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'customer' && !dealer) {
      setShowDealerModal(true);
    }
  }, [dealer]);


  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'customer' && !dealer) {
      setShowDealerModal(true);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const params = { year: selectedYear };
        if (dealer?.id) params.customer_id = dealer.id;

        const response = await axiosInstance.get("/get_orders_info/", { params });
        if (response.data?.status === "success") {
          const formattedCalcs = response.data.data.calculation || [];
          setCalculationsData(formattedCalcs);
          // Тригер для перерахунку memoizedFilteredAndSortedItems
          setFilter(prev => ({ ...prev })); 
        } else {
          setCalculationsData([]);
        }
      } catch (error) {
        console.error("Помилка запиту:", error);
        setCalculationsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, dealer]);


  if (loading) 
    return (
      <div className="loading-spinner-wrapper">
        <div className="loading-spinner"></div>
        <div className="loading-text">Завантаження...</div>
      </div>
    );

  // Використовуємо мемоїзований список
  const sortedItems = memoizedFilteredAndSortedItems; 

  return (
    <div className="column portal-body">

      {showDealerModal && (
        <DealerSelectModal
          isOpen={showDealerModal}
          onClose={() => setShowDealerModal(false)}
          onSelect={handleDealerSelect}
        />
      )}

      <div className="content-summary row w-100">
        <div 
          className="mobile-sidebar-toggle" 
          onClick={() => setIsSidebarOpen(true)} 
          style={{marginTop: '10px'}}
        >
          <span className="icon icon-menu font-size-24"></span>
        </div>
      
        <div className="year-selector row">
          <span>Звітний рік:</span>
          <span className="icon icon-calendar2 font-size-24 text-info"></span>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>

        <div className="by-month-pagination-wrapper">
          {/* Для великих екранів — список місяців */}
          <ul className="gap-6 row no-wrap month-list">
            <li className={`pagination-item ${filter.month === 0 ? 'active' : ''}`} onClick={() => handleMonthClick(0)}>
              Весь рік
            </li>
            {Array.from({ length: 12 }, (_, i) => {
              const num = i + 1;
              const labels = ['Січ.', 'Лют.', 'Бер.', 'Квіт.', 'Трав.', 'Черв.', 'Лип.', 'Сер.', 'Вер.', 'Жов.', 'Лис.', 'Груд.'];
              return (
                <li
                  key={num}
                  className={`pagination-item ${filter.month === num ? 'active' : ''} ${monthSummary[num] === 0 ? 'disabled' : ''}`}
                  onClick={() => monthSummary[num] > 0 && handleMonthClick(num)}
                >
                  {labels[i]} <span className="text-grey">({monthSummary[num]})</span>
                </li>
              );
            })}
          </ul>

          {/* Для малих екранів — випадаючий список */}
          <select
            className="month-select"
            value={filter.month}
            // Використовуємо handleMonthClick, який тепер коректно обробляє кліки
            onChange={(e) => handleMonthClick(Number(e.target.value))}
          >
            <option value={0}>Весь рік</option>
            {Array.from({ length: 12 }, (_, i) => {
              const num = i + 1;
              const labels = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
              return (
                <option key={num} value={num} disabled={monthSummary[num] === 0}>
                  {labels[i]} ({monthSummary[num]})
                </option>
              );
            })}
          </select>
        </div>

      </div>

      <div className="content-wrapper row w-100 h-100">
        <div className={`content-filter column ${isSidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header row ai-center jc-space-between">
            {isSidebarOpen && <span>Фільтри</span>}
            {isSidebarOpen && (
              <span className="icon icon-cross" onClick={() => setIsSidebarOpen(false)}></span>
            )}
          </div>

          <div className="search-wrapper">
            <input
              type="text"
              className="search-orders"
              placeholder="номер прорахунку, замовлення"
              value={filter.name}
              onChange={handleSearchChange}
            />
            <span className="icon icon-cancel2 clear-search" title="Очистити пошук" onClick={handleClearSearch}></span>
          </div>

          {localStorage.getItem('role') !== 'customer' && (
            <div>
              <div className="delimiter1"/>
              <ul className="buttons">
                <li className="btn btn-select-dealer" onClick={() => setShowDealerModal(true)}>
                  <span className="icon icon-user-check"></span>
                  <span className="uppercase">Вибрати дилера</span>
                </li>
              </ul>
            </div>
          )}

          <div className="delimiter1"></div> 
          <ul className="buttons">
            <li className="btn btn-add-calc" onClick={() => setIsCalcModalOpen(true)}>
              <span className="icon icon-plus3"></span>
              <span className="uppercase">Новий прорахунок</span>
            </li>
          </ul>

          <AddOrderModal
            isOpen={isModalOpen}
            onClose={handleClose}
            onSave={handleSave}
          />

          <ul className="filter column align-center">
            <li className="delimiter1"></li>
            {[
              { id: "all", label: "Всі прорахунки", icon: "icon-calculator", statusKey: "Всі" },
              { id: "new", label: "Нові прорахунки", icon: "icon-bolt", statusKey: "Новий" },
              { id: "processing", label: "В обробці", icon: "icon-spin-alt", statusKey: "В обробці" },
              { id: "waiting-payment", label: "Очікують оплату", icon: "icon-coin-dollar", statusKey: "Очікуємо оплату" },
              { id: "waiting-confirm", label: "Очікують підтвердження", icon: "icon-clipboard", statusKey: "Очікуємо підтвердження" },
              { id: "confirmed", label: "Підтверджені", icon: "icon-check", statusKey: "Підтверджений" },
              { id: "production", label: "Замовлення у виробництві", icon: "icon-cogs", statusKey: "У виробництві" },
              { id: "ready", label: "Готові замовлення", icon: "icon-layers2", statusKey: "Готовий" },
              { id: "delivered", label: "Доставлені замовлення", icon: "icon-shipping", statusKey: "Відвантажений" },
              { id: "rejected", label: "Відмова", icon: "icon-circle-with-cross", statusKey: "Відмова" }
            ].map(({ id, label, icon, statusKey }) => (
              <li
                key={id}
                className={`filter-item ${filter.status === statusKey ? 'active' : ''}`}
                onClick={() => handleFilterClick(statusKey)}
              >
                <span className={`icon ${icon} font-size-24`}></span>
                <span className="w-100">{label}</span>
                <span className={statusSummary[statusKey] === 0 ? 'disabled' : ''}>
                  {statusSummary[statusKey]}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="content" id="content">
          <div className="items-wrapper column gap-14" id="items-wrapper">
            {sortedItems.length === 0 ? (
              <div className="no-data column align-center h-100">
                <div className="font-size-24 text-grey">Немає прорахунків для відображення</div>
              </div>
            ) : (
              sortedItems.map((calc) => (
                
                isMobile ? (
                  <CalculationItemMobile 
                    key={calc.id}
                    calc={calc}
                    isExpanded={expandedCalc === calc.id}
                    onToggle={toggleCalc}
                    expandedOrderId={expandedOrder}
                    onOrderToggle={toggleOrder}
                    onDelete={handleDeleteCalculation}
                    onEdit={handleUpdateCalculation}  
                  />
                ) : (
                  <CalculationItem 
                    key={calc.id}
                    calc={calc}
                    isExpanded={expandedCalc === calc.id}
                    onToggle={toggleCalc}
                    expandedOrderId={expandedOrder}
                    onOrderToggle={toggleOrder}
                    onDelete={handleDeleteCalculation}
                    onEdit={handleUpdateCalculation}  
                  />
                )

              ))
            )}
          </div>
        </div>
      </div>    

      <NewCalculationModal 
        isOpen={isCalcModalOpen} 
        onClose={() => setIsCalcModalOpen(false)} 
        onSave={handleSaveCalculation} 
      />
    </div>
  );
};

export default PortalOriginal;
