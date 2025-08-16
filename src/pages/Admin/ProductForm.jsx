// src/admin/ProductForm.jsx
import { useEffect, useMemo, useState } from "react";
import FilePicker from "../../components/FilePicker";
import {
  listBrands,
  createBrand,
  getCategories,
  createCategory,
  uploadProductImage,
  createProduct,
  updateProduct,
  getProductAdminById,
  listColors,     // 👈 NUEVO
  listSizes,      // 👈 NUEVO
} from "../../services/catalog";

function slugify(str = "") {
  return String(str)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// SKU = nombre-color-tamaño (todo slugificado/minúsculas)
function buildVariantSku(productName, color, size) {
  const parts = [
    productName?.trim() || "",
    color?.code || color?.name || "",
    size?.code || size?.name || "",
  ].filter(Boolean);
  return slugify(parts.join("-"));
}

export default function ProductForm({
  initial = null,
  productId = null,
  onSaved,
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const [brands, setBrands] = useState([]);
  const [cats, setCats] = useState([]);
  const [colors, setColors] = useState([]); // 👈 NUEVO
  const [sizes, setSizes] = useState([]);   // 👈 NUEVO

  const [form, setForm] = useState(() => ({
    name: "",
    slug: "",
    description: "",
    price: 0,
    brandId: null,
    categoryId: null,
    // 🚫 Quitamos imágenes de producto (para evitar confusión)
    images: [],
    // Ahora variantes usan colorId/sizeId (IDs globales)
    variants: [], // [{ colorId, sizeId, sku, priceOverride, isDefault, images:[{url,sort}] }]
  }));

  // Cargar bases + producto
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const [b, c, col, sz] = await Promise.all([
          listBrands(),
          getCategories(),
          listColors(),   // 👈 NUEVO
          listSizes(),    // 👈 NUEVO
        ]);
        if (!alive) return;
        setBrands(b);
        setCats(c);
        setColors(col);
        setSizes(sz);

        if (initial) {
          setForm(fromApiToForm(initial));
        } else if (productId) {
          const p = await getProductAdminById(productId);
          if (!alive) return;
          setForm(fromApiToForm(p));
        } else {
          setForm(f => ({ ...f, price: 0 }));
        }
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setErr("No se pudo cargar datos de base.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [productId, initial]);

  // Mapear API → Form (admin)
  function fromApiToForm(p) {
    return {
      name: p.name ?? "",
      slug: p.slug ?? "", // se re-generará si está vacío
      description: p.description ?? "",
      price: Number(p.price ?? 0),
      brandId: p.brandId ?? null,
      categoryId: p.categoryId ?? null,
      images: [], // 🚫 ya no usamos imágenes de producto
      variants: Array.isArray(p.variants) ? p.variants.map(v => ({
        colorId: typeof v.colorId === "number" ? v.colorId : null,
        sizeId:  typeof v.sizeId  === "number" ? v.sizeId  : null,
        // SKU se recalcula abajo, pero lo guardamos por si viene:
        sku: v.sku ?? "",
        // En admin solemos editar el override, si no viene explícito, queda null:
        priceOverride: v.priceOverride ?? null,
        isDefault: !!v.isDefault,
        images: Array.isArray(v.images) ? v.images.map((vi, j) => ({
          url: vi.url ?? vi,
          sort: typeof vi.sort === "number" ? vi.sort : j
        })) : []
      })) : [],
    };
  }

  // Recalcular slug de producto cuando pierde foco del nombre (auto, oculto en UI)
  const onNameBlur = () => {
    if (!form.slug?.trim()) setField("slug", slugify(form.name));
  };

  // Recalcular SKU de TODAS las variantes (según nombre/color/size)
  const recomputeAllVariantSkus = (nextForm) => {
    const colorMap = new Map(colors.map(c => [c.id, c]));
    const sizeMap  = new Map(sizes.map(s => [s.id, s]));
    const name = nextForm.name ?? "";
    const nextVariants = (nextForm.variants ?? []).map(v => {
      const c = v.colorId ? colorMap.get(v.colorId) : null;
      const s = v.sizeId  ? sizeMap.get(v.sizeId)  : null;
      return { ...v, sku: buildVariantSku(name, c, s) };
    });
    return { ...nextForm, variants: nextVariants };
  };

  // ====== State helpers ======
  const setField = (k, v) => setForm(prev => recomputeAllVariantSkus({ ...prev, [k]: v }));

  const setVariantField = (idx, key, value) => {
    setForm(prev => {
      const arr = [...prev.variants];
      arr[idx] = { ...arr[idx], [key]: value };
      return recomputeAllVariantSkus({ ...prev, variants: arr });
    });
  };

  const setVariantDefault = (idx) => {
    setForm(prev => {
      const arr = prev.variants.map((v, i) => ({ ...v, isDefault: i === idx }));
      return { ...prev, variants: arr };
    });
  };

  const addVariant = () => {
    setForm(prev => {
      const makeDefault = prev.variants.length === 0;
      const next = {
        ...prev,
        variants: [
          ...prev.variants,
          { colorId: null, sizeId: null, sku: "", priceOverride: null, isDefault: makeDefault, images: [] }
        ]
      };
      return recomputeAllVariantSkus(next);
    });
  };

  const removeVariant = (idx) => {
    setForm(prev => {
      const arr = prev.variants.filter((_, i) => i !== idx);
      if (arr.length > 0 && !arr.some(v => v.isDefault)) arr[0].isDefault = true;
      return { ...prev, variants: arr };
    });
  };

  // ====== Imágenes de Variante ======
  const addVariantFiles = async (idx, files) => {
    const uploaded = [];
    for (const f of files) {
      const { url } = await uploadProductImage(f);
      uploaded.push(url);
    }
    setForm(prev => {
      const arr = [...prev.variants];
      const curr = arr[idx];
      const base = curr.images ?? [];
      const nextImgs = [
        ...base,
        ...uploaded.map((u, i) => ({ url: u, sort: base.length + i }))
      ];
      arr[idx] = { ...curr, images: nextImgs };
      return { ...prev, variants: arr };
    });
  };

  const removeVariantImage = (vIdx, imgIdx) => {
    setForm(prev => {
      const arr = [...prev.variants];
      const curr = arr[vIdx];
      const imgs = (curr.images ?? []).filter((_, i) => i !== imgIdx)
        .map((x, i) => ({ ...x, sort: i }));
      arr[vIdx] = { ...curr, images: imgs };
      return { ...prev, variants: arr };
    });
  };

  const moveVariantImage = (vIdx, imgIdx, dir) => {
    setForm(prev => {
      const arr = [...prev.variants];
      const curr = arr[vIdx];
      const imgs = [...(curr.images ?? [])];
      const j = imgIdx + dir;
      if (j < 0 || j >= imgs.length) return prev;
      [imgs[imgIdx], imgs[j]] = [imgs[j], imgs[imgIdx]];
      arr[vIdx] = { ...curr, images: imgs.map((x, i) => ({ ...x, sort: i })) };
      return { ...prev, variants: arr };
    });
  };

  // Crear rápido
  const quickAddBrand = async () => {
    const name = prompt("Nombre de marca");
    if (!name) return;
    const slug = slugify(name);
    const b = await createBrand({ name, slug, logoUrl: null, website: null, description: null });
    setBrands(prev => [...prev, b]);
    setField("brandId", b.id);
  };

  const quickAddCategory = async () => {
    const name = prompt("Nombre de categoría");
    if (!name) return;
    const slug = slugify(name);
    const c = await createCategory({ name, slug, image: null });
    setCats(prev => [...prev, c]);
    setField("categoryId", c.id);
  };

  // ====== Payload ======
  const payload = useMemo(() => {
    // mapa para construir SKU coherente en caso de cambios
    const colorMap = new Map(colors.map(c => [c.id, c]));
    const sizeMap  = new Map(sizes.map(s => [s.id, s]));

    return {
      name: form.name,
      // slug de producto oculto (solo nombre)
      slug: form.slug?.trim() ? form.slug : slugify(form.name),
      description: form.description,
      price: Number(form.price) || 0,
      brandId: form.brandId,
      categoryId: form.categoryId,

      // 🚫 No enviamos imágenes de producto (lo dejamos vacío)
      images: [],

      // variantes con IDs y SKU auto
      variants: (form.variants ?? []).map(v => {
        const c = v.colorId ? colorMap.get(v.colorId) : null;
        const s = v.sizeId  ? sizeMap.get(v.sizeId)  : null;
        const autoSku = buildVariantSku(form.name, c, s);
        return {
          colorId: v.colorId ?? null,
          sizeId:  v.sizeId  ?? null,
          sku: autoSku, // 👈 SKU auto
          priceOverride:
            v.priceOverride === "" || v.priceOverride === null || typeof v.priceOverride === "undefined"
              ? null : Number(v.priceOverride),
          isDefault: !!v.isDefault,
          images: (v.images ?? []).map((vi, j) => ({
            url: vi.url,
            sort: typeof vi.sort === "number" ? vi.sort : j
          }))
        };
      })
    };
  }, [form, colors, sizes]);

  // ====== Validación ======
  const validate = () => {
    if (!payload.name?.trim()) return "Nombre requerido";
    if (!payload.slug?.trim()) return "Slug requerido";
    if (!payload.brandId) return "Marca requerida";
    if (!payload.categoryId) return "Categoría requerida";

    if (payload.variants?.length > 0) {
      const defaults = payload.variants.filter(v => v.isDefault).length;
      if (defaults !== 1) return "Debés marcar exactamente una variante como default";

      // duplicados por (colorId,sizeId)
      const seen = new Set();
      for (const v of payload.variants) {
        const key = `${v.colorId ?? ""}__${v.sizeId ?? ""}`;
        if (seen.has(key)) return "Hay variantes repetidas (color/tamaño)";
        seen.add(key);
      }
    }
    return null;
  };

  const save = async () => {
    const vErr = validate();
    if (vErr) { setErr(vErr); return; }
    try {
      setSaving(true);
      setErr(null);
      console.log("PAYLOAD QUE SE ENVÍA >>>", JSON.stringify(payload, null, 2));
      const res = initial || productId
        ? await updateProduct(initial?.id ?? productId, payload)
        : await createProduct(payload);
      onSaved?.(res);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data ?? "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Cargando…</div>;

  // Helpers UI
  const findColor = (id) => colors.find(c => c.id === id);
  const colorChip = (id) => {
    const c = findColor(id);
    const hex = c?.hex || "#000000";
    return (
      <span className="inline-flex items-center gap-2 text-xs">
        <span className="inline-block w-4 h-4 rounded border" style={{ backgroundColor: hex }} />
        {c ? `${c.name} (${c.code})` : "—"}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">
        {initial || productId ? "Editar producto" : "Nuevo producto"}
      </h1>

      {err && (
        <div className="p-3 rounded bg-red-100 text-red-800 text-sm">{String(err)}</div>
      )}

      {/* Campos básicos */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Nombre</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.name}
            onChange={e => setField("name", e.target.value)}
            onBlur={onNameBlur}
            placeholder="JBL Charge 6"
          />
        </div>
        {/* 🚫 Slug oculto al usuario: se genera solo
        <div>... (eliminado) ...</div>
        */}
        <div>
          <label className="block text-sm font-medium">Precio base</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={form.price}
            onChange={e => setField("price", e.target.value)}
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Marca</label>
          <div className="flex gap-2">
            <select
              className="flex-1 border rounded px-3 py-2"
              value={form.brandId ?? ""}
              onChange={e => setField("brandId", e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">— Seleccionar —</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <button type="button" className="btn-custom px-3 py-2" onClick={quickAddBrand}>+ Nueva</button>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Categoría</label>
          <div className="flex gap-2">
            <select
              className="flex-1 border rounded px-3 py-2"
              value={form.categoryId ?? ""}
              onChange={e => setField("categoryId", e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">— Seleccionar —</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button type="button" className="btn-custom px-3 py-2" onClick={quickAddCategory}>+ Nueva</button>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Descripción</label>
          <textarea
            className="w-full border rounded px-3 py-2 min-h-28"
            value={form.description}
            onChange={e => setField("description", e.target.value)}
            placeholder="Un altavoz portátil resistente al agua..."
          />
        </div>
      </div>

      {/* 🚫 Imágenes de producto: eliminadas. Ahora solo por variante. */}

      {/* Variantes */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Variantes</label>
          <button type="button" className="btn-custom px-3 py-2" onClick={addVariant}>+ Variante</button>
        </div>

        {form.variants.length === 0 ? (
          <div className="mt-2 text-sm text-neutral-600">
            Sin variantes. (Se usará solo el precio base del producto)
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {form.variants.map((v, idx) => (
                <div key={idx} className="border rounded p-3">
                  <div className="grid md:grid-cols-5 gap-3">
                    {/* Color select con chip */}
                    <div className="col-span-2">
                      <label className="block text-sm">Color</label>
                      <div className="flex items-center gap-2">
                        <select
                          className="flex-1 border rounded px-2 py-1"
                          value={v.colorId ?? ""}
                          onChange={e => setVariantField(idx, "colorId", e.target.value ? Number(e.target.value) : null)}
                        >
                          <option value="">— Sin color —</option>
                          {colors.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.code})
                            </option>
                          ))}
                        </select>
                        <div className="min-w-16">
                          {v.colorId ? colorChip(v.colorId) : <span className="text-xs text-neutral-500">—</span>}
                        </div>
                      </div>
                    </div>

                    {/* Size select */}
                    <div>
                      <label className="block text-sm">Tamaño</label>
                      <select
                        className="w-full border rounded px-2 py-1"
                        value={v.sizeId ?? ""}
                        onChange={e => setVariantField(idx, "sizeId", e.target.value ? Number(e.target.value) : null)}
                      >
                        <option value="">— Sin tamaño —</option>
                        {sizes.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name}{s.group ? ` • ${s.group}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Precio override */}
                    <div>
                      <label className="block text-sm">Precio (override)</label>
                      <input
                        type="number"
                        className="w-full border rounded px-2 py-1"
                        value={v.priceOverride ?? ""}
                        onChange={e => setVariantField(idx, "priceOverride", e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="(opcional)"
                      />
                    </div>

                    {/* Default + quitar */}
                    <div className="flex items-end gap-2">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!v.isDefault}
                          onChange={() => setVariantDefault(idx)}
                        />
                        Default
                      </label>
                      <button
                        type="button"
                        className="ml-auto text-sm underline text-red-600"
                        onClick={() => removeVariant(idx)}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>

                  {/* SKU (auto, oculto). Si querés verlo en debug, mostralo aquí */}
                  <div className="mt-1 text-[11px] text-neutral-500">
                    SKU auto: <code>{v.sku}</code>
                  </div>

                  {/* Imágenes de variante */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Imágenes de esta variante</div>
                      <div className="w-64">
                        <FilePicker
                          label="Seleccionar imágenes"
                          onFiles={async (files) => { await addVariantFiles(idx, files); }}
                          multiple
                          accept="image/*"
                          compact
                        />
                      </div>
                    </div>

                    {(v.images?.length ?? 0) === 0 ? (
                      <div className="mt-2 text-sm text-neutral-600">Sin imágenes.</div>
                    ) : (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {v.images.map((img, j) => (
                          <div key={j} className="relative">
                            <img src={img.url} alt="" className="w-24 h-20 object-cover rounded border" />
                            <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[11px] px-1 py-0.5 flex items-center justify-between rounded-b">
                              <span>#{j + 1}</span>
                              <div className="flex gap-1">
                                <button onClick={() => moveVariantImage(idx, j, -1)} className="px-1 rounded bg-white/20">←</button>
                                <button onClick={() => moveVariantImage(idx, j, +1)} className="px-1 rounded bg-white/20">→</button>
                                <button onClick={() => removeVariantImage(idx, j)} className="px-1 rounded bg-red-500/80">✕</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="btn-custom px-5 py-2 disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}
