import { test } from "node:test";
import assert from "node:assert/strict";
import { filterSubproducts } from "./filterSubproducts.js";

const items = [
  { id: 1, name: "Lechuga", ingredientGroupId: 10 },
  { id: 2, name: "Cebolla morada", sku: "VER-02", ingredientGroupId: 10 },
  { id: 3, name: "Panceta", ingredientGroupId: 20 },
  { id: 4, name: "Orégano", ingredientGroupId: null },
  { id: 5, name: "Lechuga vieja", ingredientGroupId: 10, isDisabled: true },
];
test("a group lists all its available ingredients and combines with name or SKU search", () => {
  assert.deepEqual(filterSubproducts(items, "10").map(x => x.id), [1, 2]);
  assert.deepEqual(filterSubproducts(items, "10", "lechuga").map(x => x.id), [1]);
  assert.deepEqual(filterSubproducts(items, "20", "lechuga"), []);
  assert.deepEqual(filterSubproducts(items, "10", "morada VER-02").map(x => x.id), [2]);
});
test("ungrouped search ignores accents, spaces and case without modifying the inventory", () => {
  assert.deepEqual(filterSubproducts(items, "none", " OREGANO  ").map(x => x.id), [4]);
  assert.equal(filterSubproducts(items).length, 4);
  assert.equal(items.length, 5);
  assert.equal(items[0].ingredientGroupId, 10);
});
