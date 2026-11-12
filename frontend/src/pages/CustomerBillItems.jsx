import { useEffect, useState } from "react";
import { FileText, Download, ChevronDown, Search, CalendarDays, ChevronLeft, ChevronRight, CheckCircle2, Clock3, Loader2 } from "lucide-react";
import axiosInstance from "../api/axios";
import DealerSelect from "./DealerSelect";
import { useDealerContext } from "../hooks/useDealerContext";
import { useNotification } from "../hooks/useNotification";
import { readOrderReportPeriod, saveOrderReportPeriod } from "../utils/orderReportPeriod";
import "./CustomerBillItems.css";

const money = (value) => Number(value ?? 0).toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const quantity = (value) => Number(value ?? 0).toLocaleString("uk-UA", { maximumFractionDigits: 3 });
const date = (value) => value ? new Date(value).toLocaleDateString("uk-UA") : "—";
const errorText = (error) => error.response?.data?.detail || error.response?.data?.error || "Не вдалося завантажити рахунки. Спробуйте ще раз.";
const initialPeriod = () => {
  const saved = readOrderReportPeriod();
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return {
    dateFrom: saved?.dateFrom || `${year}-${month}-01`,
    dateTo: saved?.dateTo || `${year}-${month}-${String(new Date(year, now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`,
  };
};

function BillDetails({ bill, contractor }) {
  const [state, setState] = useState({ loading: true });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    axiosInstance.get("/payments/dealers/bill-items/", {
      params: { bill: bill.BillGuid, ...(contractor ? { contractor } : {}) },
      signal: controller.signal,
    }).then(({ data }) => {
      if (!controller.signal.aborted) setState({ data });
    }).catch((error) => {
      if (!controller.signal.aborted) setState({ error: errorText(error) });
    });
    return () => controller.abort();
  }, [bill.BillGuid, contractor, retry]);

  if (state.loading) return <p role="status">Завантаження позицій…</p>;
  if (state.error) return <div role="alert">{state.error} <button type="button" onClick={() => { setState({ loading: true }); setRetry((value) => value + 1); }}>Повторити</button></div>;
  const { items, totals, document } = state.data;
  const units = new Set(items.map((item) => item.Unit || "—"));
  const totalQuantity = items.reduce((sum, item) => sum + Number(item.Quantity || 0), 0);
  return <div className="bill-items-detail">
    <div className="bill-items-comment"><strong>Коментар до рахунку</strong><p>{document.Comment?.trim() || bill.Comment?.trim() || "Коментар не заповнено."}</p></div>
    <div className="bill-items-detail-title"><span>Товарні позиції</span><span>{totals.LineCount} поз.</span></div>
    <div className="bill-items-scroll" tabIndex={0} aria-label="Товарні позиції рахунку">
      <table className="bill-items-table">
        <caption className="bill-items-caption">Товари рахунку № {document.BillNumber} · {document.Currency || "валюту не вказано"}</caption>
        <thead><tr><th scope="col">№</th><th scope="col">Номенклатура</th><th scope="col">Характеристика</th><th scope="col">Виробнича характеристика</th><th scope="col">Кількість</th><th scope="col">Од.</th><th scope="col">Коеф.</th><th scope="col">Ціна</th><th scope="col">Ручна знижка, %</th><th scope="col">Авт. знижка, %</th><th scope="col">Сума</th><th scope="col">ПДВ</th></tr></thead>
        <tbody>{items.map((item) => <tr key={item.LineNumber}>
          <td>{quantity(item.LineNumber)}</td><td>{item.ItemName || "—"}</td><td>{item.Characteristic || "—"}</td><td>{item.ProductionCharacteristic || "—"}</td>
          <td className="bill-items-number">{quantity(item.Quantity)}</td><td>{item.Unit || "—"}</td><td className="bill-items-number">{quantity(item.Coefficient)}</td><td className="bill-items-number">{money(item.Price)}</td>
          <td className="bill-items-number">{quantity(item.ManualDiscountPercent)}</td><td className="bill-items-number">{quantity(item.AutoDiscountPercent)}</td><td className="bill-items-number">{money(item.Amount)}</td><td className="bill-items-number">{money(item.VATAmount)}</td>
        </tr>)}</tbody>
        <tfoot><tr><th scope="row" colSpan={4}>Разом · {totals.LineCount} поз.</th><td className="bill-items-number">{units.size === 1 ? quantity(totalQuantity) : "—"}</td><td>{units.size === 1 ? [...units][0] : "різні од."}</td><td colSpan={4} /><td className="bill-items-number">{money(totals.GoodsAmount)}</td><td className="bill-items-number">{money(totals.VATAmount)}</td></tr></tfoot>
      </table>
    </div>
    {!items.length && <p>У рахунку немає товарних позицій.</p>}
    <div className="bill-items-totals">
      <span><small>Сума товарів</small><strong>{money(totals.GoodsAmount)} <em>{document.Currency}</em></strong></span>
      <span><small>ПДВ {document.SumIncludesVAT ? "у сумі" : "зверху"}</small><strong>{money(totals.VATAmount)} <em>{document.Currency}</em></strong></span>
      <span className="bill-items-grand-total"><small>Сума документа</small><strong>{money(document.DocumentAmount)} <em>{document.Currency}</em></strong></span>
    </div>
    <p className="bill-items-note">Послуги та інші нарахування можуть впливати на суму документа.</p>
  </div>;
}

