// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import axiosInstance from "../api/axios";
// import "../components/Portal/PortalOriginal.css";
// import "./PaymentStatus.css";
// import { useTheme } from "../context/ThemeContext";
// import MobilePaymentsView from "./MobilePaymentsView";
// import { formatDateHuman } from "../utils/formatters";
// import { useDealerContext } from "../hooks/useDealerContext";
// import DealerSelect from './DealerSelect'
// import { useNotification } from "../components/notification/Notifications";
// import { formatPercent }  from '../utils/formatMoney'
// // ====================================================================
// //                           FORMAT CURRENCY
// // ====================================================================
// const formatCurrency = (value, unit = "грн") => {
//   if (value == null || isNaN(Number(value))) return "—";
//   const num = Number(value);

//   const formatter = new Intl.NumberFormat("uk-UA", {
//     style: "decimal",
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });

//   if (unit === "") return formatter.format(num);
//   return `${formatter.format(num)} ${unit}`;
// };

// const useIsMobile = () => {
//   const [isMobile, setIsMobile] = useState(
//     window.matchMedia("(max-width: 1050px)").matches
//   );

//   useEffect(() => {
//     const media = window.matchMedia("(max-width: 1050px)");
//     const listener = (e) => setIsMobile(e.matches);

//     media.addEventListener("change", listener);
//     return () => media.removeEventListener("change", listener);
//   }, []);

//   return isMobile;
// };

// // ====================================================================
// //                          DETECT PAYMENT CHANNEL
// // ====================================================================
// const detectPaymentChannel = (item) => {
//   const doc = item.DocumentType || item.DealType || "";
//   const hasOrder = item.Сделка || item.OrderNumber;

//   if (hasOrder) return "order";
//   if (doc === "ППВход") return "bank";
//   if (doc === "ПКО") return "cash";
//   return "none";
// };

// const getArrowIcon = (item) => {
//   if (item.FlowDirection === "Прихід")
//     return <span className="arrow arrow-in">▲</span>;

//   if (item.FlowDirection === "Витрата")
//     return <span className="arrow arrow-out">▼</span>;

//   return <span className="arrow arrow-none">•</span>;
// };

// const getCurrentMonthDates = () => {
//   const now = new Date();
//   const year = now.getFullYear();
//   const month = now.getMonth();

//   const dateFrom = new Date(year, month, 1).toISOString().split("T")[0];
//   const dateTo = now.toISOString().split("T")[0];

//   return { dateFrom, dateTo };
// };

// const DocumentRow = React.memo(
//   ({ docGroup, formatCurrency, detectPaymentChannel, expandedRows, toggleRow }) => {
//     const docKey = docGroup.docKey;
//     const isExpanded = expandedRows.has(docKey);
//     const firstItem = docGroup.items[0];

//     const income = docGroup.totalIncome;
//     const expense = docGroup.totalExpense;
//     const cumSaldo = docGroup.lastCumSaldo;

//     const shouldShowSubRow =
//     isExpanded &&
//     detectPaymentChannel(firstItem) === "order" &&
//     (firstItem.DocumentType === "ППВход" || firstItem.DocumentType === "ПКО") &&
//     docGroup.items.length > 0;

//     const cursorShow =
//     detectPaymentChannel(firstItem) === "order" &&
//     (firstItem.DocumentType === "ППВход" || firstItem.DocumentType === "ПКО") &&
//     docGroup.items.length > 0;

//     return (
//       <>
//         {/* ===================== DOCUMENT MAIN ROW ===================== */}
//        <tr
//           className={`data-row doc-main-row
//               ${shouldShowSubRow ? "expanded-with-orders" : ""}
//               ${cursorShow ? "has-sub" : ""}`
//           }
//           onClick={() => toggleRow(docKey)}
//       >

//             {/* ЧАС */}
//         <td className="td-time">
//           {getArrowIcon(firstItem)}
//           {(firstItem.Date || "").split("T")[1]?.slice(0, 5)}
//         </td>

//           {/* OPERATION */}
//           <td  className="td-operation">
//             {firstItem.DocumentType === "КорректировкаДолга" ? (
//               <>
//                 Коригування. {firstItem.CorrectionDescription}
//                 {firstItem.DealNumber ? ", №" + firstItem.DealNumber : ""}
//               </>
//             ) : firstItem.DocumentType === "ВозвратОтПокупателя" ? (
//               <>
//                 {firstItem.DealType || firstItem.DocumentType}
//                 {firstItem.DealNumber ? ", №" + firstItem.DealNumber : ""}
//               </>
//             ) : (
//               firstItem.DealType || firstItem.DocumentType || "—"
//             )}
//           </td>

//           {/* NUMBERS */}
//           <td>{formatCurrency(docGroup.CumSaldoStart)}</td>
//           <td className={income > 0 ? "text-green" : ""}>
//             {income > 0 ? formatCurrency(income, "") : "—"}
//           </td>
//           <td className={expense > 0 ? "text-red" : ""}>
//             {expense > 0 ? formatCurrency(expense, "") : "—"}
//           </td>
//           <td className="text-bold">{formatCurrency(cumSaldo)}</td>

//           {/* CHANNEL */}
//           <td>
//             <span className={`channel-badge ${detectPaymentChannel(firstItem)}`}>
//               {detectPaymentChannel(firstItem) === "bank" && "БАНК"}
//               {detectPaymentChannel(firstItem) === "cash" && "КАСА"}
//               {detectPaymentChannel(firstItem) === "order" && "ЗАМОВЛ."}
//               {detectPaymentChannel(firstItem) === "none" && "—"}
//             </span>
//           </td>

