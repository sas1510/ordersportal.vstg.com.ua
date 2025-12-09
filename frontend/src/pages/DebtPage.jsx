import React, { useState, useEffect, useCallback, useMemo } from "react";
import axiosInstance from "../api/axios";
import "../components/Portal/PortalOriginal.css";
import "./PaymentStatus.css";
import { useTheme } from "../context/ThemeContext";

// ====================================================================
//                               ДОПОМІЖНІ ФУНКЦІЇ
// ====================================================================

// ========= ФОРМАТУВАННЯ ВАЛЮТИ =========
const formatCurrency = (value, unit = "грн") => {
  if (value == null || isNaN(Number(value))) return "—";
  const num = Number(value);

  const formatter = new Intl.NumberFormat("uk-UA", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (unit === "") return formatter.format(num);

  return `${formatter.format(num)} ${unit}`;
};

// ========= ДІСТАЄМО КОРИСТУВАЧА =========
const USER = JSON.parse(localStorage.getItem("user") || "{}");
const USER_ROLE = USER.role || "";

// ========= GUID КОНТРАГЕНТА =========
const DEFAULT_CONTRACTOR_GUID =
  USER_ROLE === "customer"
    ? USER.user_id_1c
    : localStorage.getItem("contractor_guid");

// ========= ДОП. ФУНКЦІЯ: визначення каналу оплати =========
const detectPaymentChannel = (item) => {
  const doc = item.ВидДокумента || item.DealType || "";
  const hasOrder = item.Сделка || item.НомерЗаказа;

  if (hasOrder) return "order";
  if (doc === "ППВход") return "bank";
  if (doc === "ПКО") return "cash";
  return "none";
};

// ========= ДОП. ФУНКЦІЯ: Отримання початку і кінця поточного місяця (ОНОВЛЕНО) =========
const getCurrentMonthDates = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Початок місяця (YYYY-MM-01)
  const dateFrom = new Date(year, month, 1).toISOString().split("T")[0];

  // Кінець місяця (сьогоднішня дата)
  const dateTo = now.toISOString().split("T")[0];

  return { dateFrom, dateTo };
};

// ====================================================================
//                     МЕМОІЗОВАНИЙ КОМПОНЕНТ РЯДКА (GROUP)
// ====================================================================

