// // // import React, { useEffect, useState, useMemo, useRef } from "react";
// // // import axiosInstance from "../../api/axios";

// // // // Імпорт графіків
// // // import ComplexityDonut from "../charts/ComplexityDonut";
// // // import ComplexityTreemap from "../charts/ComplexityTreeMap";
// // // import EfficiencyChart from '../charts/EfficiencyChart';
// // // import VolumeChart from '../charts/VolumeChart';
// // // import PrefixCategoryDisplay from "../charts/PrefixCategoryDisplay";
// // // import FurnitureChart from "../charts/FurnitureChart";
// // // import ProfileColorChart from "../charts/ProfileColorChart";
// // // import ProfileSystemChart from "../charts/ProfileSystemChart";
// // // import ColorSystemHeatmap from "../charts/ColorSystemHeatmap";

// // // import './ProductionStatisticsBlock.css';
// // // import { formatDate } from "../../utils/formatters";

// // // // Мапінг для групування
// // // const CATEGORY_MAPPING = {
// // //   "Вікна безшовне зварювання": "Вікна", "Вікно": "Вікна", "Вікно вкл склопакет": "Вікна",
// // //   "Розсувні системи SL76": "Вікна", "Французький балкон": "Вікна",
// // //   "Двері безшовне зварювання": "Двері", "Двері": "Двері", "Міжкімнатні двері": "Двері",
// // //   "Технічні двері ПВХ": "Двері", "Двері Lampre": "Двері",
// // //   "Лиштва": "Додатки", "Москітні сітки": "Додатки", "Підвіконня": "Додатки",
// // //   "Відливи": "Додатки", "Інше": "Додатки"
// // // };

// // // export default function ProductionStatisticsBlock({ rawData, dealerData, dateRange }) {
// // //   const drillDownRef = useRef(null);
  
// // //   // Використовуємо дані з пропсів, якщо вони є, або внутрішній стан
// // //   const [internalData, setInternalData] = useState(null);
// // //   const [loading, setLoading] = useState(!rawData);

// // //   const data = rawData || internalData;
// // //   const systemsData = dealerData?.profile_system || [];
// // //   const colorData = dealerData?.profile_color || [];
// // //   const furnitureData = dealerData?.hardware?.items || [];
// // //   const prefixData = dealerData?.prefixes || [];

// // //   const [selectedCategory, setSelectedCategory] = useState(null);
// // //   const [activeSubCategory, setActiveSubCategory] = useState(null);

// // //   // Завантаження, якщо дані не передані зверху
// // //   useEffect(() => {
// // //     if (!rawData) {
// // //       const loadData = async () => {
// // //         setLoading(true);
// // //         try {
// // //           const params = { date_from: dateRange.from, date_to: dateRange.to };
// // //           const res = await axiosInstance.get("/full-statistics/", { params });
// // //           setInternalData(res.data);
// // //         } catch (err) {
// // //           console.error("Fetch error:", err);
// // //         } finally {
// // //           setLoading(false);
// // //         }
// // //       };
// // //       loadData();
// // //     }
// // //   }, [dateRange, rawData]);

// // //   // Розрахунок матриці Колір х Система
// // //   const heatmapData = useMemo(() => {
// // //     if (!systemsData.length || !colorData.length) return [];
// // //     const result = [];
// // //     systemsData.forEach(sys => {
// // //       const sysOrders = sys.OrdersNumber ? sys.OrdersNumber.split(',').map(n => n.trim()) : [];
// // //       colorData.forEach(col => {
// // //         const colOrders = col.OrdersNumber ? col.OrdersNumber.split(',').map(n => n.trim()) : [];
// // //         const intersection = sysOrders.filter(order => colOrders.includes(order));
// // //         if (intersection.length > 0) {
// // //           result.push({ system: sys.ProfileSystem, color: col.ProfileColor, value: intersection.length });
// // //         }
// // //       });
// // //     });
// // //     return result;
// // //   }, [systemsData, colorData]);

// // //   // Прокрутка до деталей
// // //   useEffect(() => {
// // //     if (selectedCategory && drillDownRef.current) {
// // //       drillDownRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
// // //     }
// // //   }, [selectedCategory]);

// // //   // Рівень 1: Дані для Donut Chart
// // //   const mainDonutData = useMemo(() => {
// // //     const details = data?.tables?.tech_details;
// // //     if (!Array.isArray(details)) return [];
// // //     const groups = {};
// // //     details.forEach(item => {
// // //       const groupName = CATEGORY_MAPPING[item.ConstructionTypeName_UA?.trim()] || "Додатки";
// // //       groups[groupName] = (groups[groupName] || 0) + parseFloat(item.TotalQuantity || 0);
// // //     });
// // //     return Object.entries(groups).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
// // //   }, [data]);

