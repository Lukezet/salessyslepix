import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DetailMediaGallery from "../DetailMediaGallery";
import MediaAddButton from "../MediaAddButton";
import VideoPicker from "../VideoPicker";
import { useTenantConfig } from "../../store/tenantConfig";
import { uploadVideo, videosEnabled } from "../../services/videos";
import { closePublication, getPublicPublication, updatePublication, uploadPropertyImage, uploadVehicleImage } from "../../services/publications";
import PublicVisitDialog from "../realestate/PublicVisitDialog";
import { useUsdRate } from "../../store/usdRate";
import { useAuth } from "../../store/auth";

function imagesOf(publication) { return (publication?.media ?? publication?.images ?? publication?.imageUrls ?? []).map((item) => typeof item === "string" ? item : item?.url).filter(Boolean); }
function propertyOf(publication) { return publication?.property ?? publication?.propertyDetails ?? null; }
function isProperty(publication) { return publication?.type === "Property" || publication?.type === "property" || Number(publication?.type) === 1; }
const money = (value, currency) => new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value) || 0);
const isUsd = (publication) => publication?.currency === "USD" || Number(publication?.currency) === 1;

export default function PublicationDetail({ companySlug, publicationSlug, appointmentsEnabled }) {
  const navigate = useNavigate();
  const [publication, setPublication] = useState(null);
  const [error, setError] = useState("");
  const roles = useAuth((state) => state.roles);
  const features = useTenantConfig((state) => state.features);
  const { rate: usdRate, load: loadUsdRate } = useUsdRate();
  useEffect(() => { const controller = new AbortController(); setError(""); setPublication(null); getPublicPublication(companySlug, publicationSlug, { signal: controller.signal }).then(setPublication).catch((requestError) => { if (requestError?.name !== "CanceledError") setError("No se pudo cargar la publicación."); }); return () => controller.abort(); }, [companySlug, publicationSlug]);
  useEffect(() => { if (isUsd(publication) && usdRate == null) loadUsdRate(); }, [publication, loadUsdRate, usdRate]);
  if (error) return <p className="text-red-700">{error}</p>;
  if (!publication) return <div className="grid gap-6 md:grid-cols-2"><div className="h-72 animate-pulse rounded-xl bg-neutral-200" /><div className="space-y-4"><div className="h-8 w-2/3 animate-pulse rounded bg-neutral-200" /><div className="h-6 w-1/3 animate-pulse rounded bg-neutral-100" /></div></div>;
  const property = propertyOf(publication); const vehicle = publication.vehicle ?? publication.vehicleDetails; const propertyPublication = isProperty(publication);
  const detailsEnabled = propertyPublication
    ? features.realEstate && (features.components?.realEstateDetails ?? true)
    : features.vehicles && (features.components?.vehicleDetails ?? true);
  if (!detailsEnabled) return <p>El detalle de esta categoría no está habilitado para este portal.</p>;
  const canEdit = roles?.some((role) => ["RealEstateAgent", "RealEstateCoordinator", "Admin", "PlatformAdmin"].includes(role));
  const reload = async () => {
    try { setPublication(await getPublicPublication(companySlug, publicationSlug)); }
    catch { setError("No se pudo actualizar la publicación."); }
  };
  return <section className="mx-auto max-w-6xl"><button type="button" onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2" aria-label="Volver al catálogo"><span aria-hidden="true" className="text-xl leading-none">←</span> Volver al catálogo</button><article className="grid gap-6 md:grid-cols-2"><div><DetailMediaGallery images={imagesOf(publication)} alt={publication.title ?? "Publicación"} urls={publication.videoUrls ?? []} category={propertyPublication ? "realEstate" : "vehicles"} /></div><div className="w-full rounded-2xl bg-neutral-100 p-5 md:max-w-xl md:justify-self-start"><span className="rounded-full bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-white">{propertyPublication ? (Number(publication.operation) === 2 || publication.operation === "Rent" ? "Alquiler" : "Venta") : "Vehículo"}</span><h1 className="mt-3 text-3xl font-bold">{publication.title}</h1><p className="mt-3 text-2xl font-semibold">{money(publication.price, isUsd(publication) ? "USD" : "ARS")} <span className={`text-base font-semibold ${isUsd(publication) ? "rounded-full bg-amber-100 px-2 py-0.5 text-amber-900" : "text-neutral-500"}`}>{isUsd(publication) ? "USD" : "ARS"}</span></p>{isUsd(publication) && typeof usdRate === "number" && <p className="mt-1 text-sm text-neutral-600">({money(Number(publication.price) * usdRate, "ARS")} ARS)</p>}<p className="mt-5 whitespace-pre-line text-neutral-700">{publication.description}</p><DetailFacts data={propertyPublication ? property : vehicle} property={propertyPublication} />{propertyPublication && appointmentsEnabled && <VisitRequest publication={publication} companySlug={companySlug} />}{canEdit && <PublicationActions publication={publication} propertyPublication={propertyPublication} onSaved={reload} onClosed={() => navigate(-1)} />}</div></article></section>;
}

function PublicationActions({ publication, propertyPublication, onSaved, onClosed }) {
  const [editing, setEditing] = useState(false);
  const [closing, setClosing] = useState(false);
  const close = async () => {
    if (!window.confirm("¿Marcar esta publicación como no disponible? Dejará de mostrarse en el catálogo y en el mapa.")) return;
    try { setClosing(true); await closePublication(publication.id); onClosed(); }
    finally { setClosing(false); }
  };
  return <><div className="mt-6 flex flex-wrap gap-2 border-t border-neutral-300 pt-5"><button type="button" onClick={() => setEditing(true)} className="rounded-lg border border-neutral-900 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-900 hover:text-white">Editar publicación</button><button type="button" disabled={closing} onClick={close} className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-700 hover:text-white disabled:opacity-60">{closing ? "Actualizando…" : "Marcar no disponible"}</button></div>{editing && <PublicationEditDialog publication={publication} propertyPublication={propertyPublication} onClose={() => setEditing(false)} onSaved={async () => { setEditing(false); await onSaved(); }} />}</>;
}

