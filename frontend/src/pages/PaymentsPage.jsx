import React, { useState, useEffect, useCallback, useMemo } from "react";
import axiosInstance from "../api/axios";
import { useTheme } from "../hooks/useTheme";
import PaymentModal from "../components/Orders/PaymentModal";
import { formatDateHuman, formatDateHumanShorter } from "../utils/formatters";

// Стилі
import "../components/Portal/PortalOriginal.css";
import "../components/Portal/PortalSidebar.css";
import "./PaymentsPage.css";
import { useNotification } from "../hooks/useNotification";

// Хук для мобільної версії
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    window.matchMedia("(max-width: 1260px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1260px)");
    const listener = (e) => setIsMobile(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);
  return isMobile;
};

export default function PaymentsPage() {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();

  // Дані

  const { addNotification } = useNotification();
  const [orders, setOrders] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [debtItems, setDebtItems] = useState([]); // Деталі з SQL для Drill-down
  const [debtTotal, setDebtTotal] = useState(null); // Рядок РАЗОМ

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Стан для Drill-down модалки
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTitle, setDetailTitle] = useState("");
  const [filteredDetailOrders, setFilteredDetailOrders] = useState([]);

  // Фільтри та UI
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [contractFilter, setContractFilter] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Модалка основної оплати
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const STATUS_COLORS = {
    "Очікуємо оплату": "status-wait-payment",
    "Очікуємо підтвердження": "status-wait-confirm",
    Підтверджено: "status-confirmed",
    Резервування: "status-reserved",
    // "В роботі": "status-in-work",
    "У виробництві": "status-production",
    Готовий: "status-ready",
    Відвантажений: "status-shipped",
    Неліквід: "status-closed",
    "—": "status-unknown",
  };

  const STATUS_FILTERS = [
    { key: "all", label: "Усі замовлення", icon: "icon-layers2" },
    {
      key: "Очікуємо підтвердження",
      label: "Очікуємо підтвердження",
      icon: "icon-clipboard",
    },
    {
      key: "Очікуємо оплату",
      label: "Очікуємо оплату",
      icon: "icon-coin-dollar",
    },
    { key: "Підтверджено", label: "Підтверджено", icon: "icon-check" },
    // { key: "В роботі", label: "В роботі", icon: "icon-cogs" },
    { key: "У виробництві", label: "У виробництві", icon: "icon-cog" },
    { key: "Готовий", label: "Готовий", icon: "icon-box" },
    { key: "Відвантажений", label: "Відвантажений", icon: "icon-truck" },
    { key: "Неліквід", label: "Неліквід", icon: "icon-circle-with-cross" },
  ];

  const contractorGUID =
    JSON.parse(localStorage.getItem("user") || "{}")?.user_id_1c ||
    localStorage.getItem("contractor_guid");

  const formatCurrency = (value) => {
    if (value == null || isNaN(Number(value))) return "0,00";
    return new Intl.NumberFormat("uk-UA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value));
  };

  const normalizeStatus = (s) => (s || "—").toString().trim();

  // =====================================================
  // LOAD DATA
  // =====================================================
  const loadData = useCallback(async () => {
    if (!contractorGUID) return;
    setLoading(true);
    setError("");
    try {
      const [resPage, resDebts] = await Promise.all([
        axiosInstance.get("/payments/get_dealer_payment_page_data/", {
          params: { contractor: contractorGUID },
        }),
        axiosInstance.get("/partner-debts/", {
          params: { contractor_guid: contractorGUID },
        }),
      ]);
      setOrders(resPage.data.orders || []);
      setContracts(resPage.data.contracts || []);
      setDebtItems(resDebts.data.debts?.items || []);
      setDebtTotal(resDebts.data.debts?.total || null);
    } catch (_e) {
      console.error("Error loading payment data:", _e);
      setError("Помилка завантаження фінансових даних");
    } finally {
      setLoading(false);
    }
  }, [contractorGUID]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Додайте цей useEffect поруч з іншими useEffect у компоненті
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        // Закриваємо модалку деталей
        if (detailModalOpen) {
          setDetailModalOpen(false);
        }
        // Закриваємо модалку оплати через існуючу функцію
        if (modalOpen) {
          closeModal();
        }
      }
    };

    // Додаємо слухач, тільки якщо хоча б одна модалка відкрита
    if (detailModalOpen || modalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    // Обов'язково прибираємо слухач при демонтажі або закритті
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [detailModalOpen, modalOpen]); // Залежності, щоб ефект оновлювався при відкритті/закритті

  // =====================================================
  // SIDEBAR FILTERS LOGIC
  // =====================================================
  const contractFilters = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => {
      if (o.Dogovor_GUID && o.DogovorName)
        map.set(o.Dogovor_GUID, o.DogovorName);
    });
    return Array.from(map.entries()).map(([guid, name]) => ({
      guid,
      name,
      count: orders.filter((o) => o.Dogovor_GUID === guid).length,
    }));
  }, [orders]);

  const statusSummary = useMemo(() => {
    const summary = { all: orders.length };
    orders.forEach((o) => {
      const s = o.OrderStage || "—";
      summary[s] = (summary[s] || 0) + 1;
    });
    return summary;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const statusOk = statusFilter === "all" || o.OrderStage === statusFilter;
      const contractOk =
        contractFilter === "all" || o.Dogovor_GUID === contractFilter;
      const searchOk =
        !search ||
        (o.OrderNumber || "")
          .toString()
          .toLowerCase()
          .includes(search.toLowerCase());
      return statusOk && contractOk && searchOk;
    });
  }, [orders, statusFilter, contractFilter, search]);

  // =====================================================
  // DRILL-DOWN LOGIC
  // =====================================================
  const showDebtDetails = (type) => {
    let filtered = [];
    let title = "";

    switch (type) {
      case "no_prepayment":
        filtered = debtItems.filter((o) => Number(o.BezPeredOplaty || 0) > 0);
        title = "Замовлення без передоплати";
        break;
      case "critical":
        filtered = debtItems.filter((o) => Number(o.DebtMoreTen || 0) > 0);
        title = "Замовлення з прострочкою > 10 днів";
        break;
      case "nedoavans":
        filtered = debtItems.filter((o) => Number(o.NedoAvans || 0) > 0);
        title = "Недоавансовані замовлення";
        break;
      case "in_route":
        filtered = debtItems.filter((o) => Number(o.Debt || 0) > 0);
        title = "Борг у маршрутах (в дорозі)";
        break;
      case "money_way":
        filtered = debtItems.filter((o) => Number(o.Summa || 0) > 0);
        title = "Гроші в дорозі";
        break;
      default:
        return;
    }

    setFilteredDetailOrders(filtered);
    setDetailTitle(title);
    setDetailModalOpen(true);
  };

  // ✅ ОНОВЛЕНА ФУНКЦІЯ ОПЛАТИ З МОДАЛКИ (З ФІЛЬТРОМ)
  const handlePayFromDetails = (zakazNum) => {
    // const orderToPay = orders.find(
    //   (o) => String(o.OrderNumber) === String(zakazNum),
    // );

    setSearch(String(zakazNum));

    setStatusFilter("all");
    setContractFilter("all");

    // if (orderToPay) {
    //   setDetailModalOpen(false);
    //   setSelectedOrder(orderToPay);
    //   setModalOpen(true);
    // } else {

    setDetailModalOpen(false);
    addNotification(
      `Замовлення № ${zakazNum} додано у фільтр пошуку.`,
      "success",
    );
  };

  const openPaymentModal = (order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setSelectedOrder(null);
  };

  const makePayment = async (contractID, amount) => {
    try {
      await axiosInstance.post("/payments/make_payment_from_advance/", {
        contract: contractID,
        order_id: selectedOrder.OrderID_GUID,
        amount: Number(amount),
      });
      addNotification("Оплату виконано!", "success");
      closeModal();
      loadData();
    } catch {
      addNotification("Помилка при оплаті", "warning");
    }
  };

  const Sidebar = (
    <div
      className={`content-filter-payment column ${isMobile ? (isSidebarOpen ? "open" : "closed") : ""}`}
    >
      {isMobile && (
        <div className="sidebar-header-payment row ai-center jc-space-between">
          <span>Фільтри</span>
          <span
            className="icon icon-cross"
            onClick={() => setIsSidebarOpen(false)}
          />
        </div>
      )}
      <span className="payment-filter-headers-name">Пошук</span>
      <div className="search-wrapper-payment">
        <input
          type="text"
          className="search-orders"
          placeholder="номер замовлення"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {!!search && (
          <span
            className="icon icon-cancel2 clear-search-payment"
            onClick={() => setSearch("")}
          />
        )}
      </div>

      <div className="delimiter1" />
      <span className="payment-filter-headers-name">Статуси</span>
      <ul className="filter column align-center">
        {STATUS_FILTERS.map(({ key, label, icon }) => {
          const count =
            key === "all" ? statusSummary.all : statusSummary[key] || 0;
          return (
            <li
              key={key}
              className={`filter-item ${statusFilter === key ? "active" : ""} ${count === 0 ? "empty-filter" : ""}`}
              onClick={() => {
                if (count > 0) setStatusFilter(key);
                if (isMobile) setIsSidebarOpen(false);
              }}
            >
              <span className={`icon ${icon} font-size-24`} />
              <span className="w-100">{label}</span>
              <span>{count}</span>
            </li>
          );
        })}
      </ul>

      <div className="delimiter1" />
      <span className="payment-filter-headers-name">Договори</span>
      <ul className="filter column align-center">
        <li
          className={`filter-item ${contractFilter === "all" ? "active" : ""}`}
          onClick={() => {
            setContractFilter("all");
            if (isMobile) setIsSidebarOpen(false);
          }}
        >
          <span className="icon icon-files-empty font-size-24" />
          <span className="w-100">Усі договори</span>
          <span>{orders.length}</span>
        </li>
        {contractFilters.map((c) => (
          <li
            key={c.guid}
            className={`filter-item ${contractFilter === c.guid ? "active" : ""}`}
            onClick={() => {
              setContractFilter(c.guid);
              if (isMobile) setIsSidebarOpen(false);
            }}
          >
            <span className="icon icon-file-text2 font-size-24" />
            <span className="w-100 no-wrap-ellipsis" title={c.name}>
              {c.name}
            </span>
            <span>{c.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className={`column portal-body ${isDark ? "dark-theme" : ""}`}>
      {loading && (
        <div className="loading-spinner-wrapper">
          <div className="loading-spinner"></div>
        </div>
      )}
      {isMobile && isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="content-wrapper row w-100 h-100">
        {Sidebar}

        <div className="content p-30" id="content">
          <div className="pp-header">
            <div className="pp-title-header row ai-center gap-7">
              {isMobile && !isSidebarOpen && (
                <span
                  className="icon icon-menu font-size-24"
                  onClick={() => setIsSidebarOpen(true)}
                  style={{ cursor: "pointer" }}
                />
              )}
              <span>Фінанси</span>
            </div>
            <button className="pp-reload" onClick={loadData}>
              ⟳ Оновити дані
            </button>
          </div>

          {error && <div className="pp-error">{error}</div>}

          {/* АНАЛІТИЧНА ТАБЛИЦЯ */}
          {debtTotal && (
            <div className="analytics-container">
              {/* Цей блок видно ТІЛЬКИ на десктопі */}
              <div className="analytics-table-container desktop-only-payment">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Ліміт боргів</th>
                      <th>Переліміт боргів</th>
                      <th>Використання ліміту</th>
                      <th>Без передоплати</th>
                      <th>Недоавансовані</th>
                      <th>Борг після реалізації</th>
                      <th>Борг після завершення маршрута</th>
                      <th>Гроші в дорозі</th>
                      <th style={{ whiteSpace: "nowrap" }}>Борг {">"} 10дн</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td
                        className={
                          debtTotal.CustomerLimit == null
                            ? " bold-text "
                            : "text-success bold-text"
                        }
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {debtTotal.CustomerLimit === null ||
                        debtTotal.CustomerLimit === 0
                          ? "—"
                          : `${formatCurrency(debtTotal.CustomerLimit)} грн`}
                      </td>
                      <td
                        className={
                          Number(debtTotal.Debt || 0) +
                            Number(debtTotal.Summa || 0) >
                            debtTotal.CustomerLimit &&
                          debtTotal.CustomerLimit > 0
                            ? "text-danger bold-text"
                            : "bold-text"
                        }
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {debtTotal.CustomerLimit > 0 &&
                        Number(debtTotal.Debt || 0) +
                          Number(debtTotal.Summa || 0) >
                          debtTotal.CustomerLimit
                          ? `${formatCurrency(Number(debtTotal.Debt || 0) + Number(debtTotal.Summa || 0) + Number(debtTotal.BezPeredOplaty || 0) - debtTotal.CustomerLimit)} грн`
                          : "—"}
                      </td>
                      <td
                        className={
                          debtTotal.CustomerLimit == null
                            ? " bold-text "
                            : "text-info bold-text"
                        }
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {debtTotal.CustomerLimit > 0
                          ? formatCurrency(
                              Math.min(
                                Number(debtTotal.CustomerLimit),
                                Number(debtTotal.Debt || 0) +
                                  Number(debtTotal.Summa || 0) +
                                  Number(debtTotal.BezPeredOplaty || 0),
                              ),
                            )
                          : "—"}{" "}
                        {debtTotal.CustomerLimit > 0 && "грн"}
                      </td>
                      <td
                        className={
                          Number(debtTotal.BezPeredOplaty || 0) > 0
                            ? "orange-text pointer-link text-bold"
                            : "orange-text text-bold"
                        }
                        style={{ whiteSpace: "nowrap" }}
                        onClick={() =>
                          Number(debtTotal.BezPeredOplaty || 0) > 0 &&
                          showDebtDetails("no_prepayment")
                        }
                      >
                        {Number(debtTotal.BezPeredOplaty || 0) > 0
                          ? `${formatCurrency(debtTotal.BezPeredOplaty)} грн`
                          : "—"}
                      </td>
                      <td
                        className={
                          Number(debtTotal.NedoAvans || 0) > 0
                            ? "dark-orange-text pointer-link"
                            : "dark-orange-text"
                        }
                        style={{ whiteSpace: "nowrap" }}
                        onClick={() =>
                          Number(debtTotal.NedoAvans || 0) > 0 &&
                          showDebtDetails("nedoavans")
                        }
                      >
                        {Number(debtTotal.NedoAvans || 0) > 0
                          ? `${formatCurrency(debtTotal.NedoAvans)} грн`
                          : "—"}
                      </td>
                      <td
                        className="dark-orange-text"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {Number(debtTotal.Debt || 0) +
                          Number(debtTotal.Summa || 0) >
                        0
                          ? `${formatCurrency(Number(debtTotal.Debt || 0) + Number(debtTotal.Summa || 0))} грн`
                          : "—"}
                      </td>
                      <td
                        className={
                          Number(debtTotal.Debt || 0) > 0
                            ? "dark-orange-text pointer-link"
                            : "dark-orange-text"
                        }
                        style={{ whiteSpace: "nowrap" }}
                        onClick={() =>
                          Number(debtTotal.Debt || 0) > 0 &&
                          showDebtDetails("in_route")
                        }
                      >
                        {Number(debtTotal.Debt || 0) > 0
                          ? `${formatCurrency(debtTotal.Debt)} грн`
                          : "—"}
                      </td>
                      <td
                        className={
                          Number(debtTotal.Summa || 0) > 0
                            ? "text-warning pointer-link text-bold"
                            : " text-bold"
                        }
                        style={{ whiteSpace: "nowrap" }}
                        onClick={() =>
                          Number(debtTotal.Summa || 0) > 0 &&
                          showDebtDetails("money_way")
                        }
                      >
                        {Number(debtTotal.Summa || 0) > 0
                          ? `${formatCurrency(debtTotal.Summa)} грн`
                          : "—"}
                      </td>
                      <td
                        className={
                          Number(debtTotal.DebtMoreTen || 0) > 0
                            ? "text-danger pointer-link text-bold"
                            : " text-bold"
                        }
                        style={{ whiteSpace: "nowrap" }}
                        onClick={() =>
                          Number(debtTotal.DebtMoreTen || 0) > 0 &&
                          showDebtDetails("critical")
                        }
                      >
                        {Number(debtTotal.DebtMoreTen || 0) > 0
                          ? `${formatCurrency(debtTotal.DebtMoreTen)} грн`
                          : "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Цей блок видно ТІЛЬКИ на мобілці */}
              <div className="analytics-mobile-grid mobile-only-payment">
                <div className="analytics-card">
                  <span className="label">Ліміт боргів</span>
                  <span className="value bold-text">
                    {debtTotal.CustomerLimit
                      ? `${formatCurrency(debtTotal.CustomerLimit)} ₴`
                      : "—"}
                  </span>
                </div>

                <div className="analytics-card">
                  <span className="label">Переліміт</span>
                  <span className="value red-text">
                    {debtTotal.CustomerLimit > 0 &&
                    Number(debtTotal.Debt || 0) + Number(debtTotal.Summa || 0) >
                      debtTotal.CustomerLimit
                      ? formatCurrency(
                          Number(debtTotal.Debt || 0) +
                            Number(debtTotal.Summa || 0) +
                            Number(debtTotal.BezPeredOplaty || 0) -
                            debtTotal.CustomerLimit,
                        )
                      : "0,00"}{" "}
                    ₴
                  </span>
                </div>

                <div
                  className="analytics-card clickable"
                  onClick={() =>
                    Number(debtTotal.BezPeredOplaty || 0) > 0 &&
                    showDebtDetails("no_prepayment")
                  }
                >
                  <span className="label">Без передоплати</span>
                  <span className="value orange-text">
                    {formatCurrency(debtTotal.BezPeredOplaty)} ₴
                  </span>
                </div>

                <div
                  className="analytics-card clickable"
                  onClick={() =>
                    Number(debtTotal.DebtMoreTen || 0) > 0 &&
                    showDebtDetails("critical")
                  }
                >
                  <span className="label">Борг {">"} 10дн</span>
                  <span className="value red-text">
                    {formatCurrency(debtTotal.DebtMoreTen)} ₴
                  </span>
                </div>

                <div
                  className="analytics-card clickable"
                  onClick={() =>
                    Number(debtTotal.Debt || 0) > 0 &&
                    showDebtDetails("in_route")
                  }
                >
                  <span className="label">У маршрутах</span>
                  <span className="value dark-orange-text">
                    {formatCurrency(debtTotal.Debt)} ₴
                  </span>
                </div>

                <div className="analytics-card">
                  <span className="label">Борг (реаліз.)</span>
                  <span className="value dark-orange-text">
                    {formatCurrency(
                      Number(debtTotal.Debt || 0) +
                        Number(debtTotal.Summa || 0),
                    )}{" "}
                    ₴
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* АВАНСИ */}
          <h2 className="pp-title" style={{ marginTop: 24 }}>
            Ваші аванси на договорах
          </h2>
          <div className="pp-badges">
            {contracts.length === 0 ? (
              <div className="pp-empty">Аванси відсутні</div>
            ) : (
              contracts.map((c, i) => (
                <div key={i} className="pp-badge">
                  {c.DogovorName} —{" "}
                  <strong>{formatCurrency(c.DogovorBalance)} грн</strong>
                </div>
              ))
            )}
          </div>

          {/* СПИСОК ЗАМОВЛЕНЬ */}
          <h2 className="pp-title" style={{ marginTop: 24 }}>
            Замовлення до оплати
          </h2>
          <div className="pp-orders-wrapper">
            {filteredOrders.length === 0 ? (
              <div className="pp-empty">
                Немає замовлень за обраними фільтрами
              </div>
            ) : (
              filteredOrders.map((o, i) => (
                <div className="pp-order-card" key={i}>
                  <div className="pp-row pp-order-row">
                    <div className="pp-order-col">
                      <div className="pp-num">№ {o.OrderNumber}</div>
                      <div className="pp-date">
                        {o.OrderDate
                          ? formatDateHuman(o.OrderDate.slice(0, 10))
                          : "—"}
                      </div>
                    </div>
                    <div className="pp-status-col">
                      <span
                        className={`status-pill ${STATUS_COLORS[normalizeStatus(o.OrderStage)] || "status-unknown"}`}
                      >
                        {normalizeStatus(o.OrderStage)}
                      </span>
                    </div>
                    <div className="pp-info">
                      <span>Сума:</span>{" "}
                      <strong className="order-sum">
                        {formatCurrency(o.OrderSum)}
                      </strong>
                    </div>
                    <div className="pp-info">
                      <span>Оплачено:</span>{" "}
                      <strong className="pp-green">
                        {formatCurrency(o.PaidAmount)}
                      </strong>
                    </div>
                    <div className="pp-info">
                      <span>Залишок:</span>{" "}
                      <strong className="pp-red">
                        {formatCurrency(o.DebtAmount)}
                      </strong>
                    </div>
                    <div className="pp-pay-btn-wrapper">
                      <button
                        className="pp-pay-btn"
                        onClick={() => openPaymentModal(o)}
                      >
                        Оплатити
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* DRILL-DOWN MODAL */}
      {detailModalOpen && (
        <div
          className="pay-modal-overlay"
          onClick={() => setDetailModalOpen(false)}
        >
          <div
            className="pay-modal-window"
            style={{ width: "750px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pay-modal-header">
              <h3>{detailTitle}</h3>
              <span
                className="pay-close-btn icon-cross"
                onClick={() => setDetailModalOpen(false)}
              />
            </div>
            <div
              className="pay-modal-body"
              style={{
                padding: "0px 10px",
                overflowY: "auto",
                maxHeight: "60vh",
              }}
            >
              <table className="details-list-table">
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    background: isDark ? "#2b2b2b" : "#fff",
                    zIndex: 10,
                  }}
                >
                  <tr>
                    <th>№</th>
                    <th className="mobile-none">Дата</th>
                    <th>Сума</th>
                    {/* <th className="mobile-none">Статус маршруту</th> */}
                    <th style={{ textAlign: "center" }}>Дія</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDetailOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        style={{ textAlign: "center", padding: "20px" }}
                      >
                        Дані відсутні
                      </td>
                    </tr>
                  ) : (
                    filteredDetailOrders.map((o, idx) => (
                      <tr key={idx}>
                        <td className="bold">{o.ZakazNum}</td>
                        <td className="mobile-none">
                          {formatDateHumanShorter(o.ZakazDate?.slice(0, 10))}
                        </td>
                        <td className="bold" style={{ color: "#1da8df" }}>
                          {formatCurrency(
                            o.Debt ||
                              o.BezPeredOplaty ||
                              o.NedoAvans ||
                              o.Summa,
                          )}{" "}
                          грн
                        </td>
                        {/* <td className="mobile-none">{o.RouteStatus || "—"}</td> */}
                        <td className="detail-action">
                          <div className="center-wrapper">
                            <button
                              className="pay-btn-confirm mini-action-btn"
                              onClick={() => handlePayFromDetails(o.ZakazNum)}
                              title="Знайти в списку"
                            >
                              <span className="icon-search" />
                              <span className="btn-text mobile-none">
                                {" "}
                                Знайти
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="pay-modal-footer">
              <button
                className="pay-btn-cancel"
                onClick={() => setDetailModalOpen(false)}
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {modalOpen && selectedOrder && (
        <PaymentModal
          order={selectedOrder}
          contracts={contracts}
          onClose={closeModal}
          onConfirm={makePayment}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
}
