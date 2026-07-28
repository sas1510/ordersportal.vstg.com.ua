import { useCallback, useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axios";
import DealerSelectWithAll from "./DealerSelectWithAll";
import { useDealerContext } from "../hooks/useDealerContext";
import "./OrdersReportDashboardPage.css";

const STATUSES = [
  { status: "Новий", title: "Нові", className: "is-new" },
  { status: "Очікуємо підтвердження", title: "Очікують підтвердження", className: "is-confirmation" },
  { status: "Очікуємо оплату", title: "Очікують оплату", className: "is-payment" },
];

const dateInput = (date) => date.toISOString().slice(0, 10);
const currentMonthStart = () => {
  const date = new Date();
  return dateInput(new Date(date.getFullYear(), date.getMonth(), 1));
};

function getAge(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return { text: "Дата невідома", minutes: -1, date: null };
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  return { text: days ? `${days} дн. ${hours} год.` : `${hours} год. ${minutes % 60} хв.`, minutes, date };
}

export default function OrdersReportDashboardPage() {
  const { dealerGuid, setDealerGuid } = useDealerContext();
  const [dateFrom, setDateFrom] = useState(currentMonthStart);
  const [dateTo, setDateTo] = useState(() => dateInput(new Date()));
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    if (!dateFrom || !dateTo || dateFrom > dateTo) {
      setError("Вкажіть коректний період звітності.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get("/order/get_orders_info_all/", { params: { date_from: dateFrom, date_to: dateTo } });
      if (response.data?.status !== "success") throw new Error();
      setCalculations(response.data?.data?.calculation || []);
    } catch (requestError) {
      setCalculations([]);
      setError(requestError.response?.data?.error || "Не вдалося завантажити дані звіту.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const visibleCalculations = useMemo(() => !dealerGuid || dealerGuid === "__ALL__" ? calculations : calculations.filter((calculation) => String(calculation.dealerId || "").toLowerCase() === String(dealerGuid).toLowerCase()), [calculations, dealerGuid]);
  const grouped = useMemo(() => {
    const result = Object.fromEntries(STATUSES.map(({ status }) => [status, []]));
    visibleCalculations.forEach((calculation) => {
      const orders = Array.isArray(calculation.orders) ? calculation.orders : [];
      if (!orders.length) {
        result.Новий.push({ number: calculation.number || "Без номера", manager: "Не вказано", dealer: calculation.dealer || "Не вказано", dateValue: calculation.dateRaw });
        return;
      }
      orders.forEach((order) => {
        if (Object.hasOwn(result, order.status)) result[order.status].push({
          number: order.number || "Без номера",
          manager: order.managerName || "Не вказано",
          dealer: calculation.dealer || "Не вказано",
          dateValue: order.createDate || order.dateRaw || calculation.dateRaw,
        });
      });
    });
    Object.values(result).forEach((orders) => orders.sort((a, b) => getAge(b.dateValue).minutes - getAge(a.dateValue).minutes));
    return result;
  }, [visibleCalculations]);


  const total = Object.values(grouped).reduce((sum, orders) => sum + orders.length, 0);
  const openOrder = (number) => `/admin-order?search=${encodeURIComponent(number)}&date_from=${dateFrom}&date_to=${dateTo}`;

  return <main className="orders-dashboard">
    <section className="orders-dashboard__panel">
      <div className="orders-dashboard__header"><div><h1>Звіти за замовленнями</h1><p>Кількість за дилерами та час очікування. Найдовші очікування — зверху.</p></div><div className="orders-dashboard__total"><span>Потребують уваги</span><strong>{total}</strong></div></div>
      <div className="orders-dashboard__filters"><label>Дилер<DealerSelectWithAll value={dealerGuid || "__ALL__"} onChange={setDealerGuid} /></label><label>Від<input type="date" value={dateFrom} max={dateTo} onChange={(event) => setDateFrom(event.target.value)} /></label><label>До<input type="date" value={dateTo} min={dateFrom} onChange={(event) => setDateTo(event.target.value)} /></label><button type="button" onClick={loadReport} disabled={loading}>{loading ? "Оновлення…" : "Оновити звіт"}</button></div>
      {error && <p className="orders-dashboard__error">{error}</p>}
      <div className="orders-dashboard__cards">{STATUSES.map(({ status, title, className }) => <div className={`orders-dashboard__card ${className}`} key={status}><span>{title}</span><strong>{loading ? "—" : grouped[status].length}</strong></div>)}</div>
      {STATUSES.map(({ status, title }) => <section className="orders-dashboard__details" key={status}><h2>{title} ({grouped[status].length})</h2><div className="orders-dashboard__table-wrap"><table><thead><tr><th>Замовлення</th><th>Дилер</th><th>Створено</th><th>Очікує</th></tr></thead><tbody>{grouped[status].length ? grouped[status].map((order, index) => { const age = getAge(order.dateValue); return <tr key={order.number + index}><td><a href={openOrder(order.number)}>{order.number}</a></td><td>{order.dealer}</td><td>{age.date ? age.date.toLocaleString("uk-UA") : "—"}</td><td className="orders-dashboard__age">{age.text}</td></tr>; }) : <tr><td colSpan="4">Немає замовлень у цьому статусі.</td></tr>}</tbody></table></div></section>)}
    </section>
  </main>;
}
