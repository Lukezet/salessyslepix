import * as XLSX from "xlsx";
import JSZip from "jszip";

const text = (value) => String(value ?? "").trim();
const normalized = (value) => text(value).toLocaleLowerCase("es");
const fileKey = (value) => normalized(value).split(/[\\/]/).pop();
export const PRODUCT_COLUMNS = [
  ["Producto", "Código de agrupación dentro del Excel. Repetilo para las variantes del mismo producto."],
  ["Nombre", "Obligatorio. Repetir los mismos datos generales en todas las variantes."],
  ["Descripción", "Texto opcional."],
  ["Categoría", "Nombre o ID existente de la hoja Categorías."],
  ["Marca", "Nombre o ID existente de la hoja Marcas."],
  ["Precio", "Obligatorio. Número mayor o igual a cero, sin separador de miles."],
  ["Moneda", "Obligatoria: USD o ARS."],
  ["Color", "Nombre o ID de Colores. Opcional."],
  ["Tamaño", "Nombre o ID de Tamaños. Opcional."],
  ["SKU", "Opcional. El servidor genera o ajusta el SKU para que sea único."],
  ["Precio variante", "Opcional. Vacío usa el precio general; cero es un precio válido."],
  ["Fotos", "Opcional. Nombres de archivos separados por |; adjuntar las fotos o un ZIP."],
];

