import { normalizeRole } from "./roles.js";

export function calculationNumber(calc, role) {
  const original = String(calc.number || "").trim();
  if (!new Set(["admin", "manager", "region_manager"]).has(normalizeRole(role)) || calc.isOrderOnly) return original;
  const oneC = String(calc.oneCNumber || "").trim();
  const dealer = String(calc.dealerNumber || calc.webNumber || original).trim();
  if (!oneC) return original;
  return dealer && dealer !== oneC ? oneC + " (" + dealer + ")" : oneC;
}
