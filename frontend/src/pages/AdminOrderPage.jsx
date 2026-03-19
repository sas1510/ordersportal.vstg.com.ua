// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import axiosInstance from '../api/axios';
// import { CalculationItem } from '../components/Orders/OrderComponents';
// import { CalculationItemMobile } from '../components/Orders/CalculationItemMobile';
// import '../components/Portal/PortalOriginal.css';

// import NewCalculationModal from '../components/Orders/NewCalculationModal';

// import useWindowWidth from '../hooks/useWindowWidth';
// import { useTheme } from '../context/ThemeContext';
// import DealerSelectWithAll from "./DealerSelectWithAll";
// import { useDealerContext } from "../hooks/useDealerContext";

// const ITEMS_PER_LOAD = 100;
// const ALL_DEALERS_VALUE = "__ALL__";

// const AdminPortalOriginal = () => {
//   const { dealerGuid, setDealerGuid, isAdmin } = useDealerContext();

//   const [calculationsData, setCalculationsData] = useState([]);
//   const [filteredItems, setFilteredItems] = useState([]);

//   const [filter, setFilter] = useState({ status: 'Всі', month: 0, name: '' });
//   const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
//   const [loading, setLoading] = useState(true);

//   const [expandedCalc, setExpandedCalc] = useState(null);
//   const [expandedOrder, setExpandedOrder] = useState(null);

//   const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);

//   const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_LOAD);

//   const windowWidth = useWindowWidth();
//   const isMobile = windowWidth < 1024;
//   const { theme } = useTheme();

//   const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
//   const currentYear = useMemo(() => new Date().getFullYear(), []);
//   const availableYears = useMemo(() => {
//       const startYear = 2024;
//       const years = [];
//       for (let y = currentYear; y >= startYear; y--) {
//         years.push(String(y));
//       }
//       return years;
//     }, [currentYear]);

//   // =====================================================
//   // CLIENT-SIDE FILTERING
//   // =====================================================
//   const getFilteredItems = useCallback(
//     (status, month, name, data = calculationsData) => {
//       let result = [...data];

//       if (status && status !== 'Всі') {
//         result = result.filter(calc => {
//           const orders = calc.orders || [];
//           if (orders.length === 0) return status === 'Новий';
//           return orders.some(o => o.status === status);
//         });
//       }

//       if (month !== 0) {
//         result = result.filter(calc => {
//           const d = new Date(calc.dateRaw);
//           return !isNaN(d.getTime()) && d.getMonth() + 1 === month;
//         });
//       }

//       if (name) {
//         const q = name.toLowerCase();
//         result = result.filter(calc =>
//           calc.number?.toLowerCase().includes(q) ||
//           (calc.orders || []).some(o => o.number?.toLowerCase().includes(q))
//         );
//       }

//       return result;
//     },
//     [calculationsData]
//   );

//   // =====================================================
//   // AUTO MONTH FOR ALL DEALERS
//   // =====================================================
//   useEffect(() => {
//     if (isAdmin && dealerGuid === ALL_DEALERS_VALUE) {
//       setFilter(prev => {
//         if (prev.month === 0) return { ...prev, month: currentMonth };
//         return prev;
//       });
//     }
//   }, [dealerGuid, isAdmin, currentMonth]);

//   const shouldRefetchOnMonthChange = useMemo(
//     () => isAdmin && dealerGuid === ALL_DEALERS_VALUE,
//     [isAdmin, dealerGuid]
//   );

//   // =====================================================
//   // DATA FETCH (year / dealer / month only if ALL)
//   // =====================================================
//   useEffect(() => {
//     const controller = new AbortController();
//     const signal = controller.signal;

//     const fetchData = async () => {
//       setLoading(true);

//       try {
//         let endpoint = '/order/get_orders_info/';
//         const params = { year: selectedYear };

