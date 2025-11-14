import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../api/axios'; 
import { ReclamationItem } from '../components/Reclamations/ReclamationItem';
import { ReclamationItemMobile } from '../components/Reclamations/ReclamationItemMobile';
// import '../components/Portal/PortalOriginal.css'; 
import AddClaimModal from '../components/Orders/AddClaimModal'; 
import DealerSelectModal from '../components/Orders/DealerSelectModal'; 
import useWindowWidth from '../hooks/useWindowWidth';
import { useTheme } from '../context/ThemeContext';
import '../components/Reclamations/ReclamationItem.css';

const mockReclamations = [
    {
        id: 1, number: '01-318215', actNumber: '6788', orderNumber: 'ORD-2025-0001',
        dateRaw: '2025-11-06T10:00:00Z', date: '06.11.2025', manager: 'Назарова Яна', 
        status: 'На розгляді', statusColor: 'warning', amount: 3500.00, dealer: 'ТОВ "Вікна Еліт"',
        problem: 'Замінити склопакет за рахунок виробника', issues: [], issueCount: 0
    },
    {
        id: 4, number: '01-317000', actNumber: '6500', orderNumber: 'ORD-2024-1000',
        dateRaw: '2024-12-01T10:00:00Z', date: '01.12.2024', manager: 'Назарова Яна', 
        status: 'Новий', statusColor: 'danger', amount: 0.00, dealer: 'ТОВ "Технобуд"',
        problem: 'Конденсат на профілі', issues: [], issueCount: 0
    },
];

const RECLAMATIONS_API_URL = '/get_reclamation_info/'; 

// Карта для перетворення назв статусів у кольори (винесена з компонента)

// Утилітарна функція для форматування даних з API
function formatApiData(data) {
    if (!Array.isArray(data)) return [];
    
    return data.map(item => {
        // Використовуємо ComplaintDate для dateRaw, оскільки він має точний час (ISO-подібний)
        const dateRaw = item.ComplaintDate || item.DateInWork || new Date().toISOString();
        const dateObj = new Date(dateRaw);
        
        // Використовуємо StatusName від API, якщо доступний, інакше "Нова"
        const statusKey = item.StatusName || 'Новий'; 
//         
//         const statusColor = statusColorMap[statusKey] || 'default';
//         
        // Визначення `problem` та `description`
        const problem = item.ResolutionPaths || item.AdditionalInformation || 'Не вказано';
        const description = item.AdditionalInformation || item.ResolutionPaths || 'Не вказано';


        // ===============================================
        // МАПІНГ ПОЛІВ: API (item.XXX) -> React (key: value)
        // ===============================================
        return {
            // Загальні ключі
            id: item.ComplaintNumber ,
            number: item.ClaimOrderNumber, // '000002369'
            actNumber: item.ComplaintNumber, // '70-28672   ' (якщо ви використовуєте це як акт)
            orderNumber: item.OrderNumber, // '01-295755  '

            // Дати
            dateRaw: dateRaw,
            date: isNaN(dateObj) ? 'N/A' : dateObj.toLocaleDateString('uk-UA'),
            deliveryDate: item.DeliveryDateText || null, // ПлановаДатаВиезда
            determinationDate: item.DeterminationDateText || null,
            readyDate: item.BorderReturnDate, 
            producedDate: item.ProducedDate, 
            soldDate: item.SoldDate,
            // Статуси та опис
            status: statusKey,
//             statusColor: statusColor,
            problem: item.IssueName, // Використовуємо шляхи рішення/інформацію для "проблеми"
            resolution: item.SolutionName || null,
            description: item.ParsedDescription, // Додаткова інформація
            
            // Інші поля
            series: item.SeriesList || null,
            manager: item.LastManagerName || 'N/A',
            amount: parseFloat(item.DocumentAmount || item.DocumentSum || item.CompensationAmount || 0), // СумаКомпенсации або СуммаДокумента
            dealer: item.Customer || 'N/A',
            // Технічні поля для сумісності з UI-логікою
            file: !!item.AdditionalInformation, // Припускаємо, що якщо є додаткова інфа, то це як "файл"
            issueCount: 0, 
            issues: [],
            statuses: { [statusKey]: 1 },
//             message: `${statusKey}. ${problem.substring(0, 50)}...`,
            message: item.ParsedDescription,
        };
    });
}

