import { useEffect, useMemo, useRef, useState } from "react";
import { FaTruck, FaFilePdf } from "react-icons/fa";
import axios from "../../api/axios";
import { useNotification } from "../../hooks/useNotification";
import { getDeliveryRows, sortDeliveryDates } from "../../utils/deliveryRows";
import "./Deliveries.css";

export function useDeliveries(calculations) {
  const [enabled, setEnabled] = useState(false);
  const [date, setDate] = useState("");
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  const rows = useMemo(() => getDeliveryRows(calculations, now, "all"), [calculations, now]);
  const dates = sortDeliveryDates([...new Set(rows.map((row) => row.day))]);
  useEffect(() => { if (date && !dates.includes(date)) setDate(""); }, [date, dates.join(",")]);
  const selectedRows = useMemo(() => date ? rows.filter((row) => row.day === date) : rows, [rows, date]);
  const filteredCalculations = useMemo(() => {
    if (!enabled) return calculations;
    const matchingOrders = new Set(selectedRows.map((row) => row.order));
    return calculations.flatMap((calc) => {
      const orders = (calc.orders || []).filter((order) => matchingOrders.has(order));
      return orders.length ? [{ ...calc, orders }] : [];
    });
  }, [enabled, calculations, selectedRows]);
  return { enabled, setEnabled, date, setDate, dates, rows: selectedRows, filteredCalculations };
}

export function DeliveriesControl({ delivery }) {
  const [open, setOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  const { addNotification } = useNotification();
  useEffect(() => {
    const close = (event) => { if (!ref.current?.contains(event.target)) { setOpen(false); setDateOpen(false); } };
    const escape = (event) => { if (event.key === "Escape") { setOpen(false); setDateOpen(false); } };
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, []);
  const download = async () => {
    setBusy(true);
    try {
      const response = await axios.post("/deliveries-pdf/", { rows: delivery.rows.map(({ order, calc, day, time }) => ({ day, time, number: order.number, calculation: calc.number || calc.webNumber || "", dealer: calc.dealer || "", count: order.count ?? "" })) }, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a"); link.href = url; link.download = `Доставки_${delivery.date || "усі-дати"}.pdf`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch { addNotification("Не вдалося завантажити PDF доставок. Спробуйте ще раз.", "error"); }
    finally { setBusy(false); }
  };
  return <div className="deliveries-control" ref={ref}>
    <button type="button" className={`orders-expand-all-button deliveries-button${delivery.enabled ? " active" : ""}`} aria-expanded={open} onClick={() => setOpen(!open)}><FaTruck />Доставки</button>
    {delivery.enabled && <button type="button" className="deliveries-reset" title="Зняти фільтр доставок" aria-label="Зняти фільтр доставок" onClick={() => { delivery.setEnabled(false); delivery.setDate(""); setOpen(false); setDateOpen(false); }}>×</button>}
    {open && <div className="deliveries-settings">
      <label><input type="checkbox" checked={delivery.enabled} onChange={(event) => delivery.setEnabled(event.target.checked)} />Показувати доставки</label>
      <div className="deliveries-date-select">
        <button type="button" className="deliveries-date-trigger" aria-label="Дата доставки" aria-expanded={dateOpen} aria-haspopup="menu" onClick={() => setDateOpen(!dateOpen)}>{delivery.date ? delivery.date.split("-").reverse().join(".") : "Усі дати"}<span aria-hidden="true">⌄</span></button>
        {dateOpen && <div className="deliveries-date-options" role="menu" aria-label="Дата доставки">
          {["", ...delivery.dates].map((day) => <button type="button" role="menuitemradio" aria-checked={delivery.date === day} key={day || "all"} onClick={() => { delivery.setDate(day); delivery.setEnabled(true); setDateOpen(false); }}>{day ? day.split("-").reverse().join(".") : "Усі дати"}</button>)}
        </div>}
      </div>
      <button type="button" onClick={download} disabled={busy || !delivery.rows.length}><FaFilePdf />{busy ? "Формування…" : "Завантажити PDF"}</button>
      <small>{delivery.rows.length} замовлень у поточному списку</small>
    </div>}
  </div>;
}

