import React from "react";
import { FaCheck, FaTimes, FaExclamationTriangle } from "react-icons/fa";

const ConfirmAddressModal = ({ isOpen, onClose, onConfirm, addressName, coordinates }) => {
  if (!isOpen) return null;

  return (
    <div className="new-calc-modal-overlay" onClick={onClose}>
      <div 
        className="new-calc-modal-window" 
        style={{ width: "450px" }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="new-calc-modal-border-top">
          <div className="new-calc-modal-header">
            <FaExclamationTriangle />
            <h3 style={{ margin: 0, marginLeft: "10px", fontSize: "18px" }}>Підтвердження</h3>
            <span className="new-calc-close-btn" onClick={onClose}>
              <FaTimes />
            </span>
          </div>
        </div>

        <div className="new-calc-modal-body" style={{ textAlign: "center", marginTop: "50px" }}>
          <p style={{ fontSize: "16px", fontWeight: "500", marginBottom: "15px" }}>
            Ви впевнені у правильності обраної точки на карті?
          </p>
          
          <div style={{ 
            background: "rgba(118, 180, 72, 0.1)", 
            padding: "15px", 
            borderRadius: "8px",
            fontSize: "14px",
            textAlign: "left",
            borderLeft: "4px solid #76b448"
          }}>
            <div style={{ marginBottom: "8px" }}>
              <strong style={{ color: "#76b448" }}>Адреса на карті:</strong><br/>
              <span>{addressName || "Не визначено"}</span>
            </div>
            <div>
              <strong style={{ color: "#76b448" }}>Координати:</strong><br/>
              <code>{coordinates ? `${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}` : "-"}</code>
            </div>
          </div>
        </div>

        <div className="new-calc-modal-footer">
          <button className="new-calc-btn-cancel" onClick={onClose}>
            <FaTimes /> Ні, перевірити
          </button>
          <button className="new-calc-btn-save" onClick={onConfirm}>
            <FaCheck /> Так, все вірно
          </button>
        </div>

        <div className="new-calc-modal-border-bottom" />
      </div>
    </div>
  );
};

export default ConfirmAddressModal;