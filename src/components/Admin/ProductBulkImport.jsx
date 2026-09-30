import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { createProduct, getCategories, listBrands, listColors, listSizes, uploadProductImage } from "../../services/catalog";
import { buildProductTemplate, collectProductImages, executeProductImport, prepareProductImport, readProductWorkbook } from "../../services/productImport";

export default function ProductBulkImport({ onImported }) {
  const [lookups, setLookups] = useState(null);
  const [rows, setRows] = useState([]);
  const [images, setImages] = useState(new Map());
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [message, setMessage] = useState("");
  const [failures, setFailures] = useState([]);
  useEffect(() => {
    let active = true;
    Promise.all([getCategories(), listBrands(), listColors(), listSizes()])
      .then(([categories, brands, colors, sizes]) => {
        if (active) setLookups({ categories, brands, colors, sizes });
      }).catch(() => { if (active) setMessage("No se pudieron cargar los catálogos. Recargá la página para intentar nuevamente."); });
    return () => { active = false; };
  }, []);
  const preview = useMemo(() => lookups ? prepareProductImport(rows, lookups, images) : { products: [], errors: [] }, [rows, lookups, images]);
  const select = async (fileList, photos) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true); setMessage(""); setFailures([]);
    try {
      if (photos) setImages(await collectProductImages(fileList));
      else setRows(fileList?.[0] ? readProductWorkbook(await fileList[0].arrayBuffer()) : []);
    } catch (error) {
      if (photos) setImages(new Map()); else setRows([]);
      setMessage(error.message);
    } finally { lock.current = false; setBusy(false); }
  };
  const submit = async () => {
    if (lock.current || preview.errors.length || !preview.products.length) return;
    lock.current = true;
    setBusy(true); setMessage(""); setFailures([]);
    try {
      const result = await executeProductImport(preview.products, { createProduct, uploadProductImage });
      // Successful products leave the queue, so retry never resends confirmed saves.
      const completed = new Set(result.succeeded);
      setRows((current) => current.filter((row) => !completed.has(String(row.Producto).trim())));
      setFailures(result.failed.map((failure) => failure.message));
      setMessage(`${result.succeeded.length} producto(s) importado(s). ${result.failed.length} pendiente(s).`);
      if (result.succeeded.length) await onImported?.();
    } finally { lock.current = false; setBusy(false); }
  };
  return <section className="admin-glass rounded-2xl p-5 space-y-4" aria-label="Importación de productos desde Excel">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-xl font-bold">Importar productos desde Excel</h2>
        <p className="mt-2 text-sm text-slate-300">Una fila por variante. Repetí el código Producto para agrupar variantes; la primera será la principal. Esta importación crea productos nuevos.</p></div>
      <button type="button" className="admin-secondary px-4 py-2" disabled={!lookups || busy} onClick={() => XLSX.writeFile(buildProductTemplate(lookups), "modelo-importacion-tienda.xlsx")}>Descargar modelo de Tienda</button>
    </div>
    {!lookups && !message && <p role="status">Cargando categorías, marcas, colores y tamaños…</p>}
    {lookups && (!lookups.categories.length || !lookups.brands.length) && <p role="alert">Creá al menos una categoría y una marca antes de importar y recargá esta página.</p>}
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2 text-sm">Planilla de Tienda (.xlsx o .xls)<input type="file" accept=".xlsx,.xls" disabled={busy || !lookups} onChange={(event) => select(event.target.files, false)} /></label>
      <label className="grid gap-2 text-sm">Fotos o ZIP (opcional)<input type="file" multiple accept="image/jpeg,image/png,image/webp,.zip" disabled={busy || !lookups} onChange={(event) => select(event.target.files, true)} /></label>
    </div>
    <p className="text-sm text-slate-300">Usá los nombres o IDs de las hojas de referencia del modelo. En Fotos, separá los nombres de archivo con |.</p>
    <p className="text-sm">{rows.length} fila(s) · {preview.products.length} producto(s) · {images.size} foto(s)</p>
    {preview.errors.length > 0 && <div role="alert"><p>Corregí la planilla o adjuntá las fotos antes de importar:</p><ul className="list-disc pl-5 max-h-48 overflow-auto">{preview.errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
    {message && <p role="status">{message}</p>}
    {failures.length > 0 && <div role="alert"><p>Solo quedan pendientes los productos que fallaron. Revisá el catálogo antes de reintentar si hubo un corte de conexión.</p><ul className="list-disc pl-5">{failures.map((error) => <li key={error}>{error}</li>)}</ul></div>}
    <button type="button" className="admin-primary px-4 py-3" disabled={busy || !preview.products.length || preview.errors.length > 0} onClick={submit}>{busy ? "Procesando…" : `Importar ${preview.products.length || ""} producto(s)`}</button>
  </section>;
}
