import React from "react";
import { useTranslation } from "react-i18next";

export default function PaymentsAnalytics({ groups, formatCurrency, showDebtDetails }) {
  const { t } = useTranslation();
  if (!groups.length) return null;
  const usage = total => ["Debt", "InWorkDebt", "Summa", "BezPeredOplaty"].reduce((sum, key) => sum + Number(total[key] || 0), 0);
  const metrics = [
    ["debt_limit", ({total}) => Number(total.CustomerLimit || 0)],
    ["overlimit", ({total}) => total.CustomerLimit > 0 ? Math.max(0, usage(total) - total.CustomerLimit) : 0, null, true],
    ["limit_usage", ({total}) => total.CustomerLimit > 0 ? Number(total.LimitUsage ?? Math.min(total.CustomerLimit, usage(total))) : 0],
    ["no_prepayment", ({total}) => Number(total.BezPeredOplaty || 0), "no_prepayment"],
    ["underfunded", ({analytics}) => analytics.underfundedDebtTotal, "nedoavans"],
    ["in_work_debt", ({analytics}) => analytics.inWorkDebtTotal, "in_work"],
    ["post_sale_debt", ({analytics}) => analytics.postSaleDebtTotal],
    ["route_debt", ({analytics}) => analytics.routeDebtTotal, "in_route"],
    ["money_in_transit", ({analytics}) => analytics.moneyInTransitTotal, "money_way"],
    ["debt_over_ten_days", ({total}) => Number(total.DebtMoreTen || 0), "critical", true],
  ];
  return <div className="analytics-container analytics-currencies">
    {[metrics.slice(0,5), metrics.slice(5)].map((row, index) => <React.Fragment key={index}>
      {index > 0 && <div className="analytics-divider" />}
      <div className={index ? "analytics-row-bottom" : "analytics-row-top"}>
        {row.map(([key, valueOf, detail, danger]) => <div className="analytics-card" key={key}>
          <div className="card-title" title={t(`payments_page.analytics.${key}`)}>{t(`payments_page.analytics.${key}`)}</div>
          {groups.map(group => {
            const value = valueOf(group);
            const clickable = detail && value > 0;
            return <div key={group.currency} className={`card-value finance-currency-value${danger && value > 0 ? " text-danger" : ""}`}>
              {clickable ? <button type="button" onClick={() => showDebtDetails(detail, group.currency)}>{formatCurrency(value)} <span>{group.currency}</span></button>
                : <>{value > 0 ? formatCurrency(value) : "—"} <span>{group.currency}</span></>}
            </div>;
          })}
        </div>)}
      </div>
    </React.Fragment>)}
  </div>;
}
