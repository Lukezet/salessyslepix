import { useEffect, useState } from "react";
import { createCategory, getCategories } from "../../services/catalog";
import { slugify } from "../../lib/slugify";
import { inventoryError } from "../../services/inventory";

export default function CategorySelector({ value, onChange, disabled = false }) {
  const [categories, setCategories] = useState([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; getCategories().then(rows => { if (active) setCategories(rows); }).catch(e => { if (active) setError(inventoryError(e)); }); return () => { active = false; }; }, []);
  const save = async () => {
    setBusy(true); setError("");
    try { const row = await createCategory({ name: name.trim(), slug: slugify(name), image: null }); setCategories(rows => [...rows, row]); onChange(row.id); setName(""); setCreating(false); }
    catch (e) { setError(inventoryError(e)); }
    finally { setBusy(false); }
  };
  return <div className="space-y-2"><label className="block">Categoría<div className="flex gap-2 mt-1"><select disabled={disabled || busy} className="inputRan min-w-0 flex-1 rounded p-2" value={value ?? ""} onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}><option value="">Sin categoría</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><button type="button" disabled={disabled || busy} className="admin-secondary p-2" onClick={() => setCreating(!creating)}>+ Crear categoría</button></div></label>{creating && <div className="flex gap-2"><input aria-label="Nueva categoría" maxLength={200} className="inputRan min-w-0 flex-1 rounded p-2" value={name} onChange={e => setName(e.target.value)} placeholder="Hamburguesas, pizzas, fritas…" /><button type="button" className="admin-secondary p-2" disabled={busy || disabled || !name.trim() || !slugify(name)} onClick={save}>Crear</button></div>}{error && <p role="alert" className="text-red-400">{error}</p>}</div>;
}
