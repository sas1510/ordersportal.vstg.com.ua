import { useState } from "react";
import ProductionStatisticsBlock from "../components/Statistics/ProductionStatisticsBlock";
import './ProductionStatisticsPage.css'

export default function ProductionStatisticsPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Створюємо список років (наприклад, останні 5 років)
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

  return (
    <div className="portal-body column gap-2">
  <div className="stats-page-header column ">
    <h2 className="page-title">Статистика</h2>

    <div className="year-selector row ai-center gap-2">
      <span className="text-grey">Звітний рік:</span>
      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(Number(e.target.value))}
        className="year-select-custom"
      >
        {years.map((y) => (
          <option key={y} value={y}>{y} рік</option>
        ))}
      </select>
    </div>
  </div>

  <ProductionStatisticsBlock selectedYear={selectedYear} />
</div>


  );
}