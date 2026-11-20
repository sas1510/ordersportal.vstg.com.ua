import { useTranslation } from "react-i18next";
import { formatMoney2 } from "../../utils/formatMoney";

export default function ReclamationAmounts({ reclamation }) {
  const { t, i18n } = useTranslation();
  const correctionDate = reclamation.debtCorrectionDate ? new Date(reclamation.debtCorrectionDate) : null;
  const compensationDate = correctionDate && !Number.isNaN(correctionDate.getTime())
    ? correctionDate.toLocaleDateString(i18n.language, { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";
  const rows = [
    ["document_amount", reclamation.documentAmount],
    ["compensation_requested", reclamation.compensationAmount],
    ["compensated", reclamation.debtCorrectionAmount],
  ].filter(([key, value]) => key === "compensated" || (value != null && value !== "" && Number.isFinite(Number(value))));
  if (!rows.length) return null;
  return <dl className="reclamation-amounts">
    {rows.map(([key, value]) => <div key={key}><dt>{t(`complaints.detail.${key}`)}</dt><dd>{value == null || value === "" || !Number.isFinite(Number(value)) ? "—" : formatMoney2(Number(value), reclamation.currency || "грн")}{key === "compensated" && compensationDate && value != null && value !== "" && Number.isFinite(Number(value)) && <> <span className="reclamation-amounts__date">{t("complaints.detail.from_date")} {compensationDate}</span></>}</dd></div>)}
  </dl>;
}
