import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublicPublications } from "../../services/publications";
import { useTenantPath } from "../../utils/tenantPath";
import { useUsdRate } from "../../store/usdRate";

const money = (value, code) => new Intl.NumberFormat("es-AR", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(Number(value) || 0);
const isUsd = (item) => item?.currency === "USD" || Number(item?.currency) === 1;

function coverOf(item) {
  const media = item.media ?? item.images ?? item.imageUrls ?? [];
  const first = Array.isArray(media) ? media[0] : null;
  return typeof first === "string" ? first : (first?.url ?? item.coverUrl ?? null);
}

function isProperty(item) {
  return item.type === "Property" || item.type === "property" || Number(item.type) === 1;
}

function operation(item) {
  return item.operation === "Rent" || item.operation === "rent" || Number(item.operation) === 2 ? "Alquiler" : "Venta";
}

export default function PublicationCatalog({ companySlug, showProperties, showVehicles, showPropertyDetails = true, showVehicleDetails = true }) {
  const tenantPath = useTenantPath();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { rate: usdRate, load: loadUsdRate } = useUsdRate();

  useEffect(() => {
    if (!companySlug) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    getPublicPublications(companySlug, { signal: controller.signal })
      .then((data) => setItems(data.filter((item) => (isProperty(item) ? showProperties : showVehicles))))
      .catch((requestError) => {
        if (requestError?.name !== "CanceledError") setError("No se pudo cargar el catálogo.");
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [companySlug, showProperties, showVehicles]);

  useEffect(() => {
    if (items.some(isUsd) && usdRate == null) loadUsdRate();
  }, [items, loadUsdRate, usdRate]);

  if (loading) return <section className="mt-8"><div className="h-7 w-56 animate-pulse rounded bg-neutral-200" /><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="overflow-hidden rounded-2xl border border-neutral-200"><div className="h-48 animate-pulse bg-neutral-200" /><div className="space-y-3 p-4"><div className="h-5 w-2/3 animate-pulse rounded bg-neutral-200" /><div className="h-4 animate-pulse rounded bg-neutral-100" /></div></div>)}</div></section>;
  if (error) return <section className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</section>;
  if (!items.length) return <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">Aún no hay publicaciones disponibles.</section>;

  return <section className="mt-8">
    <div className="mb-4"><h2 className="text-2xl font-semibold">{showProperties ? "Inmuebles disponibles" : "Vehículos disponibles"}</h2><p className="mt-1 text-sm text-neutral-600">Conocé las publicaciones y consultá sus detalles.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const cover = coverOf(item);
        const property = isProperty(item);
        const details = property ? item.property ?? item.propertyDetails ?? {} : item.vehicle ?? item.vehicleDetails ?? {};
        const subtitle = property
          ? [details.rooms && `${details.rooms} ambientes`, details.coveredAreaM2 && `${details.coveredAreaM2} m²`].filter(Boolean).join(" · ")
          : [details.brand, details.model, details.year].filter(Boolean).join(" · ");
        const detailsEnabled = property ? showPropertyDetails : showVehicleDetails;
        return <article key={item.id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="h-48 bg-neutral-100 bg-cover bg-center" style={cover ? { backgroundImage: `url(${cover})` } : undefined}>
            <span className="m-3 inline-flex rounded-full bg-black/75 px-2.5 py-1 text-xs font-semibold text-white">{operation(item)}</span>
          </div>
          <div className="p-4"><h3 className="text-lg font-semibold">{item.title ?? item.name}</h3><p className="mt-1 min-h-5 text-sm text-neutral-600">{subtitle || (property ? "Inmueble" : "Vehículo")}</p><p className="mt-3 text-xl font-bold">{money(item.price, isUsd(item) ? "USD" : "ARS")} <span className={`text-sm font-semibold ${isUsd(item) ? "rounded-full bg-amber-100 px-2 py-0.5 text-amber-900" : "text-neutral-500"}`}>{isUsd(item) ? "USD" : "ARS"}</span></p>{isUsd(item) && typeof usdRate === "number" && <p className="mt-1 text-sm text-neutral-500">({money(Number(item.price) * usdRate, "ARS")} ARS)</p>}{detailsEnabled ? <Link className="mt-4 inline-flex w-full justify-center rounded-lg border border-neutral-900 px-3 py-2 text-sm font-semibold transition hover:bg-neutral-900 hover:text-white" to={`${tenantPath(`/product/${item.slug}`)}?publication=1`}>Más detalle</Link> : <p className="mt-4 text-sm text-neutral-500">Detalle no habilitado.</p>}</div>
        </article>;
      })}
    </div>
  </section>;
}
