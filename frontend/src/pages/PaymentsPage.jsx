import React, { useState, useEffect, useCallback, useMemo } from "react";
import axiosInstance from "../api/axios";
import { useTheme } from "../context/ThemeContext";
import "../components/Portal/PortalOriginal.css"; // ⬅ ключові стилі сайдбару
import "./PaymentsPage.css";
import PaymentModal from "../components/Orders/PaymentModal";

import "../components/Portal/PortalSidebar.css"; 
import {formatDateHuman}  from "../utils/formatters"
import { color } from "framer-motion";




// ✅ такий самий хук як у замовленнях (без імпортів)
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    window.matchMedia("(max-width: 1260px)").matches
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

  const [orders, setOrders] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // mobile sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);


  const STATUS_COLORS = {
    "Очікуємо оплату": "status-wait-payment",
    "Очікуємо підтвердження": "status-wait-confirm",

    "Підтверджено": "status-confirmed",
    "Резервування": "status-reserved",

    "В роботі": "status-in-work",
    "У виробництві": "status-production",

    "Готовий": "status-ready",
    "Відвантажений": "status-shipped",

    "Неліквід": "status-closed",

    "—": "status-unknown",
  };


  const normalizeStatus = (s) => (s || "—").toString().trim();

  const getStatusClass = (status) =>
    STATUS_COLORS[normalizeStatus(status)] || "status-unknown";


  // =====================================================
  // STATUS FILTERS — ЯК У ЗАМОВЛЕННЯХ
  // =====================================================
