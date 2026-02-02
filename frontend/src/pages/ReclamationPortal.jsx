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
import useWindowWidth from '../hooks/useWindowWidth';
import { useTheme } from '../context/ThemeContext';
import '../components/Reclamations/ReclamationItem.css';

const RECLAMATIONS_API_URL = '/complaints/get_reclamation_info/';
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
            hasUnreadMessages: item.HasUnreadMessages,
            guid : item.ComplaintGuid,
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
            dealerId: item.CustomerLink || 'N/A',

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

    const [reloading, setReloading] = useState(false);
    const [visibleItemsCount, setVisibleItemsCount] = useState(ITEMS_PER_LOAD);

    const [expandedReclamation, setExpandedReclamation] = useState(null);
    const [expandedIssue, setExpandedIssue] = useState(null);


    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const windowWidth = useWindowWidth();
    const isMobile = windowWidth < 1024;

    const { theme } = useTheme();

    const [error, setError] = useState(null);


    const reloadReclamations = useCallback(async () => {
        cancelAll();

        const controller = register();
        setReloading(true);

        setError(null);

        try {
            const year = new Date().getFullYear().toString();
            setSelectedYear(year);

            const response = await axiosInstance.get(RECLAMATIONS_API_URL, {
                params: { year },
                signal: controller.signal
            });

            // 2. Перевірка на успішний статус (якщо ваш API це повертає)
            if (response.data) {
                setReclamationsData(formatApiData(response.data.data || []));
                setVisibleItemsCount(ITEMS_PER_LOAD);
            }
        } catch (err) {
            if (err.name !== "CanceledError") {
                // 3. Встановлюємо повідомлення про помилку
                setError("Не вдалося оновити дані. Перевірте з'єднання.");
                console.error("Reload error:", err);
            }
        } finally {
            setReloading(false);
        }
    }, [cancelAll, register]);




    
    const handleMarkAsRead = (complaintId) => {
        // Оновлюємо стан локально, щоб UI відреагував миттєво
        setReclamationsData(prev => prev.map(item => 
            item.id === complaintId ? { ...item, hasUnreadMessages: false } : item
        ));
    };

    /* --------------------------------------------------------
     *  Add New Reclamation
     * -------------------------------------------------------- */
    // const handleSaveReclamation = useCallback((newReclamation) => {
    //     // const formatted = {
    //     //     id: 'RCL' + Math.random().toString(36).substr(2, 5).toUpperCase(),
    //     //     number: newReclamation.name || `РКЛ-${Date.now()}`,
    //     //     dateRaw: newReclamation.dateRaw || new Date().toISOString(),
    //     //     date: new Date().toLocaleDateString('uk-UA'),

    //     //     issues: [],
    //     //     issueCount: 0,
    //     //     amount: 0,
    //     //     status: 'Новий',
    //     //     file: newReclamation.file || null,
    //     //     message: newReclamation.Comment || ''
    //     // };

    //     // setReclamationsData(prev => [formatted, ...prev]);
    //     // setVisibleItemsCount(ITEMS_PER_LOAD);

    //     setIsNewReclamationModalOpen(false);

    //     await reloadReclamations();
    // }, []);

    const handleSaveReclamation = useCallback(async () => {
        // addNotification("Рекламацію успішно створено", "success");
        setIsNewReclamationModalOpen(false);
        await reloadReclamations();

    }, [reloadReclamations]);


    

    /* --------------------------------------------------------
     *  FETCH DATA WITH CANCELLATION (LIKE PortalOriginal)
     * -------------------------------------------------------- */
   useEffect(() => {
        cancelAll();
        const controller = register();
        setError(null); // Скидаємо помилку

        const loadData = async () => {
            setLoading(true);
            try {
                const response = await axiosInstance.get(RECLAMATIONS_API_URL, {
                    params: { year: selectedYear },
                    signal: controller.signal
                });

                setReclamationsData(formatApiData(response.data.data || []));
                setVisibleItemsCount(ITEMS_PER_LOAD);
            } catch (err) {
                if (err.name !== "CanceledError") {
                    setError("Не вдалося завантажити дані. Спробуйте пізніше.");
                    console.error(err);
                    setReclamationsData([]);
                }
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [selectedYear]);




    

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
                    (r.actNumber || '').toLowerCase().includes(q) ||
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

    if (loading || reloading)
        return (
            <div className="loading-spinner-wrapper">
                <div className="loading-spinner"></div>
                <div className="loading-text">
                    {loading
                        ? 'Завантаження даних по рекламаціях...'
                        : 'Оновлення списку рекламацій...'}
                </div>
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
              
                        {Array.from({ length: 3 }, (_, i) =>
                            (new Date().getFullYear() - i).toString()
                        ).map(y =>
                            <option key={y} value={y}>{y}</option>
                        )}
                    </select>
                </div>


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
                        {error ? (
                            /* --- 1. СТАН ПОМИЛКИ (великий блок) --- */
                            <div className="error-empty-state column align-center jc-center" style={{ minHeight: '300px' }}>
                                <span className="icon icon-warning text-red font-size-48 mb-16"></span>
                                <h3 className="font-size-20 weight-600 mb-8">Упс! Не вдалося завантажити дані</h3>
                                <p className="text-grey mb-24 text-center">
                                    Виникла проблема під час з'єднання із сервером. <br/>
                                    Перевірте інтернет та спробуйте ще раз.
                                </p>
                                <button 
                                    className="btn btn-primary btn-load-more-big" 
                                    onClick={reloadReclamations}
                                >
                                    <span className="icon icon-loop2 mr-10"></span>
                                    Спробувати знову
                                </button>
                            </div>
                        ) : sortedItems.length === 0 ? (
                            /* --- 2. СТАН ПУСТО (якщо завантажено 0 результатів) --- */
                            <div className="no-data column align-center h-100">
                                <div className="font-size-24 text-grey">Рекламацій не знайдено</div>
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
                                        onMarkAsRead={handleMarkAsRead}
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
                                        onMarkAsRead={handleMarkAsRead}
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