// // //   // Рівень 2: Навігація по підкатегоріях
// // //   const subCategories = useMemo(() => {
// // //     const details = data?.tables?.tech_details;
// // //     if (!selectedCategory || !Array.isArray(details)) return [];
// // //     const subs = details
// // //         .filter(item => (CATEGORY_MAPPING[item.ConstructionTypeName_UA?.trim()] || "Додатки") === selectedCategory)
// // //         .map(item => item.ConstructionTypeName_UA?.trim())
// // //         .filter(Boolean); 
// // //     return [...new Set(subs)].sort();
// // //   }, [selectedCategory, data]);

// // //   // Рівень 3: Дані для Treemap
// // //   const filteredTreemapData = useMemo(() => {
// // //     const details = data?.tables?.tech_details;
// // //     if (!selectedCategory || !Array.isArray(details)) return [];
// // //     return details
// // //         .filter(item => {
// // //             const cleanName = item.ConstructionTypeName_UA?.trim() || "";
// // //             const parentGroup = CATEGORY_MAPPING[cleanName] || "Додатки";
// // //             return parentGroup === selectedCategory && (!activeSubCategory || cleanName === activeSubCategory);
// // //         })
// // //         .map(item => ({
// // //             name: `${item.ConstructionTypeName_UA?.trim()} (${item.Складність_UA?.trim() || "Стандарт"})`,
// // //             value: parseFloat(item.TotalQuantity || 0)
// // //         }))
// // //         .filter(item => item.value > 0);
// // //   }, [selectedCategory, activeSubCategory, data]);

// // //   if (loading) return (
// // //     <div className="loading-spinner-wrapper">
// // //       <div className="loading-spinner"></div>
// // //       <div className="loading-text">Аналізуємо дані...</div>
// // //     </div>
// // //   );

// // //   if (!data || !data.tables?.tech_details?.length) return (
// // //     <div className="no-data-placeholder">
// // //       <i className="fa fa-area-chart"></i>
// // //       <h3 style={{margin: '5px'}}>Немає активності за цей період:</h3>
// // //       <p>{formatDate(dateRange.from)} — {formatDate(dateRange.to)}</p>
// // //     </div>
// // //   );

// // //   return (
// // //     <div className="production-stats-container">
      
// // //       {/* KPI & ПРЕФІКСИ */}
// // //       <div className="m-bottom-28">
// // //           <PrefixCategoryDisplay prefixData={prefixData} />
// // //       </div>

// // //       {/* ЕФЕКТИВНІСТЬ ТА ОБСЯГИ */}
// // //       <div className="stats-grid-2">
// // //         <div className="chart-wrapper-card card-padding">
// // //           <h4 className="chart-title-unified">Динаміка ефективності</h4>
// // //           <EfficiencyChart data={data.charts?.monthly || []} />
// // //         </div>
// // //         <div className="chart-wrapper-card card-padding">
// // //           <h4 className="chart-title-unified">Обсяги виробництва</h4>
// // //           <VolumeChart data={data.charts?.monthly || []} />
// // //         </div>
// // //       </div>

// // //       {/* КОЛЬОРИ ТА СИСТЕМИ */}
// // //       <div className="stats-grid-2">
// // //         <div className="chart-wrapper-card card-padding">
// // //           <h4 className="chart-title-unified">Популярність кольорів</h4>
// // //           <ProfileColorChart data={colorData} />
// // //         </div>
// // //         <div className="chart-wrapper-card card-padding">
// // //           <h4 className="chart-title-unified">Профільні системи</h4>
// // //           <ProfileSystemChart data={systemsData} />
// // //         </div>
// // //       </div>

// // //       {/* ТЕПЛОВА КАРТА */}
// // //       <div className="chart-wrapper-card card-padding m-bottom-28">
// // //         <h4 className="chart-title-unified">Матриця Система × Колір</h4>
// // //         <p className="chart-subtitle-grey">Кількість замовлень на перетині параметрів</p>
// // //         <ColorSystemHeatmap data={heatmapData} />
// // //       </div>

// // //       {/* ФУРНІТУРА */}
// // //       <div className="chart-wrapper-card card-padding m-bottom-28">
// // //           <h4 className="chart-title-unified">Аналітика фурнітури</h4>
// // //           <FurnitureChart data={furnitureData} />
// // //       </div>

// // //       {/* КАТЕГОРІЇ (ОСНОВНИЙ ПОРТФЕЛЬ) */}
// // //       <div className="stats-single-column">
// // //         <div className="chart-wrapper-card card-padding">
// // //           <h4 className="chart-title-unified">Портфель категорій</h4>
// // //           <p className="chart-subtitle-grey">Натисніть на сектор для детального аналізу конструкцій</p>
// // //           <ComplexityDonut 
// // //             data={mainDonutData} 
// // //             onSectorClick={(name) => {
// // //               setSelectedCategory(name);
// // //               setActiveSubCategory(null);
// // //             }} 
// // //           />
// // //         </div>
// // //       </div>

