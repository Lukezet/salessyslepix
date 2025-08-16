import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById } from "../services/catalog";
import { formatPrice } from "../utils/format";
import ImageSlider from "../components/ImageSlider";
import AddButton from "../components/Addbutton";

export default function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const pid = Number(id);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [notFound, setNotFound] = useState(false);

  // selección de variantes por IDs globales
  const [colorId, setColorId] = useState(null);
  const [sizeId, setSizeId] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        setNotFound(false);

        const data = await getProductById(pid);
        if (!alive) return;

        const vs = Array.isArray(data.variants) ? data.variants : [];
        const pre = vs.find(v => v.isDefault) || vs[0] || null;

        setProduct(data);
        setColorId(pre?.colorId ?? null);
        setSizeId(pre?.sizeId ?? null);
      } catch (e) {
        if (!alive) return;
        if (e?.response?.status === 404) setNotFound(true);
        else {
          console.error(e);
          setErr("No se pudo cargar el producto.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [pid]);

  const variants = product?.variants ?? [];

  // Opciones de color únicas (por colorId)
  const colorOptions = useMemo(() => {
    const map = new Map();
    for (const v of variants) {
      if (v.colorId && !map.has(v.colorId)) {
        map.set(v.colorId, {
          id: v.colorId,
          name: v.colorName,
          code: v.colorCode,
          hex: v.colorHex,
          tailwind: v.colorTailwind
        });
      }
    }
    return Array.from(map.values());
  }, [variants]);

  // Opciones de tamaño según color elegido (si hay)
  const sizeOptions = useMemo(() => {
    const list = variants
      .filter(v => !colorId || v.colorId === colorId)
      .map(v => ({
        id: v.sizeId,
        name: v.sizeName,
        code: v.sizeCode,
        group: v.sizeGroup
      }))
      .filter(s => s.id != null);
    // unique por id
    const map = new Map();
    for (const s of list) if (!map.has(s.id)) map.set(s.id, s);
    return Array.from(map.values());
  }, [variants, colorId]);

  // variante seleccionada
  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;

    // 1) match color+size exacto
    let sel = variants.find(v =>
      (colorId == null || v.colorId === colorId) &&
      (sizeId == null || v.sizeId === sizeId)
    );
    // 2) fallback solo color
    if (!sel && colorId != null) sel = variants.find(v => v.colorId === colorId);
    // 3) fallback primera
    return sel || variants[0] || null;
  }, [variants, colorId, sizeId]);

  // Galería (strings) desde la variante
const gallery = useMemo(() => {
  const imgs = (selectedVariant?.images?.length
    ? selectedVariant.images
    : (product?.images ?? []));

  // normaliza a string[]
  return imgs.map(i => (typeof i === "string" ? i : i?.url)).filter(Boolean);
}, [selectedVariant, product]);

  // Precio mostrado (viene calculado del back: v.price = override ?? product.price)
  const displayPrice = selectedVariant?.price ?? product?.price ?? 0;

  if (notFound) return <p>Producto no encontrado.</p>;

  return (
    <article className="relative grid md:grid-cols-2 gap-6">
      <button
        onClick={() => navigate(-1)}
        className="fixed flex justify-center items-center opacity-50 hover:opacity-100 bottom-20 left-4 w-10 h-10 btn-custom z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>

      {/* Columna imágenes */}
      <div>
        {loading ? (
          <div className="h-72 w-full rounded-xl bg-neutral-200 animate-pulse" />
        ) : product ? (
          <ImageSlider key={selectedVariant?.id ?? "no-variant"} images={gallery} alt={product.name} />
        ) : null}
      </div>

      {/* Columna info */}
      <div className="mx-4">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            {loading ? "Cargando..." : product?.name ?? "Producto"}
          </h1>
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>

        {/* Precio */}
        <div className="text-2xl mb-4">
          {loading ? "—" : formatPrice(displayPrice)}
        </div>

        {/* Selectores de variantes */}
        {!loading && variants.length > 0 && (
          <div className="mb-4 space-y-3">
            {/* Colores */}
            {colorOptions.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-neutral-600">Color:</span>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map(opt => {
                    const active = opt.id === colorId;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => { setColorId(opt.id); setSizeId(null); }}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm transition
                          ${active ? "bg-black text-white border-black" : "bg-white hover:bg-neutral-100 border-neutral-300"}`}
                        aria-label={opt.name}
                        title={opt.name}
                      >
                        <span
                          className="inline-block w-4 h-4 rounded border"
                          style={{ backgroundColor: opt.hex || "#000" }}
                        />
                        <span>{opt.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tamaños (si existen) */}
            {sizeOptions.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-neutral-600">Tamaño:</span>
                <div className="flex gap-2 flex-wrap">
                  {sizeOptions.map(opt => {
                    const label = opt.group ? `${opt.name} • ${opt.group}` : opt.name;
                    const active = opt.id === sizeId;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSizeId(opt.id)}
                        className={`px-3 py-1 rounded-full border text-sm transition
                          ${active ? "bg-black text-white border-black" : "bg-white hover:bg-neutral-100 border-neutral-300"}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Marca + descripción + agregar */}
        <div className="w-full flex items-center justify-between bg-neutral-200 min-h-24 shadow-xl rounded-2xl pr-4 pb-3">
          <div className="mt-3 ml-3">
            <p className="mb-1 text-neutral-700">
              Marca:{" "}
              <span className="text-xl font-semibold">{loading ? "—" : product?.brandName}</span>
            </p>
            {/* SKU visible chiquito si hay variante */}
            {selectedVariant?.sku && (
              <p className="text-[11px] text-neutral-600 mb-2">SKU: <code>{selectedVariant.sku}</code></p>
            )}
            <p className="mb-4 text-neutral-700">
              {loading ? "Cargando descripción..." : product?.description}
            </p>
          </div>

          {!loading && product && (
            <div className="flex flex-col justify-center items-end">
              <label htmlFor="AddButton" className="text-xs">Agregar al carrito</label>
              <AddButton
                product={{
                  id: product.id,
                  name: product.name,
                  brandName: product.brandName,
                  description: product.description,
                  // Lo que realmente se usa al agregar:
                  price: displayPrice,
                  images: gallery, // strings para tu Card/Cart
                  // Datos de la variante seleccionada:
                  variantId: selectedVariant?.id ?? null,
                  sku: selectedVariant?.sku ?? null,
                  colorId: selectedVariant?.colorId ?? null,
                  colorName: selectedVariant?.colorName ?? null,
                  colorHex: selectedVariant?.colorHex ?? null,
                  sizeId: selectedVariant?.sizeId ?? null,
                  sizeName: selectedVariant?.sizeName ?? null,
                  // Nombre “bonito” con atributos
                  displayName:
                    selectedVariant
                      ? `${product.name}${
                          selectedVariant.colorName ? ` ${selectedVariant.colorName}` : ""
                        }${selectedVariant.sizeName ? ` ${selectedVariant.sizeName}` : ""}`.trim()
                      : product.name,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