export default function CustomerBillItems() {
  const { dealerGuid, setDealerGuid, isAdmin, isLoading } = useDealerContext();
  const [period, setPeriod] = useState(initialPeriod);
  const [selection, setSelection] = useState(() => ({ ...initialPeriod(), page: 1, refresh: 0 }));
  const [state, setState] = useState({ loading: true });
  const [expanded, setExpanded] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(null);
  const { addNotification } = useNotification();
  const contractor = isAdmin ? dealerGuid : null;

  const downloadPdf = async (bill) => {
    setPdfBusy(bill.BillGuid);
    try {
      const response = await axiosInstance.get("/payments/dealers/bill-items/", {
        params: { bill: bill.BillGuid, download: "pdf", ...(contractor ? { contractor } : {}) }, responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = `Рахунок-${bill.BillNumber.trim().replace(/[^\p{L}\p{N}._-]/gu, "_")}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      addNotification("PDF рахунку сформовано", "success");
    } catch {
      addNotification("Не вдалося сформувати PDF. Спробуйте ще раз.", "error");
    } finally { setPdfBusy(null); }
  };

  useEffect(() => {
    if (isLoading || (isAdmin && (!dealerGuid || dealerGuid === "__ALL__"))) return;
    const controller = new AbortController();
    axiosInstance.get("/payments/dealers/bill-items/", {
      params: { date_from: selection.dateFrom, date_to: selection.dateTo, page: selection.page, ...(contractor ? { contractor } : {}) },
      signal: controller.signal,
    }).then(({ data }) => {
      if (!controller.signal.aborted) setState({ data });
    }).catch((error) => {
      if (!controller.signal.aborted) setState({ error: errorText(error) });
    });
    return () => controller.abort();
  }, [contractor, dealerGuid, isAdmin, isLoading, selection]);

  const search = (event) => {
    event.preventDefault();
    setExpanded(null);
    setState({ loading: true });
    setSelection((previous) => ({ ...period, page: 1, refresh: previous.refresh + 1 }));
    saveOrderReportPeriod({ ...period, mode: "period", year: period.dateFrom.slice(0, 4), month: 0 });
  };
  const changePage = (page) => {
    setExpanded(null);
    setState({ loading: true });
    setSelection((previous) => ({ ...previous, page }));
  };
  const needsDealer = isAdmin && (!dealerGuid || dealerGuid === "__ALL__");
  return <section className="bill-items-page" aria-label="Рахунки — товари">
    <header className="bill-items-hero"><div><span className="bill-items-eyebrow">Фінанси / Документи</span><h1>Рахунки</h1><p>Товари, ціни та підсумки кожного рахунку — з можливістю завантажити PDF.</p></div><div className="bill-items-hero-icon" aria-hidden="true"><FileText size={32} /></div></header>
    <form className="bill-items-filters" onSubmit={search}>
      <div className="bill-items-filter-heading"><CalendarDays size={18} /><span>Період рахунків</span></div>
      <label>З дати<input type="date" required value={period.dateFrom} onChange={(event) => setPeriod({ ...period, dateFrom: event.target.value })} /></label>
      <label>До дати<input type="date" required min={period.dateFrom} value={period.dateTo} onChange={(event) => setPeriod({ ...period, dateTo: event.target.value })} /></label>
      {isAdmin && <div className="bill-items-dealer"><span>Контрагент</span><DealerSelect value={dealerGuid} onChange={(value) => { setDealerGuid(value); setExpanded(null); setState({ loading: true }); setSelection((previous) => ({ ...previous, page: 1 })); }} /></div>}
      <button type="submit" className="bill-items-primary" disabled={needsDealer || isLoading}><Search size={17} />Показати рахунки</button>
    </form>
    {needsDealer ? <div className="bill-items-empty"><FileText size={32} /><h2>Оберіть контрагента</h2><p>Його рахунки з’являться тут після вибору у фільтрі.</p></div> : isLoading || state.loading ? <div role="status" className="bill-items-empty"><Loader2 className="bill-items-spin" size={28} /><p>Завантаження рахунків…</p></div> : state.error ? <div role="alert" className="bill-items-empty bill-items-error"><p>{state.error}</p><button type="button" className="bill-items-secondary" onClick={() => { setState({ loading: true }); setSelection((previous) => ({ ...previous, refresh: previous.refresh + 1 })); }}>Спробувати ще раз</button></div> : <>
      <div className="bill-items-list-heading"><div><h2>Документи <span>{state.data.count}</span></h2><p>{date(selection.dateFrom)} — {date(selection.dateTo)}</p></div><span>Розгорніть рахунок, щоб переглянути товари</span></div>
      {!state.data.items.length && <div className="bill-items-empty"><FileText size={32} /><h2>Рахунків поки немає</h2><p>Спробуйте вибрати інший період.</p></div>}
      {state.data.items.map((bill) => <article key={bill.BillGuid} className={`bill-items-document${expanded === bill.BillGuid ? " is-open" : ""}`}>
        <div className="bill-items-document-header">
        <button type="button" className="bill-items-document-toggle" aria-expanded={expanded === bill.BillGuid} aria-controls={`bill-${bill.BillGuid}`} onClick={() => setExpanded(expanded === bill.BillGuid ? null : bill.BillGuid)}>
          <span className="bill-items-file-icon"><FileText size={21} /></span>
          <span className="bill-items-document-info"><strong>№ {bill.BillNumber}</strong><small>{date(bill.BillDate)}<span className={`bill-items-status ${bill.IsPosted ? "is-posted" : "is-draft"}`}>{bill.IsPosted ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}{bill.IsPosted ? "Проведений" : "Не проведений"}</span></small><span className="bill-items-contractor">{bill.ContractorName}</span></span>
          <span className="bill-items-document-amount"><small>Сума документа</small><strong>{money(bill.DocumentAmount)} <em>{bill.Currency}</em></strong></span><ChevronDown className="bill-items-chevron" size={18} />
        </button>
        <button type="button" className="bill-items-pdf" disabled={pdfBusy !== null} onClick={() => downloadPdf(bill)} aria-label={`Завантажити PDF рахунку ${bill.BillNumber}`} title="Завантажити PDF з товарними позиціями">{pdfBusy === bill.BillGuid ? <Loader2 className="bill-items-spin" size={17} /> : <Download size={17} />}<span>{pdfBusy === bill.BillGuid ? "Формування…" : "PDF"}</span></button>
        </div>
        {expanded !== bill.BillGuid && bill.Comment?.trim() && <div className="bill-items-comment"><strong>Коментар</strong><p>{bill.Comment}</p></div>}
        {expanded === bill.BillGuid && <div id={`bill-${bill.BillGuid}`}><BillDetails bill={bill} contractor={contractor} /></div>}
      </article>)}
      {state.data.count > 50 && <nav className="bill-items-pagination" aria-label="Сторінки рахунків">
        <button type="button" disabled={selection.page === 1} onClick={() => changePage(selection.page - 1)}><ChevronLeft size={16} />Попередня</button>
        <span>Сторінка {selection.page} з {Math.ceil(state.data.count / 50)}</span>
        <button type="button" disabled={selection.page * 50 >= state.data.count} onClick={() => changePage(selection.page + 1)}>Наступна<ChevronRight size={16} /></button>
      </nav>}
    </>}
  </section>;
}

