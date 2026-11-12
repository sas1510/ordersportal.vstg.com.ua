import { normalizeRole } from "./roles.js";
const staffRoles = new Set(["admin", "manager", "region_manager"]);
export function calculationNumber(calc, role) {
  const original = String(calc.number || "").trim();
  if (!staffRoles.has(normalizeRole(role)) || calc.isOrderOnly) return original;
  return String(calc.oneCNumber || original).trim();
}
export function calculationDealerNumber(calc, role) {
  if (!staffRoles.has(normalizeRole(role)) || calc.isOrderOnly) return "";
  const dealer = String(calc.dealerNumber || "").trim();
  return dealer && dealer !== calculationNumber(calc, role) ? dealer : "";
}
