import React, { useState, useEffect } from 'react';
// import axiosInstance from '../api/axios'; // Замінено на мокап-дані
import { CalculationItem } from '../components/Orders/OrderComponents'; // Зберігаємо назви компонентів, як були
import { CalculationItemMobile } from '../components/Orders/CalculationItemMobile'; // Зберігаємо назви компонентів, як були
import '../components/Portal/PortalOriginal.css';
// import AddOrderModal from '../components/Orders/AddOrderModal';
// import AdditionalOrderMenu from '../components/AdditionalOrder/AdditionalOrderMenu'; // Імпортуємо новий компонент для мобільного
import AdditionalOrderMenu from '../components/AdditionalOrder/AdditionalOrderMenu'; // Імпортуємо новий компонент для мобільного
import { AdditionalOrderItem} from '../components/AdditionalOrder/AdditionalOrderItem'; // Імпортуємо новий компонент для мобільного
import { AdditionalOrderItemMobile } from '../components/AdditionalOrder/AdditionalOrderItemMobile'; // Імпортуємо новий компонент для мобільного
import NewCalculationModal from '../components/Orders/NewCalculationModal'; // Перейменуємо це для Додаткового Замовлення
import DealerSelectModal from '../components/Orders/DealerSelectModal';
import useWindowWidth from '../hooks/useWindowWidth';
import { useTheme } from '../context/ThemeContext';

// --- MOCK DATA ---
const mockAdditionalOrdersData = [
  {
    id: 'add-ord-001',
    number: 'Дод. Замовлення 001',
    mainOrderNumber: '9001',
    dateRaw: '2025-05-15T10:00:00Z',
    mainOrderDate: '2025-03-15T10:00:00Z',
    date: '15 трав. 2025 р.',
    constructionsQTY: 5,
    dealer: 'Дилер А',
    debt: 12000.00,
    file: 'file-001.pdf',
    message: 'Примітка до Дод. Замовлення 001',
    orderCountInCalc: 2,
    constructionsCount: 3 + 2,
    amount: 50000.00,
    orders: [
      {
        id: 'order-222', number: 'Замовлення-222', dateRaw: '2025-05-10', date: '10 трав. 2025 р.', status: 'Очікуємо оплату',
        amount: 20000, count: 2, paid: 18000, realizationDate: null, deliveryAddress: 'Львів, пл. Ринок, 5',
      },
    ],
    statuses: {'Очікуємо оплату': 1 },
  },
  {
    id: 'add-ord-002',
    number: 'Дод. Замовлення 002',
    mainOrderNumber: '9trjhr001',
    dateRaw: '2025-04-20T12:30:00Z',
    mainOrderDate: '2025-03-15T10:00:00Z',
    date: '20 квіт. 2025 р.',
    constructionsQTY: 10,
    dealer: 'Дилер Б',
    debt: 0.00,
    file: null,
    message: '',
    orderCountInCalc: 3,
    constructionsCount: 4 + 4 + 2,
    amount: 100000.00,
    orders: [
     
      { id: 'order-555', number: 'Замовлення-555', dateRaw: '2025-04-15', date: '15 квіт. 2025 р.', status: 'Готовий', amount: 20000, count: 2, paid: 20000 },
    ],
    statuses: {  'Готовий': 1 },
  },
  {
    id: 'add-ord-003',
    number: 'Дод. Замовлення 003',
    mainOrderNumber: '90rt6j01',
    mainOrderDate: '2025-03-15T10:00:00Z',
    dateRaw: '2025-05-01T08:00:00Z',
    date: '01 трав. 2025 р.',
    constructionsQTY: 0,
    dealer: 'Дилер В',
    debt: 0.00,
    file: 'file-003.pdf',
    message: 'Нове дод. замовлення',
    orderCountInCalc: 0,
    constructionsCount: 0,
    amount: 0,
    orders: [], // Новий прорахунок (Additional Order) без замовлень
    statuses: {},
  }
];

