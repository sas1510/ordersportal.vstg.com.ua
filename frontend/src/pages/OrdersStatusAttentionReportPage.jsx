import { useCallback, useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axios";
import "./OrdersReportPage.css";
import "./OrdersStatusAttentionReportPage.css";
import { useDealerContext } from "../hooks/useDealerContext";

const STATUSES = [
  { status: "Новий", title: "Нові", className: "orders-report__card--new" },
  { status: "Очікуємо підтвердження", title: "Очікують підтвердження", className: "orders-report__card--confirmation" },
  { status: "Очікуємо оплату", title: "Очікують оплату", className: "orders-report__card--payment" },
];

const toDateInput = (date) => date.toISOString().slice(0, 10);
const getToday = () => toDateInput(new Date());
const getMonthStart = () => {
  const date = new Date();
  return toDateInput(new Date(date.getFullYear(), date.getMonth(), 1));
};
const DEALER_GROUP_OPTIONS = [
  { value: "", label: "Всі типи" },
  { value: "Дилера", label: "Дилера" },
  { value: 'ТОВ "Наша фірма"', label: "Наша фірма" },
  { value: "Експорт", label: "Експорт" },
];

function getAge(dateValue) {
  const date = dateValue ? new Date(dateValue) : null;
  if (!date || Number.isNaN(date.getTime())) return { text: "Дата невідома", minutes: -1, date: null };

  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  const text = days > 0 ? `${days} дн. ${hours} год.` : `${hours} год. ${mins} хв.`;
  return { text, minutes, date };
}

export default function OrdersStatusAttentionReportPage() {
  const { role } = useDealerContext();
  const [dateFrom, setDateFrom] = useState(getMonthStart);
  const [dateTo, setDateTo] = useState(getToday);
  const [dealerGroup, setDealerGroup] = useState("");
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const canUseDealerGroups =
    role === "admin" || role === "director";

  const loadReport = useCallback(async () => {
    if (!dateFrom || !dateTo || dateFrom > dateTo) {
      setError("Вкажіть коректний період звітності.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get("/order/get_orders_info_all/", {
        params: {
          date_from: dateFrom,
          date_to: dateTo,
          ...(canUseDealerGroups && dealerGroup
            ? { dealer_group: dealerGroup }
            : {}),
        },
      });
      if (response.data?.status !== "success") throw new Error();
      setCalculations(response.data?.data?.calculation || []);
    } catch (requestError) {
      setCalculations([]);
      setError(requestError.response?.data?.error || "Не вдалося завантажити дані звіту. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  }, [canUseDealerGroups, dateFrom, dateTo, dealerGroup]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const ordersByStatus = useMemo(() => {
    const grouped = Object.fromEntries(STATUSES.map(({ status }) => [status, []]));
    calculations.forEach((calculation) => {
      const orders = Array.isArray(calculation.orders) ? calculation.orders : [];
      if (!orders.length) {
        grouped.Новий.push({ number: calculation.number || "Без номера", dealer: calculation.dealer, dateValue: calculation.dateRaw });
        return;
      }
      orders.forEach((order) => {
        if (Object.hasOwn(grouped, order.status)) {
          grouped[order.status].push({
            number: order.number || "Без номера",
            dealer: calculation.dealer,
            dateValue: order.createDate || order.dateRaw || calculation.dateRaw,
          });
        }
      });
    });
    Object.values(grouped).forEach((orders) => orders.sort((a, b) => getAge(b.dateValue).minutes - getAge(a.dateValue).minutes));
    return grouped;
  }, [calculations]);

  const total = Object.values(ordersByStatus).reduce((sum, orders) => sum + orders.length, 0);

  return (
    <main className="orders-report">
      <section className="orders-report__panel">
        <div className="orders-report__heading">
          <div>
            <h1>Звіти за замовленнями</h1>
            <p>Час показано від дати створення замовлення. Найдовші очікування відображаються першими.</p>
          </div>
          <div className="orders-report__total"><span>Потребують уваги</span><strong>{total}</strong></div>
        </div>
        <div className="orders-report__filters">
          <label>Від<input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} /></label>
          <label>До<input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} /></label>
          {canUseDealerGroups && (
            <label>
              Тип
              <select
                value={dealerGroup}
                onChange={(event) => setDealerGroup(event.target.value)}
              >
                {DEALER_GROUP_OPTIONS.map((option) => (
                  <option key={option.value || "__all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button type="button" onClick={loadReport} disabled={loading}>{loading ? "Оновлення…" : "Оновити звіт"}</button>
        </div>
        {error && <p className="orders-report__error">{error}</p>}
        <div className="orders-report__attention-list" aria-live="polite">
          {STATUSES.map(({ status, title, className }) => {
            const orders = ordersByStatus[status];
            return <section className="orders-report__status-section" key={status}>
              <div className={`orders-report__card ${className}`}><span>{title}</span><strong>{loading ? "—" : orders.length}</strong><p>Замовлення відсортовані за тривалістю очікування.</p></div>
              {!loading && <div className="orders-report__table-wrap"><table><thead><tr><th>Замовлення</th><th>Дилер</th><th>Створено</th><th>У статусі</th></tr></thead><tbody>{orders.length ? orders.map((order, index) => { const age = getAge(order.dateValue); return <tr key={`${order.number}-${index}`}><td>{order.number}</td><td>{order.dealer || "—"}</td><td>{age.date ? age.date.toLocaleString("uk-UA") : "—"}</td><td className="orders-report__age">{age.text}</td></tr>; }) : <tr><td colSpan="4">Немає замовлень у цьому статусі.</td></tr>}</tbody></table></div>}
            </section>;
          })}
        </div>
      </section>
    </main>
  );
}
