import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { CalculationItem } from '../components/Orders1/OrderComponents';
import '../components/Portal/PortalOriginal.css';
import AddOrderModal from '../components/Orders1/AddOrderModal';
import NewCalculationModal from '../components/Orders1/NewCalculationModal';
import DealerSelectModal from '../components/Orders1/DealerSelectModal'; 


const PortalOriginal = () => {



  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [calculationsData, setCalculationsData] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [filter, setFilter] = useState({ status: 'Всі', month: 0, name: '' });
  const [selectedYear, setSelectedYear] = useState('2025');
  const [loading, setLoading] = useState(true);
  const [expandedCalc, setExpandedCalc] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDealerModal, setShowDealerModal] = useState(false);


  const handleDeleteCalculation = (calcId) => {
    setCalculationsData(prev => prev.filter(calc => calc.id !== calcId));
    setFilteredItems(prev => prev.filter(calc => calc.id !== calcId));
  };

  const [dealer, setDealer] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'customer' && !dealer) {
      setShowDealerModal(true);
    }
  }, [dealer]);


  
  const handleDealerSelect = (selectedDealer) => {
    setDealer(selectedDealer);
    localStorage.setItem('dealerId', selectedDealer.id); // можна зберегти для повторного використання
    setShowDealerModal(false);
  };

  const handleUpdateCalculation = (updatedCalc) => {
    setCalculationsData(prev =>
      prev.map(calc => calc.id === updatedCalc.id ? updatedCalc : calc)
    );
    setFilteredItems(prev =>
      prev.map(calc => calc.id === updatedCalc.id ? updatedCalc : calc)
    );
  };


  const handleAddClick = () => setIsModalOpen(true);
  const handleClose = () => setIsModalOpen(false);


  const handleSave = (newOrder) => {
    console.log("Новий прорахунок:", newOrder);
    // Тут можна зробити POST-запит через axiosInstance.post(...)
  };
  const handleSaveCalculation = (newCalc) => {
  console.log('Saving calculation:', newCalc);





  // Форматуємо отримані дані під структуру calculationsData
  const formattedCalc = {
    id: newCalc.id || Math.random().toString(36).substr(2, 9), // тимчасовий id, якщо немає uuid
    number: newCalc.name || `Прорахунок ${calculationsData.length + 1}`,
    dateRaw: newCalc.dateRaw || new Date().toISOString(),
    date: new Date(newCalc.dateRaw || new Date()).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' }),
    orders: [], // новий прорахунок поки без замовлень
    orderCountInCalc: 0,
    constructionsCount: newCalc.ConstructionsCount || 0,
    constructionsQTY: newCalc.ConstructionsCount || 0,
    statuses: {},
    amount: 0,
    file: newCalc.file || null,
    message: newCalc.Comment || ''
  };

  // Додаємо у список
  setCalculationsData(prev => [formattedCalc, ...prev]);
  setFilteredItems(prev => [formattedCalc, ...prev]);

  setIsCalcModalOpen(false);

};




  // --- Форматування дати ---
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

  // --- Завантаження даних з API ---
  useEffect(() => {
  // Якщо роль клієнт і дилер не обраний — нічого не робимо
  const role = localStorage.getItem('role');

  // Для клієнтів — завантажуємо завжди (якщо dealer не потрібен)
  // Для інших ролей — завантажуємо тільки якщо дилер обрано
  if (role !== 'customer' && !dealer) {
    setShowDealerModal(true);
    setLoading(false); // важливо, щоб спіннер не показувався
    return;
  }
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { year: selectedYear };
      if (dealer) params.customer_id = dealer.id;

      const response = await axiosInstance.get("/get_orders_info/", { params });

      if (response.data?.status === "success") {
        const rawCalculations = response.data.data.calculation || [];

        const formattedCalcs = rawCalculations.map(calc => {
          const orders = Array.isArray(calc.order)
            ? calc.order.filter(order => order.uuid && order.uuid !== 'None')
                .map(order => ({
                  id: order.uuid,
                  number: order.name || '',
                  dateRaw: order.ДатаЗаказа,
                  date: formatDateHuman(order.ДатаЗаказа),
                  status: order.ЭтапВыполненияЗаказа || 'Новий',
                  amount: parseFloat(order.СуммаЗаказа || 0),
                  count: Number(order.КоличествоКонструкцийВЗаказе || 0),
                  paid: parseFloat(order.ОплаченоПоЗаказу || 0),
                  planProductionMin: order.ПлановаяДатаПроизводстваМин,
                  planProductionMax: order.ПлановаяДатаПроизводстваМакс,
                  factProductionMin: order.ФактическаяДатаПроизводстваМин,
                  factProductionMax: order.ФактическаяДатаПроизводстваМакс,
                  factReadyMin: order.ФактическаяДатаГотовностиМин,
                  factReadyMax: order.ФактическаяДатаГотовностиМакс,
                  realizationDate: order.ДатаРеализации,
                  quantityRealized: parseFloat(order.КоличествоРеализовано || 0),
                  deliveryAddress: order.АдресДоставки || '',
                  planDeparture: order.ПлановаяДатаВыезда,
                  goodsInDelivery: Number(order.КоличествоТоваровВДоставке || 0),
                  arrivalTime: order.ВремяПрибытия,
                  routeStatus: order.СостояниеМаршрута,
                }))
            : [];

          const statusCounts = orders.reduce((acc, order) => {
            if (!order.status) return acc;
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
          }, {});

          const totalAmount = orders
            .filter(o => o.status !== 'Відмова')
            .reduce((sum, o) => sum + (o.amount || 0), 0);

          const totalPaid = orders
            .filter(o => o.status !== 'Відмова')
            .reduce((sum, o) => sum + (o.paid || 0), 0);

          const debt = totalAmount - totalPaid;

          return {
            id: calc.uuid || Math.random().toString(36).substr(2, 9),
            number: calc.name || '',
            dateRaw: calc.ДатаПросчета,
            constructionsQTY: Number(calc.КоличествоКонструкцийВПросчете || 0),
            date: formatDateHuman(calc.ДатаПросчета),
            orders,
            orderCountInCalc: orders.length,
            constructionsCount: orders.reduce((sum, order) => sum + (order.count || 0), 0),
            statuses: statusCounts,
            amount: totalAmount,
            debt,
            file: calc.File || null,
            message: calc.ПросчетСообщения || ''
          };
        });

        setCalculationsData(formattedCalcs);
        setFilteredItems(formattedCalcs);
      } else {
        setCalculationsData([]);
        setFilteredItems([]);
      }
    } catch (error) {
      console.error("Помилка запиту:", error);
      setCalculationsData([]);
      setFilteredItems([]);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [selectedYear, dealer]);


  // --- Статусні та місячні підсумки ---
  const getStatusSummary = () => {
    const summary = { 'Всі': 0, 'Новий': 0, 'В обробці': 0, 'Очікуємо оплату': 0, 'Підтверджений': 0, 'Очікуємо підтвердження': 0, 'У виробництві': 0, 'Готовий': 0, 'Відвантажений': 0, 'Відмова': 0 };

    calculationsData.forEach(calc => {
      if (calc.orders.length === 0) summary['Новий'] += 1;
      summary['Всі'] += calc.orders.length;
      calc.orders.forEach(order => {
        if (order.status && summary.hasOwnProperty(order.status)) summary[order.status] += 1;
      });
    });

    return summary;
  };

  const getMonthSummary = () => {
    const summary = {};
    for (let i = 1; i <= 12; i++) summary[i] = 0;

    calculationsData.forEach(calc => {
      if (!calc.dateRaw) return;
      const month = new Date(calc.dateRaw).getMonth() + 1;
      summary[month] += 1; // додаємо 1 за кожен прорахунок
    });

    return summary;
  };


  const statusSummary = getStatusSummary();
  const monthSummary = getMonthSummary();

  // --- Фільтри ---
  const getFilteredItems = (statusFilter, monthFilter, nameFilter) => {
    let filtered = [...calculationsData];

    if (statusFilter && statusFilter !== 'Всі') {
      filtered = filtered.filter(calc => {
        if (calc.orders.length === 0) return statusFilter === 'Новий';
        return calc.orders.some(order => order.status === statusFilter);
      });
    }

    if (monthFilter !== 0) {
      filtered = filtered.filter(calc => {
        const month = new Date(calc.dateRaw).getMonth() + 1;
        return month === monthFilter;
      });
    }

    if (nameFilter) {
      const query = nameFilter.toLowerCase();
      filtered = filtered.filter(calc => {
        if (calc.number.toLowerCase().includes(query)) return true;
        return calc.orders.some(order => order.number?.toLowerCase().includes(query));
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

  const toggleCalc = (id) => setExpandedCalc(expandedCalc === id ? null : id);
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
        <div className="year-selector row">
          <span>Звітний рік:</span>
          <span className="icon icon-calendar2 font-size-24 text-info"></span>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>

        <div className="by-month-pagination-wrapper">
          <ul className="gap-6 row no-wrap">
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
        </div>
      </div>

      <div className="content-wrapper row w-100 h-100">
        <div className="content-filter column">
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
              sortedItems.map((calc, id) => (
                <CalculationItem 
                  key={calc.id}
                  calc={calc}
                  isExpanded={expandedCalc === calc.id}
                  onToggle={() => toggleCalc(calc.id)}
                  expandedOrderId={expandedOrder}
                  onOrderToggle={toggleOrder}
                  onDelete={handleDeleteCalculation}
                  onEdit={handleUpdateCalculation}  
                />
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
