import React, { useState } from "react";
import PaymentModal from "../components/Orders/PaymentModal";
import { formatDateHuman } from "../utils/formatters";
import { AppIcon } from "../components/Icons/AppIcon";

export default function PaymentsPageMobile(props) {
  const {
    isDark, contracts, error, statusFilter, setStatusFilter, search, setSearch,
    contractFilter, setContractFilter, filteredOrders, contractFilters,
    statusSummary, STATUS_FILTERS, formatCurrency, normalizeStatus, loadData, makePayment
  } = props;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const searchIcon = "/assets/icons/SearchIcon.png";
  const allContracts = "/assets/icons/AllContracts.png";
  const contract = "/assets/icons/Contracts.png";

  return (
    <div className={`column portal-body ${isDark ? "dark-theme" : ""}`}>
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

      {/* MOBILE SIDEBAR (DRAWER) */}
      <div className={`content-filter-payment column ${isSidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header-payment row ai-center jc-space-between px-4 py-3 border-b">
          <span className="font-bold">Фільтри</span>
          <span className="icon icon-cross cursor-pointer" onClick={() => setIsSidebarOpen(false)} />
        </div>
        
        <div className="p-4">
          <span className="payment-filter-headers-name uppercase">Пошук</span>
          <div className="search-wrapper-payment mb-4">
            <input type="text" className="search-orders w-full" placeholder="номер замовлення" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <span className="payment-filter-headers-name !pb-2 block">Статуси</span>
          <ul className="flex flex-col w-full gap-1 p-0 m-0 list-none mb-4">
            {STATUS_FILTERS.map(({ key, label, icon }) => {
              const isActive = statusFilter === key;
              const count = key === "all" ? statusSummary.all : statusSummary[key] || 0;
              return (
                <li key={key} className={`flex items-center justify-between px-3 py-2 rounded-md ${isActive ? "bg-[#6699cc] text-white" : "text-gray-700"}`} onClick={() => { setStatusFilter(key); setIsSidebarOpen(false); }}>
                  <div className="flex items-center min-w-0 flex-1">
                    <img src={icon} alt="" className={`mr-2 w-4 h-4 object-contain ${isActive ? "brightness-0 invert" : ""}`} />
                    <span className="truncate text-sm">{label}</span>
                  </div>
                  <span className="text-xs font-bold">{count}</span>
                </li>
              );
            })}
          </ul>

          <div className="payment-filter-headers-name !pb-2">Договори</div>
          <ul className="flex flex-col w-full gap-1 p-0 m-0 list-none">
            <li className={`flex items-center justify-between px-3 py-2 rounded-md ${contractFilter === "all" ? "bg-[#6699cc] text-white" : "text-gray-700"}`} onClick={() => { setContractFilter("all"); setIsSidebarOpen(false); }}>
              <span>Усі договори</span>
              <span>{statusSummary.all}</span>
            </li>
            {contractFilters.map((c) => (
              <li key={c.guid} className={`flex items-center justify-between px-3 py-2 rounded-md ${contractFilter === c.guid ? "bg-[#6699cc] text-white" : "text-gray-700"}`} onClick={() => { setContractFilter(c.guid); setIsSidebarOpen(false); }}>
                <span className="truncate text-sm">{c.name}</span>
                <span className="text-xs">{c.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* MOBILE CONTENT CONTAINER */}
      <div className="content w-full p-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="icon icon-menu font-size-24 cursor-pointer" onClick={() => setIsSidebarOpen(true)} />
            <span className="payment-filter-headers-name uppercase">Фінанси</span>
          </div>
          <button className="pp-reload flex items-center gap-2 font-bold px-3 py-1.5 text-sm" onClick={loadData}>
            <AppIcon name="reload" className='w-4 h-4' /> Оновити
          </button>
        </div>

        {error && <div className="pp-error">{error}</div>}

        {/* COMPACT ORDERS LIST */}
        <div className="flex flex-col gap-3">
          {filteredOrders.length === 0 ? <div className="pp-empty">Замовлень немає</div> : filteredOrders.map((o, i) => {
            const currentStatus = normalizeStatus(o.OrderStage);
            const statusObj = STATUS_FILTERS.find(f => f.key === currentStatus);
            return (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-l-[#99cc33] flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-base">№ {o.OrderNumber}</span>
                  <span className="text-xs text-gray-500">{o.OrderDate ? formatDateHuman(o.OrderDate.slice(0, 10)) : "—"}</span>
                </div>
                
                <div className="my-1">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-white ${statusObj ? statusObj.colorClass : "bg-gray-400"}`}>
                    {currentStatus}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-dashed text-xs">
                  <div><span className="text-gray-500 block">Сума</span><span className="font-bold">{formatCurrency(o.OrderSum)}</span></div>
                  <div><span className="text-gray-500 block">Оплачено</span><span className="font-bold text-green-700">{formatCurrency(o.PaidAmount)}</span></div>
                  <div><span className="text-gray-500 block">Залишок</span><span className="font-bold text-red-600">{formatCurrency(o.DebtAmount)}</span></div>
                </div>

                <button className="w-full mt-2 bg-[#557600] text-white py-2 rounded text-sm font-semibold flex items-center justify-center gap-2" onClick={() => { setSelectedOrder(o); setModalOpen(true); }}>
                  Оплатити
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {modalOpen && selectedOrder && (
        <PaymentModal order={selectedOrder} contracts={contracts} onClose={() => { setModalOpen(false); setSelectedOrder(null); }} onConfirm={makePayment} formatCurrency={formatCurrency} />
      )}
    </div>
  );
}