function PublicationEditDialog({ publication, propertyPublication, onClose, onSaved }) {
  const [form, setForm] = useState({ title: publication.title ?? "", description: publication.description ?? "", price: String(publication.price ?? ""), currency: isUsd(publication) ? "1" : "2" });
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const existingImages = imagesOf(publication);
  const features = useTenantConfig((state) => state.features);
  const category = propertyPublication ? "realEstate" : "vehicles";
  const [videoFiles, setVideoFiles] = useState([]);
  const [videoUrls, setVideoUrls] = useState(publication.videoUrls ?? []);
  const submit = async (event) => {
    event.preventDefault();
    if (!Number.isFinite(Number(form.price)) || Number(form.price) <= 0) return setError("Ingresá un precio mayor a cero.");
    try {
      setSaving(true); setError("");
      const uploadImage = propertyPublication ? uploadPropertyImage : uploadVehicleImage;
      const uploaded = files.length ? await Promise.all(files.map(uploadImage)) : [];
      await updatePublication(publication.id, { title: form.title, description: form.description, price: Number(form.price), currency: Number(form.currency), imageUrls: [...existingImages, ...uploaded], ...(videosEnabled(features, category) ? { videoUrls: [...videoUrls, ...await Promise.all(videoFiles.map((file) => uploadVideo(file, category)))] } : {}) });
      await onSaved();
    } catch (requestError) { setError(requestError?.response?.data?.error ?? "No se pudo actualizar la publicación."); }
    finally { setSaving(false); }
  };
  return <div className="fixed inset-0 z-[1000] overflow-y-auto bg-black/50 p-4"><form onSubmit={submit} className="mx-auto mt-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-950">Editar publicación</h2><p className="mt-1 text-sm text-neutral-600">Actualizá el contenido visible del catálogo.</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100" aria-label="Cerrar">✕</button></div><div className="mt-5 grid gap-3 md:grid-cols-2"><label className="grid gap-1 text-sm md:col-span-2"><span>Título</span><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="rounded-lg border px-3 py-2" /></label><label className="grid gap-1 text-sm"><span>Precio</span><input required min="0" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="rounded-lg border px-3 py-2" /></label><label className="grid gap-1 text-sm"><span>Moneda</span><select value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })} className="rounded-lg border px-3 py-2"><option value="1">USD — dólar estadounidense</option><option value="2">ARS — peso argentino</option></select></label><label className="grid gap-1 text-sm md:col-span-2"><span>Descripción</span><textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-28 rounded-lg border px-3 py-2" /></label></div><section className="mt-4 rounded-xl border border-slate-200 p-4"><h3 className="font-semibold">Fotos</h3><p className="mt-1 text-sm text-neutral-600">Se conservarán las {existingImages.length} fotos actuales. Podés sumar hasta {Math.max(0, 12 - existingImages.length)} más.</p>{videosEnabled(features, category) ? <VideoPicker files={videoFiles} onChange={setVideoFiles} urls={videoUrls} onUrlsChange={setVideoUrls} disabled={saving} imagePicker={<MediaAddButton disabled={saving || existingImages.length + files.length >= 12} onFiles={(selected) => setFiles([...files, ...selected].slice(0, Math.max(0, 12 - existingImages.length)))} />} /> : <div className="mt-3"><MediaAddButton disabled={saving || existingImages.length + files.length >= 12} onFiles={(selected) => setFiles([...files, ...selected].slice(0, Math.max(0, 12 - existingImages.length)))} /></div>}{files.length > 0 && <p className="mt-2 text-sm text-neutral-700">{files.length} foto(s) nueva(s) seleccionada(s).</p>}</section>{error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2 font-medium text-slate-700 hover:bg-slate-100">Cancelar</button><button disabled={saving} className="rounded-lg bg-neutral-900 px-5 py-2.5 font-semibold text-white hover:bg-neutral-800 disabled:opacity-60">{saving ? "Guardando…" : "Guardar cambios"}</button></div></form></div>;
}

function DetailFacts({ data, property }) { const entries = property ? [["Tipo", data?.propertyType], ["Ambientes", data?.rooms], ["Dormitorios", data?.bedrooms], ["Baños", data?.bathrooms], ["Cocheras", data?.garages], ["Superficie cubierta", data?.coveredAreaM2 && `${data.coveredAreaM2} m²`], ["Superficie total", data?.totalAreaM2 && `${data.totalAreaM2} m²`]] : [["Marca", data?.brand], ["Modelo", data?.model], ["Año", data?.year], ["Color", data?.color], ["Kilometraje", data?.mileage && `${data.mileage} km`]]; const visible = entries.filter(([, value]) => value !== null && value !== undefined && value !== ""); if (!visible.length) return null; return <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-neutral-300 pt-5 text-sm">{visible.map(([label, value]) => <div key={label}><dt className="text-neutral-500">{label}</dt><dd className="font-semibold">{value}</dd></div>)}</dl>; }

function VisitRequest({ publication, companySlug }) { const agents = publication.agents ?? publication.advisors ?? []; const [open, setOpen] = useState(false); return <><button type="button" onClick={() => setOpen(true)} className="mt-7 w-full rounded-xl bg-neutral-900 px-4 py-3 font-semibold text-white hover:bg-neutral-800">Coordinar visita</button>{open && <PublicVisitDialog publication={publication} companySlug={companySlug} agents={agents} onClose={() => setOpen(false)} />}</>; }
