import { useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

export default function ComplaintSeries({ value, previewLimit = 6 }) {
  const { t } = useTranslation();
  const dialog = useRef(null);
  const series = [...new Set((Array.isArray(value) ? value : String(value || "").split(/[,;\n]+/))
    .map(item => String(item).trim()).filter(item => item && item !== "Не вказано"))];
  if (!series.length) return null;
  const visible = series.slice(0, previewLimit);
  const title = t("complaints.detail.series");
  return <section className="complaint-series" aria-label={t("complaints.detail.series")}>
    <div className="complaint-series__heading">
      <h3>{series.length > previewLimit
        ? <button type="button" aria-haspopup="dialog" onClick={event => { event.stopPropagation(); dialog.current.showModal(); }}>
            {t("complaints.detail.series")} ({series.length}) <span aria-hidden="true">↗</span>
          </button>
        : <>{t("complaints.detail.series")} <span>({series.length})</span></>}
      </h3>
    </div>
    <ul>{visible.map(item => <li key={item}>{item}</li>)}</ul>
    {series.length > previewLimit && createPortal(
      <dialog ref={dialog} className="complaint-files-dialog complaint-series-dialog" aria-label={title} onClick={event => event.stopPropagation()}>
        <div className="complaint-files-dialog__heading">
          <h2>{title} ({series.length})</h2>
          <button type="button" className="complaint-files-button" onClick={() => dialog.current.close()} aria-label={t("common.close", { defaultValue: "Закрити" })}>×</button>
        </div>
        <ul>{series.map(item => <li key={item}>{item}</li>)}</ul>
      </dialog>, document.body)}
  </section>;
}
