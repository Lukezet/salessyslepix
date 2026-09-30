import { test } from "node:test";
import assert from "node:assert/strict";
import { File } from "node:buffer";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { buildProductTemplate, readProductWorkbook, prepareProductImport, collectProductImages, executeProductImport } from "./productImport.js";

const lookups = { categories: [{ id: 7, name: "Remeras" }], brands: [{ id: 3, name: "Lepix" }], colors: [{ id: 2, name: "Negro" }, { id: 4, name: "Blanco" }], sizes: [{ id: 5, name: "M" }] };
const row = (extra = {}) => ({ rowNumber: 2, Producto: "remera-1", Nombre: "Remera", Descripción: "Algodón", Categoría: "Remeras", Marca: "Lepix", Precio: 100, Moneda: "USD", Color: "Negro", Tamaño: "M", ...extra });
const bytes = (workbook) => XLSX.write(workbook, { type: "array", bookType: "xlsx" });

test("downloaded template round trips through Excel parser and produces a valid product", () => {
  const workbook = buildProductTemplate(lookups);
  assert.deepEqual(workbook.SheetNames, ["Productos", "Guía", "Categorías", "Marcas", "Colores", "Tamaños"]);
  const rows = readProductWorkbook(bytes(workbook));
  const result = prepareProductImport(rows, lookups);
  assert.deepEqual(result.errors, []);
  assert.equal(result.products[0].payload.categoryId, 7);
  assert.equal(result.products[0].payload.brandId, 3);
});

test("rejects real estate workbook, incomplete headers and empty product sheet", () => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Título"], ["Casa"]]), "Inmuebles");
  assert.throws(() => readProductWorkbook(bytes(workbook)), /hoja Productos/);
  workbook.Sheets.Productos = workbook.Sheets.Inmuebles;
  workbook.SheetNames.push("Productos");
  assert.throws(() => readProductWorkbook(bytes(workbook)), /faltan columnas/);
  const empty = buildProductTemplate(lookups);
  empty.Sheets.Productos["!ref"] = "A1:L1";
  assert.throws(() => readProductWorkbook(bytes(empty)), /no contiene productos/);
});

test("variants group under one product; currency and zero override are preserved", () => {
  const result = prepareProductImport([row(), row({ rowNumber: 3, Color: 4, Moneda: "usd", "Precio variante": 0 })], lookups);
  assert.deepEqual(result.errors, []);
  assert.equal(result.products.length, 1);
  assert.equal(result.products[0].payload.currency, 1);
  assert.deepEqual(result.products[0].payload.variants.map((v) => [v.isDefault, v.priceOverride]), [[true, null], [false, 0]]);
  const ars = prepareProductImport([row({ Moneda: "ARS", Precio: "12,50" })], lookups);
  assert.equal(ars.products[0].payload.currency, 2);
  assert.equal(ars.products[0].payload.price, 12.5);
});

test("invalid prices, currencies, lookups and missing identity fail with source row", () => {
  for (const extra of [{ Precio: "" }, { Precio: -1 }, { Precio: "abc" }, { Precio: Infinity }, { Moneda: "EUR" }, { Categoría: 999 }, { Marca: "Otra empresa" }, { Color: "Rojo" }, { Tamaño: 500 }, { Nombre: "" }, { Producto: "" }, { "Precio variante": -1 }]) {
    const result = prepareProductImport([row(extra)], lookups);
    assert.equal(result.errors.length, 1, JSON.stringify(extra));
    assert.match(result.errors[0], /Fila 2:/);
  }
});

test("conflicting product details and repeated variants are rejected", () => {
  for (const extra of [{}, { Color: "Blanco", Precio: 101 }, { Color: "Blanco", Marca: 3, Nombre: "Otra" }]) {
    assert.equal(prepareProductImport([row(), row({ rowNumber: 4, ...extra })], lookups).errors.length, 1);
  }
  const ambiguous = { ...lookups, brands: [...lookups.brands, { id: 8, name: "Lepix" }] };
  assert.equal(prepareProductImport([row()], ambiguous).errors.length, 1);
  assert.equal(prepareProductImport([row({ Marca: 3 })], ambiguous).errors.length, 0);
});

test("blank spreadsheet rows preserve original Excel row numbers", () => {
  const workbook = buildProductTemplate(lookups);
  XLSX.utils.sheet_add_aoa(workbook.Sheets.Productos, [["p2", "Segundo", "", 7, 3, 20, "ARS"]], { origin: "A5" });
  assert.deepEqual(readProductWorkbook(bytes(workbook)).map((r) => r.rowNumber), [2, 5]);
});

test("photos resolve by filename and missing images block validation", async () => {
  const photo = new File(["image"], "foto.PNG", { type: "image/png" });
  const images = await collectProductImages([photo]);
  const valid = prepareProductImport([row({ Fotos: "foto.png" })], lookups, images);
  assert.deepEqual(valid.errors, []);
  assert.equal(valid.products[0].payload.variants[0].files[0], photo);
  assert.match(prepareProductImport([row({ Fotos: "missing.jpg" })], lookups, images).errors[0], /Faltan fotos/);
  await assert.rejects(collectProductImages([photo, photo]), /Foto repetida/);
});

test("ZIP photos retain PNG and WebP MIME types", async () => {
  const zip = new JSZip();
  zip.file("folder/a.png", "png"); zip.file("folder/b.webp", "webp"); zip.file("ignored.txt", "text");
  // JSZip accepts bytes; emulate the browser File shape without FileReader in Node.
  const archive = await zip.generateAsync({ type: "uint8array" });
  archive.name = "fotos.zip";
  const images = await collectProductImages([archive]);
  assert.equal(images.size, 2);
  assert.equal(images.get("a.png").type, "image/png");
  assert.equal(images.get("b.webp").type, "image/webp");
});

test("partial API failure reports only pending products, and uploads variant images in order", async () => {
  const photo = new File(["image"], "a.jpg");
  const rows = [row({ Fotos: "a.jpg" }), row({ rowNumber: 3, Producto: "p2" }), row({ rowNumber: 4, Producto: "p3" })];
  const { products, errors } = prepareProductImport(rows, lookups, new Map([["a.jpg", photo]]));
  assert.deepEqual(errors, []);
  const sent = [];
  const result = await executeProductImport(products, {
    uploadProductImage: async (file) => { assert.equal(file, photo); return { url: "/uploads/a.jpg" }; },
    createProduct: async (payload) => { sent.push(payload); if (sent.length === 2) throw { response: { data: { error: "Categoría no disponible" } } }; },
  });
  assert.deepEqual(result.succeeded, ["remera-1", "p3"]);
  assert.equal(result.failed[0].key, "p2");
  assert.match(result.failed[0].message, /Filas 3: Categoría no disponible/);
  assert.deepEqual(sent[0].variants[0].images, [{ url: "/uploads/a.jpg", sort: 0 }]);
  assert.equal("files" in sent[0].variants[0], false);
  const pending = rows.filter((r) => !result.succeeded.includes(r.Producto));
  assert.deepEqual(prepareProductImport(pending, lookups).products.map((p) => p.key), ["p2"]);
});

test("upload failure prevents product creation", async () => {
  const { products } = prepareProductImport([row({ Fotos: "a.jpg" })], lookups, new Map([["a.jpg", {}]]));
  let calls = 0;
  const result = await executeProductImport(products, { uploadProductImage: async () => { throw new Error("Upload falló"); }, createProduct: async () => { calls += 1; } });
  assert.equal(calls, 0);
  assert.equal(result.failed.length, 1);
});
