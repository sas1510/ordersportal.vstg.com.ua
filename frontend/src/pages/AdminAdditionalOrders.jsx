import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axiosInstance from '../api/axios';
import '../components/Portal/PortalOriginal.css';
import { AdditionalOrderItem } from '../components/AdditionalOrder/AdditionalOrderItem';
import { AdditionalOrderItemMobile } from '../components/AdditionalOrder/AdditionalOrderItemMobile';
import AddReorderModal from '../components/AdditionalOrder/AddReorderModal';
import useWindowWidth from '../hooks/useWindowWidth';
import { useTheme } from '../context/ThemeContext';

import DealerSelectWithAll from "./DealerSelectWithAll";
import { useDealerContext } from "../hooks/useDealerContext";

const ALL_DEALERS_VALUE = "__ALL__"; // має збігатися з DealerSelect
const initialLimit = 100;

const AdminAdditionalOrders = () => {
  const { dealerGuid, setDealerGuid, isAdmin } = useDealerContext();

  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [additionalOrdersData, setAdditionalOrdersData] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [filter, setFilter] = useState({ status: 'Всі', month: 0, name: '' });
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(true);
  const [expandedAdditionalOrder, setExpandedAdditionalOrder] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(initialLimit);

  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 1024;
  const { theme } = useTheme();
  
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const availableYears = useMemo(() => {
      const startYear = 2024;
      const years = [];
      for (let y = currentYear; y >= startYear; y--) {
        years.push(String(y));
      }
      return years;
    }, [currentYear]);


  const formatDateHuman = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // =========================
  // CLIENT-SIDE FILTERING
  // =========================
  const getFilteredItems = useCallback(
    (statusFilter, monthFilter, nameFilter, data = additionalOrdersData) => {
      let filtered = [...data];

      if (statusFilter && statusFilter !== 'Всі') {
        filtered = filtered.filter(additionalOrder => {
          const orders = additionalOrder.orders || [];
          if (orders.length === 0) return statusFilter === 'Новий';
          return orders.some(order => order.status === statusFilter);
        });
      }

      // Місяць фільтруємо на фронті для одного дилера.
      // Для ALL дилерів бек вже віддає по місяцю, але це не заважає (буде той самий результат).
      if (monthFilter !== 0) {
        filtered = filtered.filter(additionalOrder => {
          const date = new Date(additionalOrder.dateRaw);
          return !isNaN(date.getTime()) && date.getMonth() + 1 === monthFilter;
        });
      }

      if (nameFilter) {
        const query = nameFilter.toLowerCase();
        filtered = filtered.filter(additionalOrder => {
          const orders = additionalOrder.orders || [];
          return (
            additionalOrder.number?.toLowerCase().includes(query) ||
            additionalOrder.mainOrderNumber?.toLowerCase().includes(query) ||
            orders.some(order => order.number?.toLowerCase().includes(query))
          );
        });
      }

      return filtered;
    },
    [additionalOrdersData]
  );

  // =========================
  // AUTO SET MONTH ON FIRST "ALL"
  // =========================
  useEffect(() => {
    if (isAdmin && dealerGuid === ALL_DEALERS_VALUE) {
      setFilter(prev => {
        if (prev.month === 0) return { ...prev, month: currentMonth };
        return prev;
      });
    }
  }, [isAdmin, dealerGuid, currentMonth]);

  // Тригерити fetch по місяцю тільки коли ALL
  const shouldRefetchOnMonthChange = useMemo(() => {
    return isAdmin && dealerGuid === ALL_DEALERS_VALUE;
  }, [isAdmin, dealerGuid]);

  // =========================
  // DATA FETCH (тільки на: рік, дилер, місяць(ALL))
  // =========================
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      setLoading(true);
      try {
        let endpoint = '/additional_orders/get_additional_orders_info/';
        const params = { year: selectedYear };

        if (isAdmin && dealerGuid === ALL_DEALERS_VALUE) {
          endpoint = '/additional_orders/get_additional_orders_info_all/';
          params.month = filter.month || currentMonth; // month обов’язковий
        } else if (dealerGuid) {
          // конкретний дилер / звичайний юзер
          params.contractor = dealerGuid;
        } else if (isAdmin && !dealerGuid) {
          // адмін нічого не вибрав
          setAdditionalOrdersData([]);
          setFilteredItems([]);
          setLoading(false);
          return;
        }

        const response = await axiosInstance.get(endpoint, { params, signal });
        if (signal.aborted) return;

        if (response.data?.status === "success") {
          const rawData = response.data.data?.calculation || [];

          const allOrders = rawData.map(item => ({
            ...item,
            date: formatDateHuman(item.dateRaw),
            orders: (item.orders || []).map(order => ({
              ...order,
              date: formatDateHuman(order.dateRaw)
            }))
          }));

          setAdditionalOrdersData(allOrders);

          // ❗ ВАЖЛИВО: фільтри статус/пошук/місяць для одного дилера — тільки client-side
          // Тут після fetch застосуємо поточні filter.* до нових даних:
          setFilteredItems(getFilteredItems(filter.status, filter.month, filter.name, allOrders));
        } else {
          setAdditionalOrdersData([]);
          setFilteredItems([]);
        }
      } catch (error) {
        if (error.name !== "CanceledError") {
          console.error("Помилка запиту:", error);
          setAdditionalOrdersData([]);
          setFilteredItems([]);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
          setDisplayLimit(initialLimit);
        }
      }
    };

    fetchData();
    return () => controller.abort();
  }, [
    selectedYear,
    dealerGuid,
    isAdmin,
    shouldRefetchOnMonthChange ? filter.month : null
  ]);

  // =========================
  // HANDLERS (НЕ ВИКЛИКАЮТЬ БЕК)
  // =========================
  const handleFilterClick = (statusKey) => {
    setFilter(prev => ({ ...prev, status: statusKey }));
    setFilteredItems(getFilteredItems(statusKey, filter.month, filter.name, additionalOrdersData));
    setDisplayLimit(initialLimit);
  };

  const handleMonthClick = (month) => {
    // ALL: “Весь рік” заборонено/приховано
    if (dealerGuid === ALL_DEALERS_VALUE && month === 0) return;

    const newMonth = (filter.month === month)
      ? (dealerGuid === ALL_DEALERS_VALUE ? month : 0) // для одного дилера можна скинути повторним кліком
      : month;

    setFilter(prev => ({ ...prev, month: newMonth }));

    // Один дилер: фільтруємо локально (без fetch)
    if (dealerGuid !== ALL_DEALERS_VALUE) {
      setFilteredItems(getFilteredItems(filter.status, newMonth, filter.name, additionalOrdersData));
    }
    // ALL: fetch піде автоматично, бо filter.month у deps тільки для ALL

    setDisplayLimit(initialLimit);
  };

  const handleSearchChange = (e) => {
    const name = e.target.value;
    setFilter(prev => ({ ...prev, name }));
    setFilteredItems(getFilteredItems(filter.status, filter.month, name, additionalOrdersData));
    setDisplayLimit(initialLimit);
  };

  const handleClearSearch = () => {
    setFilter(prev => ({ ...prev, name: '' }));
    setFilteredItems(getFilteredItems(filter.status, filter.month, '', additionalOrdersData));
    setDisplayLimit(initialLimit);
  };

  const handleLoadMore = () => setDisplayLimit(prev => prev + initialLimit);

  const handleDeleteAdditionalOrder = useCallback((id) => {
    setAdditionalOrdersData(prev => prev.filter(ord => ord.id !== id));
    setFilteredItems(prev => prev.filter(ord => ord.id !== id));
    setDisplayLimit(initialLimit);
  }, []);

  const handleUpdateAdditionalOrder = useCallback((updated) => {
    setAdditionalOrdersData(prev => prev.map(o => o.id === updated.id ? updated : o));
    setFilteredItems(prev => prev.map(o => o.id === updated.id ? updated : o));
  }, []);

  const handleSaveAdditionalOrder = useCallback((newOrder) => {
    // залишаю твою заглушку (як було в твоєму коді)
    setIsNewOrderModalOpen(false);
    setDisplayLimit(initialLimit);
  }, []);

  // =========================
  // SUMMARIES
  // =========================
  const statusSummary = useMemo(() => {
    const summary = {
      'Всі': 0,
      'Новий': 0,
      'В роботі': 0,
      'Очікуємо оплату': 0,
      'Підтверджений': 0,
      'Очікуємо підтвердження': 0,
      'У виробництві': 0,
      'Готовий': 0,
      'Доставлено': 0,
      'Відмова': 0
    };

    additionalOrdersData.forEach(item => {
      summary['Всі']++;
      const orders = item.orders || [];
      if (orders.length === 0) summary['Новий']++;
      orders.forEach(o => {
        if (o.status && summary.hasOwnProperty(o.status)) summary[o.status]++;
      });
    });

    return summary;
  }, [additionalOrdersData]);

  const monthSummary = useMemo(() => {
    const summary = {};
    for (let i = 1; i <= 12; i++) summary[i] = 0;

    additionalOrdersData.forEach(item => {
      if (!item.dateRaw) return;
      const d = new Date(item.dateRaw);
      if (isNaN(d.getTime())) return;
      const m = d.getMonth() + 1;
      if (summary.hasOwnProperty(m)) summary[m]++;
    });

    return summary;
  }, [additionalOrdersData]);

  // =========================
  // SORT + PAGINATION
  // =========================
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => new Date(b.dateRaw).getTime() - new Date(a.dateRaw).getTime());
  }, [filteredItems]);

  const toggleAdditionalOrder = (id) => setExpandedAdditionalOrder(expandedAdditionalOrder === id ? null : id);
  const toggleOrder = (id) => setExpandedOrder(expandedOrder === id ? null : id);

  const itemsToDisplay = sortedItems.slice(0, displayLimit);
  const showLoadMoreButton = sortedItems.length > displayLimit;
  const nextLoadCount = Math.min(initialLimit, sortedItems.length - displayLimit);

  if (loading) return (
    <div className="loading-spinner-wrapper">
      <div className="loading-spinner"></div>
      <div className="loading-text">Завантаження...</div>
    </div>
  );

  return (
    <div className="column portal-body">
      <div className="content-summary row w-100">
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
            {availableYears.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

        </div>

        <div className="by-month-pagination-wrapper">

  {/* ===== DESKTOP MONTH LIST ===== */}
  <ul className="gap-6 row no-wrap month-list">
    {/* Для ALL — ховаємо "Весь рік" */}
    {dealerGuid !== ALL_DEALERS_VALUE && (
      <li
        className={`pagination-item ${filter.month === 0 ? 'active' : ''}`}
        onClick={() => handleMonthClick(0)}
      >
        Весь рік
      </li>
    )}

    {Array.from({ length: 12 }, (_, i) => {
      const num = i + 1;
      const labels = ['Січ.', 'Лют.', 'Бер.', 'Квіт.', 'Трав.', 'Черв.', 'Лип.', 'Сер.', 'Вер.', 'Жов.', 'Лис.', 'Груд.'];

      const disabled =
        dealerGuid !== ALL_DEALERS_VALUE && monthSummary[num] === 0;

      return (
        <li
          key={num}
          className={`pagination-item ${filter.month === num ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={() => {
            if (disabled) return;
            handleMonthClick(num);
          }}
        >
          {labels[i]}
          {dealerGuid !== ALL_DEALERS_VALUE && (
            <span className="text-grey"> ({monthSummary[num]})</span>
          )}
        </li>
      );
    })}
  </ul>

  {/* ===== MOBILE MONTH SELECT (ОЦЕ БУЛО ЗАГУБЛЕНО) ===== */}
  <select
    className="month-select"
    value={filter.month}
    onChange={(e) => handleMonthClick(Number(e.target.value))}
  >
    {/* Для ALL — не показуємо "Весь рік" */}
    {dealerGuid !== ALL_DEALERS_VALUE && (
      <option value={0}>Весь рік</option>
    )}

    {Array.from({ length: 12 }, (_, i) => {
      const num = i + 1;
      const labels = [
        'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
        'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
      ];

      const disabled =
        dealerGuid !== ALL_DEALERS_VALUE && monthSummary[num] === 0;

      return (
        <option key={num} value={num} disabled={disabled}>
          {labels[i]}
          {dealerGuid !== ALL_DEALERS_VALUE ? ` (${monthSummary[num]})` : ''}
        </option>
      );
    })}
  </select>

</div>
</div>


      <div className="content-wrapper row w-100 h-100">
        {/* Sidebar */}
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

          {isAdmin && (
            <>
              <div className="delimiter1" />
              <div className="dealer-select-wrapper" >
                <DealerSelectWithAll value={dealerGuid} onChange={setDealerGuid} />
              </div>
            </>
          )}

          <div className="delimiter1"></div>

          <ul className="buttons">
            <li className="btn btn-add-calc" onClick={() => setIsNewOrderModalOpen(true)}>
              <span className="icon icon-plus3"></span>
              <span className="uppercase">Нове дод. замовлення</span>
            </li>
          </ul>

          <ul className="filter column align-center">
            <li className="delimiter1"></li>
            {[
              { id: "all", label: "Всі дод. замовлення", icon: "icon-calculator", statusKey: "Всі" },
              { id: "new", label: "Нові дод. замовлення", icon: "icon-bolt", statusKey: "Новий" },
              { id: "processing", label: "В роботі", icon: "icon-spin-alt", statusKey: "В роботі" },
              { id: "waiting-payment", label: "Очікують оплату", icon: "icon-coin-dollar", statusKey: "Очікуємо оплату" },
              { id: "waiting-confirm", label: "Очікують підтвердження", icon: "icon-clipboard", statusKey: "Очікуємо підтвердження" },
              { id: "confirmed", label: "Підтверджені", icon: "icon-check", statusKey: "Підтверджений" },
              { id: "production", label: "Замовлення у виробництві", icon: "icon-cogs", statusKey: "У виробництві" },
              { id: "ready", label: "Готові замовлення", icon: "icon-layers2", statusKey: "Готовий" },
              { id: "shipped", label: "Доставлено", icon: "icon-truck", statusKey: "Доставлено" },
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

        {/* Main content */}
        <div className="content" id="content">
          <div className="items-wrapper column gap-14">
            {sortedItems.length === 0 ? (
              <div className="no-data column align-center h-100">
                <div className="font-size-24 text-grey">Немає додаткових замовлень для відображення</div>
              </div>
            ) : (
              itemsToDisplay.map((item) =>
                isMobile ? (
                  <AdditionalOrderItemMobile
                    key={item.id}
                    calc={item}
                    isExpanded={expandedAdditionalOrder === item.id}
                    onToggle={() => toggleAdditionalOrder(item.id)}
                    expandedOrderId={expandedOrder}
                    onOrderToggle={toggleOrder}
                    onDelete={handleDeleteAdditionalOrder}
                    onEdit={handleUpdateAdditionalOrder}
                  />
                ) : (
                  <AdditionalOrderItem
                    key={item.id}
                    calc={item}
                    isExpanded={expandedAdditionalOrder === item.id}
                    onToggle={() => toggleAdditionalOrder(item.id)}
                    expandedOrderId={expandedOrder}
                    onOrderToggle={toggleOrder}
                    onDelete={handleDeleteAdditionalOrder}
                    onEdit={handleUpdateAdditionalOrder}
                  />
                )
              )
            )}
          </div>

          {/* Load more (твій стиль) */}
          {showLoadMoreButton && (
            <div
              className="row w-100"
              style={{ marginTop: '20px', marginBottom: '20px', justifyContent: 'center' }}
            >
              <button
                className="btn btn-primary uppercase btn-load-more-big"
                onClick={handleLoadMore}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  minWidth: '200px',
                  backgroundColor: '#5e83bf',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  justifySelf: 'center',
                }}
              >
                <span className="icon icon-loop2" style={{ marginRight: '10px' }}></span>
                {`Завантажити ще (${nextLoadCount} з ${sortedItems.length - displayLimit})`}
              </button>
            </div>
          )}

          {!showLoadMoreButton && sortedItems.length > initialLimit && (
            <div
              className="row jc-center text-grey"
              style={{ marginTop: '20px', marginBottom: '20px', justifyContent: 'center' }}
            >
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

export default AdminAdditionalOrders;
