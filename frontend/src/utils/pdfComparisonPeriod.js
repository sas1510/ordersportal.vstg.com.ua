export const defaultPdfComparisonPeriod = (staff, now = new Date()) => {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Europe/Kyiv", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const fields = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const dateTo = `${fields.year}-${fields.month}-${fields.day}`;
  const start = new Date(`${dateTo}T00:00:00Z`);
  // Inclusive period: today is one of the 3 / 21 days.
  start.setUTCDate(start.getUTCDate() - ((staff ? 3 : 21) - 1));
  return { dateFrom: start.toISOString().slice(0, 10), dateTo };
};
