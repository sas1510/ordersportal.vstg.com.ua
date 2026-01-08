// import React, { useState, useEffect, useRef, useMemo } from 'react';
// import axios from 'axios'; // Потрібен для перевірки скасування запиту
// // ❌ Було: '../api/axios' 
// // ✅ Спроба виправлення: Прибираємо один '..', якщо файл знаходиться на рівні /src/pages/
// import axiosInstance from '../api/axios'; 
// // АБО якщо файл знаходиться на рівні /src/
// // import axiosInstance from './api/axios'; 

// import { ReclamationItem } from '../components/Reclamations/ReclamationItem';
// import { ReclamationItemMobile } from '../components/Reclamations/ReclamationItemMobile';
// import AddClaimModal from '../components/Orders/AddClaimModal';
// import DealerSelectModal from '../components/Orders/DealerSelectModal';
// import useWindowWidth from '../hooks/useWindowWidth';
// import { useTheme } from '../context/ThemeContext';
// import '../components/Reclamations/ReclamationItem.css';

// const RECLAMATIONS_API_URL = '/get_reclamation_info/';

// /**
//  * Форматує сирі дані з API у зручний для відображення формат.
//  * @param {Array} data
//  * @returns {Array}
//  */
// function formatApiData(data) {
//     if (!Array.isArray(data)) return [];

//     return data.map(item => {
//         const dateRaw = item.ComplaintDate || item.DateInWork || new Date().toISOString();
//         const dateObj = new Date(dateRaw);
//         const statusKey = item.StatusName || 'Новий';
        
//         return {
//             id: item.ComplaintNumber,
//             number: item.ClaimOrderNumber,
//             actNumber: item.ComplaintNumber,
//             numberWEB: item.NumberWEB,
//             orderNumber: item.OrderNumber,
//             organization: item.OrganizationName,
//             dateRaw: dateRaw,
//             date: isNaN(dateObj) ? 'N/A' : dateObj.toLocaleDateString('uk-UA'),
//             deliveryDate: item.DeliveryDateText || null,
//             determinationDate: item.DeterminationDateText || null,
//             readyDate: item.BorderReturnDate,
//             producedDate: item.ProducedDate,
//             soldDate: item.SoldDate,
//             status: statusKey,
//             problem: item.IssueName,
//             resolution: item.SolutionName || null,
//             description: item.ParsedDescription,
//             series: item.SeriesList || null,
//             manager: item.LastManagerName || 'N/A',
//             amount: parseFloat(item.DocumentAmount || item.DocumentSum || item.CompensationAmount || 0),
//             dealer: item.Customer || 'N/A',
//             file: !!item.AdditionalInformation,
//             issueCount: 0,
//             issues: [],
//             statuses: { [statusKey]: 1 },
//             message: item.ParsedDescription,
//         };
//     });
// }

// /**
//  * Отримує початкові дані дилера з localStorage.
//  * @returns {{id: string, name: string} | null}
//  */
// const getInitialDealer = () => {
//     const storedDealerId = localStorage.getItem('dealerId');
//     const storedDealerName = localStorage.getItem('dealerName'); // Додано для повноти
//     if (storedDealerId && storedDealerName) {
//         return { id: storedDealerId, name: storedDealerName };
//     }
//     return null;
// };

// // Константа для кроку завантаження пагінації
// const ITEMS_TO_LOAD = 100;

// const ReclamationPortal = () => {
//     // State
//     const [isNewReclamationModalOpen, setIsNewReclamationModalOpen] = useState(false);
//     const [reclamationsData, setReclamationsData] = useState([]);
//     const [filter, setFilter] = useState({ status: 'Всі', month: 0, name: '' });
//     const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
//     const [loading, setLoading] = useState(true);

//     // ПАГІНАЦІЯ: Стан для "Load More"
//     const [visibleItemsCount, setVisibleItemsCount] = useState(ITEMS_TO_LOAD);

//     // UI State
//     const [expandedReclamation, setExpandedReclamation] = useState(null);
//     const [expandedIssue, setExpandedIssue] = useState(null);
//     const [showDealerModal, setShowDealerModal] = useState(false);
//     const [dealer, setDealer] = useState(getInitialDealer);
//     const [isSidebarOpen, setIsSidebarOpen] = useState(false);

//     // Ref для відстеження чи був вже виклик API (хоча AbortController це робить краще)
//     const hasFetchedRef = useRef(false);

//     const windowWidth = useWindowWidth();
//     const isMobile = windowWidth < 1024;
//     const { theme, toggleTheme } = useTheme();

//     /* --- [ЛОГІКА ДИЛЕРА] --- */

//     useEffect(() => {
//         const role = localStorage.getItem('role');
//         // Якщо роль не customer і дилер не обраний, показуємо модальне вікно
//         if (role !== 'customer' && !dealer) {
//             setShowDealerModal(true);
//         }
//     }, [dealer]);

