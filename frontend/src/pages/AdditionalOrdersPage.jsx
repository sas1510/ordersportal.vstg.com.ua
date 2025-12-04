import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios'; 
import '../components/Portal/PortalOriginal.css';
import { AdditionalOrderItem} from '../components/AdditionalOrder/AdditionalOrderItem'; 
import { AdditionalOrderItemMobile } from '../components/AdditionalOrder/AdditionalOrderItemMobile'; 
import AddReorderModal from '../components/Orders/AddReorderModal'; 
import DealerSelectModal from '../components/Orders/DealerSelectModal';
import useWindowWidth from '../hooks/useWindowWidth';
import { useTheme } from '../context/ThemeContext';

// --- MOCK DATA (ЗАЛИШАЄМО, АЛЕ НЕ ВИКОРИСТОВУЄМО) ---
const mockAdditionalOrdersData = [
  // ... (ваш мок-код тут)
];
// --- END MOCK DATA ---

// Константа для ліміту відображення
const initialLimit = 100;

// Перейменовуємо компонент
const AdditionalOrders = () => {
  // Перейменовуємо змінні, пов'язані з "Прорахунками" на "Додаткові Замовлення"
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false); // Замість isCalcModalOpen
  const [additionalOrdersData, setAdditionalOrdersData] = useState([]); // Замість calculationsData
  const [filteredItems, setFilteredItems] = useState([]);
  const [filter, setFilter] = useState({ status: 'Всі', month: 0, name: '' });
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear())); // Виправлено на String
  const [loading, setLoading] = useState(true);
  const [expandedAdditionalOrder, setExpandedAdditionalOrder] = useState(null); // Замість expandedCalc
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDealerModal, setShowDealerModal] = useState(false);
  const [dealer, setDealer] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(initialLimit); // СТАН ДЛЯ ПАГІНАЦІЇ
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 1024;
  const { theme, toggleTheme } = useTheme();

    // --- ІНІЦІАЛІЗАЦІЯ ДИЛЕРА ТА ЕФЕКТИ (ОБ'ЄДНАНО) ---
    useEffect(() => {
        const role = localStorage.getItem('role');
        const savedDealerId = localStorage.getItem('dealerId');

        if (savedDealerId) {
            setDealer({ id: savedDealerId, name: 'Saved Dealer' });
        } else if (role !== 'customer') {
            // Якщо роль не customer і дилера немає, відкриваємо модалку.
            // Це відбудеться один раз при ініціалізації
            setShowDealerModal(true); 
        }
    }, []); // Викликається лише при монтуванні


  const handleDealerSelect = (selectedDealer) => {
    if (selectedDealer === null) {
      setDealer(null);
      localStorage.removeItem('dealerId');
    } else {
      setDealer(selectedDealer);
      localStorage.setItem('dealerId', selectedDealer.id);
    }
    setShowDealerModal(false);
  };

  // Додаємо в компонент AdditionalOrders
  const handleDeleteAdditionalOrder = (additionalOrderId) => { // Замість handleDeleteCalculation
    // Видаляємо додаткове замовлення з state
    setAdditionalOrdersData(prev => prev.filter(ord => ord.id !== additionalOrderId));
    setFilteredItems(prev => prev.filter(ord => ord.id !== additionalOrderId));
    // Скидаємо ліміт відображення, щоб уникнути помилок після видалення
    setDisplayLimit(initialLimit); 
  };

  const handleUpdateAdditionalOrder = (updatedOrder) => { // Замість handleUpdateCalculation
    setAdditionalOrdersData(prev =>
      prev.map(ord => ord.id === updatedOrder.id ? updatedOrder : ord)
    );
    setFilteredItems(prev =>
      prev.map(ord => ord.id === updatedOrder.id ? updatedOrder : ord)
    );
  };

  const handleAddClick = () => setIsModalOpen(true);
  const handleClose = () => setIsModalOpen(false);

  const handleSave = (newOrder) => {
    console.log("Нове замовлення:", newOrder);
  };

  const handleSaveAdditionalOrder = (newOrder) => { // Замість handleSaveCalculation
    const formattedOrder = {
      id: newOrder.id || Math.random().toString(36).substr(2, 9),
      number: newOrder.name || `${additionalOrdersData.length + 1}`,
      dateRaw: newOrder.dateRaw || new Date().toISOString(),
      date: newOrder.dateRaw || new Date().toISOString(),
      orders: [],
      orderCountInCalc: 0,
      constructionsCount: newOrder.ConstructionsCount || 0,
      constructionsQTY: newOrder.ConstructionsCount || 0,
      statuses: {},
      amount: 0,
      file: newOrder.file || null,
      message: newOrder.Comment || ''
    };

    setAdditionalOrdersData(prev => [formattedOrder, ...prev]);
    setFilteredItems(prev => [formattedOrder, ...prev]);
    setIsNewOrderModalOpen(false); // Закриваємо модалку Додаткового Замовлення
    setDisplayLimit(initialLimit); // Скидаємо ліміт при додаванні нового
  };

  const formatDateHuman = (dateStr) => {
    if (!dateStr) return null;
    try {
        const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
        if (isNaN(date)) return dateStr;
        return date.toLocaleDateString('uk-UA', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        return dateStr;
    }
  };

  // --- API CALL LOGIC (ОНОВЛЕНО: ВИКОРИСТАННЯ ABORTCONTROLLER) ---
  useEffect(() => {
    // 1. Ініціалізація AbortController
    const controller = new AbortController();
    const signal = controller.signal;

    const role = localStorage.getItem('role');
    const contractorId = dealer?.id;
    
    // Якщо не customer і дилер не обраний, блокуємо завантаження
    if (role !== 'customer' && !contractorId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      const url = `/get_additional_orders_info/?year=${selectedYear}`; 
      
      try {
        // 2. Передача сигналу в запит
        const response = await axiosInstance.get(url, { signal });
        
        // Перевірка на скасування перед оновленням стану
        if (signal.aborted) return;

        if (response.data?.status === "success") {
            const rawData = response.data.data?.calculation || [];

            const allOrders = rawData.map(item => ({
                ...item,
                date: formatDateHuman(item.dateRaw), // Форматована дата
                orders: item.orders.map(order => ({
                    ...order,
                    date: formatDateHuman(order.dateRaw),
                })),
            }));

            setAdditionalOrdersData(allOrders);
            setFilteredItems(getFilteredItems(filter.status, filter.month, filter.name, allOrders));
        } else {
            setAdditionalOrdersData([]);
            setFilteredItems([]);
        }
      } catch (error) {
        // Ігноруємо помилки скасування
        if (axiosInstance.isCancel(error) || error.name === 'AbortError') {
          console.log("Запит додаткових замовлень скасовано (Abort).");
        } else {
          console.error("Помилка запиту додаткових замовлень:", error);
          if (!signal.aborted) { // Перевірка, щоб не оновлювати стан, якщо було скасовано
            setAdditionalOrdersData([]);
            setFilteredItems([]);
          }
        }
      } finally {
        // Оновлюємо setLoading лише, якщо запит не був скасований
        if (!signal.aborted) {
          setLoading(false);
          setDisplayLimit(initialLimit); // Скидаємо ліміт при новому завантаженні даних
        }
      }
    };

    fetchData();

    // 3. Функція очищення (Cleanup): скасовує запит перед наступним виконанням useEffect
    return () => {
      controller.abort();
    };
  }, [selectedYear, dealer]);
  // --- END API CALL LOGIC ---


  const getStatusSummary = () => {
    // 🔥 ОНОВЛЕНИЙ СПИСОК СТАТУСІВ З УРАХУВАННЯМ SQL
    const summary = { 
        'Всі': 0, 
        'Новий': 0, 
        'В роботі': 0, 
        'Очікуємо оплату': 0, 
        'Підтверджений': 0, 
        'Очікуємо підтвердження': 0, 
        'У виробництві': 0, 
        // 'На складі': 0, // Додано
        // 'Вирішено': 0, // Додано
        'Готовий': 0, 
        // 'Відвантажений': 0, 
        'Доставлено': 0, // Додано
        'Відмова': 0
    };

    additionalOrdersData.forEach(additionalOrder => { 
      if (additionalOrder.orders.length === 0) summary['Новий'] += 1;
      summary['Всі'] += additionalOrder.orders.length;
      additionalOrder.orders.forEach(order => {
        if (order.status && summary.hasOwnProperty(order.status)) summary[order.status] += 1;
      });
    });
    summary['Всі'] = additionalOrdersData.length; // Коректний підсумок для верхнього рівня
    return summary;
  };

  const getMonthSummary = () => {
    const summary = {};
    for (let i = 1; i <= 12; i++) summary[i] = 0;

    additionalOrdersData.forEach(additionalOrder => { 
      if (!additionalOrder.dateRaw) return;
      const month = new Date(additionalOrder.dateRaw).getMonth() + 1;
      summary[month] += 1;
    });

    return summary;
  };

  const statusSummary = getStatusSummary();
  const monthSummary = getMonthSummary();

  // Оновлено, щоб приймати опціонально список даних
  const getFilteredItems = (statusFilter, monthFilter, nameFilter, data = additionalOrdersData) => {
    let filtered = [...data]; // Використовуємо надані дані

    if (statusFilter && statusFilter !== 'Всі') {
      filtered = filtered.filter(additionalOrder => {
        if (additionalOrder.orders.length === 0) return statusFilter === 'Новий';
        return additionalOrder.orders.some(order => order.status === statusFilter);
      });
    }
    if (monthFilter !== 0) {
      filtered = filtered.filter(additionalOrder => {
        const date = new Date(additionalOrder.dateRaw);
        return !isNaN(date) && date.getMonth() + 1 === monthFilter;
      });
    }
    if (nameFilter) {
      const query = nameFilter.toLowerCase();
      filtered = filtered.filter(additionalOrder =>
        additionalOrder.number.toLowerCase().includes(query) ||
        additionalOrder.mainOrderNumber?.toLowerCase().includes(query) || // Додано пошук по основному номеру
        additionalOrder.orders.some(order => order.number?.toLowerCase().includes(query))
      );
    }
    return filtered;
  };

  // --- ОБРОБНИКИ ФІЛЬТРАЦІЇ ---
  const handleFilterClick = (statusKey) => {
    setFilter(prev => ({ ...prev, status: statusKey }));
    // Фільтрація відбувається на `additionalOrdersData`
    setFilteredItems(getFilteredItems(statusKey, filter.month, filter.name));
    setDisplayLimit(initialLimit); // Скидаємо ліміт при зміні фільтра
  };

  const handleMonthClick = (month) => {
    const newMonth = filter.month === month ? 0 : month;
    setFilter(prev => ({ ...prev, month: newMonth }));
    setFilteredItems(getFilteredItems(filter.status, newMonth, filter.name));
    setDisplayLimit(initialLimit); // Скидаємо ліміт при зміні фільтра
  };

  const handleSearchChange = (e) => {
    const name = e.target.value;
    setFilter(prev => ({ ...prev, name }));
    setFilteredItems(getFilteredItems(filter.status, filter.month, name));
    setDisplayLimit(initialLimit); // Скидаємо ліміт при зміні пошуку
  };

  const handleClearSearch = () => {
    setFilter(prev => ({ ...prev, name: '' }));
    setFilteredItems(getFilteredItems(filter.status, filter.month, ''));
    setDisplayLimit(initialLimit); // Скидаємо ліміт при очищенні пошуку
  };
  // ----------------------------
  
  const handleLoadMore = () => { // ФУНКЦІЯ ЗАВАНТАЖЕННЯ НАСТУПНОЇ ПОРЦІЇ
    setDisplayLimit(prev => prev + initialLimit);
  };


  const sortedItems = filteredItems.sort((a, b) => new Date(b.dateRaw) - new Date(a.dateRaw));
  const toggleAdditionalOrder = (id) => setExpandedAdditionalOrder(expandedAdditionalOrder === id ? null : id); // Замість toggleCalc
  const toggleOrder = (id) => setExpandedOrder(expandedOrder === id ? null : id);

  // Елементи для відображення
  const itemsToDisplay = sortedItems.slice(0, displayLimit);
  // Перевірка, чи потрібно показувати кнопку "Завантажити ще"
  const showLoadMoreButton = sortedItems.length > displayLimit;
  
  // Дані для кнопки "Завантажити ще"
  const nextLoadCount = Math.min(initialLimit, sortedItems.length - displayLimit);
  const buttonText = `Завантажити ще (${nextLoadCount} з ${sortedItems.length - displayLimit})`;


  if (loading)
    return (
      <div className="loading-spinner-wrapper">
        <div className="loading-spinner"></div>
        <div className="loading-text">Завантаження...</div>
      </div>
    );

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
        {/* Кнопка-гамбургер для мобільного -- ПЕРЕМІЩЕНО СЮДИ */}
        <div
          className="mobile-sidebar-toggle"
          onClick={() => setIsSidebarOpen(true)}
          style={{ marginTop: '10px' }}
        >
          <span className="icon icon-menu font-size-24"></span>
          {/* Дилер та інформація про тему можуть бути тут для мобільного */}
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
        {/* Sidebar з фільтрами */}
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
              placeholder="номер дод. замовлення"
              value={filter.name}
              onChange={handleSearchChange}
            />
            <span className="icon icon-cancel2 clear-search" title="Очистити пошук" onClick={handleClearSearch}></span>
          </div>

          {localStorage.getItem('role') !== 'customer' && (
            <div>
              <div className="delimiter1" />
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
            <li className="btn btn-add-calc" onClick={() => setIsNewOrderModalOpen(true)}>
              <span className="icon icon-plus3"></span>
              <span className="uppercase">Нове дод. замовлення</span> {/* Змінено текст */}
            </li>
            
          </ul>

          <ul className="filter column align-center">
            <li className="delimiter1"></li>
            {[
              { id: "all", label: "Всі дод. замовлення", icon: "icon-calculator", statusKey: "Всі" }, // Змінено текст
              { id: "new", label: "Нові дод. замовлення", icon: "icon-bolt", statusKey: "Новий" }, // Змінено текст
              { id: "processing", label: "В роботі", icon: "icon-spin-alt", statusKey: "В роботі" },
              { id: "waiting-payment", label: "Очікують оплату", icon: "icon-coin-dollar", statusKey: "Очікуємо оплату" },
              { id: "waiting-confirm", label: "Очікують підтвердження", icon: "icon-clipboard", statusKey: "Очікуємо підтвердження" },
              { id: "confirmed", label: "Підтверджені", icon: "icon-check", statusKey: "Підтверджений" },
              { id: "production", label: "Замовлення у виробництві", icon: "icon-cogs", statusKey: "У виробництві" },
              // { id: "in-stock", label: "На складі", icon: "icon-layers2", statusKey: "На складі" }, // Додано
              // { id: "resolved", label: "Вирішено", icon: "icon-checkmark", statusKey: "Вирішено" }, // Додано
              { id: "ready", label: "Готові замовлення", icon: "icon-layers2", statusKey: "Готовий" },
//               { id: "delivered", label: "Доставлені замовлення", icon: "icon-shipping", statusKey: "Відвантажений" },
              { id: "shipped", label: "Доставлено", icon: "icon-truck", statusKey: "Доставлено" }, // Додано
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

        {/* Основний контент */}
        <div className="content" id="content">
          <div className="items-wrapper column gap-14" id="items-wrapper">
            {sortedItems.length === 0 ? (
              <div className="no-data column align-center h-100">
                <div className="font-size-24 text-grey">Немає додаткових замовлень для відображення</div>
              </div>
            ) : (
              // ВИКОРИСТОВУЄМО itemsToDisplay ДЛЯ ПАГІНАЦІЇ
              itemsToDisplay.map((additionalOrder) => ( 
                isMobile ? (
                  <AdditionalOrderItemMobile // Зберігаємо ім'я компонента, але він тепер відображає Дод. Замовлення
                    key={additionalOrder.id}
                    calc={additionalOrder} // Передаємо дані Дод. Замовлення як calc
                    isExpanded={expandedAdditionalOrder === additionalOrder.id}
                    onToggle={() => toggleAdditionalOrder(additionalOrder.id)}
                    expandedOrderId={expandedOrder}
                    onOrderToggle={toggleOrder}
                    onDelete={handleDeleteAdditionalOrder}
                    onEdit={handleUpdateAdditionalOrder}
                  />
                ) : (
                  <AdditionalOrderItem // Зберігаємо ім'я компонента, але він тепер відображає Дод. Замовлення
                    key={additionalOrder.id}
                    calc={additionalOrder} // Передаємо дані Дод. Замовлення як calc
                    isExpanded={expandedAdditionalOrder === additionalOrder.id}
                    onToggle={() => toggleAdditionalOrder(additionalOrder.id)}
                    expandedOrderId={expandedOrder}
                    onOrderToggle={toggleOrder}
                    onDelete={handleDeleteAdditionalOrder}
                    onEdit={handleUpdateAdditionalOrder}
                  />
                )
              ))
            )}
          </div>
          
          {/* КНОПКА ЗАВАНТАЖИТИ ЩЕ (СТИЛІЗОВАНА ВЕРСІЯ) */}
          {showLoadMoreButton && (
           <div className="row w-100" style={{ marginTop: '20px', marginBottom: '20px', justifyContent: 'center' }}>
              <button className="btn btn-primary uppercase btn-load-more-big" onClick={handleLoadMore} style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  minWidth: '200px',
                  backgroundColor: '#5e83bf',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  justifySelf: 'center',
                }}>
                <span className="icon icon-loop2" style={{ marginRight: '10px' }}></span> 
                {`Завантажити ще (${nextLoadCount} з ${sortedItems.length - displayLimit})`}
              </button>
            </div>
          )}
          {!showLoadMoreButton && sortedItems.length > initialLimit && (
            <div className="row jc-center text-grey" style={{ marginTop: '20px', marginBottom: '20px', justifyContent: 'center' }}>
              Всі додаткові замовлення завантажено ({sortedItems.length}).
            </div>
          )}
        </div>
      </div>

      <AddReorderModal 
        isOpen={isNewOrderModalOpen} 
        onClose={() => setIsNewOrderModalOpen(false)}
        onSave={handleSaveAdditionalOrder}
      />
    </div>
  );
};

export default AdditionalOrders;