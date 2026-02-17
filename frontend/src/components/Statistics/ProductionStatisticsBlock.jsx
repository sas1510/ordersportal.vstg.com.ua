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

// Імпорт нових компонентів ECharts
import FurnitureChart from "../charts/FurnitureChart";
import ProfileColorChart from "../charts/ProfileColorChart";
import ProfileSystemChart from "../charts/ProfileSystemChart";
import ColorSystemHeatmap from "../charts/ColorSystemHeatmap";

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

  // Стани для нових даних з процедури GetDealerSummaryReport
  const [colorData, setColorData] = useState([]);
  const [furnitureData, setFurnitureData] = useState([]);
  const [systemsData, setSystemsData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  
  const [selectedCategory, setSelectedCategory] = useState(null); // Напр. "Додатки"
  const [activeSubCategory, setActiveSubCategory] = useState(null); // Напр. "Лиштва"

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const params = { year: selectedYear };
        if (isAdmin && dealerGuid) params.contractor_guid = dealerGuid;

        const [resFull, resDealer] = await Promise.all([
          axiosInstance.get("/full-statistics/", { params }),
          axiosInstance.get("/order-statistics/", { params })
        ]);

        setData(resFull.data);

        if (resDealer.data) {
          setSystemsData(resDealer.data.profile_system || []);
          setColorData(resDealer.data.profile_color || []);
          setFurnitureData(resDealer.data.hardware?.items || []);

        }
      } catch (err) {
        console.error("Помилка при завантаженні даних:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedYear, dealerGuid, isAdmin]);


  const calculatedHeatmapData = useMemo(() => {
  if (!systemsData.length || !colorData.length) return [];

  const result = [];

  systemsData.forEach(sys => {
    // Перетворюємо рядок номерів "01-123, 01-124" у масив ["01-123", "01-124"]
    const sysOrders = sys.OrdersNumber ? sys.OrdersNumber.split(',').map(n => n.trim()) : [];
    const sysName = sys.ProfileSystem;

    colorData.forEach(col => {
      const colOrders = col.OrdersNumber ? col.OrdersNumber.split(',').map(n => n.trim()) : [];
      const colName = col.ProfileColor;

      // Знаходимо спільні номери замовлень (перетин)
      const intersection = sysOrders.filter(order => colOrders.includes(order));

      if (intersection.length > 0) {
        result.push({
          system: sysName,
          color: colName,
          value: intersection.length
        });
      }
    });
  });

  return result;
}, [systemsData, colorData]);

// Оновлюємо стан heatmapData, коли розрахунок готовий
useEffect(() => {
  setHeatmapData(calculatedHeatmapData);
}, [calculatedHeatmapData]);

  const colorChartData = useMemo(() => {
    return colorData.map(item => ({
      name: item["Колір профілю"],
      value: item["Кількість замовлень"]
    }));
  }, [colorData]);

  useEffect(() => {
    if (selectedCategory && drillDownRef.current) {
      drillDownRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedCategory]);

  // --- ОБРОБКА ДАНИХ ---

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

  // 2. Список підкатегорій (Рівень 2 - Навігація)
  const subCategories = useMemo(() => {
    const details = data?.tables?.tech_details;
    if (!selectedCategory || !Array.isArray(details)) return [];
    
    const subs = details
        .filter(item => {
            const cleanName = item.ConstructionTypeName_UA?.trim() || "";
            return (CATEGORY_MAPPING[cleanName] || "Додатки") === selectedCategory;
        })
        .map(item => item.ConstructionTypeName_UA?.trim())
        .filter(Boolean); 
        
    return [...new Set(subs)].sort();
  }, [selectedCategory, data]);

  // 3. Детальні дані для графіків
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
        .filter(item => item.value > 0) 
        .sort((a, b) => b.value - a.value);
  }, [selectedCategory, activeSubCategory, data]);

  // 4. Метрики часу
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
                <div className="loading-text">Завантаження...</div>
            </div>
        );
    }
  
  if (!data) return <div className="error-msg">Дані не завантажено</div>;
 
  if (!data || data.summary.total_orders === 0) {
      return (
          <div className="no-data-placeholder">
              <h3>Немає даних для відображення</h3>
              <p>За вибраний період ({selectedYear}) активність відсутня.</p>
          </div>
      );
  }

  return (
    <div className="production-stats-container">
      
      {/* 1. ПАНЕЛЬ KPI */}
      <div className="kpi-grid-6">
        <div className="kpi-card shadow-sm badge-order">
          <span className="label">Замовлень</span>
          <span className="value">{data.summary.total_orders} <small>шт</small></span>
        </div>
        <div className="kpi-card shadow-sm badge-order">
          <span className="label">Конструкцій</span>
          <span className="value">{data.summary.total_constructions} <small>шт</small></span>
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
      </div>

      {/* ГРАФІКИ ЕФЕКТИВНОСТІ (Щомісячно) */}
      <div className="stats-grid-2">
        <div className="chart-wrapper-card">
          <EfficiencyChart data={data.charts.monthly} />
        </div>
        <div className="chart-wrapper-card">
          <VolumeChart data={data.charts.monthly} />
        </div>
      </div>

      {/* БЛОК: КОЛЬОРИ ТА СИСТЕМИ (50/50) */}
      <div className="stats-grid-2">
        <div className="chart-wrapper-card card-padding">
          <h4 className="chart-title-unified">Популярність кольорів</h4>
          <ProfileColorChart data={colorData} />
        </div>
        <div className="chart-wrapper-card card-padding">
          <h4 className="chart-title-unified">Профільні системи</h4>
          <ProfileSystemChart data={systemsData} />
        </div>
      </div>

      <div className="chart-wrapper-card card-padding">
        <h4 className="chart-title-unified">Аналіз перетину: Система × Колір</h4>
        <p className="chart-subtitle" style={{ fontSize: '12px', color: '#888', marginBottom: '14px' }}>
            Візуалізація популярності кольорів у розрізі кожної профільної системи
        </p>
        <ColorSystemHeatmap data={heatmapData} />
    </div>

      {/* БЛОК: ФУРНІТУРА (На всю ширину) */}
      <div className="chart-wrapper-card card-padding">
          <h4 className="chart-title-unified">Фурнітура — кількість замовлень</h4>
          <FurnitureChart data={furnitureData} />
      </div>

      {/* ПОРТФЕЛЬ КАТЕГОРІЙ */}
      <div className="stats-single-column">
        <div className="chart-wrapper-card">
          <h4 className="chart-title">Категорії</h4>
          <p className="chart-subtitle">Натисніть на групу для деталізації</p>
          <ComplexityDonut 
            data={mainDonutData} 
            onSectorClick={(name) => {
              setSelectedCategory(name);
              setActiveSubCategory(null);
            }} 
          />
        </div>
      </div>

      {/* DRILL-DOWN (Деталізація) */}
      {selectedCategory && (
        <div className="chart-wrapper-card drilldown-view animate-fade-in" ref={drillDownRef}>
            <div className="drilldown-header-row">
                <h3 className="section-title">
                    Аналіз групи: <span className="color-primary">{selectedCategory}</span>
                    {activeSubCategory && <span className="sub-title-arrow"> → {activeSubCategory}</span>}
                </h3>
                
                <button className="btn-close-details-analytics" onClick={() => {
                    setSelectedCategory(null);
                    setActiveSubCategory(null);
                }}>
                    ✕
                </button>
            </div>

            {activeSubCategory && activeMetrics && (
              <div className="drilldown-metrics-grid mb-24">
                  <div className="d-mini-card highlight">
                      <span className="d-label">Середня тривалість виготовлення: </span>
                      <span className="d-value">{activeMetrics.avgFull} <small>дн.</small></span>
                  </div>
                  <div className="d-mini-card">
                      <span className="d-label">Кількість конструкцій: </span>
                      <span className="d-value">{activeMetrics.totalQty.toLocaleString()} <small>шт</small></span>
                  </div>
              </div>
            )}

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

            <div className="chart-card">
                <h5>Розподіл за складністю (шт)</h5>
                <ComplexityTreemap data={filteredCategoryDetails} isDetail={true} />
            </div>
        </div>
      )}
    </div>
  );
}