//         // 🔥 ADMIN + ALL DEALERS
//         if (isAdmin && dealerGuid === ALL_DEALERS_VALUE) {
//           endpoint = '/order/get_orders_info_all/';
//           params.month = filter.month || currentMonth; // month обов’язковий
//         }
//         // 👤 ADMIN (ONE DEALER) або USER
//         else if (dealerGuid) {
//           params.contractor_guid = dealerGuid;
//         }
//         // 👑 ADMIN але нічого не вибрано
//         else if (isAdmin && !dealerGuid) {
//           setCalculationsData([]);
//           setFilteredItems([]);
//           setLoading(false);
//           return;
//         }

//         const response = await axiosInstance.get(endpoint, { params, signal });
//         if (signal.aborted) return;

//         if (response.data?.status === "success") {
//           const rawData = response.data.data?.calculation || [];
//           setCalculationsData(rawData);
//           setFilteredItems(getFilteredItems(filter.status, filter.month, filter.name, rawData));
//         } else {
//           setCalculationsData([]);
//           setFilteredItems([]);
//         }
//       } catch (err) {
//         if (err.name !== "CanceledError") {
//           console.error("Помилка:", err);
//           setCalculationsData([]);
//           setFilteredItems([]);
//         }
//       } finally {
//         if (!signal.aborted) {
//           setLoading(false);
//           setDisplayLimit(ITEMS_PER_LOAD);
//         }
//       }
//     };

//     fetchData();
//     return () => controller.abort();
//   }, [
//     selectedYear,
//     dealerGuid,
//     isAdmin,
//     shouldRefetchOnMonthChange ? filter.month : null
//   ]);

//   // =====================================================
//   // SUMMARIES (for counts + disable months)
//   // =====================================================
//   const statusSummary = useMemo(() => {
//     const summary = {
//       'Всі': 0,
//       'Новий': 0,
//       'В обробці': 0,
//       'Очікуємо оплату': 0,
//       'Підтверджений': 0,
//       'Очікуємо підтвердження': 0,
//       'У виробництві': 0,
//       'Готовий': 0,
//       'Відвантажений': 0,
//       'Відмова': 0,
//     };

//     calculationsData.forEach(calc => {
//       // як у твоєму PortalOriginal: рахувати orders, а якщо orders=0 — вважати як "Новий"
//       summary['Всі'] += (calc.orders?.length || (calc.orders?.length === 0 ? 1 : 0));
//       if (!calc.orders || calc.orders.length === 0) summary['Новий'] += 1;

//       (calc.orders || []).forEach(order => {
//         if (order.status && summary[order.status] !== undefined) {
//           summary[order.status] += 1;
//         }
//       });
//     });

//     return summary;
//   }, [calculationsData]);

//   const monthSummary = useMemo(() => {
//     const summary = {};
//     for (let i = 1; i <= 12; i++) summary[i] = 0;

//     calculationsData.forEach(calc => {
//       if (!calc.dateRaw) return;
//       const d = new Date(calc.dateRaw);
//       if (isNaN(d.getTime())) return;
//       summary[d.getMonth() + 1] += 1;
//     });

//     return summary;
//   }, [calculationsData]);

//   // =====================================================
//   // HANDLERS (NO FETCH)
//   // =====================================================
//   const handleStatusClick = (status) => {
//     setFilter(prev => ({ ...prev, status }));
//     setFilteredItems(getFilteredItems(status, filter.month, filter.name, calculationsData));
//     setDisplayLimit(ITEMS_PER_LOAD);
//   };

//   const handleMonthClick = (month) => {
//     // ALL: “Весь рік” не можна
//     if (dealerGuid === ALL_DEALERS_VALUE && month === 0) return;

//     const newMonth =
//       filter.month === month
//         ? (dealerGuid === ALL_DEALERS_VALUE ? month : 0) // для одного дилера можна скинути повторним кліком
//         : month;

//     setFilter(prev => ({ ...prev, month: newMonth }));

//     // Один дилер: фільтр локально
//     if (dealerGuid !== ALL_DEALERS_VALUE) {
//       setFilteredItems(getFilteredItems(filter.status, newMonth, filter.name, calculationsData));
//     }
//     // ALL: fetch піде автоматично (місяць у deps тільки для ALL)

