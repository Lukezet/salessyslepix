import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById /* o getProductBySlug */ } from "../services/catalog";
import { formatPrice } from "../utils/format";
import ImageSlider from "../components/ImageSlider";
import AddButton from "../components/Addbutton";

export default function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams();                // viene como string desde la URL
  const pid = Number(id);                    // tu ruta actual usa id numérico

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        setNotFound(false);

        // Si en el futuro usás slug: reemplazá por getProductBySlug(id)
        const data = await getProductById(pid);

        if (!alive) return;
        setProduct(data); // ya viene mapeado: images = string[]
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
          <ImageSlider images={product.images ?? []} alt={product.name} />
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
          {loading ? "—" : formatPrice(product?.price ?? 0)}
        </div>

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
              <label htmlFor="AddButton" className="text-xs">
                Agregar al carrito
              </label>
              <AddButton product={product} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
