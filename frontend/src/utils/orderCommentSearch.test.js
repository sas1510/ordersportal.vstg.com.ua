import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesCalculationComment } from "./orderCommentSearch.js";
test("searches every comment field, not only the first nonempty one", () => {
  assert.equal(matchesCalculationComment({ firstMessage: "Інший текст", sourceComment: "Алюмінієвий поріг", message: "Змінено комплектацію" }, "поріг"), true);
  assert.equal(matchesCalculationComment({ firstMessage: "Інший текст", sourceComment: "", message: "Поріг змінено" }, "ПОРІГ"), true);
  assert.equal(matchesCalculationComment({ orders: [{ message: "Додати доставку" }] }, "доставку"), true);
  assert.equal(matchesCalculationComment({}, "поріг"), false);
});