//     setDisplayLimit(ITEMS_PER_LOAD);
//   };

//   const handleSearchChange = (e) => {
//     const name = e.target.value;
//     setFilter(prev => ({ ...prev, name }));
//     setFilteredItems(getFilteredItems(filter.status, filter.month, name, calculationsData));
//     setDisplayLimit(ITEMS_PER_LOAD);
//   };

//   const handleClearSearch = () => {
//     setFilter(prev => ({ ...prev, name: '' }));
//     setFilteredItems(getFilteredItems(filter.status, filter.month, '', calculationsData));
//     setDisplayLimit(ITEMS_PER_LOAD);
//   };

//   const handleLoadMore = () => setDisplayLimit(prev => prev + ITEMS_PER_LOAD);

//   // =====================================================
//   // SORT + PAGINATION
//   // =====================================================
//   const sortedItems = useMemo(
//     () => [...filteredItems].sort((a, b) => new Date(b.dateRaw) - new Date(a.dateRaw)),
//     [filteredItems]
//   );

//   const itemsToShow = sortedItems.slice(0, displayLimit);
//   const showLoadMoreButton = sortedItems.length > displayLimit;
//   const nextLoadCount = Math.min(ITEMS_PER_LOAD, sortedItems.length - displayLimit);

//   if (loading) {
//     return (
//       <div className="loading-spinner-wrapper">
//         <div className="loading-spinner"></div>
//         <div className="loading-text">Завантаження...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="column portal-body">

//       {/* ================= HEADER ================= */}
//       <div className="content-summary row w-100">
//         <div
//           className="mobile-sidebar-toggle"
//           onClick={() => setIsSidebarOpen(true)}
//           style={{ marginTop: '10px' }}
//         >
//           <span className="icon icon-menu font-size-24"></span>
//         </div>

//         <div className="year-selector row">
//           <span>Звітний рік:</span>
//           <span className="icon icon-calendar2 font-size-24 text-info"></span>
//           <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
//             {availableYears.map(year => (
//               <option key={year} value={year}>
//                 {year}
//               </option>
//             ))}
//           </select>

//         </div>

//         {/* ================= MONTHS (desktop + mobile select) ================= */}
//         <div className="by-month-pagination-wrapper">

//           {/* --- Desktop month list --- */}
//           <ul className="gap-6 row no-wrap month-list">
//             {/* Для ALL — ховаємо "Весь рік" */}
//             {dealerGuid !== ALL_DEALERS_VALUE && (
//               <li
//                 className={`pagination-item ${filter.month === 0 ? 'active' : ''}`}
//                 onClick={() => handleMonthClick(0)}
//               >
//                 Весь рік
//               </li>
//             )}

//             {Array.from({ length: 12 }, (_, i) => {
//               const num = i + 1;
//               const labels = ['Січ.', 'Лют.', 'Бер.', 'Квіт.', 'Трав.', 'Черв.', 'Лип.', 'Сер.', 'Вер.', 'Жов.', 'Лис.', 'Груд.'];

//               // disabled тільки для одного дилера (бо ALL і так дає місяць з беку)
//               const disabled =
//                 dealerGuid !== ALL_DEALERS_VALUE && monthSummary[num] === 0;

//               return (
//                 <li
//                   key={num}
//                   className={`pagination-item ${filter.month === num ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
//                   onClick={() => {
//                     if (disabled) return;
//                     handleMonthClick(num);
//                   }}
//                 >
//                   {labels[i]}
//                   {dealerGuid !== ALL_DEALERS_VALUE && (
//                     <span className="text-grey"> ({monthSummary[num]})</span>
//                   )}
//                 </li>
//               );
//             })}
//           </ul>

