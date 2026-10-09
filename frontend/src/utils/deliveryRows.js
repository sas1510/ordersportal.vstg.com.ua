const dayKey = (date) => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Kyiv", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type).value;
  return `${value("year")}-${value("month")}-${value("day")}`;
};
const timeLabel = (date) => new Intl.DateTimeFormat("uk-UA", { timeZone: "Europe/Kyiv", hour: "2-digit", minute: "2-digit" }).format(date);
export function sortDeliveryDates(dates) {
  return [...dates].sort((a, b) => b.localeCompare(a));
}
export function getDeliveryRows(calculations, now = Date.now(), period = "future") {
  const seen = new Set();
  const [year, month, day] = dayKey(new Date(now)).split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 4, 1));
  const lastDay = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
  start.setUTCDate(Math.min(day, lastDay));
  const earliestDay = start.toISOString().slice(0, 10);
  return calculations.flatMap((calc) => (calc.orders || []).flatMap((order) => {
    const raw = order.plannedDeliveryDateTime || order.PlannedDeliveryDateTime;
    const delivery = new Date(raw);
    if (!raw || !Number.isFinite(delivery.getTime()) || String(order.status || "").trim() === "Відмова") return [];
    const time = /\d{2}:\d{2}/.test(String(raw)) && timeLabel(delivery) !== "00:00" ? timeLabel(delivery) : "";
    if (period === "future" && delivery.getTime() < now) return [];
    if (period === "past" && delivery.getTime() >= now) return [];
    if (delivery.getTime() < now && dayKey(delivery) < earliestDay) return [];
    const key = order.idGuid || order.number;
    if (!key || seen.has(key)) return [];
    seen.add(key);
    return [{ order, calc, day: dayKey(delivery), time, timestamp: delivery.getTime() }];
  })).sort((a, b) => a.timestamp - b.timestamp);
}
