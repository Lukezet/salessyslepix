import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { Building2, BriefcaseBusiness, House, MapPinned, Navigation, Store, Warehouse } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useInitialMapLocation } from "../../hooks/useInitialMapLocation";
import { saveMapLocation } from "../../services/mapLocation";
import { getPublicPropertyMapMarkers } from "../../services/realEstateMap";

const STORAGE_DEBOUNCE_MS = 600;

function MapEvents({ onViewportChange }) {
  const map = useMapEvents({
    move: () => onViewportChange(map),
    zoom: () => onViewportChange(map),
  });
  useEffect(() => { onViewportChange(map); }, [map, onViewportChange]);
  return null;
}

const PROPERTY_MARKER_TYPES = {
  1: { label: "Casa", Icon: House },
  2: { label: "Departamento", Icon: Building2 },
  3: { label: "Terreno", Icon: MapPinned },
  4: { label: "Local comercial", Icon: Store },
  5: { label: "Oficina", Icon: BriefcaseBusiness },
  6: { label: "Galpón", Icon: Warehouse },
};

function markerIcon(operation, propertyType) {
  const isSale = operation === "sale";
  const { label, Icon } = PROPERTY_MARKER_TYPES[Number(propertyType)] ?? PROPERTY_MARKER_TYPES[1];
  const icon = renderToStaticMarkup(<Icon size={17} strokeWidth={2.6} aria-hidden="true" focusable="false" />);
  return L.divIcon({
    className: "",
    html: `<span aria-label="${label}, ${isSale ? "venta" : "alquiler"}" title="${label} · ${isSale ? "En venta" : "En alquiler"}" style="display:grid;place-items:center;width:36px;height:36px;border-radius:9999px;background:linear-gradient(145deg,${isSale ? "#3b82f6,#1d4ed8" : "#22c55e,#15803d"});border:3px solid #fff;color:#fff;box-shadow:0 5px 14px rgba(15,23,42,.34),0 0 0 3px ${isSale ? "rgba(37,99,235,.2)" : "rgba(22,163,74,.2)"};transform:translateY(-2px)">${icon}</span>`,
    iconSize: [36, 36], iconAnchor: [18, 18],
  });
}

function toViewport(map) {
  const bounds = map.getBounds();
  const center = map.getCenter();
  return {
    view: { latitude: center.lat, longitude: center.lng, zoom: map.getZoom() },
    bounds: { minLatitude: bounds.getSouth(), maxLatitude: bounds.getNorth(), minLongitude: bounds.getWest(), maxLongitude: bounds.getEast() },
  };
}

function googleMapsUrl(latitude, longitude) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;
}

export default function PropertyMap({ companySlug }) {
  const initialLocation = useInitialMapLocation(companySlug);
  const [operation, setOperation] = useState("sale");
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const storageTimer = useRef(null);
  const initialLocationRef = useRef(null);

  useEffect(() => { initialLocationRef.current = initialLocation; }, [initialLocation]);
  useEffect(() => () => {
    window.clearTimeout(storageTimer.current);
  }, []);

  const onViewportChange = useCallback((map) => {
    const { view } = toViewport(map);
    window.clearTimeout(storageTimer.current);
    storageTimer.current = window.setTimeout(() => saveMapLocation(view, initialLocationRef.current ?? {}, companySlug), STORAGE_DEBOUNCE_MS);
  }, [companySlug]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    // El catálogo público actual tiene un volumen acotado: se carga una vez
    // por operación, no en cada zoom o paneo. Así los marcadores no parpadean
    // ni desaparecen mientras el visitante explora el mapa.
    getPublicPropertyMapMarkers(companySlug, operation, null, controller.signal)
      .then((items) => active && setMarkers(items))
      .catch((requestError) => {
        if (active && requestError.name !== "CanceledError") setError("No se pudieron cargar las ubicaciones.");
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; controller.abort(); };
  }, [companySlug, operation]);

  const icons = useMemo(() => new Map(), []);
  const operationLabel = operation === "sale" ? "venta" : "alquiler";

  return (
    <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-semibold">Mapa de inmuebles</h2><p className="text-sm text-neutral-600">Las ubicaciones mostradas son públicas y aproximadas.</p></div>
        <div className="inline-flex rounded-lg bg-neutral-100 p-1" role="tablist" aria-label="Operación inmobiliaria">
          {[['sale', 'Venta'], ['rent', 'Alquiler']].map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={operation === value} onClick={() => setOperation(value)} className={`rounded-md px-3 py-1.5 text-sm font-medium ${operation === value ? "bg-white shadow text-neutral-950" : "text-neutral-600"}`}>{label}</button>)}
        </div>
      </div>
      <div className="mt-3 flex gap-4 text-xs font-medium text-neutral-600"><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />Venta</span><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-green-600" />Alquiler</span></div>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      <div className="mt-4 h-[420px] overflow-hidden rounded-xl border border-neutral-200">
        {!initialLocation ? <div className="grid h-full place-items-center text-sm text-neutral-600">Preparando el mapa…</div> : (
      <MapContainer center={[initialLocation.latitude, initialLocation.longitude]} zoom={initialLocation.zoom} zoomControl={false} scrollWheelZoom className="h-full w-full" aria-label={`Mapa de inmuebles en ${operationLabel}`}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapEvents onViewportChange={onViewportChange} />
            {markers.map((marker) => {
              const iconKey = `${marker.operation}:${marker.propertyType}`;
              if (!icons.has(iconKey)) icons.set(iconKey, markerIcon(marker.operation, marker.propertyType));
              const type = PROPERTY_MARKER_TYPES[Number(marker.propertyType)]?.label ?? "Inmueble";
              return <Marker key={marker.id} position={[Number(marker.latitude), Number(marker.longitude)]} icon={icons.get(iconKey)}><Popup><div className="min-w-52 p-1"><strong className="block text-sm font-semibold text-slate-900">{marker.title}</strong><p className="mb-3 mt-1 text-sm text-slate-600">{type} · {marker.operation === "sale" ? "En venta" : "En alquiler"}</p><a className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold no-underline shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" style={{ color: "#fff" }} href={googleMapsUrl(marker.latitude, marker.longitude)} target="_blank" rel="noreferrer"><Navigation size={15} aria-hidden="true" />Ver en Google Maps</a></div></Popup></Marker>;
            })}
          </MapContainer>
        )}
      </div>
      {!loading && !error && initialLocation && markers.length === 0 && <p className="mt-3 text-sm text-neutral-600">No hay inmuebles publicados para {operationLabel} en esta zona.</p>}
    </section>
  );
}
