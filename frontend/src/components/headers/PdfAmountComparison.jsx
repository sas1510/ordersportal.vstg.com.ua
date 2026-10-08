import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import axios from "../../api/axios";
import { defaultPdfComparisonPeriod } from "../../utils/pdfComparisonPeriod";
import { useTheme } from "../../hooks/useTheme";
import { useNotification } from "../../hooks/useNotification";
import DealerSelectWithAll from "../../pages/DealerSelectWithAll";
import "./PdfAmountComparison.css";

const currencyCode = (value) => ({ "ГРН": "UAH", "€": "EUR", "$": "USD" }[String(value || "").toUpperCase().replace(/\./g, "").trim()] || String(value || "").toUpperCase().trim());
const money = (value, currency) => value == null ? "—" : `${Number(value).toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ""}`;
const orderLabel = (row) => {
  const number = row.order || "Без номера";
  const match = String(row.orderDate || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${number} · від ${match[3]}.${match[2]}.${match[1].slice(-2)}` : number;
};

export default function PdfAmountComparison({ admin = false, onClose }) {
  const { theme } = useTheme();
  const { addNotification } = useNotification();
  const notificationRef = useRef(addNotification);
  useEffect(() => { notificationRef.current = addNotification; }, [addNotification]);
  const [period, setPeriod] = useState(() => defaultPdfComparisonPeriod(admin));
  const [dealerId, setDealerId] = useState("__ALL__");
  const [appliedPeriod, setAppliedPeriod] = useState(period);
  const [periodError, setPeriodError] = useState("");
  const [rows, setRows] = useState([]);
  const [progress, setProgress] = useState("Завантаження замовлень…");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const mismatches = rows.filter((row) => row.difference != null && row.difference !== 0);
  const reviewCount = rows.filter((row) => row.difference == null).length;
  const reviewOrderNumbers = [...new Set(rows.filter((row) => row.difference == null).map(orderLabel))];
  const reviewReasons = new Map();
  rows.filter((row) => row.difference == null).forEach((row) => {
    const reason = row.status || "Причину не визначено";
    if (!reviewReasons.has(reason)) reviewReasons.set(reason, new Set());
    reviewReasons.get(reason).add(orderLabel(row));
  });
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const { dateFrom, dateTo, dealerId: selectedDealerId } = appliedPeriod;
    setRows([]);
    setError("");
    setDone(false);
    setProgress(`${dateFrom} — ${dateTo} · Завантаження замовлень…`);
    const append = (row) => { if (!signal.aborted) setRows((previous) => [...previous, row]); };
    const run = async () => {
      try {
        const response = await axios.get(admin ? "/order/get_orders_info_all/" : "/order/get_orders_info/", { params: { date_from: dateFrom, date_to: dateTo }, signal });
        if (response.data?.status !== "success") throw new Error(response.data?.error || "Не вдалося отримати замовлення.");
        const seen = new Set();
        const calculations = (response.data.data?.calculation || []).filter((calc) => !admin || !selectedDealerId || selectedDealerId === "__ALL__" || String(calc.dealerId || "").toLowerCase() === selectedDealerId.toLowerCase());
        const orders = calculations.flatMap((calc) => (calc.orders || []).map((order) => ({ ...order, dealer: calc.dealer || calc.contractorName || calc.dealerName || "" }))).filter((order) => {
          if (/^34\s*[-‐‑‒–—]/.test(String(order.number || "").trim())) return false;
          if (!order.idGuid || seen.has(order.idGuid)) return false;
          seen.add(order.idGuid);
          return true;
        });
        for (const [index, order] of orders.entries()) {
          if (signal.aborted) return;
          setProgress(`${dateFrom} — ${dateTo} · Замовлення ${index + 1} із ${orders.length}`);
          const base = { order: order.number, orderDate: order.dateRaw || order.date, dealer: order.dealer, portal: order.amount, currency: order.currency };
          try {
            const listing = await axios.get(`/order/${order.idGuid}/files/`, { signal });
            const files = (listing.data.files || []).filter((file) => /\.pdf$/i.test(file.fileName));
            if (!files.length) append({ ...base, status: "PDF відсутній" });
            for (const file of files) {
              try {
                const downloaded = await axios.get(`/order/${order.idGuid}/files/${file.fileGuid}/download/`, { params: { filename: file.fileName }, responseType: "blob", signal });
                const form = new FormData();
                form.append("file", downloaded.data, file.fileName);
                const { data } = await axios.post("/pdf-amount-extract/", form, { signal });
                const sameCurrency = data.currency && currencyCode(order.currency) === data.currency;
                const rawDifference = data.status === "extracted" && sameCurrency ? Math.round((Number(data.amount) - Number(order.amount)) * 100) / 100 : null;
                const difference = rawDifference !== null && data.currency === "UAH" && Math.abs(rawDifference) <= 2 ? 0 : rawDifference;
                append({ ...base, file: file.fileName, pdf: data.amount, pdfCurrency: data.currency, difference, evidence: data.evidence, status: data.status !== "extracted" ? data.reason : !sameCurrency ? "Перевірте валюту" : difference === 0 ? "Збігається" : "Розбіжність" });
              } catch (failure) {
                if (signal.aborted) return;
                append({ ...base, file: file.fileName, status: failure.response?.data?.error || "Не вдалося перевірити PDF" });
              }
            }
          } catch {
            if (signal.aborted) return;
            append({ ...base, status: "Не вдалося отримати файли" });
          }
        }
        if (!signal.aborted) {
          setDone(true);
          setProgress(`${dateFrom} — ${dateTo} · Перевірку завершено: ${orders.length} замовлень`);
          notificationRef.current(`Звірку завершено. Опрацьовано ${orders.length} замовлень.`, "success");
        }
      } catch (failure) {
        if (!signal.aborted) { setError(failure.response?.data?.error || failure.message || "Помилка перевірки"); setDone(true); }
      }
    };
    run();
    const escape = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", escape);
    return () => { controller.abort(); window.removeEventListener("keydown", escape); };
  }, [admin, onClose, appliedPeriod]);
  const startComparison = (event) => {
    event.preventDefault();
    if (!period.dateFrom || !period.dateTo || period.dateFrom > period.dateTo) {
      setPeriodError("Вкажіть коректний період: дата «Від» не може бути пізнішою за дату «До».");
      return;
    }
    setPeriodError("");
    setAppliedPeriod({ ...period, dealerId });
  };
  return createPortal(<div className="pdf-comparison-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={`pdf-comparison ${theme === "dark" ? "pdf-comparison-dark" : ""}`} role="dialog" aria-modal="true" aria-label="Порівняння сум PDF">
    <header><h2>Порівняння сум PDF</h2><button type="button" onClick={onClose}>Закрити</button></header>
    <form className="pdf-comparison-period" onSubmit={startComparison}>
      {admin && <div className="pdf-comparison-dealer"><span>Дилер</span><DealerSelectWithAll value={dealerId} onChange={setDealerId} allLabel="Усі доступні дилери" /></div>}
      <label>Від<input type="date" required value={period.dateFrom} onChange={(event) => setPeriod((previous) => ({ ...previous, dateFrom: event.target.value }))} /></label>
      <label>До<input type="date" required value={period.dateTo} onChange={(event) => setPeriod((previous) => ({ ...previous, dateTo: event.target.value }))} /></label>
      <button type="submit">Звірити</button>
    </form>
    {periodError && <p role="alert">{periodError}</p>}
    <p aria-live="polite">{error || progress}</p>
    {done && !error && <p className="pdf-comparison-completed" role="status">Звірку завершено. Розбіжностей: {mismatches.length}. Не вдалося порівняти: {reviewOrderNumbers.length} замовлень.</p>}
    <div className="pdf-comparison-table"><table><thead><tr><th>Замовлення</th><th>PDF</th><th>Портал</th><th>Сума PDF</th><th>Різниця</th><th>Результат</th></tr></thead><tbody>{mismatches.map((row, index) => <tr key={index} className="pdf-comparison-mismatch"><td>{orderLabel(row)}<small>{row.dealer}</small></td><td>{row.file || "—"}<small>{row.evidence}</small></td><td>{money(row.portal, row.currency)}</td><td>{money(row.pdf, row.pdfCurrency)}</td><td>{money(row.difference, row.currency)}</td><td>{row.status}</td></tr>)}</tbody></table></div>
    {done && !mismatches.length && !error && <p>Підтверджених розбіжностей не знайдено.</p>}
    {reviewCount > 0 && <p>Не вдалося порівняти: {reviewCount} файлів / замовлень. Вони не враховані як збіги.</p>}
    {reviewOrderNumbers.length > 0 && <p>Номери замовлень, які не вдалося порівняти ({reviewOrderNumbers.length}): {reviewOrderNumbers.join(", ")}</p>}
    {reviewReasons.size > 0 && <div><h3>Причини, чому не вдалося порівняти</h3>{[...reviewReasons].map(([reason, numbers]) => <p key={reason}><strong>{reason} ({numbers.size})</strong><br />{[...numbers].join(", ")}</p>)}</div>}
  </section></div>, document.body);
}
