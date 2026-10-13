export function calculationDay(calc) {
  return String(calc.dateRaw || calc.orders?.[0]?.dateRaw || "").slice(0, 10);
}
export function isRefusedCalculation(calc) {
  return String(calc.status || "").trim().toLocaleLowerCase("uk-UA") === "відмова";
}
export function inReportPeriod(calculations, from, to) {
  return calculations.filter((calc) => calculationDay(calc) >= from && calculationDay(calc) <= to);
}
export function belongsToDealerGroup(calc, group) {
  const type = String(calc.dealerType || "").trim().toLocaleLowerCase("uk-UA");
  if (group === "Філіали") return type === "філіали" || type === "филиалы";
  return type === group.toLocaleLowerCase("uk-UA");
}
