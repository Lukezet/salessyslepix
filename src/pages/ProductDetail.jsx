import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById /* o getProductBySlug */ } from "../services/catalog";
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

  // selección de variantes
  const [color, setColor] = useState(null);
  const [size, setSize] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        setNotFound(false);

        const data = await getProductById(pid); // si usás slug: getProductBySlug(id)

        if (!alive) return;

        // preselección: variante por defecto o la primera
        const variants = data.variants || [];
        const pre = variants.find(v => v.isDefault) || variants[0] || null;

        setProduct(data);
        setColor(pre?.color ?? null);
        setSize(pre?.size ?? null);
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

  // opciones disponibles
  const colorOptions = useMemo(() => {
    const set = new Set(variants.map(v => v.color).filter(Boolean));
    return Array.from(set);
  }, [variants]);

  const sizeOptions = useMemo(() => {
    // tamaños filtrados por color seleccionado (si hay color)
    const list = variants
      .filter(v => !color || v.color === color)
      .map(v => v.size)
      .filter(Boolean);
    return Array.from(new Set(list));
  }, [variants, color]);

  // variante seleccionada (según lo elegido)
  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;

    // casos: solo color, solo size, ambos o ninguno
    return (
      variants.find(v =>
        (color == null || v.color === color) &&
        (size == null || v.size === size)
      ) || null
    );
  }, [variants, color, size]);

  // galería y precio a mostrar
  const gallery = selectedVariant?.images?.length
    ? selectedVariant.images
    : (product?.images ?? []);

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
          <ImageSlider images={gallery} alt={product.name} />
        ) : null}
      </div>

      {/* Columna info */}
      <div className="mx-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            {loading ? "Cargando..." : product?.name ?? "Producto"}
          </h1>
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>

        <div className="text-2xl mb-4">
          {loading ? "—" : formatPrice(displayPrice)}
        </div>

        {/* Selectores de variante (se ocultan si no hay variantes reales) */}
        {!loading && variants.length > 1 && (
          <div className="mb-4 space-y-3">
            {colorOptions.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-neutral-600">Color:</span>
                {colorOptions.map(c => {
                  const active = c === color;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setColor(c); /* reset size si cambia color */ setSize(null); }}
                      className={`px-3 py-1 rounded-full border text-sm transition
                        ${active ? "bg-black text-white border-black" : "bg-white hover:bg-neutral-100 border-neutral-300"}`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            )}

            {sizeOptions.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-neutral-600">Tamaño:</span>
                {sizeOptions.map(s => {
                  const active = s === size;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      className={`px-3 py-1 rounded-full border text-sm transition
                        ${active ? "bg-black text-white border-black" : "bg-white hover:bg-neutral-100 border-neutral-300"}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="w-full flex items-center justify-between bg-neutral-200 min-h-24 shadow-xl rounded-2xl pr-4 pb-3">
          <div className="mt-3 ml-3">
            <p className="mb-2 text-neutral-700">
              Marca:{" "}
              <span className="text-xl font-semibold">
                {loading ? "—" : product?.nameBrand}
              </span>
            </p>
            <p className="mb-4 text-neutral-700">
              {loading ? "Cargando descripción..." : product?.description}
            </p>
          </div>

          {!loading && product && (
            <div className="flex flex-col justify-center items-end">
              <label htmlFor="AddButton" className="text-xs">Agregar al carrito</label>
              {/* Preparamos el objeto para el carrito con variantId y precio/galería efectivos */}
              <AddButton
                product={{
                  ...product,
                  price: displayPrice,
                  images: gallery,
                  variantId: selectedVariant?.id ?? null,
                  sku: selectedVariant?.sku ?? null,
                  color: selectedVariant?.color ?? null,
                  size: selectedVariant?.size ?? null,
                  displayName:
                    selectedVariant?.color || selectedVariant?.size
                      ? `${product.name} ${selectedVariant?.color ?? ""} ${selectedVariant?.size ?? ""}`.trim()
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