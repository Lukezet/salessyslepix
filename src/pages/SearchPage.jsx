// src/pages/SearchPage.jsx
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchProducts } from "../services/catalog";
import { formatPrice } from "../utils/format";
import AddButton from "../components/AddButton";
import { useTenantPath } from "../utils/tenantPath";
export default function SearchPage() {
  const tenantPath = useTenantPath();
  const [sp] = useSearchParams();
  const q = (sp.get("q") || "").trim();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancel = false;
    const run = async () => {
      if (!q) {
        setItems([]);
        return;
      }
      try {
        setLoading(true);
        setError("");
        const res = await searchProducts({ q });
        console.log(res);
        if (!cancel) setItems(res.items ?? res); // soporta {items:[]} o []
      } catch (e) {
        if (!cancel) setError(e?.message || "Error al buscar");
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    run();
    return () => {
      cancel = true;
    };
  }, [q]);
  // arriba del return:
  const getThumbUrl = (p) => {
    const bySort = (a, b) => (a?.sort ?? 0) - (b?.sort ?? 0);

    const defVar = p.variants?.find((v) => v.isDefault) ?? p.variants?.[0];
    const vImg = defVar?.images?.slice().sort(bySort)?.[0]?.url;

    // fallback: primera variante (si no había default) y luego imágenes del producto
    const anyVarImg = p.variants?.[0]?.images?.slice().sort(bySort)?.[0]?.url;
    const prodImg = p.images?.slice().sort(bySort)?.[0]?.url;

    return vImg || anyVarImg || prodImg || "/placeholder.png";
  };
  return (
    <section className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Resultados para “{q}”</h1>

      {loading && <p className="text-sm text-gray-500">Buscando…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && q && items.length === 0 && (
        <p className="text-sm text-gray-500">No se encontraron artículos.</p>
      )}

      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((p) => (
          <li key={p.id} className="inputRan rounded-xl p-3 hover:shadow">
            <Link to={tenantPath(`/product/${p.id}`)} className="block">
              <div className="aspect-square overflow-hidden rounded-lg bg-gray-50">
                <img
                  src={getThumbUrl(p)}
                  alt={p.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="mt-2 flex flex-col items-end">
                <h3 className="text-sm font-medium line-clamp-2 self-start">
                  {p.name}
                </h3>
                <p className="text-sm text-gray-600 self-start">
                  {formatPrice?.(p.variants?.[0]?.price) ?? `$${p.price}`}
                </p>
                <AddButton
                  product={{
                    id: p.id,
                    name: p.name,
                    brandName: p.brandName,
                    description: p.description,
                    // Lo que realmente se usa al agregar:
                    price: p.variants?.[0]?.price ?? p.price,
                    images: [getThumbUrl(p)], // strings para tu Card/Cart
                    // Datos de la variante seleccionada:
                    variantId: p.variants?.[0]?.id ?? null,
                    sku: p.variants?.[0]?.sku ?? null,
                    colorId: p.variants?.[0]?.colorId ?? null,
                    colorName: p.variants?.[0]?.colorName ?? null,
                    colorHex: p.variants?.[0]?.colorHex ?? null,
                    sizeId: p.variants?.[0]?.sizeId ?? null,
                    sizeName: p.variants?.[0]?.sizeName ?? null,
                    // Nombre “bonito” con atributos
                    displayName: p.variants?.[0]
                      ? `${p.name}${
                          p.variants?.[0]?.colorName
                            ? ` ${p.variants?.[0]?.colorName}`
                            : ""
                        }${p.variants?.[0]?.sizeName ? ` ${p.variants?.[0]?.sizeName}` : ""}`.trim()
                      : p.name,
                  }}
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
