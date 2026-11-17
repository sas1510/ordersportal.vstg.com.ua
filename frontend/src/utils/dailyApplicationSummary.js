export const NEW_APPLICATION_STATE = "0XA8AE1CFA97BAD3774296494E88BE7F1A";
export const PROCESSING_APPLICATION_STATE = "0XA267AAA90D55301D4E455425612DA59E";

export function dailyApplicationSummary(rows) {
  const unique = new Map();
  for (const row of rows) for (const app of row.applicationDetails || []) {
    if (!app.guid || unique.has(app.guid)) continue;
    unique.set(app.guid, { ...app, dealerGuid: row.guid, dealer: row.name });
  }
  const applications = [...unique.values()];
  const summarize = (key, label, apps) => ({ key, label, applications: apps.length,
    dealers: new Set(apps.map(app => app.dealerGuid)).size,
    constructions: apps.reduce((sum, app) => sum + Number(app.constructions || 0), 0),
    guids: new Set(apps.map(app => app.guid)),
  });
  const state = app => String(app.stateGuid || "").toUpperCase();
  const groups = [
    summarize("new", "Необроблені", applications.filter(app => state(app) === NEW_APPLICATION_STATE)),
    summarize("processing", "В обробці", applications.filter(app => state(app) === PROCESSING_APPLICATION_STATE)),
    summarize("other", "Інші статуси", applications.filter(app => ![NEW_APPLICATION_STATE, PROCESSING_APPLICATION_STATE].includes(state(app)))),
  ];
  const orderMap = new Map();
  for (const app of applications) for (const order of app.orders || []) {
    if (!order.guid) continue;
    if (!orderMap.has(order.guid)) orderMap.set(order.guid, { ...order, dealer: app.dealer, applications: [] });
    const target = orderMap.get(order.guid);
    if (!target.applications.some(item => item.guid === app.guid)) target.applications.push({ guid: app.guid, number: app.number, date: app.date });
  }
  const linkedOrders = [...orderMap.values()];
  const formedOrders = linkedOrders.filter(order => order.posted);
  const statusMap = new Map();
  for (const order of formedOrders) {
    const guid = String(order.stateGuid || "").toUpperCase();
    if (!statusMap.has(guid)) statusMap.set(guid, { guid, name: order.state || "Не вказано", documents: 0, constructions: 0 });
    const status = statusMap.get(guid);
    status.documents += 1;
    status.constructions += Number(order.constructions || 0);
  }
  const formedOrderStatuses = [...statusMap.values()].sort((a,b) => b.documents-a.documents || a.name.localeCompare(b.name));
  return { applications, groups, total: summarize("all", "Усього подано", applications), formedOrders, formedOrderStatuses, linkedOrders };
}
