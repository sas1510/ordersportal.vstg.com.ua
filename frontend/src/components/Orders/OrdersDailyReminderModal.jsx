import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FaBell,
  FaCheckCircle,
  FaMoneyBillWave,
  FaTimes,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

import "./OrdersDailyReminderModal.css";

const OrdersDailyReminderModal = ({
  isOpen,
  waitingConfirmCount = 0,
  waitingPaymentCount = 0,
  onClose,
  onSelectStatus,
  onDisableFuture,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (
    !isOpen ||
    (waitingConfirmCount <= 0 && waitingPaymentCount <= 0)
  ) {
    return null;
  }

  return createPortal(
    <div className="orders-reminder-overlay" onClick={onClose}>
      <div
        className="orders-reminder-window"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="orders-reminder-header">
          <div className="orders-reminder-title-wrap">
            <div className="orders-reminder-icon-wrap">
              <FaBell size={18} />
            </div>

            <div>
              <h3 className="orders-reminder-title">
                {t("portal_calc.daily_reminder.title")}
              </h3>

              <p className="orders-reminder-subtitle">
                {t("portal_calc.daily_reminder.subtitle")}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="orders-reminder-close"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <FaTimes size={16} />
          </button>
        </div>

        <div className="orders-reminder-body">
          {waitingConfirmCount > 0 && (
            <div className="orders-reminder-card orders-reminder-card--confirm">
              <div className="orders-reminder-card-icon">
                <FaCheckCircle size={18} />
              </div>

              <div className="orders-reminder-card-content">
                <div className="orders-reminder-card-title">
                  {t("portal_calc.daily_reminder.waiting_confirm.title")}
                </div>

                <div className="orders-reminder-card-count">
                  {t("portal_calc.daily_reminder.count_line", {
                    count: waitingConfirmCount,
                  })}
                </div>

                <div className="orders-reminder-card-text">
                  {t("portal_calc.daily_reminder.waiting_confirm.description")}
                </div>
              </div>

              <button
                type="button"
                className="orders-reminder-action orders-reminder-action--confirm"
                onClick={() =>
                  onSelectStatus("Очікуємо підтвердження")
                }
              >
                {t("portal_calc.daily_reminder.actions.open")}
              </button>
            </div>
          )}

          {waitingPaymentCount > 0 && (
            <div className="orders-reminder-card orders-reminder-card--payment">
              <div className="orders-reminder-card-icon">
                <FaMoneyBillWave size={18} />
              </div>

              <div className="orders-reminder-card-content">
                <div className="orders-reminder-card-title">
                  {t("portal_calc.daily_reminder.waiting_payment.title")}
                </div>

                <div className="orders-reminder-card-count">
                  {t("portal_calc.daily_reminder.count_line", {
                    count: waitingPaymentCount,
                  })}
                </div>

                <div className="orders-reminder-card-text">
                  {t("portal_calc.daily_reminder.waiting_payment.description")}
                </div>
              </div>

              <button
                type="button"
                className="orders-reminder-action orders-reminder-action--payment"
                onClick={() =>
                  onSelectStatus("Очікуємо оплату")
                }
              >
                {t("portal_calc.daily_reminder.actions.open")}
              </button>
            </div>
          )}
        </div>

        <div className="orders-reminder-footer">
          <div className="orders-reminder-footer-question">
            {t("portal_calc.daily_reminder.show_tomorrow")}
          </div>

          <div className="orders-reminder-footer-actions">
            <button
              type="button"
              className="orders-reminder-dismiss"
              onClick={onClose}
            >
              {t("portal_calc.daily_reminder.actions.yes")}
            </button>

            <button
              type="button"
              className="orders-reminder-stop"
              onClick={onDisableFuture}
            >
              {t("portal_calc.daily_reminder.actions.no")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default OrdersDailyReminderModal;