// // //       {/* DRILL-DOWN (ДЕТАЛІЗАЦІЯ) */}
// // //       {selectedCategory && (
// // //         <div className="chart-wrapper-card drilldown-view animate-fade-in" ref={drillDownRef}>
// // //             <div className="drilldown-header-row">
// // //                 <h3 className="section-title">
// // //                     Деталізація: <span className="text-highlight">{selectedCategory}</span>
// // //                     {activeSubCategory && <span className="sub-title-arrow"> → {activeSubCategory}</span>}
// // //                 </h3>
// // //                 <button className="btn-close-details" onClick={() => { setSelectedCategory(null); setActiveSubCategory(null); }}>✕</button>
// // //             </div>

// // //             <div className="sub-nav-tabs">
// // //                 <button className={`tab-link ${!activeSubCategory ? 'active' : ''}`} onClick={() => setActiveSubCategory(null)}>Всі типи</button>
// // //                 {subCategories.map(sub => (
// // //                     <button key={sub} className={`tab-link ${activeSubCategory === sub ? 'active' : ''}`} onClick={() => setActiveSubCategory(sub)}>{sub}</button>
// // //                 ))}
// // //             </div>

// // //             <div className="detail-chart-container">
// // //                 <h5 className="detail-chart-title">Розподіл за складністю виготовлення (шт)</h5>
// // //                 <ComplexityTreemap 
// // //                   data={filteredTreemapData} 
// // //                   isDetail={true} 
// // //                   activeGroup={selectedCategory}
// // //                 />
// // //             </div>
// // //         </div>
// // //       )}

  
// // //     </div>
// // //   );
// // // }


// // import React, { useEffect, useState, useMemo } from "react";
// // import axiosInstance from "../../api/axios";

// // // Імпорт графіків
// // import ComplexityDonut from "../charts/ComplexityDonut";
// // import EfficiencyChart from "../charts/EfficiencyChart";
// // import VolumeChart from "../charts/VolumeChart";
// // import PrefixCategoryDisplay from "../charts/PrefixCategoryDisplay";
// // import FurnitureChart from "../charts/FurnitureChart";
// // import ProfileColorChart from "../charts/ProfileColorChart";
// // import ProfileSystemChart from "../charts/ProfileSystemChart";
// // import ColorSystemHeatmap from "../charts/ColorSystemHeatmap";
// // import ComplexityTreemap from "../charts/ComplexityTreeMap";

// // import './ProductionStatisticsBlock.css';
// // // Важливо: додайте стилі для сітки, якщо вони тільки в файлі Builder.css
// // import './ProductionStatisticsBuilder.css'; 

// // const CATEGORY_MAPPING = {
// //   "Вікна безшовне зварювання": "Вікна", "Вікно": "Вікна", "Вікно вкл склопакет": "Вікна",
// //   "Розсувні системи SL76": "Вікна", "Французький балкон": "Вікна",
// //   "Двері безшовне зварювання": "Двері", "Двері": "Двері", "Міжкімнатні двері": "Двері",
// //   "Технічні двері ПВХ": "Двері", "Двері Lampre": "Двері",
// //   "Лиштва": "Додатки", "Москітні сітки": "Додатки", "Підвіконня": "Додатки",
// //   "Відливи": "Додатки", "Інше": "Додатки"
// // };

// // export default function ProductionStatisticsBlock({ rawData, dealerData, dateRange }) {
// //   const [layout, setLayout] = useState([]);
// //   const [loadingLayout, setLoadingLayout] = useState(true);
  
// //   // Стейт для фільтрації всередині віджетів (drill-down)
// //   const [selectedCategory, setSelectedCategory] = useState(null);
// //   const [activeSubCategory, setActiveSubCategory] = useState(null);

// //   // 1. Завантаження налаштувань дашборду
// //   useEffect(() => {
// //     const fetchLayout = async () => {
// //       try {
// //         const res = await axiosInstance.get("/user-dashboard-settings/");
// //         // Беремо перший дашборд або пустий масив
// //         if (res.data?.dashboards?.length > 0) {
// //           setLayout(res.data.dashboards[0].components);
// //         }
// //       } catch (err) {
// //         console.error("Не вдалося завантажити розкладку", err);
// //       } finally {
// //         setLoadingLayout(false);
// //       }
// //     };
// //     fetchLayout();
// //   }, []);

