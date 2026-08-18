// src/admin/AdminPage.jsx
import { useCallback, useEffect, useMemo, useState,Fragment, } from "react";
import { useSearchParams } from "react-router-dom";
import { getProductsPaginated, deleteProduct, setProductVariantDisabled } from "../../services/catalog";
import PriceIncreasePanel from "../../components/Admin/PriceIncreasePanel";
import ProductForm from "../../components/Admin/ProductForm";
import ClientsPage from "./ClientsPage";
import ClientCreatePage from "./ClientCreatePage";
import { useAuth } from "../../store/auth";

function formatPrice(n) {
  const x = Number(n) || 0;
  return x.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function ProductAdminPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [meta, setMeta] = useState({ totalCount: 0, totalPages: 1 });

  // UI state
  const [q, setQ] = useState("");
  const [dq, setDq] = useState(""); // debounced query
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toggling, setToggling] = useState(null); // variantId que se está actualizando
  const [showIncrease, setShowIncrease] = useState(false);
  const toggleVariantDisabled = async (variantId, nextDisabled) => {
    try {
      setToggling(variantId);
      await setProductVariantDisabled(variantId, nextDisabled); // 👈 service
      await load(); // refrescar grilla
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar el estado de la variante.");
    } finally {
      setToggling(null);
    }
  };
  // Debounce del buscador
  useEffect(() => {

    const t = setTimeout(() => setDq(q.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Cargar lista
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
     const res = await getProductsPaginated(page, pageSize, dq); // ahora: paginado + búsqueda
     setItems(res?.items ?? []);
     setMeta({ totalCount: res?.totalCount ?? 0, totalPages: res?.totalPages ?? 1 });
    } catch (e) {
      console.error(e);
      setErr("No se pudo cargar la lista de productos.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, dq]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [dq]); // si cambia búsqueda, vuelve a página 1
const norm = (s) =>
  String(s ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  // Filtrado simple por nombre/slug/marca
// const filtered = useMemo(() => {
//   const qn = norm(dq);
//   if (!qn) return items;

//   return items.filter((p) => {
//     const fields = [
//       p.name,
//       p.slug,
//       p.brandName, // 👈 contrato estable del API
//       ...(Array.isArray(p.variants) ? p.variants.map((v) => v.sku) : []),
//     ].filter(Boolean).map(norm);

//     return fields.some((s) => s.includes(qn));
//   });
// }, [items, dq]);
// const filtered = items;
const filtered = useMemo(() => {
  const base = Array.isArray(items) ? items : [];
  const qn = norm(dq);
  if (!qn) return base;

  return base.filter((p) => {
    const fields = [
      p.name, p.slug, p.brandName,
      ...(Array.isArray(p.variants) ? p.variants.map(v => v.sku) : []),
    ].filter(Boolean).map(norm);
    return fields.some(s => s.includes(qn));
  });
}, [items, dq]);

  const onAppliedIncreases = async () => {
    await load(); // refrescar grilla
  };
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
  const getDefaultVariant = (p) =>
    (p.variants?.find(v => v.isDefault) ?? p.variants?.[0]) ?? null;

  const getOtherVariants = (p, def) =>
    (p.variants ?? []).filter(v => !def || v.id !== def.id);

  const onSaved = async () => {
    closePanel();
    await load();
  };

  return (
    <section className="admin-premium"><div className="admin-shell space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1"><h1 className="admin-title">Gestión de productos.</h1><p className="admin-subtitle mt-3">Inventario, variantes y precios con una vista clara para operar rápido.</p></div>
        <div className="flex items-center gap-2">
          <button className="admin-secondary px-3 py-3" onClick={() => setShowIncrease(true)}>Aumentos</button>
          <input
            className="inputRan rounded px-3 py-2 w-64 h-12"
            placeholder="Buscar por nombre, slug, marca, SKU…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <button className="admin-primary px-4 py-3" onClick={onCreate}>+ Nuevo</button>
        </div>
      </div>

      {err && <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">{err}</div>}

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
        <div className="admin-glass overflow-x-auto rounded-2xl p-2 sm:p-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-2">Imagen</th>
                <th className="py-2 pr-2">Nombre</th>
                <th className="py-2 pr-2">Marca</th>
                <th className="py-2 pr-2">Precio</th>
                <th className="py-2 pr-2">Variantes</th>
                <th className="py-2 pr-2">Stock</th>
                <th className="py-2 pr-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
            {filtered.map(p => {
              const def = getDefaultVariant(p);
              const others = getOtherVariants(p, def);

              return (
                <Fragment key={p.id}>
                  {/* Fila principal = producto + variante default */}
                  <tr className={`border-b ${def?.isDisabled ? "bg-neutral-200 text-neutral-700" : "hover:bg-neutral-50"}`}> 
                    <td className="py-2 pr-2">
                      <div
                        className="w-16 h-12 bg-neutral-200 bg-center bg-cover rounded"
                        style={{ backgroundImage: `url(${def?.images?.[0] ?? p.images?.[0] ?? ""})` }}
                        title={p.name}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-neutral-500">{p.slug}</div>
                      {def?.sku && (
                        <div className="text-[11px] text-neutral-500 mt-0.5">SKU: {def.sku}</div>
                      )}
                    </td>
                    <td className="py-2 pr-2">{p.brandName ?? "—"}</td>
                    
                    <td className="py-2 pr-2">{formatPrice(p.price)}</td>
                    <td className="py-2 pr-2">{p.variants?.length ?? 0}</td>
                    <td className="py-2 pr-2">
                     {def ? (
                       def.isDisabled ? (
                         <button
                           className="btn-custom px-2 py-1 rounded border text-xs hover:bg-green-50"
                           onClick={() => toggleVariantDisabled(def.id, false)}
                           disabled={toggling === def.id}
                           title="Habilitar variante (default)"
                         >
                         <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-red-400 text-gray-800 mr-2">
                           SinStock
                         </span>
                           {toggling === def.id ? "..." : "Habilitar"}
                         </button>
                       ) : (
                         <button
                           className="btn-custom px-2 py-1 rounded border text-xs hover:bg-green-50"
                           onClick={() => toggleVariantDisabled(def.id, true)}
                           disabled={toggling === def.id}
                           title="Habilitar variante (default)"
                         >
                         <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-green-100 text-green-800 mr-2">
                           Activo
                         </span>
                           {toggling === def.id ? "..." : "inhabilitar"}
                         </button>
                       )
                     ) : "—"}
                   </td>
                    <td className="py-2 pr-2">
                      <div className="flex gap-2 justify-end">
                        <button className="px-2 py-1 btn-custom" onClick={() => onEdit(p.id)}>Editar</button>
                        <button className="px-2 btn-danger py-1" onClick={() => onDelete(p.id)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>

                  {/* Filas hijas = variantes NO default */}
                  {others.map(v => (
                    <tr
                      key={`${p.id}-${v.id}`}
                      className={`border-b ${v.isDisabled ? "bg-neutral-200 text-neutral-700" : "bg-neutral-50"}`}
                    >
                      <td className="py-2 pr-2">
                        <div
                          className="w-12 h-10 bg-neutral-200 bg-center bg-cover rounded"
                          style={{ backgroundImage: `url(${v.images?.[0] ?? ""})` }}
                          title={v.sku}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <div className="text-sm">
                          <span className="mr-2 font-medium">Variante</span>
                          <span className="text-xs text-neutral-500">{v.sku}</span>
                        </div>
                        <div className="text-xs text-neutral-600">
                          {v.colorName ? `Color: ${v.colorName}` : ""}{v.sizeName ? ` · Talle: ${v.sizeName}` : ""}
                        </div>
                        {v.isDisabled && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] bg-neutral-800 text-white">
                            Sin stock / deshabilitada
                          </span>
                        )}
                      </td>
                     
                      <td className="py-2 pr-2">{p.brandName ?? "—"}</td>
                     
                      <td className="py-2 pr-2"></td>
                      <td className="py-2 pr-2">—</td>
                      <td className="py-2 pr-2">
                       {v.isDisabled ? (
                         <button
                           className="btn-custom px-2 py-1 rounded border text-xs hover:bg-green-50"
                           onClick={() => toggleVariantDisabled(v.id, false)}
                           disabled={toggling === v.id}
                           title="Habilitar variante"
                         >
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-red-400 text-gray-800 mr-2">
                           SinStock
                         </span>
                           {toggling === v.id ? "..." : "Habilitar"}
                         </button>
                       ) : (
                          <button
                           className="btn-custom px-2 py-1 rounded border text-xs hover:bg-green-50"
                           onClick={() => toggleVariantDisabled(v.id, true)}
                           disabled={toggling === v.id}
                           title="Habilitar variante"
                         >
                         <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-green-100 text-green-800 mr-2">
                           Activo
                         </span>
                           {toggling === v.id ? "..." : "Inhabilitar"}

                         </button>
                       )}
                     </td>
                      <td className="py-2 pr-2">
                        {/* Acciones: apuntan al producto (misma edición) */}
                        <div className="flex gap-2 justify-end">
                        editar en principal⬆️
                        </div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>

          </table>
          <div className="flex items-center justify-between mt-3">
  <p className="text-xs text-slate-400">
    Página {page} de {meta.totalPages} — {meta.totalCount} resultados
  </p>
  <div className="flex items-center gap-2">
    <select
      className="inputRan px-2 py-1"
      value={pageSize}
      onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
    >
      {[10, 20, 50, 100, 200].map(n => (
        <option key={n} value={n}>{n} por página</option>
      ))}
    </select>
    <button
      className="px-3 py-1.5 rounded border text-sm disabled:opacity-50"
      onClick={() => setPage(p => Math.max(1, p - 1))}
      disabled={page <= 1}
    >
      Anterior
    </button>
    <button
      className="px-3 py-1.5 rounded border text-sm disabled:opacity-50"
      onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
      disabled={page >= meta.totalPages}
    >
      Siguiente
    </button>
  </div>
</div>

        </div>
      )}
      {/* PANEL DE AUMENTOS */}
      {showIncrease && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowIncrease(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-full  xl:w-[1200px] bg-white shadow-xl overflow-y-auto p-4"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium">Aumentos de precio</h2>
              <button className="text-sm text-white btn-danger px-4 py-2" onClick={() => setShowIncrease(false)}>X</button>
            </div>
            <PriceIncreasePanel
              onClose={() => setShowIncrease(false)}
              onApplied={onAppliedIncreases}
            />
          </div>
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
    </div></section>
  );
}

export default function AdminPage() {
  const [searchParams] = useSearchParams();
  const section = searchParams.get("section");
  const isPlatformAdmin = useAuth((state) => state.roles.includes("PlatformAdmin"));
  // `main.jsx` is deliberately not modified: the existing protected admin
  // route hosts these platform screens until the router is extracted.
  if (section === "clients") return <ClientsPage />;
  if (section === "clients-new") return <ClientCreatePage />;
  if (section === "products") return <ProductAdminPage />;
  if (isPlatformAdmin) return <ClientsPage />;
  return <ProductAdminPage />;
}
