// import { useEffect, useState, useMemo, useRef } from "react";
// import axiosInstance from "../../api/axios";
// import ComplexityDonut from "../charts/ComplexityDonut";
// import FrequencyVolumeChart from "../charts/FrequencyVolumeChart";
// import ProductionTimelineChart from "../charts/ProductionTimelineChart";
// import MonthlyTrendChart from "../charts/MonthlyTrendChart";
// import MonthlyHeatmapChart from "../charts/MonthlyHeatmapChart";
// import TopProductsChart from "../charts/TopProductsChart";
// import ProductionFunnelChart from "../charts/ProductionFunnelChart";
// import ComplexityProfitScatter from "../charts/ComplexityProfitScatter";
// import ABCAnalysisChart from "../charts/ABCAnalysisChart";
// import BCGMatrixChart from "../charts/BCGMatrixChart";
// import CategoryTrendChart from "../charts/CategoryTrendChart";
// import DealerSelect from "../../pages/DealerSelect";
// import './ProductionStatisticsBlock.css';

// // Мапінг для групування категорій
// const CATEGORY_MAPPING = {
//   "Вікна безшовне зварювання": "Вікна",
//   "Вікно": "Вікна",
//   "Вікно вкл склопакет": "Вікна",
//   "Розсувні системи SL76": "Вікна",
//   "Двері безшовне зварювання": "Двері",
//   "Міжкімнатні двері": "Двері",
//   "Технічні двері ПВХ": "Двері",
//   "Двері Lampre": "Двері",
//   "Лиштва": "Додатки",
//   "Москітні сітки": "Додатки",
//   "Підвіконня": "Додатки",
//   "Відливи": "Додатки",
//   "Інше": "Додатки"
// };

// export default function ProductionStatisticsBlock({ selectedYear }) {
//   const isAdmin = localStorage.getItem("role") === "admin";
//   const drillDownRef = useRef(null);
  
//   const [data, setData] = useState(null);
//   const [dealerGuid, setDealerGuid] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [selectedCategory, setSelectedCategory] = useState(null);

//   useEffect(() => {
//     const loadData = async () => {
//       setLoading(true);
//       try {
//         const params = { year: 2025 };
//         if (isAdmin && dealerGuid) params.contractor_guid = dealerGuid;
//         const res = await axiosInstance.get("/full-statistics/", { params });
//         setData(res.data);
//       } catch (err) {
//         console.error(err);
//       } finally { 
//         setLoading(false); 
//       }
//     };
//     loadData();
//   }, [selectedYear, dealerGuid]);

//   // Обчислення для KPI
//   const bestMonth = useMemo(() => {
//     if (!data?.charts?.monthly) return { name: '-', sum: 0 };
//     const sorted = [...data.charts.monthly].sort((a, b) => b.MonthlySum - a.MonthlySum);
//     return { name: sorted[0]?.MonthName || '-', sum: sorted[0]?.MonthlySum || 0 };
//   }, [data]);

//   // Головний Donut - розподіл по групах
//   const mainDonutData = useMemo(() => {
//     if (!data?.charts?.distribution) return [];
//     const groups = {};
//     data.charts.distribution.labels.forEach((label, i) => {
//       const groupName = CATEGORY_MAPPING[label] || "Інше";
//       groups[groupName] = (groups[groupName] || 0) + data.charts.distribution.values[i];
//     });
//     return Object.entries(groups).map(([name, value]) => ({ name, value }));
//   }, [data]);

//   // ТОП-10 продуктів за виручкою (потрібно додати в бекенді середній чек * кількість)
//   const topByRevenue = useMemo(() => {
//     if (!data?.tables?.tech_details) return [];
//     return data.tables.tech_details
//       .map(item => ({
//         name: item.ConstructionTypeName_UA,
//         revenue: item.TotalQuantity * 20000, // Приблизно, треба точні дані
//         orders: item.UniqueOrdersCount,
//         quantity: item.TotalQuantity
//       }))
//       .sort((a, b) => b.revenue - a.revenue)
//       .slice(0, 10);
//   }, [data]);

//   // ТОП-10 за кількістю замовлень
//   const topByOrders = useMemo(() => {
//     if (!data?.tables?.tech_details) return [];
//     return data.tables.tech_details
//       .map(item => ({
//         name: item.ConstructionTypeName_UA,
//         orders: item.UniqueOrdersCount,
//         quantity: item.TotalQuantity
//       }))
//       .sort((a, b) => b.orders - a.orders)
//       .slice(0, 10);
//   }, [data]);

