export function localDay(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function activityStart(day) {
  if (!day) return '';
  const [year, month, date] = day.split('-').map(Number);
  const target = new Date(year, month - 4, 1);
  target.setDate(Math.min(date, new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()));
  return localDay(target);
}
export const reportMetrics = ['recent', 'total', 'orderConstructions', 'applications', 'applicationConstructions', 'convertedApplications', 'applicationsWithOrders', 'linkedOrders', 'linkedConstructions', 'confirmedOrders', 'confirmedConstructions', 'confirmedLinkedOrders', 'confirmedLinkedConstructions', 'newOrders', 'newConstructions'];
export function statusBreakdown(documents) {
  const buckets = new Map();
  for (const doc of new Map(documents.map(d => [d.guid, d])).values()) {
    const row = buckets.get(doc.stateGuid) || { guid: doc.stateGuid, name: doc.state, documents: 0, constructions: 0 };
    row.documents++; row.constructions += doc.constructions;
    buckets.set(doc.stateGuid, row);
  }
  return [...buckets.values()].sort((a, b) => b.documents - a.documents || a.name.localeCompare(b.name, 'uk-UA'));
}
export function summarizeReconciliation(rows) {
  const totals = Object.fromEntries([...reportMetrics, 'dealers', 'onPortal'].map(f => [f, 0]));
  for (const row of rows) {
    totals.dealers++;
    if (row.newAccount) totals.onPortal++;
    for (const field of reportMetrics) totals[field] += row[field] || 0;
  }
  totals.difference = totals.applicationConstructions - totals.linkedConstructions;
  totals.conversion = totals.applications ? Math.round(1000 * totals.convertedApplications / totals.applications) / 10 : 0;
  totals.withoutOrders = totals.applications - totals.applicationsWithOrders;
  totals.applicationStatuses = statusBreakdown(rows.flatMap(row => row.applicationDetails || []));
  totals.orderStatuses = statusBreakdown(rows.flatMap(row => row.cohortOrders || []));
  totals.periodOrderStatuses = statusBreakdown(rows.flatMap(row => row.orders || []));
  return totals;
}
export function filterReconciliation(rows, filters) {
  const search = filters.search.trim().toLocaleLowerCase('uk-UA');
  return rows.filter(row => (!filters.group || row.dealerGroup === filters.group) && (!filters.contractor || row.guid === filters.contractor) && (!filters.region || row.region === filters.region) && (!search || [row.name, row.guid, ...row.aliases].join(' ').toLocaleLowerCase('uk-UA').includes(search)));
}
