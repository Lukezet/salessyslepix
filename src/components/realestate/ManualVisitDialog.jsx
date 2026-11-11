import { useRef, useState } from "react";
import { createManualVisit } from "../../services/visitAppointments";

const fieldClass = "rounded-lg border px-3 py-2";

export default function ManualVisitDialog({ publication, onClose }) {
  const [form, setForm] = useState({ startsAt: "", duration: "45", visitorName: "", visitorEmail: "", visitorPhone: "", note: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (inFlight.current || saved) return;
    const starts = new Date(form.startsAt);
    const duration = Number(form.duration);
    if (!Number.isFinite(starts.getTime()) || starts.getTime() <= Date.now() || duration < 15 || duration > 240) {
      setError("Elegí un horario futuro y una duración de entre 15 y 240 minutos.");
      return;
    }
    inFlight.current = true;
    setSaving(true); setError("");
    try {
      const result = await createManualVisit({
        publicationId: publication.id,
        startsAtUtc: starts.toISOString(),
        endsAtUtc: new Date(starts.getTime() + duration * 60000).toISOString(),
        visitorName: form.visitorName.trim(), visitorEmail: form.visitorEmail.trim().toLowerCase(),
        visitorPhone: form.visitorPhone.trim(), note: form.note.trim(),
      });
      setSaved(result);
    } catch (requestError) {
      setError(requestError.response?.data?.error ?? requestError.response?.data?.message ?? "No se pudo confirmar la carga. Revisá tu agenda antes de reintentar.");
    } finally { inFlight.current = false; setSaving(false); }
  };

  return <div className="fixed inset-0 z-[1000] overflow-y-auto bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="manual-visit-title">
    <form onSubmit={submit} className="mx-auto mt-8 max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-3"><h2 id="manual-visit-title" className="text-xl font-bold">Cargar visita recibida por otro medio</h2><button type="button" disabled={saving} onClick={onClose} aria-label="Cerrar">✕</button></div>
      <p className="mt-3 text-sm text-neutral-600">{publication.title}. La visita quedará confirmada en tu agenda. Ingresá los datos de la persona que va a visitar el inmueble.</p>
      <fieldset disabled={saving || Boolean(saved)} className="mt-5 grid gap-3 disabled:opacity-70">
        <label className="grid gap-1 text-sm">Fecha y hora local<input required type="datetime-local" name="startsAt" value={form.startsAt} onChange={update} className={fieldClass} /></label>
        <label className="grid gap-1 text-sm">Duración en minutos<input required type="number" min="15" max="240" name="duration" value={form.duration} onChange={update} className={fieldClass} /></label>
        <label className="grid gap-1 text-sm">Nombre del visitante<input required maxLength={160} name="visitorName" value={form.visitorName} onChange={update} className={fieldClass} /></label>
        <label className="grid gap-1 text-sm">Correo del visitante<input required maxLength={320} type="email" name="visitorEmail" value={form.visitorEmail} onChange={update} className={fieldClass} /></label>
        <label className="grid gap-1 text-sm">WhatsApp del visitante<input required maxLength={80} type="tel" name="visitorPhone" value={form.visitorPhone} onChange={update} className={fieldClass} /></label>
        <label className="grid gap-1 text-sm">Nota opcional<textarea maxLength={2000} name="note" value={form.note} onChange={update} className={fieldClass} /></label>
        <button className="mt-2 rounded-xl bg-neutral-900 px-4 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Guardando…" : saved ? "Visita registrada" : "Confirmar visita en mi agenda"}</button>
      </fieldset>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      {saved && <div role="status" className="mt-4 text-sm text-neutral-700"><p>Visita confirmada y registrada en tu agenda.</p>{saved.calendarMessage && <p>{saved.calendarMessage}</p>}</div>}
    </form>
  </div>;
}