//   // Деталізація для drill-down
//   const categoryDetails = useMemo(() => {
//     if (!selectedCategory || !data) return [];
//     return data.tables.tech_details
//       .filter(item => (CATEGORY_MAPPING[item.ConstructionTypeName_UA] || "Інше") === selectedCategory)
//       .map(item => ({
//         name: `${item.ConstructionTypeName_UA} (${item.Складність_UA})`,
//         value: item.TotalQuantity,
//         orders: item.OrderNumbers,
//         uniqueOrders: item.UniqueOrdersCount
//       }))
//       .sort((a, b) => b.value - a.value);
//   }, [selectedCategory, data]);

//   // Дані для BCG Matrix
//   const bcgData = useMemo(() => {
//     if (!data?.tables?.tech_details) return [];
//     const totalRevenue = data.summary.total_sum;
    
//     return data.tables.tech_details.map(item => ({
//       name: item.ConstructionTypeName_UA,
//       marketShare: (item.UniqueOrdersCount / data.summary.total_orders) * 100,
//       growthRate: Math.random() * 30 - 10, // TODO: порівняти з минулим роком
//       revenue: item.TotalQuantity * 20000,
//       orders: item.UniqueOrdersCount
//     })).filter(item => item.orders > 5); // Фільтруємо малі категорії
//   }, [data]);

//   if (loading) return <div className="loading-spinner">Завантаження аналітики...</div>;
//   if (!data) return <div className="error-message">Дані не знайдено</div>;

//   return (
//     <div className="production-stats-container">
      
//       {/* ============ 1. KPI ВЕРХНІЙ РЯД (6 карток) ============ */}
//       <div className="kpi-grid-6 mb-32">
//         <div className="kpi-card shadow-sm">
//           <span className="label">Річний оборот</span>
//           <span className="value text-green">{Number(data.summary.total_sum).toLocaleString()} <small>грн</small></span>
//         </div>
        
//         <div className="kpi-card shadow-sm">
//           <span className="label">Замовлень (KPI)</span>
//           <span className="value">{data.summary.kpi_orders_count} <small>/ {data.summary.total_orders}</small></span>
//         </div>
        
//         <div className="kpi-card shadow-sm">
//           <span className="label">Середній чек</span>
//           <span className="value">{Number(data.summary.avg_check).toLocaleString()} <small>грн</small></span>
//         </div>
        
//         <div className="kpi-card shadow-sm">
//           <span className="label">Час виготовлення</span>
//           <span className="value">{Number(data.summary.avg_days).toFixed(1)} <small>дн.</small></span>
//         </div>
        
//         <div className="kpi-card shadow-sm border-amber">
//           <span className="label">Найкращий місяць</span>
//           <span className="value text-amber">{bestMonth.name} <small>{(bestMonth.sum / 1000000).toFixed(1)}M</small></span>
//         </div>
        
//         <div className="kpi-card shadow-sm border-red">
//           <span className="label">Рекламації</span>
//           <span className="value color-red">{Number(data.summary.complaint_rate).toFixed(1)}%</span>
//         </div>
//       </div>

//       {/* ============ 2. ТРЕНДИ ТА СЕЗОННІСТЬ (2 колонки) ============ */}
//       <div className="stats-grid-2 mb-32">
//         <div className="chart-wrapper-card">
//           <h4 className="chart-title">📈 Динаміка продажів та середнього чеку</h4>
//           <MonthlyTrendChart data={data.charts.monthly} />
//         </div>

//         <div className="chart-wrapper-card">
//           <h4 className="chart-title">🔥 Тепловий календар активності</h4>
//           <MonthlyHeatmapChart data={data.charts.monthly} />
//         </div>
//       </div>

//       {/* ============ 3. ПОРТФЕЛЬ ПРОДУКТІВ (3 колонки) ============ */}
//       <div className="stats-grid-3 mb-32">
//         <div className="chart-wrapper-card">
//           <h4 className="chart-title">🎯 Розподіл портфеля</h4>
//           <p className="chart-subtitle">Клік на сектор для деталізації</p>
//           <ComplexityDonut 
//             data={mainDonutData} 
//             onSectorClick={(name) => {
//               setSelectedCategory(name);
//               setTimeout(() => drillDownRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
//             }} 
//           />
//         </div>

//         <div className="chart-wrapper-card">
//           <h4 className="chart-title">💰 ТОП-10 за виручкою</h4>
//           <TopProductsChart data={topByRevenue} metric="revenue" />
//         </div>

