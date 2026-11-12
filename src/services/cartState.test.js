import { test } from "node:test";
import assert from "node:assert/strict";
import { createCartState } from "./cartState.js";

const storage = () => { const entries = new Map(); return { getItem: key => entries.get(key), setItem: (key, value) => entries.set(key, value) }; };
const cart = storage => { let state; state = createCartState(patch => { state = { ...state, ...patch }; }, () => state, storage); return () => state; };

test("same product ID in two shops stays isolated through navigation and reload", () => {
  const disk = storage(), current = cart(disk);
  current().setScope("lepix"); current().add({ id: 1, name: "Parlante", price: 100 }, 2);
  current().setScope("puro-humo"); assert.equal(current().totalItems(), 0);
  current().add({ id: 1, name: "Hamburguesa", price: 20 });
  current().setScope("LEPIX"); assert.equal(current().items[0].product.name, "Parlante"); assert.equal(current().totalAmount(), 200);
  current().clear(); current().setScope("puro-humo"); assert.equal(current().totalItems(), 1);
  const reloaded = cart(disk); reloaded().setScope("puro-humo"); assert.equal(reloaded().items[0].product.name, "Hamburguesa");
});

test("unscoped and legacy shared contents never enter a tenant cart", () => {
  const disk = storage(); disk.setItem("lepix-cart-v2", JSON.stringify({ state: { items: [{ product: { id: 42 }, quantity: 1 }] } }));
  const current = cart(disk); current().add({ id: 1 }); assert.equal(current().items.length, 0);
  current().setScope("puro-humo"); assert.equal(current().items.length, 0);
  current().add({ id: 2 }); current().setScope(null); assert.equal(current().items.length, 0);
});

test("a completed order from another shop does not clear the current shop", () => {
  const current = cart(storage());
  current().setScope("lepix"); current().add({ id: 1 });
  current().setScope("puro-humo"); current().add({ id: 2 });
  current().clear("lepix"); assert.equal(current().items[0].product.id, 2);
  current().setScope("lepix"); assert.equal(current().items.length, 0);
});