//           {/* --- Mobile month select (менша версія місяців) --- */}
//           <select
//             className="month-select"
//             value={filter.month}
//             onChange={(e) => handleMonthClick(Number(e.target.value))}
//           >
//             {/* Для ALL — не показуємо "Весь рік" */}
//             {dealerGuid !== ALL_DEALERS_VALUE && (
//               <option value={0}>Весь рік</option>
//             )}

//             {Array.from({ length: 12 }, (_, i) => {
//               const num = i + 1;
//               const labels = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];

//               const disabled =
//                 dealerGuid !== ALL_DEALERS_VALUE && monthSummary[num] === 0;

//               return (
//                 <option key={num} value={num} disabled={disabled}>
//                   {labels[i]}{dealerGuid !== ALL_DEALERS_VALUE ? ` (${monthSummary[num]})` : ''}
//                 </option>
//               );
//             })}
//           </select>

//         </div>
//       </div>

//       {/* ================= CONTENT ================= */}
//       <div className="content-wrapper row w-100 h-100">

//         {/* ===== SIDEBAR ===== */}
//         <div className={`content-filter column ${isSidebarOpen ? 'open' : 'closed'}`}>
//           <div className="sidebar-header row ai-center jc-space-between">
//             {isSidebarOpen && <span>Фільтри</span>}
//             {isSidebarOpen && (
//               <span className="icon icon-cross" onClick={() => setIsSidebarOpen(false)}></span>
//             )}
//           </div>

//           <div className="search-wrapper">
//             <input
//               type="text"
//               className="search-orders"
//               placeholder="номер прорахунку, замовлення"
//               value={filter.name}
//               onChange={handleSearchChange}
//             />
//             {!!filter.name && (
//               <span
//                 className="icon icon-cancel2 clear-search"
//                 title="Очистити пошук"
//                 onClick={handleClearSearch}
//               />
//             )}
//           </div>

//           {isAdmin && (
//             <>
//               <div className="delimiter1" />
//               <ul className="buttons">
//                 <li className="">
//                   <DealerSelectWithAll value={dealerGuid} onChange={setDealerGuid} />
//                 </li>
//               </ul>
//             </>
//           )}

//           <div className="delimiter1"></div>

//           <ul className="buttons">
//             <li className="btn btn-add-calc" onClick={() => setIsCalcModalOpen(true)}>
//               <span className="icon icon-plus3"></span>
//               <span className="uppercase">Новий прорахунок</span>
//             </li>
//           </ul>


//           {/* ===== FILTERS WITH ICONS (як у тебе було) ===== */}
//           <ul className="filter column align-center">
//             <li className="delimiter1"></li>

//             {[
//               { id: "all", label: "Всі прорахунки", icon: "icon-calculator", statusKey: "Всі" },
//               { id: "new", label: "Нові прорахунки", icon: "icon-bolt", statusKey: "Новий" },
//               { id: "processing", label: "В обробці", icon: "icon-spin-alt", statusKey: "В обробці" },
//               { id: "waiting-payment", label: "Очікують оплату", icon: "icon-coin-dollar", statusKey: "Очікуємо оплату" },
//               { id: "waiting-confirm", label: "Очікують підтвердження", icon: "icon-clipboard", statusKey: "Очікуємо підтвердження" },
//               { id: "confirmed", label: "Підтверджені", icon: "icon-check", statusKey: "Підтверджений" },
//               { id: "production", label: "У виробництві", icon: "icon-cogs", statusKey: "У виробництві" },
//               { id: "ready", label: "Готові замовлення", icon: "icon-layers2", statusKey: "Готовий" },
//               { id: "delivered", label: "Відвантажені", icon: "icon-shipping", statusKey: "Відвантажений" },
//               { id: "rejected", label: "Відмова", icon: "icon-circle-with-cross", statusKey: "Відмова" }
//             ].map(({ id, label, icon, statusKey }) => (
//               <li
//                 key={id}
//                 className={`filter-item ${filter.status === statusKey ? 'active' : ''}`}
//                 onClick={() => handleStatusClick(statusKey)}
//               >
//                 <span className={`icon ${icon} font-size-24`}></span>
//                 <span className="w-100">{label}</span>
//                 <span className={statusSummary[statusKey] === 0 ? 'disabled' : ''}>
//                   {statusSummary[statusKey]}
//                 </span>
//               </li>
//             ))}
//           </ul>
//         </div>

