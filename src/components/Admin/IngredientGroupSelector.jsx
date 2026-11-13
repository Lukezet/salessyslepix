import { useState } from "react";

export default function IngredientGroupSelector({ groups, value, onChange, onCreate, disabled }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const save = async () => {
    const group = await onCreate(name.trim());
    if (group) { onChange(group.id); setName(""); setCreating(false); }
  };
  return <div className="space-y-2">
    <label className="block text-sm">Grupo interno (opcional)
      <select className="inputRan mt-1 w-full rounded p-2" value={value ?? ""} disabled={disabled} onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}>
        <option value="">Sin grupo</option>
        {groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
      </select>
    </label>
    {onCreate && <button type="button" disabled={disabled} className="admin-secondary px-2 py-1 text-sm" onClick={() => setCreating(!creating)}>{creating ? "Cancelar" : "+ Crear grupo interno"}</button>}
    {creating && <div className="flex gap-2"><input aria-label="Nombre del grupo interno" placeholder="Verduras, carnes, panificados…" maxLength={200} className="inputRan min-w-0 flex-1 rounded p-2" value={name} onChange={e => setName(e.target.value)} disabled={disabled} /><button type="button" className="admin-secondary p-2" disabled={disabled || !name.trim()} onClick={save}>Crear</button></div>}
  </div>;
}
