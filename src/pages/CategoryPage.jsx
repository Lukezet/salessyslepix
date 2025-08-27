import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {  getProductsByCategoryId } from "../services/catalog";
import { formatPrice } from "../utils/format";
import AddButton from "../components/Addbutton";

export default function CategoryPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const cid = Number(id);
  const timestamp = Date.now();
console.log(`API call started cat at ${timestamp}`);
console.log('🔄 CategoryPage mounted with cid:', cid);
  const [cat, setCat] = useState(null);
  const [items, setItems] = useState([]);
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
 console.log('🚀 useEffect triggered for cid:', cid);
      // Solo cargar productos - eliminar getCategoryById
      const products = await getProductsByCategoryId(cid);

      if (!alive) return;
      setItems(products);
      
      // El nombre de categoría puede venir del backend junto con productos
      // O lo puedes obtener de otra forma
      setCat({ name: "Categoría" }); // Placeholder mientras optimizas backend

    } catch (e) {
      if (!alive) return;
      if (e?.response?.status === 404) {
        setNotFound(true);
      } else {
        console.error(e);
        setErr("No se pudo cargar la categoría.");
      }
    } finally {
      if (alive) setLoading(false);
    }
  })();

  return () => { alive = false; };
}, [cid]);

  if (notFound) return <p>Categoría no encontrada.</p>;

  return (
    <section>
      <button
        onClick={() => navigate(-1)}
        className="fixed flex justify-center items-center opacity-80 hover:opacity-100 top-18 right-4 w-10 h-10 btn-custom z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>

      {/* Encabezado */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{cat ? cat.name : "Categoría"}</h1>
        {err && (
          <span className="text-sm text-red-600">{err}</span>
        )}
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="relative h-36 md:h-44 rounded-lg overflow-hidden">
              <div className="absolute inset-0 animate-pulse bg-neutral-200" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="h-4 w-2/3 bg-neutral-300 animate-pulse rounded mb-2" />
                <div className="h-3 w-1/3 bg-neutral-300 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((p) => {
        const firstVariantImage = p.variants?.[0]?.images?.[0];
          const bg = firstVariantImage ? `url(${firstVariantImage})` : "none";

            return (
              <Link
                key={p.id}
                to={`/product/${p.id}`} // si luego querés usar slug: `/product/${p.slug}`
                className="relative h-36 md:h-44 rounded-lg p-4 hover:shadow-lg shadow-neutral-700 transition duration-150 ease-out overflow-hidden"
              >
                <div
                  className="absolute inset-0 bg-center bg-cover rounded-lg"
                  style={{ backgroundImage: bg }}
                />
                <div className="absolute flex w-full justify-between bg-neutral-100/50 bottom-0 left-0 right-0 p-3 drop-shadow rounded-t-3xl rounded-b-lg">
                  <div>
                    <div className="text-lg font-medium truncate w-52">{p.name}</div>
                    <div className="text-sm">{formatPrice(p.price)}</div>
                  </div>
            <AddButton
                product={{
                  id: p.id,
                  name: p.name,
                  brandName: p.brandName,
                  description: p.description,
                  // Lo que realmente se usa al agregar:
                  price: p.price,
                  images: [firstVariantImage], // strings para tu Card/Cart
                  // Datos de la variante seleccionada:
                  variantId: p.variants?.[0]?.id ?? null,
                  sku: p.variants?.[0]?.sku ?? null,
                  colorId: p.variants?.[0]?.colorId ?? null,
                  colorName: p.variants?.[0]?.colorName ?? null,
                  colorHex: p.variants?.[0]?.colorHex ?? null,
                  sizeId: p.variants?.[0]?.sizeId ?? null,
                  sizeName: p.variants?.[0]?.sizeName ?? null,
                  // Nombre “bonito” con atributos
                  displayName:
                    p.variants?.[0]
                      ? `${p.name}${
                          p.variants?.[0]?.colorName ? ` ${p.variants?.[0]?.colorName}` : ""
                        }${p.variants?.[0]?.sizeName ? ` ${p.variants?.[0]?.sizeName}` : ""}`.trim()
                      : p.name,
                }}
              />
                  
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}