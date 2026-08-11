import { useCallback, useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import axiosInstance from "../api/axios";
import "./OrdersReportPage.css";

const STATUS_CARDS = [
  {
    status: "Новий",
    title: "Нові",
    description: "Нові заявки без сформованих замовлень за вибраний період.",
    className: "orders-report__card--new",
  },
  {
    status: "Очікуємо підтвердження",
    title: "Очікуємо підтвердження",
    description: "Замовлення, які очікують підтвердження.",
    className: "orders-report__card--confirmation",
  },
  {
    status: "Очікуємо оплату",
    title: "Очікуємо оплату",
    description: "Замовлення, за якими очікується оплата.",
    className: "orders-report__card--payment",
  },
];

const STATUS_CHART_COLORS = ["#3c8ab2", "#d48b2a", "#b55b58"];

const getToday = () => new Date().toISOString().slice(0, 10);
const getMonthStart = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10);
};

function getAge(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return { text: "Немає дати", date: null };
  }

  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const text = days
    ? `${days} дн. ${hours} год.`
    : `${hours} год. ${minutes % 60} хв.`;

  return { text, date };
}

export default function OrdersReportPage() {
  const [dateFrom, setDateFrom] = useState(getMonthStart);
  const [dateTo, setDateTo] = useState(getToday);
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeStatus, setActiveStatus] = useState(STATUS_CARDS[0].status);

  const loadReport = useCallback(async () => {
    if (!dateFrom || !dateTo || dateFrom > dateTo) {
      setError("Вкажіть коректний період звіту.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get("/order/get_orders_info_all/", {
        params: { date_from: dateFrom, date_to: dateTo },
      });
      if (response.data?.status !== "success") {
        throw new Error("Не вдалося завантажити дані.");
      }
      setCalculations(response.data?.data?.calculation || []);
    } catch (requestError) {
      setCalculations([]);
      setError(
        requestError.response?.data?.error ||
          "Не вдалося завантажити дані звіту. Спробуйте ще раз.",
      );
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const summary = useMemo(() => {
    const counts = Object.fromEntries(STATUS_CARDS.map(({ status }) => [status, 0]));
    calculations.forEach((calculation) => {
      const orders = Array.isArray(calculation.orders) ? calculation.orders : [];
      if (orders.length === 0) {
        counts["Новий"] += 1;
        return;
      }
      orders.forEach((order) => {
        if (Object.hasOwn(counts, order.status)) {
          counts[order.status] += 1;
        }
      });
    });
    return counts;
  }, [calculations]);

  const grouped = useMemo(() => {
    const result = Object.fromEntries(STATUS_CARDS.map(({ status }) => [status, []]));

    calculations.forEach((calculation) => {
      const orders = Array.isArray(calculation.orders) ? calculation.orders : [];
      if (orders.length === 0) {
        result["Новий"].push({
          number: calculation.number || "Без номера",
          dealer: calculation.dealer || "Не вказано",
          dateValue: calculation.dateRaw,
        });
        return;
      }

      orders.forEach((order) => {
        if (Object.hasOwn(result, order.status)) {
          result[order.status].push({
            number: order.number || "Без номера",
            dealer: calculation.dealer || "Не вказано",
            dateValue: order.createDate || order.dateRaw || calculation.dateRaw,
          });
        }
      });
    });

    Object.values(result).forEach((orders) => {
      orders.sort((a, b) => {
        const first = a.dateValue ? new Date(a.dateValue).getTime() : 0;
        const second = b.dateValue ? new Date(b.dateValue).getTime() : 0;
        return second - first;
      });
    });

    return result;
  }, [calculations]);

  const chartData = useMemo(
    () =>
      STATUS_CARDS.map((item, index) => ({
        ...item,
        value: summary[item.status] || 0,
        fill: STATUS_CHART_COLORS[index % STATUS_CHART_COLORS.length],
      })),
    [summary],
  );

  const total = Object.values(summary).reduce((sum, count) => sum + count, 0);
  const activeStatusMeta = STATUS_CARDS.find((item) => item.status === activeStatus) || STATUS_CARDS[0];
  const activeOrders = grouped[activeStatusMeta.status] || [];

  useEffect(() => {
    const firstAvailable =
      STATUS_CARDS.find((item) => (summary[item.status] || 0) > 0)?.status || STATUS_CARDS[0].status;

    setActiveStatus((current) => {
      if (current && Object.hasOwn(summary, current)) {
        return current;
      }
      return firstAvailable;
    });
  }, [summary]);

  const openOrder = useCallback(
    (number) => `/admin-order?search=${encodeURIComponent(number)}&date_from=${dateFrom}&date_to=${dateTo}`,
    [dateFrom, dateTo],
  );

  return (
    <main className="orders-report">
      <section className="orders-report__panel">
        <div className="orders-report__heading">
          <div>
            <h1>Звіт по замовленнях</h1>
            <p>Контроль замовлень із проблемними статусами за вибраний період.</p>
          </div>
          <div className="orders-report__total">
            <span>Всього у звіті</span>
            <strong>{total}</strong>
          </div>
        </div>

        <div className="orders-report__filters">
          <label>
            ???
            <input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} />
          </label>
          <label>
            ??
            <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} />
          </label>
          <button type="button" onClick={loadReport} disabled={loading}>
            {loading ? "Завантаження..." : "Оновити звіт"}
          </button>
        </div>

        {error && <p className="orders-report__error">{error}</p>}

        <div className="orders-report__cards" aria-live="polite">
          {STATUS_CARDS.map(({ status, title, description, className }) => (
            <button
              type="button"
              className={`orders-report__card ${className} ${activeStatus === status ? "is-active" : ""}`}
              key={status}
              onClick={() => setActiveStatus(status)}
            >
              <span>{title}</span>
              <strong>{loading ? "…" : summary[status]}</strong>
              <p>{description}</p>
            </button>
          ))}
        </div>

        <div className="orders-report__visuals">
          <section className="orders-report__chart-panel">
            <div className="orders-report__chart-heading">
              <div>
                <h2>Розподіл замовлень за статусами</h2>
                <p>Натисніть на сектор або картку, щоб переглянути замовлення.</p>
              </div>
            </div>

            <div className="orders-report__chart-wrap">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="title"
                    cx="50%"
                    cy="50%"
                    outerRadius={108}
                    innerRadius={56}
                    paddingAngle={3}
                    activeIndex={STATUS_CARDS.findIndex((item) => item.status === activeStatus)}
                    onClick={(entry) => entry?.status && setActiveStatus(entry.status)}
                    cursor="pointer"
                  >
                    {chartData.map((item) => (
                      <Cell key={item.status} fill={item.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [value, "Замовлень"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #d8e3ec" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="orders-report__legend">
              {chartData.map((item) => (
                <button
                  type="button"
                  key={item.status}
                  className={`orders-report__legend-item ${activeStatus === item.status ? "is-active" : ""}`}
                  onClick={() => setActiveStatus(item.status)}
                >
                  <span className="orders-report__legend-dot" style={{ backgroundColor: item.fill }}></span>
                  <span>{item.title}</span>
                  <strong>{loading ? "…" : item.value}</strong>
                </button>
              ))}
            </div>
          </section>

          <section className="orders-report__details-panel">
            <div className="orders-report__chart-heading">
              <div>
                <h2>{activeStatusMeta.title}</h2>
                <p>{activeStatusMeta.description}</p>
              </div>
              <div className="orders-report__details-total">
                <span>Замовлень</span>
                <strong>{loading ? "…" : summary[activeStatusMeta.status]}</strong>
              </div>
            </div>

            <div className="orders-report__table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Замовлення</th>
                    <th>Дилер</th>
                    <th>Створено</th>
                    <th>У статусі</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4">Завантаження замовлень...</td>
                    </tr>
                  ) : activeOrders.length ? (
                    activeOrders.map((order, index) => {
                      const age = getAge(order.dateValue);
                      return (
                        <tr key={`${order.number}-${index}`}>
                          <td><a href={openOrder(order.number)}>{order.number}</a></td>
                          <td>{order.dealer}</td>
                          <td>{age.date ? age.date.toLocaleString("uk-UA") : "—"}</td>
                          <td className="orders-report__age">{age.text}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4">Немає замовлень у цьому статусі.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