//     const handleDealerSelect = (selectedDealer) => {
//         if (selectedDealer === null) {
//             setDealer(null);
//             localStorage.removeItem('dealerId');
//             localStorage.removeItem('dealerName');
//         } else {
//             setDealer(selectedDealer);
//             localStorage.setItem('dealerId', selectedDealer.id);
//             localStorage.setItem('dealerName', selectedDealer.name);
//         }
//         setShowDealerModal(false);
//         setVisibleItemsCount(ITEMS_TO_LOAD); // Скидання лічильника видимості при зміні дилера
//     };

//     const handleDeleteReclamation = (reclamationId) => {
//         setReclamationsData(prev => prev.filter(reclamation => reclamation.id !== reclamationId));
//     };

//     const handleUpdateReclamation = (updatedReclamation) => {
//         setReclamationsData(prev =>
//             prev.map(reclamation => reclamation.id === updatedReclamation.id ? updatedReclamation : reclamation)
//         );
//     };

//     const handleSaveReclamation = (newReclamation) => {
//         // Припускаємо, що newReclamation містить необхідні дані для форматування
//         const formattedCalc = {
//             id: 'RCL' + Math.random().toString(36).substr(2, 4).toUpperCase(),
//             number: newReclamation.name || `РКЛ-НОВИЙ-${reclamationsData.length + 1}`,
//             dateRaw: newReclamation.dateRaw || new Date().toISOString(),
//             date: new Date(newReclamation.dateRaw || new Date()).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' }),
//             issues: [],
//             issueCount: 0,
//             amount: 0,
//             status: 'Новий',
//             file: newReclamation.file || null,
//             message: newReclamation.Comment || ''
//         };

//         setReclamationsData(prev => [formattedCalc, ...prev]);
//         setVisibleItemsCount(ITEMS_TO_LOAD);
//     };

//     /* --- [FETCH DATA ЗІ СКАСУВАННЯМ ЗАПИТУ] --- */

//     /**
//      * Завантажує дані про рекламації з API.
//      * @param {AbortSignal} signal - Сигнал для скасування запиту.
//      */
//     const fetchReclamationsData = async (signal) => {
//         setLoading(true);
//         try {
//             const role = localStorage.getItem('role');
//             const dealerId = dealer ? dealer.id : null;

//             const params = { year: selectedYear };

//             if (role !== 'customer' && dealerId) {
//                 params.dealerId = dealerId;
//             }

//             const response = await axiosInstance.get(RECLAMATIONS_API_URL, { 
//                 params, 
//                 signal 
//             });

//             const rawData = response.data.data || [];
//             const formattedData = formatApiData(rawData);

//             setReclamationsData(formattedData);
//             setVisibleItemsCount(ITEMS_TO_LOAD); // Скидання лічильника видимості після завантаження

//             hasFetchedRef.current = true;

//         } catch (error) {
//             if (axios.isCancel(error)) {
//                 // Це скасований запит. Ігноруємо помилку.
//                 console.log('Запит рекламацій скасовано:', error.message);
//                 return;
//             }

//             console.error("Помилка при завантаженні рекламацій:", error.response?.data || error.message);
//             // Залишаємо дані пустими, оскільки mock-дані видалено.
//             setReclamationsData([]);

//         } finally {
//             // Встановлюємо loading в false, лише якщо запит не був скасований
//             // (Axios 1+ з AbortController це робить автоматично, але перевіримо для впевненості)
//             if (!signal.aborted) {
//                 setLoading(false);
//             }
//         }
//     };

//     useEffect(() => {
//         const role = localStorage.getItem('role');
//         const shouldFetch = role === 'customer' || (role !== 'customer' && dealer);

//         // 1. Створення контролера скасування
//         const controller = new AbortController();

//         if (shouldFetch) {
//             // 2. Передача сигналу в функцію завантаження
//             fetchReclamationsData(controller.signal);
//         } else if (role !== 'customer' && !dealer) {
//             // Якщо потрібен вибір дилера, але він не обраний
//             setReclamationsData([]);
//             setLoading(false);
//         }

//         // 3. Функція очищення (викликається при зміні залежностей або розмонтуванні)
//         return () => {
//             controller.abort("Component unmounted or dependencies changed.");
//         };

//     }, [selectedYear, dealer]); // Залежить від року та обраного дилера

//     /* --- [ФІЛЬТРАЦІЯ ТА СУМАРНА ІНФОРМАЦІЯ] --- */

//     const { sortedItems, statusSummary, monthSummary } = useMemo(() => {
//         // Логіка getStatusSummary, getMonthSummary, getFilteredItems залишається без змін
//         const getStatusSummary = (data) => {
//             const summary = {
//                 'Всі': 0, 'Новий': 0, 'Виробництво': 0, 'В роботі': 0, 'Вирішено': 0,
//                 'На складі': 0, 'Відвантажено': 0, 'Відмова': 0
//             };
//             data.forEach(reclamation => {
//                 summary['Всі'] += 1;
//                 const statusKey = reclamation.status || 'Новий';
//                 if (summary.hasOwnProperty(statusKey)) {
//                     summary[statusKey] += 1;
//                 } else if (statusKey === 'Новий') {
//                     summary['Новий'] += 1;
//                 }
//             });
//             return summary;
//         };

