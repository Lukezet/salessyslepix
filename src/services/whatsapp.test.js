import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeWhatsAppNumber, propertyWhatsAppUrl, orderWhatsAppUrl, shouldUseWhatsAppWeb } from "./whatsapp.js";

test("WhatsApp accepts international formatting and rejects invalid destinations", () => {
  assert.equal(normalizeWhatsAppNumber("+54 9 (264) 123-4567"), "5492641234567");
  for (const value of ["", null, "02641234567", "abc5492641234567", "5492641234567?text=otro", "123", "1234567890123456"]) {
    assert.equal(normalizeWhatsAppNumber(value), null);
    assert.equal(propertyWhatsAppUrl(value, "Casa", "https://example.test/casa"), null);
  }
});

test("order notifications encode the customer and distinguish preparation from pickup", () => {
  const order = { id: 42, customerName: "Ana & José", customerPhone: "+54 9 (264) 123-4567", state: "Approved" };
  const taken = new URL(orderWhatsAppUrl(order, "taken", "Mi comercio & cocina", false));
  assert.equal(taken.pathname, "/5492641234567");
  assert.equal([...taken.searchParams].length, 1);
  assert.match(taken.searchParams.get("text"), /Ana & José[\s\S]*#42[\s\S]*en preparación/);
  assert.ok(taken.searchParams.get("text").includes("Somos Mi comercio & cocina."));
  assert.ok(taken.searchParams.get("text").includes("✅"));
  assert.match(new URL(orderWhatsAppUrl(order, "ready")).searchParams.get("text"), /listo.*retirar/);
  for (const state of ["Cancelled", "Delivered"]) assert.equal(orderWhatsAppUrl({ ...order, state }, "ready"), null);
  assert.equal(orderWhatsAppUrl({ ...order, customerPhone: "" }, "taken"), null);
  assert.equal(orderWhatsAppUrl({ ...order, customerPhone: "123" }, "taken"), null);
  assert.equal(orderWhatsAppUrl(order, "unknown"), null);
});

test("desktop messages bypass redirects and preserve the entire Unicode message", () => {
  const order = { id: 2, customerName: "Juan Díaz", customerPhone: "+54 9 264 1234567", state: "Approved" };
  for (const notification of ["taken", "ready"]) {
    const mobile = new URL(orderWhatsAppUrl(order, notification, "PuroHumo & Compañía", false));
    const desktop = new URL(orderWhatsAppUrl(order, notification, "PuroHumo & Compañía", true));
    assert.equal(desktop.origin, "https://web.whatsapp.com");
    assert.equal(desktop.pathname, "/send");
    assert.equal(desktop.searchParams.get("phone"), "5492641234567");
    assert.equal(desktop.searchParams.get("text"), mobile.searchParams.get("text"));
    assert.equal([...desktop.searchParams].length, 2);
    assert.ok(!desktop.searchParams.get("text").includes("\uFFFD"));
    assert.ok(desktop.searchParams.get("text").includes("👋"));
    assert.ok(desktop.searchParams.get("text").includes("🧾"));
    assert.ok(desktop.searchParams.get("text").includes("✅"));
  }
  assert.equal(new URL(orderWhatsAppUrl(order, "ready", "PuroHumo", true)).searchParams.get("text"),
    "¡Hola Juan Díaz! 👋\nSomos PuroHumo.\n\n🧾 Pedido #2\n🛍️ Tu pedido ya está listo y te espera para retirar. ✅\n¡Gracias por elegirnos! 🙌");
});

test("phones and tablets keep mobile links while computers use WhatsApp Web", () => {
  assert.equal(shouldUseWhatsAppWeb("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"), true);
  assert.equal(shouldUseWhatsAppWeb("Mozilla/5.0 (Macintosh; Intel Mac OS X)"), true);
  assert.equal(shouldUseWhatsAppWeb("Mozilla/5.0 (Linux; Android 14)"), false);
  assert.equal(shouldUseWhatsAppWeb("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)"), false);
  assert.equal(shouldUseWhatsAppWeb("Mozilla/5.0 (Macintosh; Intel Mac OS X)", 5), false);
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
