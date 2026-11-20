const periodKey = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const preview = sessionStorage.getItem("dealerPreviewToken") ? ":preview" : "";
    return `portal.orderReportPeriod:shared:${user.id || user.username || ""}${preview}`;
  } catch { return "portal.orderReportPeriod:shared"; }
};
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || "");

const kyivDay = (day = new Date()) => new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Kyiv",
}).format(day);

function refreshSavedPeriod(saved, storage) {
  const today = kyivDay();
  const yesterday = kyivDay(new Date(Date.now() - 86400000));
  const followsToday = saved.followsToday === true
    || (saved.savedOn === undefined && saved.mode === "period" && saved.dateTo === yesterday);
  if (saved.mode !== "period" || !followsToday || saved.dateTo >= today) return saved;
  const refreshed = { ...saved, dateTo: today, followsToday: true, savedOn: today };
  try { storage.setItem(periodKey(), JSON.stringify(refreshed)); } catch { /* Storage may be unavailable. */ }
  return refreshed;
}

export function readOrderReportPeriod(search = window.location.search, { persistent = false } = {}) {
  const query = new URLSearchParams(search);
  const dateFrom = query.get("date_from");
  const dateTo = query.get("date_to");
  if (validDate(dateFrom) && validDate(dateTo) && dateFrom <= dateTo) {
    return { mode: "period", year: dateFrom.slice(0, 4), month: 0, dateFrom, dateTo };
  }
  const year = query.get("year");
  if (/^\d{4}$/.test(year || "")) return orderMonthPeriod(year, 0);
  try {
    const key = periodKey();
    const useLocal = persistent && !sessionStorage.getItem("dealerPreviewToken");
    const localValue = useLocal ? localStorage.getItem(key) : null;
    const storage = localValue !== null ? localStorage : sessionStorage;
    const saved = JSON.parse(localValue ?? storage.getItem(key));
    if (saved && validDate(saved.dateFrom) && validDate(saved.dateTo) && saved.dateFrom <= saved.dateTo) {
      // Aggregate pages have no all-year month option; preserve the full range instead.
      return saved.mode === "year" && !saved.month ? { ...saved, mode: "period" } : refreshSavedPeriod(saved, storage);
    }
  } catch { /* Storage may be unavailable. */ }
  return null;
}

export function saveOrderReportPeriod(period, { persistent = false } = {}) {
  if (!validDate(period.dateFrom) || !validDate(period.dateTo) || period.dateFrom > period.dateTo) return;
  try {
    const key = periodKey();
    const value = JSON.stringify({ ...period, savedOn: kyivDay(), followsToday: period.mode === "period" && period.dateTo === kyivDay() });
    sessionStorage.setItem(key, value);
    if (persistent && !sessionStorage.getItem("dealerPreviewToken")) localStorage.setItem(key, value);
  } catch { /* Keep the current page usable. */ }
}

export function orderMonthPeriod(year, month) {
  const monthText = String(month).padStart(2, "0");
  const lastDay = month ? new Date(Number(year), month, 0).getDate() : 31;
  return { mode: "year", year: String(year), month,
    dateFrom: `${year}-${month ? monthText : "01"}-01`,
    dateTo: `${year}-${month ? monthText : "12"}-${lastDay}` };
}


export async function getWithOrderReportPeriod(client, endpoint, config, period) {
  if (!period) return client.get(endpoint, config);
  if (endpoint.includes("/complaints/")) {
    const params = { ...config.params, date_from: period.dateFrom, date_to: period.dateTo };
    delete params.year;
    delete params.month;
    return client.get(endpoint, { ...config, params });
  }
  const monthly = endpoint.endsWith("_all/");
  const startYear = Number(period.dateFrom.slice(0, 4));
  const endYear = Number(period.dateTo.slice(0, 4));
  const startMonth = Number(period.dateFrom.slice(5, 7));
  const endMonth = Number(period.dateTo.slice(5, 7));
  const { month: ignoredMonth, ...baseParams } = config.params || {};
  const requests = [];
  for (let year = startYear; year <= endYear; year++) {
    if (!monthly) requests.push({ ...baseParams, year });
    else {
      for (let month = year === startYear ? startMonth : 1; month <= (year === endYear ? endMonth : 12); month++) {
        requests.push({ ...baseParams, year, month });
      }
    }
  }
  const complaints = endpoint.includes("/complaints/");
  const rows = [];
  let response;
  for (let offset = 0; offset < requests.length; offset += 3) {
    const batch = await Promise.all(requests.slice(offset, offset + 3).map((params) => client.get(endpoint, { ...config, params })));
    for (const result of batch) {
      response = result;
      const items = complaints ? result.data?.data : result.data?.data?.calculation;
      if (!Array.isArray(items)) throw new Error("Неповна відповідь за вибраний період.");
      for (const item of items) {
        const day = String(item.dateRaw || item.ComplaintDate || item.DateInWork || "").slice(0, 10);
        if (day >= period.dateFrom && day <= period.dateTo) rows.push(item);
      }
    }
  }
  return { ...response, data: { ...response.data, data: complaints ? rows : { ...response.data.data, calculation: rows } } };
}
