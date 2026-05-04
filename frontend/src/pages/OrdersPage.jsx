import React, { useState, useEffect, useMemo, useCallback } from "react";
import axiosInstance from "../api/axios";
import { CalculationItem } from "../components/Orders/OrderComponents";
import { CalculationItemMobile } from "../components/Orders/CalculationItemMobile";
import "../components/Portal/PortalOriginal.css";

import NewCalculationModal from "../components/Orders/NewCalculationModal";

import useWindowWidth from "../hooks/useWindowWidth";
// import { useTheme } from '../context/ThemeContext';
import useCancelAllRequests from "../hooks/useCancelAllRequests";
import { useLocation, useNavigate } from "react-router-dom";
// import { useDealerContext } from "../hooks/useDealerContext";

const ITEMS_PER_LOAD = 100;

const PortalOriginal = () => {
  const { register, cancelAll } = useCancelAllRequests();

  // const {
  //     currentUser,
  // } = useDealerContext();
  const [error, setError] = useState(null);

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

  const closeIcon = "/assets/icons/CloseButton.png";

  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [calculationsData, setCalculationsData] = useState([]);
  const [filter, setFilter] = useState({ status: "Всі", month: 0, name: "" });

  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  

  const [loading, setLoading] = useState(false);
  const [expandedCalc, setExpandedCalc] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [limit, setLimit] = useState(ITEMS_PER_LOAD);
  const [hasMore, setHasMore] = useState(false);

  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 1024;

  const [reloading, setReloading] = useState(false);
  const navigate = useNavigate();

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchQuery = params.get("search");
    const yearQuery = params.get("year");


    if (yearQuery && yearQuery !== selectedYear) {
      setLoading(true);
      setSelectedYear(yearQuery);

     
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

      setLimit(ITEMS_PER_LOAD);


      if (calculationsData.length > 0) {
        const found = calculationsData.find(
          (calc) =>
            String(calc.number)
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            calc.orders?.some((o) =>
              String(o.number)
                .toLowerCase()
                .includes(searchQuery.toLowerCase()),
            ),
        );

        if (found) {
          setExpandedCalc(found.id);

          navigate(location.pathname, { replace: true });

          setTimeout(() => {
            const element = document.getElementById(`calc-${found.id}`);
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 500);
        }
      }
    }
  }, [location.search, calculationsData, selectedYear, navigate]);

  useEffect(() => {
    return () => cancelAll();
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
    setLimit(ITEMS_PER_LOAD);
  }, []);

  const handleDeleteCalculation = useCallback((calcId) => {
    setCalculationsData((prev) => prev.filter((calc) => calc.id !== calcId));
    setLimit(ITEMS_PER_LOAD);
  }, []);

  const handleUpdateCalculation = useCallback((updatedCalc) => {
    setCalculationsData((prev) =>
      prev.map((calc) => (calc.id === updatedCalc.id ? updatedCalc : calc)),
    );
  }, []);

  const handleMarkAsRead = (orderId) => {
  setCalculationsData((prev) =>
    prev.map((calc) => ({
      ...calc,
      orders: calc.orders.map((order) =>
        order.id === orderId ? { ...order, hasUnreadMessages: false } : order
      ),
    }))
  );
};



  const handleCloseCalc = useCallback(() => setIsCalcModalOpen(false), []);

  const reloadCalculations = useCallback(async () => {
    cancelAll();
    const controller = register();
    setReloading(true);
    setError(null); 

    try {
      const response = await axiosInstance.get("/order/get_orders_info/", {
        params: { year: selectedYear },
        signal: controller.signal,
      });

      if (response.data?.status === "success") {
        const allCalculations = response.data.data.calculation || [];
        setCalculationsData(allCalculations);
        setLimit(ITEMS_PER_LOAD);
        setHasMore(allCalculations.length > ITEMS_PER_LOAD);
      } else {
        setError("Сервер повернув помилку при оновленні даних.");
      }
    } catch (err) {
      if (err.name !== "CanceledError") {
        setError("Не вдалося оновити дані. Перевірте з'єднання.");
        // console.error("Помилка оновлення:", err);
      }
    } finally {
      setReloading(false);
    }
  }, [cancelAll, register, selectedYear]);

  const handleSaveCalculation = useCallback(async () => {
    setIsCalcModalOpen(false);
    await reloadCalculations();
  }, [reloadCalculations]);

  const toggleCalc = useCallback(
    (id) => setExpandedCalc((prev) => (prev === id ? null : id)),
    [],
  );

  const toggleOrder = useCallback(
    (id) => setExpandedOrder((prev) => (prev === id ? null : id)),
    [],
  );

  const handleLoadMore = useCallback(() => {
    if (hasMore) setLimit((prev) => prev + ITEMS_PER_LOAD);
  }, [hasMore]);

  const statusSummary = useMemo(() => {
    const summary = {
      Всі: 0,
      Новий: 0,
      // "В обробці": 0,
      "Очікуємо оплату": 0,
      "Очікуємо підтвердження": 0,
      Підтверджений: 0,
      "У виробництві": 0,
      Готовий: 0,
      Відвантажений: 0,
      Відмова: 0,
    };

    calculationsData.forEach((calc) => {
      summary["Всі"] += calc.orders.length || 1;
      if (calc.orders.length === 0) summary["Новий"] += 1;
      calc.orders.forEach((order) => {
        if (summary[order.status] !== undefined) {
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
      if (!isNaN(d)) summary[d.getMonth() + 1]++;
    });

    return summary;
  }, [calculationsData]);

  const getFilteredItems = useCallback(
    (status, month, name) => {
      let items = [...calculationsData];

      if (status !== "Всі") {
        items = items.filter((calc) =>
          calc.orders.length === 0
            ? status === "Новий"
            : calc.orders.some((o) => o.status === status),
        );
      }

      if (month !== 0) {
        items = items.filter((calc) => {
          const d = new Date(calc.dateRaw);
          return !isNaN(d) && d.getMonth() + 1 === month;
        });
      }

      if (name) {
        const q = name.toLowerCase();
        items = items.filter(
          (calc) =>
            calc.number.toLowerCase().includes(q) ||
            calc.orders.some((o) => o.number?.toLowerCase().includes(q)),
        );
      }

      return items;
    },
    [calculationsData],
  );

  const fullFiltered = useMemo(() => {
    return getFilteredItems(filter.status, filter.month, filter.name).sort(
      (a, b) => new Date(b.dateRaw) - new Date(a.dateRaw),
    );
  }, [filter, getFilteredItems]);
  const totalFilteredCount = fullFiltered.length;
  const remainingCount = totalFilteredCount - limit;
  const loadAmount = Math.min(ITEMS_PER_LOAD, remainingCount);

  const buttonText =
    loadAmount < ITEMS_PER_LOAD
      ? `Завантажити ще (${loadAmount})`
      : `Завантажити ще (100 із ${remainingCount})`;

  const paginatedItems = useMemo(() => {
    const slice = fullFiltered.slice(0, limit);
    setHasMore(fullFiltered.length > limit);
    return slice;
  }, [fullFiltered, limit]);


  useEffect(() => {
    cancelAll();
    const controller = register();
    setError(null);

    const load = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/order/get_orders_info/", {
          params: { year: selectedYear },
          signal: controller.signal,
        });

        if (response.data?.status === "success") {
          const all = response.data.data.calculation || [];
          setCalculationsData(all);
          setLimit(ITEMS_PER_LOAD);
          setHasMore(all.length > ITEMS_PER_LOAD);
        } else {
          setCalculationsData([]);
        }
      } catch (err) {
        if (err.name !== "CanceledError") {
          setError("Не вдалося оновити дані. Перевірте з'єднання. ");
          // console.error("Помилка оновлення:", err);
        }
        setCalculationsData([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [selectedYear]);

  if (loading ) {
    return (
      <div className="loading-spinner-wrapper">
        <div className="loading-spinner"></div>
        <div className="loading-text">
          {reloading ? "Оновлення даних..." : "Завантаження..."}
        </div>
      </div>
    );
  }
  return (
    <div className="column portal-body">

      <div className="content-summary row w-100 justify-center">


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

        <div className="by-month-pagination-wrapper ">
          <div className="pagination-container w-100 row no-wrap items-center gap-2">
            
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
           
            <div className="year-inline-selector row  mr-6 ">
              <img 
                  src={yearIcon} 
                  alt="Стрілка" 
                  className="align-center mr-1 w-[26px] h-[25px]" 
  
                />
<div 
  className="justify-start text-white text-sm uppercase mr-2 tracking-wide"
  style={{ fontWeight: 50, fontFamily: "'Inter', sans-serif" }}
>
  Звітний рік
</div>
             <select
                className="year-select-minimal mr-2"
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

 

          
            <ul className="gap-6 row no-wrap month-list">
              <li
                className={`pagination-item ${filter.month === 0 ? "active" : ""}`}
                onClick={() => handleFilterChange("month", 0)}
              >
                Весь рік
              </li>
              {Array.from({ length: 12 }, (_, i) => {
                const num = i + 1;
                const labels = ["Січ.", "Лют.", "Бер.", "Квіт.", "Трав.", "Черв.", "Лип.", "Сер.", "Вер.", "Жов.", "Лис.", "Груд."];
                return (
                  <li
                    key={num}
                    className={`pagination-item ${filter.month === num ? "active" : ""} ${monthSummary[num] === 0 ? "disabled" : ""}`}
                    onClick={() => monthSummary[num] > 0 && handleFilterChange("month", num)}
                  >
                    {labels[i]} <span className="text-yellow">({monthSummary[num]})</span>
                  </li>
                );
              })}
            </ul>


            <select
            className="month-select row"
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
      </div>

      

      <div className="content-wrapper row w-100 h-100  " >
        <div className="row  h-100 max-w-[1334px]  w-100">

          {isSidebarOpen && (
                  <div 
                  className="fixed inset-0 !z-[10000] min-[1260px]:hidden transition-opacity" 
                  style={{ backgroundColor: 'color-mix(in srgb, var(--header-profile-bg), transparent 60%)' }}
                  onClick={() => setIsSidebarOpen(false)}
                />
                )}
                  <div
                    className={`content-filter   column ${isSidebarOpen ? "open" : "closed"}`}
                  >
                    {isSidebarOpen &&
                    <div className="sidebar-header row ai-center jc-space-between min-[1260px]:!hidden">
                      {isSidebarOpen && <span>Фільтри</span>}
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

          <div className="search-wrapper relative ">
  <input
    type="text"
    className="search-orders w-full pl-10 pr-4 py-2 border rounded-md" 
    placeholder="номер прорахунку, замовлення"
    value={filter.name}
    onChange={(e) => handleFilterChange("name", e.target.value)}
  />
  <img 
    src={searchIcon} 
    alt="" 
    className="absolute left-3 top-1/2 -translate-y-1/2  opacity-50"
  />
</div>

          {/* {localStorage.getItem('role') !== 'customer' && (
                        <div>
                            <div className="delimiter1"/>
                            <ul className="buttons">
                                <li className="btn btn-select-dealer" onClick={() => setShowDealerModal(true)}>
                                    <span className="icon icon-user-check"></span>
                                    <span className="uppercase">Вибрати дилера</span>
                                </li>
                            </ul>
                        </div>
                    )} */}
          <div></div>

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
              <div className="text-center text-WS---DarkGrey text-[18px] font-bold font-['Inter'] uppercase">новий прорахунок</div>
            </li>
          </ul>


          


          <ul className="filter column align-center">
            <div className="min-[1260px]:w-72 min-[1260px]:bg-white min-[1260px]:shadow-sm min-[1260px]:py-[26px] 
              min-[1260px]:rounded-tl-[5px] min-[1260px]:rounded-tr-[20px] 
              min-[1260px]:rounded-bl-[5px] min-[1260px]:rounded-br-[20px] 
              
              /* Скидання для малих екранів (менше 1260px) */
              max-[1260px]:bg-transparent 
              max-[1260px]:shadow-none 
              max-[1260px]:py-0 
              max-[1260px]:w-full 
              max-[1260px]:overflow-visible">
  

            {/* <li className="delimiter1"></li> */}
            {[
              {
                id: "all",
                label: "Всі прорахунки",
                icon: allCalcIcon,
                statusKey: "Всі",
              },
              {
                id: "new",
                label: "Нові прорахунки",
                icon: newCalcIcon,
                statusKey: "Новий",
              },
              // {
              //   id: "processing",
              //   label: "В обробці",
              //   icon: inProcessingIcon,
              //   statusKey: "В обробці",
              // },
              {
                id: "waiting-confirm",
                label: "Очікують підтвердження",
                icon: waitingForConfirmIcon,
                statusKey: "Очікуємо підтвердження",
              },
              {
                id: "waiting-payment",
                label: "Очікують оплату",
                icon: waitingForPaymentIcon,
                statusKey: "Очікуємо оплату",
              },

              {
                id: "confirmed",
                label: "Підтверджені",
                icon: confirmedIcon,
                statusKey: "Підтверджений",
              },
              {
                id: "production",
                label: "У виробництві",
                icon: factoryIcon,
                statusKey: "У виробництві",
              },
              {
                id: "ready",
                label: "Готові замовлення",
                icon: finishedIcon,
                statusKey: "Готовий",
              },
              {
                id: "delivered",
                label: "Відвантажені",
                icon: deliveredIcon,
                statusKey: "Відвантажений",
              },
              {
                id: "rejected",
                label: "Відмова",
                icon: canceledCalcIcon,
                statusKey: "Відмова",
              },
            ].map(({ id, label, icon, statusKey }) => (
              <li
                key={id}
                className={`filter-item row ${filter.status === statusKey ? "active" : ""}`}
                onClick={() => handleFilterChange("status", statusKey)}
              >

                
                {/* <span className={`icon ${icon} font-size-24`}></span> */}
              <img 
                src={icon} 
                alt="" 
                className={`mr-3 object-contain transition-all duration-300
                  ${filter.status === statusKey 
                    ? "brightness-0 invert group-hover:invert-0 group-hover:brightness-0" 
                    : "opacity-70 group-hover:opacity-100 group-hover:brightness-0"
                  }`} 
              />
                <span className="w-100  text-base font-normal font-['Inter']">{label}</span>
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

        <div className="content justify-center" id="content" >
          <div className="items-wrapper column gap-14" id="items-wrapper">
            {error ? (

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
                  onClick={reloadCalculations}
                >
                  <span className="icon icon-loop2 mr-10"></span>
                  Спробувати знову
                </button>
              </div>
            ) : totalFilteredCount === 0 ? (
         
              <div className="no-data column align-center h-100">
                <div className="font-size-24 text-grey">
                  Немає прорахунків для відображення
                </div>
              </div>
            ) : (
              paginatedItems.map((calc) =>
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
                    onMarkAsRead={handleMarkAsRead}
                    reloadCalculations={reloadCalculations}
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
                    onMarkAsRead={handleMarkAsRead}
                    reloadCalculations={reloadCalculations}
                  />
                ),
              )
            )}

  
            {hasMore && (
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
                  {buttonText}
                </button>
              </div>
            )}


            {!hasMore && totalFilteredCount > ITEMS_PER_LOAD && (
              <div
                className="row justify-content-center text-grey"
                style={{ marginTop: "20px", marginBottom: "20px" }}
              >
                Всі прорахунки завантажено ({totalFilteredCount}).
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      
      <NewCalculationModal
        isOpen={isCalcModalOpen}
        onClose={handleCloseCalc} 
        onSave={handleSaveCalculation}
      />
      </div>

  );
};

export default PortalOriginal;
