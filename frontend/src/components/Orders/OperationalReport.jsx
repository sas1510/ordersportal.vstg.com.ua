import { useEffect, useMemo, useRef, useState } from "react";
import axios from "../../api/axios";
import { buildOperationalReport } from "../../utils/operationalReport";
import { paymentDebtTotals } from "../../utils/paymentDebtTotals";
import { belongsToDealerGroup } from "../../utils/reportDataset";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function OperationalReport({ data, loading, error, dealerGroup, dealerGuid, dateFrom, dateTo }) {
  const [tab, setTab] = useState("risks");
  const [onlyMissingDelay, setOnlyMissingDelay] = useState(false);
  const [filter, setFilter] = useState("all");
  const [deliveryDay, setDeliveryDay] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [delayRange, setDelayRange] = useState("");
  const [riskDealer, setRiskDealer] = useState("");
  const [dealerMenuOpen, setDealerMenuOpen] = useState(false);
  const [delaySort, setDelaySort] = useState("desc");
  const dealerTable = useRef(null), deliveryTable = useRef(null), riskTable = useRef(null);
  const drillDown = (chart, entry) => {
    const name = entry?.payload?.name || entry?.name;
    if (!name) return;
    let target;
    if (chart === "Активність дилерів") { setFilter(name === "Регулярні" ? "regular" : name === "Без нових >30 днів" ? "inactive" : "active"); target = dealerTable; }
    else if (chart === "Доставки за днями") { setDeliveryDay(name); target = deliveryTable; }
    else { setDelayRange(name); target = riskTable; }
    requestAnimationFrame(() => target.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const [debts, setDebts] = useState({});
  const [debtsLoading, setDebtsLoading] = useState(false);
  const debtController = useRef(null);
  const report = useMemo(() => buildOperationalReport(data.filter((calc) => dealerGroup ? belongsToDealerGroup(calc, dealerGroup) : !dealerGuid || dealerGuid === "__ALL__" || String(calc.dealerId).toLowerCase() === String(dealerGuid).toLowerCase())), [data, dealerGuid, dealerGroup]);
  useEffect(() => { debtController.current?.abort(); setDebts({}); setDebtsLoading(false); return () => debtController.current?.abort(); }, [data, dealerGuid, dealerGroup]);
  const loadDebts = async () => {
    if (debtsLoading) return;
    const controller = new AbortController(); debtController.current = controller;
    setDebtsLoading(true);
    const results = {}; let index = 0;
    const worker = async () => {
      while (index < report.dealers.length && !controller.signal.aborted) {
        const dealer = report.dealers[index++];
        try {
          const response = await axios.get("/payments/get_dealer_payment_page_data/", { signal: controller.signal, params: { contractor: dealer.id } });
          if (!Array.isArray(response.data.orders)) throw new Error("No orders");
          results[dealer.id] = { totals: paymentDebtTotals(response.data.orders) };
        } catch { if (!controller.signal.aborted) results[dealer.id] = { error: true }; }
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    if (!controller.signal.aborted) { setDebts(results); setDebtsLoading(false); }
  };
  const dealers = report.dealers.filter((dealer) => filter === "all" || (filter === "regular" ? dealer.regular : filter === "inactive" ? dealer.inactive : filter === "active" ? !dealer.regular && !dealer.inactive : !debts[dealer.id] || debts[dealer.id].error || Object.values(debts[dealer.id].totals).some((value) => value > 0)));
  const visibleDeliveries = report.deliveries.filter((order) => !deliveryDay || new Date(order.delivery).toLocaleDateString("uk-UA") === deliveryDay);
  const visibleRisks = report.risks.filter((order) => (!onlyMissingDelay || (order.severity === "high" && order.delayMissing)) && (!riskLevel || order.severity === riskLevel) && (!delayRange || order.delayBucket === delayRange) && (!riskDealer || order.dealerId === riskDealer)).sort((a, b) => {
    if (a.daysLate == null) return b.daysLate == null ? 0 : 1;
    if (b.daysLate == null) return -1;
    return (delaySort === "desc" ? b.daysLate - a.daysLate : a.daysLate - b.daysLate) || String(a.number).localeCompare(String(b.number));
  });
  const money = (value) => Number(value).toLocaleString("uk-UA", { maximumFractionDigits: 2 });
  const alerts = report.risks.filter((order) => order.severity === "high" && order.delayMissing);
  const activityChart = [
    { name: "Регулярні", count: report.dealers.filter((dealer) => dealer.regular).length },
    { name: "Без нових >30 днів", count: report.dealers.filter((dealer) => dealer.inactive).length },
    { name: "Інші активні", count: report.dealers.filter((dealer) => !dealer.regular && !dealer.inactive).length },
  ];
  const deliveryChart = [...new Set(report.deliveries.map((order) => new Date(order.delivery).toLocaleDateString("uk-UA")))].map((day) => ({ name: day, count: report.deliveries.filter((order) => new Date(order.delivery).toLocaleDateString("uk-UA") === day).length }));
  const riskChart = ["1–3 дні", "4–7 днів", "Понад 7 днів"].map((name) => ({ name, count: report.risks.filter((order) => order.delayBucket === name).length }));
  const link = (number) => `/admin-order?${new URLSearchParams({ search: number, date_from: dateFrom, date_to: dateTo })}`;
  return <section className="dealer-reports-panel operational-report">
    <div className="dealer-reports-panel__header"><h3>Дилери й доставки · вибраний період</h3></div>
    <p className="operational-report-hint">Активність дилерів — за вибраний період {dateFrom} — {dateTo}. Затримки — станом на сьогодні серед заявок цього періоду. Доставки — на найближчі 7 днів. Вибрані менеджер і дилер застосовуються до всіх розділів.</p>
    {loading ? <p>Завантаження…</p> : error ? <p role="alert">{error}</p> : <>
      <div className="operational-metrics"><article className="is-risk"><small>Прострочені замовлення</small><strong>{report.risks.filter((order) => order.daysLate > 0).length}</strong></article><article className={alerts.length ? "is-risk" : ""}><small>Потребують дати затримки</small><strong>{alerts.length}</strong></article><article><small>Доставки · 7 днів</small><strong>{report.deliveries.length}</strong></article><article><small>Регулярні дилери</small><strong>{activityChart[0].count}</strong></article></div>
      <div className="operational-tabs" role="tablist" aria-label="Розділи звіту">{[{ id: "risks", title: "Затримки", count: report.risks.length }, { id: "deliveries", title: "Доставки", count: report.deliveries.length }, { id: "dealers", title: "Дилери", count: report.dealers.length }].map((item) => <button key={item.id} id={`operational-tab-${item.id}`} type="button" role="tab" aria-selected={tab === item.id} aria-controls={`operational-panel-${item.id}`} onClick={() => { setTab(item.id); setDealerMenuOpen(false); }}>{item.title}<span>{item.count}</span></button>)}</div>
      {tab === "risks" && !!alerts.length && <div className="operational-risk-alert operational-risk-alert--compact" role="alert"><div><strong>⚠ {alerts.length} замовлень потребують уваги менеджера</strong><p>Готовність не підтверджена, дата затримки не проставлена.</p></div><button type="button" onClick={() => { setOnlyMissingDelay(true); setDelayRange(""); setRiskDealer(""); setRiskLevel(""); riskTable.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Переглянути →</button></div>}
      <div className="operational-charts operational-charts--focused">{[{ tab: "dealers", title: "Активність дилерів", data: activityChart, color: "#89b3d8" }, { tab: "deliveries", title: "Доставки за днями", data: deliveryChart, color: "#b4d947" }, { tab: "risks", title: "Затримка за кількістю днів", data: riskChart, color: "#ef9691" }].filter((chart) => chart.tab === tab).map((chart) => <article key={chart.title}><h4>{chart.title}<small>Натисніть стовпчик, щоб відфільтрувати список</small></h4><ResponsiveContainer width="100%" height={170}><BarChart data={chart.data} margin={{ top: 5, right: 10, left: -20, bottom: 15 }}><CartesianGrid strokeDasharray="3 3" stroke="#84939f55" /><XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8497a7" }} interval={0} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#8497a7" }} /><Tooltip contentStyle={{ background: "#343d43", color: "#fff", border: "1px solid #8394a0" }} /><Bar dataKey="count" name="Кількість" fill={chart.color} maxBarSize={100} radius={[4, 4, 0, 0]} cursor="pointer" onClick={(entry) => drillDown(chart.title, entry)} /></BarChart></ResponsiveContainer></article>)}</div>
      <div id="operational-panel-dealers" role="tabpanel" aria-labelledby="operational-tab-dealers" hidden={tab !== "dealers"}>
      <label ref={dealerTable}>Дилери <select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Усі ({report.dealers.length})</option><option value="regular">Регулярні ({report.dealers.filter((dealer) => dealer.regular).length})</option><option value="inactive">Без замовлень понад 30 днів ({report.dealers.filter((dealer) => dealer.inactive).length})</option><option value="active">Інші активні</option><option value="debt">З боргом</option></select></label>
      <p className="operational-report-hint">Регулярні — замовляли у трьох різних місяцях і протягом останніх 30 днів. Неактивні — раніше замовляли, але понад 30 днів немає нових замовлень.</p>
      <button type="button" onClick={loadDebts} disabled={debtsLoading || !report.dealers.length}>{debtsLoading ? "Завантаження боргів…" : "Оновити борги з оплати"}</button>
      <div className="operational-report-scroll"><table><thead><tr><th>Дилер</th><th>Замовлень</th><th>Останнє замовлення</th><th>Борг · сторінка оплати</th></tr></thead><tbody>{dealers.map((dealer) => <tr key={dealer.id}><td>{dealer.name}</td><td>{dealer.orders}</td><td>{new Date(dealer.last).toLocaleDateString("uk-UA")}</td><td>{!debts[dealer.id] ? "Ще не завантажено" : debts[dealer.id].error ? "Не вдалося завантажити" : Object.keys(debts[dealer.id].totals).length ? Object.entries(debts[dealer.id].totals).map(([currency, value]) => <div key={currency}>{money(value)} {currency}</div>) : "Немає замовлень до оплати"}</td></tr>)}{!dealers.length && <tr><td colSpan="4">Немає дилерів за цим фільтром.</td></tr>}</tbody></table></div>
      <p className="operational-report-hint">Борг — залишок до оплати за даними сторінки оплати, без номерів 34-, окремо за валютами. Зростання боргу потребує історії залишків. Фільтр «З боргом» залишає неперевірені дані видимими.</p>
      </div>
      <div id="operational-panel-deliveries" role="tabpanel" aria-labelledby="operational-tab-deliveries" hidden={tab !== "deliveries"}>
      <h3 ref={deliveryTable}>Доставки найближчих 7 днів · {visibleDeliveries.length}{deliveryDay && <> · {deliveryDay} <button type="button" onClick={() => setDeliveryDay("")}>Усі дати ×</button></>}</h3>
      <div className="operational-report-scroll"><table><thead><tr><th>Доставка</th><th>Замовлення</th><th>Дилер</th><th>Статус</th></tr></thead><tbody>{visibleDeliveries.map((order) => <tr key={order.idGuid || order.number}><td>{new Date(order.delivery).toLocaleString("uk-UA")}</td><td><a href={link(order.number)}>{order.number}</a><small className="operational-calc-number">Прорахунок: {order.calculation || "—"}</small></td><td>{order.dealer}</td><td>{order.status}</td></tr>)}{!visibleDeliveries.length && <tr><td colSpan="4">Немає запланованих доставок.</td></tr>}</tbody></table></div>
      </div>
      <div id="operational-panel-risks" role="tabpanel" aria-labelledby="operational-tab-risks" hidden={tab !== "risks"}>
      <h3 ref={riskTable}>Замовлення із затримкою або ризиком · {visibleRisks.length}</h3>
      <p className="operational-report-hint">Найбільші затримки — першими. Термін сьогодні ще не вважається простроченим.</p>
      <div className="operational-risk-filters">
        <label>Ризик <select value={riskLevel} onChange={(event) => setRiskLevel(event.target.value)}><option value="">Усі</option><option value="high">Високий</option><option value="medium">Увага</option></select></label>
        <label className="operational-missing-filter"><input type="checkbox" checked={onlyMissingDelay} onChange={(event) => setOnlyMissingDelay(event.target.checked)} /> Потребують дати затримки</label>
        {delayRange && <button type="button" onClick={() => setDelayRange("")}>Затримка: {delayRange} ×</button>}
        <label>Сортування <select value={delaySort} onChange={(event) => setDelaySort(event.target.value)}><option value="desc">Найбільша затримка спочатку</option><option value="asc">Найменша затримка спочатку</option></select></label>
        <div style={{ position: "relative", maxWidth: "100%" }} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDealerMenuOpen(false); }} onKeyDown={(event) => { if (event.key === "Escape") setDealerMenuOpen(false); }}>
          <span>Дилер </span><button type="button" aria-expanded={dealerMenuOpen} aria-controls="risk-dealer-options" onClick={() => setDealerMenuOpen((open) => !open)}>{report.dealers.find((dealer) => dealer.id === riskDealer)?.name || "Усі дилери"} ▾</button>
          {dealerMenuOpen && <div id="risk-dealer-options" style={{ position: "absolute", top: "100%", left: 0, zIndex: 20, marginTop: 4, width: "max-content", minWidth: "100%", maxWidth: "min(420px, 80vw)", maxHeight: 220, overflowY: "auto", background: "#383735", border: "1px solid #89b3d8", borderRadius: 4, padding: 4, boxShadow: "0 5px 15px #0005" }}>
            {[{ id: "", name: "Усі дилери" }, ...report.dealers.filter((dealer) => report.risks.some((order) => order.dealerId === dealer.id))].map((dealer) => <button key={dealer.id} type="button" aria-pressed={riskDealer === dealer.id} style={{ display: "block", width: "100%", textAlign: "left", whiteSpace: "normal", margin: 0, border: 0, background: riskDealer === dealer.id ? "#89b3d8" : "transparent", color: riskDealer === dealer.id ? "#203545" : "#fff" }} onClick={() => { setRiskDealer(dealer.id); setDealerMenuOpen(false); }}>{dealer.name}</button>)}
          </div>}
        </div>
        {(delayRange || riskDealer || riskLevel || onlyMissingDelay) && <button type="button" onClick={() => { setDelayRange(""); setRiskDealer(""); setRiskLevel(""); setOnlyMissingDelay(false); }}>Скинути фільтри ×</button>}
      </div>
      <div className="operational-report-scroll"><table><thead><tr><th>Замовлення</th><th>Дилер</th><th>Ризик</th><th>Причина ризику</th><th>Останній термін</th><th>Днів прострочення</th><th>Дата затримки</th></tr></thead><tbody>{visibleRisks.map((order) => <tr className={order.severity === "high" && order.delayMissing ? "operational-risk-row" : ""} key={order.idGuid || order.number}><td><a href={link(order.number)}>{order.number}</a><small className="operational-calc-number">Прорахунок: {order.calculation || "—"}</small></td><td>{order.dealer}</td><td>{order.severity === "high" ? "Високий" : "Увага"}</td><td>{order.reason}</td><td>{order.deadline ? new Date(order.deadline).toLocaleDateString("uk-UA") : "—"}</td><td>{order.daysLate ?? "—"}{order.daysLate > 0 && <small style={{ display: "block" }}>{order.delayBucket}</small>}</td><td>{order.delayMissing ? "Не проставлена" : new Date(order.dateDelay).toLocaleDateString("uk-UA")}</td></tr>)}{!visibleRisks.length && <tr><td colSpan="7">За доступними датами ризиків не виявлено.</td></tr>}</tbody></table></div>
      </div>
    </>}
  </section>;
}

