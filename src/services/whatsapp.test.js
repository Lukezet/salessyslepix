import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeWhatsAppNumber, propertyWhatsAppUrl, orderWhatsAppUrl } from "./whatsapp.js";

test("WhatsApp accepts international formatting and rejects invalid destinations", () => {
  assert.equal(normalizeWhatsAppNumber("+54 9 (264) 123-4567"), "5492641234567");
  for (const value of ["", null, "02641234567", "abc5492641234567", "5492641234567?text=otro", "123", "1234567890123456"]) {
    assert.equal(normalizeWhatsAppNumber(value), null);
    assert.equal(propertyWhatsAppUrl(value, "Casa", "https://example.test/casa"), null);
  }
});

test("order notifications encode the customer and distinguish preparation from pickup", () => {
  const order = { id: 42, customerName: "Ana & José", customerPhone: "+54 9 (264) 123-4567", state: "Approved" };
  const taken = new URL(orderWhatsAppUrl(order, "taken"));
  assert.equal(taken.pathname, "/5492641234567");
  assert.equal([...taken.searchParams].length, 1);
  assert.match(taken.searchParams.get("text"), /Ana & José.*#42.*en preparación/);
  assert.match(new URL(orderWhatsAppUrl(order, "ready")).searchParams.get("text"), /listo.*retirar/);
  for (const state of ["Cancelled", "Delivered"]) assert.equal(orderWhatsAppUrl({ ...order, state }, "ready"), null);
  assert.equal(orderWhatsAppUrl({ ...order, customerPhone: "" }, "taken"), null);
  assert.equal(orderWhatsAppUrl({ ...order, customerPhone: "123" }, "taken"), null);
  assert.equal(orderWhatsAppUrl(order, "unknown"), null);
});

test("property message preserves title and canonical link as a single encoded parameter", () => {
  const title = 'Casa & jardín #1';
  const link = 'https://example.test/crear/product/casa?publication=1';
  const url = new URL(propertyWhatsAppUrl('+54 9 264 1234567', title, link));
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.pathname, '/5492641234567');
  assert.equal([...url.searchParams].length, 1);
  assert.ok(url.searchParams.get('text').includes(title));
  assert.ok(url.searchParams.get('text').endsWith(link));
});
