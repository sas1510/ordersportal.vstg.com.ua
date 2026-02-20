import { useState } from "react";
import ProductionStatisticsBlock from "../components/Statistics/ProductionStatisticsBlock";
import './ProductionStatisticsPage.css';
import { FaSearch } from "react-icons/fa";


export default function ProductionStatisticsPage() {
  const currentYear = new Date().getFullYear();
  
  // Внутрішній стан полів вводу
  const [dateInputs, setDateInputs] = useState({
    from: `${currentYear}-01-01`,
    to: `${currentYear}-12-31`
  });

  // Стан, який реально ініціює пошук і передається в блок статистики
  const [searchParams, setSearchParams] = useState({
    from: `${currentYear}-01-01`,
    to: `${currentYear}-12-31`
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDateInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setSearchParams({ ...dateInputs });
  };

  return (
    <div className="portal-body column gap-2">
      <div className="stats-page-header column">
        <h2 className="page-title-analytics">Статистика</h2>

        <div className="year-selector row ai-center gap-2">
          <div className="date-input-group row ai-center gap-1">
            <span className="text-grey font-size-20" style={{marginRight: '7px'}}>Період з:</span>
            <input 
              type="date" 
              name="from"
              value={dateInputs.from}
              onChange={handleInputChange}
              className="year-select-custom"
            />
          </div>
          <div className="date-input-group row ai-center gap-1">
            <span className="text-grey font-size-20" style={{marginRight: '7px'}}>по:</span>
            <input 
              type="date" 
              name="to"
              value={dateInputs.to}
              onChange={handleInputChange}
              className="year-select-custom"
            />
          </div>
          
          {/* НОВА КНОПКА ПОШУКУ */}
          <button 
            className="btn-search-stats" 
            onClick={handleSearch}
          >
            <FaSearch  /> Сформувати 
          </button>
        </div>
      </div>

      {/* Передаємо searchParams, щоб useEffect спрацьовував тільки при кліку */}
      <ProductionStatisticsBlock dateRange={searchParams} />
    </div>
  );
}