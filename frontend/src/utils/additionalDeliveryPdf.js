import axios from "../api/axios";
import { getWithOrderReportPeriod } from "./orderReportPeriod";
import { getDeliveryRows } from "./deliveryRows";
import { serviceDeliveryCalculations } from "./serviceDeliveryCalculations";

export async function loadAdditionalDeliveryRows({ aggregate = false, contractor, dealerGroup, dateFrom, dateTo, year, month = 0, search = "", status = "" }, date) {
  if (!dateFrom || !dateTo) { dateFrom = `${year}-01-01`; dateTo = `${year}-12-31`; }
  const config = { params: { ...(contractor ? { contractor } : {}), ...(dealerGroup ? { dealer_group: dealerGroup } : {}) } };
  const [additional, complaints] = await Promise.all([
    getWithOrderReportPeriod(axios, `/additional_orders/get_additional_orders_info${aggregate ? "_all" : ""}/`, config, { dateFrom, dateTo }),
    getWithOrderReportPeriod(axios, `/complaints/get_reclamation_info${aggregate ? "_all" : ""}/`, config, { dateFrom, dateTo }),
  ]);
  if ([additional, complaints].some(response => response.data?.status !== "success")) throw new Error("Incomplete delivery data");
  const source = serviceDeliveryCalculations(additional.data.data.calculation, complaints.data.data);
  const query = search.trim().toLocaleLowerCase("uk-UA");
  const calculations = source.filter(calc => !month || new Date(calc.dateRaw).getMonth() + 1 === Number(month)).map(calc => ({ ...calc,
    orders: (calc.orders || []).filter(order => String(order.number || "").startsWith("70-") &&
      (!status || ["Всі", "all"].includes(status) || order.status === status) &&
      (!query || [order.number, calc.number, calc.mainOrderNumber, calc.dealer].some(value => String(value || "").toLocaleLowerCase("uk-UA").includes(query)))) }));
  return getDeliveryRows(calculations, Date.now(), "all").filter(row => !date || row.day === date);
}
