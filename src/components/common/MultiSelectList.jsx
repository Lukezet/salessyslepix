// src/components/common/MultiSelectList.jsx
import { useMemo, useState } from "react";

/**
 * options: [{ id:number, name:string }]
 * values: number[]        (IDs seleccionados)
 * onChange: (ids:number[]) => void
 * height: number          (px, opcional)
 * searchable: boolean     (opcional, default true)
 * accent: "red" | "blue" | "green" ... (opcional)
 */
export default function MultiSelectList({
  options = [],
  values = [],
  onChange,
  height = 180,
  searchable = true,
  accent = "red",
  placeholder = "Buscar..."
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    if (!qn) return options;
    return options.filter(o => (o.name || "").toLowerCase().includes(qn));
  }, [options, q]);

  const toggle = (id) => {
    const set = new Set(values);
    set.has(id) ? set.delete(id) : set.add(id);
    onChange?.(Array.from(set));
  };

  const allIds = filtered.map(o => o.id);
  const allSelectedInView = allIds.length > 0 && allIds.every(id => values.includes(id));

  const selectAllInView = () => {
    const set = new Set(values);
    allIds.forEach(id => set.add(id));
    onChange?.(Array.from(set));
  };

  const clearAllInView = () => {
    const set = new Set(values);
    allIds.forEach(id => set.delete(id));
    onChange?.(Array.from(set));
  };

  // estilos por color (usamos rojo para “lo filtrado”)
  const accentClasses = {
    red:   "bg-red-50 ring-1 ring-red-200 text-red-800",
    blue:  "bg-blue-50 ring-1 ring-blue-200 text-blue-800",
    green: "bg-green-50 ring-1 ring-green-200 text-green-800",
    amber: "bg-amber-50 ring-1 ring-amber-200 text-amber-900",
  }[accent] ?? "bg-red-50 ring-1 ring-red-200 text-red-800";

  return (
    <div className="border rounded inputRan">
      {searchable && (
        <div className="p-2 border-b flex items-center gap-2">
          <input
            className="inputRan px-2 py-1 flex-1"
            placeholder={placeholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            type="button"
            className="text-xs px-2 py-1 btn-custom"
            onClick={allSelectedInView ? clearAllInView : selectAllInView}
          >
            {allSelectedInView ? "Quitar vista" : "Marcar vista"}
          </button>
          <button
            type="button"
            className="text-xs px-2 py-1 btn-custom"
            onClick={() => onChange?.([])}
          >
            Limpiar todo
          </button>
        </div>
      )}
      <div style={{ height, overflowY: "auto" }} className="py-1">
        {filtered.length === 0 && (
          <div className="text-xs text-neutral-500 px-3 py-2">Sin opciones.</div>
        )}

        {filtered.map(o => {
          const checked = values.includes(o.id);
          return (
            <label
              key={o.id}
              className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer select-none
                          ${checked ? accentClasses : "hover:bg-neutral-50"}`}
            >
              <input
                type="checkbox"
                className="accent-red-600"
                checked={checked}
                onChange={() => toggle(o.id)}
              />
              <span className={`text-sm ${checked ? "font-medium" : ""}`}>{o.name}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
