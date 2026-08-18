import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../services/catalog";
import PropertyMap from "../components/realestate/PropertyMap";
import PublicationCreateDialog from "../components/publications/PublicationCreateDialog";
import AgentScheduleDialog from "../components/realestate/AgentScheduleDialog";
import { useAuth } from "../store/auth";
import { useTenantConfig } from "../store/tenantConfig";
import { useTenantPath } from "../utils/tenantPath";

export default function Home() {
  const tenantPath = useTenantPath();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const config = useTenantConfig((state) => state.config);
  const storeEnabled = useTenantConfig((state) => state.features.store);
  const realEstateEnabled = useTenantConfig(
    (state) => state.features.realEstate,
  );
  const appointmentsEnabled = useTenantConfig(
    (state) => state.features.realEstate && state.features.appointments,
  );
  const interactiveMapEnabled = useTenantConfig(
    (state) => state.features.realEstate && state.features.interactiveMap,
  );
  const vehiclesEnabled = useTenantConfig((state) => state.features.vehicles);
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const roles = useAuth((state) => state.roles);
  const [createType, setCreateType] = useState(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  console.log("renderhome");
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

  useEffect(() => {
    if (storeEnabled) load();
    else {
      setCats([]);
      setLoading(false);
    }
  }, [storeEnabled]);

  const isRealEstateAgent = roles?.some((role) =>
    [
      "RealEstateAgent",
      "RealEstateCoordinator",
      "Admin",
      "PlatformAdmin",
    ].includes(role),
  );
  const isRealEstateCoordinator = roles?.some((role) =>
    ["RealEstateCoordinator", "Admin", "PlatformAdmin"].includes(role),
  );
  const realEstateActions = isAuthenticated &&
    (realEstateEnabled || vehiclesEnabled) && (
      <div className="flex flex-wrap gap-2">
        {realEstateEnabled && isRealEstateCoordinator && (
          <button
            type="button"
            onClick={() => setCreateType("property")}
            className="btn-custom inline-flex items-center gap-2 rounded-lg px-4 py-2"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" />
              <path d="M9 21v-6h6v6" />
            </svg>
            Crear inmueble
          </button>
        )}
        {appointmentsEnabled && isRealEstateAgent && (
          <button
            onClick={() => setScheduleOpen(true)}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 font-medium hover:bg-neutral-50"
          >
            Mi agenda de visitas
          </button>
        )}
        {vehiclesEnabled && (
          <button
            type="button"
            onClick={() => setCreateType("vehicle")}
            className="btn-custom inline-flex items-center gap-2 rounded-lg px-4 py-2"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-6 w-6 shrink-0"
              fill="currentColor"
            >
              <path d="M18.92 6.01A1.5 1.5 0 0 0 17.5 5h-11a1.5 1.5 0 0 0-1.42 1.01L3 12v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-8l-2.08-5.99ZM6.5 16A1.5 1.5 0 1 1 8 14.5 1.5 1.5 0 0 1 6.5 16Zm11 0a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5ZM5 11l1.5-4.5h11L19 11H5Z" />
            </svg>
            Crear vehículo
          </button>
        )}
      </div>
    );

  if (!storeEnabled) {
    return (
      <>
        {realEstateActions && <div className="mb-4">{realEstateActions}</div>}
        {interactiveMapEnabled && config?.slug && (
          <PropertyMap companySlug={config.slug} />
        )}
        {createType && (
          <PublicationCreateDialog
            type={createType}
            onClose={() => setCreateType(null)}
          />
        )}
        {scheduleOpen && (
          <AgentScheduleDialog onClose={() => setScheduleOpen(false)} />
        )}
      </>
    );
  }

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
              to={tenantPath(`/category/${c.id}`)} // si querés usar slug: `/category/${c.slug}`
              key={c.id}
              className="group rounded-xl overflow-hidden hover:shadow transition-shadow"
            >
              <div className="relative h-36 md:h-44 bg-neutral-100">
                <div
                  className="absolute inset-0 bg-center bg-cover"
                  style={{
                    backgroundImage: c.image ? `url(${c.image})` : "none",
                  }}
                />
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white drop-shadow">
                  <div className="font-medium text-white">{c.name}</div>
                  <div className="text-xs opacity-90">{c.slug}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      {realEstateActions && <div className="mt-6">{realEstateActions}</div>}
      {interactiveMapEnabled && config?.slug && (
        <PropertyMap companySlug={config.slug} />
      )}
      {createType && (
        <PublicationCreateDialog
          type={createType}
          onClose={() => setCreateType(null)}
        />
      )}
      {scheduleOpen && (
        <AgentScheduleDialog onClose={() => setScheduleOpen(false)} />
      )}
    </section>
  );
}