const PaymentGroup = React.memo(function PaymentGroup({
  group,
  formatCurrency,
  detectPaymentChannel,
  expandedRows,
  toggleRow,
}) {
  if (!group || group.items.length === 0) return null;

  const dateRow = (
    <>
      <tr className="date-row">
        <td colSpan={11}>📅 {group.date}</td>
      </tr>

      <tr className="initial-contracts-row">
        <td colSpan={11}>
          <div style={{ padding: "6px 14px", lineHeight: "1.5" }}>
            Залишки на початок дня:
            {Object.values(group.initialContracts).map((c, idx) => (
              <div key={idx} style={{ fontSize: "13px" }}>
                <span className="contract-name-bold">{c.contractName}</span>
                {" — "}
                {formatCurrency(c.initialSaldo)}
              </div>
            ))}
          </div>
        </td>
      </tr>
    </>
  );

  const rows = group.items.map((item, idx) => {
    const rowKey = `${group.date}-${idx}`;
    const isExpanded = expandedRows.has(rowKey);
    const hasOrder = item.НомерЗаказа;

    const sum = Math.abs(Number(item.DeltaRow || 0));
    const income = item.InOut === "Прихід" ? sum : 0;
    const expense = item.InOut === "Витрата" ? sum : 0;

    return (
      <React.Fragment key={rowKey}>
        <tr className="data-row">
          <td>{item.DealType || item.ВидДокумента || "—"}</td>
          <td>{item.НомерДок || "—"}</td>
          <td>{formatCurrency(item.CumSaldoStart)}</td>
          <td className="text-green">
            {income > 0 ? formatCurrency(income, "") : "—"}
          </td>
          <td className="text-red">
            {expense > 0 ? formatCurrency(expense, "") : "—"}
          </td>
          <td className="text-bold">{formatCurrency(item.CumSaldo)}</td>
          <td>{(item.Период || "").split("T")[1]?.slice(0, 5)}</td>

          <td>
            <span className={`channel-badge ${detectPaymentChannel(item)}`}>
              {detectPaymentChannel(item) === "bank" && "БАНК"}
              {detectPaymentChannel(item) === "cash" && "КАСА"}
              {detectPaymentChannel(item) === "order" && "ЗАМОВЛ."}
              {detectPaymentChannel(item) === "none" && "—"}
            </span>
          </td>

          <td>
            {hasOrder ? (
              <div className="order-cell">
                <div className="order-num">№ {item.НомерЗаказа}</div>
                <div className="text-small">
                  💰 {formatCurrency(item.СуммаЗаказа)}
                </div>

                <button className="expand-btn" onClick={() => toggleRow(rowKey)}>
                  {isExpanded ? "▼ Сховати" : "▶ Детальніше"}
                </button>
              </div>
            ) : (
              "—"
            )}
          </td>

          <td>
            <div className="contract-cell">{item.FinalDogovorName || "—"}</div>
          </td>

          <td>{item.СтатусОплатиПоЗаказу || item.СтатусЗаказа || "—"}</td>
        </tr>

        {hasOrder && isExpanded && (
          <tr className="sub-row">
            <td colSpan={11}>
              <div className="sub-info">
                <div className="sub-title">
                  💳 Деталі оплати по замовленню № {item.НомерЗаказа}
                </div>

                <div className="sub-grid">
                  <div>
                    <span className="title">Сума замовлення:</span>
                    <span>{formatCurrency(item.СуммаЗаказа)}</span>
                  </div>
                  <div>
                    <span className="title">Оплачено до документа:</span>
                    <span className="text-grey">
                      {formatCurrency(item.ОплаченоДоДокумента)}
                    </span>
                  </div>
                  <div>
                    <span className="title">Оплачено включно:</span>
                    <span className="text-green">
                      {formatCurrency(item.ОплаченоВключноДокумент)}
                    </span>
                  </div>
                  <div>
                    <span className="title">Залишок:</span>
                    <span className="text-red">
                      {formatCurrency(item.ЗалишокПоЗаказу)}
                    </span>
                  </div>
                  <div>
                    <span className="title">Статус:</span>
                    <span>{item.СтатусОплатиПоЗаказу || "—"}</span>
                  </div>
                  <div>
                    <span className="title">Дата замовлення:</span>
                    <span>{(item.ДатаЗаказа || "").split("T")[0]}</span>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  });

  return [
    dateRow,
    ...rows,
    <tr className="total-row" key={"total-" + group.date}>
      <td colSpan={3}>📊 Разом за {group.date}:</td>
      <td className="text-green text-bold">
        {formatCurrency(group.totalIncome, "")}
      </td>
      <td className="text-red text-bold">
        {formatCurrency(group.totalExpense, "")}
      </td>
      <td className="text-bold">{formatCurrency(group.balance, "")}</td>
      <td colSpan={5}></td>
    </tr>,
  ];
});

// ====================================================================
//                             ГОЛОВНИЙ КОМПОНЕНТ
// ====================================================================

const PaymentStatus = () => {
  const { theme } = useTheme();

  // Використовуємо функцію для отримання дат поточного місяця
  const { dateFrom: defaultDateFrom, dateTo: defaultDateTo } =
    getCurrentMonthDates();

  const [paymentsData, setPaymentsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const [filters, setFilters] = useState({
    contractor: DEFAULT_CONTRACTOR_GUID,
    // Встановлюємо фільтри на поточний місяць за замовчуванням
    dateFrom: defaultDateFrom,
    dateTo: defaultDateTo,
  });

  const API_ENDPOINT = "/get_payment_status_view/";

  // ==== toggleRow - стабільна функція
  const toggleRow = useCallback((rowKey) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      newSet.has(rowKey) ? newSet.delete(rowKey) : newSet.add(rowKey);
      return newSet;
    });
  }, []);

  // ====================== ЗАВАНТАЖЕННЯ ДАНИХ (ОНОВЛЕНО) ======================
  // Залежить від усіх фільтрів, але викликається тільки по useEffect (для ініціалізації)
  // або по кліку на кнопку (для пошуку).
  const fetchData = useCallback(async () => {
    console.log("📌 Викликаю fetchData()");
    console.log("➡ contractor:", filters.contractor);
    console.log("➡ dateFrom:", filters.dateFrom);
    console.log("➡ dateTo:", filters.dateTo);

    if (!filters.contractor) {
      setError("Не знайдено GUID контрагента!");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get(API_ENDPOINT, {
        params: {
          contractor: filters.contractor,
          date_from: filters.dateFrom,
          date_to: filters.dateTo,
        },
      });

      console.log("📥 Отримав дані:", response.data);
      setPaymentsData(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("❌ Помилка axios:", err);
      setError("Не вдалося завантажити дані.");
    } finally {
      setLoading(false);
    }
  }, [filters.contractor, filters.dateFrom, filters.dateTo]);

  // ====================== useEffect (ОНОВЛЕНО) ======================
  // Викликаємо fetchData лише при першому завантаженні або зміні контрагента.
  // Зміна дат не викликає автоматичного завантаження.
  useEffect(() => {
    // Перше завантаження даних за поточний місяць
    fetchData();
  }, [filters.contractor]); // Змінено: тільки filters.contractor

  // ===== Фільтри ====
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // ============================= ГРУПУВАННЯ =============================
  const sortedGroups = useMemo(() => {
    const grouped = {};

    paymentsData.forEach((item) => {
      const date = item.Период?.split("T")[0] || "Невідома дата";

      if (!grouped[date]) {
        grouped[date] = {
          date,
          items: [],
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          lastCumSaldoTotal: 0,
          initialContracts: {},
          contractSummary: {},
        };
      }

      grouped[date].items.push(item);

      const contractName = item.FinalDogovorName || "Без договору";
      const delta = Number(item.DeltaRow || 0);

      if (!grouped[date].contractSummary[contractName]) {
        grouped[date].contractSummary[contractName] = {
          income: 0,
          expense: 0,
          lastCumSaldo: 0,
        };
      }

      if (item.InOut === "Прихід") {
        grouped[date].totalIncome += Math.abs(delta);
        grouped[date].contractSummary[contractName].income += Math.abs(delta);
      }

      if (item.InOut === "Витрата") {
        grouped[date].totalExpense += Math.abs(delta);
        grouped[date].contractSummary[contractName].expense += Math.abs(delta);
      }

      grouped[date].contractSummary[contractName].lastCumSaldo =
        item.CumSaldo;
      grouped[date].lastCumSaldoTotal = item.CumSaldo;
    });

    let groups = Object.values(grouped).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    let prevDayFinal = 0;
    let prevDayContracts = {};

    groups.forEach((g) => {
      g.initialBalance = g.items[0]?.CumSaldoStart ?? prevDayFinal;
      g.balance = g.lastCumSaldoTotal;
      prevDayFinal = g.balance;

      g.initialContracts = {};

      Object.entries(g.contractSummary).forEach(([contractName, summary]) => {
        g.initialContracts[contractName] = {
          contractName,
          initialSaldo: prevDayContracts[contractName] ?? 0,
        };

        prevDayContracts[contractName] = summary.lastCumSaldo;
      });
    });

    return groups.reverse();
  }, [paymentsData]);

  // ====================================================================
  //                            RENDER
  // ====================================================================

  if (loading)
    return (
      <div className={`page-container ${theme}`}>
                    <div className="loading-spinner-wrapper">
                <div className="loading-spinner"></div>
                <div className="loading-text">Завантаження...</div>
            </div>
      </div>
    );

  if (error)
    return (
      <div className={`page-container ${theme}`}>
        <div className="error-container">
          <p>⚠️ Помилка: {error}</p>
          <p>Спробуйте змінити фільтри або GUID.</p>
        </div>
      </div>
    );

  return (
    <div className={`payments-body ${theme}`}>
      {/* ------ ФІЛЬТРИ ------- */}
      <div className="filters-container">
        <label>
          З:
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            className="input-date"
          />
        </label>
        <label>
          По:
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            className="input-date"
          />
        </label>

        {/* Кнопка викликає fetchData, яка використовує актуальні значення filters */}
        <button
          className="btn btn-primary"
          onClick={fetchData}
          disabled={loading} // Кнопка неактивна під час завантаження
        >
          {loading ? (
            <>
              <div className="loading-spinner small"></div> Завантаження...
            </>
          ) : (
            "🔍 Пошук"
          )}
        </button>
      </div>

      <hr />

      {/* ------ ТАБЛИЦЯ ------- */}
      <div className="table-wrapper">
        <table className="payments-table">
          <thead>
            <tr>
              <th>Операція</th>
              <th>№ Док.</th>
              <th>Зал. на початок</th>
              <th>Прихід</th>
              <th>Розхід</th>
              <th>Залишок</th>
              <th>Коли</th>
              <th>Через що</th>
              <th>Замовлення</th>
              <th>Договір</th>
              <th>Статус</th>
            </tr>
          </thead>

          <tbody>
            {sortedGroups.map((group) => (
              <PaymentGroup
                key={group.date}
                group={group}
                formatCurrency={formatCurrency}
                detectPaymentChannel={detectPaymentChannel}
                expandedRows={expandedRows}
                toggleRow={toggleRow}
              />
            ))}
          </tbody>
        </table>
      </div>

      {paymentsData.length === 0 && !loading && (
        <div className="text-center p-20">
          Даних не знайдено за вибраний період.
        </div>
      )}
    </div>
  );
};

export default PaymentStatus;