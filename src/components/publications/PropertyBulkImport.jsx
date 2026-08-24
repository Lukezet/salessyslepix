import { useState } from "react";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { createPublication, uploadPropertyImage } from "../../services/publications";

const COLUMNS = [
  ["title", "Título", "Texto", "Sí", "Título comercial"], ["description", "Descripción", "Texto", "Sí", "Descripción del inmueble"],
  ["price", "Precio", "Número", "Sí", "Importe sin separador de miles"], ["currency", "Moneda", "USD | ARS", "Sí", "Moneda del importe"], ["operation", "Operación", "Venta | Alquiler", "Sí", "Tipo de operación"],
  ["property_type", "Tipo de inmueble", "Casa | Departamento | Terreno | Local comercial | Oficina | Galpón", "Sí", "Tipo de inmueble"],
  ["street", "Calle", "Texto", "Sí", "Calle o dirección interna"], ["street_number", "Altura", "Texto", "No", "Numeración de la calle"],
  ["locality", "Localidad", "Texto", "No", "Barrio o localidad"], ["province", "Provincia", "Texto", "No", "Provincia"],
  ["latitude", "Latitud", "Número decimal", "Sí", "Latitud exacta; no se publica"], ["longitude", "Longitud", "Número decimal", "Sí", "Longitud exacta; no se publica"],
  ["total_area_m2", "Superficie total (m²)", "Número", "No", "Metros cuadrados totales"], ["covered_area_m2", "Superficie cubierta (m²)", "Número", "No", "Metros cuadrados cubiertos"],
  ["rooms", "Ambientes", "Número entero", "No", "Cantidad de ambientes"], ["bedrooms", "Dormitorios", "Número entero", "No", "Cantidad de dormitorios"], ["bathrooms", "Baños", "Número entero", "No", "Cantidad de baños"], ["garages", "Cocheras", "Número entero", "No", "Cantidad de cocheras"],
  ["photos", "Fotos", "Texto", "No", "Nombres de archivo separados por |. Ej.: casa-01.jpg|casa-02.jpg"],
];
const COLUMN_BY_LABEL = Object.fromEntries(COLUMNS.map(([keyName, label]) => [label, keyName]));
const propertyTypes = { casa: 1, departamento: 2, terreno: 3, "local comercial": 4, oficina: 5, galpón: 6, galpon: 6 };
const clean = (value) => String(value ?? "").trim();
const key = (name) => clean(name).split(/[\\/]/).pop().toLowerCase();
const numeric = (value) => value === "" || value == null ? null : Number(value);

function parseOperation(value) { return clean(value).toLowerCase() === "alquiler" ? 2 : 1; }
function parseCurrency(value) { const currency = clean(value).toUpperCase(); return currency === "USD" ? 1 : currency === "ARS" ? 2 : null; }

function downloadTemplate() {
  const workbook = XLSX.utils.book_new();
  const sample = {
    title: "Departamento luminoso en Palermo", description: "Dos ambientes con balcón.", price: 125000, currency: "USD", operation: "Venta", property_type: "Departamento",
    street: "Av. Santa Fe", street_number: "1800", locality: "Palermo", province: "CABA", latitude: -34.587, longitude: -58.41,
    total_area_m2: 48, covered_area_m2: 42, rooms: 2, bedrooms: 1, bathrooms: 1, garages: 0, photos: "palermo-01.jpg|palermo-02.jpg|palermo-03.jpg",
  };
  const templateRows = [Object.fromEntries(COLUMNS.map(([keyName, label]) => [label, sample[keyName] ?? ""]))];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(templateRows, { header: COLUMNS.map(([, label]) => label) }), "Inmuebles");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Columna", "Tipo de dato", "Obligatoria", "Cómo completarla"], ...COLUMNS.map(([, label, type, required, help]) => [label, type, required, help])]), "Guía");
  XLSX.writeFile(workbook, "modelo-importacion-inmuebles.xlsx");
}

async function collectImages(files) {
  const images = new Map();
  for (const file of Array.from(files ?? [])) {
    if (file.name.toLowerCase().endsWith(".zip")) {
      const zip = await JSZip.loadAsync(file);
      for (const entry of Object.values(zip.files)) {
        if (entry.dir || !/\.(jpe?g|png|webp)$/i.test(entry.name)) continue;
        const blob = await entry.async("blob");
        const image = new File([blob], entry.name.split("/").pop(), { type: blob.type || "image/jpeg" });
        images.set(key(image.name), image);
      }
    } else if (file.type.startsWith("image/")) images.set(key(file.name), file);
  }
  return images;
}

