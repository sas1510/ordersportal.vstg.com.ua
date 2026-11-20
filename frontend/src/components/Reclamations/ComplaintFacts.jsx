import ComplaintSeries from "./ComplaintSeries";
import { useTranslation } from "react-i18next";
import { CalendarDays, ClipboardList, AlertTriangle, CircleCheck } from "lucide-react";

const populated = row => row.value != null && String(row.value).trim() && row.value !== "Не вказано";

export default function ComplaintFacts({ complaint, dateRows, metaRows, mobile = false }) {
  const { t, i18n } = useTranslation();
  const dateKeys = ["borderReturnDate", "returnDate"];
  const fields = [
    ...[["number", complaint.number], ["act_number", complaint.actNumber], ["manager", complaint.manager]]
      .map(([key, value]) => ({ key, label: t(`complaints.detail.${key}`), value })),
    ...metaRows.filter(row => !["documentAmount", "submittedCompensation", "compensatedSummary", "complaintReasonName", ...dateKeys].includes(row.key)),
  ].filter(row => row.key === "number" || populated(row));
  const knownDates = new Map([...dateRows, ...metaRows.filter(row => dateKeys.includes(row.key))].map(row => [row.key, row.value]));
  const formatDateValue = value => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(i18n.language);
  };
  const dates = [
    { key: "dateComplaint", label: t("complaints.detail.date_complaint"), value: knownDates.get("dateComplaint") || "" },
    { key: "dateDetection", label: t("complaints.detail.date_detection"), value: knownDates.get("dateDetection") || "" },
    { key: "customerOrderDate", label: t("complaints.detail.customer_order_date", { defaultValue: "Замовлення покупця" }), value: formatDateValue(complaint.customerOrderDate) },
    { key: "productionOrderDate", label: t("complaints.detail.production_order_date", { defaultValue: "Замовлення на виробництво" }), value: formatDateValue(complaint.productionOrderDate) },
    { key: "dateProduced", label: t("complaints.detail.date_produced"), value: knownDates.get("dateProduced") || "" },
    { key: "dateShipped", label: t("complaints.detail.date_shipped"), value: knownDates.get("dateShipped") || "" },
    { key: "returnDate", label: t("complaints.detail.date_received_production"), value: knownDates.get("returnDate") || "" },
  ];
  const reason = metaRows.find(row => row.key === "complaintReasonName");
  const texts = [
    { key: "description_title", value: complaint.description, Icon: ClipboardList },
    { key: "problem_title", value: complaint.problem, Icon: AlertTriangle },
    { key: "resolution_title", value: complaint.resolution, Icon: CircleCheck },
  ].filter(populated);
  const renderTextSections = rows => rows.map(row => <section key={row.key} className={`complaint-details__panel complaint-details__text ${row.key === "description_title" ? "is-description" : row.key === "resolution_title" ? "is-resolution" : "is-problem"}`}>
      <h3 className="complaint-details__heading">{row.key !== "description_title" && <row.Icon aria-hidden="true" />}{t(`complaints.detail.${row.key}`)}</h3>
      <p>{row.value}</p>
    </section>);
  const series = <ComplaintSeries key={String(complaint.series || "")} value={complaint.series} previewLimit={texts.some(row => row.key === "description_title") ? 3 : 6} />;
  return <div className={mobile ? "complaint-details complaint-details--mobile" : "complaint-details"}>
    <section className="complaint-details__panel">
      <dl className={`complaint-details__fields${reason && populated(reason) ? " has-reason" : ""}`}>
        {fields.map(row => <div key={row.key}><dt>{row.label}</dt><dd>{populated(row) ? row.value : "—"}</dd></div>)}
        {reason && populated(reason) && <div><dt>{reason.label}</dt><dd>{reason.value}</dd></div>}
        <div className="complaint-return-deadline">
          <dt>{!mobile && <CalendarDays aria-hidden="true" />}{t("complaints.detail.border_return_date_warehouse", { defaultValue: "Гранична дата повернення на склад" })}</dt>
          <dd>{mobile && knownDates.get("borderReturnDate") && <CalendarDays aria-hidden="true" />}{knownDates.get("borderReturnDate") || ""}</dd>
        </div>
        {mobile && <div className="complaint-mobile-series"><dt className="sr-only">{t("complaints.detail.series")}</dt><dd>{series}</dd></div>}
      </dl>
    </section>
    <div className="complaint-details__reason-series">
      {!mobile && series}
      {renderTextSections(texts.filter(row => row.key === "description_title"))}
    </div>
    {dates.length > 0 && <section className="complaint-date-timeline" aria-label={t("complaints.detail.dates")}>
      <ol>{dates.map(row => {
        return <li key={row.key}>
          <div className="complaint-date-timeline__badge"><span>{row.label}</span><strong>{row.value || t("order_mobile.statuses.no_data")}</strong></div>
        </li>;
      })}</ol>
    </section>}
    {texts.some(row => row.key !== "description_title") && <div className="complaint-details__texts">
      {renderTextSections(texts.filter(row => row.key !== "description_title"))}
    </div>}
  </div>;
}
