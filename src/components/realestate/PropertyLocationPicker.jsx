import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useInitialMapLocation } from "../../hooks/useInitialMapLocation";
import { reversePropertyAddress, searchPropertyAddress } from "../../services/propertyGeocoding";

function MapClick({ onPick }) {
  useMapEvents({ click: (event) => onPick(event.latlng.lat, event.latlng.lng) });
  return null;
}

function SearchCenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 16);
  }, [map, position]);
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
  const [searchCenter, setSearchCenter] = useState(null);
  const pending = useRef(null);
  const timer = useRef(null);
  const revision = useRef(0);
  const latestValue = useRef(value);
  useEffect(() => { latestValue.current = value; }, [value]);
  const cancelPrevious = () => {
    window.clearTimeout(timer.current);
    pending.current?.abort();
    pending.current = null;
    return ++revision.current;
  };
  useEffect(() => () => {
    window.clearTimeout(timer.current);
    pending.current?.abort();
    revision.current += 1;
  }, []);

  const reverseGeocode = async (latitude, longitude) => {
    const request = cancelPrevious();
    const controller = new AbortController();
    pending.current = controller;
    const picked = { ...latestValue.current, addressLatitude: null, addressLongitude: null, pinLatitude: latitude, pinLongitude: longitude };
    latestValue.current = picked;
    onChange(picked);
    setStatus("Buscando dirección del punto elegido…");
    try {
      const result = await reversePropertyAddress(latitude, longitude, { signal: controller.signal });
      if (request !== revision.current) return;
      const updated = { ...latestValue.current, ...mapAddress(result), addressLatitude: latitude, addressLongitude: longitude, pinLatitude: latitude, pinLongitude: longitude };
      latestValue.current = updated;
      onChange(updated);
      setStatus("Dirección actualizada. Se conserva el punto que elegiste.");
    } catch {
      if (request !== revision.current) return;
      setStatus("No pudimos identificar la dirección. Se conserva el punto que elegiste.");
    }
  };

  const editAddress = (address) => {
    const request = cancelPrevious();
    const edited = { ...latestValue.current, address, street: address, addressLatitude: null, addressLongitude: null };
    latestValue.current = edited;
    onChange(edited);
    setStatus("");
    const query = address.trim();
    if (!query) return;
    timer.current = window.setTimeout(async () => {
      const controller = new AbortController();
      pending.current = controller;
      setStatus("Buscando la dirección en el mapa…");
      try {
        const result = await searchPropertyAddress(query, { signal: controller.signal });
        if (request !== revision.current) return;
        const latitude = Number(result?.lat), longitude = Number(result?.lon);
        if (!result || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          setStatus("No encontramos la dirección. Elegí su ubicación en el mapa.");
          return;
        }
        const updated = { ...latestValue.current, ...mapAddress(result), addressLatitude: latitude, addressLongitude: longitude, pinLatitude: latitude, pinLongitude: longitude };
        latestValue.current = updated;
        onChange(updated);
        setSearchCenter([latitude, longitude]);
        setStatus("Ubicación encontrada. Podés ajustar el punto en el mapa.");
      } catch {
        if (request !== revision.current) return;
        setStatus("No se pudo buscar la dirección. Elegí su ubicación en el mapa.");
      }
    }, 700);
  };

  const latitude = value.pinLatitude ?? value.addressLatitude ?? initialLocation?.latitude;
  const longitude = value.pinLongitude ?? value.addressLongitude ?? initialLocation?.longitude;
  return <section className="mt-5 border-t pt-5"><h3 className="text-base font-semibold">Ubicación</h3><p className="mt-1 text-sm text-neutral-600">La dirección se mantiene interna. En el portal público sólo se usa una ubicación aproximada.</p>
    <label className="mt-3 grid gap-1 text-sm"><span>Dirección</span><input required value={value.address} onChange={(event) => editAddress(event.target.value)} placeholder="Ej.: Av. Santa Fe 1800, Palermo, CABA" className="rounded-lg border px-3 py-2" /></label>
    <div className="mt-3 h-64 overflow-hidden rounded-xl border border-neutral-200">{!initialLocation || latitude == null || longitude == null ? <div className="grid h-full place-items-center text-sm text-neutral-600">Preparando el mapa…</div> : <MapContainer center={[latitude, longitude]} zoom={value.pinLatitude != null ? 16 : initialLocation.zoom} className="h-full w-full" aria-label="Seleccionar ubicación del inmueble"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><SearchCenter position={searchCenter} /><MapClick onPick={reverseGeocode} />{value.pinLatitude != null && <Marker position={[value.pinLatitude, value.pinLongitude]} />}</MapContainer>}</div>
    <p className="mt-2 text-xs text-neutral-600">{status || "Hacé clic en el mapa para seleccionar una ubicación aproximada."}</p>
  </section>;
}
