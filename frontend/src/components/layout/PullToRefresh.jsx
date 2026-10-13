import { useEffect, useRef, useState } from "react";
import "./PullToRefresh.css";

export default function PullToRefresh({ children, style }) {
  const container = useRef(null);
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    const node = container.current;
    let start = null;
    let pull = 0;
    let blocked = false;
    const modalOpen = () => Boolean(document.querySelector('[aria-modal="true"], .preview-modal-overlay, .file-preview-overlay, .modal-overlay'));
    const reset = () => { start = null; pull = 0; setDistance(0); };
    const begin = (event) => {
      reset();
      if (blocked || !window.matchMedia("(max-width: 1024px) and (pointer: coarse)").matches || event.touches.length !== 1 || modalOpen() || node.scrollTop > 1) return;
      if (event.target.closest("input, textarea, select, button, a, iframe, video, [contenteditable='true']")) return;
      // A nested list must also be at its top before the page can refresh.
      for (let item = event.target; item && item !== node; item = item.parentElement) {
        if (item.scrollTop > 1) return;
      }
      start = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    };
    const move = (event) => {
      if (!start) return;
      if (event.touches.length !== 1 || modalOpen() || node.scrollTop > 1) { reset(); return; }
      const dx = event.touches[0].clientX - start.x;
      const dy = event.touches[0].clientY - start.y;
      if (dy < 0 || Math.abs(dx) > Math.max(12, dy)) { reset(); return; }
      if (dy < 12) return;
      if (event.cancelable) event.preventDefault();
      pull = Math.min(90, dy * 0.5);
      setDistance(pull);
    };
    const end = () => {
      const shouldRefresh = pull >= 65 && !modalOpen();
      reset();
      if (shouldRefresh && !blocked) {
        blocked = true; setRefreshing(true);
        window.location.reload();
      }
    };
    node.addEventListener("touchstart", begin, { passive: true });
    node.addEventListener("touchmove", move, { passive: false });
    node.addEventListener("touchend", end, { passive: true });
    node.addEventListener("touchcancel", reset, { passive: true });
    return () => {
      node.removeEventListener("touchstart", begin); node.removeEventListener("touchmove", move);
      node.removeEventListener("touchend", end); node.removeEventListener("touchcancel", reset);
    };
  }, []);
  return <><main ref={container} style={style} className="portal-pull-refresh">{children}</main>{(distance > 0 || refreshing) && <div className="portal-pull-refresh-hint" role="status">{refreshing ? "Оновлення…" : distance >= 65 ? "Відпустіть, щоб оновити ↓" : "Потягніть вниз, щоб оновити ↓"}</div>}</>;
}
