import { useEffect, useState } from "react";
import { createSubproduct, getInventory, inventoryError } from "../../services/inventory";

export default function SubproductEditor({ value, onChange, categoryId, brandId, disabled, onBusyChange }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [stock, setStock] = useState("0");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const enabled = value !== null;
  useEffect(() => {
    let alive = true;
    getInventory().then(data => { if (alive) setItems(data.filter(p => p.isSubproduct)); })
      .catch(e => { if (alive) setError(inventoryError(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  const create = async () => {
    setBusy(true); onBusyChange?.(true); setError("");
    try {
      const item = await createSubproduct({ name: name.trim(), stockQuantity: Number(stock), categoryId, brandId });
      setItems(prev => [...prev, item]);
      onChange({ ...value, [item.id]: 1 });
      setName(""); setStock("0");
    } catch (e) { setError(inventoryError(e)); }
    finally { setBusy(false); onBusyChange?.(false); }
  };
  return <fieldset disabled={disabled || busy} className="admin-glass rounded-xl p-4 space-y-4">
    <legend className="px-2 font-bold">Subproductos</legend>
    <label className="flex items-center gap-3"><input type="checkbox" checked={enabled} onChange={e => onChange(e.target.checked ? {} : null)} />Este producto se arma con subproductos</label>
    <p className="text-sm">En pedidos se muestra el producto final. Cada venta descuenta las cantidades de sus ingredientes. La misma composición se aplica a todas sus variantes.</p>
    {error && <p role="alert" className="text-red-400">{error}</p>}
    {enabled && <>
      <label className="block">Buscar subproductos existentes<input className="inputRan w-full rounded p-2 mt-1" value={search} onChange={e => setSearch(e.target.value)} placeholder="Pan, carne, queso…" /></label>
      {loading ? <p role="status">Cargando subproductos…</p> : <div className="max-h-56 overflow-auto space-y-2">
        {items.filter(p => !p.isDisabled && `${p.name} ${p.sku ?? ""}`.toLowerCase().includes(search.toLowerCase())).map(p => <label key={p.id} className="flex items-center gap-2">
          <input type="checkbox" checked={value[p.id] !== undefined} onChange={e => { const next = { ...value }; if (e.target.checked) next[p.id] = 1; else delete next[p.id]; onChange(next); }} />
          {p.name} · stock: {p.stockQuantity}
        </label>)}
        {!items.length && <p>Todavía no hay subproductos. Creá el primero abajo.</p>}
      </div>}
      {Object.entries(value).map(([id, qty]) => <div key={id} className="flex items-end gap-3">
        <label className="flex-1">{items.find(p => p.id === Number(id))?.name ?? `Subproducto #${id}`} · unidades por producto
          <input aria-label={`Cantidad de ${items.find(p => p.id === Number(id))?.name ?? id}`} type="number" min="1" max="100000" step="1" className="inputRan w-full rounded p-2 mt-1" value={qty} onChange={e => onChange({ ...value, [id]: e.target.value })} />
        </label>
        <button type="button" className="admin-secondary p-2" onClick={() => { const next = { ...value }; delete next[id]; onChange(next); }}>Quitar</button>
      </div>)}
      <div className="border-t pt-4 space-y-3">
        <h3 className="font-bold">Crear y añadir un subproducto</h3>
        <label className="block">Nombre<input maxLength="200" className="inputRan w-full rounded p-2 mt-1" value={name} onChange={e => setName(e.target.value)} placeholder="Roquefort" /></label>
        <label className="block">Stock inicial (unidades)<input type="number" min="0" step="1" className="inputRan w-full rounded p-2 mt-1" value={stock} onChange={e => setStock(e.target.value)} /></label>
        <button type="button" className="admin-secondary p-2" disabled={!categoryId || !brandId || !name.trim() || stock === "" || !Number.isSafeInteger(Number(stock)) || Number(stock) < 0 || Number(stock) > 2147483647} onClick={create}>{busy ? "Creando…" : "+ Crear y añadir"}</button>
        <p className="text-sm">Seleccioná primero marca y categoría. El subproducto se guarda al crearlo y queda disponible en Stock y para otros productos, aunque cierres este formulario.</p>
      </div>
    </>}
  </fieldset>;
}
