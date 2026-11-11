import MoneyInput from "../../components/MoneyInput";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createCombo, getInventory, inventoryError, setStock } from "../../services/inventory";
import { useTenantConfig } from "../../store/tenantConfig";
const money = (value) => Number(value).toLocaleString("es-AR", { style: "currency", currency: "ARS" });

export default function InventoryPage() {
  const enabled = useTenantConfig(s => s.isLoaded && s.features.store);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [kind, setKind] = useState("all");
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [selected, setSelected] = useState({});
  const [saving, setSaving] = useState(false);
  const [updated, setUpdated] = useState(null);
  const load = useCallback(async () => {
    try { setItems(await getInventory()); setUpdated(new Date()); setError(""); }
    catch (e) { setError(inventoryError(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let timer;
    const poll = async () => {
      await load();
      if (active) timer = setTimeout(poll, 5000);
    };
    poll();
    return () => { active = false; clearTimeout(timer); };
  }, [enabled, load]);
  const chosen = items.filter(v => selected[v.id] !== undefined);
  const requirements = {};
  for (const item of chosen) {
    const parts = item.hasSubproducts ? item.components : { [item.id]: 1 };
    for (const [id, quantity] of Object.entries(parts)) requirements[id] = (requirements[id] ?? 0) + quantity * Math.max(1, Number(selected[item.id]) || 1);
  }
  const available = chosen.length ? Math.min(...Object.entries(requirements).map(([id, quantity]) => {
    const part = items.find(item => item.id === Number(id));
    return Math.floor((part?.isDisabled ? 0 : part?.stockQuantity ?? 0) / quantity);
  })) : 0;
  const regular = chosen.every(v => v.currency === "ARS") ? chosen.reduce((sum, v) => sum + v.price * Number(selected[v.id] || 0), 0) : null;
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setNotice(""); setError("");
    try {
      await createCombo(name.trim(), Number(price), Object.fromEntries(Object.entries(selected).map(([id, qty]) => [id, Number(qty)])));
      setName(""); setPrice(""); setSelected({}); setNotice("Combo creado. Ya está disponible en el catálogo y en ventas."); await load();
    } catch (e) { setError(inventoryError(e)); }
    finally { setSaving(false); }
  };
  if (!enabled) return <section className="admin-premium"><div className="admin-shell">Tienda no está habilitada para esta empresa.</div></section>;
  return <section className="admin-premium"><div className="admin-shell space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="admin-title">Stock y promociones</h1><p className="admin-subtitle mt-3">Cada venta descuenta sus productos. Al cancelar, las unidades vuelven al stock.</p></div><Link className="admin-secondary p-3" to="?section=products">Ver catálogo</Link></div>
    {error && <p role="alert" className="rounded-xl bg-red-500/15 p-4 text-red-200">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-cyan-500/15 p-4 text-cyan-100">{notice}</p>}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="admin-glass rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-xl font-bold">Productos, subproductos y existencias</h2><p className="text-sm text-slate-300">Actualización cada 5 segundos{updated ? ` · ${updated.toLocaleTimeString("es-AR")}` : ""}</p></div><button type="button" onClick={load} className="admin-secondary px-3">Actualizar</button></div>
        <p className="text-sm text-slate-300">Cargá el stock inicial para activar el control. Los productos sin configurar conservan su venta sin límite. Seleccioná productos para armar una promo.</p>
        <label className="block">Mostrar<select className="inputRan ml-3 rounded p-2" value={kind} onChange={e => setKind(e.target.value)}><option value="all">Todo el stock</option><option value="subproducts">Subproductos</option><option value="products">Productos y promociones</option></select></label>
        <label className="block">Buscar producto o SKU<input className="inputRan mt-2 w-full rounded-lg p-3" value={search} onChange={e => setSearch(e.target.value)} placeholder="Gaseosa, hamburguesa…" /></label>
        {loading ? <p role="status">Cargando inventario…</p> : <div className="grid gap-3 md:grid-cols-2">{items.filter(v => (kind === "all" || (kind === "subproducts" ? v.isSubproduct : !v.isSubproduct))).filter(v => `${v.name} ${v.sku}`.toLowerCase().includes(search.toLowerCase())).map(v => <article key={v.id} className="admin-card rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">{!v.isCombo && !v.isSubproduct && <input type="checkbox" aria-label={`Agregar ${v.name} ${v.sku} al combo`} className="mt-1 h-5 w-5" disabled={(!v.hasSubproducts && v.stockQuantity == null) || v.isDisabled || saving} checked={selected[v.id] !== undefined} onChange={e => setSelected(prev => { const next = { ...prev }; if (e.target.checked) next[v.id] = 1; else delete next[v.id]; return next; })} />}<div><h3 className="font-bold">{v.name}</h3><p className="text-xs text-slate-300">{v.sku}</p></div></div>
          <p>{!v.isSubproduct && <>{v.currency} {Number(v.price).toLocaleString("es-AR")}</>} {v.isSubproduct && <span className="admin-chip">Subproducto · uso interno</span>} {v.hasSubproducts && <span className="admin-chip">Compuesto por subproductos</span>} {v.isCombo && <span className="admin-chip ml-2">Combo</span>}</p>
          <p className={v.available === 0 ? "text-amber-200" : "text-cyan-100"}>{v.isDisabled ? "Inhabilitado" : v.available == null ? "Stock sin configurar" : `${v.available} ${v.isCombo ? "combos disponibles" : "unidades disponibles"}`}</p>
          {!v.isCombo && !v.hasSubproducts && <StockEditor item={v} onSaved={load} onError={setError} />}
          {(v.isCombo || v.hasSubproducts) && <ul className="text-sm text-slate-300">{Object.entries(v.components).map(([id, qty]) => <li key={id}>{qty} × {items.find(p => p.id === Number(id))?.name ?? "Producto no disponible"}</li>)}</ul>}
          {selected[v.id] !== undefined && <label className="block text-sm">Unidades por combo<input form="combo-form" type="number" min="1" max="100000" required className="inputRan mt-1 w-full rounded p-2" value={selected[v.id]} onChange={e => setSelected(prev => ({ ...prev, [v.id]: e.target.value }))} /></label>}
        </article>)}</div>}
        {!loading && items.length === 0 && <p>Primero creá productos y sus variantes en el catálogo.</p>}
      </div>
      <form id="combo-form" onSubmit={save} className="admin-glass h-fit rounded-2xl p-5 space-y-5 xl:sticky xl:top-6">
        <h2 className="text-xl font-bold">Crear promo o combo</h2>
        <label className="block">Nombre<input required maxLength="200" className="inputRan mt-2 w-full rounded-lg p-3" placeholder="Combo 1" value={name} onChange={e => setName(e.target.value)} /></label>
        <label className="block">Precio final en pesos<MoneyInput required min="0.01" max="999999999" step="0.01" className="inputRan mt-2 w-full rounded-lg p-3" placeholder="5000" value={price} onValueChange={value => setPrice(value)} /></label>
        <div className="space-y-2">{chosen.length ? chosen.map(v => <p key={v.id}>{selected[v.id]} × {v.name}</p>) : <p className="text-slate-300">Seleccioná los productos en la grilla.</p>}</div>
        {chosen.length > 0 && <div className="border-t border-white/15 pt-4 space-y-2"><p>Stock para {available} combos</p>{regular != null && <p className="text-sm text-slate-300">Por separado: {money(regular)}{Number(price) > 0 && Number(price) < regular ? ` · Ahorro: ${money(regular - Number(price))}` : ""}</p>}</div>}
        <button disabled={saving || !chosen.length || !name.trim()} className="admin-primary w-full p-3 disabled:opacity-50">{saving ? "Guardando…" : "Crear combo"}</button>
        <p className="text-xs text-slate-300">Hereda la categoría y marca de un componente. Podés editar precio, imágenes y habilitación desde el catálogo.</p>
      </form>
    </div>
  </div></section>;
}

function StockEditor({ item, onSaved, onError }) {
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try { await setStock(item.id, Number(draft.value), draft.expected); setDraft(null); await onSaved(); }
    catch (e) { onError(inventoryError(e)); setDraft(null); await onSaved(); onError(inventoryError(e)); }
    finally { setSaving(false); }
  };
  return <div className="flex items-end gap-2"><label className="min-w-0 flex-1 text-sm">Existencia total<input aria-label={`Existencia de ${item.name} ${item.sku}`} type="number" min="0" step="1" className="inputRan mt-1 w-full rounded p-2" value={draft?.value ?? item.stockQuantity ?? ""} placeholder="Configurar" onChange={e => setDraft(prev => ({ value: e.target.value, expected: prev ? prev.expected : item.stockQuantity }))} /></label><button type="button" className="admin-secondary px-2 py-2" disabled={saving || !draft || draft.value === "" || !Number.isSafeInteger(Number(draft.value)) || Number(draft.value) < 0} onClick={save}>{saving ? "…" : "Guardar"}</button></div>;
}
