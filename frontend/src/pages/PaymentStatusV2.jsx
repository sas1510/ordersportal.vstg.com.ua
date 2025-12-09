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

// ========= ДОП. ФУНКЦІЯ: Отримання початку і кінця поточного місяця =========
const getCurrentMonthDates = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const dateFrom = new Date(year, month, 1).toISOString().split("T")[0];
  const dateTo = now.toISOString().split("T")[0];

  return { dateFrom, dateTo };
};

// ====================================================================
//                     МЕМОІЗОВАНИЙ КОМПОНЕНТ РЯДКА (ДОКУМЕНТ)
// ====================================================================

const DocumentRow = React.memo(function DocumentRow({
  docGroup,
  formatCurrency,
  detectPaymentChannel,
  expandedRows,
  toggleRow,
}) {
  const docKey = docGroup.docKey;
  const isExpanded = expandedRows.has(docKey);
  const firstItem = docGroup.items[0];

  const income = docGroup.totalIncome;
  const expense = docGroup.totalExpense;
  const cumSaldo = docGroup.lastCumSaldo;

  const docRow = (
    <React.Fragment key={docKey}>
      <tr className="data-row doc-main-row">
        <td>{firstItem.DealType || firstItem.ВидДокумента || "—"}</td>
        <td className="text-bold">{docGroup.НомерДок || "—"}</td>
        <td>{formatCurrency(docGroup.CumSaldoStart)}</td>
        <td className="text-green">
          {income > 0 ? formatCurrency(income, "") : "—"}
        </td>
        <td className="text-red">
          {expense > 0 ? formatCurrency(expense, "") : "—"}
        </td>
        <td className="text-bold">{formatCurrency(cumSaldo)}</td>
        <td>{(firstItem.Период || "").split("T")[1]?.slice(0, 5)}</td>

        <td>
          <span className={`channel-badge ${detectPaymentChannel(firstItem)}`}>
            {detectPaymentChannel(firstItem) === "bank" && "БАНК"}
            {detectPaymentChannel(firstItem) === "cash" && "КАСА"}
            {detectPaymentChannel(firstItem) === "order" && "ЗАМОВЛ."}
            {detectPaymentChannel(firstItem) === "none" && "—"}
          </span>
        </td>

        <td colSpan={3}>
          {docGroup.items.length > 1 ? (
            <button className="expand-btn" onClick={() => toggleRow(docKey)}>
              {isExpanded
                ? `▼ Сховати ${docGroup.items.length} замовлень`
                : `▶ Рознесено на ${docGroup.items.length} замовлень`}
            </button>
          ) : (
            // Якщо тільки один рядок, показуємо договір і статус прямо тут
            <>
              <div className="contract-cell">
                {firstItem.FinalDogovorName || "—"}
              </div>
              {/* <div>{firstItem.СтатусОплатиПоЗаказу || firstItem.СтатусЗаказа || "—"}</div> */}
            </>
          )}
        </td>
      </tr>

      {/* 🔹 Мінімалістичні підрядки замовлень */}
{isExpanded && docGroup.items.length > 1 && (
  <tr className="sub-row">
    <td colSpan={11}>
      <div className="sub-orders-container minimal">

        {docGroup.items.map((item, idx) => (
          <div key={`${docKey}-${idx}`} className="order-mini-card">

            {/* Верхній рядок — лише номер */}
            <div className="order-mini-header">
              Замовлення № {item.НомерЗаказа}
            </div>

            {/* Основні поля в одному стислому grid */}
            <div className="order-mini-grid">

  <div>
    <span className="mini-label">Сума</span>
    <span className="mini-value">{formatCurrency(item.СуммаЗаказа)}</span>
  </div>

    <div>
    <span className="mini-label">Оплачено до</span>
    <span className="mini-value text-grey">
      {formatCurrency(item.ОплаченоДоДокумента)}
    </span>
  </div>


  <div>
    <span className="mini-label">Оплата</span>
    <span className={item.InOut === "Прихід" ? "text-green" : "text-red"}>
      {formatCurrency(Math.abs(Number(item.DeltaRow || 0)))}
    </span>
  </div>


  <div>
    <span className="mini-label">Залишок</span>
    <span className="text-red">
      {formatCurrency(item.ЗалишокПоЗаказу)}
    </span>
  </div>

  <div>
    <span className="mini-label">Статус</span>
    <span>{item.СтатусОплатиПоЗаказу || "—"}</span>
  </div>

  <div>
    <span className="mini-label">Договір</span>
    <span>{item.FinalDogovorName || "—"}</span>
  </div>

  <div>
    <span className="mini-label">Дата</span>
    <span>{(item.ДатаЗаказа || "").split("T")[0]}</span>
  </div>

</div>
          </div>
        ))}

      </div>
    </td>
  </tr>
)}

    </React.Fragment>
  );

  return docRow;
});

