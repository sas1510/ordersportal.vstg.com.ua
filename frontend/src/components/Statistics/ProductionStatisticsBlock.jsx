import React, { useEffect, useState, useMemo, useRef } from "react";
import axiosInstance from "../../api/axios";

// Імпорт графіків
import ComplexityDonut from "../charts/ComplexityDonut";
import ComplexityTreemap from "../charts/ComplexityTreeMap";
import EfficiencyChart from '../charts/EfficiencyChart';
import VolumeChart from '../charts/VolumeChart';
import PrefixCategoryDisplay from "../charts/PrefixCategoryDisplay";
import FurnitureChart from "../charts/FurnitureChart";
import ProfileColorChart from "../charts/ProfileColorChart";
import ProfileSystemChart from "../charts/ProfileSystemChart";
import ColorSystemHeatmap from "../charts/ColorSystemHeatmap";

import './ProductionStatisticsBlock.css';

// Мапінг для групування
const CATEGORY_MAPPING = {
  "Вікна безшовне зварювання": "Вікна", "Вікно": "Вікна", "Вікно вкл склопакет": "Вікна",
  "Розсувні системи SL76": "Вікна", "Французький балкон": "Вікна",
  "Двері безшовне зварювання": "Двері", "Двері": "Двері", "Міжкімнатні двері": "Двері",
  "Технічні двері ПВХ": "Двері", "Двері Lampre": "Двері",
  "Лиштва": "Додатки", "Москітні сітки": "Додатки", "Підвіконня": "Додатки",
  "Відливи": "Додатки", "Інше": "Додатки"
};

