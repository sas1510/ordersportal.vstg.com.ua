import React from 'react';
import './PrefixStatsBlock.css';

const PREFIX_CONFIG = {
    "01": { label: "Стандартні вікна (01)", color: "background-success" },
    "02": { label: "Індивідуальні (02)", color: "background-success" },
    "15": { label: "Склопакети (15)", color: "background-success" },
    "22": { label: "Нестандартні вікна (22)", color: "background-danger" },
    "45": { label: "Двері (45)", color: "background-info" },
    "55": { label: "Розсувні WDS (55)", color: "background-success" },
    "56": { label: "Розсувні SL76 (56)", color: "background-success" },
    "65": { label: "Алюміній Ponzio (65)", color: "background-warning" },
    "ZZ": { label: "РАЗОМ (ВСІ КАТЕГОРІЇ)", color: "background-info" } // Конфігурація для підсумку
};

const PrefixCategoryDisplay = ({ prefixData }) => {
    if (!prefixData || prefixData.length === 0) return null;

    return (
        <div className="prefix-stats-grid-wrapper">
            {prefixData.map((item, index) => {
                const cleanPrefix = item.Prefix ? item.Prefix.trim() : "";
                const isTotal = cleanPrefix === "ZZ";
                
                const config = PREFIX_CONFIG[cleanPrefix] || { 
                    label: item.SectionName || `Категорія ${cleanPrefix}`, 
                    color: "background-info" 
                };

                return (
                    <div 
                        key={index} 
                        className={`prefix-card-unit background-white shadow-sm ${isTotal ? 'border-highlight' : ''}`}
                    >
                        {/* Заголовок картки */}
                        <div className={`prefix-card-header ${config.color} text-white text-bold uppercase text-center`}>
                            {config.label}
                        </div>

                        <div className="prefix-card-body">
                            {/* Замовлення */}
                            <div className="p-stat-item border-right">
                                <div className="p-value text-dark font-size-28">
                                    {item.TotalOrders || 0}
                                </div>
                                <div className="p-label text-grey font-size-10 uppercase">Замовлень</div>
                            </div>

                            {/* Конструкції */}
                            <div className="p-stat-item border-right">
                                <div className="p-value text-success font-size-28 text-bold">
                                    {item.TotalConstructions || 0}
                                </div>
                                <div className="p-label text-grey font-size-10 uppercase">Виробів</div>
                            </div>

                            {/* Оборот */}
                            <div className="p-stat-item border-right">
                                <div className="p-value text-info font-size-22 text-bold">
                                    {Math.round(item.TotalRevenue || 0).toLocaleString()}
                                </div>
                                <div className="p-label text-grey font-size-10 uppercase">Сума (грн)</div>
                            </div>

                            {/* Нове: Вартість 1 виробу */}
                            <div className="p-stat-item border-right">
                                <div className="p-value text-dark font-size-18 text-bold">
                                    {item.AvgPricePerConstruction ? Math.round(item.AvgPricePerConstruction).toLocaleString() : 0}
                                </div>
                                <div className="p-label text-grey font-size-10 uppercase">Сер. ціна/шт</div>
                            </div>

                            {/* Нове: Рекламації */}
                            <div className="p-stat-item">
                                <div className={`p-value font-size-20 text-bold ${item.ClaimsPercentage > 2 ? 'text-danger' : 'text-warning'}`}>
                                    {item.ClaimsPercentage ? Number(item.ClaimsPercentage).toFixed(2) : "0.00"}%
                                </div>
                                <div className="p-label text-grey font-size-10 uppercase">Реклам.</div>
                            </div>
                        </div>

                        {/* Додаткова інфо-панель знизу (опціонально для сер. чека) */}
                        <div className="prefix-card-footer border-top text-center p-1">
                             <small className="text-grey uppercase font-size-10">Середній чек: </small>
                             <small className="text-bold text-dark font-size-11">
                                {item.AvgCheck ? Math.round(item.AvgCheck).toLocaleString() : 0} грн
                             </small>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PrefixCategoryDisplay;