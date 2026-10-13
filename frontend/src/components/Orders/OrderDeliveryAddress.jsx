import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./OrderDeliveryAddress.css";

export default function OrderDeliveryAddress({ order, orders, calculationNumber, calculation, label = "📍 Адреси", isOpen, onClose, hideButton = false, iconOnly = false }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isOpen ?? internalOpen;
  const setOpen = (value) => { setInternalOpen(value); if (!value) onClose?.(); };
  const [message, setMessage] = useState("");
  const dialog = useRef(null);
  const items = orders?.length ? orders : order ? [order] : [];
  const address = items.length ? items.map((item) => `№ ${String(item.number || "").trim()} — ${String(item.deliveryAddress || "").trim() || "Адресу не вказано"}`).join("\n") : String(calculation?.deliveryAddresses || "");
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    dialog.current?.querySelector("button")?.focus();
    return () => previous?.focus?.();
  }, [open]);
  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(address);
      else {
        const field = document.createElement("textarea");
        field.value = address;
        field.style.position = "fixed"; field.style.opacity = "0";
        dialog.current.appendChild(field); field.select();
        try { if (!document.execCommand("copy")) throw new Error("copy"); }
        finally { field.remove(); }
      }
      setMessage("Номери й адреси скопійовано");
    } catch { setMessage("Не вдалося скопіювати. Виділіть адресу й скопіюйте вручну."); }
  };
  return <>{!hideButton && <button type="button" className={`order-address-button${iconOnly ? " order-address-button--icon" : ""}`} disabled={!items.length && !calculation} title="Адреси доставки" aria-label="Адреси доставки" onClick={(event) => { event.stopPropagation(); setMessage(""); setOpen(true); }}>{iconOnly ? <svg width="16" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg> : label}</button>}
    {open && createPortal(<div className="order-address-backdrop" onClick={(event) => { event.stopPropagation(); if (event.target === event.currentTarget) setOpen(false); }}><section ref={dialog} className="order-address-dialog" role="dialog" aria-modal="true" aria-labelledby="order-address-title" onKeyDown={(event) => {
      if (event.key === "Escape") { event.stopPropagation(); setOpen(false); }
      if (event.key === "Tab") {
        const buttons = [...dialog.current.querySelectorAll("button")];
        if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
        else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
      }
    }}><h3 id="order-address-title">Адреса доставки</h3>{calculationNumber && <small>Прорахунок: {calculationNumber}</small>}
      {calculation && <div className="order-address-recipient">
        {calculation.recipient && <div><small>Одержувач</small>{calculation.recipient}</div>}
        {calculation.recipientPhone && <div><small>Телефон</small><a href={`tel:${String(calculation.recipientPhone).replace(/[^+\d]/g, "")}`}>{calculation.recipientPhone}</a></div>}
        {calculation.recipientAdditionalInfo && <div><small>Контактна інформація</small>{calculation.recipientAdditionalInfo}</div>}
        <div><small>Адреса прорахунку</small>{calculation.deliveryAddresses || "Адресу не вказано"}</div>
      </div>}
      <div className="order-address-list">{items.map((item, index) => <div key={item.idGuid || `${item.number}-${index}`}><strong>№ {String(item.number || "").trim()}</strong><p>{String(item.deliveryAddress || "").trim() || "Адресу не вказано"}</p></div>)}</div><div className="order-address-actions"><button type="button" onClick={copy} disabled={!address}>Скопіювати всі</button><button type="button" onClick={() => setOpen(false)}>Закрити</button></div><div role="status" className="order-address-feedback">{message}</div></section></div>, document.body)}
  </>;
}
