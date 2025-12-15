import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axios";
import { useTheme } from "../context/ThemeContext";
import "./PaymentsPage.css";
import PaymentModal from "../components/Orders/PaymentModal";

export default function PaymentsPage() {
  const { isDark } = useTheme();

  const [orders, setOrders] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // NEW → статус-фільтр
  const [statusFilter, setStatusFilter] = useState("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);


  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const STATUS_COLORS = {
    "Підтверджено": "status-done",
    "Очікуємо оплату": "status-progress",
    "Очікуємо підтвердження": "status-new",
    "Неліквід": "status-closed",
    "—": "status-unknown",
  };

  const normalizeStatus = (s) => (s || "—").toString().trim();
  const getStatusClass = (s) =>
    STATUS_COLORS[normalizeStatus(s)] || "status-unknown";




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

  // ----------------------------- LOAD DATA -----------------------------
  const loadData = useCallback(async () => {
    if (!contractorGUID) {
      setError("Не знайдено GUID користувача");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.get(
        "/get_dealer_payment_page_data/",
        { params: { contractor: contractorGUID } }
      );

      setOrders(response.data.orders || []);
      setContracts(response.data.contracts || []);
    } catch (e) {
      console.error("Payment fetch error:", e);
      setError("Помилка при отриманні даних з сервера.");
    }

    setLoading(false);
  }, [contractorGUID]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ----------------------------- PAYMENT MODAL -----------------------------
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
      alert("Помилка: оберіть договір і суму");
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
    } catch (e) {
      console.error(e);
      alert("Помилка при оплаті.");
    }
  };

  // Заборона скролу під час модалки
  useEffect(() => {
    if (modalOpen) document.body.classList.add("no-scroll");
    else document.body.classList.remove("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, [modalOpen]);

  // Унікальні статуси
  const uniqueStatuses = [...new Set(orders.map(o => o.OrderStage || "—"))];

  // ----------------------------- UI -----------------------------
  return (
    <div className={`payments-page ${isDark ? "dark-theme" : ""}`}>
              {loading && (
        <div className="pp-loader fade-in">
          <div className="loading-spinner"></div>
          <div>Завантаження...</div>
        </div>
      )}

      <div className="pp-header">
        <div className="pp-title-header">Оплата замовлень</div>
        <button className="pp-reload" onClick={loadData}>⟳ Оновити</button>
      </div>


      {error && <div className="pp-error">{error}</div>}

      {!loading && !error && (
        <div className="pp-content">

          {/* ===== CONTRACTS ===== */}
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

          {/* ===== ORDERS TITLE + FILTER ===== */}
          <div className="pp-orders-header">
            <h2 className="pp-title">Неоплачені замовлення</h2>

            <div className="status-filter">
              <div
                className={`status-selected ${dropdownOpen ? "open" : ""}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <span>Статус:</span>
                <span
                  className={`status-pill ${
                    statusFilter === "all" ? "status-all" : getStatusClass(statusFilter)
                  }`}
                >
                  {statusFilter === "all" ? "Усі статуси" : normalizeStatus(statusFilter)}
                </span>

                <span className={`dropdown-arrow ${dropdownOpen ? "open" : ""}`}>▼</span>
              </div>

              {dropdownOpen && (
                <div className="status-dropdown">
                  <div
                    className="status-item"
                    onClick={() => {
                      setStatusFilter("all");
                      setDropdownOpen(false);
                    }}
                  >
                    <span className="status-pill status-all">Усі статуси</span>
                  </div>

                  {uniqueStatuses.map((s, i) => (
                    <div
                      key={i}
                      className="status-item"
                      onClick={() => {
                        setStatusFilter(s);
                        setDropdownOpen(false);
                      }}
                    >
                      <span className={`status-pill ${STATUS_COLORS[s] || "status-unknown"}`}>
                        {s}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ===== ORDERS LIST ===== */}
          {orders.length === 0 ? (
            <div className="pp-empty">Усі замовлення оплачені!</div>
          ) : (
            <div className="pp-orders-wrapper fade-in">
              {orders
                .filter(o =>
                  statusFilter === "all" || o.OrderStage === statusFilter
                )
                .map((o, i) => (
                  <div className="pp-order-card" key={i}>
                    <div className="pp-row pp-order-row">
                      <div className="pp-order-col">
                        <div className="pp-num">№ {o.OrderNumber}</div>
                        <div className="pp-date">
                          {o.OrderDate?.slice(0, 10)}
                        </div>
                      </div>

                      <div style={{ textAlign: "center" }}>
                        <div className={`status-pill ${getStatusClass(o.OrderStage)}`}>
                          {normalizeStatus(o.OrderStage)}
                        </div>
                      </div>

                      <div className="pp-info">
                        <span>Сума: </span>
                        <strong>{formatCurrency(o.OrderSum)}</strong>
                      </div>

                      <div className="pp-info">
                        <span>Оплачено: </span>
                        <strong className="pp-green">
                          {formatCurrency(o.PaidAmount)}
                        </strong>
                      </div>

                      <div className="pp-info">
                        <span>Сума до оплати: </span>
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
                ))}
            </div>
          )}
        </div>
      )}

      {/* ---------- PAYMENT MODAL ---------- */}
      {modalOpen && selectedOrder && (
        <PaymentModal
          order={selectedOrder}
          contracts={contracts} // Передайте контракти в модалку, якщо вони потрібні там для вибору
          onClose={closeModal}
          onConfirm={makePayment}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
}