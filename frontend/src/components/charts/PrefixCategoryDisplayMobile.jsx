import React from "react";
import "./PrefixCategoryDisplayMobile.css";

const PREFIX_CONFIG = {
  "01": { label: "Стандартні вікна (01)", color: "blue-zone", order: 1 },
  "02": { label: "Індивідуальні (02)", color: "blue-zone", order: 2 },
  15: { label: "Склопакети (15)", color: "indigo-zone", order: 3 },
  22: { label: "Нестандартні вікна (22)", color: "blue-zone", order: 4 },
  55: { label: "Розсувні WDS (55)", color: "orange-zone", order: 5 },
  56: { label: "Розсувні SL76 (56)", color: "orange-zone", order: 6 },
  45: { label: "Двері (45)", color: "green-zone", order: 7 },
  65: { label: "Алюміній Ponzio (65)", color: "green-zone", order: 8 },
  NL: { label: "НЕЛІКВІД", color: "grey-zone", order: 9 },
  ZZ: { label: "РАЗОМ (ВСІ КАТЕГОРІЇ)", color: "red-zone", order: 10 },
};

const PrefixCategoryDisplayMobile = ({ prefixData }) => {
  if (!prefixData || prefixData.length === 0) return null;

  const sortedData = [...prefixData].sort((a, b) => {
    const orderA = PREFIX_CONFIG[a.Prefix?.trim()]?.order || 99;
    const orderB = PREFIX_CONFIG[b.Prefix?.trim()]?.order || 99;
    return orderA - orderB;
  });

  return (
    <div className="modern-mobile-stats">
      {sortedData.map((item) => {
        const prefix = item.Prefix?.trim() || "";
        const isTotal = prefix === "ZZ";
        const config = PREFIX_CONFIG[prefix] || {
          label: item.SectionName || `Категорія ${prefix}`,
          color: "grey-zone",
        };

        return (
          <div
            key={prefix}
            className={`modern-stat-card ${isTotal ? "is-total" : ""}`}
          >
            <div className="card-top-info">
              <span className="card-prefix-label">
                <i className="fa fa-th-large"></i> {config.label}
              </span>
            </div>

            {/* 1. Кількість */}
            <div className="stat-grid-row">
              <div className={`stat-box ${"blue-zone"}`}>
                <i className="fa fa-shopping-cart"></i>
                <span className="val">{item.TotalOrders || 0}</span>
                <span className="lbl">Замовлень</span>
              </div>
              <div className="stat-box indigo-zone">
                <i className="fa fa-window-maximize"></i>
                <span className="val">{item.TotalConstructions || 0}</span>
                <span className="lbl">Конструкцій</span>
              </div>
            </div>

            {/* 2. Фінанси */}
            <div className="stat-grid-row">
              <div className="stat-box green-zone">
                <i className="fa fa-money"></i>
                <span className="val">
                  {Math.round(
                    item.AvgPricePerConstruction || 0,
                  ).toLocaleString()}
                </span>
                <span className="lbl">Сер. ціна конструкції</span>
              </div>
              <div className="stat-box red-zone">
                <i className="fa fa-calculator"></i>
                <span className="val">
                  {Math.round(item.AvgCheck || 0).toLocaleString()}
                </span>
                <span className="lbl">Сер. чек</span>
              </div>
            </div>

            {/* 3. НОВИЙ БЛОК: Середня ціна конструкції */}
            <div className="stat-box-full yellow-zone">
              <div className="full-info">
                <span className="lbl">Оборот (грн) </span>
                <span className="val-large">
                  ₴ {Math.round(item.TotalRevenue || 0).toLocaleString()}
                </span>
              </div>
              <i className="fa fa-tag"></i>
            </div>

            {/* 4. Рекламації */}
            <div className="comment-zone">
              <div className="comment-header">
                <span>
                  <i className="fa fa-exclamation-triangle"></i> Рекламації по
                  конструкціях:
                </span>
                <span className={item.TotalClaims > 0 ? "text-warn" : ""}>
                  {item.TotalClaims || 0} шт. (
                  {Number(item.ClaimsPercentage || 0).toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PrefixCategoryDisplayMobile;
