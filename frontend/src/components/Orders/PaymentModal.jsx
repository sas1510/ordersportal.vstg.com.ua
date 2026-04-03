// =================== PaymentModal.jsx ===================
import React, { useState, useEffect, useMemo, useCallback } from "react";
import axiosInstance from "../../api/axios";
import "./PaymentModal.css";
// Якщо ви створили файл useNotification.js у папці hooks:
import { useNotification } from "../../hooks/useNotification";
import { FaCheck, FaTimes, FaSpinner } from "react-icons/fa";

export default function PaymentModal({
  order,
  onClose,
  onConfirm,
  formatCurrency,
}) {
  // ---- STATE ----
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const { addNotification } = useNotification();

  const debt = useMemo(() => Number(order.DebtAmount || 0), [order]);

  // Пошук вибраного договору та доступної суми
  const getSelected = useCallback(
    () => contracts.find((c) => c.Dogovor_ID === selectedContract),
    [contracts, selectedContract],
  );
  const getAvailable = useCallback(
    () => Number(getSelected()?.DogovorSum || 0),
    [getSelected],
  );

  // ----------------- LOAD CONTRACTS -----------------
  const loadContracts = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await axiosInstance.get(
        `/payments/get_dealer_advance_balance/`,
      );
      const data = res.data || [];
      setContracts(data);

      if (data.length > 0) {
        const firstContract = data[0];
        setSelectedContract(firstContract.Dogovor_ID);

        // 🔥 Перевірка першого договору: якщо 0, не підставляємо суму
        const available = Number(firstContract.DogovorSum || 0);
        if (available > 0) {
          setPaymentAmount(
            available < debt ? available.toFixed(2) : debt.toFixed(2),
          );
        } else {
          setPaymentAmount(""); // Залишаємо порожнім, щоб заблокувати кнопку
        }
      }
    } catch (err) {
      console.error(err);
      setLoadError("Не вдалося завантажити дані про баланс.");
      addNotification("Помилка завантаження договорів", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose, isSubmitting]);

  useEffect(() => {
    loadContracts();
  }, []);

  // --- авто-підстановка та скидання помилок при зміні договору ---
  useEffect(() => {
    if (!selectedContract || loading) return;

    setAmountError(""); // 🔥 Скидаємо попередження при зміні договору

    const available = getAvailable();
    if (available > 0) {
      setPaymentAmount(
        available < debt ? available.toFixed(2) : debt.toFixed(2),
      );
    } else {
      setPaymentAmount("");
    }
  }, [selectedContract, debt, getAvailable, loading]);

  const getMaxAllowed = () => {
    const available = getAvailable();
    return Math.min(available, debt);
  };

  // --- ручне введення ---
  const handleAmountChange = (value) => {
    setAmountError("");
    if (value === "") {
      setPaymentAmount("");
      return;
    }

    const numericValue = Number(value);
    if (numericValue <= 0) {
      setPaymentAmount(value);
      setAmountError("Сума має бути більшою за 0");
      return;
    }

    const maxAllowed = getMaxAllowed();
    if (numericValue > maxAllowed) {
      setAmountError(`Максимальна сума оплати — ${formatCurrency(maxAllowed)}`);
      setPaymentAmount(maxAllowed.toFixed(2));
      return;
    }
    setPaymentAmount(value);
  };

  // 🔥 Функція відправки з блокуванням
  const handleConfirm = async () => {
    if (isSubmitting || !paymentAmount || Number(paymentAmount) <= 0) return;

    setIsSubmitting(true);
    try {
      await onConfirm(selectedContract, Number(paymentAmount));
    } catch (err) {
      console.error("Payment error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const set50percent = () => {
    const half = debt * 0.5;
    const available = getAvailable();
    setPaymentAmount(available < half ? available.toFixed(2) : half.toFixed(2));
    setAmountError("");
  };

  const set100percent = () => {
    const available = getAvailable();
    setPaymentAmount(available < debt ? available.toFixed(2) : debt.toFixed(2));
    setAmountError("");
  };

  return (
    <div className="pay-modal-overlay">
      <div className="pay-modal-window">
        <div className="pay-modal-header">
          <h3>Оплата замовлення № {order.OrderNumber}</h3>
          <span
            className="icon icon-cross pay-close-btn"
            onClick={!isSubmitting ? onClose : null}
          ></span>
        </div>

        <div className="pay-modal-body">
          {loading ? (
            <div className="pay-modal-status-centered">
              <div className="loading-spinner-small"></div>
              <span>Завантаження даних...</span>
            </div>
          ) : loadError ? (
            <div className="pay-modal-status-centered error-state">
              <span className="icon icon-warning font-size-32 text-red"></span>
              <p>{loadError}</p>
              <button className="pay-btn-retry-large" onClick={loadContracts}>
                Спробувати ще раз
              </button>
            </div>
          ) : (
            <>
              <p className="pay-debt">
                Сума до оплати: <strong>{formatCurrency(debt)}</strong>
              </p>

              <label className="pay-label">
                <span>Авансовий договір:</span>
                <div className="custom-dropdown">
                  <div
                    className={`dropdown-selected ${selectedContract ? "active" : ""} ${isSubmitting ? "disabled" : ""}`}
                    onClick={() =>
                      !isSubmitting && setDropdownOpen((prev) => !prev)
                    }
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

                  {dropdownOpen && !isSubmitting && (
                    <div className="dropdown-menu">
                      {contracts.map((c) => (
                        <div
                          key={c.Dogovor_ID}
                          className={`dropdown-item ${Number(c.DogovorSum) <= 0 ? "zero-balance" : ""}`}
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
                  Доступно:{" "}
                  <strong className={getAvailable() <= 0 ? "text-red" : ""}>
                    {formatCurrency(getAvailable())}
                  </strong>
                </div>
              )}

              {selectedContract && getAvailable() > 0 && (
                <div className="quick-buttons centered">
                  <button onClick={set50percent} disabled={isSubmitting}>
                    50%
                  </button>
                  <button onClick={set100percent} disabled={isSubmitting}>
                    100%
                  </button>
                </div>
              )}

              <label className="pay-label">
                <span>Сума оплати:</span>
                <input
                  type="number"
                  min="0.01" //
                  step="1"
                  disabled={isSubmitting || getAvailable() <= 0}
                  value={paymentAmount}
                  // 1. Блокуємо натискання мінуса, "e" та інших символів
                  onKeyDown={(e) => {
                    if (["-", "e", "E", "+"].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  // 2. Обробляємо зміну (в тому числі вставку тексту)
                  onChange={(e) => {
                    let val = e.target.value;

                    // Якщо користувач вставив щось некоректне або від'ємне
                    if (Number(val) < 0) {
                      val = ""; // Або можна Math.abs(val), але краще просто не пускати
                    }

                    handleAmountChange(val);
                  }}
                  className={`pay-input ${amountError ? "input-error" : ""}`}
                />
              </label>

              {amountError && <div className="pay-error">{amountError}</div>}
              {selectedContract && getAvailable() <= 0 && (
                <div className="pay-error">
                  На вибраному договорі недостатньо коштів
                </div>
              )}
            </>
          )}
        </div>

        <div className="pay-modal-footer">
          <button
            className="pay-btn-cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <FaTimes size={16} color="#fff" /> Скасувати
          </button>

          <button
            className="pay-btn-confirm"
            disabled={
              loading ||
              isSubmitting ||
              !paymentAmount ||
              Number(paymentAmount) <= 0 ||
              !!amountError ||
              !selectedContract
            }
            onClick={handleConfirm}
          >
            {isSubmitting ? (
              <FaSpinner className="spinner-icon spinning" size={16} />
            ) : (
              <FaCheck size={16} color="#fff" />
            )}
            {isSubmitting ? " Оплата..." : " Оплатити"}
          </button>
        </div>
      </div>
    </div>
  );
}
