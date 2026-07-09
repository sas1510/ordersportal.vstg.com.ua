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
import { useTranslation } from "react-i18next";
import { useNotification } from "../hooks/useNotification";

const initialLimit = 100;



const AdditionalOrders = () => {
  const { register, cancelAll } = useCancelAllRequests();
  const {addNotificaton}  = useNotification();
  const {t, i18n} = useTranslation();
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [additionalOrdersData, setAdditionalOrdersData] = useState([]); 
  const [_filteredItems, setFilteredItems] = useState([]);
  const [filter, setFilter] = useState({ status: "Всі", month: 0, name: "" });
  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear()),
  ); 
  const [loading, setLoading] = useState(true);
  const [expandedAdditionalOrder, setExpandedAdditionalOrder] = useState(null); 
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


  const allCalcIcon = "/assets/icons/AdditionalOrderIcon.png";
  const newCalcIcon = "/assets/icons/NewCalcIcon.png";
  const inProcessingIcon = "/assets/icons/InProcessingIcon.png";
  const waitingForPaymentIcon = "/assets/icons/WaitingForPaymentIcon.png";
  const waitingForConfirmIcon = "/assets/icons/WaitingForConfirmIcon.png";
  const confirmedIcon = "/assets/icons/ConfirmedIcon.png";
  const factoryIcon = "/assets/icons/FactoringIcon.png";
  const finishedIcon = "/assets/icons/FinishedIcon.png";
  const deliveredIcon = "/assets/icons/DeliveredIcon.png";
  const canceledCalcIcon = "/assets/icons/CancelCalc.png";

  const filterIcon = "/assets/icons/FiltersIcon.png";
  const closeIcon = "/assets/icons/CloseButton.png";

  const statusIcons = {
    all: "/assets/icons/AdditionalOrderIcon.png",
    new: "/assets/icons/NewCalcIcon.png",
    processing: "/assets/icons/InProcessingIcon.png",
    waitingPay: "/assets/icons/WaitingForPaymentIcon.png",
    waitingConfirm: "/assets/icons/WaitingForConfirmIcon.png",
    confirmed: "/assets/icons/ConfirmedIcon.png",
    factory: "/assets/icons/FactoringIcon.png",
    finished: "/assets/icons/FinishedIcon.png",
    delivered: "/assets/icons/DeliveredIcon.png",
    canceled: "/assets/icons/CancelCalc.png",
  };

  const navigate = useNavigate();

  const handleDeleteAdditionalOrder = useCallback((additionalOrderId) => {

    setAdditionalOrdersData((prev) =>
      prev.filter((ord) => ord.id !== additionalOrderId),
    );
    setFilteredItems((prev) =>
      prev.filter((ord) => ord.id !== additionalOrderId),
    );
 
    setDisplayLimit(initialLimit);
  }, []);

  const handleUpdateAdditionalOrder = useCallback((updatedOrder) => {
    
    setAdditionalOrdersData((prev) =>
      prev.map((ord) => (ord.id === updatedOrder.id ? updatedOrder : ord)),
    );
    setFilteredItems((prev) =>
      prev.map((ord) => (ord.id === updatedOrder.id ? updatedOrder : ord)),
    );
  }, []);



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


    if (response.data?.success === true || response.status === 201) {
      setIsNewOrderModalOpen(false);
      setRefreshTrigger((prev) => prev + 1);
      
   
      // alert(response.data?.message || "Дозамовлення створено");
    } else {
     
      addNotificaton(t("errors.error") + (response.data?.message || t("errors.unknownError")), "error");
    }
  } catch (err) {
    // console.error("Помилка відправки:", err);
    addNotificaton(t("errors.errorSendData_2"),  "error");
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


  const getFilteredItems = useCallback(
    (statusFilter, monthFilter, nameFilter, data = additionalOrdersData) => {
      let filtered = [...data]; 

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
            additionalOrder.mainOrderNumber?.toLowerCase().includes(query) ||
            String(additionalOrder.dealer || additionalOrder.organizationName || "")
              .toLowerCase()
              .includes(query) ||
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
      setError(null); 

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
          setError(t("additiona_order.errors.server_error"));
        }
      } catch (error) {
        if (error.name !== "CanceledError") {
          setError(t("additiona_order.errors.connect_error"));
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
  }, [selectedYear, refreshTrigger]); 

  const reloadAdditionalOrders = useCallback(async () => {
    cancelAll();
    const controller = register();
    setReloading(true);
    setError(null); 

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
       
        setFilteredItems(
          getFilteredItems(filter.status, filter.month, filter.name, formatted),
        );
        setDisplayLimit(initialLimit);
      } else {
        setError(t("additiona_order.errors.server_error"));
      }
    } catch (err) {
      if (err.name !== "CanceledError") {
        setError(t("additiona_order.errors.connect_error"));
      }
    } finally {
      setReloading(false);
    }
  }, [cancelAll, register, selectedYear, filter, getFilteredItems]);

  const getStatusSummary = useMemo(() => {
    return () => {

      const summary = {
        Всі: 0,
        Новий: 0,
        "В роботі": 0,
        "Очікуємо оплату": 0,
        Підтверджений: 0,
        "Очікуємо підтвердження": 0,
        "У виробництві": 0,
        Готовий: 0,
        Відвантажено: 0, 
        Відмова: 0,
      };

      additionalOrdersData.forEach((additionalOrder) => {
        if (additionalOrder.orders.length === 0) summary["Новий"] += 1;
        additionalOrder.orders.forEach((order) => {
          if (order.status && Object.hasOwn(summary, order.status))
            summary[order.status] += 1;
        });
      });
      summary["Всі"] = additionalOrdersData.length;
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


  const handleFilterClick = (statusKey) => {
    setFilter((prev) => ({ ...prev, status: statusKey }));

    setFilteredItems(getFilteredItems(statusKey, filter.month, filter.name));
    setDisplayLimit(initialLimit); 
  };

  const handleMonthClick = (month) => {
    const newMonth = filter.month === month ? 0 : month;
    setFilter((prev) => ({ ...prev, month: newMonth }));
    setFilteredItems(getFilteredItems(filter.status, newMonth, filter.name));
    setDisplayLimit(initialLimit); 
  };

  const handleSearchChange = (e) => {
    const name = e.target.value;
    setFilter((prev) => ({ ...prev, name }));
    setFilteredItems(getFilteredItems(filter.status, filter.month, name));
    setDisplayLimit(initialLimit); 
  };

  const handleClearSearch = () => {
    setFilter((prev) => ({ ...prev, name: "" }));
    setFilteredItems(getFilteredItems(filter.status, filter.month, ""));
    setDisplayLimit(initialLimit); 
  };


  const handleLoadMore = () => {
  
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
    setExpandedAdditionalOrder(expandedAdditionalOrder === id ? null : id); 
  const toggleOrder = (id) =>
    setExpandedOrder(expandedOrder === id ? null : id);


  const itemsToDisplay = sortedItems.slice(0, displayLimit);

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
            String(ord.dealer || ord.organizationName || "")
              .toLowerCase()
              .includes(query) ||
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
        <div className="loading-text">{t("common.loading")}</div>
      </div>
    );

  return (
    <div className="column portal-body">


      <div className="content-summary row w-100 " style={{justifyContent: 'center'}} >

       

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
            className="mobile-sidebar-toggle mr-1"
            onClick={() => setIsSidebarOpen(true)}
           
          >
                <img 
                  src={filterIcon} 
                  alt="Стрілка" 
                  className="align-center mr-1 min-w-[20px] h-[20px]" 
                 
                />
          </div>

           <div className="year-inline-selector row">
              <img 
                  src={yearIcon} 
                  alt="Стрілка" 
                  className="align-center mr-2 w-[26px] h-[25px]" 
              
                />
                <div className="flex items-center justify-center text-center text-white text-lg font-normal font-['Inter'] uppercase mr-2">
            {t("portal_calc.ui.report_year")}
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
              {t("portal_calc.months.all_year")}
            </li>
            {Array.from({ length: 12 }, (_, i) => {
              const num = i + 1;
              // const labels = [
              //   "Січ.",
              //   "Лют.",
              //   "Бер.",
              //   "Квіт.",
              //   "Трав.",
              //   "Черв.",
              //   "Лип.",
              //   "Сер.",
              //   "Вер.",
              //   "Жов.",
              //   "Лис.",
              //   "Груд.",
              // ];
              const labels = t("portal_calc.months.short", { returnObjects: true });
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

       
          <select
            className="month-select flex-1"
            value={filter.month}
            onChange={(e) => handleMonthClick(Number(e.target.value))}
          >
            <option value={0}>{t("portal_calc.months.all_year")}</option>
            {Array.from({ length: 12 }, (_, i) => {
              const num = i + 1;
              // const labels = [
              //   "Січень",
              //   "Лютий",
              //   "Березень",
              //   "Квітень",
              //   "Травень",
              //   "Червень",
              //   "Липень",
              //   "Серпень",
              //   "Вересень",
              //   "Жовтень",
              //   "Листопад",
              //   "Грудень",
              // ];
              const labels = t("portal_calc.months.full", { returnObjects: true });
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

       
            {isSidebarOpen && (
                  <div 
                  className="fixed inset-0 !z-[10001] min-[1260px]:hidden transition-opacity" 
                  style={{ backgroundColor: 'color-mix(in srgb, var(--header-profile-bg), transparent 60%)' }}
                  onClick={() => setIsSidebarOpen(false)}
                />
                )}
                  <div
                    className={`content-filter   column ${isSidebarOpen ? "open" : "closed"}`}
                  >
                    {isSidebarOpen &&
                    <div className="sidebar-header row ai-center jc-space-between min-[1260px]:!hidden">
                      {isSidebarOpen && <span>{t("portal_calc.ui.filters")}</span>}
                      {isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(false)} 
                className=" hover:opacity-70 transition-opacity"
              >
                <img 
                  src={closeIcon} 
                  alt="Закрити" 
                  className="" 
                />
              </button>
            )}
                    </div>
          }

          <div className="search-wrapper">
            <input
              type="text"
              className="search-orders w-full pl-10 pr-4 py-2 border rounded-md" 
              placeholder={t("additional_order.search_placeholder")}
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




          <ul className="buttons">
            <li
              className="btn-add-calc !min-h-[65px]"
              onClick={() => setIsNewOrderModalOpen(true)}
            >
                <img 
                  src={plusIcon} 
                  alt="+" 
                  className="align-center mr-2 " 
                
                />
              <div className="text-center  text-WS---DarkGrey text-[18px] font-bold font-['Inter'] uppercase">{t("additional_order.new_order_btn")}</div>{" "}
  
            </li>
          </ul>

          {/* <ul className="filter column align-center">
              <div className="min-[1260px]:w-72 min-[1260px]:bg-[#6B98BF] min-[1260px]:shadow-sm min-[1260px]:py-[26px] 
              min-[1260px]:rounded-tl-[5px] min-[1260px]:rounded-tr-[20px] 
              min-[1260px]:rounded-bl-[5px] min-[1260px]:rounded-br-[20px]  min-[1260px]:h-full
              

              max-[1260px]:bg-transparent 
              max-[1260px]:shadow-none 
              max-[1260px]:py-0 
              max-[1260px]:w-full 
              max-[1260px]:overflow-visible"> */}

                   <ul className="filter column align-center h-full overflow-hidden">
  <div
    className="
      w-full
      h-full
      min-h-full
      bg-[#6B98BF]
      shadow-sm
      py-[26px]
      rounded-tl-[5px]
      rounded-tr-[20px]
      rounded-bl-[5px]
      rounded-br-[20px]
      overflow-y-auto
      overflow-x-hidden
    "
  >
            {[
    { id: "all", label: t("additional_order.statuses.all"), icon: statusIcons.all, statusKey: "Всі" },
    { id: "new", label: t("additional_order.statuses.new"), icon: statusIcons.new, statusKey: "Новий" },
    { id: "processing", label: t("additional_order.statuses.in_work"), icon: statusIcons.processing, statusKey: "В роботі" },
    { id: "waiting-payment", label: t("additional_order.statuses.waiting_pay"), icon: statusIcons.waitingPay, statusKey: "Очікуємо оплату" },
    { id: "waiting-confirm", label: t("additional_order.statuses.waiting_confirm"), icon: statusIcons.waitingConfirm, statusKey: "Очікуємо підтвердження" },
    { id: "confirmed", label: t("additional_order.statuses.confirmed"), icon: statusIcons.confirmed, statusKey: "Підтверджений" },
    { id: "production", label: t("additional_order.statuses.in_production"), icon: statusIcons.factory, statusKey: "У виробництві" },
    { id: "ready", label: t("additional_order.statuses.ready"), icon: statusIcons.finished, statusKey: "Готовий" },
    { id: "shipped", label: t("additional_order.statuses.shipped"), icon: statusIcons.delivered, statusKey: "Відвантажено" },
    { id: "rejected", label: t("additional_order.statuses.rejected"), icon: statusIcons.canceled, statusKey: "Відмова" },
  ].map(({ id, label, icon, statusKey }) => (
              <li
                key={id}
                className={`filter-item  text-[#fff] ${filter.status === statusKey ? "active" : ""}`}
                onClick={() => handleFilterClick(statusKey)}
              >
                <img 
                  src={icon} 
                  alt="" 
                  className={`mr-3 object-contain ${
                    filter.status === statusKey 
                      ? "opacity-70"
                      : "brightness-0 invert"
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

  
        <div className="content" id="content">
          <div className="items-wrapper column gap-14" id="items-wrapper">
            {error ? (
           
              <div className="error-empty-state column align-center jc-center">
                <span className="icon icon-warning text-red font-size-48 mb-16"></span>
                <h3 className="font-size-20 weight-600 mb-8">
                  {t("additional_order.states.error_title")}
                </h3>
                <p className="text-grey mb-24 text-center">
                  {t("additional_order.states.error_text")}
                </p>
                <button
                  className="btn btn-primary btn-load-more-big"
                  onClick={reloadAdditionalOrders}
                >
                  <span className="icon icon-loop2 mr-10"></span>
                  {t("additional_order.states.try_again")}
                </button>
              </div>
            ) : sortedItems.length === 0 ? (
          
              <div className="no-data column align-center h-100">
                <div className="font-size-24 text-grey">
                  {t("additional_order.states.no_data")}
                </div>
              </div>
            ) : (
          
              itemsToDisplay.map((additionalOrder) =>
                isMobile ? (
                  <AdditionalOrderItemMobile 
                    key={additionalOrder.id}
                    calc={additionalOrder} 
                    isExpanded={expandedAdditionalOrder === additionalOrder.id}
                    onToggle={() => toggleAdditionalOrder(additionalOrder.id)}
                    expandedOrderId={expandedOrder}
                    onOrderToggle={toggleOrder}
                    onDelete={handleDeleteAdditionalOrder}
                    onEdit={handleUpdateAdditionalOrder}
                    onMarkAsRead={handleAdditionalOrderRead}
                    reloadCalculations={reloadAdditionalOrders}
                  />
                ) : (
                  <AdditionalOrderItem 
                    key={additionalOrder.id}
                    calc={additionalOrder} 
                    isExpanded={expandedAdditionalOrder === additionalOrder.id}
                    onToggle={() => toggleAdditionalOrder(additionalOrder.id)}
                    expandedOrderId={expandedOrder}
                    onOrderToggle={toggleOrder}
                    onDelete={handleDeleteAdditionalOrder}
                    onEdit={handleUpdateAdditionalOrder}
                    onMarkAsRead={handleAdditionalOrderRead}
                    reloadCalculations={reloadAdditionalOrders}
                  />
                ),
              )
            )}
          </div>

         
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
               {t("additional_order.states.load_more", { count: nextLoadCount, total: sortedItems.length - displayLimit })}
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
              {t("additional_order.states.all_loaded", { total: sortedItems.length })}
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
