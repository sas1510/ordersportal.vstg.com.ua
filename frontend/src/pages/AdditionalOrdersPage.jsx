import React, { useState, useEffect, useCallback, useMemo } from "react";
import axiosInstance from "../api/axios";
import "../components/Portal/PortalOriginal.css";
import { AdditionalOrderItem } from "../components/AdditionalOrder/AdditionalOrderItem";
import { AdditionalOrderItemMobile } from "../components/AdditionalOrder/AdditionalOrderItemMobile";
import AddReorderModal from "../components/AdditionalOrder/AddReorderModal";
// import DealerSelectModal from '../components/Orders/DealerSelectModal'; // Видалено
import useWindowWidth from "../hooks/useWindowWidth";
// import { useTheme } from '../context/ThemeContext';
import useCancelAllRequests from "../hooks/useCancelAllRequests";
import { useLocation, useNavigate } from "react-router-dom";

const initialLimit = 100;

// Перейменовуємо компонент
const AdditionalOrders = () => {
  const { register, cancelAll } = useCancelAllRequests();

  // Перейменовуємо змінні, пов'язані з "Прорахунками" на "Додаткові Замовлення"
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false); // Замість isCalcModalOpen
  const [additionalOrdersData, setAdditionalOrdersData] = useState([]); // Замість calculationsData
  const [_filteredItems, setFilteredItems] = useState([]);
  const [filter, setFilter] = useState({ status: "Всі", month: 0, name: "" });
  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear()),
  ); // Виправлено на String
  const [loading, setLoading] = useState(true);
  const [expandedAdditionalOrder, setExpandedAdditionalOrder] = useState(null); // Замість expandedCalc
  const [expandedOrder, setExpandedOrder] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
  // const [showDealerModal, setShowDealerModal] = useState(false); // Видалено
  // const [dealer, setDealer] = useState(null); // Видалено
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(initialLimit); // СТАН ДЛЯ ПАГІНАЦІЇ
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 1024;
  //   const { theme, toggleTheme } = useTheme();

  const [error, setError] = useState(null);
  const [_reloading, setReloading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  
  const yearIcon = "/assets/icons/YearIcon.png";
  const searchIcon = "/assets/icons/SearchIcon.png";
  
  const plusIcon = "/assets/icons/PlusIcon.png";


  const allCalcIcon = "/assets/icons/AllCalcIcon.png";
  const newCalcIcon = "/assets/icons/NewCalcIcon.png";
  const inProcessingIcon = "/assets/icons/InProcessingIcon.png";
  const waitingForPaymentIcon = "/assets/icons/WaitingForPaymentIcon.png";
  const waitingForConfirmIcon = "/assets/icons/WaitingForConfirmIcon.png";
  const confirmedIcon = "/assets/icons/ConfirmedIcon.png";
  const factoryIcon = "/assets/icons/FactoringIcon.png";
  const finishedIcon = "/assets/icons/FinishedIcon.png";
  const deliveredIcon = "/assets/icons/DeliveredIcon.png";
  const canceledCalcIcon = "/assets/icons/CancelCalc.png";

  const navigate = useNavigate();

  const handleDeleteAdditionalOrder = useCallback((additionalOrderId) => {
    // Замість handleDeleteCalculation
    // Видаляємо додаткове замовлення з state
    setAdditionalOrdersData((prev) =>
      prev.filter((ord) => ord.id !== additionalOrderId),
    );
    setFilteredItems((prev) =>
      prev.filter((ord) => ord.id !== additionalOrderId),
    );
    // Скидаємо ліміт відображення, щоб уникнути помилок після видалення
    setDisplayLimit(initialLimit);
  }, []);

  const handleUpdateAdditionalOrder = useCallback((updatedOrder) => {
    // Замість handleUpdateCalculation
    setAdditionalOrdersData((prev) =>
      prev.map((ord) => (ord.id === updatedOrder.id ? updatedOrder : ord)),
    );
    setFilteredItems((prev) =>
      prev.map((ord) => (ord.id === updatedOrder.id ? updatedOrder : ord)),
    );
  }, []);

  //   const handleAddClick = () => setIsModalOpen(true);
  //   const handleClose = () => setIsModalOpen(false);

  const handleAdditionalOrderRead = useCallback((id) => {
    setAdditionalOrdersData((prev) =>
      prev.map((o) => (o.id === id ? { ...o, hasUnreadMessages: false } : o)),
    );

    setFilteredItems((prev) =>
      prev.map((o) => (o.id === id ? { ...o, hasUnreadMessages: false } : o)),
    );
  }, []);

  const handleSaveAdditionalOrder = useCallback(async (formData) => {
  setLoading(true);
  try {
    const response = await axiosInstance.post(
      "/additional_orders/save_additional_order/",
      formData,
    );

    // ВАЖЛИВО: Перевіряємо поле 'success' (як у вашому JSON), 
    // або статус відповіді 201 (як у вкладці Headers)
    if (response.data?.success === true || response.status === 201) {
      setIsNewOrderModalOpen(false);
      setRefreshTrigger((prev) => prev + 1);
      
      // Якщо хочете виводити повідомлення про успіх БЕЗ слова "Помилка":
      // alert(response.data?.message || "Дозамовлення створено");
    } else {
      // Сюди код потрапить, тільки якщо success === false
      alert("Помилка: " + (response.data?.message || "Невідома помилка"));
    }
  } catch (err) {
    console.error("Помилка відправки:", err);
    alert("Не вдалося відправити дані.");
  } finally {
    setLoading(false);
  }
}, []);


  const formatDateHuman = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Оновлено, щоб приймати опціонально список даних
  const getFilteredItems = useCallback(
    (statusFilter, monthFilter, nameFilter, data = additionalOrdersData) => {
      let filtered = [...data]; // Використовуємо надані дані

      if (statusFilter && statusFilter !== "Всі") {
        filtered = filtered.filter((additionalOrder) => {
          if (additionalOrder.orders.length === 0)
            return statusFilter === "Новий";
          return additionalOrder.orders.some(
            (order) => order.status === statusFilter,
          );
        });
      }
      if (monthFilter !== 0) {
        filtered = filtered.filter((additionalOrder) => {
          const date = new Date(additionalOrder.dateRaw);
          return !isNaN(date.getTime()) && date.getMonth() + 1 === monthFilter;
        });
      }
      if (nameFilter) {
        const query = nameFilter.toLowerCase();
        filtered = filtered.filter(
          (additionalOrder) =>
            additionalOrder.number?.toLowerCase().includes(query) ||
            additionalOrder.mainOrderNumber?.toLowerCase().includes(query) || // Додано пошук по основному номеру
            additionalOrder.orders.some((order) =>
              order.number?.toLowerCase().includes(query),
            ),
        );
      }
      return filtered;
    },
    [additionalOrdersData],
  );

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      setLoading(true);
      setError(null); // Важливо скидати помилку при зміні року

      try {
        const response = await axiosInstance.get(
          "/additional_orders/get_additional_orders_info/",
          { params: { year: selectedYear }, signal },
        );

        if (signal.aborted) return;

        if (response.data?.status === "success") {
          const rawData = response.data.data?.calculation || [];
          const allOrders = rawData.map((item) => ({
            ...item,
            date: formatDateHuman(item.dateRaw),
            orders: (item.orders || []).map((order) => ({
              ...order,
              date: formatDateHuman(order.dateRaw),
            })),
          }));

          setAdditionalOrdersData(allOrders);
          setFilteredItems(
            getFilteredItems(
              filter.status,
              filter.month,
              filter.name,
              allOrders,
            ),
          );
        } else {
          setError("Помилка завантаження даних із сервера.");
        }
      } catch (error) {
        if (error.name !== "CanceledError") {
          setError("Не вдалося завантажити дані. Перевірте підключення.");
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
  }, [selectedYear, refreshTrigger]); // Залиште тільки selectedYear, щоб уникнути циклів

  const reloadAdditionalOrders = useCallback(async () => {
    cancelAll();
    const controller = register();
    setReloading(true);
    setError(null); // Очищуємо попередню помилку

    try {
      const response = await axiosInstance.get(
        "/additional_orders/get_additional_orders_info/",
        { params: { year: selectedYear }, signal: controller.signal },
      );

      if (response.data?.status === "success") {
        const rawData = response.data.data?.calculation || [];

        const formatted = rawData.map((item) => ({
          ...item,
          date: formatDateHuman(item.dateRaw),
          orders: (item.orders || []).map((order) => ({
            ...order,
            date: formatDateHuman(order.dateRaw),
          })),
        }));

        setAdditionalOrdersData(formatted);
        // Фільтрація відбудеться автоматично через useMemo (якщо ви перейшли на нього)
        // або вручну:
        setFilteredItems(
          getFilteredItems(filter.status, filter.month, filter.name, formatted),
        );
        setDisplayLimit(initialLimit);
      } else {
        setError("Сервер повернув помилку при оновленні даних.");
      }
    } catch (err) {
      if (err.name !== "CanceledError") {
        setError("Не вдалося оновити дані. Перевірте з'єднання.");
      }
    } finally {
      setReloading(false);
    }
  }, [cancelAll, register, selectedYear, filter, getFilteredItems]);

  const getStatusSummary = useMemo(() => {
    return () => {
      // 🔥 ОНОВЛЕНИЙ СПИСОК СТАТУСІВ З УРАХУВАННЯМ SQL
      const summary = {
        Всі: 0,
        Новий: 0,
        "В роботі": 0,
        "Очікуємо оплату": 0,
        Підтверджений: 0,
        "Очікуємо підтвердження": 0,
        "У виробництві": 0,
        Готовий: 0,
        Відвантажено: 0, // Додано
        Відмова: 0,
      };

      additionalOrdersData.forEach((additionalOrder) => {
        if (additionalOrder.orders.length === 0) summary["Новий"] += 1;
        additionalOrder.orders.forEach((order) => {
          if (order.status && Object.hasOwn(summary, order.status))
            summary[order.status] += 1;
        });
      });
      summary["Всі"] = additionalOrdersData.length; // Коректний підсумок для верхнього рівня
      return summary;
    };
  }, [additionalOrdersData]);

  const getMonthSummary = useMemo(() => {
    return () => {
      const summary = {};
      for (let i = 1; i <= 12; i++) summary[i] = 0;

      additionalOrdersData.forEach((additionalOrder) => {
        if (!additionalOrder.dateRaw) return;
        const date = new Date(additionalOrder.dateRaw);
        if (isNaN(date.getTime())) return;
        const month = date.getMonth() + 1;
        summary[month] = (summary[month] || 0) + 1;
      });

      return summary;
    };
  }, [additionalOrdersData]);

  const statusSummary = getStatusSummary();
  const monthSummary = getMonthSummary();

  // --- ОБРОБНИКИ ФІЛЬТРАЦІЇ ---
  const handleFilterClick = (statusKey) => {
    setFilter((prev) => ({ ...prev, status: statusKey }));
    // Фільтрація відбувається на `additionalOrdersData`
    setFilteredItems(getFilteredItems(statusKey, filter.month, filter.name));
    setDisplayLimit(initialLimit); // Скидаємо ліміт при зміні фільтра
  };

  const handleMonthClick = (month) => {
    const newMonth = filter.month === month ? 0 : month;
    setFilter((prev) => ({ ...prev, month: newMonth }));
    setFilteredItems(getFilteredItems(filter.status, newMonth, filter.name));
    setDisplayLimit(initialLimit); // Скидаємо ліміт при зміні фільтра
  };

  const handleSearchChange = (e) => {
    const name = e.target.value;
    setFilter((prev) => ({ ...prev, name }));
    setFilteredItems(getFilteredItems(filter.status, filter.month, name));
    setDisplayLimit(initialLimit); // Скидаємо ліміт при зміні пошуку
  };

  const handleClearSearch = () => {
    setFilter((prev) => ({ ...prev, name: "" }));
    setFilteredItems(getFilteredItems(filter.status, filter.month, ""));
    setDisplayLimit(initialLimit); // Скидаємо ліміт при очищенні пошуку
  };
  // ----------------------------

  const handleLoadMore = () => {
    // ФУНКЦІЯ ЗАВАНТАЖЕННЯ НАСТУПНОЇ ПОРЦІЇ
    setDisplayLimit((prev) => prev + initialLimit);
  };

  const sortedItems = useMemo(() => {
    let items = getFilteredItems(
      filter.status,
      filter.month,
      filter.name,
      additionalOrdersData,
    );
    return items.sort(
      (a, b) => new Date(b.dateRaw).getTime() - new Date(a.dateRaw).getTime(),
    );
  }, [filter, additionalOrdersData, getFilteredItems]);

  const toggleAdditionalOrder = (id) =>
    setExpandedAdditionalOrder(expandedAdditionalOrder === id ? null : id); // Замість toggleCalc
  const toggleOrder = (id) =>
    setExpandedOrder(expandedOrder === id ? null : id);

  // Елементи для відображення
  const itemsToDisplay = sortedItems.slice(0, displayLimit);
  // Перевірка, чи потрібно показувати кнопку "Завантажити ще"
  const showLoadMoreButton = sortedItems.length > displayLimit;

  const nextLoadCount = Math.min(
    initialLimit,
    sortedItems.length - displayLimit,
  );

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchQuery = params.get("search");
    const yearQuery = params.get("year");

    // 1. Рік
    if (yearQuery && yearQuery !== selectedYear) {
      setSelectedYear(yearQuery);
      setLoading(true);
      navigate(location.pathname, { replace: true });
      return;
    }

    if (searchQuery) {
      setFilter((prev) => ({
        ...prev,
        name: searchQuery,
        status: "Всі",
        month: 0,
      }));

      setDisplayLimit(initialLimit);

      if (additionalOrdersData.length > 0) {
        const query = searchQuery.toLowerCase();
        const found = additionalOrdersData.find(
          (ord) =>
            String(ord.number).toLowerCase().includes(query) ||
            String(ord.mainOrderNumber).toLowerCase().includes(query) ||
            ord.orders?.some((o) =>
              String(o.number).toLowerCase().includes(query),
            ),
        );

        if (found) {
          setExpandedAdditionalOrder(found.id);

          navigate(location.pathname, { replace: true });

          setTimeout(() => {
            const element = document.getElementById(`add-order-${found.id}`);
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 500);
        }
      }
    }
  }, [location.search, additionalOrdersData, selectedYear, navigate]);

  if (loading)
    return (
      <div className="loading-spinner-wrapper">
        <div className="loading-spinner"></div>
        <div className="loading-text">Завантаження...</div>
      </div>
    );

  return (
    <div className="column portal-body">
      {/* ⚠️ ВИДАЛЕНО DealerSelectModal */}

      <div className="content-summary row w-100 " style={{justifyContent: 'center'}} >
        {/* Кнопка-гамбургер для мобільного -- ПЕРЕМІЩЕНО СЮДИ */}
       

        {/* <div className="year-selector row">
          <span>Звітний рік:</span>
          <span className="icon icon-calendar2 font-size-24 text-info"></span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div> */}

        <div className="by-month-pagination-wrapper row gap-4" style={{justifyContent: 'center'}} >

        <div
          className="mobile-sidebar-toggle flex-0"
          onClick={() => setIsSidebarOpen(true)}
          style={{ marginTop: "10px" }}
        >
          <span className="icon icon-menu font-size-24"></span>
          {/* Дилер та інформація про тему можуть бути тут для мобільного */}
        </div>
          {/* Для великих екранів — список місяців */}
           <div className="year-inline-selector row">
              <img 
                  src={yearIcon} 
                  alt="Стрілка" 
                  className="align-center mr-2 w-[26px] h-[25px]" 
                  /* inline-style тут вже не потрібні, якщо є класи зверху */
                />
                <div className="w-32 flex items-center justify-center text-center text-white text-lg font-normal font-['Inter'] uppercase mr-2">
            Звітний рік
          </div>

             <select
                className="year-select-minimal"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {Array.from({ length: 3 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>


          <ul className="gap-6 row no-wrap month-list flex-1">
            <li
              className={`pagination-item ${filter.month === 0 ? "active" : ""}`}
              onClick={() => handleMonthClick(0)}
            >
              Весь рік
            </li>
            {Array.from({ length: 12 }, (_, i) => {
              const num = i + 1;
              const labels = [
                "Січ.",
                "Лют.",
                "Бер.",
                "Квіт.",
                "Трав.",
                "Черв.",
                "Лип.",
                "Сер.",
                "Вер.",
                "Жов.",
                "Лис.",
                "Груд.",
              ];
              return (
                <li
                  key={num}
                  className={`pagination-item ${filter.month === num ? "active" : ""} ${monthSummary[num] === 0 ? "disabled" : ""}`}
                  onClick={() => monthSummary[num] > 0 && handleMonthClick(num)}
                >
                  {labels[i]}{" "}
                  <span className="text-yellow">({monthSummary[num]})</span>
                </li>
              );
            })}
          </ul>

          {/* Для малих екранів — випадаючий список */}
          <select
            className="month-select flex-1"
            value={filter.month}
            onChange={(e) => handleMonthClick(Number(e.target.value))}
          >
            <option value={0}>Весь рік</option>
            {Array.from({ length: 12 }, (_, i) => {
              const num = i + 1;
              const labels = [
                "Січень",
                "Лютий",
                "Березень",
                "Квітень",
                "Травень",
                "Червень",
                "Липень",
                "Серпень",
                "Вересень",
                "Жовтень",
                "Листопад",
                "Грудень",
              ];
              return (
                <option
                  key={num}
                  value={num}
                  disabled={monthSummary[num] === 0}
                >
                  {labels[i]} ({monthSummary[num]})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="content-wrapper row w-100 h-100">
         <div className="row  h-100 max-w-[1334px]  w-100">
        {/* Sidebar з фільтрами */}
        <div
          className={`content-filter column ${isSidebarOpen ? "open" : "closed"}`}
        >
           {isSidebarOpen && <div className="sidebar-header row ai-center jc-space-between">
            {isSidebarOpen && <span>Фільтри</span>}
            {isSidebarOpen && (
              <span
                className="icon icon-cross"
                onClick={() => setIsSidebarOpen(false)}
              ></span>
            )}
          </div>
        }

          <div className="search-wrapper">
            <input
              type="text"
              className="search-orders w-full pl-10 pr-4 py-2 border rounded-md" 
              placeholder="номер дод. замовлення"
              value={filter.name}
              onChange={handleSearchChange}
            />
            <img 
              src={searchIcon} 
              alt="" 
              className="absolute left-3 top-1/2 -translate-y-1/2  opacity-50"
            />
            {/* <span
              className="icon icon-cancel2 clear-search"
              title="Очистити пошук"
              onClick={handleClearSearch}
            ></span> */}
          </div>

          {/* ⚠️ ВИДАЛЕНО блок вибору дилера */}


          <ul className="buttons">
            <li
              className="btn-add-calc"
              onClick={() => setIsNewOrderModalOpen(true)}
            >
                <img 
                  src={plusIcon} 
                  alt="+" 
                  className="align-center mr-2 " 
                  /* inline-style тут вже не потрібні, якщо є класи зверху */
                />
              <div className="text-center text-WS---DarkGrey text-[14px] font-bold font-['Inter'] uppercase">Нове дод. замовлення</div>{" "}
              {/* Змінено текст */}
            </li>
          </ul>

          <ul className="filter column align-center">
               <div className="w-72 bg-white rounded-tl-[5px] rounded-tr-[20px] rounded-bl-[5px] rounded-br-[20px] shadow-sm overflow-hidden py-[26px]">
            {[
              {
                id: "all",
                label: "Всі дод. замовлення",
                icon: allCalcIcon,
                statusKey: "Всі",
              }, // Змінено текст
              {
                id: "new",
                label: "Нові дод. замовлення",
                icon: newCalcIcon,
                statusKey: "Новий",
              }, // Змінено текст
              {
                id: "processing",
                label: "В роботі",
                icon: inProcessingIcon,
                statusKey: "В роботі",
              },
              {
                id: "waiting-payment",
                label: "Очікують оплату",
                icon: waitingForPaymentIcon,
                statusKey: "Очікуємо оплату",
              },
              {
                id: "waiting-confirm",
                label: "Очікують підтвердження",
                icon: waitingForConfirmIcon,
                statusKey: "Очікуємо підтвердження",
              },
              {
                id: "confirmed",
                label: "Підтверджені",
                icon: confirmedIcon,
                statusKey: "Підтверджений",
              },
              {
                id: "production",
                label: "Замовлення у виробництві",
                icon:factoryIcon,
                statusKey: "У виробництві",
              },
              {
                id: "ready",
                label: "Готові замовлення",
                icon: finishedIcon,
                statusKey: "Готовий",
              },
              {
                id: "shipped",
                label: "Відвантажено",
                icon: deliveredIcon,
                statusKey: "Відвантажено",
              }, // Додано
              {
                id: "rejected",
                label: "Відмова",
                icon: canceledCalcIcon,
                statusKey: "Відмова",
              },
            ].map(({ id, label, icon, statusKey }) => (
              <li
                key={id}
                className={`filter-item ${filter.status === statusKey ? "active" : ""}`}
                onClick={() => handleFilterClick(statusKey)}
              >
                <img 
                  src={icon} 
                  alt="" 
                  className={`mr-3 object-contain transition-all duration-300
                    ${filter.status === statusKey 
                      ? "brightness-0 invert group-hover:invert-0 group-hover:brightness-0" 
                      : "opacity-70 group-hover:opacity-100 group-hover:brightness-0"
                    }`} 
                />
                <span className="w-100">{label}</span>
                <span
                  className={statusSummary[statusKey] === 0 ? "disabled" : ""}
                >
                  {statusSummary[statusKey]}
                </span>
              </li>
            ))}
            </div>
          </ul>
        </div>

        {/* Основний контент */}
        <div className="content" id="content">
          <div className="items-wrapper column gap-14" id="items-wrapper">
            {error ? (
              /* --- СТАН ПОМИЛКИ --- */
              <div className="error-empty-state column align-center jc-center">
                <span className="icon icon-warning text-red font-size-48 mb-16"></span>
                <h3 className="font-size-20 weight-600 mb-8">
                  Упс! Не вдалося завантажити дані
                </h3>
                <p className="text-grey mb-24 text-center">
                  Виникла проблема під час з'єднання із сервером. <br />
                  Перевірте інтернет та спробуйте ще раз.
                </p>
                <button
                  className="btn btn-primary btn-load-more-big"
                  onClick={reloadAdditionalOrders}
                >
                  <span className="icon icon-loop2 mr-10"></span>
                  Спробувати знову
                </button>
              </div>
            ) : sortedItems.length === 0 ? (
              /* --- СТАН ПУСТО --- */
              <div className="no-data column align-center h-100">
                <div className="font-size-24 text-grey">
                  Немає додаткових замовлень для відображення
                </div>
              </div>
            ) : (
              // ВИКОРИСТОВУЄМО itemsToDisplay ДЛЯ ПАГІНАЦІЇ
              itemsToDisplay.map((additionalOrder) =>
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
                    onMarkAsRead={handleAdditionalOrderRead}
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
                    onMarkAsRead={handleAdditionalOrderRead}
                  />
                ),
              )
            )}
          </div>

          {/* КНОПКА ЗАВАНТАЖИТИ ЩЕ (СТИЛІЗОВАНА ВЕРСІЯ) */}
          {showLoadMoreButton && (
            <div
              className="row w-100"
              style={{
                marginTop: "20px",
                marginBottom: "20px",
                justifyContent: "center",
              }}
            >
              <button
                className="btn btn-primary uppercase btn-load-more-big"
                onClick={handleLoadMore}
                style={{
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: "500",
                  minWidth: "200px",
                  backgroundColor: "#5e83bf",
                  color: "#FFFFFF",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  justifySelf: "center",
                }}
              >
                <span
                  className="icon icon-loop2"
                  style={{ marginRight: "10px" }}
                ></span>
                {`Завантажити ще (${nextLoadCount} з ${sortedItems.length - displayLimit})`}
              </button>
            </div>
          )}
          {!showLoadMoreButton && sortedItems.length > initialLimit && (
            <div
              className="row jc-center text-grey"
              style={{
                marginTop: "20px",
                marginBottom: "20px",
                justifyContent: "center",
              }}
            >
              Всі додаткові замовлення завантажено ({sortedItems.length}).
            </div>
          )}
        </div>
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