//           {/* DETAILS / CONTRACT */}
//         <td colSpan={3} className="td-details">
//           {docGroup.items.length > 0 &&
//           detectPaymentChannel(docGroup.items[0]) === "order" &&
//           (firstItem.DocumentType === "ППВход" ||
//             firstItem.DocumentType === "ПКО") ? (
//             <span className="expand-btn">
//               {isExpanded ? (
//                 <>
//                   <i className="fa-solid fa-chevron-up" style={{ marginRight: 6 }} />
//                   Сховати {docGroup.items.length} замовлень
//                 </>
//               ) : (
//                 <>
//                   <i className="fa-solid fa-chevron-down" style={{ marginRight: 6 }} />
//                   Рознесено на {docGroup.items.length} замовлень
//                 </>
//               )}
//             </span>
//           ) : (
//               <div className="contract-cell">{firstItem.FinalDogovorName || "—"}</div>
//             )}
//           </td>
//         </tr>

//         {/* ===================== SUBROWS (ORDERS) ===================== */}
//         {isExpanded &&
//           detectPaymentChannel(docGroup.items[0]) === "order" &&
//           (firstItem.DocumentType === "ППВход" || firstItem.DocumentType === "ПКО") &&
//           docGroup.items.length > 0 && (

//           <tr className="sub-row">
//             <td colSpan={11} className="sub-wrapper indent-subcard">
//               <div className="sub-orders-container minimal">
//                 {docGroup.items.map((item, idx) => (
//                   <div
//                     key={`${docKey}-${idx}`}
//                     className="mini-card clickable-subcard"
//                     onClick={(e) => e.stopPropagation()}
//                   >
//                     <div className="order-mini-header">
//                       Замовлення № {item.OrderNumber}
//                     </div>

//                     <div className="mini-grid">
//                       <div>
//                         <span className="mini-label">Сума</span>
//                         <span className="mini-value">
//                           {formatCurrency(item.OrderAmount)}
//                         </span>
//                       </div>

//                       <div>
//                         <span className="mini-label">Оплачено до</span>
//                         <span className="mini-value text-grey">
//                           {formatCurrency(item.PaidBefore)}
//                         </span>
//                       </div>

//                       <div>
//                         <span className="mini-label">Оплата</span>
//                         <span
//                           className={
//                             item.FlowDirection === "Прихід"
//                               ? "text-green mini-green"
//                               : "text-red mini-red"
//                           }
//                         >
//                           {formatCurrency(Math.abs(Number(item.DeltaRow || 0)))}
//                         </span>
//                       </div>

//                       <div>
//                         <span className="mini-label">Залишок</span>
//                         <span className="mini-red">
//                           {formatCurrency(item.OrderBalance)}
//                         </span>
//                       </div>

//                       <div>
//                         <span className="mini-label">Відсоток</span>

//                         <span className={item.PaymentStatus < 50 ? 'mini-red' : 'mini-green'}>
//                           {item.PaymentStatus !== null ? `${formatPercent(item.PaymentStatus)} %` : "—"}
//                         </span>
//                       </div>
//                       <div>
//                         <span className="mini-label">Договір</span>
//                         <span className="mini-value">
//                           {item.FinalDogovorName || "—"}
//                         </span>
//                       </div>

//                       <div>
//                         <span className="mini-label">Дата замовлення</span>
//                         <span className="mini-value">
//                           {(formatDateHuman(item.OrderDate) || "").split("T")[0]}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </td>
//           </tr>
//         )}
//       </>
//     );
//   }
// );

// // ====================================================================
// //                        PAYMENT GROUP (DATE)
// // ====================================================================
// const PaymentGroup = React.memo(
//   ({ group, formatCurrency, detectPaymentChannel, expandedRows, toggleRow }) => {
//     if (!group || Object.keys(group.documentGroups).length === 0) return null;

//     return (
//       <>
//         {/* <tr className="spacer-row">
//         <td colSpan={11}></td>
//       </tr> */}
//         {/* DATE ROW */}
//         <tr className="date-row">
//           <td colSpan={11}>

//             <div className="date-header">
//               <span className="td-date">📅 {formatDateHuman(group.date)}</span>

//               {/* <span className="contracts-text">
//                 {Object.values(group.initialContracts).map((c, idx, arr) => (
//                   <span key={idx}>
//                     <span className="contract-name-bold">{c.contractName}</span>
//                     {": "}
//                    <span className="contract-amount">
//                       {formatCurrency(c.initialSaldo)}
//                     </span>

//                     {idx < arr.length - 1 ? ", " : ""}
//                   </span>
//                 ))}
//               </span> */}
//                <span className="contracts-text">
//     {Object.values(group.initialContracts).map((c, idx) => (
//       <span key={idx} className="contract-badge">
//         <span className="name">{c.contractName}: </span>
//         <span className="value">{formatCurrency(c.initialSaldo)}</span>
//       </span>
//     ))}
//   </span>
//             </div>
//           </td>
//         </tr>

//         {/* DOCUMENT ROWS */}
//         {Object.values(group.documentGroups).map((docGroup) => (
//           <DocumentRow
//             key={docGroup.docKey}
//             docGroup={docGroup}
//             formatCurrency={formatCurrency}
//             detectPaymentChannel={detectPaymentChannel}
//             expandedRows={expandedRows}
//             toggleRow={toggleRow}
//           />
//         ))}

