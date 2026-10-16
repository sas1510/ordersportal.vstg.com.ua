import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import axios from "../../api/axios";
import { useAuthGetRole } from "../../hooks/useAuthGetRole";

export default function DeliveryNotice({ observations }) {
  const { role } = useAuthGetRole();
  const isDealer = role === "customer" || role === "dealer";
  const [deliveries, setDeliveries] = useState([]);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const previous = useRef("");
  useEffect(() => {
    // Empty is also a valid baseline once the order list has been loaded.
    if (!isDealer || !observations || previous.current === observations) return;
    previous.current = observations;
    const orders = JSON.parse(observations);
    axios.post("/delivery-notifications/check/", { orders }).then(({ data }) => {
      const counts = new Map(orders.map((order) => [String(order.orderGuid).toLowerCase(), order.count]));
      if (data.deliveries?.length) setDeliveries((items) => [...new Map([...items, ...data.deliveries.map((item) => ({ ...item, count: item.count ?? counts.get(String(item.orderGuid).toLowerCase()) }))].map((item) => [item.receiptId, item])).values()]);
    }).catch((error) => { previous.current = ""; console.error("Не вдалося перевірити сповіщення про доставку", error); });
  }, [observations, isDealer]);
  const confirm = async () => {
    if (confirming) return;
    const ids = deliveries.map((item) => item.receiptId);
    setConfirming(true); setError("");
    try {
      await axios.post("/delivery-notifications/shown/", { ids });
      setDeliveries((items) => items.filter((item) => !ids.includes(item.receiptId)));
    } catch { setError("Не вдалося підтвердити. Натисніть «Більше не показувати» ще раз."); }
    finally { setConfirming(false); }
  };
  if (!isDealer || !deliveries.length) return null;
  return createPortal(<div className="delivery-notice-backdrop"><section className="delivery-notice" role="dialog" aria-modal="true" aria-label="Нова планова доставка">
    <h3>🚚 Нова планова доставка</h3>
    <div className="delivery-notice-items">{[...new Set(deliveries.map((item) => item.delivery.split("T")[0]))].sort().map((day) => {
      const items = deliveries.filter((item) => item.delivery.startsWith(`${day}T`)).sort((a, b) => a.delivery.localeCompare(b.delivery) || a.number.localeCompare(b.number));
      return <section className="delivery-notice-group" key={day}><h4>{day.split("-").reverse().join(".")}</h4><div className="delivery-notice-numbers">{items.map((item) => {
        const time = item.delivery.split("T")[1];
        return <div className="delivery-notice-order" key={item.receiptId}><span><strong>№ {item.number}</strong>{item.count != null && <small> · {item.count} констр.</small>}<small className="delivery-notice-calc">Прорахунок: {item.calculation || "—"}</small></span><span className="delivery-notice-time">{time === "00:00" ? "Час уточнюється" : `Орієнтовно ${time}`}</span></div>;
      })}</div></section>;
    })}</div>
    <p className="delivery-notice-total">Усього: {deliveries.length} замовлень · {deliveries.reduce((sum, item) => sum + Number(item.count || 0), 0)} констр.{deliveries.some((item) => item.count == null) ? " (без урахування невідомої кількості)" : ""}</p>
    {error && <p role="alert">{error}</p>}
    <div className="delivery-notice-actions">
      <button type="button" className="delivery-notice-close" disabled={confirming} onClick={() => { setDeliveries([]); setError(""); }}>Закрити</button>
      <button type="button" disabled={confirming} onClick={confirm}>{confirming ? "Збереження…" : "Більше не показувати"}</button>
    </div>
  </section></div>, document.body);
}
