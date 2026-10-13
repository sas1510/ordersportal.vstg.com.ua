export function overdueProduction(order, now = Date.now()) {
  // Until readiness is confirmed, the order card uses the production order's
  // date as its current plan, falling back to the original planning range.
  const productionDeadline = Number.isFinite(Date.parse(order.factProductionMax || ""))
    ? order.factProductionMax : order.planProductionMax;
  const dates = [productionDeadline, order.planReadyMax, order.dateDelay].map((value) => value ? Date.parse(value) : NaN).filter(Number.isFinite);
  if (!dates.length) return { deadline: null, daysLate: null, delayBucket: "" };
  const deadline = Math.max(...dates);
  const calendarDay = (stamp) => {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Kyiv", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(stamp));
    const get = (key) => Number(parts.find((part) => part.type === key).value);
    return Date.UTC(get("year"), get("month") - 1, get("day"));
  };
  const isDueToday = calendarDay(now) === calendarDay(deadline);
  const daysLate = Math.max(0, Math.round((calendarDay(now) - calendarDay(deadline)) / 86400000));
  return { deadline, daysLate, isDueToday, delayBucket: daysLate > 7 ? "Понад 7 днів" : daysLate >= 4 ? "4–7 днів" : daysLate >= 1 ? "1–3 дні" : "Без прострочення" };
}

export function buildOperationalReport(calculations, now = Date.now()) {
  const day = 86400000;
  const dealers = new Map();
  const deliveries = [], risks = [];
  const seen = new Set();
  for (const calc of calculations) {
    const key = calc.dealerId || calc.dealer || "unknown";
    if (!dealers.has(key)) dealers.set(key, { id: key, name: calc.dealer || "Без назви", orders: 0, months: new Set(), last: 0, debts: {} });
    const dealer = dealers.get(key);
    for (const order of calc.orders || []) {
      const id = order.idGuid || order.number;
      if (!id || seen.has(id) || order.status === "Відмова" || /^34-/.test(order.number || "")) continue;
      seen.add(id);
      const created = Date.parse(order.dateRaw || order.date || calc.dateRaw);
      if (Number.isFinite(created)) {
        dealer.orders++;
        dealer.last = Math.max(dealer.last, created);
        dealer.months.add(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Kyiv", year: "numeric", month: "2-digit" }).format(new Date(created)));
      }
      const currency = order.currency || "Валюта не вказана";
      dealer.debts[currency] = (dealer.debts[currency] || 0) + Math.max(0, Number(order.amount || 0) - Number(order.paid || 0));
      const item = { ...order, dealer: dealer.name, dealerId: key, calculation: calc.number || "" };
      const rawDelivery = order.plannedDeliveryDateTime || order.PlannedDeliveryDateTime;
      const delivery = rawDelivery ? Date.parse(rawDelivery) : NaN;
      if (Number.isFinite(delivery) && delivery >= now - day && delivery <= now + 7 * day) {
        const currentDay = new Date(now).toLocaleDateString("en-CA", { timeZone: "Europe/Kyiv" });
        const deliveryDay = new Date(delivery).toLocaleDateString("en-CA", { timeZone: "Europe/Kyiv" });
        if (deliveryDay >= currentDay) deliveries.push({ ...item, delivery });
      }
      const overdue = overdueProduction(order, now);
      const completed = ["Готовий", "Відвантажений", "Відвантажено", "Закритий"].includes(order.status);
      if (!completed && !order.factReadyMax && !overdue.isDueToday) {
        const delayMissing = !Number.isFinite(Date.parse(order.dateDelay || ""));
        if (overdue.daysLate > 0) risks.push({ ...item, ...overdue, severity: "high", delayMissing, reason: "Останній плановий термін минув, готовність не підтверджена" });
        else if (Number.isFinite(delivery) && delivery >= now && delivery <= now + 2 * day) risks.push({ ...item, ...overdue, severity: delivery <= now + day ? "high" : "medium", delayMissing, reason: "Доставка за 48 годин, готовність не підтверджена" });
      }
    }
  }
  const rows = [...dealers.values()].filter((dealer) => dealer.orders).map((dealer) => ({ ...dealer, regular: dealer.months.size >= 3 && now - dealer.last <= 30 * day, inactive: now - dealer.last > 30 * day }));
  return { dealers: rows.sort((a, b) => b.orders - a.orders), deliveries: deliveries.sort((a, b) => a.delivery - b.delivery), risks };
}
