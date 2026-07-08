import React, { useState, useEffect } from "react";
import PaymentModal from "../components/Orders/PaymentModal";
import { formatDateHuman, formatDateHumanShorter } from "../utils/formatters";
import { AppIcon } from "../components/Icons/AppIcon";

export default function PaymentsPageDesktop(props) {
  const {
    isDark, contracts, debtItems, debtTotal, error,
    statusFilter, setStatusFilter, search, setSearch,
    contractFilter, setContractFilter, filteredOrders,
    contractFilters, statusSummary, STATUS_FILTERS, STATUS_COLORS,
    formatCurrency, normalizeStatus, loadData, makePayment
  } = props;

  const searchIcon = "/assets/icons/SearchIcon.png";
  const allContracts = "/assets/icons/AllContracts.png";
  const contract = "/assets/icons/Contracts.png";

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTitle, setDetailTitle] = useState("");
  const [filteredDetailOrders, setFilteredDetailOrders] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setDetailModalOpen(false);
        if (modalOpen) { setModalOpen(false); setSelectedOrder(null); }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [detailModalOpen, modalOpen]);

  const showDebtDetails = (type) => {
    let filtered = [];
    let title = "";
    if (type === "no_prepayment") { filtered = debtItems.filter(o => Number(o.BezPeredOplaty || 0) > 0); title = "Замовлення без передоплати"; }
    else if (type === "critical") { filtered = debtItems.filter(o => Number(o.DebtMoreTen || 0) > 0); title = "Замовлення з прострочкою > 10 днів"; }
    else if (type === "nedoavans") { filtered = debtItems.filter(o => Number(o.NedoAvans || 0) > 0); title = "Недоавансовані замовлення"; }
    else if (type === "in_route") { filtered = debtItems.filter(o => Number(o.Debt || 0) > 0); title = "Борг у маршрутах (в дорозі)"; }
    else if (type === "money_way") { filtered = debtItems.filter(o => Number(o.Summa || 0) > 0); title = "Гроші в дорозі"; }
    setFilteredDetailOrders(filtered);
    setDetailTitle(title);
    setDetailModalOpen(true);
  };

  const openPaymentModal = (order) => { setSelectedOrder(order); setModalOpen(true); };

  return (
    <div className={`column portal-body ${isDark ? "dark-theme" : ""}`}>
      <div className="content-wrapper row w-100 h-100">
        <div className="row h-100 max-w-[1334px] w-100">
          
          {/* DESKTOP SIDEBAR */}
          <div className="content-filter-payment column !pr-4">
            <span className="payment-filter-headers-name uppercase">Пошук</span>
            <div className="search-wrapper-payment">
              <input type="text" className="search-orders" placeholder="номер замовлення" value={search} onChange={(e) => setSearch(e.target.value)} />
              <img src={searchIcon} alt="" className="relative right-[-2%] top-[-50%] cursor-pointer text-[18px]" />
            </div>

            <div className="w-72 bg-white shadow-sm py-[18px] rounded-tl-[5px] rounded-tr-[20px] rounded-bl-[5px] rounded-br-[20px]">
              <span className="payment-filter-headers-name !pl-3 !pb-2">Статуси</span>
              <ul className="flex flex-col w-full gap-1 p-0 m-0 list-none">
                {STATUS_FILTERS.map(({ key, label, icon }) => {
                  const isActive = statusFilter === key;
                  const count = key === "all" ? statusSummary.all : statusSummary[key] || 0;
                  return (
                    <li key={key} className={`flex items-center justify-between px-4 py-2.5 mx-2 rounded-md cursor-pointer transition-all duration-200 ${isActive ? "bg-[#6699cc] text-white" : "hover:bg-gray-50 text-gray-700"}`} onClick={() => setStatusFilter(key)}>
                      <div className="flex items-center min-w-0 flex-1">
                        <img src={icon} alt="" className={`mr-3 w-5 h-5 object-contain flex-shrink-0 ${isActive ? "brightness-0 invert" : "opacity-70"}`} />
                        <span className="truncate text-sm font-medium">{label}</span>
                      </div>
                      <span className={`status-badge flex-shrink-0 ${isActive ? "badge-active" : count === 0 ? "badge-zero" : "badge-normal"}`}>{count}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="w-72 mt-3 bg-white shadow-sm py-[18px] rounded-tl-[5px] rounded-tr-[20px] rounded-bl-[5px] rounded-br-[20px]">
              <div className="payment-filter-headers-name !pl-3 !pb-2">Договори</div>
              <ul className="flex flex-col w-full gap-1 p-0 m-0 list-none">
                <li className={`flex items-center justify-between px-4 py-2.5 mx-2 rounded-md cursor-pointer transition-all duration-200 ${contractFilter === "all" ? "bg-[#6699cc] text-white" : "hover:bg-gray-50 text-gray-700"}`} onClick={() => setContractFilter("all")}>
                  <div className="flex items-center min-w-0 flex-1">
                    <img src={allContracts} alt="" className={`mr-3 w-5 h-5 object-contain flex-shrink-0 ${contractFilter === "all" ? "brightness-0 invert" : "opacity-70"}`} />
                    <span className="truncate text-sm font-medium">Усі договори</span>
                  </div>
                  <span className={`status-badge flex-shrink-0 ${contractFilter === "all" ? "badge-active" : "badge-normal"}`}>{statusSummary.all}</span>
                </li>
                {contractFilters.map((c) => {
                  const isActive = contractFilter === c.guid;
                  return (
                    <li key={c.guid} className={`flex items-center justify-between px-4 py-2.5 mx-2 rounded-md cursor-pointer transition-all duration-200 ${isActive ? "bg-[#6699cc] text-white" : "hover:bg-gray-50 text-gray-700"}`} onClick={() => setContractFilter(c.guid)}>
                      <div className="flex items-center min-w-0 flex-1">
                        <img src={contract} alt="" className={`mr-3 w-5 h-5 object-contain flex-shrink-0 ${isActive ? "brightness-0 invert" : "opacity-70"}`} />
                        <span className="truncate text-sm font-medium" title={c.name}>{c.name}</span>
                      </div>
                      <span className={`status-badge flex-shrink-0 ${isActive ? "badge-active" : c.count === 0 ? "badge-zero" : "badge-normal"}`}>{c.count}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* DESKTOP CONTENT */}
          <div className="content" id="content">
            <div className="pp-header">
              <span className="payment-filter-headers-name uppercase">Фінанси</span>
              <button className="pp-reload flex items-center gap-2 font-bold" onClick={loadData}>
                <AppIcon name="reload" className='w-[18px] h-[18px]' /> Оновити дані
              </button>
            </div>

            {error && <div className="pp-error">{error}</div>}

            {debtTotal && (
              <div className="analytics-container">
                <div className="analytics-row-top">
                  <div className="analytics-card"><div className="card-title">Ліміт боргів</div><div className="card-value">{debtTotal.CustomerLimit ? `${formatCurrency(debtTotal.CustomerLimit)} ${debtTotal.CurrencyName}` : "—"}</div></div>
                  <div className="analytics-card" onClick={() => showDebtDetails("critical")}><div className="card-title">Переліміт боргів</div><div className="card-value">—</div></div>
                  <div className="analytics-card"><div className="card-title">Використання ліміту</div><div className="card-value">{debtTotal.CustomerLimit ? formatCurrency(debtTotal.LimitUsage ?? Math.min(Number(debtTotal.CustomerLimit), Number(debtTotal.Debt || 0) + Number(debtTotal.Summa || 0) + Number(debtTotal.BezPeredOplaty || 0))) : "—"}</div></div>
                  <div className="analytics-card pointer-link" onClick={() => showDebtDetails("no_prepayment")}><div className="card-title">Без передоплати</div><div className="card-value">{Number(debtTotal.BezPeredOplaty) > 0 ? `${formatCurrency(debtTotal.BezPeredOplaty)} ${debtTotal.CurrencyName}` : "—"}</div></div>
                  <div className="analytics-card pointer-link" onClick={() => showDebtDetails("nedoavans")}><div className="card-title">Недоавансовані</div><div className="card-value">{Number(debtTotal.NedoAvans) > 0 ? `${formatCurrency(debtTotal.NedoAvans)} ${debtTotal.CurrencyName}` : "—"}</div></div>
                </div>
                <div className="analytics-divider" />
                <div className="analytics-row-bottom">
                  <div className="analytics-card"><div className="card-title">Борг після реалізації</div><div className="card-value">{formatCurrency(Number(debtTotal.Debt) + Number(debtTotal.Summa))}</div></div>
                  <div className="analytics-card pointer-link" onClick={() => showDebtDetails("in_route")}><div className="card-title">Борг у маршруті</div><div className="card-value">{formatCurrency(debtTotal.Debt)}</div></div>
                  <div className="analytics-card pointer-link" onClick={() => showDebtDetails("money_way")}><div className="card-title">Гроші в дорозі</div><div className="card-value">{formatCurrency(debtTotal.Summa)}</div></div>
                  <div className="analytics-card pointer-link" onClick={() => showDebtDetails("critical")}><div className="card-title">Борг {">"} 10дн</div><div className="card-value text-danger">{formatCurrency(debtTotal.DebtMoreTen)}</div></div>
                </div>
              </div>
            )}

            <h2 className="pp-title" style={{ marginTop: 24 }}>Ваші аванси на договорах</h2>
            <div className="pp-badges">
              {contracts.length === 0 ? <div className="pp-empty">Аванси відсутні</div> : contracts.map((c, i) => (
                <div key={i} className="pp-badge">{c.DogovorName} — <strong>{formatCurrency(c.DogovorBalance)} {c.CurrencyName}</strong></div>
              ))}
            </div>

            <h2 className="pp-title" style={{ marginTop: 24 }}>Замовлення до оплати</h2>
            <div className="pp-orders-wrapper">
              {filteredOrders.length === 0 ? <div className="pp-empty">Немає замовлень за обраними фільтрами</div> : filteredOrders.map((o, i) => {
                const currentStatus = normalizeStatus(o.OrderStage);
                const statusObj = STATUS_FILTERS.find(f => f.key === currentStatus);
                return (
                  <div className="pp-order-card" key={i}>
                    <div className="pp-section pp-order-meta">
                      <div className="pp-num">№ {o.OrderNumber}</div>
                      <div className="pp-date">{o.OrderDate ? formatDateHuman(o.OrderDate.slice(0, 10)) : "—"}</div>
                    </div>
                    <div className="pp-section pp-status-col">
                      <span className={`status-pill ${statusObj ? statusObj.colorClass : "status-unknown"}`}>
                        <img src={statusObj ? statusObj.icon : allContracts} alt="" className="status-pill-icon brightness-0 invert" />
                        {currentStatus}
                      </span>
                    </div>
                    <div className="pp-section pp-info-block">
                      <div className="pp-label">Сума</div>
                      <div className="pp-value-wrapper">
                        <AppIcon name="money" className="w-[20px] h-[18px]" />
                        <strong className="order-sum">{formatCurrency(o.OrderSum)} <span className="pp-currency">{o.CurrencyName || "грн"}</span></strong>
                      </div>
                    </div>
                    <div className="pp-section pp-info-block">
                      <div className="pp-label">Оплачено</div>
                      <div className="pp-value-wrapper">
                        <AppIcon name="moneyGreen" className="w-[20px] h-[18px]" />
                        <strong className="pp-green">{formatCurrency(o.PaidAmount)} <span className="pp-currency">{o.CurrencyName || "грн"}</span></strong>
                      </div>
                    </div>
                    <div className="pp-section pp-info-block">
                      <div className="pp-label">Залишок</div>
                      <div className="pp-value-wrapper">
                        <AppIcon name="moneyRed" className="w-[20px] h-[18px]" />
                        <strong className="pp-red">{formatCurrency(o.DebtAmount)} <span className="pp-currency">{o.CurrencyName || "грн"}</span></strong>
                      </div>
                    </div>
                    <div className="pp-section pp-pay-btn-wrapper">
                      <button className="pp-pay-btn" onClick={() => openPaymentModal(o)}>
                        <span className="pp-pay-icon"><AppIcon name="pay" className="w-5 h-5" /></span> Оплатити
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* DRILL-DOWN MODAL */}
      {detailModalOpen && (
        <div className="pay-modal-overlay" onClick={() => setDetailModalOpen(false)}>
          <div className="pay-modal-window" style={{ width: "750px" }} onClick={(e) => e.stopPropagation()}>
            <div className="pay-modal-header">
              <h3>{detailTitle}</h3>
              <span className="pay-close-btn icon-cross" onClick={() => setDetailModalOpen(false)} />
            </div>
            <div className="pay-modal-body" style={{ padding: "0 10px", overflowY: "auto", maxHeight: "60vh" }}>
              <table className="details-list-table">
                <thead>
                  <tr><th>№</th><th>Дата</th><th>Сума</th><th style={{ textAlign: "center" }}>Дія</th></tr>
                </thead>
                <tbody>
                  {filteredDetailOrders.length === 0 ? <tr><td colSpan="4" style={{ textAlign: "center" }}>Дані відсутні</td></tr> : filteredDetailOrders.map((o, idx) => (
                    <tr key={idx}>
                      <td className="bold">{o.ZakazNum}</td>
                      <td>{formatDateHumanShorter(o.ZakazDate?.slice(0, 10))}</td>
                      <td className="bold" style={{ color: "#1da8df" }}>{formatCurrency(o.Debt || o.NedoAvans || o.Summa || o.ZakazSumma)} {o.CurrencyName || "грн"}</td>
                      <td className="detail-action">
                        <button className="pay-btn-confirm mini-action-btn" onClick={() => { setSearch(String(o.ZakazNum)); setStatusFilter("all"); setContractFilter("all"); setDetailModalOpen(false); }}>Знайти</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {modalOpen && selectedOrder && (
        <PaymentModal order={selectedOrder} contracts={contracts} onClose={() => { setModalOpen(false); setSelectedOrder(null); }} onConfirm={makePayment} formatCurrency={formatCurrency} />
      )}
    </div>
  );
}