//         {/* TOTAL ROW */}
//         {/* TOTAL ROW */}
// <tr className="total-row total-row-separator">
//   <td colSpan={4}>
//     📊 Разом за {formatDateHuman(group.date)}:
//   </td>
// {/*
//   <td className="text-green text-bold">
//     {formatCurrency(group.totalIncome, "")}
//   </td>

//   <td className="text-red text-bold">
//     {formatCurrency(group.totalExpense, "")}
//   </td>

//   <td className="text-bold">
//     {formatCurrency(group.balance, "")}
//   </td> */}

//   <td colSpan={6}>
//     {/* ПІДСУМКИ ПО ДОГОВОРАХ */}
//     <div className="contract-totals">
//       {Object.entries(group.contractSummary).map(([name, c], idx) => (
//         <div key={idx} className="contract-total-line">
//           <span className="contract-name-bold">{name}</span>:{" "}
//           <span className="text-green">
//             +{formatCurrency(c.income || 0, "")}
//           </span>{" "}
//           /{" "}
//           <span className="text-red">
//             -{formatCurrency(c.expense || 0, "")}
//           </span>{" "}
//           /{" "}
//           <span className="text-bold">
//             {formatCurrency(c.lastCumSaldo || 0, "")}
//           </span>
//         </div>
//       ))}
//     </div>
//   </td>
// </tr>

//       </>
//     );
//   }
// );

// const PaymentStatusV2 = () => {
//   const { theme } = useTheme();
//   const isMobile = useIsMobile();

//   const {
//     isAdmin,
//     dealerGuid,
//     setDealerGuid,
//   } = useDealerContext();

//   const { dateFrom: defaultDateFrom, dateTo: defaultDateTo } =
//     getCurrentMonthDates();

//   const [paymentsData, setPaymentsData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [expandedRows, setExpandedRows] = useState(new Set());
//   const [excelLoading, setExcelLoading] = useState(false);

//   const [filters, setFilters] = useState({
//     contractor: dealerGuid,
//     dateFrom: defaultDateFrom,
//     dateTo: defaultDateTo,
//   });

//   const { addNotification } = useNotification();

//   const downloadExcel = async () => {
//       if (excelLoading) return;

//       setExcelLoading(true);
//       try {
//         const response = await axiosInstance.get(
//           "/payments/export_payment_status_excel/",
//           {
//             params: {
//               contractor: filters.contractor,
//               date_from: filters.dateFrom,
//               date_to: filters.dateTo,
//             },
//             responseType: "blob",
//           }
//         );

//         const blob = new Blob([response.data], {
//           type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//         });

//         const url = window.URL.createObjectURL(blob);
//         const link = document.createElement("a");
//         link.href = url;
//         link.download = `payment_status_${filters.dateFrom}_${filters.dateTo}.xlsx`;
//         document.body.appendChild(link);
//         link.click();
//         link.remove();
//         window.URL.revokeObjectURL(url);

//         // Додаємо успішне сповіщення (опціонально)
//         addNotification("Excel успішно завантажено", "success");

//       } catch (error) {
//         console.error("Excel download error:", error);

//         // ОСНОВНА ЧАСТИНА: Передаємо downloadExcel у кнопку Retry
//         addNotification(
//           <div className="flex flex-col gap-2 items-center text-center">
//             <span>Не вдалося завантажити Excel-файл.</span>
//             <button
//               onClick={() => {
//                 // Тут ми викликаємо саму себе
//                 downloadExcel();
//               }}
//               className="bg-white text-red-600 px-3 py-1.5 rounded text-xs font-bold w-fit shadow-md active:scale-95 transition-transform"
//             >
//               Спробувати ще раз
//             </button>
//           </div>,
//           "warning"
//         );
//       } finally {
//         setExcelLoading(false);
//       }
//     };

//   const API_ENDPOINT = "/payments/get_payment_status_view/";

//   const toggleRow = useCallback((rowKey) => {
//     setExpandedRows((prev) => {
//       const newSet = new Set(prev);
//       newSet.has(rowKey) ? newSet.delete(rowKey) : newSet.add(rowKey);
//       return newSet;
//     });
//   }, []);

//   const fetchData = useCallback(async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const response = await axiosInstance.get(API_ENDPOINT, {
//         params: {
//           contractor: filters.contractor,
//           date_from: filters.dateFrom,
//           date_to: filters.dateTo,
//         },
//       });

//       // Перевірка чи прийшли дані
//       if (response.data && Array.isArray(response.data)) {
//           setPaymentsData(response.data);
//       } else {
//           // Якщо запит успішний, але даних немає (наприклад, порожній масив)
//           setPaymentsData([]);
//       }
//     } catch (err) {
//       console.error("Fetch Error Detail:", err);

//       // Обробка різних типів збоїв
//       if (!navigator.onLine) {
//           setError("Відсутній інтернет. Перевірте з'єднання.");
//       } else if (err.response) {
//           // Сервер відповів з помилкою (4xx, 5xx)
//           setError(`Помилка сервера: ${err.response.status}. Спробуйте пізніше.`);
//       } else {
//           // Запит взагалі не дійшов або таймаут
//           setError("Сервер недоступний або перевищено час очікування.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   }, [filters.contractor, filters.dateFrom, filters.dateTo]);

