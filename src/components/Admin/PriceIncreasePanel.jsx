// src/components/Admin/PriceIncreasePanel.jsx
import { useEffect, useMemo, useState } from "react";
import { listProviders, getCategories,  listBrands, getPriceIncreasePreview, applyPriceIncrease } from "../../services/catalog";
import MultiSelectList from "../common/MultiSelectList";
export default function PriceIncreasePanel({ onClose, onApplied }) {
  const [percent, setPercent] = useState(10);
  const [brandIds, setBrandIds] = useState([]);
  const [providerIds, setProviderIds] = useState([]);
  const [categoryIds, setCategoryIds] = useState([]);

  const [brands, setBrands] = useState([]);
  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState({ totalCandidates: 0, items: [] });
  const [exclude, setExclude] = useState(new Set()); // ids

  const [affectVariantOverrides, setAffectVariantOverrides] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const [b, p, c] = await Promise.all([
        listBrands(), listProviders(), getCategories()
      ]);
      setBrands(b ?? []);
      setProviders(p ?? []);
      setCategories(c ?? []);
    })();
  }, []);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const data = await getPriceIncreasePreview({ brandIds, providerIds, categoryIds, max: 300 });
      setPreview(data ?? { totalCandidates: 0, items: [] });
      setExclude(new Set()); // limpiar exclusiones al refrescar
    } finally {
      setLoading(false);
    }
  };

  const toggleExclude = (id) => {
    setExclude(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredItems = useMemo(() => {
    const qn = (q || "").trim().toLowerCase();
    if (!qn) return preview.items;
    return (preview.items || []).filter(x =>
      x.name.toLowerCase().includes(qn) ||
      x.brandName.toLowerCase().includes(qn) ||
      (x.providerName || "").toLowerCase().includes(qn)
    );
  }, [preview.items, q]);

  const onApply = async () => {
    if (!percent || isNaN(Number(percent))) {
      alert("Ingresá un porcentaje válido (ej. 10 o -5).");
      return;
    }
    const res = await applyPriceIncrease({
      percent: Number(percent),
      brandIds, providerIds, categoryIds,
      excludeProductIds: Array.from(exclude),
      affectVariantOverrides
    });
    alert(`Listo. Productos: ${res.productsAffected}. Overrides de variantes: ${res.variantOverridesAffected}.`);
    onApplied?.();
    onClose?.();
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">Aquello Marcado con <span className="bg-red-500 text-white p-2 rounded-lg">Rojo</span> se filtrará</h3>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">

  {/* MARCAS */}
        <div>
          <label className="block text-sm mb-1">Marca(s)</label>
          <MultiSelectList
            options={brands}               // 👈 vienen de setBrands en tu useEffect
            values={brandIds}              // 👈 seleccionados
            onChange={setBrandIds}         // 👈 actualiza seleccionados
            height={112}                   // ≈ h-28
            accent="red"                   // rojo = “filtra”
            placeholder="Buscar marcas…"
          />
        </div>

        {/* PROVEEDORES */}
        <div>
          <label className="block text-sm mb-1">Proveedor(es)</label>
          <MultiSelectList
            options={providers}
            values={providerIds}
            onChange={setProviderIds}
            height={112}
            accent="red"
            placeholder="Buscar proveedores…"
          />
        </div>

        {/* CATEGORÍAS */}
        <div>
          <label className="block text-sm mb-1">Categoría(s)</label>
          <MultiSelectList
            options={categories}
            values={categoryIds}
            onChange={setCategoryIds}
            height={112}
            accent="red"
            placeholder="Buscar categorías…"
          />
        </div>
        
      </div>
        <div>
          <label className="block text-sm mb-1">Porcentaje</label>
          <input
            type="number"
            className="inputRan w-full px-3 py-2"
            value={percent}
            onChange={e => setPercent(e.target.value)}
            step="0.1"
            placeholder="Ej: 10 = +10%, -5 = -5%"
          />
          <div className="mt-2 flex items-center gap-2">
            <input
              id="affectOverrides"
              type="checkbox"
              checked={affectVariantOverrides}
              onChange={e => setAffectVariantOverrides(e.target.checked)}
            />
            <label htmlFor="affectOverrides" className="text-sm">
              Aplicar también a variantes con <code>PriceOverride</code>
            </label>
          </div>
        </div>
      <div className="flex items-center gap-2">
        <button className="btn-custom px-3 py-2" onClick={loadPreview} disabled={loading}>
          {loading ? "Cargando..." : "Previsualizar"}
        </button>
        <input
          className="inputRan px-3 py-2 flex-1"
          placeholder="Buscar en previsualización..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <span className="text-sm text-neutral-600">
          Total posibles: {preview.totalCandidates}
        </span>
      </div>

      <div className="border rounded">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="panel-custom-lite rounded">
              <th className="p-2">Excluir</th>
              <th className="p-2 text-left">Producto</th>
              <th className="p-2 text-left">Marca</th>
              <th className="p-2 text-left">Proveedor</th>
              <th className="p-2 text-right">Precio</th>
            </tr>
          </thead>
          <tbody>
            {(filteredItems || []).map(it => (
              <tr key={it.id} className="border-b">
                <td className="p-2 text-center">
                  <input
                    type="checkbox"
                    checked={exclude.has(it.id)}
                    onChange={() => toggleExclude(it.id)}
                    title="Excluir de este aumento"
                  />
                </td>
                <td className="p-2">{it.name}</td>
                <td className="p-2">{it.brandName}</td>
                <td className="p-2">{it.providerName ?? "—"}</td>
                <td className="p-2 text-right">{Number(it.price).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}</td>
              </tr>
            ))}
            {(!filteredItems || filteredItems.length === 0) && (
              <tr><td colSpan={5} className="p-3 text-center text-neutral-500">Sin datos.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button className="px-3 py-2 rounded border btn-danger" onClick={onClose}>Cancelar</button>
        <button className="btn-custom px-3 py-2" onClick={onApply}>Aplicar aumento</button>
      </div>
    </div>
  );
}
