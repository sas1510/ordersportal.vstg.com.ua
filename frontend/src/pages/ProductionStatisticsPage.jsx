// import { useState, useEffect } from "react";
// import axiosInstance from "../api/axios";
// import ProductionStatisticsBuilder from "../components/Statistics/ProductionStatisticsBuilder";
// import ProductionStatisticsBlock from "../components/Statistics/ProductionStatisticsBlock";
// import ProductionStatisticsView from "../components/Statistics/ProductionStatisticsView"; // Новий імпорт
// import { FaSearch, FaChartBar, FaThLarge, FaExclamationTriangle, FaMobileAlt } from "react-icons/fa";
// import './ProductionStatisticsPage.css';
// import { useNotification } from "../components/notification/Notifications";

// export default function ProductionStatisticsPage() {
//   const currentYear = new Date().getFullYear();
  
//   // Стани інтерфейсу
//   const [activeView, setActiveView] = useState('block');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null); 
//   const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

//   // Механізм примусового оновлення
//   const [refreshTrigger, setRefreshTrigger] = useState(0);

//   // Сповіщення та дані
//   const { addNotification } = useNotification();
//   const [rawData, setRawData] = useState(null);
//   const [dealerData, setDealerData] = useState(null);

//   // Дати
//   const [dateInputs, setDateInputs] = useState({
//     from: `${currentYear}-01-01`,
//     to: `${currentYear}-12-31`
//   });

//   const [searchParams, setSearchParams] = useState({ ...dateInputs });

//   // Слідкуємо за розміром екрана
// // Слідкуємо за розміром екрана
//   useEffect(() => {
//     const handleResize = () => {
//       const mobile = window.innerWidth < 768;
//       setIsMobile(mobile);
      
//       if (mobile) {
//         // Якщо мобільний — перемикаємо на мобільний вид
//         setActiveView('view'); 
//       } else {
//         // Якщо повернулися на десктоп — ставимо стандартний 'block'
//         setActiveView('block');
//       }
//     };

//     // Викликаємо один раз при монтуванні, щоб встановити правильний стан відразу
//     handleResize(); 

//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   useEffect(() => {
//     const loadAllData = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const params = { 
//           date_from: searchParams.from, 
//           date_to: searchParams.to 
//         };
        
//         const [resFull, resOrder] = await Promise.all([
//           axiosInstance.get("/full-statistics/", { params }),
//           axiosInstance.get("/order-statistics/", { params })
//         ]);

//         setRawData(resFull.data);
//         setDealerData(resOrder.data);
//       } catch (err) {
//         console.error("Помилка завантаження:", err);
//         const djangoDetail = err.response?.data?.detail || "";
//         const serverError = err.response?.data?.error || ""; 
//         const fullErrorText = `${djangoDetail} ${serverError} ${err.message}`.toLowerCase();

//         if (err.response?.status === 503 || fullErrorText.includes("recovery") || fullErrorText.includes("42000")) {
//           const mssqlMsg = djangoDetail || "База даних оновлюється. Спробуйте через 3 хвилини.";
//           setError(mssqlMsg);
//           addNotification({ type: "warning", message: mssqlMsg, duration: 10000 });
//         } else {
//           setError("Виникла проблема під час з'єднання із сервером.");
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadAllData();
//   }, [searchParams, refreshTrigger, addNotification]);

//   const handleSearch = () => {
//     setSearchParams({ ...dateInputs });
//     setRefreshTrigger(prev => prev + 1);
//   };

//   return (
//     <div className="portal-body column gap-2">
//       <div className="stats-page-header column">
//         <h2 className="page-title-analytics">Статистика</h2>
        