// ====================================================================
//                     МЕМОІЗОВАНИЙ КОМПОНЕНТ ГРУПИ (ДАТА)
// ====================================================================

const PaymentGroup = React.memo(function PaymentGroup({
  group,
  formatCurrency,
  detectPaymentChannel,
  expandedRows,
  toggleRow,
}) {
  if (!group || Object.keys(group.documentGroups).length === 0) return null;

  const dateRow = (
    <>
      <tr className="date-row" key={`date-row-${group.date}`}>
        <td colSpan={11}>
          <div className="date-header">📅 {group.date}</div>
        </td>
      </tr>

      <tr
        className="initial-contracts-row"
        key={`initial-contracts-${group.date}`}
      >
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

  const documentRows = Object.values(group.documentGroups).map((docGroup) => (
    <DocumentRow
      key={docGroup.docKey}
      docGroup={docGroup}
      formatCurrency={formatCurrency}
      detectPaymentChannel={detectPaymentChannel}
      expandedRows={expandedRows}
      toggleRow={toggleRow}
    />
  ));

  const totalRow = (
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
    </tr>
  );

  return [dateRow, ...documentRows, totalRow];
});

// ====================================================================
//                             ГОЛОВНИЙ КОМПОНЕНТ
// ====================================================================

const PaymentStatusV2 = () => {
  const { theme } = useTheme();

  const { dateFrom: defaultDateFrom, dateTo: defaultDateTo } =
    getCurrentMonthDates();

  const [paymentsData, setPaymentsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const [filters, setFilters] = useState({
    contractor: DEFAULT_CONTRACTOR_GUID,
    dateFrom: defaultDateFrom,
    dateTo: defaultDateTo,
  });

  const API_ENDPOINT = "/get_payment_status_view/";

  // ==== toggleRow - стабільна функція (тепер для документів)
  const toggleRow = useCallback((rowKey) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      newSet.has(rowKey) ? newSet.delete(rowKey) : newSet.add(rowKey);
      return newSet;
    });
  }, []);

  // ====================== ЗАВАНТАЖЕННЯ ДАНИХ ======================
  const fetchData = useCallback(async () => {
    console.log("📌 Викликаю fetchData()");

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

  useEffect(() => {
    fetchData();
  }, [filters.contractor]);

  // ===== Фільтри ====
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // ============================= ГРУПУВАННЯ =============================
  const sortedGroups = useMemo(() => {
    const groupedByDate = {};

    paymentsData.forEach((item) => {
      const date = item.Период?.split("T")[0] || "Невідома дата";
      const docKey = item.НомерДок || item.ВидДокумента || `no-doc-${date}`;

      if (!groupedByDate[date]) {
        groupedByDate[date] = {
          date,
          documentGroups: {},
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          lastCumSaldoTotal: 0,
          initialContracts: {},
          contractSummary: {},
        };
      }
      const group = groupedByDate[date];

      if (!group.documentGroups[docKey]) {
        group.documentGroups[docKey] = {
          docKey,
          НомерДок: item.НомерДок,
          items: [],
          totalIncome: 0,
          totalExpense: 0,
          lastCumSaldo: item.CumSaldo,
          CumSaldoStart: item.CumSaldoStart,
        };
      }
      const docGroup = group.documentGroups[docKey];

      // Додаємо елемент до групи документів
      docGroup.items.push(item);

      // Рахуємо загальний прихід/розхід на рівні дати
      const delta = Number(item.DeltaRow || 0);
      const absDelta = Math.abs(delta);

      if (item.InOut === "Прихід") {
        group.totalIncome += absDelta;
        docGroup.totalIncome += absDelta;
      }
      if (item.InOut === "Витрата") {
        group.totalExpense += absDelta;
        docGroup.totalExpense += absDelta;
      }

      // Оновлюємо загальний кінцевий залишок для дати та документа
      group.lastCumSaldoTotal = item.CumSaldo;
      docGroup.lastCumSaldo = item.CumSaldo;

      // Логіка для початкових залишків по контрактах
      const contractName = item.FinalDogovorName || "Без договору";
      if (!group.contractSummary[contractName]) {
        group.contractSummary[contractName] = { lastCumSaldo: 0 };
      }
      group.contractSummary[contractName].lastCumSaldo = item.CumSaldo;
    });

    let groups = Object.values(groupedByDate).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Логіка визначення початкових залишків для дня та контрактів
    let prevDayFinal = 0;
    let prevDayContracts = {};

    groups.forEach((g) => {
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

        <button
          className="btn btn-primary"
          onClick={fetchData}
          disabled={loading}
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
              <th colSpan={3}>Деталізація / Договір / Статус</th>
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

export default PaymentStatusV2;