//         {/* ===== MAIN LIST ===== */}
//         <div className="content" id="content">
//           <div className="items-wrapper column gap-14" id="items-wrapper">
//             {itemsToShow.length === 0 ? (
//               <div className="no-data column align-center h-100">
//                 <div className="font-size-24 text-grey">Немає прорахунків для відображення</div>
//               </div>
//             ) : (
//               itemsToShow.map(calc =>
//                 isMobile ? (
//                   <CalculationItemMobile
//                     key={calc.id}
//                     calc={calc}
//                     isExpanded={expandedCalc === calc.id}
//                     onToggle={() => setExpandedCalc(prev => prev === calc.id ? null : calc.id)}
//                     expandedOrderId={expandedOrder}
//                     onOrderToggle={setExpandedOrder}
//                   />
//                 ) : (
//                   <CalculationItem
//                     key={calc.id}
//                     calc={calc}
//                     isExpanded={expandedCalc === calc.id}
//                     onToggle={() => setExpandedCalc(prev => prev === calc.id ? null : calc.id)}
//                     expandedOrderId={expandedOrder}
//                     onOrderToggle={setExpandedOrder}
//                   />
//                 )
//               )
//             )}

//             {/* Load more (твій стиль) */}
//             {showLoadMoreButton && (
//               <div className="row w-100" style={{ marginTop: '20px', marginBottom: '20px', justifyContent: 'center' }}>
//                 <button
//                   className="btn btn-primary uppercase btn-load-more-big"
//                   onClick={handleLoadMore}
//                   style={{
//                     padding: '12px 24px',
//                     fontSize: '14px',
//                     fontWeight: '500',
//                     minWidth: '200px',
//                     backgroundColor: '#5e83bf',
//                     color: '#FFFFFF',
//                     borderRadius: '8px',
//                     boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
//                     justifySelf: 'center',
//                   }}
//                 >
//                   <span className="icon icon-loop2" style={{ marginRight: '10px' }}></span>
//                   {`Завантажити ще (${nextLoadCount} з ${sortedItems.length - displayLimit})`}
//                 </button>
//               </div>
//             )}

//             {!showLoadMoreButton && sortedItems.length > ITEMS_PER_LOAD && (
//               <div className="row justify-content-center text-grey" style={{ marginTop: '20px', marginBottom: '20px' }}>
//                 Всі прорахунки завантажено ({sortedItems.length}).
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       <NewCalculationModal
//         isOpen={isCalcModalOpen}
//         onClose={() => setIsCalcModalOpen(false)}
//         onSave={() => setIsCalcModalOpen(false)}
//       />
//     </div>
//   );
// };

// export default AdminPortalOriginal;
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axiosInstance from '../api/axios';
import { CalculationItem } from '../components/Orders/OrderComponents';
import { CalculationItemMobile } from '../components/Orders/CalculationItemMobile';
import '../components/Portal/PortalOriginal.css';

import NewCalculationModal from '../components/Orders/NewCalculationModal';

import useWindowWidth from '../hooks/useWindowWidth';
import { useTheme } from '../context/ThemeContext';
import useCancelAllRequests from "../hooks/useCancelAllRequests";
import DealerSelectWithAll from "./DealerSelectWithAll";
import { useDealerContext } from "../hooks/useDealerContext";

const ITEMS_PER_LOAD = 100;
const ALL_DEALERS_VALUE = "__ALL__";

