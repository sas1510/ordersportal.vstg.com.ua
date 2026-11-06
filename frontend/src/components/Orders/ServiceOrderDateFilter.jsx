import { FaSearch } from "react-icons/fa";
import { useState } from "react";
import OrderMonthPicker from "./OrderMonthPicker";
import { orderMonthPeriod } from "../../utils/orderReportPeriod";

export default function ServiceOrderDateFilter({ year, month, years, counts, allowYear, period, onMonth, onPeriod }) {
  const [mode, setMode] = useState(period ? "period" : "month");
  const initial = period || orderMonthPeriod(year, month || new Date().getMonth() + 1);
  const [from, setFrom] = useState(initial.dateFrom);
  const [to, setTo] = useState(initial.dateTo);
  return <div className="row service-order-date-filter" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
    <div className="date-filter-mode-switch row">
      <button type="button" className={`date-filter-mode-button ${mode === "month" ? "active" : ""}`} onClick={() => setMode("month")}>Місяць</button>
      <button type="button" className={`date-filter-mode-button ${mode === "period" ? "active" : ""}`} onClick={() => setMode("period")}>Період</button>
    </div>
    {mode === "month" ? <OrderMonthPicker year={year} month={month} years={years} counts={counts} allowYear={allowYear} onSelect={onMonth} /> : <form className="date-period-fields" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }} onSubmit={event => {
      event.preventDefault();
      if (from && to && from <= to) onPeriod({ mode: "period", year: from.slice(0, 4), month: 0, dateFrom: from, dateTo: to });
    }}>
      <label>З <input className="year-select-minimal" type="date" required value={from} max={to || undefined} onChange={event => setFrom(event.target.value)} /></label>
      <label>По <input className="year-select-minimal" type="date" required value={to} min={from || undefined} onChange={event => setTo(event.target.value)} /></label>
      <button type="submit" className="date-filter-search-button" aria-label="Пошук" title="Пошук" disabled={!from || !to || from > to}><FaSearch className="date-filter-search-icon" /><span className="date-filter-search-text">Пошук</span></button>
    </form>}
  </div>;
}
