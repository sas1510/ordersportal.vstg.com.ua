import React, { useEffect, useMemo, useRef, useState } from "react";
import axiosInstance, { getAccessToken } from "../../api/axios";
import { useNotification } from "../../hooks/useNotification";
import { useTranslation } from "react-i18next";
import "./OrderRefusalModal.css";

const REFUSAL_ALLOWED_STATUSES = new Set([
  "Новий",
  "Очікуємо підтвердження",
  "Очікуємо оплату",
]);

const sendRefusalMessage = async ({
  calculationGuid,
  recipientGuid,
  message,
}) => {
  await axiosInstance.get("/user/me/");

  const token = getAccessToken();
  if (!token) {
    throw new Error("NO_TOKEN");
  }

  const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
  const wsHost = window.location.host;
  const wsUrl = `${wsScheme}://${wsHost}/ws/chat/1_${calculationGuid}/?token=${token}`;

  await new Promise((resolve, reject) => {
    let isResolved = false;
    const ws = new WebSocket(wsUrl);

    const closeTimer = window.setTimeout(() => {
      isResolved = true;
      ws.close();
      reject(new Error("WS_TIMEOUT"));
    }, 10000);

    const finishSuccess = () => {
      if (isResolved) return;
      isResolved = true;
      window.clearTimeout(closeTimer);
      ws.close();
      resolve();
    };

    const finishError = (errorCode) => {
      if (isResolved) return;
      isResolved = true;
      window.clearTimeout(closeTimer);
      ws.close();
      reject(new Error(errorCode));
    };

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          message,
          recipient_guid: recipientGuid,
        }),
      );
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload?.type === "message_saved") {
          finishSuccess();
          return;
        }

        if (payload?.type === "error") {
          finishError(payload?.message || "WS_SERVER_ERROR");
        }
      } catch {
        finishError("WS_BAD_RESPONSE");
      }
    };

    ws.onerror = () => {
      finishError("WS_ERROR");
    };

    ws.onclose = () => {
      if (!isResolved) {
        finishError("WS_CLOSED");
      }
    };
  });
};

export default function OrderRefusalModal({
  isOpen,
  onClose,
  calculationGuid,
  recipientGuid,
  orders = [],
  onSubmitted,
}) {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const [selectedOrderGuids, setSelectedOrderGuids] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstCheckboxRef = useRef(null);

  const eligibleOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order?.idGuid &&
        order?.number &&
        REFUSAL_ALLOWED_STATUSES.has(order.status),
    );
  }, [orders]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedOrderGuids([]);
      setIsSubmitting(false);
      return;
    }

    const focusTimer = window.setTimeout(() => {
      firstCheckboxRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [isOpen]);

  const selectedOrders = useMemo(() => {
    const selectedSet = new Set(selectedOrderGuids);
    return eligibleOrders.filter((order) => selectedSet.has(order.idGuid));
  }, [eligibleOrders, selectedOrderGuids]);

  const toggleOrder = (orderGuid) => {
    setSelectedOrderGuids((prev) =>
      prev.includes(orderGuid)
        ? prev.filter((guid) => guid !== orderGuid)
        : [...prev, orderGuid],
    );
  };

  const handleToggleAll = () => {
    if (selectedOrderGuids.length === eligibleOrders.length) {
      setSelectedOrderGuids([]);
      return;
    }

    setSelectedOrderGuids(eligibleOrders.map((order) => order.idGuid));
  };

  const handleSubmit = async () => {
    if (!recipientGuid) {
      addNotification(
        t("portal_calc.order_refusal.errors.manager_missing"),
        "error",
      );
      return;
    }

    if (selectedOrders.length === 0) {
      addNotification(
        t("portal_calc.order_refusal.errors.select_one"),
        "warning",
      );
      return;
    }

    const orderNumbers = selectedOrders.map((order) => order.number.trim());
    const refusalMessage = `Відмова. Номери: ${orderNumbers.join(", ")}`;

    setIsSubmitting(true);

    try {
      await sendRefusalMessage({
        calculationGuid,
        recipientGuid,
        message: refusalMessage,
      });

      addNotification(
        t("portal_calc.order_refusal.success"),
        "success",
      );

      onSubmitted?.(refusalMessage);
      onClose();
    } catch {
      addNotification(
        t("portal_calc.order_refusal.errors.send_failed"),
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="order-refusal-modal-overlay"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        className="order-refusal-modal-window"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="order-refusal-modal-header">
          <div>
            <h3>{t("portal_calc.order_refusal.title")}</h3>
            <p>{t("portal_calc.order_refusal.subtitle")}</p>
          </div>
          <button
            type="button"
            className="order-refusal-modal-close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label={t("portal_calc.order_refusal.close")}
          >
            &times;
          </button>
        </div>

        {eligibleOrders.length === 0 ? (
          <div className="order-refusal-modal-empty">
            {t("portal_calc.order_refusal.no_eligible_orders")}
          </div>
        ) : (
          <>
            <div className="order-refusal-modal-toolbar">
              <button
                type="button"
                className="order-refusal-modal-select-all"
                onClick={handleToggleAll}
                disabled={isSubmitting}
              >
                {selectedOrderGuids.length === eligibleOrders.length
                  ? t("portal_calc.order_refusal.unselect_all")
                  : t("portal_calc.order_refusal.select_all")}
              </button>

              <span className="order-refusal-modal-counter">
                {t("portal_calc.order_refusal.selected_count", {
                  count: selectedOrders.length,
                })}
              </span>
            </div>

            <div className="order-refusal-modal-list">
              {eligibleOrders.map((order, index) => (
                <label
                  key={order.idGuid}
                  className="order-refusal-modal-item"
                >
                  <input
                    ref={index === 0 ? firstCheckboxRef : undefined}
                    type="checkbox"
                    checked={selectedOrderGuids.includes(order.idGuid)}
                    onChange={() => toggleOrder(order.idGuid)}
                    disabled={isSubmitting}
                  />

                  <div className="order-refusal-modal-item-content">
                    <strong>{order.number}</strong>
                    <span>
                      {t(`statuses.${order.status}`, order.status)}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}

        <div className="order-refusal-modal-actions">
          <button
            type="button"
            className="order-refusal-modal-cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t("portal_calc.order_refusal.cancel")}
          </button>
          <button
            type="button"
            className="order-refusal-modal-submit"
            onClick={handleSubmit}
            disabled={isSubmitting || eligibleOrders.length === 0}
          >
            {isSubmitting
              ? t("portal_calc.order_refusal.sending")
              : t("portal_calc.order_refusal.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