function rowToPayload(row, imageFiles) {
  const photoNames = clean(row.photos).split("|").map(clean).filter(Boolean);
  const missing = photoNames.filter((name) => !imageFiles.has(key(name)));
  const latitude = numeric(row.latitude); const longitude = numeric(row.longitude);
  const propertyType = propertyTypes[clean(row.property_type).toLowerCase()];
  const currency = parseCurrency(row.currency);
  if (!clean(row.title) || !clean(row.description) || !Number.isFinite(Number(row.price)) || !propertyType || !clean(row.street) || !Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error("Faltan datos obligatorios o las coordenadas no son válidas.");
  if (!currency) throw new Error("La moneda debe ser USD o ARS.");
  if (missing.length) throw new Error(`No se encontraron: ${missing.join(", ")}`);
  return {
    payload: { type: 1, operation: parseOperation(row.operation), title: clean(row.title), description: clean(row.description), price: Number(row.price), currency,
      location: { street: clean(row.street), streetNumber: clean(row.street_number) || null, locality: clean(row.locality) || null, province: clean(row.province) || null, addressLatitude: latitude, addressLongitude: longitude, pinLatitude: latitude, pinLongitude: longitude },
      property: { propertyType, totalAreaM2: numeric(row.total_area_m2), coveredAreaM2: numeric(row.covered_area_m2), ageYears: numeric(row.age_years), rooms: numeric(row.rooms), bedrooms: numeric(row.bedrooms), bathrooms: numeric(row.bathrooms), garages: numeric(row.garages), orientation: clean(row.orientation) || null, petsAllowed: null, childrenAllowed: null, isCreditEligible: null, isGatedCommunity: null, rentalAdjustment: clean(row.rental_adjustment) || null } },
    images: photoNames.map((name) => imageFiles.get(key(name))),
  };
}

export default function PropertyBulkImport({ onDone }) {
  const [rows, setRows] = useState([]); const [imageFiles, setImageFiles] = useState(new Map()); const [message, setMessage] = useState(""); const [importing, setImporting] = useState(false);
  const selectWorkbook = async (file) => {
    setMessage(""); if (!file) return;
      try { const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" }); const sheet = workbook.Sheets[workbook.SheetNames[0]]; const parsed = XLSX.utils.sheet_to_json(sheet, { defval: "" }).map((row) => Object.fromEntries(Object.entries(row).map(([column, value]) => [COLUMN_BY_LABEL[column] ?? column, value]))); if (!parsed.length) throw new Error("La planilla no contiene inmuebles."); setRows(parsed); }
    catch (error) { setRows([]); setMessage(error.message || "No se pudo leer el Excel."); }
  };
  const selectImages = async (files) => { try { setImageFiles(await collectImages(files)); setMessage(""); } catch { setImageFiles(new Map()); setMessage("No se pudo leer el ZIP de fotos."); } };
  const submit = async () => {
    setImporting(true); setMessage(""); const failures = []; let completed = 0;
    for (const [index, row] of rows.entries()) {
      try { const { payload, images } = rowToPayload(row, imageFiles); payload.imageUrls = await Promise.all(images.map(uploadPropertyImage)); await createPublication(payload); completed += 1; }
      catch (error) { failures.push(`Fila ${index + 2}: ${error.message || "no se pudo importar"}`); }
    }
    setImporting(false); setMessage(failures.length ? `${completed} inmueble(s) importados. ${failures.join(" · ")}` : `${completed} inmueble(s) importados correctamente.`); if (!failures.length) onDone?.();
  };
  return <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-slate-900"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">Importación masiva desde Excel</h3><p className="mt-1 text-sm text-slate-600">Cargá el Excel y, si corresponde, las fotos sueltas o un ZIP. Los nombres deben coincidir con la columna <code>Fotos</code>; es opcional y está al final de la planilla.</p></div><button type="button" onClick={downloadTemplate} className="rounded-lg border border-sky-700 bg-white px-3 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-100">Descargar modelo Excel</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm font-medium">1. Planilla Excel<input accept=".xlsx,.xls" type="file" onChange={(event) => selectWorkbook(event.target.files?.[0])} className="rounded-lg border bg-white p-2" /></label><label className="grid gap-1 text-sm font-medium">2. Fotos o ZIP (opcional)<input accept="image/jpeg,image/png,image/webp,.zip" type="file" multiple onChange={(event) => selectImages(event.target.files)} className="rounded-lg border bg-white p-2" /></label></div><p className="mt-3 text-sm text-slate-700">{rows.length ? `${rows.length} fila(s) detectadas` : "Todavía no hay planilla cargada"} · {imageFiles.size} imagen(es) disponibles</p>{message && <p role="status" className="mt-3 rounded-lg bg-white p-3 text-sm">{message}</p>}<button type="button" disabled={!rows.length || importing} onClick={submit} className="mt-4 rounded-lg bg-sky-800 px-4 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{importing ? "Importando…" : `Importar ${rows.length || ""} inmueble(s)`}</button></section>;
}
