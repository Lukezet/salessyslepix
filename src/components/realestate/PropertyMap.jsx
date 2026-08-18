import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useInitialMapLocation } from "../../hooks/useInitialMapLocation";
import { saveMapLocation } from "../../services/mapLocation";
import { getPublicPropertyMapMarkers } from "../../services/realEstateMap";

const VIEWPORT_DEBOUNCE_MS = 350;
const STORAGE_DEBOUNCE_MS = 600;

function MapEvents({ onViewportChange }) {
  const map = useMapEvents({
    move: () => onViewportChange(map),
    zoom: () => onViewportChange(map),
  });
  useEffect(() => { onViewportChange(map); }, [map, onViewportChange]);
  return null;
}

function markerIcon(operation) {
  const isSale = operation === "sale";
  return L.divIcon({
    className: "",
    html: `<span aria-label="${isSale ? "Venta" : "Alquiler"}" style="display:grid;place-items:center;width:30px;height:30px;border-radius:9999px;background:${isSale ? "#2563eb" : "#16a34a"};border:2px solid #fff;color:#fff;font:700 13px/1 system-ui;box-shadow:0 1px 5px rgba(0,0,0,.35)">${isSale ? "V" : "A"}</span>`,
    iconSize: [30, 30], iconAnchor: [15, 15],
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
  const [bounds, setBounds] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const viewportTimer = useRef(null);
  const storageTimer = useRef(null);
  const initialLocationRef = useRef(null);

  useEffect(() => { initialLocationRef.current = initialLocation; }, [initialLocation]);
  useEffect(() => () => {
    window.clearTimeout(viewportTimer.current);
    window.clearTimeout(storageTimer.current);
  }, []);

  const onViewportChange = useCallback((map) => {
    const viewport = toViewport(map);
    window.clearTimeout(viewportTimer.current);
    viewportTimer.current = window.setTimeout(() => setBounds(viewport.bounds), VIEWPORT_DEBOUNCE_MS);
    window.clearTimeout(storageTimer.current);
    storageTimer.current = window.setTimeout(() => saveMapLocation(viewport.view, initialLocationRef.current ?? {}, companySlug), STORAGE_DEBOUNCE_MS);
  }, [companySlug]);

  useEffect(() => {
    if (!bounds) return undefined;
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getPublicPropertyMapMarkers(companySlug, operation, bounds, controller.signal)
      .then((items) => active && setMarkers(items))
      .catch((requestError) => {
        if (active && requestError.name !== "CanceledError") setError("No se pudieron cargar las ubicaciones.");
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; controller.abort(); };
  }, [companySlug, operation, bounds]);

  const icons = useMemo(() => new Map([["sale", markerIcon("sale")], ["rent", markerIcon("rent")]]), []);
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
          <MapContainer center={[initialLocation.latitude, initialLocation.longitude]} zoom={initialLocation.zoom} scrollWheelZoom className="h-full w-full" aria-label={`Mapa de inmuebles en ${operationLabel}`}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapEvents onViewportChange={onViewportChange} />
            {markers.map((marker) => <Marker key={marker.id} position={[Number(marker.latitude), Number(marker.longitude)]} icon={icons.get(marker.operation) ?? icons.get(operation)}><Popup><strong>{marker.title}</strong><p className="my-1 text-sm">{marker.operation === "sale" ? "En venta" : "En alquiler"}</p><a className="text-sm font-medium text-blue-700 underline" href={googleMapsUrl(marker.latitude, marker.longitude)} target="_blank" rel="noreferrer">Abrir en Google Maps</a></Popup></Marker>)}
          </MapContainer>
        )}
      </div>
      {!loading && !error && initialLocation && markers.length === 0 && <p className="mt-3 text-sm text-neutral-600">No hay inmuebles publicados para {operationLabel} en esta zona.</p>}
    </section>
  );
}
