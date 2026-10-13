import { useState } from "react";
import axios from "../../api/axios";
import { useNotification } from "../../hooks/useNotification";
import { findOrderZkz } from "../../utils/findOrderZkz";

export default function OrderZkzButton({ search }) {
  const [busy, setBusy] = useState(false);
  const { addNotification } = useNotification();
  const number = String(search || "").trim();
  const download = async (event) => {
    event.stopPropagation();
    if (busy || !number) return;
    setBusy(true);
    try {
      const order = (await axios.get("/orders/zkz-search/", { params: { number } })).data.order;
      const { data } = await axios.get(`/order/${order.idGuid}/files/`);
      const file = findOrderZkz(data.files, number);
      if (!file) { addNotification(`ZKZ для замовлення № ${number} не знайдено`, "warning"); return; }
      const response = await axios.get(`/order/${order.idGuid}/files/${file.fileGuid}/download/`, { params: { filename: file.fileName }, responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url; link.download = file.fileName;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) { addNotification(error.response?.data?.error || "Не вдалося завантажити ZKZ. Спробуйте ще раз.", "error"); }
    finally { setBusy(false); }
  };
  return <button type="button" className="order-zkz-download" disabled={busy || !number} onClick={download} title="Пошук замовлення за останні 6 років, незалежно від прорахунку" aria-label="Завантажити ZKZ за введеним номером замовлення">{busy ? "Пошук ZKZ…" : `↓ Завантажити ZKZ № ${number}`}</button>;
}
