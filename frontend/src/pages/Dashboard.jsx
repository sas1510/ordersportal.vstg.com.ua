import { lazy, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axios";
import { useAuthGetRole } from "../hooks/useAuthGetRole";
import { hasFinanceAccess } from "../utils/financeAccess";
import "./DealerReportsPage.css";

const HomePage = lazy(() => import("./HomePage"));
const ProductionStatisticsPage = lazy(() => import("./ProductionStatisticsPage"));

const formatNumber = new Intl.NumberFormat("uk-UA");

function MyOrdersOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const now = new Date();
  const monthOffset = now.getDate() === 1 ? -1 : 0;
  const monthStart = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0);
  const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const dateFrom = formatDate(monthStart);
  const dateTo = formatDate(monthEnd);

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
      <Link className="dealer-reports-link" to="/orders">До замовлень →</Link>
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
  if (!isDealer && !isBackoffice) return null;

  const overview = isDealer
    ? (hasFinanceAccess(user) ? <ProductionStatisticsPage summaryOnly summaryVariant={variant} summaryPeriod="dashboard-month" /> : <MyOrdersOverview />)
    : <ProductionStatisticsPage portfolio allDealers={role === "admin"} summaryVariant={variant} summaryPeriod="dashboard-month" />;

  return <>
    {overview}
    <HomePage companyInfoOnly />
  </>;
}