const AdminPortalOriginal = () => {
  const { dealerGuid, setDealerGuid, isAdmin } = useDealerContext();
  const { register, cancelAll } = useCancelAllRequests();

  const [calculationsData, setCalculationsData] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  const [filter, setFilter] = useState({ status: 'Всі', month: 0, name: '' });
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);

  const [expandedCalc, setExpandedCalc] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // лишаю як у тебе (на майбутнє)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_LOAD);

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

  // =====================================================
  // CLIENT-SIDE FILTERING
  // =====================================================
  const getFilteredItems = useCallback(
    (status, month, name, data = calculationsData) => {
      let result = [...data];

      if (status && status !== 'Всі') {
        result = result.filter(calc => {
          const orders = calc.orders || [];
          if (orders.length === 0) return status === 'Новий';
          return orders.some(o => o.status === status);
        });
      }

      if (month !== 0) {
        result = result.filter(calc => {
          const d = new Date(calc.dateRaw);
          return !isNaN(d.getTime()) && d.getMonth() + 1 === month;
        });
      }

      if (name) {
        const q = name.toLowerCase();
        result = result.filter(calc =>
          calc.number?.toLowerCase().includes(q) ||
          (calc.orders || []).some(o => o.number?.toLowerCase().includes(q))
        );
      }

      return result;
    },
    [calculationsData]
  );

  // Додай цей useEffect на початку списку ефектів
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
      setFilter(prev => {
        if (prev.month === 0) return { ...prev, month: currentMonth };
        return prev;
      });
    }
  }, [dealerGuid, isAdmin, currentMonth]);

  const shouldRefetchOnMonthChange = useMemo(
    () => isAdmin && dealerGuid === ALL_DEALERS_VALUE,
    [isAdmin, dealerGuid]
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

    // ✅ Синхронізуємо UI
    setDealerGuid(ALL_DEALERS_VALUE);
    setSelectedYear(String(year));
    setFilter(prev => ({
      ...prev,
      month,
    }));

    const response = await axiosInstance.get(
      "/order/get_orders_info_all/",
      {
        params: { year, month },
        signal: controller.signal,
      }
    );

    if (controller.signal.aborted) return;

    if (response.data?.status === "success") {
      const rawData = response.data.data?.calculation || [];

      setCalculationsData(rawData);
      setFilteredItems(
        getFilteredItems(
          filter.status,
          month,
          filter.name,
          rawData
        )
      );
      setDisplayLimit(ITEMS_PER_LOAD);
    } else {
      setCalculationsData([]);
      setFilteredItems([]);
    }
  } catch (err) {
    if (err.name !== "CanceledError") {
      console.error("Reload ALL after create error:", err);
    }
  } finally {
    setReloading(false);
  }
  }, [
    cancelAll,
    register,
    filter,
    getFilteredItems
  ]);


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
        let endpoint = '/order/get_orders_info/';
        const params = { year: selectedYear };

        // 🔥 ADMIN + ALL DEALERS
        if (isAdmin && dealerGuid === ALL_DEALERS_VALUE) {
          endpoint = '/order/get_orders_info_all/';
          params.month = filter.month || currentMonth; // month required
        }
        // 👤 ADMIN (ONE DEALER) або USER
        else if (dealerGuid) {
          params.contractor_guid = dealerGuid;
        }
        // 👑 ADMIN але нічого не вибрано
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
          setFilteredItems(getFilteredItems(filter.status, filter.month, filter.name, rawData));
        } else {
          setCalculationsData([]);
          setFilteredItems([]);
        }
      } catch (err) {
        if (err.name !== "CanceledError") {
          console.error("Помилка:", err);
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
    shouldRefetchOnMonthChange ? filter.month : null
  ]);

  // =====================================================
  // SUMMARIES (for counts + disable months)
  // =====================================================
  const statusSummary = useMemo(() => {
    const summary = {
      'Всі': 0,
      'Новий': 0,
      'В обробці': 0,
      'Очікуємо оплату': 0,
      'Підтверджений': 0,
      'Очікуємо підтвердження': 0,
      'У виробництві': 0,
      'Готовий': 0,
      'Відвантажений': 0,
      'Відмова': 0,
    };

    calculationsData.forEach(calc => {
      summary['Всі'] += (calc.orders?.length || (calc.orders?.length === 0 ? 1 : 0));
      if (!calc.orders || calc.orders.length === 0) summary['Новий'] += 1;

      (calc.orders || []).forEach(order => {
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

    calculationsData.forEach(calc => {
      if (!calc.dateRaw) return;
      const d = new Date(calc.dateRaw);
      if (isNaN(d.getTime())) return;
      summary[d.getMonth() + 1] += 1;
    });

    return summary;
  }, [calculationsData]);

  // =====================================================
  // HANDLERS (NO FETCH)
  // =====================================================
  const handleStatusClick = (status) => {
    setFilter(prev => ({ ...prev, status }));
    setFilteredItems(getFilteredItems(status, filter.month, filter.name, calculationsData));
    setDisplayLimit(ITEMS_PER_LOAD);
  };

  // Усередині AdminPortalOriginal перед return:

const handleDeleteSuccess = useCallback(async (id) => {
  // Варіант А: Швидке видалення зі списку (UI)
  setCalculationsData(prev => prev.filter(item => item.id !== id));
  setFilteredItems(prev => prev.filter(item => item.id !== id));
  
  // Варіант Б: Повне оновлення з сервера (щоб оновити лічильники в сайдбарі)
  // await reloadCalculations(); 
}, [setCalculationsData, setFilteredItems]);

  const handleMonthClick = (month) => {
    if (dealerGuid === ALL_DEALERS_VALUE && month === 0) return;

    const newMonth =
      filter.month === month
        ? (dealerGuid === ALL_DEALERS_VALUE ? month : 0)
        : month;

    setFilter(prev => ({ ...prev, month: newMonth }));

    if (dealerGuid !== ALL_DEALERS_VALUE) {
      setFilteredItems(getFilteredItems(filter.status, newMonth, filter.name, calculationsData));
    }

    setDisplayLimit(ITEMS_PER_LOAD);
  };

  const handleSearchChange = (e) => {
    const name = e.target.value;
    setFilter(prev => ({ ...prev, name }));
    setFilteredItems(getFilteredItems(filter.status, filter.month, name, calculationsData));
    setDisplayLimit(ITEMS_PER_LOAD);
  };

  const handleClearSearch = () => {
    setFilter(prev => ({ ...prev, name: '' }));
    setFilteredItems(getFilteredItems(filter.status, filter.month, '', calculationsData));
    setDisplayLimit(ITEMS_PER_LOAD);
  };

  const handleLoadMore = () => setDisplayLimit(prev => prev + ITEMS_PER_LOAD);

  // =====================================================
  // SORT + PAGINATION
  // =====================================================
  const sortedItems = useMemo(
    () => [...filteredItems].sort((a, b) => new Date(b.dateRaw) - new Date(a.dateRaw)),
    [filteredItems]
  );

  const itemsToShow = sortedItems.slice(0, displayLimit);
  const showLoadMoreButton = sortedItems.length > displayLimit;
  const nextLoadCount = Math.min(ITEMS_PER_LOAD, sortedItems.length - displayLimit);

  if (loading || reloading) {
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

      {/* ================= HEADER ================= */}
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

        {/* ================= MONTHS (desktop + mobile select) ================= */}
        <div className="by-month-pagination-wrapper">
          <ul className="gap-6 row no-wrap month-list">
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

          <select
            className="month-select"
            value={filter.month}
            onChange={(e) => handleMonthClick(Number(e.target.value))}
          >
            {dealerGuid !== ALL_DEALERS_VALUE && (
              <option value={0}>Весь рік</option>
            )}

            {Array.from({ length: 12 }, (_, i) => {
              const num = i + 1;
              const labels = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];

              const disabled =
                dealerGuid !== ALL_DEALERS_VALUE && monthSummary[num] === 0;

              return (
                <option key={num} value={num} disabled={disabled}>
                  {labels[i]}{dealerGuid !== ALL_DEALERS_VALUE ? ` (${monthSummary[num]})` : ''}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="content-wrapper row w-100 h-100">

        {/* ===== SIDEBAR ===== */}
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
            {!!filter.name && (
              <span
                className="icon icon-cancel2 clear-search"
                title="Очистити пошук"
                onClick={handleClearSearch}
              />
            )}
          </div>

          {isAdmin && (
            <>
              <div className="delimiter1" />
              <ul className="buttons">
                <li className="">
                  <DealerSelectWithAll value={dealerGuid} onChange={setDealerGuid} />
                </li>
              </ul>
            </>
          )}

          <div className="delimiter1"></div>

          <ul className="buttons">
            <li className="btn btn-add-calc" onClick={() => setIsCalcModalOpen(true)}>
              <span className="icon icon-plus3"></span>
              <span className="uppercase">Новий прорахунок</span>
            </li>
          </ul>

          <ul className="filter column align-center">
            <li className="delimiter1"></li>

            {[
              { id: "all", label: "Всі прорахунки", icon: "icon-calculator", statusKey: "Всі" },
              { id: "new", label: "Нові прорахунки", icon: "icon-bolt", statusKey: "Новий" },
              { id: "processing", label: "В обробці", icon: "icon-spin-alt", statusKey: "В обробці" },
              { id: "waiting-payment", label: "Очікують оплату", icon: "icon-coin-dollar", statusKey: "Очікуємо оплату" },
              { id: "waiting-confirm", label: "Очікують підтвердження", icon: "icon-clipboard", statusKey: "Очікуємо підтвердження" },
              { id: "confirmed", label: "Підтверджені", icon: "icon-check", statusKey: "Підтверджений" },
              { id: "production", label: "У виробництві", icon: "icon-cogs", statusKey: "У виробництві" },
              { id: "ready", label: "Готові замовлення", icon: "icon-layers2", statusKey: "Готовий" },
              { id: "delivered", label: "Відвантажені", icon: "icon-shipping", statusKey: "Відвантажений" },
              { id: "rejected", label: "Відмова", icon: "icon-circle-with-cross", statusKey: "Відмова" }
            ].map(({ id, label, icon, statusKey }) => (
              <li
                key={id}
                className={`filter-item ${filter.status === statusKey ? 'active' : ''}`}
                onClick={() => handleStatusClick(statusKey)}
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

        {/* ===== MAIN LIST ===== */}
        <div className="content" id="content">
          <div className="items-wrapper column gap-14" id="items-wrapper">
            {itemsToShow.length === 0 ? (
              <div className="no-data column align-center h-100">
                <div className="font-size-24 text-grey">Немає прорахунків для відображення</div>
              </div>
            ) : (
              itemsToShow.map(calc =>
                isMobile ? (
                  <CalculationItemMobile
                    key={calc.id}
                    calc={calc}
                    isExpanded={expandedCalc === calc.id}
                    onToggle={() => setExpandedCalc(prev => prev === calc.id ? null : calc.id)}
                    expandedOrderId={expandedOrder}
                    onOrderToggle={setExpandedOrder}
                    onDelete={handleDeleteSuccess}
                  />
                ) : (
                  <CalculationItem
                    key={calc.id}
                    calc={calc}
                    isExpanded={expandedCalc === calc.id}
                    onToggle={() => setExpandedCalc(prev => prev === calc.id ? null : calc.id)}
                    expandedOrderId={expandedOrder}
                    onOrderToggle={setExpandedOrder}
                    onDelete={handleDeleteSuccess}
                  />
                )
              )
            )}

            {showLoadMoreButton && (
              <div className="row w-100" style={{ marginTop: '20px', marginBottom: '20px', justifyContent: 'center' }}>
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

            {!showLoadMoreButton && sortedItems.length > ITEMS_PER_LOAD && (
              <div className="row justify-content-center text-grey" style={{ marginTop: '20px', marginBottom: '20px' }}>
                Всі прорахунки завантажено ({sortedItems.length}).
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
  );
};

export default AdminPortalOriginal;
