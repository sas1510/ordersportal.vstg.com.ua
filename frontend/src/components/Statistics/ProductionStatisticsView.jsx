import React, { useMemo } from "react";
import './ProductionStatisticsView.css';

import ComplexityDonut from "../charts/ComplexityDonut";
import EfficiencyChart from "../charts/EfficiencyChart";
import PrefixCategoryDisplayMobile from "../charts/PrefixCategoryDisplayMobile";

const CATEGORY_MAPPING = {
  "Вікна безшовне зварювання": "Вікна", "Вікно": "Вікна", "Вікно вкл склопакет": "Вікна",
  "Розсувні системи SL76": "Вікна", "Французький балкон": "Вікна",
  "Двері безшовне зварювання": "Двері", "Двері": "Двері", "Міжкімнатні двері": "Двері",
  "Технічні двері ПВХ": "Двері", "Двері Lampre": "Двері",
  "Лиштва": "Додатки", "Москітні сітки": "Додатки", "Підвіконня": "Додатки",
  "Відливи": "Додатки", "Інше": "Додатки"
};

export default function ProductionStatisticsView({ rawData, dealerData }) {
  
  const chartsData = useMemo(() => {
    // 1. Групування категорій для Donut
    const donutGroups = {};
    (rawData?.tables?.tech_details || []).forEach(item => {
      const cat = CATEGORY_MAPPING[item.ConstructionTypeName_UA?.trim()] || "Додатки";
      donutGroups[cat] = (donutGroups[cat] || 0) + parseFloat(item.TotalQuantity || 0);
    });

    // 2. Обробка профільних систем (OrdersCount)
    const systems = [...(dealerData?.profile_system || [])]
      .sort((a, b) => (parseInt(b.OrdersCount) || 0) - (parseInt(a.OrdersCount) || 0))
      .slice(0, 6);

    // 3. Обробка кольорів (OrdersCount)
    const colors = [...(dealerData?.profile_color || [])]
      .sort((a, b) => (parseInt(b.OrdersCount) || 0) - (parseInt(a.OrdersCount) || 0))
      .slice(0, 6);

    // 4. Обробка фурнітури (Quantity)
    const furniture = [...(dealerData?.hardware?.items || [])]
      .sort((a, b) => (parseInt(b.Quantity) || 0) - (parseInt(a.Quantity) || 0))
      .slice(0, 6);

    return {
      kpiOrders: dealerData?.prefixes?.length || 0,
      kpiSum: (rawData?.charts?.monthly?.reduce((a, b) => a + b.sum, 0) || 0),
      donutData: { data: Object.entries(donutGroups).map(([name, value]) => ({ name, value })) },
      efficiency: { data: rawData?.charts?.monthly || [] },
      systems,
      colors,
      furniture,
      // Максимуми для коректної шкали прогрес-барів
      maxSystems: parseInt(systems[0]?.OrdersCount) || 1,
      maxColors: parseInt(colors[0]?.OrdersCount) || 1,
      maxFurniture: parseInt(furniture[0]?.Quantity) || 1
    };
  }, [rawData, dealerData]);

  const renderProgressRow = (label, value, max, color = "#6366f1") => (
    <div className="modern-progress-row" key={label}>
      <div className="m-progress-info">
        <span className="m-name">{label}</span>
        <span className="m-val">{value} <small>од.</small></span>
      </div>
      <div className="m-bar-container">
        <div 
          className="m-bar-fill" 
          style={{ 
            width: `${Math.min((value / max) * 100, 100)}%`, 
            backgroundColor: color 
          }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="modern-dark-view">
      {/* HEADER */}
      <header className="modern-header">
        <div className="brand-zone">
          <div className="pulse-dot"></div>
          <span className="brand-label">PRO ANALYTICS</span>
        </div>
        <button className="export-circle" onClick={() => window.print()}>
          <i className="fa fa-download"></i>
        </button>
      </header>

      <main className="modern-content-feed">
        
        {/* КАТЕГОРІЇ ПРЕФІКСІВ */}
        <div className="feed-section-no-card">
           <h2 className="section-main-title">Статистика по префіксах</h2>
           <PrefixCategoryDisplayMobile prefixData={dealerData?.prefixes || []} />
        </div>

        {/* ДИНАМІКА */}
        <div className="modern-feed-card">
          <h3 className="card-title-iconic"><i className="fa fa-line-chart"></i> Динаміка продажів</h3>
          <div className="chart-container">
            <EfficiencyChart {...chartsData.efficiency} height={200} />
          </div>
        </div>

        {/* СИСТЕМИ */}
        <div className="modern-feed-card">
          <h3 className="card-title-iconic"><i className="fa fa-windows"></i> Профільні системи</h3>
          <div className="m-list-wrapper">
            {chartsData.systems.map((s, idx) => 
              renderProgressRow(
                s.ProfileSystem, 
                parseInt(s.OrdersCount) || 0, 
                chartsData.maxSystems, 
                "#3498db"
              )
            )}
          </div>
        </div>

        {/* КОЛЬОРИ */}
        <div className="modern-feed-card">
          <h3 className="card-title-iconic"><i className="fa fa-paint-brush"></i> Популярні кольори</h3>
          <div className="m-list-wrapper">
            {chartsData.colors.map((c, idx) => 
              renderProgressRow(
                c.ProfileColor, 
                parseInt(c.OrdersCount) || 0, 
                chartsData.maxColors, 
                "#2ecc71"
              )
            )}
          </div>
        </div>

        {/* ФУРНІТУРА */}
        <div className="modern-feed-card">
          <h3 className="card-title-iconic"><i className="fa fa-wrench"></i> Рейтинг фурнітури</h3>
          <div className="m-list-wrapper">
            {chartsData.furniture.map((f, idx) => 
              renderProgressRow(
                f.Name, 
                parseInt(f.Quantity) || 0, 
                chartsData.maxFurniture, 
                "#e67e22"
              )
            )}
          </div>
        </div>

        {/* КАТЕГОРІЇ */}
        <div className="modern-feed-card">
          <h3 className="card-title-iconic"><i className="fa fa-pie-chart"></i> Категорії виробів</h3>
          <div className="chart-container">
            <ComplexityDonut {...chartsData.donutData} height={250} />
          </div>
        </div>

      </main>
    </div>
  );
}