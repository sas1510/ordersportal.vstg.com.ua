import { useEffect, useState } from "react";
import axios from "../api/axios";
import { useAuthGetRole } from "./useAuthGetRole";
import { useNotification } from "./useNotification";

export function useDeliveryBadge(orders, open) {
  const { user } = useAuthGetRole();
  const { addNotification } = useNotification();
  const account = user?.id || user?.username || "";
  const payload = JSON.stringify(orders || []);
  const key = `${account}:${payload}`;
  const [pending, setPending] = useState({ key: "", ids: [] });
  useEffect(() => {
    if (!account || !JSON.parse(payload).length) return;
    const controller = new AbortController();
    axios.post("/delivery-notifications/badge/", { orders: JSON.parse(payload) }, { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setPending({ key, ids: data.ids || [] }); })
      .catch(() => { /* A later data refresh retries the check. */ });
    return () => controller.abort();
  }, [account, payload, key]);
  useEffect(() => {
    if (!open || pending.key !== key || !pending.ids.length) return;
    const ids = pending.ids;
    let active = true;
    axios.post("/delivery-notifications/read/", { ids }).then(() => {
      setPending(previous => previous.key === key ? { key, ids: previous.ids.filter(id => !ids.includes(id)) } : previous);
    }).catch(() => {
      if (active) addNotification("Не вдалося позначити доставки як прочитані. Відкрийте «Доставки» ще раз.", "error");
    });
    return () => { active = false; };
  }, [open, pending, key]);
  return pending.key === key && pending.ids.length > 0;
}
