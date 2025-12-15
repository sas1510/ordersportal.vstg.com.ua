// =================== PaymentModal.jsx ===================
import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from "../../api/axios";   // ⬅ додали
import "./PaymentModal.css";

export default function PaymentModal({
  order,
  onClose,
  onConfirm,
  formatCurrency
}) {

  // ---- STATE ----
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const debt = useMemo(() => Number(order.DebtAmount || 0), [order]);

  // ----------------- LOAD CONTRACTS INSIDE MODAL -----------------
  useEffect(() => {
    const contractorGUID =
      JSON.parse(localStorage.getItem("user") || "{}")?.user_id_1c ||
      localStorage.getItem("contractor_guid");

    if (!contractorGUID) {
      setLoadError("Не знайдено GUID контрагента");
      setLoading(false);
      return;
    }

    const loadContracts = async () => {
      try {
        const res = await axiosInstance.get(
          `/get_dealer_advance_balance/?contractor_guid=${contractorGUID}`
        );

        const data = res.data || [];
        setContracts(data);

        if (data.length > 0) {
          setSelectedContract(data[0].Dogovor_ID);
          setPaymentAmount(data[0].DogovorSum);
        }

      } catch (err) {
        setLoadError("Помилка завантаження авансових договорів");
        console.error(err);
      }

      setLoading(false);
    };

    loadContracts();
  }, []);

  // --- допомога ---
  const getSelected = () =>
    contracts.find((c) => c.Dogovor_ID === selectedContract);

  const getAvailable = () => Number(getSelected()?.DogovorSum || 0);

  // --- авто-підстановка після вибору ---
  useEffect(() => {
    if (!selectedContract) return;
    const available = getAvailable();

    setPaymentAmount(available < debt ? available : debt);
  }, [selectedContract]);

  const getMaxAllowed = () => {
    const available = getAvailable();
    return Math.min(available, debt);
  };


  // --- ручне введення ---
  const handleAmountChange = (value) => {
      setAmountError("");

      // дозволяємо очищення поля
      if (value === "") {
        setPaymentAmount("");
        return;
      }

      const numericValue = Number(value);

      if (numericValue <= 0) {
        setPaymentAmount("");
        return;
      }

      const maxAllowed = selectedContract ? getMaxAllowed() : debt;

      if (numericValue > maxAllowed) {
        setAmountError(
          `Максимальна сума оплати — ${formatCurrency(maxAllowed)}`
        );
        setPaymentAmount(maxAllowed.toFixed(2));
        return;
      }

      setPaymentAmount(numericValue);
    };


  const set50percent = () => {
    const half = debt * 0.5;
    const available = getAvailable();
    setPaymentAmount(available < half ? available : half.toFixed(2));
  };

  const set100percent = () => {
    const available = getAvailable();
    setPaymentAmount(available < debt ? available : debt);
  };

  // ---------------- RENDER ----------------

  if (loading) {
    return (
      <div className="pay-modal-overlay">
        <div className="pay-modal-window centered">Завантаження...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="pay-modal-overlay">
        <div className="pay-modal-window centered error">
          {loadError}
          <button onClick={onClose} className="pay-btn-cancel mt-10">
            Закрити
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pay-modal-overlay">
      <div className="pay-modal-window">

        <div className="pay-modal-header">
          <h3>Оплата замовлення № {order.OrderNumber}</h3>
          <span className="icon icon-cross pay-close-btn" onClick={onClose}></span>
        
        </div>

        <div className="pay-modal-body">

          <p className="pay-debt">
            Сума до оплати: <strong>{formatCurrency(debt)}</strong>
          </p>

          {/* Договір */}
          <label className="pay-label">
            <span>Авансовий договір:</span>

            <div className="custom-dropdown">
              <div
                className={`dropdown-selected ${selectedContract ? "active" : ""}`}
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                <span>
                  {selectedContract
                    ? getSelected()?.Dogovor_Name
                    : "Оберіть договір"}
                </span>
                <span className="dropdown-arrow">
                  {dropdownOpen ? "▲" : "▼"}
                </span>
              </div>

              {dropdownOpen && (
                <div className="dropdown-menu">
                  {contracts.map((c) => (
                    <div
                      key={c.Dogovor_ID}
                      className="dropdown-item"
                      onClick={() => {
                        setSelectedContract(c.Dogovor_ID);
                        setDropdownOpen(false);
                      }}
                    >
                      <div className="item-name">{c.Dogovor_Name}</div>
                      <div className="item-amount">
                        {formatCurrency(c.DogovorSum)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </label>

          {selectedContract && (
            <div className="pay-available">
              Доступно: <strong>{formatCurrency(getAvailable())}</strong>
            </div>
          )}

          {/* Кнопки 50% і 100% */}
          {selectedContract && (
            <div className="quick-buttons centered">
              <button onClick={set50percent}>50%</button>
              <button onClick={set100percent}>100%</button>
            </div>
          )}

          {/* Сума */}
          <label className="pay-label">
            <span>Сума оплати:</span>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={`pay-input ${amountError ? "input-error" : ""}`}
            />
          </label>

          {amountError && <div className="pay-error">{amountError}</div>}
        </div>

        <div className="pay-modal-footer">
          <button className="pay-btn-cancel" onClick={onClose}>Скасувати</button>

          <button
            className="pay-btn-confirm"
            disabled={!paymentAmount || !!amountError}
            onClick={() =>
              onConfirm(selectedContract, Number(paymentAmount))
            }
          >
            Оплатити
          </button>
        </div>

      </div>
    </div>
  );
}
