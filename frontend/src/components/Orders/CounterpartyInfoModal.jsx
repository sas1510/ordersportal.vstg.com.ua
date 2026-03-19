import React from "react";
import { FaTimes, FaUserAlt, FaPhone, FaMapMarkerAlt, FaUser, FaStickyNote  } from "react-icons/fa";
import "./CounterpartyInfoModal.css";

const CounterpartyInfoModal = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  return (
    <div className="counterparty-modal-overlay" onClick={onClose}>
      <div
        className="counterparty-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top border + header */}
        <div className="counterparty-modal-border-top">
          <div className="counterparty-modal-header">
            <span className="flex items-center gap-8">
              <FaUserAlt />
                Контрагент
            </span>
            <span
              className="icon icon-cross counterparty-close-btn"
              onClick={onClose}
            />
          </div>
        </div>

        {/* Body */}
        <div className="counterparty-modal-body">
          <div className="counterparty-info-grid">
        
            <div className="info-row">
                <span className="label no-wrap">
                    <FaUser size={14} /> <span>Одержувач:</span>
                </span>
                <span className="value">{data.name || "—"}</span>
            </div>

            {data.phone && (
                <div className="info-row">
                    <span className="label no-wrap">
                    <FaPhone /> Телефон:
                    </span>
                    <span className="value">{data.phone}</span>
                </div>
                )}

                {data.recipientAdditionalInfo && (
                <div className="info-row">
                    <span className="label no-wrap">
                    <FaStickyNote /> Додатково:
                    </span>
                    <span className="value">{data.recipientAdditionalInfo}</span>
                </div>
                )}


            <div className="info-row">
              <span className="label  no-wrap">
                <FaMapMarkerAlt /> Адреса доставки:
              </span>
              <span className="value">
                {data.address || "Самовивіз"}
              </span>
            </div>


            
          </div>
        </div>

        {/* Footer */}
        <div className="counterparty-modal-footer">
          <button
            className="counterparty-btn-close"
            onClick={onClose}
          >
            <FaTimes /> Закрити
          </button>
        </div>
      </div>
    </div>
  );
};

export default CounterpartyInfoModal;
