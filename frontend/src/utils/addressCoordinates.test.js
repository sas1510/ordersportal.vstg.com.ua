import { test } from "node:test";
import assert from "node:assert/strict";
import { extractAddressCoordinates } from "./addressCoordinates.js";
test("dot and legacy comma decimal pairs produce identical JSON numbers", () => {
 for (const Coordinates of ["49,8380758,23,8830784", "49.8380758,23.8830784"]) {
  const result = extractAddressCoordinates({ Coordinates });
  assert.deepEqual(result, {lat:49.8380758,lng:23.8830784});
  assert.equal([result.lat,result.lng].join(","), "49.8380758,23.8830784");
 }
});
test("separate comma values normalize; invalid and out-of-range pairs are rejected", () => {
 assert.deepEqual(extractAddressCoordinates({Latitude:"49,8380758",Longitude:"23,8830784"}),{lat:49.8380758,lng:23.8830784});
 for(const Coordinates of ["bad", "49.1,NaN", "149.1,23.2", "49,23,5"]) assert.equal(extractAddressCoordinates({Coordinates}),null);
});
