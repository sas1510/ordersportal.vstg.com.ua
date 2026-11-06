import { useEffect, useRef } from "react";
import { useNotification } from "./useNotification";
import axiosInstance, { closeDealerPreviewTab, dealerPreviewToken } from "../api/axios";

const IDLE_MS = 30 * 60 * 1000;
const MAX_MS = 60 * 60 * 1000;
const WARNING_MS = 5 * 60 * 1000;
const PING_INTERVAL_MS = 15_000;
const EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"];

export function useDealerPreviewLifetime(user) {
  const { addNotification } = useNotification();
  const notify = useRef(addNotification);
  useEffect(() => { notify.current = addNotification; }, [addNotification]);
  const name = useRef(null);
  useEffect(() => { name.current = user?.full_name || user?.username || null; }, [user]);
  useEffect(() => {
    if (!dealerPreviewToken()) return;
    const startedAt = Number(sessionStorage.getItem("dealerPreviewStartedAt"));
    if (!startedAt) return;
    let activityAt = Number(sessionStorage.getItem("dealerPreviewActivityAt")) || startedAt;
    let lastPingAt = startedAt;
    let expiryTimer;
    let pingTimer;

    function checkExpiry() {
      clearTimeout(expiryTimer);
      const deadline = Math.min(startedAt + MAX_MS, activityAt + IDLE_MS);
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        clearTimeout(pingTimer);
        closeDealerPreviewTab();
        return false;
      }
      if (remaining <= WARNING_MS && !document.hidden) {
        const warningKey = "dealerPreviewWarnedAt";
        if (sessionStorage.getItem(warningKey) !== String(deadline)) {
          sessionStorage.setItem(warningKey, String(deadline));
          const minutes = Math.ceil(remaining / 60_000);
          const identity = name.current ? ` від імені «${name.current}»` : " від імені дилера";
          notify.current(`Перегляд${identity} завершиться через ${minutes} хв. Збережіть незавершені зміни.`, "warning", 30_000);
        }
      }
      expiryTimer = window.setTimeout(checkExpiry, remaining > WARNING_MS ? remaining - WARNING_MS : remaining);
      return true;
    }

    function sendActivity() {
      pingTimer = undefined;
      if (!dealerPreviewToken() || !checkExpiry()) return;
      lastPingAt = Date.now();
      axiosInstance.post("/dealer-preview/session/").catch(() => {});
    }

    function onActivity(event) {
      if (!event.isTrusted || !checkExpiry()) return;
      activityAt = Date.now();
      sessionStorage.setItem("dealerPreviewActivityAt", String(activityAt));
      checkExpiry();
      if (pingTimer === undefined) {
        pingTimer = window.setTimeout(sendActivity, Math.max(0, lastPingAt + PING_INTERVAL_MS - activityAt));
      }
    }

    checkExpiry();
    EVENTS.forEach((name) => window.addEventListener(name, onActivity, { passive: true, capture: true }));
    document.addEventListener("visibilitychange", checkExpiry);
    return () => {
      clearTimeout(expiryTimer);
      clearTimeout(pingTimer);
      EVENTS.forEach((name) => window.removeEventListener(name, onActivity, true));
      document.removeEventListener("visibilitychange", checkExpiry);
    };
  }, []);
}