// //   // 2. Реєстр даних (аналогічно Builder)
// //   const chartRegistry = {
// //     PrefixCategoryDisplay: { component: PrefixCategoryDisplay, getData: () => ({ prefixData: dealerData?.prefixes || [] }) },
// //     ComplexityDonut: { 
// //         component: ComplexityDonut, 
// //         getData: () => {
// //             const groups = {};
// //             (rawData?.tables?.tech_details || []).forEach(item => {
// //                 const cat = CATEGORY_MAPPING[item.ConstructionTypeName_UA?.trim()] || "Додатки";
// //                 groups[cat] = (groups[cat] || 0) + parseFloat(item.TotalQuantity || 0);
// //             });
// //             return { 
// //               data: Object.entries(groups).map(([name, value]) => ({ name, value })), 
// //               onSectorClick: (name) => setSelectedCategory(name) 
// //             };
// //         }
// //     },
// //     ComplexityTreemap: { 
// //         component: ComplexityTreemap, 
// //         getData: () => {
// //             const filtered = (rawData?.tables?.tech_details || []).filter(item => {
// //                 const cleanName = item.ConstructionTypeName_UA?.trim() || "";
// //                 const parentGroup = CATEGORY_MAPPING[cleanName] || "Додатки";
// //                 return (selectedCategory ? parentGroup === selectedCategory : true) && (activeSubCategory ? cleanName === activeSubCategory : true);
// //             });
// //             return { 
// //               data: filtered.map(i => ({ name: `${i.ConstructionTypeName_UA} (${i.Складність_UA || 'Стандарт'})`, value: parseFloat(i.TotalQuantity || 0) })), 
// //               isDetail: true, 
// //               activeGroup: selectedCategory 
// //             };
// //         }
// //     },
// //     EfficiencyChart: { component: EfficiencyChart, getData: () => ({ data: rawData?.charts?.monthly || [] }) },
// //     VolumeChart: { component: VolumeChart, getData: () => ({ data: rawData?.charts?.monthly || [] }) },
// //     ProfileColorChart: { component: ProfileColorChart, getData: () => ({ data: dealerData?.profile_color || [] }) },
// //     ProfileSystemChart: { component: ProfileSystemChart, getData: () => ({ data: dealerData?.profile_system || [] }) },
// //     FurnitureChart: { component: FurnitureChart, getData: () => ({ data: dealerData?.hardware?.items || [] }) },
// //     ColorSystemHeatmap: { 
// //         component: ColorSystemHeatmap, 
// //         getData: () => {
// //             const res = [];
// //             const systems = dealerData?.profile_system || [];
// //             const colors = dealerData?.profile_color || [];
// //             systems.forEach(s => {
// //                 const sOrders = s.OrdersNumber?.split(',').map(n => n.trim()) || [];
// //                 colors.forEach(c => {
// //                     const cOrders = c.OrdersNumber?.split(',').map(n => n.trim()) || [];
// //                     const inter = sOrders.filter(o => cOrders.includes(o));
// //                     if (inter.length > 0) res.push({ system: s.ProfileSystem, color: c.ProfileColor, value: inter.length });
// //                 });
// //             });
// //             return { data: res };
// //         }
// //     }
// //   };

// //   // Допоміжна функція для підкатегорій (якщо потрібні таби в Treemap)
// //   const subCategories = useMemo(() => {
// //     const details = rawData?.tables?.tech_details;
// //     if (!selectedCategory || !Array.isArray(details)) return [];
// //     const subs = details
// //       .filter(item => (CATEGORY_MAPPING[item.ConstructionTypeName_UA?.trim()] || "Додатки") === selectedCategory)
// //       .map(item => item.ConstructionTypeName_UA?.trim())
// //       .filter(Boolean);
// //     return [...new Set(subs)].sort();
// //   }, [selectedCategory, rawData]);

// //   if (loadingLayout) return <div className="loading-spinner-wrapper">
// //             <div className="loading-spinner"></div>
// //           </div>;

// //   return (
// //     <div className="production-stats-container">
// //       <div 
// //         className="grid-container viewer-mode" 
// //         style={{
// //           display: "grid", 
// //           gridTemplateColumns: `repeat(12, 1fr)`,
// //           gridAutoRows: `15px`, // Повинно збігатися з GRID_ROW_HEIGHT в Builder
// //           gap: `20px`
// //         }}
// //       >
// //         {layout.map(comp => {
// //           const config = chartRegistry[comp.type];
// //           if (!config) return null;
// //           const Chart = config.component;

// //           return (
// //             <div 
// //               key={comp.id}
// //               className="widget-card viewer-card"
// //               style={{
// //                 gridColumn: `span ${comp.colSpan}`,
// //                 gridRow: `span ${comp.rowSpan}`,
// //                 display: 'flex',
// //                 flexDirection: 'column'
// //               }}
// //             >
// //               {/* Заголовок (мінімалістичний для перегляду) */}
// //               <div className="widget-header">
// //                 <span className="title-analytics-block">{comp.type}</span>
// //                 {comp.type === "ComplexityTreemap" && selectedCategory && (
// //                    <button className="btn-close-details" onClick={() => setSelectedCategory(null)}>✕</button>
// //                 )}
// //               </div>

// //               <div className="widget-content" style={{ flex: 1, overflow: 'hidden' }}>
// //                 {/* Спеціальна логіка для табів Treemap */}
// //                 {comp.type === "ComplexityTreemap" && selectedCategory && (
// //                   <div className="sub-nav-tabs">
// //                     <button className={`tab-link ${!activeSubCategory ? 'active' : ''}`} onClick={() => setActiveSubCategory(null)}>Всі</button>
// //                     {subCategories.map(sub => (
// //                       <button key={sub} className={`tab-link ${activeSubCategory === sub ? 'active' : ''}`} onClick={() => setActiveSubCategory(sub)}>{sub}</button>
// //                     ))}
// //                   </div>
// //                 )}
                
