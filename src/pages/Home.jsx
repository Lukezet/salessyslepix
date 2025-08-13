import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../services/catalog";

export default function Home() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const load = async () => {
    try {
      setErr(null);
      setLoading(true);
      const data = await getCategories();
      setCats(data);
    } catch (e) {
      console.error(e);
      setErr("No se pudieron cargar las categorías.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Categorías</h1>
        {err && (
          <button onClick={load} className="text-sm underline">
            Reintentar
          </button>
        )}
      </div>

      {/* Error */}
      {err && <p className="text-red-600 mb-3">{err}</p>}

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden ">
              <div className="h-36 md:h-44 animate-pulse bg-neutral-300" />
              <div className="p-3">
                <div className="h-4 w-1/2 bg-neutral-300 animate-pulse rounded mb-2" />
                <div className="h-3 w-1/3 bg-neutral-200 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cats.map((c) => (
            <Link
              to={`/category/${c.id}`} // si querés usar slug: `/category/${c.slug}`
              key={c.id}
              className="group rounded-xl overflow-hidden hover:shadow transition-shadow"
            >
              <div className="relative h-36 md:h-44 bg-neutral-100">
                <div
                  className="absolute inset-0 bg-center bg-cover"
                  style={{ backgroundImage: c.image ? `url(${c.image})` : "none" }}
                />
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white drop-shadow">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs opacity-90">{c.slug}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
