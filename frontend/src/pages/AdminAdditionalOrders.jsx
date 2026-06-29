import React, { useState, useEffect, useCallback, useMemo } from "react";
import axiosInstance from "../api/axios";
import "../components/Portal/PortalOriginal.css";
import { AdditionalOrderItem } from "../components/AdditionalOrder/AdditionalOrderItem";
import { AdditionalOrderItemMobile } from "../components/AdditionalOrder/AdditionalOrderItemMobile";
import AddReorderModal from "../components/AdditionalOrder/AddReorderModal";
import useWindowWidth from "../hooks/useWindowWidth";

import { useTranslation } from "react-i18next";
// import { useTheme } from '../context/ThemeContext';
import useCancelAllRequests from "../hooks/useCancelAllRequests";
import DealerSelectWithAll from "./DealerSelectWithAll";
import { useDealerContext } from "../hooks/useDealerContext";

const ALL_DEALERS_VALUE = "__ALL__"; 
const initialLimit = 100;

const AdminAdditionalOrders = () => {
    const { register, cancelAll } = useCancelAllRequests();
  const { dealerGuid, setDealerGuid, isAdmin } = useDealerContext();
  const {t} = useTranslation();
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [additionalOrdersData, setAdditionalOrdersData] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ status: "Всі", month: 0, name: "" });
  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear()),
  );

  const [expandedAdditionalOrder, setExpandedAdditionalOrder] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(initialLimit);


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
  const filterIcon = "/assets/icons/FiltersIcon.png";

  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 1024;

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

  // const { theme } = useTheme();

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
      return date.toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      // console.error("Date parsing error:", e);
      return dateStr;
    }
  };

  // =========================
  // CLIENT-SIDE FILTERING
  // =========================
  const getFilteredItems = useCallback(
    (statusFilter, monthFilter, nameFilter, data = additionalOrdersData) => {
      let filtered = [...data];

      if (statusFilter && statusFilter !== "Всі") {
        filtered = filtered.filter((additionalOrder) => {
          const orders = additionalOrder.orders || [];
          if (orders.length === 0) return statusFilter === "Новий";
          return orders.some((order) => order.status === statusFilter);
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
        filtered = filtered.filter((additionalOrder) => {
          const orders = additionalOrder.orders || [];
          return (
            additionalOrder.number?.toLowerCase().includes(query) ||
            additionalOrder.mainOrderNumber?.toLowerCase().includes(query) ||
            orders.some((order) => order.number?.toLowerCase().includes(query))
          );
        });
      }

      return filtered;
    },
    [additionalOrdersData],
  );


  useEffect(() => {
    if (isAdmin && dealerGuid === ALL_DEALERS_VALUE) {
      setFilter((prev) => {
        if (prev.month === 0) return { ...prev, month: currentMonth };
        return prev;
      });
    }
  }, [isAdmin, dealerGuid, currentMonth]);


  const shouldRefetchOnMonthChange = useMemo(() => {
    return isAdmin && dealerGuid === ALL_DEALERS_VALUE;
  }, [isAdmin, dealerGuid]);


  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      setLoading(true);
      try {
        let endpoint = "/additional_orders/get_additional_orders_info/";
        const params = { year: selectedYear };

        if (isAdmin && dealerGuid === ALL_DEALERS_VALUE) {
          endpoint = "/additional_orders/get_additional_orders_info_all/";
          params.month = filter.month || currentMonth; 
        } else if (dealerGuid) {
  
          params.contractor = dealerGuid;
        } else if (isAdmin && !dealerGuid) {
     
          setAdditionalOrdersData([]);
          setFilteredItems([]);
          setLoading(false);
          return;
        }

        const response = await axiosInstance.get(endpoint, { params, signal });
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
          setAdditionalOrdersData([]);
          setFilteredItems([]);
        }
      } catch (error) {
        if (error.name !== "CanceledError") {
          // console.error("Помилка запиту:", error);
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
    shouldRefetchOnMonthChange ? filter.month : null,
  ]);


  const reloadAdditionalOrders = useCallback(async () => {
    cancelAll();
    const controller = register();
    setReloading(true);
    setError(null); 

    try {
      const response = await axiosInstance.get(
        "/additional_orders/get_additional_orders_info_all/",
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


  const handleFilterClick = (statusKey) => {
    setFilter((prev) => ({ ...prev, status: statusKey }));
    setFilteredItems(
      getFilteredItems(
        statusKey,
        filter.month,
        filter.name,
        additionalOrdersData,
      ),
    );
    setDisplayLimit(initialLimit);
  };

  const handleMonthClick = (month) => {

    if (dealerGuid === ALL_DEALERS_VALUE && month === 0) return;

    const newMonth =
      filter.month === month
        ? dealerGuid === ALL_DEALERS_VALUE
          ? month
          : 0 
        : month;

    setFilter((prev) => ({ ...prev, month: newMonth }));


    if (dealerGuid !== ALL_DEALERS_VALUE) {
      setFilteredItems(
        getFilteredItems(
          filter.status,
          newMonth,
          filter.name,
          additionalOrdersData,
        ),
      );
    }


    setDisplayLimit(initialLimit);
  };

  const handleSearchChange = (e) => {
    const name = e.target.value;
    setFilter((prev) => ({ ...prev, name }));
    setFilteredItems(
      getFilteredItems(filter.status, filter.month, name, additionalOrdersData),
    );
    setDisplayLimit(initialLimit);
  };

  const handleAdditionalOrderRead = useCallback((id) => {
    setAdditionalOrdersData((prev) =>
      prev.map((o) => (o.id === id ? { ...o, hasUnreadMessages: false } : o)),
    );

    setFilteredItems((prev) =>
      prev.map((o) => (o.id === id ? { ...o, hasUnreadMessages: false } : o)),
    );
  }, []);




  const handleClearSearch = () => {
    setFilter((prev) => ({ ...prev, name: "" }));
    setFilteredItems(
      getFilteredItems(filter.status, filter.month, "", additionalOrdersData),
    );
    setDisplayLimit(initialLimit);
  };

  const handleLoadMore = () => setDisplayLimit((prev) => prev + initialLimit);

  const handleDeleteAdditionalOrder = useCallback((id) => {
    setAdditionalOrdersData((prev) => prev.filter((ord) => ord.id !== id));
    setFilteredItems((prev) => prev.filter((ord) => ord.id !== id));
    setDisplayLimit(initialLimit);
  }, []);

  const handleUpdateAdditionalOrder = useCallback((updated) => {
    setAdditionalOrdersData((prev) =>
      prev.map((o) => (o.id === updated.id ? updated : o)),
    );
    setFilteredItems((prev) =>
      prev.map((o) => (o.id === updated.id ? updated : o)),
    );
  }, []);

  const handleSaveAdditionalOrder = useCallback((_newOrder) => {

    setIsNewOrderModalOpen(false);
    setDisplayLimit(initialLimit);
  }, []);


  const statusSummary = useMemo(() => {
    const summary = {
      Всі: 0,
      Новий: 0,
      "В роботі": 0,
      "Очікуємо оплату": 0,
      Підтверджений: 0,
      "Очікуємо підтвердження": 0,
      "У виробництві": 0,
      Готовий: 0,
      Доставлено: 0,
      Відвантажено: 0,
      Відмова: 0,
    };

    additionalOrdersData.forEach((item) => {
      summary["Всі"]++;
      const orders = item.orders || [];
      if (orders.length === 0) summary["Новий"]++;
      orders.forEach((o) => {
        if (o.status && Object.hasOwn(summary, o.status)) summary[o.status]++;
      });
    });

    return summary;
  }, [additionalOrdersData]);

  const monthSummary = useMemo(() => {
    const summary = {};
    for (let i = 1; i <= 12; i++) summary[i] = 0;

    additionalOrdersData.forEach((item) => {
      if (!item.dateRaw) return;
      const d = new Date(item.dateRaw);
      if (isNaN(d.getTime())) return;
      const m = d.getMonth() + 1;
      if (Object.hasOwn(summary, m)) {
          summary[m]++;
        }
    });

    return summary;
  }, [additionalOrdersData]);


  const sortedItems = useMemo(() => {
    return [...filteredItems].sort(
      (a, b) => new Date(b.dateRaw).getTime() - new Date(a.dateRaw).getTime(),
    );
  }, [filteredItems]);

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

  if (loading || reloading)
    return (
      <div className="loading-spinner-wrapper">
        <div className="loading-spinner"></div>
        <div className="loading-text">{t("common.loading")}</div>
      </div>
    );

  return (
    <div className="column portal-body">
      <div className="content-summary row w-100"  style={{justifyContent: 'center'}}>


        {/* <div className="year-selector row">
          <span>Звітний рік:</span>
          <span className="icon icon-calendar2 font-size-24 text-info"></span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
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

            {dealerGuid !== ALL_DEALERS_VALUE && (
              <li
                className={`pagination-item ${filter.month === 0 ? "active" : ""}`}
                onClick={() => handleMonthClick(0)}
              >
                {t("portal_calc.months.all_year")}
              </li>
            )}
            

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

              const disabled =
                dealerGuid !== ALL_DEALERS_VALUE && monthSummary[num] === 0;

              return (
                <li
                  key={num}
                  className={`pagination-item ${filter.month === num ? "active" : ""} ${disabled ? "disabled" : ""}`}
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


          <select
            className="month-select flex-1"
            value={filter.month}
            onChange={(e) => handleMonthClick(Number(e.target.value))}
          >

            {dealerGuid !== ALL_DEALERS_VALUE && (
              <option value={0}>{t("portal_calc.months.all_year")}</option>
            )}

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

              const disabled =
                dealerGuid !== ALL_DEALERS_VALUE && monthSummary[num] === 0;

              return (
                <option key={num} value={num} disabled={disabled}>
                  {labels[i]}
                  {dealerGuid !== ALL_DEALERS_VALUE
                    ? ` (${monthSummary[num]})`
                    : ""}
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
          className={`content-filter column ${isSidebarOpen ? "open" : "closed"}`}
        >
          {isSidebarOpen && <div className="sidebar-header row ai-center jc-space-between">
            {isSidebarOpen && <span>{t("portal_calc.ui.filters")}</span>}
            {isSidebarOpen && (
              <span
                className="icon icon-cross"
                onClick={() => setIsSidebarOpen(false)}
              ></span>
            )}
          </div> }

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
          </div>

          {isAdmin && (
            <>
              {/* <div className="delimiter1" /> */}
              <div className="dealer-select-wrapper text-[#44403E] mb-2 ">
                <DealerSelectWithAll
                  value={dealerGuid}
                  onChange={setDealerGuid}
                />
              </div>
            </>
          )}

          {/* <div className="delimiter1"></div> */}

          {/* <ul className="buttons">
            <li
              className="btn btn-add-calc"
              onClick={() => setIsNewOrderModalOpen(true)}
            >
               <img 
                  src={plusIcon} 
                  alt="+" 
                  className="align-center mr-2 " 
                 
                />
              <div className="text-center text-WS---DarkGrey text-[14px] font-bold font-['Inter'] uppercase">Нове дод. замовлення</div>{" "}
            </li>
          </ul> */}

          <ul className="filter column align-center">

             <div className="min-[1260px]:w-72 min-[1260px]:bg-[#6B98BF] min-[1260px]:shadow-sm min-[1260px]:py-[26px] 
              min-[1260px]:rounded-tl-[5px] min-[1260px]:rounded-tr-[20px] 
              min-[1260px]:rounded-bl-[5px] min-[1260px]:rounded-br-[20px]  min-[1260px]:h-full
              
              /* Скидання для малих екранів (менше 1260px) */
              max-[1260px]:bg-transparent 
              max-[1260px]:shadow-none 
              max-[1260px]:py-0 
              max-[1260px]:w-full 
              max-[1260px]:overflow-visible">
            {/* <li className="delimiter1"></li> */}
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
                className={`filter-item text-[#fff] ${filter.status === statusKey ? "active" : ""}`}
                onClick={() => handleFilterClick(statusKey)}
              >
                {/* <span className={`icon ${icon} font-size-24`}></span> */}

                <img 
                  src={icon}
                  alt="" 
                  className={`mr-3 object-contain transition-all duration-300
                      ${filter.status === statusKey 
                      ?  "opacity-70 group-hover:opacity-100 group-hover:brightness-0"
                    : "brightness-0 invert group-hover:invert-0 group-hover:brightness-0" 
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
          <div className="items-wrapper column gap-1">
            {sortedItems.length === 0 ? (
              <div className="no-data column align-center h-100">
                <div className="font-size-24 text-grey">
                   {t("additional_order.states.no_data")}
                </div>
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
                    onMarkAsRead={handleAdditionalOrderRead}
                    reloadCalculations={reloadAdditionalOrders}
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
                    onMarkAsRead={handleAdditionalOrderRead}
                    reloadCalculations={reloadAdditionalOrders}
                  />
                ),
              )
            )}
          </div>

          {/* Load more (твій стиль) */}
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

      <AddReorderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onSave={handleSaveAdditionalOrder}
      />
      </div>
    </div>
  );
};

export default AdminAdditionalOrders;