//         const getMonthSummary = (data) => {
//             const summary = {};
//             for (let i = 1; i <= 12; i++) summary[i] = 0;

//             data.forEach(reclamation => {
//                 if (!reclamation.dateRaw) return;
//                 const date = new Date(reclamation.dateRaw);
//                 if (date.getFullYear().toString() === selectedYear) {
//                     const month = date.getMonth() + 1;
//                     summary[month] += 1;
//                 }
//             });
//             return summary;
//         };

//         const getFilteredItems = (data, statusFilter, monthFilter, nameFilter) => {
//             let filtered = [...data];

//             if (statusFilter && statusFilter !== 'Всі') {
//                 filtered = filtered.filter(reclamation => reclamation.status === statusFilter);
//             }

//             if (monthFilter !== 0) {
//                 filtered = filtered.filter(reclamation => {
//                     const month = new Date(reclamation.dateRaw).getMonth() + 1;
//                     return month === monthFilter;
//                 });
//             }

//             if (nameFilter) {
//                 const query = nameFilter.toLowerCase();
//                 filtered = filtered.filter(reclamation =>
//                     (reclamation.number || '').toLowerCase().includes(query) ||
//                     (reclamation.id || '').toLowerCase().includes(query) ||
//                     (reclamation.manager || '').toLowerCase().includes(query)
//                 );
//             }
//             return filtered;
//         };

//         const currentFilteredItems = getFilteredItems(reclamationsData, filter.status, filter.month, filter.name);
//         // Сортування в пам'яті
//         const currentSortedItems = currentFilteredItems.sort((a, b) => new Date(b.dateRaw) - new Date(a.dateRaw));

//         const totalStatusSummary = getStatusSummary(reclamationsData);
//         const totalMonthSummary = getMonthSummary(reclamationsData);

//         return {
//             sortedItems: currentSortedItems,
//             statusSummary: totalStatusSummary,
//             monthSummary: totalMonthSummary
//         };

//     }, [reclamationsData, filter, selectedYear]);

//     // Ефект для скидання лічильника видимості при зміні фільтрів
//     useEffect(() => {
//         setVisibleItemsCount(ITEMS_TO_LOAD);
//     }, [filter.status, filter.month, filter.name]);


//     const handleFilterClick = (statusKey) => {
//         setFilter(prev => ({ ...prev, status: statusKey }));
//     };

//     const handleMonthClick = (month) => {
//         const newMonth = filter.month === month ? 0 : month;
//         setFilter(prev => ({ ...prev, month: newMonth }));
//     };

//     const handleSearchChange = (e) => {
//         const name = e.target.value;
//         setFilter(prev => ({ ...prev, name }));
//     };

//     const handleClearSearch = () => {
//         setFilter(prev => ({ ...prev, name: '' }));
//     };

//     // ЛОГІКА "LOAD MORE": Обчислення елементів для відображення
//     const totalFilteredCount = sortedItems.length;
//     const currentItems = sortedItems.slice(0, visibleItemsCount);
//     const canLoadMore = visibleItemsCount < totalFilteredCount;
//     const remainingCount = totalFilteredCount - visibleItemsCount; // Кількість, що залишилася

//     // Логіка тексту кнопки
//     const loadAmount = Math.min(ITEMS_TO_LOAD, remainingCount);
//     const buttonText = loadAmount < ITEMS_TO_LOAD
//         ? `Завантажити ще (${loadAmount})`
//         : `Завантажити ще (100 із ${remainingCount})`;

//     const handleLoadMore = () => {
//         setVisibleItemsCount(prevCount => Math.min(prevCount + ITEMS_TO_LOAD, totalFilteredCount));
//     };

//     const toggleReclamation = (id) => setExpandedReclamation(expandedReclamation === id ? null : id);
//     const toggleIssue = (id) => setExpandedIssue(expandedIssue === id ? null : id);

//     const currentYear = new Date().getFullYear();
//     const yearOptions = Array.from({ length: currentYear - 2024 + 1 }, (_, i) =>
//         (currentYear - i).toString()
//     );

//     if (loading)
//         return (
//             <div className="loading-spinner-wrapper">
//                 <div className="loading-spinner"></div>
//                 <div className="loading-text">Завантаження даних по рекламаціях...</div>
//             </div>
//         );

//     const role = localStorage.getItem('role');
//     if (role !== 'customer' && !dealer) {
//         return (
//             <div className="column portal-body">
//                 <DealerSelectModal
//                     isOpen={showDealerModal}
//                     onClose={() => setShowDealerModal(false)}
//                     onSelect={handleDealerSelect}
//                 />
//             </div>
//         );
//     }


//     return (
//         <div className="column portal-body">

//             {showDealerModal && (
//                 <DealerSelectModal
//                     isOpen={showDealerModal}
//                     onClose={() => setShowDealerModal(false)}
//                     onSelect={handleDealerSelect}
//                 />
//             )}

