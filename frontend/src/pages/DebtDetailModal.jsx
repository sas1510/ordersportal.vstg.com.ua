import React from "react";
import { formatDateHumanShorter } from "../utils/formatters";
import "./DebtDetailModal.css"

export default function DebtDetailModal({
  isOpen,
  title,
  orders,
  isDark,
  onClose,
  onPay,
  formatCurrency,
}) {
  const searchIcon = "/assets/icons/SearchOrderPayment.png";
  const closeButton = "/assets/icons/Close_Button_PaymentModal.png";

  if (!isOpen) return null;

  return (
    <div className="ddm-overlay" onClick={onClose}>
      <div
        className="ddm-window"
        style={{ width: "750px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка модалки */}
        <div className="ddm-header">
          <h3 className="ddm-title uppercase">{title}</h3>
          <button onClick={onClose} className="ddm-close-btn">
            <img src={closeButton} alt="Закрити" />
          </button>
        </div>

        {/* Тіло модалки з таблицею */}
        <div
          className="ddm-body"
          style={{
            padding: "0px 10px",
            overflowY: "auto",
            maxHeight: "60vh",
          }}
        >
          <table className="ddm-table">
            <thead className="border-under-header"
              style={{
                position: "sticky",
                top: 0,
                background: isDark ? "#2b2b2b" : "#fff",
                zIndex: 10
              }}
            >
              <tr >
                <th className="ddm-th-num border-under-header">№</th>
                <th className="ddm-th-date mobile-none border-under-header">Дата</th>
                <th className="ddm-th-amount border-under-header">Сума</th>
                <th className="ddm-th-action border-under-header">Дія</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="ddm-td-empty"
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    Дані відсутні
                  </td>
                </tr>
              ) : (
                orders.map((o, idx) => (
                  <tr key={idx} className="ddm-tr-row">
                    <td className="ddm-td-num">{o.ZakazNum}</td>
                    <td className="ddm-td-date mobile-none">
                      {formatDateHumanShorter(o.ZakazDate?.slice(0, 10))}
                    </td>
                    <td className="ddm-td-amount ">
                      {formatCurrency(
                        o.Debt || o.NedoAvans || o.Summa || o.ZakazSumma
                      )}{" "}
                      {o.CurrencyName || "грн"}
                    </td>
                    <td className="ddm-td-action">
                      <div className="ddm-action-wrapper" style={{ display: "flex", justifyContent: "start" }}>
                        <button
                          className="ddm-btn-search mini-action-btn"
                          onClick={() => onPay(o.ZakazNum)}
                          title="Знайти в списку"
                        >
                          <img 
                            src={searchIcon} 
                            alt="Пошук" 
                            className="ddm-search-icon-img" 
                            style={{ width: "16px", height: "16px", objectFit: "contain" }}
                          />
                          <span className="ddm-btn-text mobile-none">Знайти</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Футер */}
        <div className="ddm-footer">
          <button className="ddm-btn-close" onClick={onClose}>
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}