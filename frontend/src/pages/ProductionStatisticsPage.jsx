import { useState, useEffect } from "react";
import axiosInstance from "../api/axios";
import ProductionStatisticsBuilder from "../components/Statistics/ProductionStatisticsBuilder";
import ProductionStatisticsBlock from "../components/Statistics/ProductionStatisticsBlock";
import { FaSearch, FaChartBar, FaThLarge, FaExclamationTriangle } from "react-icons/fa";
import './ProductionStatisticsPage.css';
import { useNotification } from "../components/notification/Notifications";

export default function ProductionStatisticsPage() {
  const currentYear = new Date().getFullYear();
  
  // Стани інтерфейсу
  const [activeView, setActiveView] = useState('block');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  
  // Механізм примусового оновлення
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Сповіщення та дані
  const { addNotification } = useNotification();
  const [rawData, setRawData] = useState(null);
  const [dealerData, setDealerData] = useState(null);

  // Дати
  const [dateInputs, setDateInputs] = useState({
    from: `${currentYear}-01-01`,
    to: `${currentYear}-12-31`
  });

  const [searchParams, setSearchParams] = useState({ ...dateInputs });

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { 
          date_from: searchParams.from, 
          date_to: searchParams.to 
        };
        
        // Одночасний запит до обох ендпоінтів
        const [resFull, resOrder] = await Promise.all([
          axiosInstance.get("/full-statistics/", { params }),
          axiosInstance.get("/order-statistics/", { params })
        ]);

        setRawData(resFull.data);
        setDealerData(resOrder.data);
      } catch (err) {
        console.error("Помилка завантаження:", err);
        
        // Отримуємо деталі помилки від Django
        const djangoDetail = err.response?.data?.detail || "";
        const serverError = err.response?.data?.error || ""; 
        const generalMessage = err.message || "";
        const fullErrorText = `${djangoDetail} ${serverError} ${generalMessage}`.toLowerCase();

        // Перевірка на статус 503 (Service Unavailable) або текст відновлення MSSQL
        if (
          err.response?.status === 503 || 
          fullErrorText.includes("восстановления") || 
          fullErrorText.includes("recovery") || 
          fullErrorText.includes("42000")
        ) {
          const mssqlMsg = djangoDetail || "База даних оновлюється. Спробуйте через 3 хвилини.";
          setError(mssqlMsg);
          addNotification({
            type: "warning",
            message: mssqlMsg,
            duration: 10000 
          });
        } else {
          setError("Виникла проблема під час з'єднання із сервером.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [searchParams, refreshTrigger, addNotification]);

  const handleSearch = () => {
    setSearchParams({ ...dateInputs });
    setRefreshTrigger(prev => prev + 1); // Збільшуємо лічильник, щоб викликати useEffect
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
            <button 
              className="btn-search-stats" 
              onClick={handleSearch}
              disabled={loading}
            >
              <FaSearch /> {loading ? "Завантаження..." : "Сформувати"}
            </button>
          </div>

          <div className="view-toggle-container">
            <button 
              className={`toggle-btn ${activeView === 'block' ? 'active' : ''}`} 
              onClick={() => setActiveView('block')}
            >
              <FaChartBar /> Звіт
            </button>
            <button 
              className={`toggle-btn ${activeView === 'builder' ? 'active' : ''}`} 
              onClick={() => setActiveView('builder')}
            >
              <FaThLarge /> Конструктор
            </button>
          </div>
        </div>
      </div>

      <div className="stats-content-area">
        {loading && !rawData ? (
          <div className="loading-spinner-wrapper">
            <div className="loading-spinner"></div>
          </div>
        ) : error ? (
          /* Блок помилки: красиво центрований з кнопкою повтору */
          <div className="error-empty-state column align-center jc-center" style={{ minHeight: '400px' }}>
            <FaExclamationTriangle className="text-red mb-16" style={{ fontSize: '64px' }} />
            <h3 className="font-size-24 weight-600 mb-8">Упс! Дані тимчасово недоступні</h3>
            <p className="text-grey mb-24 text-center" style={{ maxWidth: '450px', lineHeight: '1.5' }}>
              {error} <br/>
              Зазвичай це займає близько 3-х хвилин. Спробуйте оновити запит трохи пізніше.
            </p>
            <button 
              className="btn-search-stats" 
              onClick={handleSearch} 
              disabled={loading}
              style={{ padding: '12px 30px', fontSize: '16px' }}
            >
              {loading ? "Запит триває..." : "Повторити запит"}
            </button>
          </div>
        ) : (
          activeView === 'block' ? (
            <ProductionStatisticsBlock 
              rawData={rawData} 
              dealerData={dealerData} 
              dateRange={searchParams} 
            />
          ) : (
            <ProductionStatisticsBuilder 
              rawData={rawData} 
              dealerData={dealerData} 
            />
          )
        )}
      </div>
    </div>
  );
}