import { useEffect, useRef, useState } from "react";
import { getPublicVisitPolicy, getPublicVisitSlots, requestPublicVisit } from "../../services/visitAppointments";

const dateInput = (value) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const fieldClass = "rounded-lg border px-3 py-2";

export default function PublicVisitDialog({ publication, companySlug, agents, onClose }) {
  const [agentId, setAgentId] = useState(agents[0]?.id ?? agents[0]?.userId ?? "");
  const [date, setDate] = useState(dateInput(new Date()));
  const [policy, setPolicy] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [revision, setRevision] = useState(0);
  const [form, setForm] = useState({ visitorName: "", visitorEmail: "", visitorPhone: "", note: "" });
  const [message, setMessage] = useState("");
  const [retryAt, setRetryAt] = useState(null);
  const inFlight = useRef(false);
  const attempt = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    getPublicVisitPolicy(companySlug, { signal: controller.signal }).then(setPolicy)
      .catch((error) => { if (!controller.signal.aborted) setMessage(error.response?.data?.error ?? "No se pudo consultar la política de reservas."); });
    return () => controller.abort();
  }, [companySlug]);

  useEffect(() => {
    if (!policy || !agentId || !date || sent) return;
    const controller = new AbortController();
    setSlots([]); setSlot(null); setLoading(true);
    getPublicVisitSlots(companySlug, { publicationId: publication.id, agentUserId: Number(agentId), date }, { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setSlots(Array.isArray(data) ? data : []); })
      .catch((error) => { if (!controller.signal.aborted) setMessage(error.response?.data?.error ?? "No se pudieron consultar los horarios."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [companySlug, publication.id, agentId, date, policy, revision, sent]);

  const submit = async (event) => {
    event.preventDefault();
    if (inFlight.current || sent) return;
    if (!slot) { setMessage("Elegí un horario para la visita."); return; }
    const payload = { publicationId: publication.id, agentUserId: Number(agentId), startsAtUtc: slot.startsAtUtc, endsAtUtc: slot.endsAtUtc,
      ...form, visitorName: form.visitorName.trim(), visitorEmail: form.visitorEmail.trim().toLowerCase() };
    const fingerprint = JSON.stringify(payload);
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() };
    inFlight.current = true; setSaving(true); setMessage(""); setRetryAt(null);
    try {
      const response = await requestPublicVisit(companySlug, payload, attempt.current.key);
      setSent(true);
      setMessage(response.status === "Expired" ? "Esta solicitud ya había sido registrada y está vencida. Cerrá el formulario para elegir otra visita."
        : "Solicitud registrada. El asesor debe confirmarla; no hace falta volver a enviarla.");
    } catch (error) {
      const data = error.response?.data;
      setMessage(data?.error ?? "No se pudo confirmar el envío. Podés reintentar sin duplicar la solicitud.");
      if (data?.retryAtUtc) setRetryAt(data.retryAtUtc);
      else if (data?.retryAfterSeconds) setRetryAt(new Date(Date.now() + data.retryAfterSeconds * 1000).toISOString());
      if (error.response?.status === 409) setRevision((value) => value + 1);
    } finally { inFlight.current = false; setSaving(false); }
  };
  const maxDate = policy ? dateInput(new Date(Date.now() + policy.maxAdvanceDays * 86400000)) : undefined;
  return <div className="fixed inset-0 z-[1000] overflow-y-auto bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="visit-title">
    <form onSubmit={submit} className="mx-auto mt-8 max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-3"><h2 id="visit-title" className="text-xl font-bold">Coordinar visita</h2><button type="button" disabled={saving} onClick={onClose} aria-label="Cerrar">✕</button></div>
      {policy && <p className="mt-3 text-sm text-neutral-600">Hasta {policy.maxRequestsPerEmail} solicitudes por correo y {policy.maxRequestsPerPhone} por teléfono cada {policy.windowDays} días, con un máximo de {policy.maxPendingPerIdentity} pendientes. Las pendientes vencen a las {policy.pendingExpirationHours} horas o al comenzar la visita, lo que ocurra primero.</p>}
      {!agents.length ? <p className="mt-4">Todavía no hay asesores disponibles.</p> : <fieldset disabled={saving || sent || !policy} className="disabled:opacity-70">
        <label className="mt-5 grid gap-1 text-sm font-medium">Asesor<select required value={agentId} onChange={(e) => setAgentId(e.target.value)} className={fieldClass}>{agents.map((agent) => <option key={agent.id ?? agent.userId} value={agent.id ?? agent.userId}>{agent.name ?? agent.userName}</option>)}</select></label>
        <label className="mt-3 grid gap-1 text-sm font-medium">Día<input required min={dateInput(new Date())} max={maxDate} type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} /></label>
        <fieldset className="mt-4"><legend className="text-sm font-medium">Horario disponible</legend><div className="mt-2 grid grid-cols-3 gap-2">{slots.map((item) => <button key={item.startsAtUtc} type="button" onClick={() => setSlot(item)} aria-pressed={slot?.startsAtUtc === item.startsAtUtc} className={`rounded-lg border px-2 py-2 text-sm ${slot?.startsAtUtc === item.startsAtUtc ? "bg-neutral-900 text-white" : "hover:bg-neutral-50"}`}>{new Date(item.startsAtUtc).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</button>)}{!slots.length && <p role="status" className="col-span-3 text-sm text-neutral-500">{loading ? "Consultando horarios…" : "No hay horarios para ese día."}</p>}</div></fieldset>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm">Tu nombre<input required maxLength={160} autoComplete="name" value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })} className={fieldClass} /></label>
          <label className="grid gap-1 text-sm">Tu correo<input required maxLength={320} type="email" autoComplete="email" value={form.visitorEmail} onChange={(e) => setForm({ ...form, visitorEmail: e.target.value })} className={fieldClass} /></label>
          <label className="grid gap-1 text-sm">WhatsApp<input required maxLength={80} type="tel" autoComplete="tel" value={form.visitorPhone} onChange={(e) => setForm({ ...form, visitorPhone: e.target.value })} className={fieldClass} /></label>
          <label className="grid gap-1 text-sm">Nota opcional<textarea maxLength={2000} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={fieldClass} /></label>
        </div>
        <button disabled={loading || !slot} className="mt-5 w-full rounded-xl bg-neutral-900 px-4 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Enviando…" : sent ? "Solicitud registrada" : "Enviar solicitud"}</button>
      </fieldset>}
      {message && <p role="status" className="mt-4 text-sm text-neutral-700">{message}</p>}
      {retryAt && <p className="mt-2 text-sm text-neutral-600">Podés volver a intentar a partir de {new Date(retryAt).toLocaleString("es-AR")}.</p>}
    </form>
  </div>;
}
