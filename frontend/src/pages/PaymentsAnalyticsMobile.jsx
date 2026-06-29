import React from "react";
import "./PaymentsPage.css";
import { useTranslation } from "react-i18next";

export default function PaymentsAnalyticsMobile({
  debtTotal,
  formatCurrency,
  showDebtDetails,
}) {
  const { t } = useTranslation();
  return (
    <div className="analytics-mobile-container">
      <div className="analytics-mobile-grid">
        
        {/* РЯДОК 1: ТРИ КОЛОНКИ */}
        <div className="analytics-card">
          <div className="card-title">{t("payments_page.analytics.debt_limit")}</div>
          <div className="card-value">
            {debtTotal.CustomerLimit === null || debtTotal.CustomerLimit === 0
              ? "—"
              : `${formatCurrency(debtTotal.CustomerLimit)} ${debtTotal.CurrencyName || t("common.currency_uah")}`}
          </div>
                <div className="mobile-vert-divider" />
        </div>

  

        <div className="analytics-card">
          <div className="card-title">{t("payments_page.analytics.overlimit")}</div>
          <div
            className={`card-value ${
              Number(debtTotal.Debt || 0) + Number(debtTotal.Summa || 0) > debtTotal.CustomerLimit &&
              debtTotal.CustomerLimit > 0
                ? "text-danger"
                : ""
            }`}
          >
            {debtTotal.CustomerLimit > 0 &&
            Number(debtTotal.Debt || 0) + Number(debtTotal.Summa || 0) > debtTotal.CustomerLimit
              ? `${formatCurrency(
                  Number(debtTotal.Debt || 0) +
                    Number(debtTotal.Summa || 0) +
                    Number(debtTotal.BezPeredOplaty || 0) -
                    debtTotal.CustomerLimit
                )} ${debtTotal.CurrencyName || t("common.currency_uah")}`
              : "—"}
          </div>
          <div className="mobile-vert-divider" />
        </div>

        <div className="analytics-card">
          <div className="card-title">{t("payments_page.analytics.limit_usage")}</div>
          <div className="card-value">
            {/* Додайте сюди розрахунок або змінну для використання ліміту, якщо вона є в debtTotal */}
            {debtTotal.LimitUsage 
              ? `${formatCurrency(debtTotal.LimitUsage)} ${debtTotal.CurrencyName || t("common.currency_uah")}`
              : "—"}
          </div>
        </div>

        <div className="mobile-solid-divider" />

        {/* РЯДОК 2: ДВІ КОЛОНКИ */}
        <div
          className={`analytics-card ${Number(debtTotal.BezPeredOplaty || 0) > 0 ? "pointer-link" : ""}`}
          onClick={() => Number(debtTotal.BezPeredOplaty || 0) > 0 && showDebtDetails("no_prepayment")}
        >
          <div className="card-title">{t("payments_page.analytics.no_prepayment")}</div>
          <div className="card-value">
            {Number(debtTotal.BezPeredOplaty || 0) > 0
              ? `${formatCurrency(debtTotal.BezPeredOplaty)} ${debtTotal.CurrencyName || t("common.currency_uah")}`
              : "—"}
          </div>
          <div className="mobile-vert-divider" />
        </div>

        <div
          className={`analytics-card ${Number(debtTotal.NedoAvans || 0) > 0 ? "pointer-link" : ""}`}
          onClick={() => Number(debtTotal.NedoAvans || 0) > 0 && showDebtDetails("nedoavans")}
        >
          <div className="card-title">{t("payments_page.analytics.underfunded")}</div>
          <div className="card-value">
            {Number(debtTotal.NedoAvans || 0) > 0
              ? `${formatCurrency(debtTotal.NedoAvans)} ${debtTotal.CurrencyName || t("common.currency_uah")}`
              : "—"}
          </div>
        </div>

        <div className="mobile-solid-divider" />

        {/* РЯДОК 3: ДВІ КОЛОНКИ */}
        <div className="analytics-card">
          <div className="card-title">{t("payments_page.analytics.post_sale_debt")}</div>
          <div className="card-value">
            {Number(debtTotal.Debt || 0) + Number(debtTotal.Summa || 0) > 0
              ? `${formatCurrency(Number(debtTotal.Debt || 0) + Number(debtTotal.Summa || 0))} ${
                  debtTotal.CurrencyName || t("common.currency_uah")
                }`
              : "—"}
          </div>
          <div className="mobile-vert-divider" />
        </div>

        <div
          className={`analytics-card ${Number(debtTotal.Debt || 0) > 0 ? "pointer-link" : ""}`}
          onClick={() => Number(debtTotal.Debt || 0) > 0 && showDebtDetails("in_route")}
        >
          <div className="card-title">{t("payments_page.analytics.in_routes")}</div>
          <div className="card-value">
            {Number(debtTotal.Debt || 0) > 0
              ? `${formatCurrency(debtTotal.Debt)} ${debtTotal.CurrencyName || t("common.currency_uah")}`
              : "—"}
          </div>
        </div>

        <div className="mobile-solid-divider" />

        {/* РЯДОК 4: ДВІ КОЛОНКИ */}
        <div
          className={`analytics-card ${Number(debtTotal.Summa || 0) > 0 ? "pointer-link" : ""}`}
          onClick={() => Number(debtTotal.Summa || 0) > 0 && showDebtDetails("money_way")}
        >
          <div className="card-title">{t("payments_page.analytics.money_in_transit")}</div>
          <div className={`card-value ${Number(debtTotal.Summa || 0) > 0 ? "text-success" : ""}`}>
            {Number(debtTotal.Summa || 0) > 0
              ? `${formatCurrency(debtTotal.Summa)} ${debtTotal.CurrencyName || t("common.currency_uah")}`
              : "—"}
          </div>
          <div className="mobile-vert-divider" />
        </div>

        <div
          className={`analytics-card ${Number(debtTotal.DebtMoreTen || 0) > 0 ? "pointer-link" : ""}`}
          onClick={() => Number(debtTotal.DebtMoreTen || 0) > 0 && showDebtDetails("critical")}
        >
          <div className="card-title">{t("payments_page.analytics.debt_over_ten_days_short")}</div>
          <div className={`card-value ${Number(debtTotal.DebtMoreTen || 0) > 0 ? "text-danger" : ""}`}>
            {Number(debtTotal.DebtMoreTen || 0) > 0
              ? `${formatCurrency(debtTotal.DebtMoreTen)} ${debtTotal.CurrencyName || t("common.currency_uah")}`
              : "—"}
          </div>
        </div>

      </div>
    </div>
  );
}
