import React, { useState, useEffect, useCallback, useMemo } from "react";
import axiosInstance from "../api/axios";
import { useTheme } from "../hooks/useTheme";
import PaymentModal from "../components/Orders/PaymentModal";
import DebtDetailModal from "./DebtDetailModal"; // 👈 Імпортуємо нову модалку
import { formatDateHuman } from "../utils/formatters";
import PaymentsMobileContent from "./PaymentsMobileContent.jsx";
// Стилі
import "../components/Portal/PortalOriginal.css";
import "../components/Portal/PortalSidebar.css";
import "./PaymentsPage.css";
import { useNotification } from "../hooks/useNotification";
import { AppIcon } from "../components/Icons/AppIcon";
import PaymentsAnalyticsMobile from "./PaymentsAnalyticsMobile";

// Хук для мобільної версії
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    window.matchMedia("(max-width: 1024px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1024px)");
    const listener = (e) => setIsMobile(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);
  return isMobile;
};

const useIsMobile_2 = () => {
  const [isMobile, setIsMobile] = useState(
    window.matchMedia("(max-width: 1269px)").matches,
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

  const isMobileLarger = useIsMobile_2();

  const yearIcon = "/assets/icons/YearIcon.png";
  const plusIcon = "/assets/icons/PlusIcon.png";

  const allPayment = "/assets/icons/AllPayment.png";
  const newCalcIcon = "/assets/icons/NewCalcIcon.png";
  const inProcessingIcon = "/assets/icons/InProcessingIcon.png";
  const waitingForPaymentIcon = "/assets/icons/WaitingForPaymentIcon.png";
  const waitingForConfirmIcon = "/assets/icons/WaitingForConfirmIcon.png";
  const confirmedIcon = "/assets/icons/ConfirmedIcon.png";
  const factoryIcon = "/assets/icons/FactoringIcon.png";
  const finishedIcon = "/assets/icons/FinishedIcon.png";
  const deliveredIcon = "/assets/icons/DeliveredIcon.png";
  const canceledCalcIcon = "/assets/icons/CancelCalc.png";
  const filterIcon = "/assets/icons/FiltersIcon.png";
  const nelicvid = "/assets/icons/Nelicvid.png";
  const allContracts = "/assets/icons/AllContracts.png";
  const contract = "/assets/icons/Contracts.png";
  

  const closeIcon = "/assets/icons/CloseButton.png";

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
    "У виробництві": "status-production",
    Готовий: "status-ready",
    Відвантажений: "status-shipped",
    Неліквід: "status-closed",
    "—": "status-unknown",
  };

  const STATUS_FILTERS = [
    { key: "all", label: "Усі замовлення", icon: allPayment, colorClass: "status-all" },
    { key: "Очікуємо підтвердження", label: "Очікуємо підтвердження", icon: waitingForConfirmIcon, colorClass: "status-wait-confirm" },
    { key: "Очікуємо оплату", label: "Очікуємо оплату", icon: waitingForPaymentIcon, colorClass: "status-wait-payment" },
    { key: "Підтверджено", label: "Підтверджено", icon: confirmedIcon, colorClass: "status-confirmed" },
    { key: "У виробництві", label: "У виробництві", icon: factoryIcon, colorClass: "status-production" },
    { key: "Готовий", label: "Готовий", icon: finishedIcon, colorClass: "status-ready" },
    { key: "Відвантажений", label: "Відвантажений", icon: deliveredIcon, colorClass: "status-shipped" },
    { key: "Неліквід", label: "Неліквід", icon: nelicvid, colorClass: "status-closed" },
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
      setError("Помилка завантаження фінансових даних");
    } finally {
      setLoading(false);
    }
  }, [contractorGUID]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (detailModalOpen) setDetailModalOpen(false);
        if (modalOpen) closeModal();
      }
    };

    if (detailModalOpen || modalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [detailModalOpen, modalOpen]);

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

  const handlePayFromDetails = (zakazNum) => {
    setSearch(String(zakazNum));
    setStatusFilter("all");
    setContractFilter("all");
    setDetailModalOpen(false);
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

  const searchIcon = "/assets/icons/SearchIcon.png";

  const Sidebar = (
    <div className={`content-filter-payment column !pr-4 ${isMobileLarger ? (isSidebarOpen ? "open" : "closed") : ""}`}>
      {isMobileLarger && (
        <div className="sidebar-header-payment row ai-center jc-space-between">
          <span>Фільтри</span>
          <div onClick={() => setIsSidebarOpen(false)} >
           <AppIcon name="closeFiltersButton" className='w-[30px] h-[30px]' />
           </div>
          {/* <span className="icon icon-cross" onClick={() => setIsSidebarOpen(false)} /> */}
        </div>
      )}
      <span className="payment-filter-headers-name uppercase">Пошук</span>
      <div className="search-wrapper-payment">
        <input
          type="text"
          className="search-orders"
          placeholder="номер замовлення"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <img src={searchIcon} alt="" className="relative right-[-2%] top-[-60%] cursor-pointer text-[18px] text-[var(--text-color)] leading-none" />
      </div>

      <div className="filters-scroll">

      <div className="min-[1260px]:w-72 min-[1260px]:bg-white min-[1260px]:shadow-sm min-[1260px]:py-[18px] min-[1260px]:rounded-tl-[5px] min-[1260px]:rounded-tr-[20px] min-[1260px]:rounded-bl-[5px] min-[1260px]:rounded-br-[20px] max-[1260px]:bg-transparent max-[1260px]:shadow-none max-[1260px]:py-0 max-[1260px]:w-full max-[1260px]:overflow-visible">
        <div className="payment-type-headers-name !pl-3 !pb-2 uppercase">Статуси</div>
        <ul className="filter column align-center">
          {STATUS_FILTERS.map(({ key, label, icon }) => {
            const count = key === "all" ? statusSummary.all : statusSummary[key] || 0;
            return (
              <li
                key={key}
                className={`filter-item ${statusFilter === key ? "active" : ""} `}
                onClick={() => {
                  setStatusFilter(key);
                  if (isMobileLarger) setIsSidebarOpen(false);
                }}
              >
                <img
                  src={icon}
                  alt=""
                  className={`mr-3 object-contain transition-all duration-300 ${statusFilter === key ? "brightness-0 invert group-hover:invert-0 group-hover:brightness-0" : "opacity-70 group-hover:opacity-100 group-hover:brightness-0"}`}
                />
                <span className="w-100">{label}</span>
                <span>{count}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="divider-bottom" />

      <div className="min-[1260px]:w-72 mt-3 min-[1260px]:bg-white min-[1260px]:shadow-sm min-[1260px]:py-[18px] min-[1260px]:rounded-tl-[5px] min-[1260px]:rounded-tr-[20px] min-[1260px]:rounded-bl-[5px] min-[1260px]:rounded-br-[20px] max-[1260px]:bg-transparent max-[1260px]:shadow-none max-[1260px]:py-0 max-[1260px]:w-full max-[1260px]:overflow-visible">
        <div className="payment-type-headers-name !pl-3 !pb-2 uppercase">Договори</div>
        <ul className="filter column align-center">
          <li
            className={`filter-item ${contractFilter === "all" ? "active" : ""}`}
            onClick={() => {
              setContractFilter("all");
              if (isMobileLarger) setIsSidebarOpen(false);
            }}
          >
            <img
              src={allContracts}
              alt=""
              className={`mr-3 w-[20px] h-[20px] object-contain transition-all duration-300 ${contractFilter === "all" ? "brightness-0 invert" : "opacity-70 brightness-0"}`}
            />
            <span className="w-100">Усі договори</span>
            <span className={`status-badge ${contractFilter === "all" ? "badge-active" : orders.length === 0 ? "badge-zero" : "badge-normal"}`}>
              {orders.length}
            </span>
          </li>

          {contractFilters.map((c) => {
            const isActive = contractFilter === c.guid;
            return (
              <li
                key={c.guid}
                className={`filter-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  setContractFilter(c.guid);
                  if (isMobileLarger) setIsSidebarOpen(false);
                }}
              >
                <img
                  src={contract}
                  alt=""
                  className={`mr-3 w-[20px] h-[20px] object-contain transition-all duration-300 ${isActive ? "brightness-0 invert" : "opacity-70 brightness-0"}`}
                />
                <span className="w-100 no-wrap-ellipsis" title={c.name}>
                  {c.name}
                </span>
                <span className={`status-badge ${isActive ? "badge-active" : c.count === 0 ? "badge-zero" : "badge-normal"}`}>
                  {c.count}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
    </div>
  );

  return (
    <div className={`column portal-body ${isDark ? "dark-theme" : ""}`}>
      {loading && (
        <div className="loading-spinner-wrapper">
          <div className="loading-spinner"></div>
        </div>
      )}
      {isMobileLarger && isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      <div className="content-wrapper row w-100 h-100">
        <div className="row h-100 max-w-[1334px] w-100">
          {Sidebar}

          <div className="content scroll-bar-custom " id="content">
            <div className="pp-header">
              <div className="pp-title-header row ai-center gap-7">
                {isMobileLarger && (
                  // <span
                  //   className="icon icon-menu font-size-24"
                  //   onClick={() => setIsSidebarOpen(true)}
                  //   style={{ cursor: "pointer" }}
                  // />
                  <div
                  className="mobile-sidebar-toggle mr-1"
                  onClick={() => setIsSidebarOpen(true)}
                
                >
                     <AppIcon name="filters" className='w-[20px] h-[20px]' />
                </div>
                )}
                <div className="payment-type-headers-name uppercase !mt-0 !gap-0 !pt-0 leading-none">
                  Фінанси
                </div>
              </div>
              <button className="pp-reload flex items-center gap-2 font-bold " onClick={loadData}>
                <AppIcon name="reload" className='w-[18px] h-[18px]' /> Оновити дані
              </button>
            </div>

            {error && <div className="pp-error">{error}</div>}

            {/* АНАЛІТИЧНА ТАБЛИЦЯ */}
            {debtTotal &&
              (isMobile ? (
                <PaymentsAnalyticsMobile
                  debtTotal={debtTotal}
                  formatCurrency={formatCurrency}
                  showDebtDetails={showDebtDetails}
                />
              ) : (
                <div className="analytics-container">
                  <div className="analytics-row-top">
                    <div className="analytics-card !pl-0">
                      <div className="card-title">Ліміт боргів</div>
                      <div className="card-value">
                        {debtTotal.CustomerLimit === null || debtTotal.CustomerLimit === 0
                          ? "—"
                          : `${formatCurrency(debtTotal.CustomerLimit)} ${debtTotal.CurrencyName || "грн"}`}
                      </div>
                      <div className="mobile-vert-divider" />
                    </div>

                    <div className="analytics-card">
                      <div className="card-title">Переліміт боргів</div>
                      <div className={`card-value ${Number(debtTotal.Debt || 0) + Number(debtTotal.Summa || 0) > debtTotal.CustomerLimit && debtTotal.CustomerLimit > 0 ? "text-danger" : ""}`}>
                        {debtTotal.CustomerLimit > 0 && Number(debtTotal.Debt || 0) + Number(debtTotal.Summa || 0) > debtTotal.CustomerLimit
                          ? `${formatCurrency(Number(debtTotal.Debt || 0) + Number(debtTotal.Summa || 0) + Number(debtTotal.BezPeredOplaty || 0) - debtTotal.CustomerLimit)} ${debtTotal.CurrencyName || "грн"}`
                          : "—"}
                      </div>
                    </div>

                    <div className="analytics-card">
                      <div className="card-title">Використання ліміту</div>
                      <div className="card-value">
                        {debtTotal.CustomerLimit > 0
                          ? formatCurrency(Math.min(Number(debtTotal.CustomerLimit), Number(debtTotal.Debt || 0) + Number(debtTotal.Summa || 0) + Number(debtTotal.BezPeredOplaty || 0)))
                          : "—"}{" "}
                        {debtTotal.CustomerLimit > 0 && `${debtTotal.CurrencyName}`}
                      </div>
                    </div>

                    <div
                      className={`analytics-card ${Number(debtTotal.BezPeredOplaty || 0) > 0 ? "pointer-link" : ""}`}
                      onClick={() => Number(debtTotal.BezPeredOplaty || 0) > 0 && showDebtDetails("no_prepayment")}
                    >
                      <div className="card-title">Без передоплати</div>
                      <div className="card-value">
                        {Number(debtTotal.BezPeredOplaty || 0) > 0
                          ? `${formatCurrency(debtTotal.BezPeredOplaty)} ${debtTotal.CurrencyName || "грн"}`
                          : "—"}
                      </div>
                    </div>

                    <div
                      className={`analytics-card !pr-0 ${Number(debtTotal.NedoAvans || 0) > 0 ? "pointer-link" : ""}`}
                      onClick={() => Number(debtTotal.NedoAvans || 0) > 0 && showDebtDetails("nedoavans")}
                    >
                      <div className="card-title">Недоавансовані</div>
                      <div className="card-value">
                        {Number(debtTotal.NedoAvans || 0) > 0
                          ? `${formatCurrency(debtTotal.NedoAvans)} ${debtTotal.CurrencyName || "грн"}`
                          : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="analytics-divider" />

                  <div className="analytics-row-bottom">
                    <div className="analytics-card !pl-0">
                      <div className="card-title">Борг після реалізації</div>
                      <div className="card-value">
                        {Number(debtTotal.Debt || 0) + Number(debtTotal.Summa || 0) > 0
                          ? `${formatCurrency(Number(debtTotal.Debt || 0) + Number(debtTotal.Summa || 0))} ${debtTotal.CurrencyName || "грн"}`
                          : "—"}
                      </div>
                    </div>

                    <div
                      className={`analytics-card ${Number(debtTotal.Debt || 0) > 0 ? "pointer-link" : ""}`}
                      onClick={() => Number(debtTotal.Debt || 0) > 0 && showDebtDetails("in_route")}
                    >
                      <div className="card-title">Борг після завершення маршрута</div>
                      <div className="card-value">
                        {Number(debtTotal.Debt || 0) > 0
                          ? `${formatCurrency(debtTotal.Debt)} ${debtTotal.CurrencyName || "грн"}`
                          : "—"}
                      </div>
                    </div>

                    <div
                      className={`analytics-card ${Number(debtTotal.Summa || 0) > 0 ? "pointer-link" : ""}`}
                      onClick={() => Number(debtTotal.Summa || 0) > 0 && showDebtDetails("money_way")}
                    >
                      <div className="card-title">Гроші в дорозі</div>
                      <div className="card-value">
                        {Number(debtTotal.Summa || 0) > 0
                          ? `${formatCurrency(debtTotal.Summa)} ${debtTotal.CurrencyName || "грн"}`
                          : "—"}
                      </div>
                    </div>

                    <div
                      className={`analytics-card !pr-0 ${Number(debtTotal.DebtMoreTen || 0) > 0 ? "pointer-link" : ""}`}
                      onClick={() => Number(debtTotal.DebtMoreTen || 0) > 0 && showDebtDetails("critical")}
                    >
                      <div className="card-title">Борг {">"} 10дн</div>
                      <div className={`card-value ${Number(debtTotal.DebtMoreTen || 0) > 0 ? "text-danger" : ""}`}>
                        {Number(debtTotal.DebtMoreTen || 0) > 0
                          ? `${formatCurrency(debtTotal.DebtMoreTen)} ${debtTotal.CurrencyName || "грн"}`
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

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
                    {c.DogovorName} —{"\u00A0"}
                    <strong> {formatCurrency(c.DogovorBalance)} {c.CurrencyName}</strong>
                  </div>
                ))
              )}
            </div>

            {/* СПИСОК ЗАМОВЛЕНЬ */}
            <h2 className="pp-title" style={{ marginTop: 24 }}>
              Замовлення до оплати
            </h2>
            {isMobile ? (
              <PaymentsMobileContent
                filteredOrders={filteredOrders}
                openPaymentModal={openPaymentModal}
                formatCurrency={formatCurrency}
                normalizeStatus={normalizeStatus}
                STATUS_FILTERS={STATUS_FILTERS}
                inProcessingIcon={inProcessingIcon}
              />
            ) : (
              <div className="pp-orders-wrapper">
                {filteredOrders.length === 0 ? (
                  <div className="pp-empty">Немає замовлень за обраними фільтрами</div>
                ) : (
                  filteredOrders.map((o, i) => (
                    <div className="pp-order-card" key={i}>
                      <div className="pp-section pp-order-meta">
                        <div className="pp-num">№ {o.OrderNumber}</div>
                        <div className="pp-date">
                          {o.OrderDate ? formatDateHuman(o.OrderDate.slice(0, 10)) : "—"}
                        </div>
                      </div>

                      <div className="pp-section pp-status-col">
                        {(() => {
                          const currentStatus = normalizeStatus(o.OrderStage);
                          const statusObj = STATUS_FILTERS.find((f) => f.key === currentStatus);
                          const statusIcon = statusObj ? statusObj.icon : inProcessingIcon;
                          const statusColor = statusObj ? statusObj.colorClass : "status-unknown";

                          return (
                            <span className={`status-pill ${statusColor}`}>
                              <img src={statusIcon} alt="" className="brightness-0 invert" />
                              {currentStatus}
                            </span>
                          );
                        })()}
                      </div>

                      <div className="pp-section pp-info-block">
                        <div className="pp-label">Сума</div>
                        <div className="pp-value-wrapper">
                          <AppIcon name="money" className="w-[20px] h-[18px]" />
                          <strong className="order-sum">
                            {formatCurrency(o.OrderSum)}
                            <span className="pp-currency">{o.CurrencyName || "грн"}</span>
                          </strong>
                        </div>
                      </div>

                      <div className="pp-section pp-info-block">
                        <div className="pp-label">Оплачено</div>
                        <div className="pp-value-wrapper">
                          <AppIcon name="moneyGreen" className="w-[20px] h-[18px]" />
                          <strong className="pp-green">
                            {formatCurrency(o.PaidAmount)}
                            <span className="pp-currency">{o.CurrencyName || "грн"}</span>
                          </strong>
                        </div>
                      </div>

                      <div className="pp-section pp-info-block">
                        <div className="pp-label">Залишок</div>
                        <div className="pp-value-wrapper">
                          <AppIcon name="moneyRed" className="w-[20px] h-[18px]" />
                          <strong className="pp-red">
                            {formatCurrency(o.DebtAmount)}
                            <span className="pp-currency">{o.CurrencyName || "грн"}</span>
                          </strong>
                        </div>
                      </div>

                      <div className="pp-section pp-pay-btn-wrapper">
                        <button className="pp-pay-btn" onClick={() => openPaymentModal(o)}>
                          <span className="pp-pay-icon">
                            <AppIcon name="pay" className="w-[20px] h-[20px]" />
                          </span>
                          Оплатити
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* 🛠️ ВИКОРИСТОВУЄМО ОНОВЛЕНУ МOДАЛКУ ДЕТАЛЕЙ */}
        <DebtDetailModal
          isOpen={detailModalOpen}
          title={detailTitle}
          orders={filteredDetailOrders}
          isDark={isDark}
          formatCurrency={formatCurrency}
          onClose={() => setDetailModalOpen(false)}
          onPay={handlePayFromDetails}
        />

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
    </div>
  );
}