const getInitialDealer = () => {
    const storedDealerId = localStorage.getItem('dealerId');
    if (storedDealerId) {
        return { id: storedDealerId, name: 'Обраний Дилер' };
    }
    return null;
};

const ReclamationPortal = () => {
    // State
    const [isNewReclamationModalOpen, setIsNewReclamationModalOpen] = useState(false);
    const [reclamationsData, setReclamationsData] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [filter, setFilter] = useState({ status: 'Всі', month: 0, name: '' });
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString()); 
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [expandedReclamation, setExpandedReclamation] = useState(null);
    const [expandedIssue, setExpandedIssue] = useState(null); 
    const [showDealerModal, setShowDealerModal] = useState(false);
    const [dealer, setDealer] = useState(getInitialDealer); 
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // Ref для відстеження чи був вже виклик API
    const hasFetchedRef = useRef(false);
    
    const windowWidth = useWindowWidth();
    const isMobile = windowWidth < 1024;
    const { theme, toggleTheme } = useTheme();

    /* --- [ЛОГІКА ДИЛЕРА] --- */
    
    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'customer' && !dealer) {
            setShowDealerModal(true);
        }
    }, [dealer]);

    const handleDealerSelect = (selectedDealer) => {
        if (selectedDealer === null) {
            setDealer(null);
            localStorage.removeItem('dealerId');
        } else {
            setDealer(selectedDealer);
            localStorage.setItem('dealerId', selectedDealer.id);
        }
        setShowDealerModal(false);
    };

    const handleDeleteReclamation = (reclamationId) => {
        setReclamationsData(prev => prev.filter(reclamation => reclamation.id !== reclamationId));
        setFilteredItems(prev => prev.filter(reclamation => reclamation.id !== reclamationId));
    };

    const handleUpdateReclamation = (updatedReclamation) => {
        setReclamationsData(prev =>
            prev.map(reclamation => reclamation.id === updatedReclamation.id ? updatedReclamation : reclamation)
        );
        setFilteredItems(prev =>
            prev.map(reclamation => reclamation.id === updatedReclamation.id ? updatedReclamation : reclamation)
        );
    };

    const handleSaveReclamation = (newReclamation) => {
        const formattedCalc = {
            id: 'RCL' + Math.random().toString(36).substr(2, 4).toUpperCase(),
            number: newReclamation.name || `РКЛ-НОВИЙ-${reclamationsData.length + 1}`,
            dateRaw: newReclamation.dateRaw || new Date().toISOString(),
            date: new Date(newReclamation.dateRaw || new Date()).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' }),
            issues: [],
            issueCount: 0,
            amount: 0, 
            status: 'Новий', 
//             statusColor: 'danger',
            file: newReclamation.file || null,
            message: newReclamation.Comment || ''
        };

        setReclamationsData(prev => [formattedCalc, ...prev]);
        setFilteredItems(prev => [formattedCalc, ...prev]);
        setIsNewReclamationModalOpen(false);
    };

    /* --- [FETCH DATA: ОДИН РАЗ БЕЗ ЗАЛЕЖНОСТІ ВІД ДИЛЕРА] --- */
    
    const fetchReclamationsData = async () => {
        // Перевірка чи вже був виклик
        if (hasFetchedRef.current) {
            return;
        }

        setLoading(true);
        try {
            const role = localStorage.getItem('role');
            const dealerId = dealer ? dealer.id : null;

            // Параметри для запиту - dealerId тепер опціональний
            const params = { year: selectedYear };
            
            // Додаємо dealerId тільки якщо він є (для не-customer ролей)
            if (role !== 'customer' && dealerId) {
                params.dealerId = dealerId;
            }

            const response = await axiosInstance.get(RECLAMATIONS_API_URL, { params });

            const rawData = response.data.data || []; 
            const formattedData = formatApiData(rawData); 
            
            setReclamationsData(formattedData);
            setFilteredItems(formattedData);
            
            // Позначаємо що виклик був здійснений
            hasFetchedRef.current = true;
            
        } catch (error) {
            console.error("Помилка при завантаженні рекламацій:", error.response?.data || error.message);
            
            // Fallback: Використовуємо мок-дані як резерв
            const backupData = formatApiData(mockReclamations).filter(
                r => new Date(r.dateRaw).getFullYear().toString() === selectedYear
            );
            setReclamationsData(backupData);
            setFilteredItems(backupData);
            
            hasFetchedRef.current = true;
            
        } finally {
            setLoading(false);
        }
    };
    
    // useEffect тільки для початкового завантаження
    useEffect(() => {
        fetchReclamationsData();
    }, []); // Порожній масив залежностей - виклик тільки раз при монтуванні

    // Окремий useEffect для оновлення даних при зміні року
    useEffect(() => {
        // Пропускаємо перший рендер (він вже оброблений вище)
        if (!hasFetchedRef.current) {
            return;
        }

        // Скидаємо прапорець і робимо новий запит
        hasFetchedRef.current = false;
        fetchReclamationsData();
    }, [selectedYear]);

    /* --- [ФІЛЬТРАЦІЯ ТА СУМАРНА ІНФОРМАЦІЯ] --- */
    
    const getStatusSummary = () => {
        const summary = { 
            'Всі': 0, 'Новий': 0, 'Виробництво': 0, 'В роботі': 0, 'Вирішено': 0, 
            'На складі': 0, 'Відвантажено': 0 , 'Відмова': 0 
        };

        reclamationsData.forEach(reclamation => {
            summary['Всі'] += 1;
            if (reclamation.status && summary.hasOwnProperty(reclamation.status)) {
                summary[reclamation.status] += 1;
            } else if (reclamation.status === 'Новий') {
                summary['Новий'] += 1;
            }
        });

        return summary;
    };

    const getMonthSummary = () => {
        const summary = {};
        for (let i = 1; i <= 12; i++) summary[i] = 0;

        reclamationsData.forEach(reclamation => {
            if (!reclamation.dateRaw) return;
            const month = new Date(reclamation.dateRaw).getMonth() + 1;
            summary[month] += 1;
        });

        return summary;
    };

    const statusSummary = getStatusSummary();
    const monthSummary = getMonthSummary();

    const getFilteredItems = (statusFilter, monthFilter, nameFilter) => {
        let filtered = [...reclamationsData];
        if (statusFilter && statusFilter !== 'Всі') {
            filtered = filtered.filter(reclamation => reclamation.status === statusFilter);
        }
        if (monthFilter !== 0) {
            filtered = filtered.filter(reclamation => {
                const month = new Date(reclamation.dateRaw).getMonth() + 1;
                return month === monthFilter;
            });
        }
        if (nameFilter) {
            const query = nameFilter.toLowerCase();
            filtered = filtered.filter(reclamation => {
                // Використовуємо || '' для гарантії, що це рядок, якщо поле NULL або undefined
                
                // 1. Пошук за номером (якщо він може бути рядком або null)
                if ((reclamation.number || '').toLowerCase().includes(query)) return true; 
                if ((reclamation.id || '').toLowerCase().includes(query)) return true; 
                // 2. Пошук за менеджером
                if ((reclamation.manager || '').toLowerCase().includes(query)) return true;

                // 3. Пошук за проблемою/описом
                // if ((reclamation.problem || '').toLowerCase().includes(query)) return true;

                return false;
            });
        }
        return filtered;
    };

    const handleFilterClick = (statusKey) => {
        setFilter(prev => ({ ...prev, status: statusKey }));
        setFilteredItems(getFilteredItems(statusKey, filter.month, filter.name));
    };

    const handleMonthClick = (month) => {
        const newMonth = filter.month === month ? 0 : month;
        setFilter(prev => ({ ...prev, month: newMonth }));
        setFilteredItems(getFilteredItems(filter.status, newMonth, filter.name));
    };

    const handleSearchChange = (e) => {
        const name = e.target.value;
        setFilter(prev => ({ ...prev, name }));
        setFilteredItems(getFilteredItems(filter.status, filter.month, name));
    };

    const handleClearSearch = () => {
        setFilter(prev => ({ ...prev, name: '' }));
        setFilteredItems(getFilteredItems(filter.status, filter.month, ''));
    };

    const sortedItems = filteredItems.sort((a, b) => new Date(b.dateRaw) - new Date(a.dateRaw));
    
    const toggleReclamation = (id) => setExpandedReclamation(expandedReclamation === id ? null : id);
    const toggleIssue = (id) => setExpandedIssue(expandedIssue === id ? null : id); 
    
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: currentYear - 2024 + 1 }, (_, i) => 
        (currentYear - i).toString()
    );

    if (loading) 
        return (
            <div className="loading-spinner-wrapper">
                <div className="loading-spinner"></div>
                <div className="loading-text">Завантаження даних по рекламаціях...</div>
            </div>
        );

    return (
        <div className="column portal-body">

            {showDealerModal && (
                <DealerSelectModal
                    isOpen={showDealerModal}
                    onClose={() => setShowDealerModal(false)}
                    onSelect={handleDealerSelect}
                />
            )}

            {/* Вибір року, місяці, кнопки */}
            <div className="content-summary row w-100">
                <div 
                    className="mobile-sidebar-toggle" 
                    onClick={() => setIsSidebarOpen(true)} 
                    style={{marginTop: '10px'}}
                >
                    <span className="icon icon-menu font-size-24"></span>
                </div>
            
                <div className="year-selector row">
                    <span>Рік рекламацій:</span>
                    <span className="icon icon-calendar2 font-size-24 text-info"></span>
                    <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                         {yearOptions.map(yearValue => (
                            <option key={yearValue} value={yearValue}>{yearValue}</option>
                         ))}
                    </select>
                </div>

                <div className="by-month-pagination-wrapper">
                    <ul className="gap-6 row no-wrap month-list">
                        <li className={`pagination-item ${filter.month === 0 ? 'active' : ''}`} onClick={() => handleMonthClick(0)}>
                            Весь рік
                        </li>
                        {Array.from({ length: 12 }, (_, i) => {
                            const num = i + 1;
                            const labels = ['Січ.', 'Лют.', 'Бер.', 'Квіт.', 'Трав.', 'Черв.', 'Лип.', 'Сер.', 'Вер.', 'Жов.', 'Лис.', 'Груд.'];
                            return (
                                <li
                                    key={num}
                                    className={`pagination-item ${filter.month === num ? 'active' : ''} ${monthSummary[num] === 0 ? 'disabled' : ''}`}
                                    onClick={() => monthSummary[num] > 0 && handleMonthClick(num)}
                                >
                                    {labels[i]} <span className="text-grey">({monthSummary[num]})</span>
                                </li>
                            );
                        })}
                    </ul>
                    <select
                        className="month-select"
                        value={filter.month}
                        onChange={(e) => handleMonthClick(Number(e.target.value))}
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
                    {isSidebarOpen && <span>Фільтри Рекламацій</span>}
                    {isSidebarOpen && (
                        <span className="icon icon-cross" onClick={() => setIsSidebarOpen(false)}></span>
                    )}
                    </div>

                    <div className="search-wrapper">
                        <input
                            type="text"
                            className="search-orders"
                            placeholder="номер рекламації"
                            value={filter.name}
                            onChange={handleSearchChange}
                        />
                        <span className="icon icon-cancel2 clear-search" title="Очистити пошук" onClick={handleClearSearch}></span>
                    </div>

                    {localStorage.getItem('role') !== 'customer' && (
                        <div>
                            <div className="delimiter1"/>
                            <ul className="buttons">
                                <li className="btn btn-select-dealer" onClick={() => setShowDealerModal(true)}>
                                    <span className="icon icon-user-check"></span>
                                    <span className="uppercase">Вибрати дилера</span>
                                </li>
                            </ul>
                        </div>
                    )}

                    <div className="delimiter1"></div> 
                    <ul className="buttons">
                        <li className="btn btn-add-calc" onClick={() => setIsNewReclamationModalOpen(true)}>
                            <span className="icon icon-plus3"></span>
                            <span className="uppercase">Нова рекламація</span>
                        </li>
                    </ul>
                    
                    <ul className="filter column align-center">
                        <li className="delimiter1"></li>
                        {[
                            { id: "all", label: "Всі рекламації", icon: "icon-calculator", statusKey: "Всі" },
                            { id: "new", label: "Новий", icon: "icon-bolt", statusKey: "Новий" },
                            // { id: "consideration", label: "На розгляді", icon: "icon-eye", statusKey: "На розгляді" },
                            { id: "in-progress", label: "В роботі", icon: "icon-spin-alt", statusKey: "В роботі" },
                            { id: "factory", label: "Виробництво", icon: "icon-cog", statusKey: "Виробництво" }, // Змінено
                            { id: "camposition", label: "На складі", icon: "icon-layers2", statusKey: "На складі" },
                            { id: "arrived", label: "Відвантажено", icon: "icon-truck", statusKey: "Відвантажено" }, // Змінено
                            { id: "resolved", label: "Вирішено", icon: "icon-check", statusKey: "Вирішено" },
                            { id: "rejected", label: "Відмова", icon: "icon-circle-with-cross", statusKey: "Відмова" }
                        ].map(({ id, label, icon, statusKey }) => (
                            <li
                                key={id}
                                className={`filter-item ${filter.status === statusKey ? 'active' : ''}`}
                                onClick={() => handleFilterClick(statusKey)}
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
                    <div className="items-wrapper column gap-1" id="items-wrapper">
                        {sortedItems.length === 0 ? (
                            <div className="no-data column align-center h-100">
                                <div className="font-size-24 text-grey">Немає рекламацій для відображення</div>
                            </div>
                        ) : (
                            sortedItems.map((reclamation) => (
                                isMobile ? (
                                    <ReclamationItemMobile 
                                        key={reclamation.id}
                                        reclamation={reclamation}
                                        isExpanded={expandedReclamation === reclamation.id}
                                        onToggle={() => toggleReclamation(reclamation.id)}
                                        expandedIssueId={expandedIssue}
                                        onIssueToggle={toggleIssue}
                                        onDelete={handleDeleteReclamation}
                                        onEdit={handleUpdateReclamation}  
                                    />
                                ) : (
                                    <ReclamationItem 
                                        key={reclamation.id}
                                        reclamation={reclamation}
                                        isExpanded={expandedReclamation === reclamation.id}
                                        onToggle={() => toggleReclamation(reclamation.id)}
                                        expandedIssueId={expandedIssue}
                                        onIssueToggle={toggleIssue}
                                        onDelete={handleDeleteReclamation}
                                        onEdit={handleUpdateReclamation}  
                                    />
                                )
                            ))
                        )}
                    </div>
                </div>
            </div>      

            <AddClaimModal 
                isOpen={isNewReclamationModalOpen} 
                onClose={() => setIsNewReclamationModalOpen(false)} 
                onSave={handleSaveReclamation} 
            />
        </div>
    );
};

export default ReclamationPortal;