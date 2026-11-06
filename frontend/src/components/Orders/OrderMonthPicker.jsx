import { useEffect, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import "./OrderMonthPicker.css";

export function OrderFilterYear({ year, years, onChange }) {
  const options = [...new Set([String(year), ...years.map(String)])].sort((a, b) => Number(b) - Number(a));
  return <select className="year-select-minimal" aria-label="Рік" value={String(year)} onChange={(event) => onChange(event.target.value)}>
    {options.map((value) => <option key={value}>{value}</option>)}
  </select>;
}

export default function OrderMonthPicker({ year, month, years, counts, allowYear, onSelect }) {
  const { t } = useTranslation();
  const root = useRef(null);
  const popup = useRef(null);
  const [position, setPosition] = useState(null);
  const [open, setOpen] = useState(false);
  const months = t("portal_calc.months.full", { returnObjects: true });
  const allYear = t("portal_calc.months.all_year");
  const [draft, setDraft] = useState({ year: String(year), month });
  useEffect(() => setDraft({ year: String(year), month }), [year, month]);
  const label = draft.month ? months[draft.month - 1] : allYear;

  useEffect(() => {
    if (!open) return;
    const outside = (event) => { if (!root.current?.contains(event.target) && !popup.current?.contains(event.target)) setOpen(false); };
    const escapeOnResize = () => setOpen(false);
    const escape = (event) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("resize", escapeOnResize);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("resize", escapeOnResize);
    };
  }, [open]);

  function select(nextMonth) {
    setOpen(false);
    setDraft((previous) => ({ ...previous, month: nextMonth }));
  }

  return <div className="order-month-picker" ref={root}>
    <OrderFilterYear year={draft.year} years={years} onChange={(nextYear) => {
      setOpen(false);
      setDraft((previous) => ({ ...previous, year: nextYear }));
    }} />
    <button type="button" className="year-select-minimal order-month-picker__trigger" aria-label={`Місяць: ${label}`} aria-expanded={open}
      onClick={(event) => {
        if (!open) {
          const bounds = event.currentTarget.getBoundingClientRect();
          const width = Math.min(244, window.innerWidth - 16);
          setPosition({ top: bounds.bottom + 5, left: Math.max(8, Math.min(bounds.left, window.innerWidth - width - 8)), width });
        }
        setOpen(!open);
      }}>{label} <span aria-hidden="true">▾</span></button>
    <button type="button" className="date-filter-search-button" aria-label="Пошук" title="Пошук" onClick={() => {
      setOpen(false);
      onSelect(draft.year, draft.month);
    }}><FaSearch className="date-filter-search-icon" /><span className="date-filter-search-text">{t("portal_calc.ui.search", { defaultValue: "Пошук" })}</span></button>
    {open && createPortal(<div ref={popup} className="order-month-picker__popup" style={position} aria-label="Вибір місяця">
      <div className="order-month-picker__grid">
        {months.map((name, index) => {
          const value = index + 1;
          const count = draft.year === String(year) ? counts?.[value] : undefined;
          return <button type="button" key={value} aria-pressed={draft.month === value} onClick={() => select(value)}>
            {name}{count !== undefined && <small> ({count})</small>}
          </button>;
        })}
      </div>
      {allowYear && <button type="button" className="order-month-picker__year" aria-pressed={draft.month === 0} onClick={() => select(0)}>{allYear}</button>}
    </div>, document.body)}
  </div>;
}
