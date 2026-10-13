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
    let lastScroll = 0;
    const recordScroll = () => { lastScroll = performance.now(); };
    const modalOpen = () => Boolean(document.querySelector('[aria-modal="true"], .preview-modal-overlay, .file-preview-overlay, .modal-overlay'));
    const reset = () => { start = null; pull = 0; setDistance(0); };
    const begin = (event) => {
      reset();
      // Touch-capable devices include large iPads wider than 1366 CSS pixels.
      // Only arm at touch-down, never after a scrolling gesture reaches the top.
      const touchScreen = navigator.maxTouchPoints > 0 || window.matchMedia("(any-pointer: coarse)").matches;
      if (blocked || !touchScreen || event.touches.length !== 1 || modalOpen() || node.scrollTop > 1 || performance.now() - lastScroll < 250) return;
      if (event.target.closest("input, textarea, select, button, a, iframe, video, [contenteditable='true']")) return;
      if (event.target.closest(".content-filter")) return;
      // The order list may be the scrolling element instead of main.
      // Its ancestors must all already be at their top when touching down.
      const scrollParents = [node];
      for (let item = event.target; item && item !== node; item = item.parentElement) {
        if (item.scrollTop > 1) return;
        if (item.scrollHeight > item.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(item).overflowY)) scrollParents.push(item);
      }
      start = { x: event.touches[0].clientX, y: event.touches[0].clientY, time: performance.now(), scrollParents };
    };
    const move = (event) => {
      if (!start) return;
      if (event.touches.length !== 1 || modalOpen() || start.scrollParents.some((item) => item.scrollTop > 1)) { reset(); return; }
      const dx = event.touches[0].clientX - start.x;
      const dy = event.touches[0].clientY - start.y;
      if (dy < 0 || Math.abs(dx) > Math.max(12, dy)) { reset(); return; }
      if (dy < 12) return;
      if (event.cancelable) event.preventDefault();
      pull = Math.min(110, dy * 0.5);
      setDistance(pull);
    };
    const end = () => {
      const shouldRefresh = pull >= 90 && start && start.scrollParents.every((item) => item.scrollTop <= 1) && !modalOpen();
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
    node.addEventListener("scroll", recordScroll, { passive: true, capture: true });
    return () => {
      node.removeEventListener("touchstart", begin); node.removeEventListener("touchmove", move);
      node.removeEventListener("touchend", end); node.removeEventListener("touchcancel", reset);
      node.removeEventListener("scroll", recordScroll, true);
    };
  }, []);
  return <><main ref={container} style={style} className="portal-pull-refresh">{children}</main><button type="button" className="portal-refresh-button" title="Оновити сторінку" aria-label="Оновити сторінку" disabled={refreshing} onClick={() => { if (!document.querySelector('[aria-modal="true"], .preview-modal-overlay, .file-preview-overlay, .modal-overlay')) { setRefreshing(true); window.location.reload(); } }}>↻</button>{(distance > 0 || refreshing) && <div className="portal-pull-refresh-hint" role="status">{refreshing ? "Оновлення…" : distance >= 90 ? "Відпустіть, щоб оновити ↓" : "Потягніть вниз, щоб оновити ↓"}</div>}</>;
}