// =====================================================
// ALL ORDER STATUSES (from SQL)
// =====================================================
const STATUS_FILTERS = [
  { key: "all", label: "Усі замовлення", icon: "icon-layers2" },

  // фінансові
  { key: "Очікуємо оплату", label: "Очікуємо оплату", icon: "icon-coin-dollar" },
  { key: "Очікуємо підтвердження", label: "Очікуємо підтвердження", icon: "icon-clipboard" },

  // підтвердження
  { key: "Підтверджено", label: "Підтверджено", icon: "icon-check" },

  // робота / виробництво
  { key: "В роботі", label: "В роботі", icon: "icon-cogs" },

  // 🔧 ЗАМІНА
  { key: "У виробництві", label: "У виробництві", icon: "icon-cog" },

  // логістика
  // 🔧 ЗАМІНА
  { key: "Готовий", label: "Готовий", icon: "icon-box" },
  { key: "Відвантажений", label: "Відвантажений", icon: "icon-truck" },

  // резерв
  { key: "Резервування", label: "Резервування", icon: "icon-lock" },

  // фінал
  { key: "Неліквід", label: "Неліквід", icon: "icon-circle-with-cross" },
];



  // =====================================================
  // USER
  // =====================================================
  const contractorGUID =
    JSON.parse(localStorage.getItem("user") || "{}")?.user_id_1c ||
    localStorage.getItem("contractor_guid");

  const formatCurrency = (value) => {
    if (value == null || isNaN(Number(value))) return "—";
    return new Intl.NumberFormat("uk-UA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value));
  };

  // =====================================================
  // LOAD DATA
  // =====================================================
  const loadData = useCallback(async () => {
    if (!contractorGUID) {
      setError("Не знайдено GUID користувача");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axiosInstance.get("/get_dealer_payment_page_data/", {
        params: { contractor: contractorGUID },
      });

      setOrders(res.data.orders || []);
      setContracts(res.data.contracts || []);
    } catch (e) {
      console.error(e);
      setError("Помилка при отриманні даних");
    } finally {
      setLoading(false);
    }
  }, [contractorGUID]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // =====================================================
  // STATUS SUMMARY
  // =====================================================
  const statusSummary = useMemo(() => {
    const summary = { all: 0 };

    orders.forEach((o) => {
      const s = o.OrderStage || "—";
      summary.all += 1;
      summary[s] = (summary[s] || 0) + 1;
    });

    return summary;
  }, [orders]);

  // =====================================================
  // FILTERED ORDERS
  // =====================================================
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const statusOk = statusFilter === "all" || o.OrderStage === statusFilter;

      const searchOk =
        !search ||
        (o.OrderNumber || "")
          .toString()
          .toLowerCase()
          .includes(search.toLowerCase());

      return statusOk && searchOk;
    });
  }, [orders, statusFilter, search]);

  // =====================================================
  // MODAL
  // =====================================================
  const openPaymentModal = (order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedOrder(null);
  };

  const makePayment = async (contractID, amount) => {
    if (!contractID || Number(amount) <= 0) {
      alert("Оберіть договір і суму");
      return;
    }

    try {
      await axiosInstance.post("/make_payment_from_advance/", {
        contract: contractID,
        order_id: selectedOrder.OrderID_GUID,
        amount: Number(amount),
      });

      alert("Оплату виконано!");
      closeModal();
      loadData();
    } catch {
      alert("Помилка при оплаті");
    }
  };

  // ✅ при зміні на desktop — ховаємо моб. сайдбар
  useEffect(() => {
    if (!isMobile) setIsSidebarOpen(false);
  }, [isMobile]);

  // =====================================================
  // SIDEBAR CONTENT (щоб не дублювати JSX)
  // =====================================================
  const Sidebar = (
    <div className={`content-filter-payment column ${isMobile ? (isSidebarOpen ? "open" : "closed") : ""}`}>
      {/* header як у замовленнях */}
      {isMobile && (
        <div className="sidebar-header-payment row ai-center jc-space-between">
          <span>Фільтри</span>
          <span className="icon icon-cross" onClick={() => setIsSidebarOpen(false)} />
        </div>
      )}

      <span className="payment-filter-headers-name">Фільтри</span>

      {/* SEARCH */}
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
            className="icon icon-cancel2 clear-search"
            title="Очистити пошук"
            onClick={() => setSearch("")}
          />
        )}
      </div>

      <div className="delimiter1" />

      {/* STATUS FILTERS */}
      <ul className="filter column align-center">
        {STATUS_FILTERS.map(({ key, label, icon }) => {
          const count = key === "all" ? statusSummary.all || 0 : statusSummary[key] || 0;

          const handlePick = () => {
            if (count === 0) return;
            setStatusFilter(key);
            if (isMobile) setIsSidebarOpen(false); 
          };

          return (
            <li
              key={key}
              className={`filter-item ${statusFilter === key ? "active" : ""} `}
              onClick={handlePick}
            >
              <span className={`icon ${icon} font-size-24`} />
              <span className="w-100">{label}</span>
              <span>{count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );


  return (
    <div className={`column portal-body ${isDark ? "dark-theme" : ""}`}>
      {loading && (
        <div className="loading-spinner-wrapper">
          <div className="loading-spinner"></div>
          <div className="loading-text">Завантаження...</div>
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


        <div className="content p-30"  id="content" >
          <div className="pp-header">
          <div className="pp-title-header row ai-center gap-7">


            {isMobile && !isSidebarOpen && (
              <span
                className="icon icon-menu font-size-24"
                style={{ cursor: "pointer" }}
                onClick={() => setIsSidebarOpen(true)}
              />
            )}

            <span>Оплата замовлень</span>
          </div>

          <button className="pp-reload" onClick={loadData}>
            ⟳ Оновити
          </button>
        </div>


          {error && <div className="pp-error">{error}</div>}

          {/* CONTRACTS */}
          <h2 className="pp-title">Авансові договори</h2>

          {contracts.length === 0 ? (
            <div className="pp-empty">Немає авансових договорів</div>
          ) : (
            <div className="pp-badges">
              {contracts.map((c, i) => (
                <div key={i} className="pp-badge">
                  {c.Договор} — <strong>{formatCurrency(c.ОстатокПоДоговору)} грн</strong>
                </div>
              ))}
            </div>
          )}


          <h2 className="pp-title" style={{ marginTop: 24 }}>
            Неоплачені замовлення
          </h2>

          {filteredOrders.length === 0 ? (
            <div className="pp-empty">Немає замовлень</div>
          ) : (
            <div className="pp-orders-wrapper">
              {filteredOrders.map((o, i) => (
                <div className="pp-order-card" key={i}>
                  <div className="pp-row pp-order-row">
                    <div className="pp-order-col">
                      <div className="pp-num">№ {o.OrderNumber}</div>
                      <div className="pp-date">{formatDateHuman(o.OrderDate?.slice(0, 10))}</div>
                    </div>

                    <div className="pp-status-col">
                      <span className={`status-pill ${getStatusClass(o.OrderStage)}`}>
                        {normalizeStatus(o.OrderStage)}
                      </span>
                    </div>



                    <div className="pp-info">
                      <span>Сума: </span>
                      <strong style={{ color: "#696969" }}>
                        {formatCurrency(o.OrderSum)}
                      </strong>

                    </div>

                    <div className="pp-info">
                      <span>Оплачено: </span>
                      <strong className="pp-green">{formatCurrency(o.PaidAmount)}</strong>
                    </div>

                    <div className="pp-info">
                      <span>До оплати: </span>
                      <strong className="pp-red">{formatCurrency(o.DebtAmount)}</strong>
                    </div>

                    <div className="pp-pay-btn-wrapper">
                      <button className="pp-pay-btn" onClick={() => openPaymentModal(o)}>
                        Оплатити
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
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