// //                 <div className="chart-wrapper" style={{ height: '100%', width: '100%' }}>
// //                   <Chart 
// //                     {...config.getData()} 
// //                     key={`${comp.id}-${selectedCategory}-${activeSubCategory}`}
// //                   />
// //                 </div>
// //               </div>
// //             </div>
// //           );
// //         })}
// //       </div>
// //     </div>
// //   );
// // }



// import React, { useEffect, useState, useMemo, useRef } from "react";
// import axiosInstance from "../../api/axios";

// // Імпорт графіків
// import ComplexityDonut from "../charts/ComplexityDonut";
// import EfficiencyChart from "../charts/EfficiencyChart";
// import VolumeChart from "../charts/VolumeChart";
// import PrefixCategoryDisplay from "../charts/PrefixCategoryDisplay";
// import FurnitureChart from "../charts/FurnitureChart";
// import ProfileColorChart from "../charts/ProfileColorChart";
// import ProfileSystemChart from "../charts/ProfileSystemChart";
// import ColorSystemHeatmap from "../charts/ColorSystemHeatmap";
// import ComplexityTreemap from "../charts/ComplexityTreeMap";

// import './ProductionStatisticsBlock.css';
// import './ProductionStatisticsBuilder.css'; 

// const CATEGORY_MAPPING = {
//   "Вікна безшовне зварювання": "Вікна", "Вікно": "Вікна", "Вікно вкл склопакет": "Вікна",
//   "Розсувні системи SL76": "Вікна", "Французький балкон": "Вікна",
//   "Двері безшовне зварювання": "Двері", "Двері": "Двері", "Міжкімнатні двері": "Двері",
//   "Технічні двері ПВХ": "Двері", "Двері Lampre": "Двері",
//   "Лиштва": "Додатки", "Москітні сітки": "Додатки", "Підвіконня": "Додатки",
//   "Відливи": "Додатки", "Інше": "Додатки"
// };

// export default function ProductionStatisticsBlock({ rawData, dealerData }) {
//   const [allDashboards, setAllDashboards] = useState([]);
//   const [activeDashboardId, setActiveDashboardId] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Стейт для drill-down фільтрації
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [activeSubCategory, setActiveSubCategory] = useState(null);

//   // 1. Завантаження розкладок при старті
//   useEffect(() => {
//     const fetchDashboards = async () => {
//       setLoading(true);
//       try {
//         const res = await axiosInstance.get("/user-dashboard-settings/");
//         if (res.data?.dashboards?.length > 0) {
//           setAllDashboards(res.data.dashboards);
//           setActiveDashboardId(res.data.dashboards[0].id); // Активуємо перший
//         }
//       } catch (err) {
//         console.error("Не вдалося завантажити дашборди", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchDashboards();
//   }, []);

//   // 2. Отримання компонентів активного дашборду
//   const currentComponents = useMemo(() => {
//     const active = allDashboards.find(d => d.id === activeDashboardId);
//     return active ? active.components : [];
//   }, [allDashboards, activeDashboardId]);

//   // 3. Реєстр даних для графіків
//   const chartRegistry = {
//     PrefixCategoryDisplay: { 
//       component: PrefixCategoryDisplay, 
//       getData: () => ({ prefixData: dealerData?.prefixes || [] }) 
//     },
//     ComplexityDonut: { 
//       component: ComplexityDonut, 
//       getData: () => {
//         const groups = {};
//         (rawData?.tables?.tech_details || []).forEach(item => {
//           const cat = CATEGORY_MAPPING[item.ConstructionTypeName_UA?.trim()] || "Додатки";
//           groups[cat] = (groups[cat] || 0) + parseFloat(item.TotalQuantity || 0);
//         });
//         return { 
//           data: Object.entries(groups).map(([name, value]) => ({ name, value })), 
//           onSectorClick: (name) => {
//             setSelectedCategory(name);
//             setActiveSubCategory(null);
//           }
//         };
//       }
//     },
//     ComplexityTreemap: { 
//       component: ComplexityTreemap, 
//       getData: () => {
//         const filtered = (rawData?.tables?.tech_details || []).filter(item => {
//           const cleanName = item.ConstructionTypeName_UA?.trim() || "";
//           const parentGroup = CATEGORY_MAPPING[cleanName] || "Додатки";
//           return (selectedCategory ? parentGroup === selectedCategory : true) && 
//                  (activeSubCategory ? cleanName === activeSubCategory : true);
//         });
//         return { 
//           data: filtered.map(i => ({ 
//             name: `${i.ConstructionTypeName_UA} (${i.Складність_UA || 'Стандарт'})`, 
//             value: parseFloat(i.TotalQuantity || 0) 
//           })), 
//           isDetail: true, 
//           activeGroup: selectedCategory 
//         };
//       }
//     },
//     EfficiencyChart: { component: EfficiencyChart, getData: () => ({ data: rawData?.charts?.monthly || [] }) },
//     VolumeChart: { component: VolumeChart, getData: () => ({ data: rawData?.charts?.monthly || [] }) },
//     ProfileColorChart: { component: ProfileColorChart, getData: () => ({ data: dealerData?.profile_color || [] }) },
//     ProfileSystemChart: { component: ProfileSystemChart, getData: () => ({ data: dealerData?.profile_system || [] }) },
//     FurnitureChart: { component: FurnitureChart, getData: () => ({ data: dealerData?.hardware?.items || [] }) },
//     ColorSystemHeatmap: { 
//       component: ColorSystemHeatmap, 
//       getData: () => {
//         const res = [];
//         const systems = dealerData?.profile_system || [];
//         const colors = dealerData?.profile_color || [];
//         systems.forEach(s => {
//           const sOrders = s.OrdersNumber?.split(',').map(n => n.trim()) || [];
//           colors.forEach(c => {
//             const cOrders = c.OrdersNumber?.split(',').map(n => n.trim()) || [];
//             const inter = sOrders.filter(o => cOrders.includes(o));
//             if (inter.length > 0) res.push({ system: s.ProfileSystem, color: c.ProfileColor, value: inter.length });
//           });
//         });
//         return { data: res };
//       }
//     }
//   };

