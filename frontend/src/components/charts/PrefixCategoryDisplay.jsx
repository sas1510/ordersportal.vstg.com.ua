import React from 'react';
import './PrefixStatsBlock.css';

const PREFIX_CONFIG = {
    "01": { label: "Стандартні вікна (01)", color: "background-info", order: 1 },
    "02": { label: "Індивідуальні (02)", color: "background-info", order: 2 },
    "15": { label: "Склопакети (15)", color: "background-info", order: 3 },
    "22": { label: "Нестандартні вікна (22)", color: "background-info", order: 4 },
    "55": { label: "Розсувні WDS (55)", color: "background-warning", order: 5 },
    "56": { label: "Розсувні SL76 (56)", color: "background-warning", order: 6 },
    "45": { label: "Двері (45)", color: "background-success", order: 7 }, // Поруч
    "65": { label: "Алюміній Ponzio (65)", color: "background-success", order: 8 }, // Поруч
    "NL": { label: "НЕЛІКВІД", color: "background-danger-light-an", order: 9 },
    "ZZ": { label: "РАЗОМ (ВСІ КАТЕГОРІЇ)", color: "background-danger", order: 10 }
};

const PrefixCategoryDisplay = ({ prefixData }) => {
    if (!prefixData || prefixData.length === 0) return null;

    // Сортуємо дані перед рендерингом
    const sortedData = [...prefixData].sort((a, b) => {
        const orderA = PREFIX_CONFIG[a.Prefix?.trim()]?.order || 99;
        const orderB = PREFIX_CONFIG[b.Prefix?.trim()]?.order || 99;
        return orderA - orderB;
    });

    return (
        <div className="prefix-stats-grid-wrapper">
            {sortedData.map((item, index) => {
                const cleanPrefix = item.Prefix ? item.Prefix.trim() : "";
                const isTotal = cleanPrefix === "ZZ";
                
                const config = PREFIX_CONFIG[cleanPrefix] || { 
                    label: item.SectionName || `Категорія ${cleanPrefix}`, 
                    color: "background-danger" 
                };

                return (
                    <div key={cleanPrefix} className={`prefix-card-unit background-white shadow-sm ${isTotal ? 'border-highlight' : ''}`}>
                        {/* 1. Заголовок */}
                        <div className={`prefix-card-header ${config.color} text-white text-bold uppercase text-center`}>
                            {config.label}
                        </div>

                        <div className="prefix-card-body">
                            {/* 2. ВЕРХНІЙ РЯД (Великі показники) */}
                            <div className="p-stats-row-main border-bottom-dashed">
                                <div className="p-stat-item-large border-right-dashed">
                                    <div className="p-value text-success font-size-32 text-bold">
                                        {item.TotalOrders || 0}
                                    </div>
                                    <div className="p-label text-grey font-size-12 uppercase">Замовлень</div>
                                </div>

                                <div className="p-stat-item-large">
                                    <div className="p-value text-success font-size-32 text-bold">
                                        {item.TotalConstructions || 0}
                                    </div>
                                    <div className="p-label text-grey font-size-12 uppercase">Конструкцій</div>
                                </div>
                            </div>

                            {/* 3. НИЖНІЙ РЯД (Другорядні показники) */}
                            <div className="p-stats-row-secondary">
                                <div className="p-stat-item border-right-dashed">
                                    <div className="p-value text-info font-size-26 text-bold">
                                        {Math.round(item.TotalRevenue || 0).toLocaleString()}
                                    </div>
                                    <div className="p-label text-grey font-size-12 uppercase">Сума (грн)</div>
                                </div>

                                <div className="p-stat-item border-right-dashed">
                                    <div className="p-value text-info font-size-26 text-bold">
                                        {item.AvgPricePerConstruction ? Math.round(item.AvgPricePerConstruction).toLocaleString() : 0}
                                    </div>
                                    <div className="p-label text-grey font-size-12 uppercase">Сер. ціна/шт</div>
                                </div>

                                <div className="p-stat-item">
                                    <div className="p-value text-info font-size-26 text-bold">
                                        {item.AvgCheck ? Math.round(item.AvgCheck).toLocaleString() : 0}
                                    </div>
                                    <div className="p-label text-grey font-size-12 uppercase">Сер. чек</div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Футер (Рекламації) */}
                        <div className="prefix-card-footer border-top-dashed text-center p-1">
                            <small className="text-grey uppercase font-size-10">Рекламації по констр.: </small>
                            <span className={`text-bold font-size-11 ${item.ClaimsPercentage > 5 ? 'text-danger' : 'text-warning'}`}>
                                {item.TotalClaims || 0} шт. ({item.ClaimsPercentage ? Number(item.ClaimsPercentage).toFixed(2) : "0.00"}%)
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PrefixCategoryDisplay;