//             {/* Вибір року, місяці, кнопки */}
//             <div className="content-summary row w-100">
//                 <div
//                     className="mobile-sidebar-toggle"
//                     onClick={() => setIsSidebarOpen(true)}
//                     style={{marginTop: '10px'}}
//                 >
//                     <span className="icon icon-menu font-size-24"></span>
//                 </div>

//                 <div className="year-selector row">
//                     <span>Рік рекламацій:</span>
//                     <span className="icon icon-calendar2 font-size-24 text-info"></span>
//                     <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
//                         {yearOptions.map(yearValue => (
//                             <option key={yearValue} value={yearValue}>{yearValue}</option>
//                         ))}
//                     </select>
//                 </div>

//                 <div className="by-month-pagination-wrapper">
//                     <ul className="gap-6 row no-wrap month-list">
//                         <li className={`pagination-item ${filter.month === 0 ? 'active' : ''}`} onClick={() => handleMonthClick(0)}>
//                             Весь рік
//                         </li>
//                         {Array.from({ length: 12 }, (_, i) => {
//                             const num = i + 1;
//                             const labels = ['Січ.', 'Лют.', 'Бер.', 'Квіт.', 'Трав.', 'Черв.', 'Лип.', 'Сер.', 'Вер.', 'Жов.', 'Лис.', 'Груд.'];
//                             return (
//                                 <li
//                                     key={num}
//                                     className={`pagination-item ${filter.month === num ? 'active' : ''} ${monthSummary[num] === 0 ? 'disabled' : ''}`}
//                                     onClick={() => monthSummary[num] > 0 && handleMonthClick(num)}
//                                 >
//                                     {labels[i]} <span className="text-grey">({monthSummary[num]})</span>
//                                 </li>
//                             );
//                         })}
//                     </ul>
//                     <select
//                         className="month-select"
//                         value={filter.month}
//                         onChange={(e) => handleMonthClick(Number(e.target.value))}
//                     >
//                         <option value={0}>Весь рік</option>
//                         {Array.from({ length: 12 }, (_, i) => {
//                             const num = i + 1;
//                             const labels = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
//                             return (
//                                 <option key={num} value={num} disabled={monthSummary[num] === 0}>
//                                     {labels[i]} ({monthSummary[num]})
//                                 </option>
//                             );
//                         })}
//                     </select>
//                 </div>
//             </div>

//             <div className="content-wrapper row w-100 h-100">
//                 <div className={`content-filter column ${isSidebarOpen ? 'open' : 'closed'}`}>
//                     <div className="sidebar-header row ai-center jc-space-between">
//                     {isSidebarOpen && <span>Фільтри Рекламацій</span>}
//                     {isSidebarOpen && (
//                         <span className="icon icon-cross" onClick={() => setIsSidebarOpen(false)}></span>
//                     )}
//                     </div>

//                     <div className="search-wrapper">
//                         <input
//                             type="text"
//                             className="search-orders"
//                             placeholder="номер рекламації"
//                             value={filter.name}
//                             onChange={handleSearchChange}
//                         />
//                         <span className="icon icon-cancel2 clear-search" title="Очистити пошук" onClick={handleClearSearch}></span>
//                     </div>

//                     {role !== 'customer' && (
//                         <div>
//                             <div className="delimiter1"/>
//                             <ul className="buttons">
//                                 <li className="btn btn-select-dealer" onClick={() => setShowDealerModal(true)}>
//                                     <span className="icon icon-user-check"></span>
//                                     <span className="uppercase">Вибрати дилера</span>
//                                 </li>
//                             </ul>
//                         </div>
//                     )}

//                     <div className="delimiter1"></div>
//                     <ul className="buttons">
//                         <li className="btn btn-add-calc" onClick={() => setIsNewReclamationModalOpen(true)}>
//                             <span className="icon icon-plus3"></span>
//                             <span className="uppercase">Нова рекламація</span>
//                         </li>
//                     </ul>

//                     <ul className="filter column align-center">
//                         <li className="delimiter1"></li>
//                         {[
//                             { id: "all", label: "Всі рекламації", icon: "icon-calculator", statusKey: "Всі" },
//                             { id: "new", label: "Новий", icon: "icon-bolt", statusKey: "Новий" },
//                             { id: "in-progress", label: "В роботі", icon: "icon-spin-alt", statusKey: "В роботі" },
//                             { id: "factory", label: "Виробництво", icon: "icon-cog", statusKey: "Виробництво" },
//                             { id: "camposition", label: "На складі", icon: "icon-layers2", statusKey: "На складі" },
//                             { id: "arrived", label: "Відвантажено", icon: "icon-truck", statusKey: "Відвантажено" },
//                             { id: "resolved", label: "Вирішено", icon: "icon-check", statusKey: "Вирішено" },
//                             { id: "rejected", label: "Відмова", icon: "icon-circle-with-cross", statusKey: "Відмова" }
//                         ].map(({ id, label, icon, statusKey }) => (
//                             <li
//                                 key={id}
//                                 className={`filter-item ${filter.status === statusKey ? 'active' : ''}`}
//                                 onClick={() => handleFilterClick(statusKey)}
//                             >
//                                 <span className={`icon ${icon} font-size-24`}></span>
//                                 <span className="w-100">{label}</span>
//                                 <span className={statusSummary[statusKey] === 0 ? 'disabled' : ''}>
//                                     {statusSummary[statusKey]}
//                                 </span>
//                             </li>
//                         ))}
//                     </ul>
//                 </div>

