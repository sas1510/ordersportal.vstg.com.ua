import { test } from "node:test";
import assert from "node:assert/strict";
import { findOrderZkz } from "./findOrderZkz.js";
test("ZKZ matches only the exact order number, hyphen optional", () => {
  const files = [{ fileName: "01363339.zkz" }, { fileName: "01-363339.pdf" }, { fileName: "01-3633390.zkz" }, { fileName: "45-179235.zkz" }];
  assert.equal(findOrderZkz(files, "01-363339 ").fileName, "01363339.zkz");
  assert.equal(findOrderZkz(files, "01-1"), null);
});
