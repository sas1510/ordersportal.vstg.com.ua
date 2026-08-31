import React, { useCallback, useEffect, useMemo, useState } from "react";
import axiosInstance from "../../api/axios";
import { useNotification } from "../../hooks/useNotification";
import "./PaymentModal.css";

const currencyKey = (value) => String(value || "UAH").trim().toUpperCase();

export default function BatchPaymentModal({ orders, contractorGuid, formatCurrency, onClose, onSuccess }) {
  const { addNotification } = useNotification();
  const [contracts, setContracts] = useState([]);
  const [contractId, setContractId] = useState("");
  const [selection, setSelection] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const payableOrders = useMemo(
    () => (orders || []).filter((order) => Number(order.DebtAmount || 0) > 0 && order.OrderID_GUID),
    [orders],
  );
  const selectedContract = useMemo(
    () => contracts.find((contract) => String(contract.Dogovor_ID) === String(contractId)),
    [contracts, contractId],
  );
  const available = Number(selectedContract?.DogovorSum ?? selectedContract?.DogovorBalance ?? 0);
  const selectedCurrency = currencyKey(selectedContract?.CurrencyName);
  const selectedPayments = useMemo(
    () => payableOrders
      .filter((order) => Number(selection[order.OrderID_GUID] || 0) > 0)
      .map((order) => ({ order, amount: Number(selection[order.OrderID_GUID]) })),
    [payableOrders, selection],
  );
  const total = useMemo(
    () => selectedPayments.reduce((sum, item) => sum + item.amount, 0),
    [selectedPayments],
  );
  const isOverLimit = total > available + 0.005;

  useEffect(() => {
    let isCurrent = true;
    const loadContracts = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/payments/get_dealer_advance_balance/", {
          params: contractorGuid ? { contractor_guid: contractorGuid } : undefined,
        });
        if (!isCurrent) return;
        const data = response.data || [];
        setContracts(data);
        setContractId(data[0]?.Dogovor_ID || "");
      } catch {
        if (isCurrent) setError("Не вдалося завантажити авансові договори.");
      } finally {
        if (isCurrent) setLoading(false);
      }
    };
    loadContracts();
    return () => { isCurrent = false; };
  }, [contractorGuid]);

  const isEligible = useCallback((order) => {
    return selectedContract && currencyKey(order.CurrencyName || order.Currency) === selectedCurrency;
  }, [selectedContract, selectedCurrency]);

  const getSelectedPercent = useCallback((order) => {
    const debt = Number(order.DebtAmount || 0);
    const selectedAmount = Number(selection[order.OrderID_GUID] || 0);
    if (!debt || !selectedAmount) return 0;
    return Math.min(100, (selectedAmount / debt) * 100);
  }, [selection]);

  const toggleOrder = (order, checked) => {
    setSelection((previous) => {
      const next = { ...previous };
      if (checked) next[order.OrderID_GUID] = Number(order.DebtAmount || 0).toFixed(2);
      else delete next[order.OrderID_GUID];
      return next;
    });
  };

  const setPercentage = (percent) => {
    if (!selectedContract) return;
    const next = {};
    payableOrders.filter(isEligible).forEach((order) => {
      next[order.OrderID_GUID] = (Number(order.DebtAmount || 0) * percent / 100).toFixed(2);
    });
    setSelection(next);
  };

  const updateAmount = (order, value) => {
    const debt = Number(order.DebtAmount || 0);
    const number = Math.max(0, Math.min(Number(value) || 0, debt));
    setSelection((previous) => {
      const next = { ...previous };
      if (number > 0) next[order.OrderID_GUID] = number.toFixed(2);
      else delete next[order.OrderID_GUID];
      return next;
    });
  };

  const submit = async () => {
    if (submitting || !contractId || !selectedPayments.length || isOverLimit) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await axiosInstance.post("/payments/make_payment_from_advance/", {
        contract: contractId,
        payments: selectedPayments.map(({ order, amount }) => ({
          order_id: order.OrderID_GUID,
          amount: Number(amount.toFixed(2)),
        })),
      });
      if (response?.data?.success !== true) throw new Error("not confirmed");
      await onSuccess();
      addNotification("Оплату підтверджено в 1С.", "success");
      onClose();
    } catch {
      setError("Оплату не підтверджено. Перевірте дані та спробуйте ще раз.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="batch-payment-panel">
        <header className="batch-payment-panel-header">
          <div>
            <h2>Оплата декількох замовлень</h2>
            <p>Оберіть договір, замовлення та суми до списання.</p>
          </div>
          <button className="pay-btn-cancel" type="button" onClick={submitting ? undefined : onClose}>Повернутися до списку</button>
        </header>
        <div className="pay-modal-body">
          {loading ? <p>Завантаження авансів...</p> : (
            <>
              <label className="pay-label">Авансовий договір
                <select className="pay-input" value={contractId} onChange={(event) => { setContractId(event.target.value); setSelection({}); }}>
                  <option value="">Оберіть договір</option>
                  {contracts.map((contract) => <option key={contract.Dogovor_ID} value={contract.Dogovor_ID}>{contract.DogovorName} — {formatCurrency(contract.DogovorSum ?? contract.DogovorBalance)} {contract.CurrencyName}</option>)}
                </select>
              </label>
              {selectedContract && <div className="pay-available">Доступно: <strong>{formatCurrency(available)} {selectedContract.CurrencyName}</strong></div>}
              <div className="batch-payment-percentages">
                <span>Швидко обрати:</span>
                {[25, 50, 75, 100].map((percent) => <button key={percent} type="button" disabled={!selectedContract} onClick={() => setPercentage(percent)}>{percent}%</button>)}
              </div>
              <p className="batch-payment-hint">Відсоток вибере всі замовлення у валюті обраного договору.</p>
              <div className="batch-payment-orders">
                {payableOrders.map((order) => {
                  const eligible = isEligible(order);
                  const checked = Boolean(selection[order.OrderID_GUID]);
                  const selectedAmount = Number(selection[order.OrderID_GUID] || 0);
                  const selectedPercent = getSelectedPercent(order);
                  return <label className={"batch-payment-order" + (!eligible ? " is-disabled" : "")} key={order.OrderID_GUID}>
                    <span className={"batch-payment-order-check" + (checked ? " is-selected" : "")} aria-hidden="true">
                      {checked ? "✓" : ""}
                    </span>
                    <input type="checkbox" checked={checked} disabled={!eligible} onChange={(event) => toggleOrder(order, event.target.checked)} />
                    <span className="batch-payment-order-info">
                      <strong>№ {order.OrderNumber}</strong>
                      <small className="batch-payment-order-meta">
                        <span>Борг: {formatCurrency(order.DebtAmount)} {order.CurrencyName || ""}</span>
                        <span className={checked ? "is-selected" : ""}>
                          До оплати: {checked ? `${formatCurrency(selectedAmount)} ${order.CurrencyName || ""} (${selectedPercent.toFixed(0)}%)` : "не обрано"}
                        </span>
                      </small>
                    </span>
                    <input aria-label={"Сума для " + order.OrderNumber} type="number" min="0" max={Number(order.DebtAmount || 0)} step="0.01" value={selection[order.OrderID_GUID] || ""} disabled={!eligible} onChange={(event) => updateAmount(order, event.target.value)} />
                  </label>;
                })}
              </div>
              <div className={"batch-payment-total" + (isOverLimit ? " is-over-limit" : "")}>
                <span>Вибрано: {selectedPayments.length}</span><strong>Разом: {formatCurrency(total)} {selectedContract?.CurrencyName || ""}</strong>
              </div>
              {isOverLimit && <p className="pay-error">Сума перевищує доступний аванс.</p>}
              {error && <p className="pay-error">{error}</p>}
            </>
          )}
        </div>
        <footer className="pay-modal-footer batch-payment-footer">
          <button className="pay-btn-cancel" type="button" disabled={submitting} onClick={onClose}>Скасувати</button>
          <button className="pay-btn-confirm" type="button" disabled={loading || submitting || !selectedPayments.length || isOverLimit} onClick={submit}>{submitting ? "Очіківання 1С..." : "Оплатити вибрані"}</button>
        </footer>
    </section>
  );
}
