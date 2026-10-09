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
  const [minimumDifference, setMinimumDifference] = useState("2");
  const [differenceSign, setDifferenceSign] = useState("all");
  const threshold = Math.max(2, Number(String(minimumDifference).replace(",", ".")) || 2);
  const mismatches = rows.filter((row) => row.difference != null && row.difference !== 0 && Math.abs(row.difference) >= threshold && (differenceSign === "all" || (differenceSign === "positive" ? row.difference > 0 : row.difference < 0)));
  const orderUrl = (row) => {
    const params = new URLSearchParams({ search: row.order || "" });
    if (admin) {
      params.set("date_from", appliedPeriod.dateFrom);
      params.set("date_to", appliedPeriod.dateTo);
    } else {
      const year = String(row.orderDate || appliedPeriod.dateFrom).slice(0, 4);
      params.set("year", year);
    }
    return `${admin ? "/admin-order" : "/orders"}?${params}`;
  };
  const openPdf = async (row) => {
    const tab = window.open("", "_blank");
    if (!tab) {
      addNotification("Дозвольте відкриття нових вкладок у браузері", "warning");
      return;
    }
    tab.opener = null;
    tab.document.title = row.file;
    tab.document.body.textContent = "Завантаження PDF…";
    try {
      const response = await axios.get(`/order/${row.orderGuid}/files/${row.fileGuid}/download/`, { params: { filename: row.file }, responseType: "blob" });
      const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      if (tab.closed) { URL.revokeObjectURL(url); return; }
      tab.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      tab.close();
      addNotification("Не вдалося відкрити PDF. Спробуйте ще раз.", "error");
    }
  };
  const copyNumbers = async () => {
    const text = [...new Set(mismatches.map((row) => row.order).filter(Boolean))].join(", ");
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const input = document.createElement("textarea");
        input.value = text;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.left = "-9999px";
        const previousFocus = document.activeElement;
        document.body.appendChild(input);
        try {
          input.select();
          if (!document.execCommand("copy")) throw new Error("Clipboard unavailable");
        } finally {
          input.remove();
          previousFocus?.focus();
        }
      }
      addNotification("Номери замовлень скопійовано", "success");
    } catch {
      addNotification("Не вдалося скопіювати номери. Перевірте дозвіл браузера на буфер обміну.", "warning");
    }
  };
  const exportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const data = [["Замовлення", "Дата", "Дилер", "PDF", "Сума порталу", "Валюта порталу", "Сума PDF", "Валюта PDF", "Різниця", "Підсумок у PDF"]];
      mismatches.forEach((row) => {
        const day = String(row.orderDate || "").slice(0, 10);
        const date = /^\d{4}-\d{2}-\d{2}$/.test(day) ? (Date.parse(`${day}T00:00:00Z`) - Date.UTC(1899, 11, 30)) / 86400000 : "";
        data.push([String(row.order || ""), date, String(row.dealer || ""), String(row.file || ""), Number(row.portal), row.currency || "", Number(row.pdf), row.pdfCurrency || "", Number(row.difference), row.evidence || ""]);
      });
      const sheet = XLSX.utils.aoa_to_sheet(data);
      sheet["!cols"] = [20, 14, 35, 28, 19, 18, 19, 18, 19, 65].map((wch) => ({ wch }));
      sheet["!autofilter"] = { ref: sheet["!ref"] };
      for (let index = 2; index <= data.length; index++) {
        if (sheet[`B${index}`]?.t === "n") sheet[`B${index}`].z = "dd.mm.yy";
        ["E", "G", "I"].forEach((column) => { if (sheet[`${column}${index}`]) sheet[`${column}${index}`].z = "#,##0.00"; });
        sheet[`A${index}`].l = { Target: new URL(orderUrl(mismatches[index - 2]), window.location.origin).href };
      }
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, "Розбіжності");
      XLSX.writeFile(book, `PDF-звірка_${appliedPeriod.dateFrom}_${appliedPeriod.dateTo}.xlsx`);
    } catch {
      addNotification("Не вдалося експортувати Excel", "warning");
    }
  };
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
        const orders = calculations.flatMap((calc) => (calc.orders || []).map((order) => ({ ...order, calculationNumber: calc.number || calc.webNumber || "", dealer: calc.dealer || calc.contractorName || calc.dealerName || "" }))).filter((order) => {
          if (/^34\s*[-‐‑‒–—]/.test(String(order.number || "").trim())) return false;
          if (!order.idGuid || seen.has(order.idGuid)) return false;
          seen.add(order.idGuid);
          return true;
        });
        for (const [index, order] of orders.entries()) {
          if (signal.aborted) return;
          setProgress(`${dateFrom} — ${dateTo} · Замовлення ${index + 1} із ${orders.length}`);
          const base = { order: order.number, orderDate: order.dateRaw || order.date, calculationNumber: order.calculationNumber, dealer: order.dealer, portal: order.amount, currency: order.currency };
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
                append({ ...base, orderGuid: order.idGuid, fileGuid: file.fileGuid, file: file.fileName, pdf: data.amount, pdfCurrency: data.currency, difference, evidence: data.evidence, status: data.status !== "extracted" ? data.reason : !sameCurrency ? "Перевірте валюту" : difference === 0 ? "Збігається" : "Розбіжність" });
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
      <label className="pdf-comparison-difference">Розбіжність від<input aria-label="Мінімальна розбіжність у валюті замовлення" title="У валюті замовлення, мінімум 2" type="number" min="2" step="0.01" value={minimumDifference} onChange={(event) => setMinimumDifference(event.target.value)} onBlur={() => setMinimumDifference(String(threshold))} /></label>
      <div className="pdf-comparison-sign" title="Різниця = сума PDF − сума порталу">
        <label><input type="checkbox" checked={differenceSign === "positive"} onChange={(event) => setDifferenceSign(event.target.checked ? "positive" : "all")} />Тільки +</label>
        <label><input type="checkbox" checked={differenceSign === "negative"} onChange={(event) => setDifferenceSign(event.target.checked ? "negative" : "all")} />Тільки −</label>
      </div>
      <button type="submit">Звірити</button>
    <div className="pdf-comparison-export-actions">
      <button type="button" disabled={!done || !!error || !mismatches.length} onClick={copyNumbers}>Скопіювати всі номери</button>
      <button type="button" disabled={!done || !!error || !mismatches.length} onClick={exportExcel}>Експорт Excel</button>
    </div>
    </form>
    {periodError && <p role="alert">{periodError}</p>}
    <p aria-live="polite">{error || progress}</p>
    {done && !error && <p className="pdf-comparison-completed" role="status">Звірку завершено. Розбіжностей: {mismatches.length}. Не вдалося порівняти: {reviewOrderNumbers.length} замовлень.</p>}
    <div className="pdf-comparison-table"><table><thead><tr><th>Замовлення</th><th>PDF</th><th>Портал</th><th>Сума PDF</th><th>Різниця</th><th>Результат</th></tr></thead><tbody>{mismatches.map((row, index) => <tr key={index} className="pdf-comparison-mismatch"><td><a href={orderUrl(row)} target="_blank" rel="noopener noreferrer">{orderLabel(row)}</a>{row.calculationNumber && <small>{row.calculationNumber}</small>}<small>{row.dealer}</small></td><td>{row.fileGuid ? <button type="button" className="pdf-comparison-file-link" title="Відкрити PDF у новій вкладці" onClick={() => openPdf(row)}>{row.file}</button> : row.file || "—"}<small>{row.evidence}</small></td><td>{money(row.portal, row.currency)}</td><td>{money(row.pdf, row.pdfCurrency)}</td><td>{money(row.difference, row.currency)}</td><td>{row.status}</td></tr>)}</tbody></table></div>
    {done && !mismatches.length && !error && <p>Розбіжностей за заданим порогом не знайдено.</p>}
    {reviewCount > 0 && <p>Не вдалося порівняти: {reviewCount} файлів / замовлень. Вони не враховані як збіги.</p>}
    {reviewOrderNumbers.length > 0 && <p>Номери замовлень, які не вдалося порівняти ({reviewOrderNumbers.length}): {reviewOrderNumbers.join(", ")}</p>}
    {reviewReasons.size > 0 && <div><h3>Причини, чому не вдалося порівняти</h3>{[...reviewReasons].map(([reason, numbers]) => <p key={reason}><strong>{reason} ({numbers.size})</strong><br />{[...numbers].join(", ")}</p>)}</div>}
  </section></div>, document.body);
}