//         <div className="chart-wrapper-card">
//           <h4 className="chart-title">🔢 ТОП-10 за замовленнями</h4>
//           <TopProductsChart data={topByOrders} metric="orders" />
//         </div>
//       </div>

//       {/* ============ 4. ОПЕРАЦІЙНА ЕФЕКТИВНІСТЬ (2 колонки) ============ */}
//       <div className="stats-grid-2 mb-32">
//         <div className="chart-wrapper-card">
//           <h4 className="chart-title">⏱️ Де витрачається час?</h4>
//           <ProductionTimelineChart data={data.charts.speed} />
//         </div>

//         <div className="chart-wrapper-card">
//           <h4 className="chart-title">🎲 Складність vs Прибутковість</h4>
//           <ComplexityProfitScatter data={data.tables.categories} />
//         </div>
//       </div>

//       {/* ============ 5. DRILL-DOWN СЕКЦІЯ ============ */}
//       {selectedCategory && (
//         <div className="drilldown-section animate-fade-in" ref={drillDownRef}>
//           <div className="drilldown-header">
//             <div>
//               <h3 className="section-title">Деталізація групи: <span className="color-primary">{selectedCategory}</span></h3>
//               <p className="section-subtitle">Підкатегорії, тренди та ключові продукти</p>
//             </div>
//             <button className="btn-close" onClick={() => setSelectedCategory(null)}>
//               ✕ Закрити
//             </button>
//           </div>

//           <div className="stats-grid-2 mb-24">
//             <div className="chart-wrapper-card">
//               <h5>Розподіл підкатегорій</h5>
//               <ComplexityDonut data={categoryDetails} isDetail={true} />
//             </div>

//             <div className="chart-wrapper-card">
//               <h5>ТОП позицій за кількістю</h5>
//               <TopProductsChart 
//                 data={categoryDetails.slice(0, 10)} 
//                 metric="value"
//               />
//             </div>
//           </div>

//           {/* Номери замовлень */}
//           <div className="card-p24 bg-gray-50 rounded-12">
//             <h5 className="mb-16">📋 Номери замовлень ({categoryDetails.reduce((s, d) => s + d.uniqueOrders, 0)} шт)</h5>
//             <div className="orders-tag-cloud">
//               {Array.from(new Set(categoryDetails.flatMap(d => d.orders.split(',')))).slice(0, 100).map((order, idx) => (
//                 <span key={idx} className="order-tag">{order.trim()}</span>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ============ 6. СТРАТЕГІЧНА АНАЛІТИКА (2 колонки) ============ */}
//       <div className="stats-grid-2 mb-32">
//         <div className="chart-wrapper-card">
//           <h4 className="chart-title">📊 ABC-аналіз продуктів</h4>
//           <p className="chart-subtitle">Розподіл за принципом Парето</p>
//           <ABCAnalysisChart data={data.tables.tech_details} />
//         </div>

//         <div className="chart-wrapper-card">
//           <h4 className="chart-title">⭐ BCG Матриця</h4>
//           <p className="chart-subtitle">Зірки, Корови, Знаки питання, Собаки</p>
//           <BCGMatrixChart data={bcgData} />
//         </div>
//       </div>

//       {/* ============ 7. ДЕТАЛЬНИЙ СКАТТЕР (повна ширина) ============ */}
//       <div className="chart-wrapper-card">
//         <h4 className="chart-title">🔍 Матриця ефективності: Замовлення vs Об'єм</h4>
//         <FrequencyVolumeChart data={data.tables.tech_details} />
//       </div>

//     </div>
//   );
// }


import { useEffect, useState, useMemo, useRef } from "react";
import axiosInstance from "../../api/axios";
import ComplexityDonut from "../charts/ComplexityDonut";
import FrequencyVolumeChart from "../charts/FrequencyVolumeChart";
import ProductionTimelineChart from "../charts/ProductionTimelineChart";
import MonthlyTrendChart from "../charts/MonthlyTrendChart";
import MonthlyHeatmapChart from "../charts/MonthlyHeatmapChart";
import TopProductsChart from "../charts/TopProductsChart";
import ComplexityProfitScatter from "../charts/ComplexityProfitScatter";
import ABCAnalysisChart from "../charts/ABCAnalysisChart";
import BCGMatrixChart from "../charts/BCGMatrixChart";
import DealerSelect from "../../pages/DealerSelect";
import './ProductionStatisticsBlock.css';
import ComplexityTreemap from "../charts/ComplexityTreeMap";
import EfficiencyChart from '../charts/EfficiencyChart';
import VolumeChart from '../charts/VolumeChart';

