import assert from "node:assert/strict";
import { calculationNumber, calculationDealerNumber } from "./calculationNumber.js";
const calc={number:"45-12345",oneCNumber:"000113708",dealerNumber:"8204"};
for(const role of ["admin","manager","region_manager","regionalManager"]) { assert.equal(calculationNumber(calc,role),"000113708"); assert.equal(calculationDealerNumber(calc,role),"8204"); }
assert.equal(calculationNumber(calc,"dealer"),"45-12345");
assert.equal(calculationDealerNumber(calc,"dealer"),"");
assert.equal(calculationDealerNumber({...calc,dealerNumber:"",webNumber:"45-12345"},"admin"),"");
assert.equal(calculationDealerNumber({...calc,isOrderOnly:true,oneCNumber:""},"admin"),"");
console.log("Role-specific calculation and dealer number checks passed");

assert.equal(calculationDealerNumber({...calc,isOrderOnly:true},"admin"),"8204");
