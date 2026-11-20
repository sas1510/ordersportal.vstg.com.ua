import React from "react";
import ComplaintFacts from "./ComplaintFacts";
import { useTheme } from "../../hooks/useTheme";
import {
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import { formatDate, formatDateTimeShort } from "../../utils/formatters";
import { formatMoney2 } from "../../utils/formatMoney";

import { useTranslation } from "react-i18next";



const InfoRow = ({
  label,
  value,
  highlight,
  isLastInRow = false,
  isFirstInRow = false,
  className = "",
  style = {},
  colors,
}) => {
  const { t } = useTranslation();
  return (
  <div
    className={`flex flex-col justify-start py-1 font-['Inter'] flex-1 ${
      !isFirstInRow ? "pl-4" : "pl-0"
    } ${className}`}
    style={{
      minWidth: "150px",
      borderRight: isLastInRow ? "none" : `1px dotted ${colors.border}`,
      ...style,
    }}
  >

    {label && (
      <span 
        className="text-xs mb-1" 
        style={{ color: colors.label }}
      >
        {label}:
      </span>
    )}

   
    <span
      className={`text-sm leading-tight ${highlight ? "font-extrabold" : "font-bold"}`}
      style={{
        color: highlight
          ? colors.highlight
          : value
          ? colors.value
          : colors.empty, 
        textAlign: "left",
      }}
    >
      {value || t("complaints.detail.not_specified")}
    </span>
  </div>
  )
};



const HorizontalInfoGroup = ({ children, columns = 3, colors }) => {
  const childrenArray = React.Children.toArray(children);
  const totalItems = childrenArray.length;

  return (
    <div className="flex flex-wrap w-full font-['Inter',_sans-serif]">
      {childrenArray.map((child, index) => {

        const isFirst = index === 0;

        const isLastInRow =
          (index + 1) % columns === 0 || index === totalItems - 1;
        
        const isLastInGroup =
          index >=
          totalItems -
            (totalItems % columns === 0 ? columns : totalItems % columns);

        return React.cloneElement(child, {
          key: index,
          isFirst, 
          isLastInRow,
          isLastInGroup:
            isLastInGroup &&
            (index === totalItems - 1 ||
              (totalItems <= columns && index + 1 === totalItems)),
          colors,
         
          className: `${child.props.className || ''} ${isFirst ? '!pl-0' : ''}`.trim(),
        });
      })}
    </div>
  );
};
const FullWidthInfoGroup = ({ children, isLastInGroup = false, colors }) => (
  <div className="flex w-full">
    {React.Children.toArray(children).map((child, index) =>
      React.cloneElement(child, {
        key: index,
        isFirstInRow: true,
        isLastInRow: true,
        isLastInGroup,
        style: { minWidth: "auto", borderRight: "none" },
        colors,
      }),
    )}
  </div>
);

const colorsSet = {
  light: {
    background: "#f3f3f3",
    sectionBg: "#cfdcef99",
    sectionBgDates: "#FFF9EC",
    sectionBgManager: "#EDE7F6",
    sectionBgProblem: "#FFDFD0",
    sectionBgResolution: "#e9f3e1",
    sectionBgDescription: "#f9f9f9",
    border: "#ccc",
    label: "#555",
    value: "#333",
    empty: "#b9b9b9",
    highlight: "#5e83bf",
    text: "#404040",
    iconManager: "#645388",
  },
  dark: {
    background: "#1f1f1f",
    sectionBg: "#2c2c3a",
    sectionBgDates: "#3a2f2f",
    sectionBgManager: "#3a2a3a",
    sectionBgProblem: "#5a2a1a",
    sectionBgResolution: "#1a3a1a",
    sectionBgDescription: "#2a2a2a",
    border: "#555",
    label: "#ccc",
    value: "#eee",
    empty: "#888",
    highlight: "#84a0d9",
    text: "#ddd",
    iconManager: "#9b7fd3",
  },
};




const ComplaintItemDetailView = ({ complaint }) => {

  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const c = theme === "dark" ? colorsSet.dark : colorsSet.light;
  const locale = i18n.language;

  const formatAmountValue = (value) =>
    value == null || Number.isNaN(Number(value))
      ? null
      : formatMoney2(Number(value), complaint.currency || "грн");
  const submittedCompensationValue =
    complaint.compensationAmount == null || Number(complaint.compensationAmount) === 0
      ? null
      : formatAmountValue(complaint.compensationAmount);
  const compensatedAmountValue =
    complaint.debtCorrectionAmount == null || Number(complaint.debtCorrectionAmount) === 0
      ? null
      : formatAmountValue(complaint.debtCorrectionAmount);
  const compensatedSummary = [
    compensatedAmountValue,
    complaint.debtCorrectionDate
      ? `${t("complaints.detail.from_date")} ${formatDateTimeShort(complaint.debtCorrectionDate, locale)}`
      : null,
  ]
    .filter(Boolean)
    .join(" ");
  const complaintMetaRows = [
    {
      key: "complaintReasonName",
      label: t("complaints.detail.complaint_reason"),
      value: complaint.complaintReasonName,
    },
    Number(complaint.documentAmount) !== 0 && {
      key: "documentAmount",
      label: t("complaints.detail.document_amount"),
      value: formatAmountValue(complaint.documentAmount),
    },
    {
      key: "borderReturnDate",
      label: t("complaints.detail.border_return_date"),
      value: complaint.readyDate ? formatDate(complaint.readyDate, locale) : null,
      highlight: true,
    },
    {
      key: "submittedCompensation",
      label: t("complaints.detail.compensation_requested"),
      value: submittedCompensationValue,
    },
    {
      key: "compensatedSummary",
      label: t("complaints.detail.compensated"),
      value: compensatedSummary || null,
    },
    {
      key: "returnDate",
      label: t("complaints.detail.date_received_production"),
      value: complaint.returnDate
        ? formatDateTimeShort(complaint.returnDate, locale)
        : null,
    },
  ].filter((item) => item?.value);
  const dateRows = [
    {
      key: "dateComplaint",
      label: t("complaints.detail.date_complaint"),
      value: complaint.date ? formatDate(complaint.date, locale) : null,
    },
    {
      key: "dateDetection",
      label: t("complaints.detail.date_detection"),
      value: complaint.determinationDate ? formatDate(complaint.determinationDate, locale) : null,
    },
    {
      key: "dateProduced",
      label: t("complaints.detail.date_produced"),
      value: complaint.producedDate ? formatDate(complaint.producedDate, locale) : null,
    },
    {
      key: "dateShipped",
      label: t("complaints.detail.date_shipped"),
      value: complaint.soldDate ? formatDate(complaint.soldDate, locale) : null,
    },
  ].filter((item) => item?.value);

  return <ComplaintFacts complaint={complaint} dateRows={dateRows} metaRows={complaintMetaRows} />;
};

export { ComplaintItemDetailView };
