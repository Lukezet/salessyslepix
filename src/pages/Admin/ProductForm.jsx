import { useEffect, useMemo, useState } from "react";
import {
  listBrands,
  createBrand,
  getCategories,
  createCategory,
  uploadProductImage,
  createProduct,
  updateProduct,
  getProductAdminById, // si lo tenés en tu services; si no, pasá "initial" por props
} from "../../services/catalog";

function slugify(str = "") {
  return String(str)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProductForm({
  initial = null,   // opcional: producto para editar (Admin shape: images [{url,sort}], variants...)
  productId = null, // alternativa: id para fetch
  onSaved,          // callback(product) cuando guarda OK
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const [brands, setBrands] = useState([]);
  const [cats, setCats] = useState([]);

  const [form, setForm] = useState(() => ({
    name: "",
    slug: "",
    description: "",
    price: 0,
    brandId: null,
    categoryId: null,
    images: [],      // [{ url, sort }]
    variants: [],    // [{ color,size,sku,priceOverride,isDefault, images:[{url,sort}] }]
  }));

  // Cargar datos base (marcas, categorías) y producto cuando corresponde
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const [b, c] = await Promise.all([listBrands(), getCategories()]);
        if (!alive) return;
        setBrands(b);
        setCats(c);

        if (initial) {
          setForm(fromApiToForm(initial));
        } else if (productId) {
          const p = await getProductAdminById(productId);
          if (!alive) return;
          setForm(fromApiToForm(p));
        } else {
          // crear: valores por defecto
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

  // Helpers de mapeo
  function fromApiToForm(p) {
    return {
      name: p.name ?? "",
      slug: p.slug ?? "",
      description: p.description ?? "",
      price: Number(p.price ?? 0),
      brandId: p.brandId ?? null,
      categoryId: p.categoryId ?? null,
      images: Array.isArray(p.images) ? p.images.map((i, idx) => ({
        url: i.url ?? i, // por si viene string (raro en admin)
        sort: typeof i.sort === "number" ? i.sort : idx,
      })) : [],
      variants: Array.isArray(p.variants) ? p.variants.map(v => ({
        color: v.color ?? "",
        size: v.size ?? "",
        sku: v.sku ?? "",
        priceOverride: typeof v.priceOverride === "number" ? v.priceOverride : (v.price ?? null) ?? null,
        isDefault: !!v.isDefault,
        images: Array.isArray(v.images) ? v.images.map((vi, j) => ({
          url: vi.url ?? vi,
          sort: typeof vi.sort === "number" ? vi.sort : j
        })) : []
      })) : [],
    };
  }

  // ====== Handlers de campos básicos ======
  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const onNameBlur = () => {
    if (!form.slug?.trim()) setField("slug", slugify(form.name));
  };

  // ====== Imágenes de Producto ======
  const addProductFiles = async (files) => {
    for (const f of files) {
      const { url } = await uploadProductImage(f);
      setForm(prev => ({
        ...prev,
        images: [...prev.images, { url, sort: prev.images.length }],
      }));
    }
  };

  const removeProductImage = (idx) => {
    setForm(prev => {
      const next = prev.images.filter((_, i) => i !== idx);
      // normalizar sort
      return { ...prev, images: next.map((x, i) => ({ ...x, sort: i })) };
    });
  };

  const moveProductImage = (idx, dir) => {
    setForm(prev => {
      const arr = [...prev.images];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return prev;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...prev, images: arr.map((x, i) => ({ ...x, sort: i })) };
    });
  };

  // ====== Variantes ======
  const addVariant = () => {
    setForm(prev => {
      const makeDefault = prev.variants.length === 0;
      return {
        ...prev,
        variants: [
          ...prev.variants,
          { color: "", size: "", sku: "", priceOverride: null, isDefault: makeDefault, images: [] }
        ]
      };
    });
  };

  const removeVariant = (idx) => {
    setForm(prev => {
      const arr = prev.variants.filter((_, i) => i !== idx);
      // si quedó sin default, marcar el primero
      if (arr.length > 0 && !arr.some(v => v.isDefault)) arr[0].isDefault = true;
      return { ...prev, variants: arr };
    });
  };

  const setVariantField = (idx, key, value) => {
    setForm(prev => {
      const arr = [...prev.variants];
      arr[idx] = { ...arr[idx], [key]: value };
      return { ...prev, variants: arr };
    });
  };

  const setVariantDefault = (idx) => {
    setForm(prev => {
      const arr = prev.variants.map((v, i) => ({ ...v, isDefault: i === idx }));
      return { ...prev, variants: arr };
    });
  };

  // Imágenes de Variante
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

  // ====== Crear “rápido” marca/categoría ======
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

  // ====== Guardar ======
  const payload = useMemo(() => ({
    name: form.name,
    slug: form.slug,
    description: form.description,
    price: Number(form.price) || 0,
    brandId: form.brandId,
    categoryId: form.categoryId,
    images: (form.images ?? []).map((i, idx) => ({
      url: i.url,
      sort: typeof i.sort === "number" ? i.sort : idx
    })),
    variants: (form.variants ?? []).map(v => ({
      color: v.color || null,
      size: v.size || null,
      sku: v.sku || "",
      priceOverride: v.priceOverride === "" || v.priceOverride === null || typeof v.priceOverride === "undefined"
        ? null : Number(v.priceOverride),
      isDefault: !!v.isDefault,
      images: (v.images ?? []).map((vi, j) => ({
        url: vi.url,
        sort: typeof vi.sort === "number" ? vi.sort : j
      }))
    }))
  }), [form]);

  const validate = () => {
    if (!payload.name?.trim()) return "Nombre requerido";
    if (!payload.slug?.trim()) return "Slug requerido";
    if (!payload.brandId) return "Marca requerida";
    if (!payload.categoryId) return "Categoría requerida";
    if (payload.variants?.length > 0) {
      const defaults = payload.variants.filter(v => v.isDefault).length;
      if (defaults !== 1) return "Debés marcar exactamente una variante como default";
      // check duplicados color/size
      const seen = new Set();
      for (const v of payload.variants) {
        const key = `${v.color ?? ""}__${v.size ?? ""}`;
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

  // ====== UI ======
  if (loading) return <div className="p-4">Cargando…</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">
        {initial || productId ? "Editar producto" : "Nuevo producto"}
      </h1>

      {err && (
        <div className="p-3 rounded bg-red-100 text-red-800 text-sm">
          {String(err)}
        </div>
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
        <div>
          <label className="block text-sm font-medium">Slug</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.slug}
            onChange={e => setField("slug", e.target.value)}
            placeholder="jbl-charge-6"
          />
        </div>
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

      {/* Imágenes de producto */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Imágen del producto</label>
          <input
            type="file"
            multiple
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) await addProductFiles(files);
              e.target.value = "";
            }}
          />
        </div>
        {form.images.length === 0 ? (
          <div className="mt-2 text-sm text-neutral-600">Sin imágenes.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            {form.images.map((img, i) => (
              <div key={i} className="relative border rounded overflow-hidden group">
                <img src={img.url} alt="" className="w-full h-32 object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-xs px-2 py-1 flex items-center justify-between">
                  <span>#{i + 1}</span>
                  <div className="flex gap-1">
                    <button onClick={() => moveProductImage(i, -1)} className="px-2 py-0.5 bg-white/20 rounded hover:bg-white/40">←</button>
                    <button onClick={() => moveProductImage(i, +1)} className="px-2 py-0.5 bg-white/20 rounded hover:bg-white/40">→</button>
                    <button onClick={() => removeProductImage(i)} className="px-2 py-0.5 bg-red-500/80 rounded hover:bg-red-500">✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Variantes */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Variantes</label>
          <button type="button" className="btn-custom px-3 py-2" onClick={addVariant}>+ Variante</button>
        </div>

        {form.variants.length === 0 ? (
          <div className="mt-2 text-sm text-neutral-600">
            Sin variantes. (Podés usar el precio base del producto)
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {form.variants.map((v, idx) => (
              <div key={idx} className="border rounded p-3">
                <div className="grid md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-sm">Color</label>
                    <input
                      className="w-full border rounded px-2 py-1"
                      value={v.color ?? ""}
                      onChange={e => setVariantField(idx, "color", e.target.value)}
                      placeholder="blue / black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Tamaño</label>
                    <input
                      className="w-full border rounded px-2 py-1"
                      value={v.size ?? ""}
                      onChange={e => setVariantField(idx, "size", e.target.value)}
                      placeholder="64GB / XL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">SKU</label>
                    <input
                      className="w-full border rounded px-2 py-1"
                      value={v.sku ?? ""}
                      onChange={e => setVariantField(idx, "sku", e.target.value)}
                      placeholder="SKU-123"
                    />
                  </div>
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
                  <div className="flex items-end">
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

                {/* imágenes de variante */}
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Imágenes de esta variante</div>
                    <input
                      type="file"
                      multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files ?? []);
                        if (files.length) await addVariantFiles(idx, files);
                        e.target.value = "";
                      }}
                    />
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