//   // Розрахунок підкатегорій для Treemap
//   const subCategories = useMemo(() => {
//     const details = rawData?.tables?.tech_details;
//     if (!selectedCategory || !Array.isArray(details)) return [];
//     const subs = details
//       .filter(item => (CATEGORY_MAPPING[item.ConstructionTypeName_UA?.trim()] || "Додатки") === selectedCategory)
//       .map(item => item.ConstructionTypeName_UA?.trim())
//       .filter(Boolean);
//     return [...new Set(subs)].sort();
//   }, [selectedCategory, rawData]);

//   if (loading) return (
//     <div className="loading-spinner-wrapper">
//       <div className="loading-spinner"></div>
//       <p>Завантаження персональних дашбордів...</p>
//     </div>
//   );

//   return (
//     <div className="production-stats-container">
      
//       {/* ПАНЕЛЬ ВИБОРУ ДАШБОРДУ */}
//       <div className="dashboard-header-panel">
//         {/* <div className="dashboard-info">
//           <h2 className="dashboard-title">
//             <i className="fa fa-dashboard"></i> Аналітична панель
//           </h2>
//         </div> */}

//         {allDashboards.length > 1 && (
//           <div className="dashboard-controls" style={{marginBottom: '14px'}}>
//             <span className="label-choose-dash">Обрати вигляд:</span>
//             <div className="year-select-custom">
//             <select 

//               value={activeDashboardId || ""} 
//               onChange={(e) => {
//                 setActiveDashboardId(Number(e.target.value));
//                 setSelectedCategory(null); // скидаємо фільтри при зміні дашборду
//               }}
//             >
        
//               {allDashboards.map(db => (
//                 <option key={db.id} value={db.id}>{db.name}</option>
//               ))}
//             </select>
//                  </div>
//           </div>
//         )}
//       </div>

//       <div 
//         className="grid-container viewer-mode" 
//         style={{
//           display: "grid", 
//           gridTemplateColumns: `repeat(12, 1fr)`,
//           gridAutoRows: `15px`, 
//           gap: `20px`
//         }}
//       >
//         {currentComponents.map(comp => {
//           const config = chartRegistry[comp.type];
//           if (!config) return null;
//           const Chart = config.component;

//           return (
//             <div 
//               key={comp.id}
//               className="widget-card viewer-card animate-fade-in"
//               style={{
//                 gridColumn: `span ${comp.colSpan}`,
//                 gridRow: `span ${comp.rowSpan}`,
//                 display: 'flex',
//                 flexDirection: 'column'
//               }}
//             >
//               <div className="widget-header">
//                 <span className="title-analytics-block">
//                   {comp.type === "ComplexityTreemap" && selectedCategory 
//                     ? `${selectedCategory} (Детально)` 
//                     : (comp.title || comp.type)
//                   }
//                 </span>
//                 {comp.type === "ComplexityTreemap" && selectedCategory && (
//                    <button className="btn-close-details" onClick={() => setSelectedCategory(null)}>✕</button>
//                 )}
//               </div>

//               <div className="widget-content" style={{ flex: 1, overflow: 'hidden' }}>
//                 {/* Таби для Treemap, якщо обрана категорія */}
//                 {comp.type === "ComplexityTreemap" && selectedCategory && (
//                   <div className="sub-nav-tabs">
//                     <button className={`tab-link ${!activeSubCategory ? 'active' : ''}`} onClick={() => setActiveSubCategory(null)}>Всі</button>
//                     {subCategories.map(sub => (
//                       <button key={sub} className={`tab-link ${activeSubCategory === sub ? 'active' : ''}`} onClick={() => setActiveSubCategory(sub)}>{sub}</button>
//                     ))}
//                   </div>
//                 )}
                
