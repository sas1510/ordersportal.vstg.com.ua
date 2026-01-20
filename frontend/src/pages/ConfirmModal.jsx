import { AlertTriangle, X } from "lucide-react";
import "./ConfirmModal.css";

export default function ConfirmModal({
  title = "Підтвердження дії",
  message,
  confirmText = "Підтвердити",
  cancelText = "Скасувати",
  danger = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div
        className={`confirm-window ${danger ? "danger" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="confirm-header">
          <div className="confirm-title">
            <AlertTriangle size={22} />
            {title}
          </div>

          <button className="confirm-close" onClick={onCancel}>
            <X size={22} />
          </button>
        </div>

        {/* BODY */}
        <div className="confirm-body">
          {message}
        </div>

        {/* FOOTER */}
        <div className="confirm-footer">
          <button className="confirm-btn-cancel" onClick={onCancel}>
            {cancelText}
          </button>

          <button
            className={`confirm-btn-ok ${danger ? "danger" : ""}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
