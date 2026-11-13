import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, unlink, rmdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";

test("sales, products and price panels open below the navbar, resize and close without crashing", async () => {
  const directory = await mkdtemp(fileURLToPath(new URL("../../../node_modules/.sales-render-", import.meta.url)));
  const bundlePath = `${directory}/OrderDashboard.mjs`;
  const adminPath = `${directory}/AdminPage.mjs`;
  const browser = new JSDOM('<!doctype html><html><body><header data-app-navbar></header><main id="root"></main></body></html>', { url: "http://localhost/tienda/admin" });
  let navbarBottom = 81.5;
  let onNavbarResize;
  browser.window.document.querySelector("header").getBoundingClientRect = () => ({ bottom: navbarBottom });
  browser.window.ResizeObserver = class {
    constructor(callback) { onNavbarResize = callback; }
    observe() {}
    disconnect() {}
  };
  const previous = new Map();
  let root;
  try {
    const result = await build({
      entryPoints: [fileURLToPath(new URL("./OrderDashboard.jsx", import.meta.url)), fileURLToPath(new URL("./AdminPage.jsx", import.meta.url))],
      outdir: directory, outExtension: { ".js": ".mjs" },
      bundle: true, format: "esm", platform: "node", packages: "external", write: false, jsx: "automatic",
      plugins: [{ name: "sales-fixture", setup(builder) {
        builder.onResolve({ filter: /services\/catalog$/ }, () => ({ path: "catalog", namespace: "fixture" }));
        builder.onResolve({ filter: /store\/tenantConfig$/ }, () => ({ path: "tenant", namespace: "fixture" }));
        builder.onResolve({ filter: /store\/auth$/ }, () => ({ path: "auth", namespace: "fixture" }));
        builder.onResolve({ filter: /components\/Admin\/(ProductForm|ProductBulkImport|PriceIncreasePanel)$/ }, () => ({ path: "child", namespace: "fixture" }));
        builder.onResolve({ filter: /^\.\/(ClientsPage|ClientCreatePage|CoordinatorSchedulePage|InventoryPage|ModulesPage)$/ }, () => ({ path: "child", namespace: "fixture" }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "tenant"
          ? 'export const useTenantConfig = selector => selector({ config: { name: "PuroHumo" }, isLoaded: true, features: { store: true } });'
          : args.path === "auth" ? 'export const useAuth = selector => selector({ roles: ["Admin"] });'
          : args.path === "child" ? 'export default function FixtureForm() { return null; }'
          : `export const getOrders = async () => ({ items: [{ id: 2, state: "Approved", customerName: "Juan Díaz", customerPhone: "5492641234567", createdAt: "2026-11-13T12:00:00Z", total: 5000, details: [{ id: 1, productVariantId: 1, productName: "Hamburguesa", quantity: 1, unitPrice: 5000, totalPrice: 5000 }] }], page: 1, totalPages: 1, totalCount: 1 });
            export const getOrdersSummary = async () => [];
            export const deleteOrder = async () => {};
            export const updateOrderState = async () => {};
            export const updateOrder = async () => true;
            export const searchProducts2 = async () => [];
            export const getProductsPaginated = async () => ({ items: [{ id: 1, name: "Hamburguesa", price: 5000, variants: [] }], totalPages: 1, totalCount: 1 });
            export const deleteProduct = async () => {};
            export const setProductVariantDisabled = async () => {};`, loader: "js" }));
      } }],
    });
    for (const output of result.outputFiles) await writeFile(output.path, output.contents);
    for (const [key, value] of Object.entries({ window: browser.window, document: browser.window.document, navigator: browser.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) {
      previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
      Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
    }
    const { default: Dashboard } = await import(pathToFileURL(bundlePath).href);
    root = createRoot(document.getElementById("root"));
    await act(async () => { root.render(React.createElement(Dashboard)); });
    const click = async (label, within = document) => {
      const button = [...within.querySelectorAll("button")].find(item => item.textContent.trim() === label);
      assert.ok(button, `Missing button: ${label}`);
      await act(async () => { button.click(); });
    };
    await click("Ver");
    let detail = document.querySelector('[aria-label="Detalle del pedido 2"]');
    assert.ok(detail);
    assert.equal(detail.parentElement, document.body);
    assert.equal(detail.style.top, "81.5px");
    navbarBottom = 150;
    await act(async () => { onNavbarResize(); });
    assert.equal(detail.style.top, "150px");
    navbarBottom = 64;
    await act(async () => { window.dispatchEvent(new window.Event("resize")); });
    assert.equal(detail.style.top, "64px");
    navbarBottom = 56;
    await act(async () => { window.dispatchEvent(new window.Event("scroll")); });
    assert.equal(detail.style.top, "56px");
    assert.ok(detail.textContent.includes("Juan Díaz"));
    await click("Editar", detail);
    assert.ok([...detail.querySelectorAll("input")].some(input => input.value === "Juan Díaz"));
    await click("Cancelar", detail);
    await click("Eliminar orden", detail);
    const confirmation = document.querySelector('[aria-label="Confirmar eliminación del pedido"]');
    assert.ok(confirmation);
    assert.equal(confirmation.parentElement, document.body);
    await click("Cancelar", confirmation);
    await click("Cerrar", detail);
    assert.equal(document.querySelector('[role="dialog"]'), null);
    await click("Eliminar");
    assert.ok(document.querySelector('[aria-label="Confirmar eliminación del pedido"]'));
    await click("Cancelar", document.querySelector('[role="dialog"]'));
    await click("Ver");
    detail = document.querySelector('[aria-label="Detalle del pedido 2"]');
    assert.ok(detail);
    await act(async () => { document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape" })); });
    assert.equal(document.querySelector('[role="dialog"]'), null);
    const { default: AdminPage } = await import(pathToFileURL(adminPath).href);
    await act(async () => { root.render(React.createElement(MemoryRouter, { initialEntries: ["/tienda/admin?section=products"] }, React.createElement(AdminPage))); });
    for (const [button, label, close] of [["+ Nuevo", "Nuevo producto", "Cerrar"], ["Editar", "Editar producto", "Cerrar"], ["Aumentos", "Aumentos de precio", "X"]]) {
      await click(button);
      const panel = document.querySelector(`[aria-label="${label}"]`);
      assert.ok(panel);
      assert.equal(panel.parentElement, document.body);
      assert.equal(panel.style.top, "56px");
      await click(close, panel);
      assert.equal(document.querySelector('[role="dialog"]'), null);
    }
  } finally {
    if (root) await act(async () => { root.unmount(); });
    browser.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
    await unlink(bundlePath).catch(() => {});
    await unlink(adminPath).catch(() => {});
    await rmdir(directory);
  }
});