//         <div className="controls-row row ai-center jc-sb wrap gap-2">
//           <div className="year-selector row ai-center gap-2">
//             <input 
//               type="date" 
//               value={dateInputs.from} 
//               onChange={(e) => setDateInputs({...dateInputs, from: e.target.value})} 
//               className="year-select-custom" 
//             />
//             <input 
//               type="date" 
//               value={dateInputs.to} 
//               onChange={(e) => setDateInputs({...dateInputs, to: e.target.value})} 
//               className="year-select-custom" 
//             />
//             <button className="btn-search-stats" onClick={handleSearch} disabled={loading}>
//               <FaSearch /> {loading ? "..." : "Сформувати"}
//             </button>
//           </div>

//           {/* Перемикач режимів (ховаємо або змінюємо на мобільних) */}
//           {!isMobile && (
//             <div className="view-toggle-container">
//               <button 
//                 className={`toggle-btn ${activeView === 'block' ? 'active' : ''}`} 
//                 onClick={() => setActiveView('block')}
//               >
//                 <FaChartBar /> Звіт
//               </button>
//               <button 
//                 className={`toggle-btn ${activeView === 'builder' ? 'active' : ''}`} 
//                 onClick={() => setActiveView('builder')}
//               >
//                 <FaThLarge /> Конструктор
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="stats-content-area">
//         {loading && !rawData ? (
//           <div className="loading-spinner-wrapper"><div className="loading-spinner"></div></div>
//         ) : error ? (
//           <div className="error-empty-state column align-center jc-center" style={{ minHeight: '400px' }}>
//             <FaExclamationTriangle className="text-red mb-16" style={{ fontSize: '64px' }} />
//             <h3 className="font-size-24 weight-600 mb-8">Упс! Дані тимчасово недоступні</h3>
//             <p className="text-grey mb-24 text-center">{error}</p>
//             <button className="btn-search-stats" onClick={handleSearch}>Повторити запит</button>
//           </div>
//         ) : (
//           /* ВИБІР РЕНДЕРУ: Мобільний Clean View VS Десктопні версії */
//           isMobile ? (
//             <ProductionStatisticsView 
//               rawData={rawData} 
//               dealerData={dealerData} 
//             />
//           ) : (
//             activeView === 'block' ? (
//               <ProductionStatisticsBlock 
//                 rawData={rawData} 
//                 dealerData={dealerData} 
//                 dateRange={searchParams} 
//               />
//             ) : (
//               <ProductionStatisticsBuilder 
//                 rawData={rawData} 
//                 dealerData={dealerData} 
//               />
//             )
//           )
//         )}
//       </div>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import axiosInstance from "../api/axios";
import ProductionStatisticsBlock from "../components/Statistics/ProductionStatisticsBlock";
import { FaSearch, FaExclamationTriangle } from "react-icons/fa";
import './ProductionStatisticsPage.css';
import { useNotification } from "../components/notification/Notifications";
// 1. Імпортуємо необхідні компоненти та хуки
import DealerSelect from "./DealerSelect"; 
import { useDealerContext } from "../hooks/useDealerContext";

