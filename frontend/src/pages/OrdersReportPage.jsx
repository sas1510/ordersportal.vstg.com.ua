import { useCallback, useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axios";
import "./OrdersReportPage.css";

const STATUS_CARDS = [
  { status: "Новий", title: "Нові", description: "Заявки без створеного замовлення та замовлення зі статусом «Новий».", className: "orders-report__card--new" },
  { status: "Очікуємо підтвердження", title: "Очікують підтвердження", description: "Замовлення, які очікують підтвердження.", className: "orders-report__card--confirmation" },
  { status: "Очікуємо оплату", title: "Очікують оплату", description: "Замовлення, за якими очікується оплата.", className: "orders-report__card--payment" },
];

const getToday = () => new Date().toISOString().slice(0, 10);
const getMonthStart = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10);
};

export default function OrdersReportPage() {
  const [dateFrom, setDateFrom] = useState(getMonthStart);
  const [dateTo, setDateTo] = useState(getToday);
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
      const response = await axiosInstance.get("/order/get_orders_info_all/", {
        params: { date_from: dateFrom, date_to: dateTo },
      });
      if (response.data?.status !== "success") throw new Error("Не вдалося завантажити звіт.");
      setCalculations(response.data?.data?.calculation || []);
    } catch (requestError) {
      setCalculations([]);
      setError(requestError.response?.data?.error || "Не вдалося завантажити дані звіту. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const summary = useMemo(() => {
    const counts = Object.fromEntries(STATUS_CARDS.map(({ status }) => [status, 0]));
    calculations.forEach((calculation) => {
      const orders = Array.isArray(calculation.orders) ? calculation.orders : [];
      if (orders.length === 0) {
        counts.Новий += 1;
        return;
      }
      orders.forEach((order) => {
        if (Object.hasOwn(counts, order.status)) counts[order.status] += 1;
      });
    });
    return counts;
  }, [calculations]);
  const total = Object.values(summary).reduce((sum, count) => sum + count, 0);

  return (
    <main className="orders-report">
      <section className="orders-report__panel">
        <div className="orders-report__heading">
          <div><h1>Звіти за замовленнями</h1><p>Кількість замовлень у пріоритетних статусах за вибраний період.</p></div>
          <div className="orders-report__total"><span>Усього у звіті</span><strong>{total}</strong></div>
        </div>
        <div className="orders-report__filters">
          <label>Від<input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} /></label>
          <label>До<input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} /></label>
          <button type="button" onClick={loadReport} disabled={loading}>{loading ? "Оновлення…" : "Оновити звіт"}</button>
        </div>
        {error && <p className="orders-report__error">{error}</p>}
        <div className="orders-report__cards" aria-live="polite">
          {STATUS_CARDS.map(({ status, title, description, className }) => (
            <article className={`orders-report__card ${className}`} key={status}><span>{title}</span><strong>{loading ? "—" : summary[status]}</strong><p>{description}</p></article>
          ))}
        </div>
      </section>
    </main>
  );
}
