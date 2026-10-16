import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import axios from "../../api/axios";
import "./MaintenanceSchedule.css";

const kyivInput = (value) => {
  const parts = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Kyiv", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
};

export default function MaintenanceSchedule({ state, onSaved, onClose }) {
  const now = Date.now();
  const upcoming = state.ends_at && new Date(state.ends_at).getTime() > now;
  const [start, setStart] = useState(() => kyivInput(upcoming && state.starts_at ? state.starts_at : now));
  const [end, setEnd] = useState(() => kyivInput(upcoming ? state.ends_at : now + 20 * 60000));
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const dialog = useRef(null);
  useEffect(() => { const previous = document.activeElement; dialog.current?.querySelector("input")?.focus(); return () => previous?.focus?.(); }, []);
  const save = async (cancel = false) => {
    if (busy) return;
    if (!cancel && (!start || !end || start >= end)) { setError("Завершення має бути пізніше за початок."); return; }
    setBusy(true); setError("");
    try {
      // Offset-free values are interpreted by the server in Europe/Kyiv,
      // independently of the administrator's device timezone.
      const { data } = await axios.post("/system/maintenance/1c/", cancel ? { enabled: false, clear_schedule: true } : { enabled: false, starts_at: start, ends_at: end });
      onSaved(data.data); onClose();
    } catch { setError("Не вдалося зберегти розклад. Перевірте дати та спробуйте ще раз."); }
    finally { setBusy(false); }
  };
  return createPortal(<div className="maintenance-schedule-backdrop" onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}><section ref={dialog} className="maintenance-schedule-dialog" role="dialog" aria-modal="true" aria-labelledby="maintenance-schedule-title" onKeyDown={(event) => {
    if (event.key === "Escape" && !busy) { event.stopPropagation(); onClose(); }
    if (event.key === "Tab") {
      const controls = [...dialog.current.querySelectorAll("input:not(:disabled), button:not(:disabled)")];
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0]?.focus(); }
    }
  }}><h3 id="maintenance-schedule-title">Розклад паузи 1С</h3><p>Дата й час — за Києвом. Пауза вмикається й вимикається автоматично.</p>
    <form onSubmit={(event) => { event.preventDefault(); save(); }}>
      <label>Початок відключення<input type="datetime-local" required value={start} disabled={busy} onChange={(event) => setStart(event.target.value)} /></label>
      <label>Завершення відключення<input type="datetime-local" required min={start} value={end} disabled={busy} onChange={(event) => setEnd(event.target.value)} /></label>
      {error && <p role="alert">{error}</p>}
      <div className="maintenance-schedule-actions"><button type="button" disabled={busy} onClick={onClose}>Закрити</button><button type="submit" disabled={busy}>{busy ? "Збереження…" : "Зберегти розклад"}</button></div>
      {(state.enabled || upcoming) && <button className="maintenance-schedule-cancel" type="button" disabled={busy} onClick={() => save(true)}>Вимкнути паузу й скасувати розклад</button>}
    </form>
  </section></div>, document.body);
}
