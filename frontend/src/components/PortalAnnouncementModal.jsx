import { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import { FaCheck, FaExternalLinkAlt, FaInfoCircle, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import "./PortalAnnouncementModal.css";

export default function PortalAnnouncementModal() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    let disposed = false;
    const loadAnnouncements = async () => {
      try {
        const response = await axiosInstance.get("/announcements/active/");
        if (!disposed) setItems(response.data || []);
      } catch {
        // A transient error must not interrupt the portal UI.
      }
    };
    loadAnnouncements();
    const intervalId = window.setInterval(loadAnnouncements, 30000);
    return () => {
      disposed = true;
      window.clearInterval(intervalId);
    };
  }, []);
  const item = items[0];
  if (!item) return null;
  const close = async (action) => { try { await axiosInstance.post(`/announcements/${item.id}/receipt/`, { action }); } finally { setItems((prev) => prev.slice(1)); } };
  const icon = item.style === "critical" || item.style === "warning" ? <FaExclamationTriangle /> : item.style === "success" ? <FaCheck /> : <FaInfoCircle />;
  return <div className={`portal-announcement portal-announcement--${item.style}`} role="dialog" aria-modal="true"><div className="portal-announcement__card"><div className="portal-announcement__glow"/><div className="portal-announcement__banner"><span className="portal-announcement__icon">{icon}</span><h2>{item.title}</h2></div><div className="portal-announcement__content"><p>{item.body}</p>{item.attachment_url && <div className="portal-announcement__attachment-actions">
    <a className="portal-announcement__attachment" href={item.attachment_url} target="_blank" rel="noreferrer">📎 Відкрити вкладення</a>
    <a className="portal-announcement__attachment" href={item.attachment_url} download>⇩ Завантажити</a>
  </div>}<div className="portal-announcement__actions">{item.action_url && <a href={item.action_url} target="_blank" rel="noreferrer">{item.action_label || "Детальніше"} <FaExternalLinkAlt /></a>}<button onClick={() => close("acknowledge")}>{item.require_acknowledgement ? "✓ Ознайомився" : "Зрозуміло"}</button></div></div></div></div>;
}
