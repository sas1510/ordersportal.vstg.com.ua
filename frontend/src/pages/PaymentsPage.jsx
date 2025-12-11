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

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

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

      <div className="pp-header">
        <div className="pp-title-header">Оплата замовлень</div>
        <button className="pp-reload" onClick={loadData}>⟳ Оновити</button>
      </div>

      {loading && (
        <div className="pp-loader fade-in">
          <div className="spinner"></div>
          <div>Завантаження...</div>
        </div>
      )}

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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "30px",
              marginBottom: "10px",
            }}
          >
            <h2 className="pp-title">Замовлення з боргом</h2>

            <select
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
  style={{
    padding: "8px 14px",
    border: "1px solid var(--grey-border-color)",
    borderRadius: "8px",
    background: isDark ? "#2c2c2c" : "#ffffff",
    color: "var(--text-color)",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    appearance: "none",
    backgroundImage:
      isDark
        ? "url('data:image/svg+xml;utf8,<svg fill=\"%23cccccc\" height=\"20\" viewBox=\"0 0 24 24\" width=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5z\"/></svg>')"
        : "url('data:image/svg+xml;utf8,<svg fill=\"%235b77b8\" height=\"20\" viewBox=\"0 0 24 24\" width=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5z\"/></svg>')",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
    paddingRight: "40px",
    transition: "0.25s ease",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.08)",

    /* 🔥 Стилізація DROPDOWN меню (максимально дозволена HTML) */
    scrollbarWidth: "thin",
  }}
  onMouseOver={(e) =>
    (e.target.style.borderColor = "var(--info-color)")
  }
  onMouseOut={(e) =>
    (e.target.style.borderColor = "var(--grey-border-color)")
  }
>
<option value="all" className="dropdown-option">
  Усі статуси
</option>

{uniqueStatuses.map((s, i) => (
  <option key={i} value={s} className="dropdown-option">
    {s}
  </option>
))}

</select>


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
                    <div
                      className="pp-row pp-order-row"
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "220px 230px 150px 150px 170px auto",
                        alignItems: "center",
                        columnGap: "16px",
                      }}
                    >
                      <div className="pp-order-col">
                        <div className="pp-num">№ {o.OrderNumber}</div>
                        <div className="pp-date">
                          {o.OrderDate?.slice(0, 10)}
                        </div>
                      </div>

                      <div style={{ textAlign: "center" }}>
                        <div className="pp-badge">
                          {o.OrderStage || "—"}
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
          onClose={closeModal}
          onConfirm={makePayment}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
}