// This workbook is generated in the browser from the current tenant's lookups.
export function buildProductTemplate(lookups) {
  const workbook = XLSX.utils.book_new();
  const headers = PRODUCT_COLUMNS.map(([name]) => name);
  const example = ["producto-1", "Producto de ejemplo (reemplazar)", "Descripción del producto", lookups.categories[0]?.id ?? "", lookups.brands[0]?.id ?? "", 100, "USD", "", "", "", "", ""];
  const sheet = XLSX.utils.aoa_to_sheet([headers, example]);
  sheet["!cols"] = headers.map(() => ({ wch: 24 }));
  XLSX.utils.book_append_sheet(workbook, sheet, "Productos");
  const guide = XLSX.utils.aoa_to_sheet([
    ["Instrucción", "Detalle"],
    ["Uso", "Reemplazá el ejemplo. Una fila por variante. La primera variante es la principal."],
    ["Alta", "Crea productos nuevos; no actualiza productos existentes. No vuelvas a importar productos ya guardados."],
    ["Agrupación", "Producto es una referencia de esta planilla, no un ID de la tienda. Usá referencias distintas para productos distintos."],
    ["Catálogos", "Creá primero las categorías y marcas necesarias y descargá nuevamente el modelo."],
    ...PRODUCT_COLUMNS,
  ]);
  guide["!cols"] = [{ wch: 24 }, { wch: 115 }];
  XLSX.utils.book_append_sheet(workbook, guide, "Guía");
  for (const [key, name] of [["categories", "Categorías"], ["brands", "Marcas"], ["colors", "Colores"], ["sizes", "Tamaños"]]) {
    const lookupSheet = XLSX.utils.aoa_to_sheet([["ID", "Nombre"], ...lookups[key].map((item) => [item.id, item.name])]);
    lookupSheet["!cols"] = [{ wch: 12 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, lookupSheet, name);
  }
  return workbook;
}

export function readProductWorkbook(data) {
  const workbook = XLSX.read(data, { type: "array" });
  const sheet = workbook.Sheets.Productos;
  if (!sheet) throw new Error("Usá el modelo de Tienda: falta la hoja Productos.");
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const headers = matrix[0]?.map(text) ?? [];
  if (PRODUCT_COLUMNS.some(([name]) => !headers.includes(name))) throw new Error("La planilla no corresponde al modelo de Tienda o le faltan columnas.");
  if (new Set(headers).size !== headers.length) throw new Error("La planilla tiene columnas repetidas.");
  const rows = matrix.slice(1).map((values, index) => ({ rowNumber: index + 2, ...Object.fromEntries(headers.map((header, column) => [header, values[column] ?? ""])) }))
    .filter((row) => headers.some((header) => text(row[header])));
  if (!rows.length) throw new Error("La planilla no contiene productos.");
  if (rows.length > 1000) throw new Error("Importá hasta 1000 filas por planilla.");
  return rows;
}

function number(value, label, optional = false) {
  if (!text(value) && optional) return null;
  const parsed = typeof value === "number" ? value : Number(text(value).replace(",", "."));
  if (!text(value) || !Number.isFinite(parsed) || parsed < 0) throw new Error(`${label}: ingresá un número mayor o igual a cero, sin separador de miles.`);
  return parsed;
}

function lookup(value, entries, label, optional = false) {
  if (!text(value) && optional) return null;
  const matches = entries.filter((item) => String(item.id) === text(value) || normalized(item.name) === normalized(value));
  if (!text(value) || matches.length !== 1) throw new Error(`${label}: elegí un nombre o ID válido de la hoja de referencia; usá el ID si hay nombres repetidos.`);
  return matches[0].id;
}

export function prepareProductImport(rows, lookups, images = new Map()) {
  const groups = new Map();
  const errors = [];
  for (const row of rows) {
    try {
      const groupId = text(row.Producto);
      if (!groupId || !text(row.Nombre)) throw new Error("Producto y Nombre son obligatorios.");
      const currency = { USD: 1, ARS: 2 }[text(row.Moneda).toUpperCase()];
      if (!currency) throw new Error("Moneda: usá USD o ARS.");
      const payload = { name: text(row.Nombre), description: text(row.Descripción), categoryId: lookup(row.Categoría, lookups.categories, "Categoría"), brandId: lookup(row.Marca, lookups.brands, "Marca"), price: number(row.Precio, "Precio"), currency };
      const photoNames = text(row.Fotos).split("|").map(text).filter(Boolean);
      const missing = photoNames.filter((name) => !images.has(fileKey(name)));
      if (missing.length) throw new Error(`Faltan fotos: ${missing.join(", ")}.`);
      const variant = { colorId: lookup(row.Color, lookups.colors, "Color", true), sizeId: lookup(row.Tamaño, lookups.sizes, "Tamaño", true), sku: text(row.SKU), priceOverride: number(row["Precio variante"], "Precio variante", true), files: photoNames.map((name) => images.get(fileKey(name))) };
      let group = groups.get(groupId);
      if (!group) {
        group = { key: groupId, rows: [], payload: { ...payload, variants: [] } };
        groups.set(groupId, group);
      }
      if (Object.keys(payload).some((key) => payload[key] !== group.payload[key])) throw new Error(`Los datos generales de ${groupId} no coinciden con sus otras filas.`);
      if (group.payload.variants.some((v) => v.colorId === variant.colorId && v.sizeId === variant.sizeId)) throw new Error(`Color y tamaño repetidos en ${groupId}.`);
      variant.isDefault = group.payload.variants.length === 0;
      group.payload.variants.push(variant);
      group.rows.push(row.rowNumber);
    } catch (error) { errors.push(`Fila ${row.rowNumber}: ${error.message}`); }
  }
  return { products: [...groups.values()], errors };
}

export async function collectProductImages(files) {
  const images = new Map();
  const add = (file) => {
    const key = fileKey(file.name);
    if (images.has(key)) throw new Error(`Foto repetida: ${file.name}. Usá nombres únicos.`);
    images.set(key, file);
  };
  for (const file of Array.from(files ?? [])) {
    if (/\.zip$/i.test(file.name)) {
      const zip = await JSZip.loadAsync(file);
      for (const entry of Object.values(zip.files)) {
        if (entry.dir || !/\.(jpe?g|png|webp)$/i.test(entry.name)) continue;
        const extension = entry.name.split(".").pop().toLowerCase();
        add(new File([await entry.async("uint8array")], fileKey(entry.name), { type: extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg" }));
      }
    } else if (/\.(jpe?g|png|webp)$/i.test(file.name)) add(file);
    else throw new Error(`Formato de imagen no admitido: ${file.name}.`);
  }
  return images;
}

// Dependency injection keeps network calls in catalog.js and allows failure tests.
export async function executeProductImport(products, { createProduct, uploadProductImage }) {
  const succeeded = [];
  const failed = [];
  for (const product of products) {
    try {
      const variants = [];
      for (const { files, ...variant } of product.payload.variants) {
        const images = [];
        for (const file of files) {
          const { url } = await uploadProductImage(file);
          if (!url) throw new Error("La carga de la imagen no devolvió una URL.");
          images.push({ url, sort: images.length });
        }
        variants.push({ ...variant, images });
      }
      await createProduct({ ...product.payload, variants });
      succeeded.push(product.key);
    } catch (error) {
      failed.push({ key: product.key, message: `Filas ${product.rows.join(", ")}: ${error.response?.data?.error || error.message || "No se pudo importar."}` });
    }
  }
  return { succeeded, failed };
}
