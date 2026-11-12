import { lazy, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axios";
import { useAuthGetRole } from "../hooks/useAuthGetRole";
import { hasFinanceAccess } from "../utils/financeAccess";
import "./DealerReportsPage.css";

const HomePage = lazy(() => import("./HomePage"));
const ProductionStatisticsPage = lazy(() => import("./ProductionStatisticsPage"));

const formatNumber = new Intl.NumberFormat("uk-UA");

function MyOrdersOverview({ dateFrom, dateTo, monthStart, monthControls }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    axiosInstance.get("/order/get_orders_info/", {
      params: { date_from: dateFrom, date_to: dateTo },
      signal: controller.signal,
    }).then(({ data: response }) => {
      if (!Array.isArray(response?.data?.calculation)) throw new Error("Orders response is missing");
      setData(response.data.calculation);
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [dateFrom, dateTo]);

  const orders = new Map();
  for (const calculation of data || []) {
    for (const order of calculation.orders || []) {
      const key = order.idGuid || order.number;
      if (key) orders.set(key, order);
    }
  }
  const statuses = new Map();
  let constructions = 0;
  for (const order of orders.values()) {
    const status = order.status || "Без статусу";
    statuses.set(status, (statuses.get(status) || 0) + 1);
    constructions += Number(order.count) || 0;
  }
  const totals = [["Прорахунки", data?.length || 0], ["Замовлення", orders.size], ["Конструкції в замовленнях", constructions]];

  return <main className="dealer-reports-page">
    <section className="dealer-reports-hero">
      <div><h1>Основні показники</h1><p>Аналітика за {monthStart.toLocaleDateString("uk-UA", { month: "long", year: "numeric" })}.</p></div>
      <div className="dashboard-summary-actions">
        {monthControls}
        <Link className="dealer-reports-link" to="/orders">До замовлень →</Link>
      </div>
    </section>
    {error ? <p className="dealer-reports-state is-error" role="alert">Не вдалося завантажити аналітику.</p>
      : !data ? <p className="dealer-reports-state" role="status">Завантажуємо аналітику…</p>
      : <>
        <section className="dealer-reports-cards" aria-label="Підсумки за місяць">
          {totals.map(([label, value]) => <article className="dealer-reports-card" key={label}>
            <div className="dealer-reports-card__label">{label}</div>
            <div className="dealer-reports-card__value">{formatNumber.format(value)}</div>
          </article>)}
        </section>
        <section className="dealer-reports-panel">
          <div className="dealer-reports-panel__header"><h3>Замовлення за статусами</h3></div>
          {statuses.size ? <table className="dealer-reports-table"><thead><tr><th>Статус</th><th>Замовлення</th></tr></thead>
            <tbody>{[...statuses].sort((a, b) => b[1] - a[1]).map(([status, count]) => <tr key={status}><td>{status}</td><td>{formatNumber.format(count)}</td></tr>)}</tbody>
          </table> : <p className="dealer-reports-state">За цей період замовлень немає.</p>}
        </section>
      </>}
  </main>;
}

export default function Dashboard({ variant = "classic" }) {
  const { isDealer, isBackoffice, role, user } = useAuthGetRole();
  const [year, month, day] = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Kyiv' })
    .format(new Date()).split('-').map(Number);
  const [offset, setOffset] = useState(() => day <= 4 ? -1 : 0);
  if (!isDealer && !isBackoffice) return null;

  const monthStart = new Date(year, month - 1 + offset, 1);
  const monthEnd = new Date(year, month + offset, 0);
  const datePrefix = monthStart.getFullYear() + '-' + String(monthStart.getMonth() + 1).padStart(2, '0');
  const dateFrom = datePrefix + '-01';
  const dateTo = datePrefix + '-' + monthEnd.getDate();
  const monthControls = <div className="dashboard-month-controls" role="group" aria-label="Місяць дашборда">
    <button type="button" aria-pressed={offset === -1} onClick={() => setOffset(-1)}>Попередній місяць</button>
    <button type="button" aria-pressed={offset === 0} onClick={() => setOffset(0)}>Поточний місяць</button>
  </div>;
  const profileMonths = Array.from({ length: month }, (_, index) => {
    const start = new Date(year, index, 1);
    const end = new Date(year, index + 1, 0);
    const prefix = start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0');
    return { from: prefix + '-01', to: prefix + '-' + end.getDate(), label: start.toLocaleDateString('uk-UA', { month: 'short' }) };
  });
  const periodProps = { dashboardPeriod: { from: dateFrom, to: dateTo }, monthControls, profileMonths };

  const overview = isDealer
    ? (hasFinanceAccess(user) ? <ProductionStatisticsPage summaryOnly summaryVariant={variant} key={dateFrom} {...periodProps} /> : <MyOrdersOverview key={dateFrom} {...{ dateFrom, dateTo, monthStart, monthControls }} />)
    : <ProductionStatisticsPage portfolio allDealers={role === "admin"} summaryVariant={variant} key={dateFrom} {...periodProps} />;

  return <>
    {overview}
    <HomePage companyInfoOnly />
  </>;
}
