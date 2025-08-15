// src/admin/AdminPage.jsx
import { useEffect, useMemo, useState } from "react";
import { getProducts, deleteProduct } from "../../services/catalog";
import ProductForm from "./ProductForm";

function formatPrice(n) {
  const x = Number(n) || 0;
  return x.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [items, setItems] = useState([]);

  // UI state
  const [q, setQ] = useState("");
  const [dq, setDq] = useState(""); // debounced query
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Debounce del buscador
  useEffect(() => {
    const t = setTimeout(() => setDq(q.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Cargar lista
  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      const data = await getProducts(); // tienda mapper: images => string[], pero trae brandName / variants
      setItems(data);
    } catch (e) {
      console.error(e);
      setErr("No se pudo cargar la lista de productos.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
const norm = (s) =>
  String(s ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  // Filtrado simple por nombre/slug/marca
const filtered = useMemo(() => {
  const qn = norm(dq);
  if (!qn) return items;

  return items.filter((p) => {
    const fields = [
      p.name,
      p.slug,
      p.brandName, // 👈 contrato estable del API
      ...(Array.isArray(p.variants) ? p.variants.map((v) => v.sku) : []),
    ].filter(Boolean).map(norm);

    return fields.some((s) => s.includes(qn));
  });
}, [items, dq]);

  const closePanel = () => { setCreating(false); setEditingId(null); };

  // Acciones
  const onCreate = () => { setCreating(true); setEditingId(null); };
  const onEdit = (id) => { setEditingId(id); setCreating(false); };
  const onDelete = async (id) => {
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;
    try {
      await deleteProduct(id);
      await load();
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar.");
    }
  };

  const onSaved = async () => {
    closePanel();
    await load();
  };

  return (
    <section className="p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h1 className="text-2xl font-semibold flex-1">Gestión de Productos</h1>
        <div className="flex gap-2">
          <input
            className="border rounded px-3 py-2 w-64"
            placeholder="Buscar por nombre, slug, marca, SKU…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <button className="btn-custom px-3 py-2" onClick={onCreate}>+ Nuevo</button>
        </div>
      </div>

      {err && <div className="p-3 rounded bg-red-100 text-red-800 text-sm">{err}</div>}

      {/* LISTA */}
      {loading ? (
        <div className="grid gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-neutral-100 animate-pulse rounded" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-neutral-600">Sin resultados.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-2">Imagen</th>
                <th className="py-2 pr-2">Nombre</th>
                <th className="py-2 pr-2">Marca</th>
                <th className="py-2 pr-2">Precio</th>
                <th className="py-2 pr-2">Variantes</th>
                <th className="py-2 pr-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b hover:bg-neutral-50">
                  <td className="py-2 pr-2">
                    <div
                      className="w-16 h-12 bg-neutral-200 bg-center bg-cover rounded"
                      style={{ backgroundImage: `url(${p.images?.[0] ?? ""})` }}
                      title={p.name}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-neutral-500">{p.slug}</div>
                  </td>
                  <td className="py-2 pr-2">{p.brandName ?? "—"}</td>
                  <td className="py-2 pr-2">{formatPrice(p.price)}</td>
                  <td className="py-2 pr-2">{p.variants?.length ?? 0}</td>
                  <td className="py-2 pr-2">
                    <div className="flex gap-2 justify-end">
                      <button className="px-2 py-1 text-sm underline" onClick={() => onEdit(p.id)}>Editar</button>
                      <button className="px-2 py-1 text-sm underline text-red-600" onClick={() => onDelete(p.id)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PANEL DE EDICIÓN / CREACIÓN */}
      {(creating || editingId) && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={closePanel}>
          <div
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[720px] bg-white shadow-xl overflow-y-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium">
                {creating ? "Nuevo producto" : "Editar producto"}
              </h2>
              <button className="text-sm underline" onClick={closePanel}>Cerrar</button>
            </div>

            {creating ? (
              <ProductForm onSaved={onSaved} />
            ) : (
              <ProductForm productId={editingId} onSaved={onSaved} />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
