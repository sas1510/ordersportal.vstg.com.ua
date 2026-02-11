import { useState } from "react";
import ProductionStatisticsBlock from "../components/Statistics/ProductionStatisticsBlock";

export default function ProductionStatisticsPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Створюємо список років (наприклад, останні 5 років)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="portal-body column gap-2" >
      <div className="row ai-center jc-between stats-page-header">
        <h2 className="page-title">Статистика</h2>

        <div className="year-filter-wrapper row ai-center gap-12">
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

      {/* Передаємо вибраний рік у блок статистики */}
      <ProductionStatisticsBlock selectedYear={selectedYear} />
    </div>
  );
}