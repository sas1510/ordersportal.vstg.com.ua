import React, { useState, useEffect, useMemo, useCallback } from "react";
import axiosInstance from "../api/axios";
import { CalculationItem } from "../components/Orders/OrderComponents";
import { CalculationItemMobile } from "../components/Orders/CalculationItemMobile";
import "../components/Portal/PortalOriginal.css";

import NewCalculationModal from "../components/Orders/NewCalculationModal";

import useWindowWidth from "../hooks/useWindowWidth";
// import { useTheme } from '../context/ThemeContext';
import useCancelAllRequests from "../hooks/useCancelAllRequests";
import DealerSelectWithAll from "./DealerSelectWithAll";
import { useDealerContext } from "../hooks/useDealerContext";
import { useTranslation } from "react-i18next";

const ITEMS_PER_LOAD = 100;
const ALL_DEALERS_VALUE = "__ALL__";

const AdminPortalOriginal = () => {
  const { dealerGuid, setDealerGuid, isAdmin } = useDealerContext();
  const { register, cancelAll } = useCancelAllRequests();

  const {t, i18n } = useTranslation();

  const [calculationsData, setCalculationsData] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  const [filter, setFilter] = useState({ status: "Всі", month: 0, name: "" });
  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear()),
  );
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);

  const [expandedCalc, setExpandedCalc] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_LOAD);

  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 1024;

  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

    const yearIcon = "/assets/icons/YearIcon.png";
  const plusIcon = "/assets/icons/PlusIcon.png";


  const searchIcon = "/assets/icons/SearchIcon.png";
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

  const availableYears = useMemo(() => {
    const startYear = 2024;
    const years = [];
    for (let y = currentYear; y >= startYear; y--) {
      years.push(String(y));
    }
    return years;
  }, [currentYear]);

  // =====================================================
  // CLIENT-SIDE FILTERING
  // =====================================================
  const getFilteredItems = useCallback(
    (status, month, name, data = calculationsData) => {
      let result = [...data];

      if (status && status !== "Всі") {
        result = result.filter((calc) => {
          const orders = calc.orders || [];
          if (orders.length === 0) return status === "Новий";
          return orders.some((o) => o.status === status);
        });
      }

      if (month !== 0) {
        result = result.filter((calc) => {
          const d = new Date(calc.dateRaw);
          return !isNaN(d.getTime()) && d.getMonth() + 1 === month;
        });
      }

      if (name) {
        const q = name.toLowerCase();
        result = result.filter(
          (calc) =>
            calc.number?.toLowerCase().includes(q) ||
            String(calc.dealer || calc.organizationName || "")
              .toLowerCase()
              .includes(q) ||
            (calc.orders || []).some((o) =>
              o.number?.toLowerCase().includes(q),
            ),
        );
      }

      return result;
    },
    [calculationsData],
  );

 
  useEffect(() => {
    if (isAdmin && !dealerGuid) {
      setDealerGuid(ALL_DEALERS_VALUE);
    }
  }, [isAdmin, dealerGuid, setDealerGuid]);

  // =====================================================
  // AUTO MONTH FOR ALL DEALERS
  // =====================================================
  useEffect(() => {
    if (isAdmin && dealerGuid === ALL_DEALERS_VALUE) {
      setFilter((prev) => {
        if (prev.month === 0) return { ...prev, month: currentMonth };
        return prev;
      });
    }
  }, [dealerGuid, isAdmin, currentMonth]);

  const shouldRefetchOnMonthChange = useMemo(
    () => isAdmin && dealerGuid === ALL_DEALERS_VALUE,
    [isAdmin, dealerGuid],
  );

  // =====================================================
  // 🔁 RELOAD (same params logic as fetch)
  // =====================================================
  const reloadCalculations = useCallback(async () => {
    cancelAll();
    const controller = register();
    setReloading(true);

    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;


      setDealerGuid(ALL_DEALERS_VALUE);
      setSelectedYear(String(year));
      setFilter((prev) => ({
        ...prev,
        month,
      }));

      const response = await axiosInstance.get("/order/get_orders_info_all/", {
        params: { year, month },
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      if (response.data?.status === "success") {
        const rawData = response.data.data?.calculation || [];

        setCalculationsData(rawData);
        setFilteredItems(
          getFilteredItems(filter.status, month, filter.name, rawData),
        );
        setDisplayLimit(ITEMS_PER_LOAD);
      } else {
        setCalculationsData([]);
        setFilteredItems([]);
      }
    } catch (err) {
      if (err.name !== "CanceledError") {
        // console.error("Reload ALL after create error:", err);
      }
    } finally {
      setReloading(false);
    }
  }, [cancelAll, register, filter, getFilteredItems]);

  // =====================================================
  // DATA FETCH (year / dealer / month only if ALL)
  // =====================================================
  useEffect(() => {
    cancelAll();
    const controller = register();
    const signal = controller.signal;

    const fetchData = async () => {
      setLoading(true);

      try {
        let endpoint = "/order/get_orders_info/";
        const params = { year: selectedYear };


        if (isAdmin && dealerGuid === ALL_DEALERS_VALUE) {
          endpoint = "/order/get_orders_info_all/";
          params.month = filter.month || currentMonth; 
        }
  
        else if (dealerGuid) {
          params.contractor_guid = dealerGuid;
        }
    
        else if (isAdmin && !dealerGuid) {
          setCalculationsData([]);
          setFilteredItems([]);
          setLoading(false);
          return;
        }

        const response = await axiosInstance.get(endpoint, { params, signal });
        if (signal.aborted) return;

        if (response.data?.status === "success") {
          const rawData = response.data.data?.calculation || [];
          setCalculationsData(rawData);
          setFilteredItems(
            getFilteredItems(filter.status, filter.month, filter.name, rawData),
          );
        } else {
          setCalculationsData([]);
          setFilteredItems([]);
        }
      } catch (err) {
        if (err.name !== "CanceledError") {
          // console.error("Помилка:", err);
          setCalculationsData([]);
          setFilteredItems([]);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
          setDisplayLimit(ITEMS_PER_LOAD);
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


  const statusSummary = useMemo(() => {
    const summary = {
      Всі: 0,
      Новий: 0,
      "В обробці": 0,
      "Очікуємо оплату": 0,
      Підтверджений: 0,
      "Очікуємо підтвердження": 0,
      "У виробництві": 0,
      Готовий: 0,
      Відвантажений: 0,
      Відмова: 0,
    };

    calculationsData.forEach((calc) => {
      summary["Всі"] +=
        calc.orders?.length || (calc.orders?.length === 0 ? 1 : 0);
      if (!calc.orders || calc.orders.length === 0) summary["Новий"] += 1;

      (calc.orders || []).forEach((order) => {
        if (order.status && summary[order.status] !== undefined) {
          summary[order.status] += 1;
        }
      });
    });

    return summary;
  }, [calculationsData]);

  const monthSummary = useMemo(() => {
    const summary = {};
    for (let i = 1; i <= 12; i++) summary[i] = 0;

    calculationsData.forEach((calc) => {
      if (!calc.dateRaw) return;
      const d = new Date(calc.dateRaw);
      if (isNaN(d.getTime())) return;
      summary[d.getMonth() + 1] += 1;
    });

    return summary;
  }, [calculationsData]);


  const handleStatusClick = (status) => {
    setFilter((prev) => ({ ...prev, status }));
    setFilteredItems(
      getFilteredItems(status, filter.month, filter.name, calculationsData),
    );
    setDisplayLimit(ITEMS_PER_LOAD);
  };



  const handleDeleteSuccess = useCallback(
    async (id) => {
      
      setCalculationsData((prev) => prev.filter((item) => item.id !== id));
      setFilteredItems((prev) => prev.filter((item) => item.id !== id));

    },
    [setCalculationsData, setFilteredItems],
  );

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
          calculationsData,
        ),
      );
    }

    setDisplayLimit(ITEMS_PER_LOAD);
  };

  const handleSearchChange = (e) => {
    const name = e.target.value;
    setFilter((prev) => ({ ...prev, name }));
    setFilteredItems(
      getFilteredItems(filter.status, filter.month, name, calculationsData),
    );
    setDisplayLimit(ITEMS_PER_LOAD);
  };

  const handleClearSearch = () => {
    setFilter((prev) => ({ ...prev, name: "" }));
    setFilteredItems(
      getFilteredItems(filter.status, filter.month, "", calculationsData),
    );
    setDisplayLimit(ITEMS_PER_LOAD);
  };

  const handleLoadMore = () => setDisplayLimit((prev) => prev + ITEMS_PER_LOAD);


  const sortedItems = useMemo(
    () =>
      [...filteredItems].sort(
        (a, b) => new Date(b.dateRaw) - new Date(a.dateRaw),
      ),
    [filteredItems],
  );

  const itemsToShow = sortedItems.slice(0, displayLimit);
  const showLoadMoreButton = sortedItems.length > displayLimit;
  const nextLoadCount = Math.min(
    ITEMS_PER_LOAD,
    sortedItems.length - displayLimit,
  );
  const remainingItems = sortedItems.length - displayLimit;

  if (loading || reloading) {
    return (
      <div className="loading-spinner-wrapper">
        <div className="loading-spinner"></div>
        <div className="loading-text">
           {reloading ? t("portal_calc.ui.reloading") : t("portal_calc.ui.loading")}
        </div>
      </div>
    );
  }

  return (
    <div className="column portal-body">
      {/* ================= HEADER ================= */}
      <div className="content-summary row w-100" style={{justifyContent: 'center'}}>
        

        

        {/* ================= MONTHS (desktop + mobile select) ================= */}
        <div className="by-month-pagination-wrapper row gap-4">

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
                    <span className="text-yellow"> ({monthSummary[num]})</span>
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
              <option value={0}> {t("portal_calc.months.all_year")}</option>
            )}

            {Array.from({ length: 12 }, (_, i) => {
              const num = i + 1;
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

      {/* ================= CONTENT ================= */}
      <div className="content-wrapper row w-100 h-100">
        {/* ===== SIDEBAR ===== */}
        <div className="row  h-100 max-w-[1334px]  w-100">
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
          </div>}

          <div className="search-wrapper text-base">
            <input
              type="text"
              className="search-orders w-full pl-10 pr-4 py-2 border rounded-md" 
              placeholder={t("portal_calc.ui.search_placeholder")}
              value={filter.name}
              onChange={handleSearchChange}
            />
            {/* {!!filter.name && (
              <span
                className="icon icon-cancel2 clear-search"
                title="Очистити пошук"
                onClick={handleClearSearch}
              />
            )} */}
              <img 
    src={searchIcon} 
    alt="" 
    className="absolute left-3 top-1/2 -translate-y-1/2  opacity-50"
  />
          </div>

          {isAdmin && (
            <>
              {/* <div className="delimiter1" /> */}
              <ul className="buttons mt-2">
                <li className="">
                    <div className="dealer-select-wrapper text-[#44403E]">
                  <DealerSelectWithAll
                    value={dealerGuid}
                    onChange={setDealerGuid}
                  />
                  </div>
                </li>
              </ul>
            </>
          )}

          {/* <div className="delimiter1"></div> */}

          <ul className="buttons">
            <li
              className="btn-add-calc"
              onClick={() => setIsCalcModalOpen(true)}
            >
              <img 
                  src={plusIcon} 
                  alt="+" 
                  className="align-center mr-2 " 
              
                />
              <div className="text-center text-WS---DarkGrey text-[18px] font-bold font-['Inter'] uppercase">{t("portal_calc.ui.new_calculation")}</div>
            </li>
          </ul>

          <ul className="filter column align-center">

              <div className="min-[1260px]:w-72 min-[1260px]:bg-[#6B98BF] min-[1260px]:shadow-sm min-[1260px]:py-[26px] 
              min-[1260px]:rounded-tl-[5px] min-[1260px]:rounded-tr-[20px] 
              min-[1260px]:rounded-bl-[5px] min-[1260px]:rounded-br-[20px]    min-[1260px]:h-full
              
              /* Скидання для малих екранів (менше 1260px) */
              max-[1260px]:bg-transparent 
              max-[1260px]:shadow-none 
              max-[1260px]:py-0 
              max-[1260px]:w-full 
              max-[1260px]:overflow-visible">
  
            {/* <li className="delimiter1"></li> */}

            {[
                  { id: "all", label: t("portal_calc.filter_labels.all"), icon: allCalcIcon, statusKey: "Всі" },
                  { id: "new", label: t("portal_calc.filter_labels.new"), icon: newCalcIcon, statusKey: "Новий" },
                  { id: "waiting-confirm", label: t("portal_calc.filter_labels.waiting_confirm"), icon: waitingForConfirmIcon, statusKey: "Очікуємо підтвердження" },
                  { id: "waiting-payment", label: t("portal_calc.filter_labels.waiting_payment"), icon: waitingForPaymentIcon, statusKey: "Очікуємо оплату" },
                  { id: "confirmed", label: t("portal_calc.filter_labels.confirmed"), icon: confirmedIcon, statusKey: "Підтверджений" },
                  { id: "production", label: t("portal_calc.filter_labels.production"), icon: factoryIcon, statusKey: "У виробництві" },
                  { id: "ready", label: t("portal_calc.filter_labels.ready"), icon: finishedIcon, statusKey: "Готовий" },
                  { id: "delivered", label: t("portal_calc.filter_labels.delivered"), icon: deliveredIcon, statusKey: "Відвантажений" },
                  { id: "rejected", label: t("portal_calc.filter_labels.rejected"), icon: canceledCalcIcon, statusKey: "Відмова" },
                ].map(({ id, label, icon, statusKey }) => (
              <li
                key={id}
                className={`filter-item text-[#fff] ${filter.status === statusKey ? "active" : ""}`}
                onClick={() => handleStatusClick(statusKey)}
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

        {/* ===== MAIN LIST ===== */}
        <div className="content" id="content">
          <div className="items-wrapper column gap-14" id="items-wrapper">
            {itemsToShow.length === 0 ? (
              <div className="no-data column align-center h-100">
                <div className="font-size-24 text-grey">
                  {t("portal_calc.ui.no_calculations")}
                </div>
              </div>
            ) : (
              itemsToShow.map((calc) =>
                isMobile ? (
                  <CalculationItemMobile
                    key={calc.id}
                    calc={calc}
                    isExpanded={expandedCalc === calc.id}
                    onToggle={() =>
                      setExpandedCalc((prev) =>
                        prev === calc.id ? null : calc.id,
                      )
                    }
                    expandedOrderId={expandedOrder}
                    onOrderToggle={setExpandedOrder}
                    onDelete={handleDeleteSuccess}
                  />
                ) : (
                  <CalculationItem
                    key={calc.id}
                    calc={calc}
                    isExpanded={expandedCalc === calc.id}
                    onToggle={() =>
                      setExpandedCalc((prev) =>
                        prev === calc.id ? null : calc.id,
                      )
                    }
                    expandedOrderId={expandedOrder}
                    onOrderToggle={setExpandedOrder}
                    onDelete={handleDeleteSuccess}
                  />
                ),
              )
            )}

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

                  {t("portal_calc.ui.load_more_admin", {
                    next: nextLoadCount, 
                    total: remainingItems
                  })}
                  

                </button>
              </div>
            )}

            {!showLoadMoreButton && sortedItems.length > ITEMS_PER_LOAD && (
              <div
                className="row justify-content-center text-grey"
                style={{ marginTop: "20px", marginBottom: "20px" }}
              >
                {t("portal_calc.ui.all_loaded", { count: sortedItems.length})}
              </div>
            )}
          </div>
        </div>
      </div>

      <NewCalculationModal
        isOpen={isCalcModalOpen}
        onClose={() => setIsCalcModalOpen(false)}
        onSave={async () => {
          setIsCalcModalOpen(false);
          await reloadCalculations();
        }}
      />
      </div>
    </div>
  );
};

export default AdminPortalOriginal;