export default function ProductionStatisticsPage() {
  const currentYear = new Date().getFullYear();
  
  // 2. Отримуємо дані про дилера та роль з контексту
  const { dealerGuid, setDealerGuid, isAdmin } = useDealerContext();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { addNotification } = useNotification();
  const [rawData, setRawData] = useState(null);
  const [dealerData, setDealerData] = useState(null);

  const [dateInputs, setDateInputs] = useState({
    from: `${currentYear}-01-01`,
    to: `${currentYear}-12-31`
  });

  const [searchParams, setSearchParams] = useState({ ...dateInputs });

  useEffect(() => {
    const loadAllData = async () => {
      // 3. Якщо адмін, але дилер не обраний — не робимо запит (опціонально)
      // Або можна робити загальний запит, якщо це передбачено бекендом
      if (isAdmin && !dealerGuid) {
        setRawData(null);
        setDealerData(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const params = { 
          date_from: searchParams.from, 
          date_to: searchParams.to 
        };

        // 4. Додаємо GUID дилера в параметри, якщо він обраний або ми адмін
        if (dealerGuid) {
          params.contractor_guid = dealerGuid; // або 'dealer_guid', залежно від вашого API
        }
        
        const [resFull, resOrder] = await Promise.all([
          axiosInstance.get("/full-statistics/", { params }),
          axiosInstance.get("/order-statistics/", { params })
        ]);

        setRawData(resFull.data);
        setDealerData(resOrder.data);
      } catch (err) {
        console.error("Помилка завантаження:", err);
        const djangoDetail = err.response?.data?.detail || "";
        const serverError = err.response?.data?.error || ""; 
        const fullErrorText = `${djangoDetail} ${serverError} ${err.message}`.toLowerCase();

        if (err.response?.status === 503 || fullErrorText.includes("recovery") || fullErrorText.includes("42000")) {
          const mssqlMsg = djangoDetail || "База даних оновлюється. Спробуйте через 3 хвилини.";
          setError(mssqlMsg);
          addNotification({ type: "warning", message: mssqlMsg, duration: 10000 });
        } else {
          setError("Виникла проблема під час з'єднання із сервером.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
    // 5. Додаємо dealerGuid у масив залежностей, щоб дані оновлювались при зміні дилера
  }, [searchParams, refreshTrigger, addNotification, dealerGuid, isAdmin]);

  const handleSearch = () => {
    setSearchParams({ ...dateInputs });
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="portal-body column gap-2">
      <div className="stats-page-header column">
        <h2 className="page-title-analytics">Статистика</h2>
        
        <div className="controls-row row ai-center jc-sb wrap gap-2">
          <div className="year-selector row ai-center gap-2">
            <input 
              type="date" 
              value={dateInputs.from} 
              onChange={(e) => setDateInputs({...dateInputs, from: e.target.value})} 
              className="year-select-custom" 
            />
            <input 
              type="date" 
              value={dateInputs.to} 
              onChange={(e) => setDateInputs({...dateInputs, to: e.target.value})} 
              className="year-select-custom" 
            />
            
            {/* 6. Відображаємо вибір дилера тільки для адмінів */}
            {isAdmin && (
              <DealerSelect value={dealerGuid} onChange={setDealerGuid} />
            )}

            <button 
              className="btn-search-stats" 
              onClick={handleSearch} 
              disabled={loading || (isAdmin && !dealerGuid)}
            >
              <FaSearch /> {loading ? "Завантаження..." : "Сформувати"}
            </button>
          </div>
        </div>
      </div>

<div className="stats-content-area">
  {/* 1. ПРІОРИТЕТ 1: Якщо є помилка — показуємо тільки її */}
  {error ? (
    <div className="error-empty-state column align-center jc-center" style={{ minHeight: '400px' }}>
      <FaExclamationTriangle className="text-red mb-16" style={{ fontSize: '64px' }} />
      <h3 className="font-size-24 weight-600 mb-8">Упс! Дані тимчасово недоступні</h3>
      <p className="text-grey mb-24 text-center">{error}</p>
      <button className="btn-search-stats" onClick={handleSearch}>Повторити запит</button>
    </div>
  ) : 
  /* 2. ПРІОРИТЕТ 2: Перевірка на вибір дилера для адміна */
  isAdmin && !dealerGuid ? (
    <div className="empty-state-info column align-center jc-center" style={{ minHeight: '400px' }}>
       <p className="text-grey">Будь ласка, оберіть дилера для перегляду статистики</p>
    </div>
  ) : 
  /* 3. ПРІОРИТЕТ 3: Завантаження (тільки якщо немає даних) */
  loading && !rawData ? (
    <div className="loading-spinner-wrapper">
      <div className="loading-spinner"></div>
    </div>
  ) : 
  /* 4. ПРІОРИТЕТ 4: Рендеринг контенту (якщо є дані або завантаження фонове) */
  (rawData || dealerData) ? (
    <ProductionStatisticsBlock 
      rawData={rawData} 
      dealerData={dealerData} 
      dateRange={searchParams} 
    />
  ) : null}
</div>
    </div>
  );
}