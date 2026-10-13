import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuthGetRole } from "../hooks/useAuthGetRole";
import { useAuth } from "../hooks/useAuth";
import axios from "../api/axios";
import { buildOperationalReport } from "../utils/operationalReport";
import "./ManagerDelayNotice.css";

export default function ManagerDelayNotice() {
  const { role, user } = useAuthGetRole();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [orders, setOrders] = useState([]);
  const dialog = useRef(null);
  useEffect(() => {
    setCount(0);
    if (!isAuthenticated || !["manager", "region_manager"].includes(role) || !user) return;
    const day = (stamp) => new Date(stamp).toLocaleDateString("en-CA", { timeZone: "Europe/Kyiv" });
    const today = day(Date.now());
    const key = `manager_delay_last_shown_day:${user.id || user.username}`;
    if (localStorage.getItem(key) === today) return;
    const controller = new AbortController();
    axios.get("/order/get_orders_info_all/", { signal: controller.signal, params: { date_from: day(Date.now() - 90 * 86400000), date_to: day(Date.now()) } }).then(({ data }) => {
      if (controller.signal.aborted || data.status !== "success" || !Array.isArray(data.data?.calculation)) return;
      const overdue = buildOperationalReport(data.data.calculation).risks.filter((order) => order.daysLate > 0);
      if (!overdue.length || localStorage.getItem(key) === today) return;
      localStorage.setItem(key, today);
      setOrders(overdue.sort((a, b) => b.daysLate - a.daysLate));
      setCount(overdue.length);
    }).catch(() => { /* A failed check is not marked as completed. */ });
    return () => controller.abort();
  }, [role, user?.id, user?.username, isAuthenticated]);
  useEffect(() => {
    if (!count) return;
    const previous = document.activeElement;
    dialog.current?.querySelector("button")?.focus();
    return () => previous?.focus?.();
  }, [count]);
  if (!count || !isAuthenticated || !["manager", "region_manager"].includes(role)) return null;
  return createPortal(<div className="manager-delay-backdrop"><section ref={dialog} className="manager-delay-notice" role="dialog" aria-modal="true" aria-labelledby="manager-delay-title" aria-describedby="manager-delay-description" onKeyDown={(event) => {
    if (event.key === "Escape") setCount(0);
    if (event.key === "Tab") {
      const buttons = [...dialog.current.querySelectorAll("button")];
      if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
    }
  }}><h3 id="manager-delay-title">⚠ Є прострочені замовлення</h3><p id="manager-delay-description">У вашому списку: <strong>{count}</strong>. Перевірте готовність і дати затримки.</p><div className="manager-delay-orders">{orders.slice(0, 5).map((order) => <div key={order.idGuid || order.number}><strong>№ {order.number} · {order.daysLate} дн.</strong><small>{order.dealer}</small></div>)}{orders.length > 5 && <small>Ще {orders.length - 5} — у звіті</small>}</div><small>За заявками останніх 90 днів.</small><div className="manager-delay-actions"><button type="button" onClick={() => { setCount(0); navigate("/orders-report?view=operations"); }}>Перейти до звіту</button><button type="button" onClick={() => setCount(0)}>Зрозуміло</button></div></section></div>, document.body);
}
