const productionStatuses = new Set(["Підтверджений", "Оплачено", "У виробництві"]);
function day(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match || Number(match[1]) < 1900 || Number(match[1]) > 3000) return null;
  const parsed = new Date(`${match[0]}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : match[0];
}
export function calculationStatusDates(orders, status) {
  const rows = (orders || []).filter(order => order.status === status);
  const fields = status === "Відвантажений" ? ["realizationDate"] : status === "Готовий" ? ["factReadyMin", "factReadyMax"] : productionStatuses.has(status) ? ["planProductionMin", "planProductionMax"] : [];
  if (!fields.length) return null;
  const dates = [], count = rows.reduce((count, order) => {
    const values = fields.map(field => day(order[field])).filter(Boolean);
    dates.push(...values);
    return count + (values.length ? 1 : 0);
  }, 0);
  if (!dates.length) return null;
  dates.sort();
  const format = value => value.split("-").reverse().join(".");
  return { label: status === "Відвантажений" ? "Відвантажено" : status === "Готовий" ? "Виготовлено" : "План вир.", range: dates[0] === dates.at(-1) ? format(dates[0]) : `${format(dates[0])} — ${format(dates.at(-1))}`, available: count, total: rows.length };
}

// One date caption per calculation: focus on the next unfinished production stage.
export function calculationSummaryDates(orders, status) {
  const statuses = new Set((orders || []).map(order => order.status).filter(Boolean));
  const selected = ["Підтверджений", "Оплачено", "У виробництві", "Готовий", "Відвантажений"].find(value => statuses.has(value));
  if (status !== selected) return null;
  const result = calculationStatusDates(orders, status);
  if (result && statuses.size === 1 && status === "У виробництві") {
    return { ...result, range: result.range.split(" — ").at(-1) };
  }
  return result;
}