// Перейменовуємо компонент
const AdditionalOrders = () => {
  // Перейменовуємо змінні, пов'язані з "Прорахунками" на "Додаткові Замовлення"
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false); // Замість isCalcModalOpen
  const [additionalOrdersData, setAdditionalOrdersData] = useState([]); // Замість calculationsData
  const [filteredItems, setFilteredItems] = useState([]);
  const [filter, setFilter] = useState({ status: 'Всі', month: 0, name: '' });
  const [selectedYear, setSelectedYear] = useState('2025');
  const [loading, setLoading] = useState(true);
  const [expandedAdditionalOrder, setExpandedAdditionalOrder] = useState(null); // Замість expandedCalc
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDealerModal, setShowDealerModal] = useState(false);
  const [dealer, setDealer] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 1024;
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'customer' && !dealer) {
      setShowDealerModal(true);
    }
  }, [dealer]);

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
      number: newOrder.name || `Дод. Замовлення ${additionalOrdersData.length + 1}`,
      dateRaw: newOrder.dateRaw || new Date().toISOString(),
      date: new Date(newOrder.dateRaw || new Date()).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' }),
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
  };

  const formatDateHuman = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date)) return null;
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // --- MOCK API CALL LOGIC ---
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'customer' && !dealer) {
      setShowDealerModal(true);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      // Імітація затримки API
      await new Promise(resolve => setTimeout(resolve, 500)); 

      try {
        // Імітація фільтрації за роком та дилером на стороні клієнта (для мокапу)
        let dataToUse = mockAdditionalOrdersData;
        
        if (selectedYear === '2024') {
             // Імітуємо відсутність даних для 2024 року
            dataToUse = []; 
        } 
        // Логіка для дилера тут ускладнена, тому в мокапі просто ігноруємо, 
        // але в реальному коді ви маєте фільтрувати за dealer.id

        setAdditionalOrdersData(dataToUse);
        setFilteredItems(dataToUse);
      } catch (error) {
        console.error("Помилка мокапу:", error);
        setAdditionalOrdersData([]);
        setFilteredItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, dealer]);
  // --- END MOCK API CALL LOGIC ---


  const getStatusSummary = () => {
    const summary = { 'Всі': 0, 'Новий': 0, 'В обробці': 0, 'Очікуємо оплату': 0, 'Підтверджений': 0, 'Очікуємо підтвердження': 0, 'У виробництві': 0, 'Готовий': 0, 'Відвантажений': 0, 'Відмова': 0 };

    additionalOrdersData.forEach(additionalOrder => { // Замість calculationsData
      if (additionalOrder.orders.length === 0) summary['Новий'] += 1;
      summary['Всі'] += additionalOrder.orders.length;
      additionalOrder.orders.forEach(order => {
        if (order.status && summary.hasOwnProperty(order.status)) summary[order.status] += 1;
      });
    });

    return summary;
  };

  const getMonthSummary = () => {
    const summary = {};
    for (let i = 1; i <= 12; i++) summary[i] = 0;

    additionalOrdersData.forEach(additionalOrder => { // Замість calculationsData
      if (!additionalOrder.dateRaw) return;
      const month = new Date(additionalOrder.dateRaw).getMonth() + 1;
      summary[month] += 1;
    });

    return summary;
  };

  const statusSummary = getStatusSummary();
  const monthSummary = getMonthSummary();

  const getFilteredItems = (statusFilter, monthFilter, nameFilter) => {
    let filtered = [...additionalOrdersData]; // Замість calculationsData
    if (statusFilter && statusFilter !== 'Всі') {
      filtered = filtered.filter(additionalOrder => {
        if (additionalOrder.orders.length === 0) return statusFilter === 'Новий';
        return additionalOrder.orders.some(order => order.status === statusFilter);
      });
    }
    if (monthFilter !== 0) {
      filtered = filtered.filter(additionalOrder => {
        const month = new Date(additionalOrder.dateRaw).getMonth() + 1;
        return month === monthFilter;
      });
    }
    if (nameFilter) {
      const query = nameFilter.toLowerCase();
      filtered = filtered.filter(additionalOrder => {
        if (additionalOrder.number.toLowerCase().includes(query)) return true;
        return additionalOrder.orders.some(order => order.number?.toLowerCase().includes(query));
      });
    }
    return filtered;
  };

  const handleFilterClick = (statusKey) => {
    setFilter(prev => ({ ...prev, status: statusKey }));
    setFilteredItems(getFilteredItems(statusKey, filter.month, filter.name));
  };

  const handleMonthClick = (month) => {
    const newMonth = filter.month === month ? 0 : month;
    setFilter(prev => ({ ...prev, month: newMonth }));
    setFilteredItems(getFilteredItems(filter.status, newMonth, filter.name));
  };

  const handleSearchChange = (e) => {
    const name = e.target.value;
    setFilter(prev => ({ ...prev, name }));
    setFilteredItems(getFilteredItems(filter.status, filter.month, name));
  };

  const handleClearSearch = () => {
    setFilter(prev => ({ ...prev, name: '' }));
    setFilteredItems(getFilteredItems(filter.status, filter.month, ''));
  };

  const sortedItems = filteredItems.sort((a, b) => new Date(b.dateRaw) - new Date(a.dateRaw));
  const toggleAdditionalOrder = (id) => setExpandedAdditionalOrder(expandedAdditionalOrder === id ? null : id); // Замість toggleCalc
  const toggleOrder = (id) => setExpandedOrder(expandedOrder === id ? null : id);

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
              placeholder="номер дод. замовлення, основного замовлення"
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

        {/* Основний контент */}
        <div className="content" id="content">
          <div className="items-wrapper column gap-14" id="items-wrapper">
            {sortedItems.length === 0 ? (
              <div className="no-data column align-center h-100">
                <div className="font-size-24 text-grey">Немає додаткових замовлень для відображення</div>
              </div>
            ) : (
              sortedItems.map((additionalOrder) => ( // Замість calc
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
        </div>
      </div>

      <NewCalculationModal // Зберігаємо ім'я модалки, але вона використовується для Дод. Замовлення
        isOpen={isNewOrderModalOpen} // Замість isCalcModalOpen
        onClose={() => setIsNewOrderModalOpen(false)}
        onSave={handleSaveAdditionalOrder} // Замість handleSaveCalculation
      />
    </div>
  );
};

export default AdditionalOrders;