// Мапінг для групування сирих категорій у великі бізнес-групи
const CATEGORY_MAPPING = {
  "Вікна безшовне зварювання": "Вікна",
  "Вікно": "Вікна",
  "Вікно вкл склопакет": "Вікна",
  "Розсувні системи SL76": "Вікна",
  "Двері безшовне зварювання": "Двері",
  "Двері": "Двері",
  "Міжкімнатні двері": "Двері",
  "Технічні двері ПВХ": "Двері",
  "Двері Lampre": "Двері",
  "Лиштва": "Додатки",
  "Москітні сітки": "Додатки",
  "Підвіконня": "Додатки",
  "Відливи": "Додатки",
  "Інше": "Додатки",
  "Французький балкон": "Вікна"
};

export default function ProductionStatisticsBlock({ selectedYear }) {
  const isAdmin = localStorage.getItem("role") === "admin";
  const drillDownRef = useRef(null);
  
  const [data, setData] = useState(null);
  const [dealerGuid, setDealerGuid] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState(null); // Напр. "Додатки"
  const [activeSubCategory, setActiveSubCategory] = useState(null); // Напр. "Лиштва"

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const params = { year: 2025 };
        if (isAdmin && dealerGuid) params.contractor_guid = dealerGuid;
        const res = await axiosInstance.get("/full-statistics/", { params });
        setData(res.data);
      } catch (err) {
        console.error("Помилка аналітики:", err);
      } finally { 
        setLoading(false); 
      }
    };
    loadData();
  }, [selectedYear, dealerGuid, isAdmin]);

  useEffect(() => {
    if (selectedCategory && drillDownRef.current) {
      drillDownRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedCategory]);



  // --- ОБРОБКА ДАНИХ ---

  // 1. Головне кільце (Рівень 1)
  // 1. Головне кільце (Рівень 1) - Агрегуємо дані прямо з tech_details
const mainDonutData = useMemo(() => {
    const details = data?.tables?.tech_details;
    if (!Array.isArray(details) || details.length === 0) return [];
    
    const groups = {};
    details.forEach(item => {
      const rawSub = item.ConstructionTypeName_UA?.trim() || "Інше";
      const groupName = CATEGORY_MAPPING[rawSub] || "Додатки";
      const qty = parseFloat(item.TotalQuantity || 0);

      groups[groupName] = (groups[groupName] || 0) + qty;
    });

    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // 2. Список підкатегорій (Рівень 2 - Навігація) - БЕЗПЕЧНА ФІЛЬТРАЦІЯ
  const subCategories = useMemo(() => {
    const details = data?.tables?.tech_details;
    if (!selectedCategory || !Array.isArray(details)) return [];
    
    const subs = details
        .filter(item => {
            const cleanName = item.ConstructionTypeName_UA?.trim() || "";
            return (CATEGORY_MAPPING[cleanName] || "Додатки") === selectedCategory;
        })
        .map(item => item.ConstructionTypeName_UA?.trim())
        .filter(Boolean); // Видаляємо null/undefined
        
    return [...new Set(subs)].sort();
  }, [selectedCategory, data]);

  // 3. Детальні дані для графіків - ЗАХИСТ ВІД NULL ТА ПОРОЖНІХ РЯДКІВ
  const filteredCategoryDetails = useMemo(() => {
    const details = data?.tables?.tech_details;
    if (!selectedCategory || !Array.isArray(details)) return [];

    return details
        .filter(item => {
            const cleanName = item.ConstructionTypeName_UA?.trim() || "";
            const parentGroup = CATEGORY_MAPPING[cleanName] || "Додатки";
            const isRightGroup = parentGroup === selectedCategory;
            const isRightSub = activeSubCategory ? cleanName === activeSubCategory : true;

            return isRightGroup && isRightSub;
        })
        .map(item => ({
            name: `${item.ConstructionTypeName_UA?.trim() || "Невідомо"} (${item.Складність_UA?.trim() || "Стандарт"})`,
            value: parseFloat(item.TotalQuantity || 0),
            uniqueOrders: parseInt(item.UniqueOrdersCount || 0),
            orders: item.OrderNumbers || "",
            subCategory: item.ConstructionTypeName_UA?.trim() || ""
        }))
        .filter(item => item.value > 0) // Показуємо тільки реальні об'єми
        .sort((a, b) => b.value - a.value);
  }, [selectedCategory, activeSubCategory, data]);

  // 4. Метрики часу - ЗАХИСТ ВІД ДІЛЕННЯ НА НУЛЬ
  const activeMetrics = useMemo(() => {
    const categories = data?.tables?.categories;
    if (!selectedCategory || !Array.isArray(categories)) return null;

    let relevantRows = [];
    if (activeSubCategory) {
        relevantRows = categories.filter(c => c.CategoryName === activeSubCategory);
    } else {
        relevantRows = categories.filter(cat => 
            (CATEGORY_MAPPING[cat.CategoryName] || "Додатки") === selectedCategory
        );
    }

    const totalOrders = relevantRows.reduce((s, r) => s + (parseInt(r.TotalOrders) || 0), 0);
    if (totalOrders === 0) return { avgFull: 0, avgQueue: 0, avgProd: 0, totalQty: 0 };

    return {
        avgFull: (relevantRows.reduce((s, r) => s + ((r.AvgFullCycleDays || 0) * r.TotalOrders), 0) / totalOrders).toFixed(1),
        avgQueue: (relevantRows.reduce((s, r) => s + ((r.AvgWaitInQueueDays || 0) * r.TotalOrders), 0) / totalOrders).toFixed(1),
        avgProd: (relevantRows.reduce((s, r) => s + ((r.AvgPureProductionDays || 0) * r.TotalOrders), 0) / totalOrders).toFixed(1),
        totalQty: relevantRows.reduce((s, r) => s + (parseInt(r.TotalQuantity) || 0), 0)
    };
  }, [selectedCategory, activeSubCategory, data]);

  if (loading) {
        return (
            <div className="loading-spinner-wrapper">
                <div className="loading-spinner"></div>
                <div className="loading-text">
                    { "Завантаження..."}
                </div>
            </div>
        );
    }
  if (!data) return <div className="error-msg">Дані не завантажено</div>;

  return (
    <div className="production-stats-container">
      
      {/* 1. ПАНЕЛЬ KPI */}
      <div className="kpi-grid-6 mb-32">
        {/* <div className="kpi-card shadow-sm">
          <span className="label">Оборот {selectedYear}</span>
          <span className="value text-green">{data.summary.total_sum?.toLocaleString()} <small>грн</small></span>
        </div> */}
        <div className="kpi-card shadow-sm badge-order">
          <span className="label">Замовлень</span>
          <span className="value">{data.summary.total_orders} <small>шт</small></span>
        </div>
        <div className="kpi-card shadow-sm badge-order">
          <span className="label">Кількість конструкцій</span>
          <span className="value">{data.summary.total_orders} <small>шт</small></span>
        </div>

        <div className="kpi-card shadow-sm">
          <span className="label">Середній чек</span>
          <span className="value">{Math.round(data.summary.avg_check || 0).toLocaleString()} <small>грн</small></span>
        </div>

        <div className="kpi-card shadow-sm">
          <span className="label">Оборот</span>
          <span className="value">{Math.round(data.summary.total_sum || 0).toLocaleString()} <small>грн</small></span>
        </div>
        <div className="kpi-card shadow-sm">
          <span className="label">Середній час виробництва</span>
          <span className="value">{Number(data.summary.avg_days || 0).toFixed(1)} <small>дн.</small></span>
        </div>

        <div className="kpi-card shadow-sm border-amber badge-reclamation">
          <span className="label">Рекламації</span>
          <span className="value color-red">{Number(data.summary.complaint_rate || 0).toFixed(1)}%</span>
        </div>
        

        {/* <div className="kpi-card shadow-sm">
           {isAdmin && <DealerSelect value={dealerGuid} onChange={setDealerGuid} />}
        </div> */}
      </div>
      <div className="stats-grid-2 mb-20">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
        <div className="chart-wrapper-card">
          <EfficiencyChart data={data.charts.monthly} />
        </div>
        <div className="chart-wrapper-card">
          <VolumeChart data={data.charts.monthly} />
        </div>
      </div>

         {/* <div className="chart-wrapper-card">
           <h4 className="chart-title">🔥 Календар активності</h4>
           <MonthlyHeatmapChart data={data.charts.monthly} />
        </div> */}
          </div>


      {/* 2. ПОРТФЕЛЬ ТА СКАТТЕР */}
      <div className="stats-grid-2 mb-32">
        <div className="chart-wrapper-card">
          <h4 className="chart-title">🎯 Розподіл категорій</h4>
          <p className="chart-subtitle">Натисніть на групу для деталізації</p>
          <ComplexityDonut 
            data={mainDonutData} 
            onSectorClick={(name) => {
              setSelectedCategory(name);
              setActiveSubCategory(null);
            }} 
          />
        </div>
        {/* <div className="chart-wrapper-card">
          <h4 className="chart-title">🔍 Матриця ефективності</h4>
          <FrequencyVolumeChart data={data.tables.tech_details} />
        </div> */}
      </div>

      {/* 3. DRILL-DOWN (Деталізація) */}
{selectedCategory && (
    <div className="chart-wrapper-card drilldown-view animate-fade-in" ref={drillDownRef}>
        <div className="drilldown-header row jc-sb ai-center mb-16">
            <h3 className="section-title">
                Аналіз групи: <span className="color-primary">{selectedCategory}</span>
                {activeSubCategory && <span className="sub-title-arrow"> → {activeSubCategory}</span>}
            </h3>
            <button className="btn-close-details-analytics" onClick={() => {
                setSelectedCategory(null);
                setActiveSubCategory(null);
            }}>✕</button>
        </div>

        {/* НОВИЙ БЛОК: СЕРЕДНІЙ ЧАС ПО КАТЕГОРІЇ */}
        {activeSubCategory && activeMetrics && (
      <div className="drilldown-metrics-grid mb-24">
          <div className="d-mini-card">
              <span className="d-label">Середній час очікування запуска виробництва</span>
              <span className="d-value">{activeMetrics.avgQueue} <small>дн.</small></span>
          </div>
          <div className="d-mini-card">
              <span className="d-label">Середній час виробництва</span>
              <span className="d-value">{activeMetrics.avgProd} <small>дн.</small></span>
          </div>
          <div className="d-mini-card highlight">
              <span className="d-label">Разом тривалість виготовлення</span>
              <span className="d-value">{activeMetrics.avgFull} <small>дн.</small></span>
          </div>
          <div className="d-mini-card">
              <span className="d-label">Об'єм підкатегорії</span>
              <span className="d-value">{activeMetrics.totalQty.toLocaleString()} <small>шт</small></span>
          </div>
      </div>
  )}

        {/* БЛОК ФІЛЬТРІВ (ТАБИ) */}
        <div className="sub-nav-tabs mb-24">
            <button 
                className={`tab-link ${!activeSubCategory ? 'active' : ''}`}
                onClick={() => setActiveSubCategory(null)}
            >
                Всі товари групи
            </button>
            {subCategories.map(sub => (
                <button 
                    key={sub}
                    className={`tab-link ${activeSubCategory === sub ? 'active' : ''}`}
                    onClick={() => setActiveSubCategory(sub)}
                >
                    {sub}
                </button>
            ))}
        </div>

        {/* ГРАФІКИ */}
        <div className="stats-grid-2">
            <div className="chart-card">
                <h5>Розподіл за складністю (шт)</h5>
                <ComplexityTreemap data={filteredCategoryDetails} isDetail={true} />
            </div>
            {/* <div className="chart-card">
                <h5>ТОП позицій</h5>
                <TopProductsChart data={filteredCategoryDetails} metric="value" />
            </div> */}
        </div>

        {/* НОМЕРИ ЗАМОВЛЕНЬ */}
        {/* <div className="mt-24 card-p24 bg-light rounded-12">
            <h5 className="mb-12">📋 Замовлення ({activeSubCategory || selectedCategory})</h5>
            <div className="orders-tag-cloud">
                {Array.from(new Set(filteredCategoryDetails.flatMap(d => d.orders.split(','))))
                    .map((order, idx) => (
                        <span key={idx} className="order-tag">{order.trim()}</span>
                    ))}
            </div>
        </div> */}
    </div>
)}

      {/* 4. ТЕРМІНИ ТА ТРЕНДИ */}
      {/* <div className="stats-grid-2 mb-32 mt-32">
        <div className="chart-wrapper-card">
          <h4 className="chart-title">⏱️ Аналіз затримок (Черга vs Виробництво)</h4>
          <ProductionTimelineChart data={data.charts.speed} />
        </div>
        <div className="chart-wrapper-card">
          <h4 className="chart-title">📈 Продажі та середній чек</h4>
          <MonthlyTrendChart data={data.charts.monthly} />
        </div>
      </div> */}

    </div>
  );
}