//                 <div className="content" id="content">
//                     <div className="items-wrapper column gap-1" id="items-wrapper">
//                         {currentItems.length === 0 && totalFilteredCount > 0 ? (
//                             <div className="no-data column align-center h-100">
//                                 <div className="font-size-24 text-grey">Рекламацій, що відповідають фільтру, не знайдено</div>
//                             </div>
//                         ) : currentItems.length === 0 && totalFilteredCount === 0 ? (
//                             <div className="no-data column align-center h-100">
//                                 <div className="font-size-24 text-grey">Немає рекламацій для відображення</div>
//                             </div>
//                         ) : (
//                             currentItems.map((reclamation) => (
//                                 isMobile ? (
//                                     <ReclamationItemMobile
//                                         key={reclamation.id}
//                                         reclamation={reclamation}
//                                         isExpanded={expandedReclamation === reclamation.id}
//                                         onToggle={() => toggleReclamation(reclamation.id)}
//                                         expandedIssueId={expandedIssue}
//                                         onIssueToggle={toggleIssue}
//                                         onDelete={handleDeleteReclamation}
//                                         onEdit={handleUpdateReclamation}
//                                     />
//                                 ) : (
//                                     <ReclamationItem
//                                         key={reclamation.id}
//                                         reclamation={reclamation}
//                                         isExpanded={expandedReclamation === reclamation.id}
//                                         onToggle={() => toggleReclamation(reclamation.id)}
//                                         expandedIssueId={expandedIssue}
//                                         onIssueToggle={toggleIssue}
//                                         onDelete={handleDeleteReclamation}
//                                         onEdit={handleUpdateReclamation}
//                                     />
//                                 )
//                             ))
//                         )}
//                     </div>


//                     {totalFilteredCount > 0 && (
//                         <div className="row  w-90" style={{ marginTop: '20px', marginBottom: '20px', justifyContent: 'center'}}>
//                             {canLoadMore && (
//                                 <button
//                                     className="btn btn-primary uppercase btn-load-more-big"
//                                     onClick={handleLoadMore}
//                                     style={{
//                                         padding: '12px 24px',
//                                         fontSize: '14px',
//                                         fontWeight: '500',
//                                         minWidth: '200px',
//                                         backgroundColor: '#5e83bf',
//                                         color: '#FFFFFF',
//                                         borderRadius: '8px',
//                                         boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
//                                         justifySelf: 'center',
//                                     }}
//                                 >
//                                     <span className="icon icon-loop2" style={{ marginRight: '10px' }}></span>
//                                     {buttonText}
//                                 </button>
//                             )}

//                             {/* ℹ️ Повідомлення, якщо всі дані завантажено */}
//                             {!canLoadMore && totalFilteredCount > ITEMS_TO_LOAD && (
//                                 <div className="row justify-content-center text-grey" style={{ marginTop: '5px', marginBottom: '5px' }}>
//                                     Всі рекламації завантажено ({totalFilteredCount}).
//                                 </div>
//                             )}

//                              {/* Якщо відображено менше 100, показуємо загальний статус */}
//                             {totalFilteredCount <= ITEMS_TO_LOAD && totalFilteredCount > 0 && (
//                                 <div className="row justify-content-center text-grey" style={{ marginTop: '5px', marginBottom: '5px' }}>
//                                     Показано {totalFilteredCount} рекламацій.
//                                 </div>
//                             )}
//                         </div>
//                     )}

//                 </div>
//             </div>

//             <AddClaimModal
//                 isOpen={isNewReclamationModalOpen}
//                 onClose={() => setIsNewReclamationModalOpen(false)}
//                 onSave={handleSaveReclamation}
//             />
//         </div>
//     );
// };

// export default ReclamationPortal;

import React, { 
    useState, 
    useEffect, 
    useMemo, 
    useCallback 
} from 'react';

import axiosInstance from '../api/axios'; 
import useCancelAllRequests from "../hooks/useCancelAllRequests";

import { ReclamationItem } from '../components/Reclamations/ReclamationItem';
import { ReclamationItemMobile } from '../components/Reclamations/ReclamationItemMobile';

import AddClaimModal from '../components/Complaint/AddClaimModal';

import DealerSelect from "./DealerSelect";
import { useDealerContext } from "../hooks/useDealerContext";

import useWindowWidth from '../hooks/useWindowWidth';
import { useTheme } from '../context/ThemeContext';

import '../components/Reclamations/ReclamationItem.css';

const RECLAMATIONS_API_URL = '/get_reclamation_info/';
const ITEMS_PER_LOAD = 100;

/* --------------------------------------------------------
 *   FORMAT API DATA
 * -------------------------------------------------------- */