//   useEffect(() => {
//     if (!isAdmin) {
//       fetchData(); // дилер = поточний користувач
//     }
//   }, []); // ⬅️ лише при старті

//   useEffect(() => {
//     if (dealerGuid) {
//       setFilters((prev) => ({
//         ...prev,
//         contractor: dealerGuid,
//       }));
//     }
//   }, [dealerGuid]);

//   const handleFilterChange = (key, value) => {
//     setFilters((prev) => ({ ...prev, [key]: value }));
//   };

//   // ======================== GROUPING ============================
// const sortedGroups = useMemo(() => {
//   const groupedByDate = {};

//   // helper: safe number
//   const toNum = (v) => {
//     const n = Number(v);
//     return Number.isFinite(n) ? n : 0;
//   };

//   paymentsData.forEach((item) => {
//     const date = item.Date?.split("T")[0] || "Невідома дата";

//     // ✅ docKey має бути унікальним: тип+номер+registrarId(+дата)
//     // RegistrarId — найкращий ключ для одного документа
//     const docKey =
//       item.RegistrarId ||
//       `${item.DocumentType || "DOC"}|${item.DocumentNumber || "NO"}|${item.DocumentDate || item.Date || date}`;

//     if (!groupedByDate[date]) {
//       groupedByDate[date] = {
//         date,
//         documentGroups: {},
//         totalIncome: 0,
//         totalExpense: 0,
//         balance: 0,
//         lastCumSaldoTotal: null,   // важливо
//         initialContracts: {},
//         contractSummary: {},
//       };
//     }

//     const group = groupedByDate[date];

//     if (!group.documentGroups[docKey]) {
//       group.documentGroups[docKey] = {
//         docKey,
//         items: [],
//         totalIncome: 0,
//         totalExpense: 0,

//         // ✅ старт/кінець як числа
//         CumSaldoStart: toNum(item.CumSaldoStart),
//         lastCumSaldo: toNum(item.CumSaldo),

//         // ✅ для коректного загального балансу дня
//         maxDocDateTime: item.Date || item.DocumentDate || "",
//       };
//     }

//     const docGroup = group.documentGroups[docKey];
//     docGroup.items.push(item);

//     const absDelta = Math.abs(toNum(item.DeltaRow));

//     // totals по документу
//     if (item.FlowDirection === "Прихід") {
//       group.totalIncome += absDelta;
//       docGroup.totalIncome += absDelta;
//     } else if (item.FlowDirection === "Витрата") {
//       group.totalExpense += absDelta;
//       docGroup.totalExpense += absDelta;
//     }

//     // ✅ CumSaldoStart = MIN, lastCumSaldo = MAX (критично для "рознесено на N замовлень")
//     docGroup.CumSaldoStart = Math.min(docGroup.CumSaldoStart, toNum(item.CumSaldoStart));
//     docGroup.lastCumSaldo = Math.max(docGroup.lastCumSaldo, toNum(item.CumSaldo));

//     // ✅ останнє сальдо дня: беремо по найпізнішому часу
//     const tPrev = Date.parse(docGroup.maxDocDateTime) || 0;
//     const tCur = Date.parse(item.Date || item.DocumentDate || "") || 0;
//     if (tCur >= tPrev) docGroup.maxDocDateTime = item.Date || item.DocumentDate || "";

//     const gPrev = Date.parse(group.lastCumSaldoTotal?.__t || "") || 0;
//     if (tCur >= gPrev) {
//       group.lastCumSaldoTotal = { value: toNum(item.CumSaldo), __t: item.Date || item.DocumentDate || "" };
//     }

//     // ================= Contract summary =================
//     const contractName = item.FinalDogovorName || "Без договору";

//     if (!group.contractSummary[contractName]) {
//       group.contractSummary[contractName] = {
//         contractName,
//         income: 0,
//         expense: 0,
//         lastCumSaldo: null,
//         __t: "",
//       };
//     }

//     const summary = group.contractSummary[contractName];

//     if (item.FlowDirection === "Прихід") summary.income += absDelta;
//     else if (item.FlowDirection === "Витрата") summary.expense += absDelta;

//     // ✅ останнє сальдо по договору теж по найпізнішому часу
//     const sPrev = Date.parse(summary.__t) || 0;
//     if (tCur >= sPrev) {
//       summary.lastCumSaldo = toNum(item.CumSaldo);
//       summary.__t = item.Date || item.DocumentDate || "";
//     }
//   });

//   // перетворюємо lastCumSaldoTotal назад в число
//   const groups = Object.values(groupedByDate)
//     .map((g) => ({
//       ...g,
//       lastCumSaldoTotal: g.lastCumSaldoTotal?.value ?? 0,
//     }))
//     .sort((a, b) => new Date(a.date) - new Date(b.date));

//   // ✅ initialSaldo по договорах: беремо попередній день, якщо є
//   const prevDayContracts = {};

//   groups.forEach((g) => {
//     g.balance = g.lastCumSaldoTotal;

//     g.initialContracts = {};
//     Object.entries(g.contractSummary).forEach(([contractName, s]) => {
//       const last = s.lastCumSaldo ?? 0;

//       g.initialContracts[contractName] = {
//         contractName,
//         initialSaldo: prevDayContracts[contractName] ?? last,
//       };

//       prevDayContracts[contractName] = last;
//     });
//   });

//   return groups.reverse();
// }, [paymentsData]);

//   // ============================ RENDER ============================

