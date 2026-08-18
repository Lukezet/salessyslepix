import { useState } from "react";
import {
  createPublication,
  uploadPropertyImage,
  uploadVehicleImage,
} from "../../services/publications";
import PropertyLocationPicker from "../realestate/PropertyLocationPicker";
import PropertyBulkImport from "./PropertyBulkImport";

const PROPERTY_TYPES = [
  [1, "Casa"],
  [2, "Departamento"],
  [3, "Terreno"],
  [4, "Local comercial"],
  [5, "Oficina"],
  [6, "Galpón"],
];
const bool = (value) =>
  value === "yes" ? true : value === "no" ? false : null;
const numberOrNull = (value) => (value === "" ? null : Number(value));
const EMPTY_LOCATION = {
  address: "",
  street: "",
  streetNumber: "",
  locality: "",
  province: "",
  addressLatitude: null,
  addressLongitude: null,
  pinLatitude: null,
  pinLongitude: null,
};

export default function PublicationCreateDialog({ type, onClose }) {
  const isProperty = type === "property";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("manual");
  const [files, setFiles] = useState([]);
  const [location, setLocation] = useState(EMPTY_LOCATION);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    operation: 1,
    propertyType: 1,
    totalAreaM2: "",
    coveredAreaM2: "",
    ageYears: "",
    rooms: "",
    bedrooms: "",
    bathrooms: "",
    garages: "",
    orientation: "",
    petsAllowed: "",
    childrenAllowed: "",
    isCreditEligible: "",
    isGatedCommunity: "",
    rentalAdjustment: "",
    make: "",
    model: "",
    version: "",
    year: "",
    mileageKm: "",
    color: "",
    fuelType: "",
    condition: 2,
    transmission: "",
    bodyType: "",
    doors: "",
    isFirstOwner: "",
  });
  const set = (name, value) =>
    setForm((current) => ({ ...current, [name]: value }));
  const addFiles = (selected) =>
    setFiles((current) => [...current, ...Array.from(selected)].slice(0, 12));
  const removeFile = (index) =>
    setFiles((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
  const submit = async (event) => {
    event.preventDefault();
    if (files.length < 3) {
      setError(
        `El ${isProperty ? "inmueble" : "vehículo"} necesita al menos tres fotos.`,
      );
      return;
    }
    if (
      isProperty &&
      location.pinLatitude == null &&
      location.addressLatitude == null
    ) {
      setError(
        "Seleccioná una ubicación en el mapa o ingresá una dirección que podamos localizar.",
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        type: isProperty ? 1 : 2,
        operation: isProperty ? Number(form.operation) : 1,
        title: form.title,
        description: form.description,
        price: Number(form.price),
        currency: 1,
      };
      if (isProperty) {
        payload.imageUrls = await Promise.all(files.map(uploadPropertyImage));
        payload.location = {
          street: location.street || location.address,
          streetNumber: location.streetNumber || null,
          locality: location.locality || null,
          province: location.province || null,
          addressLatitude: location.addressLatitude,
          addressLongitude: location.addressLongitude,
          pinLatitude: location.pinLatitude,
          pinLongitude: location.pinLongitude,
        };
        payload.property = {
          propertyType: Number(form.propertyType),
          totalAreaM2: numberOrNull(form.totalAreaM2),
          coveredAreaM2: numberOrNull(form.coveredAreaM2),
          ageYears: numberOrNull(form.ageYears),
          rooms: numberOrNull(form.rooms),
          bedrooms: numberOrNull(form.bedrooms),
          bathrooms: numberOrNull(form.bathrooms),
          garages: numberOrNull(form.garages),
          orientation: form.orientation || null,
          petsAllowed: bool(form.petsAllowed),
          childrenAllowed: bool(form.childrenAllowed),
          isCreditEligible: bool(form.isCreditEligible),
          isGatedCommunity: bool(form.isGatedCommunity),
          rentalAdjustment:
            Number(form.operation) === 2
              ? form.rentalAdjustment.trim() || null
              : null,
        };
      } else {
        payload.imageUrls = await Promise.all(files.map(uploadVehicleImage));
        payload.vehicle = {
          make: form.make,
          model: form.model,
          version: form.version || null,
          year: numberOrNull(form.year),
          mileageKm: numberOrNull(form.mileageKm),
          color: form.color || null,
          fuelType: form.fuelType || null,
          condition: Number(form.condition),
          transmission: form.transmission || null,
          bodyType: form.bodyType || null,
          doors: numberOrNull(form.doors),
          isFirstOwner: bool(form.isFirstOwner),
        };
      }
      await createPublication(payload);
      onClose();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "No se pudo guardar el borrador.",
      );
    } finally {
      setSaving(false);
    }
  };
  const Input = ({ name, label, type = "text", required = false }) => (
    <label className="grid gap-1 text-sm">
      <span>{label}</span>
      <input
        required={required}
        type={type}
        min={type === "number" ? "0" : undefined}
        value={form[name]}
        onChange={(event) => set(name, event.target.value)}
        className="rounded-lg border px-3 py-2"
      />
    </label>
  );
  const Choice = ({ name, label }) => (
    <label className="grid gap-1 text-sm">
      <span>{label}</span>
      <select
        value={form[name]}
        onChange={(event) => set(name, event.target.value)}
        className="rounded-lg border px-3 py-2"
      >
        <option value="">No especificar</option>
        <option value="yes">Sí</option>
        <option value="no">No</option>
      </select>
    </label>
  );
  return (
    <div
      className="fixed inset-0 z-[1000] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={isProperty ? "Crear inmueble" : "Crear vehículo"}
    >
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {isProperty ? "Crear inmueble" : "Crear vehículo"}
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Completá primero lo indispensable; los detalles opcionales mejoran
              la publicación.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100"
          >
            ✕
          </button>
        </div>
        {isProperty && (
          <div className="mt-4 inline-flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={`rounded-md px-3 py-2 text-sm font-semibold ${mode === "manual" ? "bg-white shadow" : "text-slate-600"}`}
            >
              Carga manual
            </button>
            <button
              type="button"
              onClick={() => setMode("excel")}
              className={`rounded-md px-3 py-2 text-sm font-semibold ${mode === "excel" ? "bg-white shadow" : "text-slate-600"}`}
            >
              Importar Excel
            </button>
          </div>
        )}
        {isProperty && mode === "excel" ? (
          <div className="mt-5">
            <PropertyBulkImport onDone={onClose} />
          </div>
        ) : (
          <>
            <section className="mt-5 rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">
                Datos principales
              </h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input name="title" label="Título" required />
                <Input name="price" label="Precio" type="number" required />
                {isProperty && (
                  <label className="grid gap-1 text-sm">
                    <span>Operación</span>
                    <select
                      value={form.operation}
                      onChange={(event) => set("operation", event.target.value)}
                      className="rounded-lg border px-3 py-2"
                    >
                      <option value="1">Venta</option>
                      <option value="2">Alquiler</option>
                    </select>
                  </label>
                )}
                <label className="grid gap-1 text-sm md:col-span-2">
                  <span>Descripción</span>
                  <textarea
                    required
                    value={form.description}
                    onChange={(event) => set("description", event.target.value)}
                    className="min-h-24 rounded-lg border px-3 py-2"
                  />
                </label>
                {isProperty ? (
                  <>
                    <label className="grid gap-1 text-sm">
                      <span>Tipo</span>
                      <select
                        value={form.propertyType}
                        onChange={(event) =>
                          set("propertyType", event.target.value)
                        }
                        className="rounded-lg border px-3 py-2"
                      >
                        {PROPERTY_TYPES.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {Number(form.operation) === 2 && (
                      <Input name="rentalAdjustment" label="Ajuste / aumento" />
                    )}
                  </>
                ) : (
                  <>
                    <Input name="make" label="Marca" required />
                    <Input name="model" label="Modelo" required />
                  </>
                )}
              </div>
            </section>
            <details className="mt-4 rounded-xl border border-slate-200 p-4">
              <summary className="cursor-pointer font-semibold text-slate-900">
                {isProperty
                  ? "Características y comodidades opcionales"
                  : "Ficha técnica opcional"}
              </summary>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {isProperty ? (
                  <>
                    <Input
                      name="totalAreaM2"
                      label="m² totales"
                      type="number"
                    />
                    <Input
                      name="coveredAreaM2"
                      label="m² cubiertos"
                      type="number"
                    />
                    <Input
                      name="ageYears"
                      label="Antigüedad (años)"
                      type="number"
                    />
                    <Input name="rooms" label="Ambientes" type="number" />
                    <Input name="bedrooms" label="Dormitorios" type="number" />
                    <Input name="bathrooms" label="Baños" type="number" />
                    <Input name="garages" label="Cocheras" type="number" />
                    <Input name="orientation" label="Orientación" />
                    <Choice name="petsAllowed" label="¿Permite mascotas?" />
                    <Choice name="childrenAllowed" label="¿Permite niños?" />
                    <Choice name="isCreditEligible" label="¿Apto crédito?" />
                    <Choice name="isGatedCommunity" label="¿Barrio cerrado?" />
                  </>
                ) : (
                  <>
                    <Input name="version" label="Versión" />
                    <Input name="year" label="Año" type="number" />
                    <Input name="mileageKm" label="Kilometraje" type="number" />
                    <Input name="color" label="Color" />
                    <Input name="fuelType" label="Combustible" />
                    <Input name="transmission" label="Transmisión" />
                    <Input name="bodyType" label="Carrocería" />
                    <Input name="doors" label="Puertas" type="number" />
                    <label className="grid gap-1 text-sm">
                      <span>Estado</span>
                      <select
                        value={form.condition}
                        onChange={(event) =>
                          set("condition", event.target.value)
                        }
                        className="rounded-lg border px-3 py-2"
                      >
                        <option value="2">Usado</option>
                        <option value="1">Nuevo</option>
                      </select>
                    </label>
                    <Choice name="isFirstOwner" label="¿Primer dueño?" />
                  </>
                )}
              </div>
            </details>
            <section className="mt-4 rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold">
                Fotos del {isProperty ? "inmueble" : "vehículo"}
              </h3>
              <p className="mt-1 text-sm text-neutral-600">
                Subí 3 a 12 imágenes. La primera será la portada.
              </p>
              <input
                id={`${isProperty ? "property" : "vehicle"}-photos`}
                className="sr-only"
                accept="image/*"
                type="file"
                multiple
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = "";
                }}
              />
              <label
                htmlFor={`${isProperty ? "property" : "vehicle"}-photos`}
                className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-sky-700 bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-sky-700"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 16V4m0 0-4 4m4-4 4 4M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
                </svg>
                Seleccionar fotos
              </label>
              <span className="ml-3 text-sm text-neutral-600">
                {files.length
                  ? `${files.length} foto(s) seleccionada(s)`
                  : "JPG, PNG o WebP"}
              </span>
              {files.length > 0 && (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {files.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                    >
                      <span className="truncate">
                        {index === 0 ? "Portada · " : ""}
                        {file.name}
                      </span>
                      <button
                        type="button"
                        className="text-red-700"
                        onClick={() => removeFile(index)}
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            {isProperty && (
              <PropertyLocationPicker value={location} onChange={setLocation} />
            )}
            {error && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                disabled={saving}
                className="btn-custom rounded-lg px-5 py-2.5 disabled:opacity-60"
              >
                {saving ? "Guardando…" : "Guardar borrador"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
