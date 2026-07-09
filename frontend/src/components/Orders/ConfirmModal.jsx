import React, { useEffect } from "react";
import { FaExclamationTriangle, FaCheck, FaTimes, FaInfoCircle } from "react-icons/fa";
import { useTranslation } from "react-i18next"; // 🔥 Імпорт i18n
import "./ConfirmModal.css";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title, // Тепер опціонально, бо є i18n
  message,
  confirmText,
  cancelText,
  type = "warning",
  showCancel = true,
}) => {
  const { t } = useTranslation(); // 🔥 Хук перекладу

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const getTypeColor = () => {
    switch (type) {
      case "danger":
        return "#e74c3c";
      case "success":
        return "#76b448";
      case "info":
        return "#4a90e2";
      case "warning":
      default:
        return "#f39c12";
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case "danger":
        return <FaExclamationTriangle size={40} />;
      case "success":
        return <FaCheck size={30} />;
      case "info":
        return <FaInfoCircle size={40} />; // Змінив іконку для info
      case "warning":
      default:
        return <FaExclamationTriangle size={40} />;
    }
  };

  if (!isOpen) return null;

  // Визначаємо тексти: пріоритет у пропсів, якщо їх немає — беремо з i18n
  const displayTitle = title || t("confirm_modal.default_title");
  const displayMessage = message || t("confirm_modal.default_message");
  const displayConfirmText = confirmText || t("confirm_modal.confirm");
  const displayCancelText = cancelText || t("confirm_modal.cancel");

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div
        className="confirm-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="confirm-modal-border-top"
          style={{ backgroundColor: getTypeColor() }}
        >
          <div className="confirm-modal-header">
            <span style={{ display: "flex", alignItems: "center" }}>
              {getTypeIcon()}
            </span>
            <h3 style={{ fontSize: "18px" }}>{displayTitle}</h3>
            <span
              className="icon icon-cross confirm-close-btn"
              onClick={onClose}
            ></span>
          </div>
        </div>

        <div className="confirm-modal-body">
          <div
            className="confirm-icon-wrapper"
            style={{ backgroundColor: `${getTypeColor()}15` }}
          >
            <div style={{ color: getTypeColor() }}>{getTypeIcon()}</div>
          </div>
          <p className="confirm-message">{displayMessage}</p>
        </div>

        <div className="confirm-modal-footer">
          {showCancel && (
            <button className="confirm-btn-cancel-confirm" onClick={onClose}>
              <FaTimes size={16} color="#fff" /> {displayCancelText}
            </button>
          )}

          <button
            className="confirm-btn-confirm"
            onClick={handleConfirm}
            style={{ backgroundColor: getTypeColor() }}
          >
            <FaCheck size={16} color="#fff" /> {displayConfirmText}
          </button>
        </div>

        <div
          className="confirm-modal-border-bottom"
          style={{ backgroundColor: getTypeColor() }}
        />
      </div>
    </div>
  );
};

export default ConfirmModal;