//   if (loading)
//     return (
//       <div className={`page-container ${theme}`}>
//         <div className="loading-spinner-wrapper">
//           <div className="loading-spinner"></div>
//           <div className="loading-text">Завантаження...</div>
//         </div>
//       </div>
//     );

//   // Додайте цей блок замість вашого поточного if (error)
// if (error) {
//     return (
//       <div className={`page-container ${theme} error-state`} style={{marginTop: "80px", marginLeft: "40px",  marginRight: "40px"}}>
//         <div className="error-empty-state column align-center jc-center">
//             <span className="icon icon-warning text-red font-size-48 mb-16"></span>
//             <h3 className="font-size-20 weight-600 mb-8">Упс! Не вдалося завантажити дані</h3>
//             <p className="text-grey mb-24 text-center">
//                 Виникла проблема під час з'єднання із сервером. <br/>
//                 Перевірте інтернет та спробуйте ще раз.
//             </p>
//                <button
//             className="btn btn-primary"
//             onClick={fetchData}
//           >
//             <i className="fa-solid fa-rotate-right" style={{ marginRight: "8px" }} />
//             Спробувати ще раз
//           </button>

//         </div>
//       </div>
//     );
//   }

//   return (

//     <div className={`payments-body ${theme}`}>
//       {/* FILTERS */}

//       {isMobile ? (
//         <MobilePaymentsView
//           groups={sortedGroups}
//           formatCurrency={formatCurrency}
//           detectPaymentChannel={detectPaymentChannel}
//           expandedRows={expandedRows}
//           toggleRow={toggleRow}

//           filters={filters}
//           onFilterChange={handleFilterChange}
//           onSearch={fetchData}

//           onExcel={downloadExcel}
//           isAdmin={isAdmin}
//           setDealerGuid={setDealerGuid}
//         />

//             ) : (
//         <>
//       <div className="filters-container">
//         <label>
//           З:
//           <input
//             type="date"
//             value={filters.dateFrom}
//             onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
//             className="input-date"
//           />
//         </label>

//         <label>
//           По:
//           <input
//             type="date"
//             value={filters.dateTo}
//             onChange={(e) => handleFilterChange("dateTo", e.target.value)}
//             className="input-date"
//           />
//         </label>

//         {isAdmin && (
//           <label>
//             Дилер:
//             <DealerSelect
//               value={filters.contractor}
//               onChange={(id) => setDealerGuid(id)}
//             />

//           </label>
//         )}

//         <button
//           className="btn btn-primary"
//           onClick={fetchData}
//           disabled={loading}
//         >

//         <i className="fa-solid fa-magnifying-glass" style={{ marginRight: 8 }} />
//           Пошук
//         </button>

//         <button
//           className="btn btn-refresh"
//           onClick={fetchData}
//           disabled={loading}
//         >
//           <i className="fa-solid fa-rotate-right" style={{ marginRight: 8 }} />
//           Оновити
//         </button>

//         <button
//           className="btn btn-excel"
//           onClick={downloadExcel}
//           disabled={excelLoading}
//         >
//           {excelLoading ? "Генерація..." : "Excel"}
//         </button>

//       </div>

//       {/* TABLE */}
//       <div className="table-wrapper">
//         <table className="payments-table">
//           <thead>
//             <tr>
//               <th>Коли</th>
//               <th>Операція</th>
//               <th>Зал. на початок</th>
//               <th>Прихід</th>
//               <th>Розхід</th>
//               <th>Залишок</th>
//               <th>Через що</th>
//               <th colSpan={3}>Деталізація / Договір / Статус</th>
//             </tr>
//           </thead>

