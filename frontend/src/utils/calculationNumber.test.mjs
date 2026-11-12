import assert from "node:assert/strict";
import { calculationNumber } from "./calculationNumber.js";
const calc = { number: "D12", oneCNumber: "C34", dealerNumber: "D12" };
for (const role of ["admin", "manager", "region_manager", "regionalManager"]) assert.equal(calculationNumber(calc, role), "C34 (D12)");
for (const role of ["dealer", "internal_dealer", "branch_manager"]) assert.equal(calculationNumber(calc, role), "D12");
assert.equal(calculationNumber({...calc, oneCNumber: ""}, "admin"), "D12");
assert.equal(calculationNumber({...calc, dealerNumber: "C34"}, "admin"), "C34");
assert.equal(calculationNumber({...calc, isOrderOnly: true}, "admin"), "D12");
console.log("Calculation number role and fallback checks passed");