//                 <div className="chart-wrapper" style={{ height: '100%', width: '100%' }}>
//                   <Chart 
//                     {...config.getData()} 
//                     key={`${comp.id}-${selectedCategory}-${activeSubCategory}`}
//                   />
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {allDashboards.length === 0 && (
//         <div className="no-data-placeholder">
//           <p>У вас ще немає збережених дашбордів. Створіть їх у конструкторі.</p>
//         </div>
//       )}
//     </div>
//   );
// }


import React, { useEffect, useState, useMemo } from "react";
import axiosInstance from "../../api/axios";

// Імпорт графіків
import ComplexityDonut from "../charts/ComplexityDonut";
import EfficiencyChart from "../charts/EfficiencyChart";
import VolumeChart from "../charts/VolumeChart";
import PrefixCategoryDisplay from "../charts/PrefixCategoryDisplay";
import FurnitureChart from "../charts/FurnitureChart";
import ProfileColorChart from "../charts/ProfileColorChart";
import ProfileSystemChart from "../charts/ProfileSystemChart";
import ColorSystemHeatmap from "../charts/ColorSystemHeatmap";
import ComplexityTreemap from "../charts/ComplexityTreeMap";

import './ProductionStatisticsBlock.css';
import './ProductionStatisticsBuilder.css'; 

const CATEGORY_MAPPING = {
  "Вікна безшовне зварювання": "Вікна", "Вікно": "Вікна", "Вікно вкл склопакет": "Вікна",
  "Розсувні системи SL76": "Вікна", "Французький балкон": "Вікна",
  "Двері безшовне зварювання": "Двері", "Двері": "Двері", "Міжкімнатні двері": "Двері",
  "Технічні двері ПВХ": "Двері", "Двері Lampre": "Двері",
  "Лиштва": "Додатки", "Москітні сітки": "Додатки", "Підвіконня": "Додатки",
  "Відливи": "Додатки", "Інше": "Додатки"
};

export default function ProductionStatisticsBlock({ rawData, dealerData }) {
  const [allDashboards, setAllDashboards] = useState([]);
  const [activeDashboardId, setActiveDashboardId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Стейт для drill-down фільтрації
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeSubCategory, setActiveSubCategory] = useState(null);

  // 1. Завантаження розкладок
  useEffect(() => {
    const fetchDashboards = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/user-dashboard-settings/");
        if (res.data?.dashboards?.length > 0) {
          setAllDashboards(res.data.dashboards);
          setActiveDashboardId(res.data.dashboards[0].id);
        }
      } catch (err) {
        console.error("Не вдалося завантажити дашборди", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboards();
  }, []);

  // 2. Реєстр конфігурацій (Централізоване управління назвами та іконками)
  const chartRegistry = {
    PrefixCategoryDisplay: { 
      title: "Аналітика замовлень", 
      icon: "fa-credit-card-alt", 
      component: PrefixCategoryDisplay, 
      getData: () => ({ prefixData: dealerData?.prefixes || [] }) 
    },
    ComplexityDonut: { 
      title: "Розподіл за категоріями", 
      icon: "fa-pie-chart", 
      component: ComplexityDonut, 
      getData: () => {
        const groups = {};
        (rawData?.tables?.tech_details || []).forEach(item => {
          const cat = CATEGORY_MAPPING[item.ConstructionTypeName_UA?.trim()] || "Додатки";
          groups[cat] = (groups[cat] || 0) + parseFloat(item.TotalQuantity || 0);
        });
        return { 
          data: Object.entries(groups).map(([name, value]) => ({ name, value })), 
          onSectorClick: (name) => {
            setSelectedCategory(name);
            setActiveSubCategory(null);
          }
        };
      }
    },
    ComplexityTreemap: { 
      title: "Деталізація категорій", 
      icon: "fa-th", 
      component: ComplexityTreemap, 
      getData: () => {
        const filtered = (rawData?.tables?.tech_details || []).filter(item => {
          const cleanName = item.ConstructionTypeName_UA?.trim() || "";
          const parentGroup = CATEGORY_MAPPING[cleanName] || "Додатки";
          return (selectedCategory ? parentGroup === selectedCategory : true) && 
                 (activeSubCategory ? cleanName === activeSubCategory : true);
        });
        return { 
          data: filtered.map(i => ({ 
            name: `${i.ConstructionTypeName_UA} (${i.Складність_UA || 'Стандарт'})`, 
            value: parseFloat(i.TotalQuantity || 0) 
          })), 
          isDetail: true, 
          activeGroup: selectedCategory 
        };
      }
    },
    EfficiencyChart: { 
      title: "Обіг (грн)", 
      icon: "fa-line-chart", 
      component: EfficiencyChart, 
      getData: () => ({ data: rawData?.charts?.monthly || [] }) 
    },
    VolumeChart: { 
      title: "Виробництво та оборот", 
      icon: "fa-bar-chart", 
      component: VolumeChart, 
      getData: () => ({ data: rawData?.charts?.monthly || [] }) 
    },
    ProfileColorChart: { 
      title: "Колірна гама", 
      icon: "fa-paint-brush", 
      component: ProfileColorChart, 
      getData: () => ({ data: dealerData?.profile_color || [] }) 
    },
    ProfileSystemChart: { 
      title: "Профільні системи", 
      icon: "fa-windows", 
      component: ProfileSystemChart, 
      getData: () => ({ data: dealerData?.profile_system || [] }) 
    },
    FurnitureChart: { 
      title: "Рейтинг фурнітури", 
      icon: "fa-key", 
      component: FurnitureChart, 
      getData: () => ({ data: dealerData?.hardware?.items || [] }) 
    },
    ColorSystemHeatmap: { 
      title: "Перетин: Системи/Кольори", 
      icon: "fa-th-large", 
      component: ColorSystemHeatmap, 
      getData: () => {
        const res = [];
        const systems = dealerData?.profile_system || [];
        const colors = dealerData?.profile_color || [];
        systems.forEach(s => {
          const sOrders = s.OrdersNumber?.split(',').map(n => n.trim()) || [];
          colors.forEach(c => {
            const cOrders = c.OrdersNumber?.split(',').map(n => n.trim()) || [];
            const inter = sOrders.filter(o => cOrders.includes(o));
            if (inter.length > 0) res.push({ system: s.ProfileSystem, color: c.ProfileColor, value: inter.length });
          });
        });
        return { data: res };
      }
    }
  };

  const currentComponents = useMemo(() => {
    const active = allDashboards.find(d => d.id === activeDashboardId);
    return active ? active.components : [];
  }, [allDashboards, activeDashboardId]);

  const subCategories = useMemo(() => {
    const details = rawData?.tables?.tech_details;
    if (!selectedCategory || !Array.isArray(details)) return [];
    const subs = details
      .filter(item => (CATEGORY_MAPPING[item.ConstructionTypeName_UA?.trim()] || "Додатки") === selectedCategory)
      .map(item => item.ConstructionTypeName_UA?.trim())
      .filter(Boolean);
    return [...new Set(subs)].sort();
  }, [selectedCategory, rawData]);

  if (loading) return (
    <div className="loading-spinner-wrapper">
      <div className="loading-spinner"></div>
      <p>Завантаження персональних дашбордів...</p>
    </div>
  );

  return (
    <div className="production-stats-container">
      
      {/* ПАНЕЛЬ ВИБОРУ ДАШБОРДУ */}
      <div className="dashboard-header-panel">
        {allDashboards.length > 1 && (
          <div className="dashboard-controls" style={{marginBottom: '14px'}}>
            <span className="label-choose-dash">Обрати вигляд:</span>

              <select   className="year-select-custom"
                value={activeDashboardId || ""} 
                onChange={(e) => {
                  setActiveDashboardId(Number(e.target.value));
                  setSelectedCategory(null);
                }}
              >
                {allDashboards.map(db => (
                  <option key={db.id} value={db.id}>{db.name}</option>
                ))}
              </select>
            </div>

        )}
      </div>

      <div 
        className="grid-container viewer-mode" 
        style={{
          display: "grid", 
          gridTemplateColumns: `repeat(12, 1fr)`,
          gridAutoRows: `15px`, 
          gap: `20px`
        }}
      >
        {currentComponents.map(comp => {
          const config = chartRegistry[comp.type];
          if (!config) return null;
          
          const Chart = config.component;

          // Логіка динамічного заголовка
          const displayTitle = (comp.type === "ComplexityTreemap" && selectedCategory)
            ? `${selectedCategory} (Детально)`
            : (config.title || comp.type);

          return (
            <div 
              key={comp.id}
              className="widget-card viewer-card animate-fade-in"
              style={{
                gridColumn: `span ${comp.colSpan}`,
                gridRow: `span ${comp.rowSpan}`,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div className="widget-header">
                <span className="title-analytics-block">
                  {config.icon && <i className={`fa ${config.icon} thumb-icon`} style={{ marginRight: '10px', opacity: 0.8 }}></i>}
                  {displayTitle}
                </span>
                {comp.type === "ComplexityTreemap" && selectedCategory && (
                   <button className="btn-close-details" onClick={() => setSelectedCategory(null)}>✕</button>
                )}
              </div>

              <div className="widget-content" style={{ flex: 1, overflow: 'hidden' }}>
                {comp.type === "ComplexityTreemap" && selectedCategory && (
                  <div className="sub-nav-tabs">
                    <button className={`tab-link ${!activeSubCategory ? 'active' : ''}`} onClick={() => setActiveSubCategory(null)}>Всі</button>
                    {subCategories.map(sub => (
                      <button key={sub} className={`tab-link ${activeSubCategory === sub ? 'active' : ''}`} onClick={() => setActiveSubCategory(sub)}>{sub}</button>
                    ))}
                  </div>
                )}
                
                <div className="chart-wrapper" style={{ height: '100%', width: '100%' }}>
                  <Chart 
                    {...config.getData()} 
                    key={`${comp.id}-${selectedCategory}-${activeSubCategory}`}
                    width="100%" height="100%" 
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {allDashboards.length === 0 && (
        <div className="no-data-placeholder">
          <p>У вас ще немає збережених дашбордів. Створіть їх у конструкторі.</p>
        </div>
      )}
    </div>
  );
}