//           <tbody>
//             {sortedGroups.map((group) => (
//               <PaymentGroup
//                 key={group.date}
//                 group={group}
//                 formatCurrency={formatCurrency}
//                 detectPaymentChannel={detectPaymentChannel}
//                 expandedRows={expandedRows}
//                 toggleRow={toggleRow}
//               />
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {!paymentsData.length && !loading && (
//         <div className="text-center p-20">Даних не знайдено</div>
//       )}
//       </>
//           )}
//     </div>

//   );
// };

// export default PaymentStatusV2;
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axiosInstance from "../api/axios";
import "../components/Portal/PortalOriginal.css";
import "./PaymentStatus.css";
import { useTheme } from "../hooks/useTheme";
import MobilePaymentsView from "./MobilePaymentsView";
import { formatDateHuman } from "../utils/formatters";
import { useDealerContext } from "../hooks/useDealerContext";
import DealerSelect from "./DealerSelect";
import { useNotification } from "../hooks/useNotification";
import { formatPercent } from "../utils/formatMoney";

const formatCurrency = (value, unit) => {
  if (value == null || isNaN(Number(value))) return "—";
  const num = Number(value);
  const formatter = new Intl.NumberFormat("uk-UA", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Якщо unit не передано, використовуємо порожній рядок, інакше додаємо пробіл перед валютою
  const displayUnit = unit ? ` ${unit}` : "";
  return `${formatter.format(num)}${displayUnit}`;
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    window.matchMedia("(max-width: 1050px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1050px)");
    const listener = (e) => setIsMobile(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);
  return isMobile;
};

const detectPaymentChannel = (item) => {
  const doc = item.DocumentType || item.DealType || "";
  const hasOrder = item.Сделка || item.OrderNumber;
  if (hasOrder) return "order";
  if (doc === "ППВход") return "bank";
  if (doc === "ПКО") return "cash";
  return "none";
};

const getArrowIcon = (item) => {
  if (item.FlowDirection === "Прихід")
    return <span className="arrow arrow-in">▲</span>;
  if (item.FlowDirection === "Витрата" || item.FlowDirection === "Розхід")
    return <span className="arrow arrow-out">▼</span>;
  return <span className="arrow arrow-none">•</span>;
};

const getCurrentMonthDates = () => {
  const now = new Date();
  const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const dateTo = now.toISOString().split("T")[0];
  return { dateFrom, dateTo };
};

const DocumentRow = React.memo(
  ({
    docGroup,
    formatCurrency,
    detectPaymentChannel,
    expandedRows,
    toggleRow,
  }) => {
    const docKey = docGroup.docKey;
    const isExpanded = expandedRows.has(docKey);
    const firstItem = docGroup.items[0];
    const income = docGroup.totalIncome;
    const expense = docGroup.totalExpense;
    const cumSaldo = docGroup.lastCumSaldo;
    const currency = firstItem?.Currency_2 || "грн";

    const cursorShow =
      detectPaymentChannel(firstItem) === "order" &&
      (firstItem.DocumentType === "ППВход" ||
        firstItem.DocumentType === "ПКО") &&
      docGroup.items.length > 0;

    return (
      <>
        <tr
          className={`data-row doc-main-row ${isExpanded && cursorShow ? "expanded-with-orders" : ""} ${cursorShow ? "has-sub" : ""}`}
          onClick={() => cursorShow && toggleRow(docKey)}
        >
          <td className="td-time">
            {getArrowIcon(firstItem)}
            {(firstItem.Date || "").split("T")[1]?.slice(0, 5)}
          </td>
          <td className="td-operation">
            {firstItem.DocumentType === "КорректировкаДолга" ? (
              <>
                Коригування. {firstItem.CorrectionDescription}{" "}
                {firstItem.OrderNumber ? ` (№${firstItem.OrderNumber})` : ""}
              </>
            ) : firstItem.DocumentType === "ВозвратОтПокупателя" ? (
              <>
                {firstItem.DealType || firstItem.DocumentType}{" "}
                {firstItem.DealNumber ? ", №" + firstItem.DealNumber : ""}
              </>
            ) : (
              firstItem.DealType || firstItem.DocumentType || "—"
            )}
          </td>
          <td>{formatCurrency(docGroup.CumSaldoStart, currency)}</td>
          <td className={income > 0 ? "text-green" : ""}>
            {income > 0 ? formatCurrency(income, "") : "—"}
          </td>
          <td className={expense > 0 ? "text-red" : ""}>
            {expense > 0 ? formatCurrency(expense, "") : "—"}
          </td>
          <td className="text-bold">{formatCurrency(cumSaldo, currency)}</td>
          <td>
            <span
              className={`channel-badge ${detectPaymentChannel(firstItem)}`}
            >
              {detectPaymentChannel(firstItem) === "bank" && "БАНК"}
              {detectPaymentChannel(firstItem) === "cash" && "КАСА"}
              {detectPaymentChannel(firstItem) === "order" && "ЗАМОВЛ."}
              {detectPaymentChannel(firstItem) === "none" && "—"}
            </span>
          </td>
          <td colSpan={3} className="td-details">
            {cursorShow ? (
              <span className="expand-btn">
                {isExpanded ? (
                  <>
                    <i
                      className="fa-solid fa-chevron-up"
                      style={{ marginRight: 6 }}
                    />{" "}
                    Сховати {docGroup.items.length} замовлень
                  </>
                ) : (
                  <>
                    <i
                      className="fa-solid fa-chevron-down"
                      style={{ marginRight: 6 }}
                    />{" "}
                    Рознесено на {docGroup.items.length} замовлень
                  </>
                )}
              </span>
            ) : (
              <div className="contract-cell">
                {firstItem.FinalDogovorName || "—"}
              </div>
            )}
          </td>
        </tr>
{isExpanded && cursorShow && (
  <tr className="sub-row">
    <td colSpan={11} className="sub-wrapper indent-subcard">
      <div className="sub-orders-container minimal">
        {docGroup.items.map((item, idx) => {
          // Визначаємо валюту для поточного замовлення
          const itemCurrency = item.Currency_2 || "грн";
          
          return (
            <div
              key={`${docKey}-${idx}`}
              className="mini-card clickable-subcard"
            >
              <div className="order-mini-header">
                Замовлення № {item.OrderNumber}
              </div>
              <div className="mini-grid">
                <div>
                  <span className="mini-label">Сума</span>
                  <span className="mini-value">
                    {/* Передаємо itemCurrency сюди */}
                    {formatCurrency(item.OrderAmount, itemCurrency)}
                  </span>
                </div>
                <div>
                  <span className="mini-label">Оплачено до</span>
                  <span className="mini-value text-grey">
                    {/* І сюди теж */}
                    {formatCurrency(item.PaidBefore, itemCurrency)}
                  </span>
                </div>
                <div>
                  <span className="mini-label">Оплата</span>
                  <span
                    className={
                      item.FlowDirection === "Прихід"
                        ? "text-green mini-green"
                        : "text-red mini-red"
                    }
                  >
                    {/* І сюди */}
                    {formatCurrency(
                      Math.abs(Number(item.PaymentApplied || 0)),
                      itemCurrency
                    )}
                  </span>
                </div>
                <div>
                  <span className="mini-label">Залишок</span>
                  <span className="mini-red">
                    {/* І сюди */}
                    {formatCurrency(item.OrderBalance, itemCurrency)}
                  </span>
                </div>
                <div>
                  <span className="mini-label">Відсоток</span>
                  <span
                    className={
                      item.PaymentStatus < 50 ? "mini-red" : "mini-green"
                    }
                  >
                    {item.PaymentStatus !== null
                      ? `${formatPercent(item.PaymentStatus)} %`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </td>
  </tr>
)}
      </>
    );
  },
);

const PaymentGroup = React.memo(
  ({
    group,
    formatCurrency,
    detectPaymentChannel,
    expandedRows,
    toggleRow,
  }) => {
    if (!group || Object.keys(group.documentGroups).length === 0) return null;
    return (
      <>
        <tr className="date-row">
          <td colSpan={11}>
            <div className="date-header">
              <span className="td-date">📅 {formatDateHuman(group.date)}</span>
              <span className="contracts-text">
                {Object.values(group.initialContracts).map((c, idx) => (
                  <span key={idx} className="contract-badge">
                    <span className="name">{c.contractName}: </span>
                    <span className="value">
                     {formatCurrency(c.initialSaldo, c.currency)}
                    </span>
                  </span>
                ))}
              </span>
            </div>
          </td>
        </tr>
        {Object.values(group.documentGroups).map((dg) => (
          <DocumentRow
            key={dg.docKey}
            docGroup={dg}
            formatCurrency={formatCurrency}
            detectPaymentChannel={detectPaymentChannel}
            expandedRows={expandedRows}
            toggleRow={toggleRow}
          />
        ))}
        <tr className="total-row total-row-separator">
          <td colSpan={4}>📊 Разом за {formatDateHuman(group.date)}:</td>
          <td colSpan={6}>
            <div className="contract-totals">
              {Object.entries(group.contractSummary).map(([name, c], idx) => (
                <div key={idx} className="contract-total-line">
                  <span className="contract-name-bold">{name}</span>:{" "}
                  <span className="text-green">
                    +{formatCurrency(c.income || 0,  c.currency)}
                  </span>{" "}
                  /{" "}
                  <span className="text-red">
                    -{formatCurrency(c.expense || 0,  c.currency)}
                  </span>{" "}
                  /{" "}
                  <span className="text-bold">
                    {formatCurrency(c.lastCumSaldo || 0,  c.currency)}
                  </span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      </>
    );
  },
);

const PaymentStatusV2 = () => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const { isAdmin, dealerGuid, setDealerGuid } = useDealerContext();
  const { dateFrom: df, dateTo: dt } = getCurrentMonthDates();

  const [paymentsData, setPaymentsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [excelLoading, setExcelLoading] = useState(false);

  // Локальний стан фільтрів (те, що вводить користувач)
  const [filters, setFilters] = useState({
    contractor: dealerGuid,
    dateFrom: df,
    dateTo: dt,
  });

  // Стан фільтрів, за якими реально було зроблено пошук
  const [searchParams, setSearchParams] = useState({
    contractor: dealerGuid,
    dateFrom: df,
    dateTo: dt,
  });

  const { addNotification } = useNotification();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Використовуємо ТІЛЬКИ актуальні значення з полів введення
      const response = await axiosInstance.get(
        "/payments/get_payment_status_view/",
        {
          params: {
            contractor: filters.contractor,
            date_from: filters.dateFrom,
            date_to: filters.dateTo,
          },
        },
      );
      setPaymentsData(Array.isArray(response.data) ? response.data : []);
      // Фіксуємо параметри, за якими отримали дані (для Excel)
      setSearchParams({ ...filters });
    } catch (err) {
      console.error("Fetch Error Detail:", err);
      setError("Помилка завантаження даних.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!isAdmin) fetchData();
  }, []);
  useEffect(() => {
    if (dealerGuid) setFilters((p) => ({ ...p, contractor: dealerGuid }));
  }, [dealerGuid]);

  const downloadExcel = async () => {
    if (excelLoading) return;
    setExcelLoading(true);
    try {
      // Excel завжди качаємо за тими ж параметрами, за якими робили останній Пошук
      const response = await axiosInstance.get(
        "/payments/export_payment_status_excel/",
        {
          params: {
            contractor: searchParams.contractor,
            date_from: searchParams.dateFrom,
            date_to: searchParams.dateTo,
          },
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `payment_status_${searchParams.dateFrom}.xlsx`;
      link.click();
      addNotification("Excel успішно завантажено", "success");
    } catch (_error) {
      console.error("Error downloading Excel:", _error);
      addNotification("Не вдалося завантажити Excel", "warning");
    } finally {
      setExcelLoading(false);
    }
  };

  const toggleRow = useCallback((rowKey) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      newSet.has(rowKey) ? newSet.delete(rowKey) : newSet.add(rowKey);
      return newSet;
    });
  }, []);

  const sortedGroups = useMemo(() => {
    const groupedByDate = {};
    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    paymentsData.forEach((item) => {
      const date = item.Date?.split("T")[0] || "Невідома дата";
      const docKey = item.RegistrarId
        ? `${item.RegistrarId}_${item.FinalDogovor}_${item.FlowDirection}`
        : `${item.DocumentType}|${item.DocumentNumber}|${date}_${item.FinalDogovor}_${item.FlowDirection}`;

      if (!groupedByDate[date]) {
        groupedByDate[date] = {
          date,
          documentGroups: {},
          totalIncome: 0,
          totalExpense: 0,
          contractSummary: {},
        };
      }
      const group = groupedByDate[date];
      if (!group.documentGroups[docKey]) {
        group.documentGroups[docKey] = {
          docKey,
          items: [],
          totalIncome: 0,
          totalExpense: 0,
          CumSaldoStart: toNum(item.CumSaldoStart),
          lastCumSaldo: toNum(item.CumSaldo),
        };
      }
      const dg = group.documentGroups[docKey];
      dg.items.push(item);
      const absDelta = Math.abs(toNum(item.DeltaRow));
      if (item.FlowDirection === "Прихід") {
        group.totalIncome += absDelta;
        dg.totalIncome += absDelta;
      } else {
        group.totalExpense += absDelta;
        dg.totalExpense += absDelta;
      }
      dg.lastCumSaldo = toNum(item.CumSaldo);
      const cName = item.FinalDogovorName || "Без договору";
      if (!group.contractSummary[cName]) {
        group.contractSummary[cName] = {
          income: 0,
          expense: 0,
          lastCumSaldo: 0,
          currency: item.Currency_2 || "грн", // ЗБЕРІГАЄМО ВАЛЮТУ
          __t: "",
        };
      }
      const cs = group.contractSummary[cName];
      if (item.FlowDirection === "Прихід") cs.income += absDelta;
      else cs.expense += absDelta;
      if (Date.parse(item.Date) >= Date.parse(cs.__t || "1970-01-01")) {
        cs.lastCumSaldo = toNum(item.CumSaldo);
        cs.__t = item.Date;
      }
    });

    const groups = Object.values(groupedByDate).sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
    const prevDayTotals = {};
groups.forEach((g) => {
  g.initialContracts = {};
  Object.entries(g.contractSummary).forEach(([name, s]) => {
    g.initialContracts[name] = {
      contractName: name,
      currency: s.currency, // ПЕРЕДАЄМО ВАЛЮТУ СЮДИ
      initialSaldo:
        prevDayTotals[name] !== undefined
          ? prevDayTotals[name]
          : s.lastCumSaldo - (s.income - s.expense),
    };
    prevDayTotals[name] = s.lastCumSaldo;
  });
});
    return groups.reverse();
  }, [paymentsData]);

  if (loading)
    return (
      <div className={`page-container ${theme}`}>
        <div className="loading-spinner-wrapper">
          <div className="loading-spinner"></div>
          <div className="loading-text">Завантаження...</div>
        </div>
      </div>
    );

  if (error)
    return (
      <div
        className="error-state"
        style={{ marginTop: "80px", textAlign: "center" }}
      >
        <h3>{error}</h3>
        <button className="btn btn-primary" onClick={fetchData}>
          <i
            className="fa-solid fa-rotate-right"
            style={{ marginRight: "8px" }}
          />{" "}
          Спробувати ще раз
        </button>
      </div>
    );

  return (
    <div className={`payments-body ${theme}`}>

    <div className="max-w-[1334px] mx-auto ">

      {!isMobile ? (
        <>
          <div className="filters-container">
            <label>
              З:{" "}
              <input
                type="date"
                className="input-date"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, dateFrom: e.target.value }))
                }
              />
            </label>
            <label>
              По:{" "}
              <input
                type="date"
                className="input-date"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, dateTo: e.target.value }))
                }
              />
            </label>
            {isAdmin && (
              <label>
                Дилер:{" "}
                <DealerSelect
                  value={filters.contractor}
                  onChange={(id) => setDealerGuid(id)}
                />
              </label>
            )}

            <button
              className="btn btn-primary"
              onClick={fetchData}
              disabled={loading}
            >
              <i
                className="fa-solid fa-magnifying-glass"
                style={{ marginRight: 8 }}
              />{" "}
              Пошук
            </button>

            <button
              className="btn btn-refresh"
              onClick={fetchData}
              disabled={loading}
            >
              <i
                className="fa-solid fa-rotate-right"
                style={{ marginRight: 8 }}
              />{" "}
              Оновити
            </button>

            <button
              className="btn btn-excel"
              onClick={downloadExcel}
              disabled={excelLoading}
            >
              {excelLoading ? "Генерація..." : "Excel"}
            </button>
          </div>

          <div className="table-wrapper">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Коли</th>
                  <th>Операція</th>
                  <th>Зал. на початок</th>
                  <th>Прихід</th>
                  <th>Розхід</th>
                  <th>Залишок</th>
                  <th>Через що</th>
                  <th colSpan={3}>Деталізація / Договір</th>
                </tr>
              </thead>
              <tbody>
                {sortedGroups.map((g) => (
                  <PaymentGroup
                    key={g.date}
                    group={g}
                    formatCurrency={formatCurrency}
                    detectPaymentChannel={detectPaymentChannel}
                    expandedRows={expandedRows}
                    toggleRow={toggleRow}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {!paymentsData.length && (
            <div className="text-center p-20">Даних не знайдено</div>
          )}
        </>
      ) : (
        <MobilePaymentsView
          groups={sortedGroups}
          formatCurrency={formatCurrency}
          detectPaymentChannel={detectPaymentChannel}
          expandedRows={expandedRows}
          toggleRow={toggleRow}
          filters={filters}
          onFilterChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
          onSearch={fetchData}
          onExcel={downloadExcel}
          isAdmin={isAdmin}
          setDealerGuid={setDealerGuid}
        />
      )}
      </div>
    </div>
  );
};

export default PaymentStatusV2;
