import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useInitialMapLocation } from "../../hooks/useInitialMapLocation";
import { reversePropertyAddress, searchPropertyAddress } from "../../services/propertyGeocoding";

function MapClick({ onPick }) {
  useMapEvents({ click: (event) => onPick(event.latlng.lat, event.latlng.lng) });
  return null;
}

function mapAddress(result) {
  const address = result.address ?? {};
  return {
    address: result.display_name ?? "",
    street: [address.road, address.house_number].filter(Boolean).join(" ") || result.display_name || "",
    streetNumber: address.house_number ?? "",
    locality: address.city ?? address.town ?? address.village ?? address.suburb ?? "",
    province: address.state ?? "",
  };
}

/** An internal location picker. The precise coordinates are never used by public portal components. */
export default function PropertyLocationPicker({ value, onChange }) {
  const initialLocation = useInitialMapLocation("property-editor");
  const [status, setStatus] = useState("");
  const lastQuery = useRef("");

  const reverseGeocode = async (latitude, longitude) => {
    setStatus("Buscando dirección…");
    try {
      const result = await reversePropertyAddress(latitude, longitude);
      onChange({ ...mapAddress(result), addressLatitude: latitude, addressLongitude: longitude, pinLatitude: latitude, pinLongitude: longitude });
      setStatus("Dirección actualizada desde el mapa.");
    } catch {
      onChange({ ...value, addressLatitude: null, addressLongitude: null, pinLatitude: latitude, pinLongitude: longitude });
      setStatus("No pudimos identificar la dirección. Podés escribirla y usar este punto aproximado.");
    }
  };

  useEffect(() => {
    const query = value.address?.trim();
    if (!query || query === lastQuery.current) return undefined;
    lastQuery.current = query;
    const timer = window.setTimeout(async () => {
      setStatus("Buscando la dirección en el mapa…");
      try {
        const result = await searchPropertyAddress(query);
        if (!result) { setStatus("No encontramos la dirección. Elegí su ubicación aproximada en el mapa."); return; }
        const latitude = Number(result.lat); const longitude = Number(result.lon);
        onChange({ ...value, ...mapAddress(result), addressLatitude: latitude, addressLongitude: longitude, pinLatitude: latitude, pinLongitude: longitude });
        setStatus("Ubicación encontrada y marcada en el mapa.");
      } catch { setStatus("No se pudo buscar la dirección. Elegí su ubicación aproximada en el mapa."); }
    }, 700);
    return () => window.clearTimeout(timer);
  // The picker must only geocode address edits; depending on the full value would loop after geocoding updates coordinates.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.address]);

  const latitude = value.pinLatitude ?? value.addressLatitude ?? initialLocation?.latitude;
  const longitude = value.pinLongitude ?? value.addressLongitude ?? initialLocation?.longitude;
  return <section className="mt-5 border-t pt-5"><h3 className="text-base font-semibold">Ubicación</h3><p className="mt-1 text-sm text-neutral-600">La dirección se mantiene interna. En el portal público sólo se usa una ubicación aproximada.</p>
    <label className="mt-3 grid gap-1 text-sm"><span>Dirección</span><input required value={value.address} onChange={(event) => onChange({ ...value, address: event.target.value, street: event.target.value, addressLatitude: null, addressLongitude: null })} placeholder="Ej.: Av. Santa Fe 1800, Palermo, CABA" className="rounded-lg border px-3 py-2" /></label>
    <div className="mt-3 h-64 overflow-hidden rounded-xl border border-neutral-200">{!initialLocation || latitude == null || longitude == null ? <div className="grid h-full place-items-center text-sm text-neutral-600">Preparando el mapa…</div> : <MapContainer key={`${latitude}-${longitude}`} center={[latitude, longitude]} zoom={value.pinLatitude != null ? 16 : initialLocation.zoom} className="h-full w-full" aria-label="Seleccionar ubicación del inmueble"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><MapClick onPick={reverseGeocode} />{value.pinLatitude != null && <Marker position={[value.pinLatitude, value.pinLongitude]} />}</MapContainer>}</div>
    <p className="mt-2 text-xs text-neutral-600">{status || "Hacé clic en el mapa para seleccionar una ubicación aproximada."}</p>
  </section>;
}
