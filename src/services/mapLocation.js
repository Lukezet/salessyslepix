import { axiosClient } from "../lib/axiosClient";

const STORAGE_KEY = "lepix.public-map.view.v2";
const configuredTtlHours = Number(import.meta.env.VITE_MAP_LOCAL_STATE_TTL_HOURS);
const LOCAL_STATE_TTL_MS = (Number.isFinite(configuredTtlHours) && configuredTtlHours > 0 ? configuredTtlHours : 24) * 60 * 60 * 1000;
const DEFAULT_LOCATION = {
  latitude: Number(import.meta.env.VITE_MAP_DEFAULT_LATITUDE) || -34.6037,
  longitude: Number(import.meta.env.VITE_MAP_DEFAULT_LONGITUDE) || -58.3816,
  zoom: Number(import.meta.env.VITE_MAP_DEFAULT_ZOOM) || 11,
  city: import.meta.env.VITE_MAP_DEFAULT_CITY || "Buenos Aires",
  region: import.meta.env.VITE_MAP_DEFAULT_REGION || "Ciudad Autónoma de Buenos Aires",
  country: import.meta.env.VITE_MAP_DEFAULT_COUNTRY || "Argentina",
  source: "default",
};

function isCoordinate(value, min, max) { return Number.isFinite(value) && value >= min && value <= max; }
function isMapViewState(value) {
  return value && isCoordinate(value.latitude, -90, 90) && isCoordinate(value.longitude, -180, 180)
    && Number.isFinite(value.zoom) && value.zoom >= 1 && value.zoom <= 22
    && typeof value.updatedAt === "string" && Number.isFinite(Date.parse(value.updatedAt));
}

function isExpired(view) { return Date.now() - Date.parse(view.updatedAt) > LOCAL_STATE_TTL_MS; }

export function getDefaultMapLocation() { return { ...DEFAULT_LOCATION }; }

function storageKey(mapId) { return mapId ? `${STORAGE_KEY}.${mapId}` : STORAGE_KEY; }

export function getSavedMapLocation(mapId) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey(mapId)));
    return isMapViewState(saved) && !isExpired(saved) ? { ...saved, source: "local" } : null;
  } catch (error) {
    console.warn("No se pudo leer la última vista del mapa.", error);
    return null;
  }
}

export function saveMapLocation(view, location = {}, mapId) {
  if (!isMapViewState(view)) return;
  // La ciudad predeterminada es sólo una vista de emergencia: nunca debe
  // bloquear durante 24 h un nuevo intento de ubicación aproximada por IP.
  if (location.source === "default") return;
  try {
    window.localStorage.setItem(storageKey(mapId), JSON.stringify({
      latitude: view.latitude, longitude: view.longitude, zoom: view.zoom,
      city: location.city ?? null, region: location.region ?? null, country: location.country ?? null,
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.warn("No se pudo guardar la vista del mapa.", error);
  }
}

export async function getApproximateIpLocation() {
  const { data, status } = await axiosClient.get("/api/public/location/approximate", { validateStatus: (code) => code === 200 || code === 204 });
  if (status !== 200 || !data || !isCoordinate(Number(data.latitude), -90, 90) || !isCoordinate(Number(data.longitude), -180, 180)) return null;
  return { latitude: Number(data.latitude), longitude: Number(data.longitude), city: data.city ?? null, region: data.region ?? null, country: data.country ?? null, source: "ip" };
}

/** Resolves initial position without requesting browser GPS permission. */
export async function resolveInitialMapLocation(mapId) {
  const saved = getSavedMapLocation(mapId);
  if (saved) return saved;
  try {
    const ipLocation = await getApproximateIpLocation();
    if (ipLocation) {
      const location = { ...ipLocation, zoom: DEFAULT_LOCATION.zoom };
      // Replace an expired state immediately, before Leaflet dispatches its first viewport event.
      saveMapLocation(location, location, mapId);
      return location;
    }
  } catch (error) {
    console.warn("La ubicación aproximada por IP no está disponible; se usará la ubicación predeterminada.", error);
  }
  return getDefaultMapLocation();
}
