import { useState, useEffect } from "react";
import axiosInstance from "../api/axios";
import ProductionStatisticsBuilder from "../components/Statistics/ProductionStatisticsBuilder";
import ProductionStatisticsBlock from "../components/Statistics/ProductionStatisticsBlock";
import { FaSearch, FaChartBar, FaThLarge } from "react-icons/fa";
import './ProductionStatisticsPage.css';

export default function ProductionStatisticsPage() {
  const currentYear = new Date().getFullYear();
  const [activeView, setActiveView] = useState('block');
  const [loading, setLoading] = useState(true);
  
  const [rawData, setRawData] = useState(null);
  const [dealerData, setDealerData] = useState(null);

  const [dateInputs, setDateInputs] = useState({
    from: `${currentYear}-01-01`,
    to: `${currentYear}-12-31`
  });

  const [searchParams, setSearchParams] = useState({ ...dateInputs });

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        const params = { 
          date_from: searchParams.from, 
          date_to: searchParams.to 
        };
        
        const [resFull, resOrder] = await Promise.all([
          axiosInstance.get("/full-statistics/", { params }),
          axiosInstance.get("/order-statistics/", { params })
        ]);

        setRawData(resFull.data);
        setDealerData(resOrder.data);
      } catch (err) {
        console.error("Помилка завантаження:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, [searchParams]);

  const handleSearch = () => setSearchParams({ ...dateInputs });

  return (
    <div className="portal-body column gap-2">
      <div className="stats-page-header column">
        <h2 className="page-title-analytics">Статистика</h2>
        
        {/* Головний контейнер керування - один рівень flexbox */}
        <div className="controls-row row ai-center jc-sb wrap gap-2">
          
          {/* Ліва група: Дати та Кнопка */}
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
            <button className="btn-search-stats" onClick={handleSearch}>
              <FaSearch /> Сформувати
            </button>
          </div>

          {/* Права група: Перемикач видів */}
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
        {loading ? (
          <div className="loading-spinner-wrapper">
            <div className="loading-spinner"></div>
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