export default function ProductionStatisticsBlock({ rawData, dealerData, dateRange }) {
  const drillDownRef = useRef(null);
  
  // Використовуємо дані з пропсів, якщо вони є, або внутрішній стан
  const [internalData, setInternalData] = useState(null);
  const [loading, setLoading] = useState(!rawData);

  const data = rawData || internalData;
  const systemsData = dealerData?.profile_system || [];
  const colorData = dealerData?.profile_color || [];
  const furnitureData = dealerData?.hardware?.items || [];
  const prefixData = dealerData?.prefixes || [];

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeSubCategory, setActiveSubCategory] = useState(null);

  // Завантаження, якщо дані не передані зверху
  useEffect(() => {
    if (!rawData) {
      const loadData = async () => {
        setLoading(true);
        try {
          const params = { date_from: dateRange.from, date_to: dateRange.to };
          const res = await axiosInstance.get("/full-statistics/", { params });
          setInternalData(res.data);
        } catch (err) {
          console.error("Fetch error:", err);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [dateRange, rawData]);

  // Розрахунок матриці Колір х Система
  const heatmapData = useMemo(() => {
    if (!systemsData.length || !colorData.length) return [];
    const result = [];
    systemsData.forEach(sys => {
      const sysOrders = sys.OrdersNumber ? sys.OrdersNumber.split(',').map(n => n.trim()) : [];
      colorData.forEach(col => {
        const colOrders = col.OrdersNumber ? col.OrdersNumber.split(',').map(n => n.trim()) : [];
        const intersection = sysOrders.filter(order => colOrders.includes(order));
        if (intersection.length > 0) {
          result.push({ system: sys.ProfileSystem, color: col.ProfileColor, value: intersection.length });
        }
      });
    });
    return result;
  }, [systemsData, colorData]);

  // Прокрутка до деталей
  useEffect(() => {
    if (selectedCategory && drillDownRef.current) {
      drillDownRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedCategory]);

  // Рівень 1: Дані для Donut Chart
  const mainDonutData = useMemo(() => {
    const details = data?.tables?.tech_details;
    if (!Array.isArray(details)) return [];
    const groups = {};
    details.forEach(item => {
      const groupName = CATEGORY_MAPPING[item.ConstructionTypeName_UA?.trim()] || "Додатки";
      groups[groupName] = (groups[groupName] || 0) + parseFloat(item.TotalQuantity || 0);
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [data]);

  // Рівень 2: Навігація по підкатегоріях
  const subCategories = useMemo(() => {
    const details = data?.tables?.tech_details;
    if (!selectedCategory || !Array.isArray(details)) return [];
    const subs = details
        .filter(item => (CATEGORY_MAPPING[item.ConstructionTypeName_UA?.trim()] || "Додатки") === selectedCategory)
        .map(item => item.ConstructionTypeName_UA?.trim())
        .filter(Boolean); 
    return [...new Set(subs)].sort();
  }, [selectedCategory, data]);

  // Рівень 3: Дані для Treemap
  const filteredTreemapData = useMemo(() => {
    const details = data?.tables?.tech_details;
    if (!selectedCategory || !Array.isArray(details)) return [];
    return details
        .filter(item => {
            const cleanName = item.ConstructionTypeName_UA?.trim() || "";
            const parentGroup = CATEGORY_MAPPING[cleanName] || "Додатки";
            return parentGroup === selectedCategory && (!activeSubCategory || cleanName === activeSubCategory);
        })
        .map(item => ({
            name: `${item.ConstructionTypeName_UA?.trim()} (${item.Складність_UA?.trim() || "Стандарт"})`,
            value: parseFloat(item.TotalQuantity || 0)
        }))
        .filter(item => item.value > 0);
  }, [selectedCategory, activeSubCategory, data]);

  if (loading) return (
    <div className="loading-spinner-wrapper">
      <div className="loading-spinner"></div>
      <div className="loading-text">Аналізуємо дані...</div>
    </div>
  );

  if (!data || !data.tables?.tech_details?.length) return (
    <div className="no-data-placeholder">
      <i className="fa fa-area-chart"></i>
      <h3>Немає активності за цей період</h3>
      <p>{dateRange.from} — {dateRange.to}</p>
    </div>
  );

  return (
    <div className="production-stats-container">
      
      {/* KPI & ПРЕФІКСИ */}
      <div className="m-bottom-28">
          <PrefixCategoryDisplay prefixData={prefixData} />
      </div>

      {/* ЕФЕКТИВНІСТЬ ТА ОБСЯГИ */}
      <div className="stats-grid-2">
        <div className="chart-wrapper-card card-padding">
          <h4 className="chart-title-unified">Динаміка ефективності</h4>
          <EfficiencyChart data={data.charts?.monthly || []} />
        </div>
        <div className="chart-wrapper-card card-padding">
          <h4 className="chart-title-unified">Обсяги виробництва</h4>
          <VolumeChart data={data.charts?.monthly || []} />
        </div>
      </div>

      {/* КОЛЬОРИ ТА СИСТЕМИ */}
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

      {/* ТЕПЛОВА КАРТА */}
      <div className="chart-wrapper-card card-padding m-bottom-28">
        <h4 className="chart-title-unified">Матриця Система × Колір</h4>
        <p className="chart-subtitle-grey">Кількість замовлень на перетині параметрів</p>
        <ColorSystemHeatmap data={heatmapData} />
      </div>

      {/* ФУРНІТУРА */}
      <div className="chart-wrapper-card card-padding m-bottom-28">
          <h4 className="chart-title-unified">Аналітика фурнітури</h4>
          <FurnitureChart data={furnitureData} />
      </div>

      {/* КАТЕГОРІЇ (ОСНОВНИЙ ПОРТФЕЛЬ) */}
      <div className="stats-single-column">
        <div className="chart-wrapper-card card-padding">
          <h4 className="chart-title-unified">Портфель категорій</h4>
          <p className="chart-subtitle-grey">Натисніть на сектор для детального аналізу конструкцій</p>
          <ComplexityDonut 
            data={mainDonutData} 
            onSectorClick={(name) => {
              setSelectedCategory(name);
              setActiveSubCategory(null);
            }} 
          />
        </div>
      </div>

      {/* DRILL-DOWN (ДЕТАЛІЗАЦІЯ) */}
      {selectedCategory && (
        <div className="chart-wrapper-card drilldown-view animate-fade-in" ref={drillDownRef}>
            <div className="drilldown-header-row">
                <h3 className="section-title">
                    Деталізація: <span className="text-highlight">{selectedCategory}</span>
                    {activeSubCategory && <span className="sub-title-arrow"> → {activeSubCategory}</span>}
                </h3>
                <button className="btn-close-details" onClick={() => { setSelectedCategory(null); setActiveSubCategory(null); }}>✕</button>
            </div>

            <div className="sub-nav-tabs">
                <button className={`tab-link ${!activeSubCategory ? 'active' : ''}`} onClick={() => setActiveSubCategory(null)}>Всі типи</button>
                {subCategories.map(sub => (
                    <button key={sub} className={`tab-link ${activeSubCategory === sub ? 'active' : ''}`} onClick={() => setActiveSubCategory(sub)}>{sub}</button>
                ))}
            </div>

            <div className="detail-chart-container">
                <h5 className="detail-chart-title">Розподіл за складністю виготовлення (шт)</h5>
                <ComplexityTreemap 
                  data={filteredTreemapData} 
                  isDetail={true} 
                  activeGroup={selectedCategory}
                />
            </div>
        </div>
      )}

  
    </div>
  );
}