function formatApiData(data) {
    if (!Array.isArray(data)) return [];

    return data.map(item => {
        const dateRaw = item.ComplaintDate || item.DateInWork || new Date().toISOString();
        const dateObj = new Date(dateRaw);
        const statusKey = item.StatusName || 'Новий';

        return {
            id: item.ComplaintNumber,
            number: item.ClaimOrderNumber,
            actNumber: item.ComplaintNumber,

            numberWEB: item.NumberWEB,
            orderNumber: item.OrderNumber,
            organization: item.OrganizationName,

            dateRaw,
            date: !isNaN(dateObj) ? dateObj.toLocaleDateString('uk-UA') : 'N/A',

            deliveryDate: item.DeliveryDateText || null,
            determinationDate: item.DeterminationDateText || null,
            readyDate: item.BorderReturnDate,
            producedDate: item.ProducedDate,
            soldDate: item.SoldDate,

            status: statusKey,
            problem: item.IssueName,
            resolution: item.SolutionName || null,
            description: item.ParsedDescription,

            series: item.SeriesList || null,
            manager: item.LastManagerName || 'N/A',

            amount: parseFloat(item.DocumentAmount || item.DocumentSum || item.CompensationAmount || 0),
            dealer: item.Customer || 'N/A',

            file: !!item.AdditionalInformation,
            issueCount: 0,
            issues: [],

            statuses: { [statusKey]: 1 },
            message: item.ParsedDescription,
        };
    });
}

/* --------------------------------------------------------
 *   GET INITIAL DEALER
 * -------------------------------------------------------- */


/* ========================================================
 *   MAIN COMPONENT
 * ======================================================== */
