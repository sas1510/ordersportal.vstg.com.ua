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
export const reportMetrics = ['recent', 'total', 'orderConstructions', 'applications', 'applicationConstructions', 'convertedApplications', 'linkedOrders', 'linkedConstructions', 'newOrders', 'newConstructions'];
export function summarizeReconciliation(rows) {
  const totals = Object.fromEntries([...reportMetrics, 'dealers', 'onPortal'].map(f => [f, 0]));
  for (const row of rows) {
    totals.dealers++;
    if (row.newAccount) totals.onPortal++;
    for (const f of reportMetrics) totals[f] += row[f] || 0;
  }
  totals.difference = totals.applicationConstructions - totals.linkedConstructions;
  totals.conversion = totals.applications ? Math.round(1000 * totals.convertedApplications / totals.applications) / 10 : 0;
  return totals;
}
export function filterReconciliation(rows, filters) {
  const search = filters.search.trim().toLocaleLowerCase('uk-UA');
  return rows.filter(r => (!filters.region || r.region === filters.region) && (!search || [r.name, r.guid, ...r.aliases].join(' ').toLocaleLowerCase('uk-UA').includes(search)));
}
