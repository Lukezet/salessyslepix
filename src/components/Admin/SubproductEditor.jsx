import IngredientGroupSelector from "./IngredientGroupSelector";
import MeasurementUnitSelector from "./MeasurementUnitSelector";
import { useProductFormFields } from "../../hooks/useProductFormFields";
import { useEffect, useState } from "react";
import { filterSubproducts } from "../../utils/filterSubproducts";
import { createSubproduct, getInventory, inventoryError, getIngredientGroups, createIngredientGroup, assignIngredientGroup } from "../../services/inventory";

export default function SubproductEditor({ value, onChange, brandId, disabled, onBusyChange }) {
  const { required } = useProductFormFields();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupFilter, setGroupFilter] = useState("all");
  const [unit, setUnit] = useState("unidad");
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [stock, setStock] = useState("0");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const enabled = value !== null;
  const filteredItems = filterSubproducts(items, groupFilter, search);
  const selectedItems = Object.entries(value ?? {});
  useEffect(() => {
    let alive = true;
    Promise.all([getInventory(), getIngredientGroups()]).then(([data, loadedGroups]) => { if (alive) { setItems(data.filter(p => p.isSubproduct)); setGroups(loadedGroups); } })
      .catch(e => { if (alive) setError(inventoryError(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  const createGroup = async (groupName) => {
    setBusy(true); onBusyChange?.(true); setError("");
    try {
      const group = await createIngredientGroup(groupName);
      setGroups(prev => [...prev.filter(g => g.id !== group.id), group].sort((a, b) => a.name.localeCompare(b.name)));
      return group;
    } catch (e) { setError(inventoryError(e)); return null; }
    finally { setBusy(false); onBusyChange?.(false); }
  };
  const assignGroup = async (id, groupId) => {
    setBusy(true); onBusyChange?.(true); setError("");
    try {
      await assignIngredientGroup(id, groupId);
      setItems(prev => prev.map(item => item.id === id ? { ...item, ingredientGroupId: groupId } : item));
    } catch (e) { setError(inventoryError(e)); }
    finally { setBusy(false); onBusyChange?.(false); }
  };
  const create = async () => {
    setBusy(true); onBusyChange?.(true); setError("");
    try {
      const item = await createSubproduct({ name: name.trim(), stockQuantity: Number(stock), ingredientGroupId: selectedGroup, brandId: brandId ?? 0, measurementUnit: unit });
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
      <p className="text-sm">Los grupos organizan insumos y no aparecen en el catálogo. Podés dejar un insumo sin grupo; su stock y sus recetas se mantienen.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block min-w-0 text-sm">Grupo de subproductos<select className="inputRan mt-1 w-full rounded p-2" value={groupFilter} onChange={e => setGroupFilter(e.target.value)}><option value="all">Todos los grupos</option><option value="none">Sin grupo</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
        <label className="block min-w-0 text-sm">Buscar por nombre o SKU<input type="search" className="inputRan w-full rounded p-2 mt-1" value={search} onChange={e => setSearch(e.target.value)} placeholder="Lechuga, cebolla…" /></label>
      </div>
      {!loading && <p role="status" className="text-sm">{filteredItems.length} resultados · {selectedItems.length} seleccionados <button type="button" className="admin-secondary ml-2 px-2 py-1" disabled={groupFilter === "all" && !search} onClick={() => { setSearch(""); setGroupFilter("all"); }}>Limpiar filtros</button></p>}
      {loading ? <p role="status">Cargando subproductos…</p> : <div role="region" aria-label="Resultados de subproductos" tabIndex={0} className="max-h-56 min-w-0 overflow-y-auto overscroll-contain space-y-2 rounded-lg border border-current/15 p-2 focus-visible:outline-2 focus-visible:outline-offset-2">
        {filteredItems.map(p => <label key={p.id} className="flex items-start gap-2 rounded-lg p-2 hover:bg-white/5">
          <input type="checkbox" checked={value[p.id] !== undefined} onChange={e => { const next = { ...value }; if (e.target.checked) next[p.id] = 1; else delete next[p.id]; onChange(next); }} />
          <span className="min-w-0 break-words">{p.name} · stock: {p.stockQuantity} {p.measurementUnit ?? "unidad"} · {groups.find(g => g.id === p.ingredientGroupId)?.name ?? "Sin grupo"}</span>
        </label>)}
        {!items.length && <p>Todavía no hay subproductos. Creá el primero abajo.</p>}
        {items.length > 0 && !filteredItems.length && <p className="p-2 text-sm">No hay subproductos disponibles que coincidan con los filtros.</p>}
      </div>}
      {selectedItems.length > 0 && <section className="space-y-2"><h3 className="font-semibold">Insumos seleccionados ({selectedItems.length})</h3><p className="text-sm">Se conservan al cambiar de grupo o buscar otros insumos.</p><div role="region" aria-label="Insumos seleccionados y cantidades" tabIndex={0} className="max-h-72 min-w-0 overflow-y-auto overscroll-contain space-y-3 rounded-lg border border-current/15 p-3 focus-visible:outline-2 focus-visible:outline-offset-2">
      {selectedItems.map(([id, qty]) => <div key={id} className="flex flex-wrap items-end gap-3 border-b border-current/10 pb-3">
        <label className="min-w-0 basis-full break-words sm:flex-1 sm:basis-40">{items.find(p => p.id === Number(id))?.name ?? `Subproducto #${id}`} · cantidad por producto
          <input aria-label={`Cantidad de ${items.find(p => p.id === Number(id))?.name ?? id}`} type="number" min="0.001" max="100000" step="0.001" className="inputRan w-full rounded p-2 mt-1" value={qty} onChange={e => onChange({ ...value, [id]: e.target.value })} />
        </label>
        <span className="pb-2">{items.find(p => p.id === Number(id))?.measurementUnit ?? "unidad"}</span>
        <IngredientGroupSelector groups={groups} value={items.find(p => p.id === Number(id))?.ingredientGroupId} disabled={busy} onChange={group => assignGroup(Number(id), group)} />
        <button type="button" className="admin-secondary p-2" onClick={() => { const next = { ...value }; delete next[id]; onChange(next); }}>Quitar</button>
      </div>)}
      </div></section>}
      <div className="border-t pt-4 space-y-3">
        <h3 className="font-bold">Crear y añadir un subproducto</h3>
        <label className="block">Nombre<input required={required("name")} maxLength="200" className="inputRan w-full rounded p-2 mt-1" value={name} onChange={e => setName(e.target.value)} placeholder="Roquefort" /></label>
        <IngredientGroupSelector groups={groups} value={selectedGroup} onChange={setSelectedGroup} onCreate={createGroup} disabled={busy} /><div className="grid grid-cols-2 gap-3"><label className="block">Stock inicial<input required={required("stockQuantity")} type="number" min="0" step="0.001" className="inputRan w-full rounded p-2 mt-1" value={stock} onChange={e => setStock(e.target.value)} /></label><MeasurementUnitSelector value={unit} onChange={setUnit} disabled={busy} /></div>
        <button type="button" className="admin-secondary p-2" disabled={(required("name") && !name.trim()) || !Number.isFinite(Number(stock)) || Number(stock) < 0 || Number(stock) > 2147483647} onClick={create}>{busy ? "Creando…" : "+ Crear y añadir"}</button>
        <p className="text-sm">El stock y las cantidades de la receta usan la misma medida, sin conversiones automáticas. El subproducto se guarda al crearlo y queda disponible en Stock y para otros productos, aunque cierres este formulario.</p>
      </div>
    </>}
  </fieldset>;
}
