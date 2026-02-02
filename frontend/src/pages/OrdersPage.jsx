import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axiosInstance from '../api/axios';
import { CalculationItem } from '../components/Orders/OrderComponents';
import { CalculationItemMobile } from '../components/Orders/CalculationItemMobile';
import '../components/Portal/PortalOriginal.css';

import NewCalculationModal from '../components/Orders/NewCalculationModal';

import useWindowWidth from '../hooks/useWindowWidth';
import { useTheme } from '../context/ThemeContext';
import useCancelAllRequests from "../hooks/useCancelAllRequests";
// import { useDealerContext } from "../hooks/useDealerContext";

const ITEMS_PER_LOAD = 100;

const PortalOriginal = () => {
    const { register, cancelAll } = useCancelAllRequests();

    // const {
    //     currentUser,
    // } = useDealerContext();
    const [error, setError] = useState(null); 

    const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
    const [calculationsData, setCalculationsData] = useState([]);
    const [filter, setFilter] = useState({ status: 'Всі', month: 0, name: '' });

    const currentYear = new Date().getFullYear().toString();
    const [selectedYear, setSelectedYear] = useState(currentYear);

    const [loading, setLoading] = useState(false);
    const [expandedCalc, setExpandedCalc] = useState(null);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [limit, setLimit] = useState(ITEMS_PER_LOAD);
    const [hasMore, setHasMore] = useState(false);

    const windowWidth = useWindowWidth();
    const isMobile = windowWidth < 1024;
    const { theme } = useTheme();
    const [reloading, setReloading] = useState(false);


    // --- Cancel all requests on unmount ---
    useEffect(() => {
        return () => cancelAll();
    }, []);

    const handleFilterChange = useCallback((key, value) => {
        setFilter(prev => ({ ...prev, [key]: value }));
        setLimit(ITEMS_PER_LOAD);
    }, []);

    const handleDeleteCalculation = useCallback((calcId) => {
        setCalculationsData(prev => prev.filter(calc => calc.id !== calcId));
        setLimit(ITEMS_PER_LOAD);
    }, []);

    const handleUpdateCalculation = useCallback((updatedCalc) => {
        setCalculationsData(prev =>
            prev.map(calc => calc.id === updatedCalc.id ? updatedCalc : calc)
        );
    }, []);

    const handleCloseCalc = useCallback(() => setIsCalcModalOpen(false), []);

    const reloadCalculations = useCallback(async () => {
        cancelAll();
        const controller = register();
        setReloading(true);
        setError(null); // Очищуємо попередню помилку

        try {
            const response = await axiosInstance.get("/order/get_orders_info/", {
                params: { year: selectedYear },
                signal: controller.signal,
            });

            if (response.data?.status === "success") {
                const allCalculations = response.data.data.calculation || [];
                setCalculationsData(allCalculations);
                setLimit(ITEMS_PER_LOAD);
                setHasMore(allCalculations.length > ITEMS_PER_LOAD);
            } else {
                setError("Сервер повернув помилку при оновленні даних.");
            }
        } catch (err) {
            if (err.name !== "CanceledError") {
                setError("Не вдалося оновити дані. Перевірте з'єднання.");
                console.error("Помилка оновлення:", err);
            }
        } finally {
            setReloading(false);
        }
    }, [cancelAll, register, selectedYear]);

    const handleSaveCalculation = useCallback(async () => {
        setIsCalcModalOpen(false);
        await reloadCalculations();
    }, [reloadCalculations]);

    const toggleCalc = useCallback(
        (id) => setExpandedCalc(prev => prev === id ? null : id),
        []
    );

    const toggleOrder = useCallback(
        (id) => setExpandedOrder(prev => prev === id ? null : id),
        []
    );

    const handleLoadMore = useCallback(() => {
        if (hasMore) setLimit(prev => prev + ITEMS_PER_LOAD);
    }, [hasMore]);

    // --- Filtering ---
    const statusSummary = useMemo(() => {
        const summary = {
            'Всі': 0, 'Новий': 0, 'В обробці': 0,
            'Очікуємо оплату': 0, 'Очікуємо підтвердження': 0,
            'Підтверджений': 0, 'У виробництві': 0,
            'Готовий': 0, 'Відвантажений': 0, 'Відмова': 0
        };

        calculationsData.forEach(calc => {
            summary['Всі'] += calc.orders.length || 1;
            if (calc.orders.length === 0) summary['Новий'] += 1;
            calc.orders.forEach(order => {
                if (summary[order.status] !== undefined) {
                    summary[order.status] += 1;
                }
            });
        });

        return summary;
    }, [calculationsData]);

    const monthSummary = useMemo(() => {
        const summary = {};
        for (let i = 1; i <= 12; i++) summary[i] = 0;

        calculationsData.forEach(calc => {
            if (!calc.dateRaw) return;
            const d = new Date(calc.dateRaw);
            if (!isNaN(d)) summary[d.getMonth() + 1]++;
        });

        return summary;
    }, [calculationsData]);

    const getFilteredItems = useCallback((status, month, name) => {
        let items = [...calculationsData];

        if (status !== 'Всі') {
            items = items.filter(calc =>
                calc.orders.length === 0
                    ? status === 'Новий'
                    : calc.orders.some(o => o.status === status)
            );
        }

        if (month !== 0) {
            items = items.filter(calc => {
                const d = new Date(calc.dateRaw);
                return !isNaN(d) && d.getMonth() + 1 === month;
            });
        }

        if (name) {
            const q = name.toLowerCase();
            items = items.filter(calc =>
                calc.number.toLowerCase().includes(q) ||
                calc.orders.some(o => o.number?.toLowerCase().includes(q))
            );
        }

        return items;
    }, [calculationsData]);

    const fullFiltered = useMemo(() => {
        return getFilteredItems(filter.status, filter.month, filter.name)
            .sort((a, b) => new Date(b.dateRaw) - new Date(a.dateRaw));
    }, [filter, getFilteredItems]);
    const totalFilteredCount = fullFiltered.length;
    const remainingCount = totalFilteredCount - limit;
    const loadAmount = Math.min(ITEMS_PER_LOAD, remainingCount);

    const buttonText = loadAmount < ITEMS_PER_LOAD
        ? `Завантажити ще (${loadAmount})`
        : `Завантажити ще (100 із ${remainingCount})`;

    const paginatedItems = useMemo(() => {
        const slice = fullFiltered.slice(0, limit);
        setHasMore(fullFiltered.length > limit);
        return slice;
    }, [fullFiltered, limit]);

    // --- MAIN LOAD ---
    useEffect(() => {
        cancelAll();
        const controller = register();
        setError(null);

        const load = async () => {
            setLoading(true);
            try {
                const response = await axiosInstance.get(
                    "/order/get_orders_info/",
                    {
                        params: { year: selectedYear },
                        signal: controller.signal,
                    }
                );

                if (response.data?.status === "success") {
                    const all = response.data.data.calculation || [];
                    setCalculationsData(all);
                    setLimit(ITEMS_PER_LOAD);
                    setHasMore(all.length > ITEMS_PER_LOAD);
                } else {
                    setCalculationsData([]);
                }
            } catch (err) {
                if (err.name !== "CanceledError") {
                    setError("Не вдалося оновити дані. Перевірте з'єднання. ");
                    console.error("Помилка оновлення:", err);
                }
                setCalculationsData([]);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [selectedYear]);

    if (loading || reloading) {
        return (
            <div className="loading-spinner-wrapper">
                <div className="loading-spinner"></div>
                <div className="loading-text">
                    {reloading ? "Оновлення даних..." : "Завантаження..."}
                </div>
            </div>
        );
    }
return (
        <div className="column portal-body">

           

            <div className="content-summary row w-100">
                <div 
                    className="mobile-sidebar-toggle" 
                    onClick={() => setIsSidebarOpen(true)} 
                    style={{marginTop: '10px'}}
                >
                    <span className="icon icon-menu font-size-24"></span>
                </div>
            
                <div className="year-selector row">
                    <span>Звітний рік:</span>
                    <span className="icon icon-calendar2 font-size-24 text-info"></span>
                    <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                    </select>

                </div>

                <div className="by-month-pagination-wrapper">
                    {/* Month List */}
                    <ul className="gap-6 row no-wrap month-list">
                        <li className={`pagination-item ${filter.month === 0 ? 'active' : ''}`} onClick={() => handleFilterChange('month', 0)}>
                            Весь рік
                        </li>
                        {Array.from({ length: 12 }, (_, i) => {
                            const num = i + 1;
                            const labels = ['Січ.', 'Лют.', 'Бер.', 'Квіт.', 'Трав.', 'Черв.', 'Лип.', 'Сер.', 'Вер.', 'Жов.', 'Лис.', 'Груд.'];
                            return (
                                <li
                                    key={num}
                                    className={`pagination-item ${filter.month === num ? 'active' : ''} ${monthSummary[num] === 0 ? 'disabled' : ''}`}
                                    onClick={() => monthSummary[num] > 0 && handleFilterChange('month', num)}
                                >
                                    {labels[i]} <span className="text-grey">({monthSummary[num]})</span>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Month Select (Mobile) */}
                    <select
                        className="month-select"
                        value={filter.month}
                        onChange={(e) => handleFilterChange('month', Number(e.target.value))}
                    >
                        <option value={0}>Весь рік</option>
                        {Array.from({ length: 12 }, (_, i) => {
                            const num = i + 1;
                            const labels = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
                            return (
                                <option key={num} value={num} disabled={monthSummary[num] === 0}>
                                    {labels[i]} ({monthSummary[num]})
                                </option>
                            );
                        })}
                    </select>
                </div>
            </div>

            <div className="content-wrapper row w-100 h-100">
                <div className={`content-filter column ${isSidebarOpen ? 'open' : 'closed'}`}>
                    <div className="sidebar-header row ai-center jc-space-between">
                        {isSidebarOpen && <span>Фільтри</span>}
                        {isSidebarOpen && (
                            <span className="icon icon-cross" onClick={() => setIsSidebarOpen(false)}></span>
                        )}
                    </div>

                    <div className="search-wrapper">
                        <input
                            type="text"
                            className="search-orders"
                            placeholder="номер прорахунку, замовлення"
                            value={filter.name}
                            onChange={(e) => handleFilterChange('name', e.target.value)}
                        />
                        <span className="icon icon-cancel2 clear-search" title="Очистити пошук" onClick={() => handleFilterChange('name', '')}></span>
                    </div>

                    {/* {localStorage.getItem('role') !== 'customer' && (
                        <div>
                            <div className="delimiter1"/>
                            <ul className="buttons">
                                <li className="btn btn-select-dealer" onClick={() => setShowDealerModal(true)}>
                                    <span className="icon icon-user-check"></span>
                                    <span className="uppercase">Вибрати дилера</span>
                                </li>
                            </ul>
                        </div>
                    )} */}
                    <div>



    
                    </div>


                    <div className="delimiter1"></div> 
                    <ul className="buttons">
                        <li className="btn btn-add-calc" onClick={() => setIsCalcModalOpen(true)}>
                            <span className="icon icon-plus3"></span>
                            <span className="uppercase">Новий прорахунок</span>
                        </li>
                    </ul>


                    <ul className="filter column align-center">
                        <li className="delimiter1"></li>
                        {[
                            { id: "all", label: "Всі прорахунки", icon: "icon-calculator", statusKey: "Всі" },
                            { id: "new", label: "Нові прорахунки", icon: "icon-bolt", statusKey: "Новий" },
                            { id: "processing", label: "В обробці", icon: "icon-spin-alt", statusKey: "В обробці" },
                            { id: "waiting-payment", label: "Очікують оплату", icon: "icon-coin-dollar", statusKey: "Очікуємо оплату" },
                            { id: "waiting-confirm", label: "Очікують підтвердження", icon: "icon-clipboard", statusKey: "Очікуємо підтвердження" },
                            { id: "confirmed", label: "Підтверджені", icon: "icon-check", statusKey: "Підтверджений" },
                            { id: "production", label: "У виробництві", icon: "icon-cogs", statusKey: "У виробництві" },
                            { id: "ready", label: "Готові замовлення", icon: "icon-layers2", statusKey: "Готовий" },
                            { id: "delivered", label: "Відвантажені", icon: "icon-shipping", statusKey: "Відвантажений" },
                            { id: "rejected", label: "Відмова", icon: "icon-circle-with-cross", statusKey: "Відмова" }
                        ].map(({ id, label, icon, statusKey }) => (
                            <li
                                key={id}
                                className={`filter-item ${filter.status === statusKey ? 'active' : ''}`}
                                onClick={() => handleFilterChange('status', statusKey)}
                            >
                                <span className={`icon ${icon} font-size-24`}></span>
                                <span className="w-100">{label}</span>
                                <span className={statusSummary[statusKey] === 0 ? 'disabled' : ''}>
                                    {statusSummary[statusKey]}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="content" id="content">
                    <div className="items-wrapper column gap-14" id="items-wrapper">
                        {error ? (
        /* 1. Стан ПОМИЛКИ: показуємо тільки великий блок помилки */
        <div className="error-empty-state column align-center jc-center">
            <span className="icon icon-warning text-red font-size-48 mb-16"></span>
            <h3 className="font-size-20 weight-600 mb-8">Упс! Не вдалося завантажити дані</h3>
            <p className="text-grey mb-24 text-center">
                Виникла проблема під час з'єднання із сервером. <br/>
                Перевірте інтернет та спробуйте ще раз.
            </p>
            <button 
                className="btn btn-primary btn-load-more-big" 
                onClick={reloadCalculations}
            >
                <span className="icon icon-loop2 mr-10"></span>
                Спробувати знову
            </button>
        </div>
    ) : totalFilteredCount === 0 ? (
        /* 2. Стан ПУСТО: запит успішний, але даних немає */
        <div className="no-data column align-center h-100">
            <div className="font-size-24 text-grey">Немає прорахунків для відображення</div>
        </div>
    ) : (
                            paginatedItems.map((calc) =>
                                isMobile ? (
                                    <CalculationItemMobile 
                                        key={calc.id}
                                        calc={calc}
                                        isExpanded={expandedCalc === calc.id}
                                        onToggle={toggleCalc}
                                        expandedOrderId={expandedOrder}
                                        onOrderToggle={toggleOrder}
                                        onDelete={handleDeleteCalculation}
                                        onEdit={handleUpdateCalculation}
                                    />
                                ) : (
                                    <CalculationItem 
                                        key={calc.id}
                                        calc={calc}
                                        isExpanded={expandedCalc === calc.id}
                                        onToggle={toggleCalc}
                                        expandedOrderId={expandedOrder}
                                        onOrderToggle={toggleOrder}
                                        onDelete={handleDeleteCalculation}
                                        onEdit={handleUpdateCalculation}
                                    />
                                )
                            )
                        )}
                        
                        {/* КНОПКА "ЗАВАНТАЖИТИ ЩЕ" та лічильник */}
                        {hasMore && (
                            <div className="row w-100" style={{ marginTop: '20px', marginBottom: '20px', justifyContent: 'center'}}>
                                <button 
                                    className="btn btn-primary uppercase btn-load-more-big" 
                                    onClick={handleLoadMore}
                                    style={{
                                        padding: '12px 24px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        minWidth: '200px',
                                        backgroundColor: '#5e83bf', 
                                        color: '#FFFFFF',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                        justifySelf: 'center',
                                    }}
                                >
                                    <span className="icon icon-loop2" style={{ marginRight: '10px' }}></span> 
                                    {buttonText}
                                </button>
                            </div>
                        )}
                        
                        {/* Повідомлення, якщо всі дані завантажено */}
                        {!hasMore && totalFilteredCount > ITEMS_PER_LOAD && (
                             <div className="row justify-content-center text-grey" style={{ marginTop: '20px', marginBottom: '20px' }}>
                                Всі прорахунки завантажено ({totalFilteredCount}).
                            </div>
                        )}
                    </div>
                </div>
            </div>    

            {/* ✅ NewCalculationModal тепер використовує handleCloseCalc для коректного закриття */}
            <NewCalculationModal 
                isOpen={isCalcModalOpen} 
                onClose={handleCloseCalc} // ЗМІНЕНО
                onSave={handleSaveCalculation} 
            />
        </div>
    );
};

export default PortalOriginal;