const ReclamationPortal = () => {

    const { register, cancelAll } = useCancelAllRequests();

    const [isNewReclamationModalOpen, setIsNewReclamationModalOpen] = useState(false);
    const [reclamationsData, setReclamationsData] = useState([]);

    const [filter, setFilter] = useState({ status: 'Всі', month: 0, name: '' });
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    const [loading, setLoading] = useState(true);
    const [visibleItemsCount, setVisibleItemsCount] = useState(ITEMS_PER_LOAD);

    const [expandedReclamation, setExpandedReclamation] = useState(null);
    const [expandedIssue, setExpandedIssue] = useState(null);
    const {
        dealerGuid,
        setDealerGuid,
        isAdmin,
        currentUser
    } = useDealerContext();


    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const windowWidth = useWindowWidth();
    const isMobile = windowWidth < 1024;

    const { theme } = useTheme();


    


    /* --------------------------------------------------------
     *  Add New Reclamation
     * -------------------------------------------------------- */
    const handleSaveReclamation = useCallback((newReclamation) => {
        const formatted = {
            id: 'RCL' + Math.random().toString(36).substr(2, 5).toUpperCase(),
            number: newReclamation.name || `РКЛ-${Date.now()}`,
            dateRaw: newReclamation.dateRaw || new Date().toISOString(),
            date: new Date().toLocaleDateString('uk-UA'),

            issues: [],
            issueCount: 0,
            amount: 0,
            status: 'Новий',
            file: newReclamation.file || null,
            message: newReclamation.Comment || ''
        };

        setReclamationsData(prev => [formatted, ...prev]);
        setVisibleItemsCount(ITEMS_PER_LOAD);
    }, []);

    

    /* --------------------------------------------------------
     *  FETCH DATA WITH CANCELLATION (LIKE PortalOriginal)
     * -------------------------------------------------------- */
    useEffect(() => {
        cancelAll();




        // 🔴 Адмін без дилера → просто показуємо UI
        if (isAdmin && !dealerGuid) {
            setReclamationsData([]);
            setLoading(false);
            return;
        }

        // 🟢 Customer або admin з дилером
        if (!dealerGuid) return;

        const controller = register();

        const loadData = async () => {
            setLoading(true);
            try {
                const params = {
                    year: selectedYear,
                    contractor: dealerGuid // 👈 ВАЖЛИВО
                };

                const response = await axiosInstance.get(
                    RECLAMATIONS_API_URL,
                    {
                        params,
                        signal: controller.signal
                    }
                );

                const formatted = formatApiData(response.data.data || []);
                setReclamationsData(formatted);
                setVisibleItemsCount(ITEMS_PER_LOAD);

            } catch (err) {
                if (err.name === "CanceledError") return;
                console.error(err);
                setReclamationsData([]);
            } finally {
                setLoading(false);
            }
        };

        loadData();

    }, [selectedYear, dealerGuid, isAdmin]);



    

    /* --------------------------------------------------------
     *  Filtering logic
     * -------------------------------------------------------- */
    const { sortedItems, statusSummary, monthSummary } = useMemo(() => {

        const getStatusSummary = (data) => {
            const summary = {
                'Всі': 0, 'Новий': 0, 'Виробництво': 0, 
                'В роботі': 0, 'Вирішено': 0,
                'На складі': 0, 'Відвантажено': 0, 'Відмова': 0
            };

            data.forEach(r => {
                summary['Всі']++;
                if (summary[r.status] !== undefined) summary[r.status]++;
            });

            return summary;
        };

        const getMonthSummary = (data) => {
            const summary = {};
            for (let i = 1; i <= 12; i++) summary[i] = 0;

            data.forEach(r => {
                if (!r.dateRaw) return;
                const d = new Date(r.dateRaw);
                if (d.getFullYear().toString() === selectedYear) {
                    summary[d.getMonth() + 1]++;
                }
            });

            return summary;
        };

        const filterData = (data) => {
            let out = [...data];

            if (filter.status !== 'Всі') {
                out = out.filter(r => r.status === filter.status);
            }

            if (filter.month !== 0) {
                out = out.filter(r => {
                    const m = new Date(r.dateRaw).getMonth() + 1;
                    return m === filter.month;
                });
            }

            if (filter.name) {
                const q = filter.name.toLowerCase();
                out = out.filter(r =>
                    (r.number || '').toLowerCase().includes(q) ||
                    (r.manager || '').toLowerCase().includes(q)
                );
            }

            return out.sort((a, b) => new Date(b.dateRaw) - new Date(a.dateRaw));
        };

        return {
            sortedItems: filterData(reclamationsData),
            statusSummary: getStatusSummary(reclamationsData),
            monthSummary: getMonthSummary(reclamationsData)
        };

    }, [reclamationsData, filter, selectedYear]);


    /* --------------------------------------------------------
     *  Pagination
     * -------------------------------------------------------- */
    const currentItems = sortedItems.slice(0, visibleItemsCount);
    const remaining = sortedItems.length - visibleItemsCount;

    const canLoadMore = remaining > 0;
    const loadAmount = Math.min(ITEMS_PER_LOAD, remaining);

    const buttonText =
        loadAmount < ITEMS_PER_LOAD
            ? `Завантажити ще (${loadAmount})`
            : `Завантажити ще (100 із ${remaining})`;


    /* ========================================================
     *   UI
     * ======================================================== */

    if (loading)
        return (
            <div className="loading-spinner-wrapper">
                <div className="loading-spinner"></div>
                <div className="loading-text">Завантаження даних по рекламаціях...</div>
            </div>
        );



    return (
        <div className="column portal-body">



            {/* SUMMARY BLOCK */}
            <div className="content-summary row w-100">
                <div
                    className="mobile-sidebar-toggle"
                    onClick={() => setIsSidebarOpen(true)}
                    style={{ marginTop: '10px' }}
                >
                    <span className="icon icon-menu font-size-24"></span>
                </div>

                <div className="year-selector row">
                    <span>Рік рекламацій:</span>
                    <span className="icon icon-calendar2 font-size-24 text-info"></span>

                    <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                        {Array.from({ length: new Date().getFullYear() - 4 + 1 }, (_, i) =>
                            (new Date().getFullYear() - i).toString()
                        ).map(y =>
                            <option key={y} value={y}>{y}</option>
                        )}
                    </select>
                </div>

                {/* Month Filter */}
                {/* Month Filter */}
<div className="by-month-pagination-wrapper">

    {/* DESKTOP – горизонтальні кнопки */}
    {!isMobile && (
        <ul className="gap-6 row no-wrap month-list">
            <li
                className={`pagination-item ${filter.month === 0 ? 'active' : ''}`}
                onClick={() => setFilter(prev => ({ ...prev, month: 0 }))}
            >
                Весь рік
            </li>

            {Array.from({ length: 12 }, (_, i) => {
                const num = i + 1;
                const labels = [
                    'Січ.', 'Лют.', 'Бер.', 'Квіт.', 'Трав.', 'Черв.',
                    'Лип.', 'Сер.', 'Вер.', 'Жов.', 'Лис.', 'Груд.'
                ];

                return (
                    <li
                        key={num}
                        className={`pagination-item 
                            ${filter.month === num ? 'active' : ''} 
                            ${monthSummary[num] === 0 ? 'disabled' : ''}`}
                        onClick={() =>
                            monthSummary[num] > 0 &&
                            setFilter(prev => ({ ...prev, month: num }))
                        }
                    >
                        {labels[i]} <span className="text-grey">({monthSummary[num]})</span>
                    </li>
                );
            })}
        </ul>
    )}


 
        <select
            className="month-select"
            value={filter.month}
            onChange={(e) => setFilter(prev => ({
                ...prev,
                month: Number(e.target.value)
            }))}
        >
            <option value={0}>Весь рік</option>

            {Array.from({ length: 12 }, (_, i) => {
                const num = i + 1;
                const labels = [
                    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
                    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
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



            {/* MAIN WRAPPER */}
            <div className="content-wrapper row w-100 h-100">

                {/* SIDEBAR */}
                <div className={`content-filter column ${isSidebarOpen ? 'open' : 'closed'}`}>


                    <div className="sidebar-header row ai-center jc-space-between">
                        {isSidebarOpen && <span>Фільтри Рекламацій</span>}
                        {isSidebarOpen && (
                            <span className="icon icon-cross" onClick={() => setIsSidebarOpen(false)}></span>
                        )}
                    </div>

                    {/* Search */}
                    <div className="search-wrapper">
                        <input
                            type="text"
                            className="search-orders"
                            placeholder="номер рекламації"
                            value={filter.name}
                            onChange={e => setFilter(prev => ({ ...prev, name: e.target.value }))}
                        />
                        <span
                            className="icon icon-cancel2 clear-search"
                            title="Очистити"
                            onClick={() => setFilter(prev => ({ ...prev, name: '' }))}
                        ></span>
                    </div>


                    {isAdmin && (
                        <>
                            <div className="delimiter1" />
                            <ul className="">
                                <li className="">
                                    <DealerSelect
                                        value={dealerGuid}
                                        onChange={setDealerGuid}
                                    />
                                </li>
                            </ul>
                        </>
                    )}


                    {/* Add New Reclamation */}
                    <div className="delimiter1" />
                    <ul className="buttons">
                        <li className="btn btn-add-calc" onClick={() => setIsNewReclamationModalOpen(true)}>
                            <span className="icon icon-plus3"></span>
                            <span className="uppercase">Нова рекламація</span>
                        </li>
                    </ul>

                    {/* Status Filters */}
                    <ul className="filter column align-center">
                        <li className="delimiter1"></li>

                        {[
                            { label: "Всі рекламації", statusKey: "Всі", icon: "icon-calculator" },
                            { label: "Новий", statusKey: "Новий", icon: "icon-bolt" },
                            { label: "В роботі", statusKey: "В роботі", icon: "icon-spin-alt" },
                            { label: "Виробництво", statusKey: "Виробництво", icon: "icon-cog" },
                            { label: "На складі", statusKey: "На складі", icon: "icon-layers2" },
                            { label: "Відвантажено", statusKey: "Відвантажено", icon: "icon-truck" },
                            { label: "Вирішено", statusKey: "Вирішено", icon: "icon-check" },
                            { label: "Відмова", statusKey: "Відмова", icon: "icon-circle-with-cross" }
                        ].map(item => (
                            <li
                                key={item.statusKey}
                                className={`filter-item ${filter.status === item.statusKey ? 'active' : ''}`}
                                onClick={() => setFilter(prev => ({ ...prev, status: item.statusKey }))}
                            >
                                <span className={`icon ${item.icon} font-size-24`}></span>
                                <span className="w-100">{item.label}</span>
                                <span className={statusSummary[item.statusKey] === 0 ? 'disabled' : ''}>
                                    {statusSummary[item.statusKey]}
                                </span>
                            </li>
                        ))}

                    </ul>
                </div>


                {/* CONTENT */}
                <div className="content" id="content">
                    <div className="items-wrapper column gap-1" id="items-wrapper">

                        {/* NO DATA */}
                        {currentItems.length === 0 ? (
                            <div className="no-data column align-center h-100">
                                <div className="font-size-24 text-grey">
                                    Рекламацій не знайдено
                                </div>
                            </div>
                        ) : (

                            /* ITEMS */
                            currentItems.map((reclamation) =>
                                isMobile ? (
                                    <ReclamationItemMobile
                                        key={reclamation.id}
                                        reclamation={reclamation}
                                        isExpanded={expandedReclamation === reclamation.id}
                                        onToggle={() => setExpandedReclamation(
                                            expandedReclamation === reclamation.id ? null : reclamation.id
                                        )}
                                        expandedIssueId={expandedIssue}
                                        onIssueToggle={(id) =>
                                            setExpandedIssue(expandedIssue === id ? null : id)
                                        }
                                    />
                                ) : (
                                    <ReclamationItem
                                        key={reclamation.id}
                                        reclamation={reclamation}
                                        isExpanded={expandedReclamation === reclamation.id}
                                        onToggle={() => setExpandedReclamation(
                                            expandedReclamation === reclamation.id ? null : reclamation.id
                                        )}
                                        expandedIssueId={expandedIssue}
                                        onIssueToggle={(id) =>
                                            setExpandedIssue(expandedIssue === id ? null : id)
                                        }
                                    />
                                )
                            )
                        )}


                        {/* LOAD MORE */}
                        {canLoadMore && (
                            <div className="row w-90" style={{
                                marginTop: '20px',
                                marginBottom: '20px',
                                justifyContent: 'center'
                            }}>
                                <button
                                    className="btn btn-primary uppercase btn-load-more-big"
                                    onClick={() =>
                                        setVisibleItemsCount(prev => prev + ITEMS_PER_LOAD)
                                    }
                                >
                                    <span className="icon icon-loop2" style={{ marginRight: '10px' }}></span>
                                    {buttonText}
                                </button>
                            </div>
                        )}

                        {/* All loaded */}
                        {!canLoadMore && sortedItems.length > ITEMS_PER_LOAD && (
                            <div className="row justify-content-center text-grey" style={{
                                marginTop: '10px',
                                marginBottom: '10px'
                            }}>
                                Всі рекламації завантажено ({sortedItems.length})
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* ADD NEW */}
            <AddClaimModal
                isOpen={isNewReclamationModalOpen}
                onClose={() => setIsNewReclamationModalOpen(false)}
                onSave={handleSaveReclamation}
            />

        </div>
    );
};

export default ReclamationPortal;
