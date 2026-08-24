import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { addAvailability, approveVisitRequest, getCalendarStatus, getMyAvailability, getMyVisitRequests, rejectVisitRequest, removeAvailability, rescheduleVisit } from "../../services/visitAppointments";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const INITIAL = { dayOfWeek: "1", startsAt: "09:00", endsAt: "13:00", slotDurationMinutes: "45" };
const errorOf = (e, fallback) => e?.response?.data?.error ?? e?.response?.data?.message ?? Object.values(e?.response?.data?.errors ?? {}).flat()[0] ?? e?.message ?? fallback;
const timeOnly = (value) => /^\d{2}:\d{2}$/.test(value ?? "") ? `${value}:00` : value;
const dateTimeInputValue = (value) => String(value ?? "").slice(0, 16);
const dateTimeInputToUtc = (value) => new Date(`${value}:00Z`).toISOString();
const formatAdvisorPhone = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length === 10 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : digits;
};
const statusStyle = {
  Pending: "border-amber-300 bg-amber-50/70",
  Confirmed: "border-emerald-300 bg-emerald-50/70",
  Rejected: "border-red-300 bg-red-50/70",
  Cancelled: "border-slate-300 bg-slate-50",
};
const statusLabel = { Pending: "Pendiente", Confirmed: "Confirmada", Rejected: "Rechazada", Cancelled: "Cancelada" };

export default function AgentScheduleDialog({ onClose }) {
  const [availability, setAvailability] = useState([]); const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(INITIAL); const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState(""); const [calendarVisit, setCalendarVisit] = useState(null);
  const [calendarStatus, setCalendarStatus] = useState(null); const [checkingCalendar, setCheckingCalendar] = useState(false);
  const [rescheduling, setRescheduling] = useState(null); const [detailsVisit, setDetailsVisit] = useState(null); const [newStart, setNewStart] = useState("");
  const refresh = async () => {
    try { setLoadError(""); const [ranges, visits] = await Promise.all([getMyAvailability(), getMyVisitRequests()]); setAvailability(ranges); setRequests(visits); }
    catch (e) { setLoadError(errorOf(e, "No se pudo cargar la agenda.")); }
  };
  useEffect(() => { refresh(); }, []);
  const save = async (event) => {
    event.preventDefault();
    try { setMessage(""); await addAvailability({ ...form, startsAt: timeOnly(form.startsAt), endsAt: timeOnly(form.endsAt), dayOfWeek: Number(form.dayOfWeek), slotDurationMinutes: Number(form.slotDurationMinutes) }); setForm(INITIAL); await refresh(); }
    catch (e) { setMessage(errorOf(e, "No se pudo agregar el horario.")); }
  };
  const action = async (id, fn, request = null) => {
    try { setMessage(""); const updated = await fn(id); if (request) setCalendarVisit(updated ?? request); await refresh(); }
    catch (e) { setMessage(errorOf(e, "No se pudo actualizar la solicitud.")); }
  };
  const openReschedule = (request) => { setNewStart(dateTimeInputValue(request.startsAtUtc)); setRescheduling(request); };
  const saveReschedule = async (event) => {
    event.preventDefault();
    try { setMessage(""); const updated = await rescheduleVisit(rescheduling.id, dateTimeInputToUtc(newStart)); setCalendarVisit(updated ?? rescheduling); setRescheduling(null); await refresh(); }
    catch (e) { setMessage(errorOf(e, "No se pudo reprogramar la visita.")); }
  };
  const checkCalendar = async () => {
    try { setCheckingCalendar(true); setCalendarStatus(await getCalendarStatus()); }
    catch (e) { setCalendarStatus({ connected: false, message: errorOf(e, "No se pudo comprobar el calendario central.") }); }
    finally { setCheckingCalendar(false); }
  };

  return createPortal(<div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/55 p-4 sm:p-6" role="dialog" aria-modal="true"><div className="mx-auto my-4 max-w-4xl rounded-2xl bg-white p-5 text-slate-900 shadow-2xl sm:p-6">
    <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">Agenda de visitas</h2><p className="mt-1 text-sm text-neutral-600">Definí tu disponibilidad y gestioná las solicitudes asignadas.</p></div><button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-xl leading-none hover:bg-neutral-100" aria-label="Cerrar">×</button></div>
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"><span className="text-neutral-700">Calendario central</span><button type="button" onClick={checkCalendar} disabled={checkingCalendar} className="rounded-lg border border-slate-400 px-3 py-1.5 font-medium text-slate-800 hover:bg-white disabled:opacity-60">{checkingCalendar ? "Comprobando…" : "Comprobar conexión"}</button>{calendarStatus && <span className={calendarStatus.connected ? "text-emerald-800" : "text-amber-800"}>{calendarStatus.message}</span>}</div>
    <form onSubmit={save} className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-5">
      <label className="grid gap-1 text-sm font-medium">Día<select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2 py-2">{DAYS.map((day, value) => <option value={value} key={day}>{day}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-medium">Desde<input required type="time" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2 py-2" /></label>
      <label className="grid gap-1 text-sm font-medium">Hasta<input required type="time" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2 py-2" /></label>
      <label className="grid gap-1 text-sm font-medium">Duración<select value={form.slotDurationMinutes} onChange={(e) => setForm({ ...form, slotDurationMinutes: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2 py-2"><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option></select></label>
      <button className="self-end rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800">Agregar horario</button>
    </form>
    {loadError && <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900"><span>No se pudo cargar la agenda actual.</span><button type="button" onClick={refresh} className="font-semibold underline">Reintentar</button></div>}
    {message && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}
    <section className="mt-5"><h3 className="font-semibold">Disponibilidad semanal</h3><div className="mt-2 grid gap-2 sm:grid-cols-7">{DAYS.map((day, index) => <div key={day} className="min-h-24 rounded-lg border border-slate-200 bg-slate-50 p-2"><strong className="text-xs">{day}</strong>{availability.filter((item) => Number(item.dayOfWeek) === index).map((item) => <button key={item.id} type="button" onClick={() => action(item.id, removeAvailability)} title="Quitar disponibilidad" className="mt-2 block w-full rounded-md bg-emerald-100 px-2 py-1 text-left text-xs font-medium text-emerald-900">{String(item.startsAt).slice(0, 5)}–{String(item.endsAt).slice(0, 5)} ×</button>)}</div>)}</div></section>
    <section className="mt-6"><h3 className="font-semibold">Solicitudes de visita</h3><div className="mt-2 space-y-2">{requests.length ? requests.map((request) => <article key={request.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-sm ${statusStyle[request.status] ?? "border-slate-200 bg-white"}`}><div><strong>{request.visitorName}</strong><span className="ml-2 text-neutral-600">{new Date(request.startsAtUtc).toLocaleString()}</span><span className="ml-2 font-medium">{statusLabel[request.status] ?? request.status}</span><p className="text-neutral-600">{request.visitorEmail}</p></div><div className="flex items-center gap-2"><button type="button" className="rounded-lg border border-slate-400 px-3 py-1 text-slate-800 hover:bg-white" onClick={() => setDetailsVisit(request)}>Ver detalle</button>{request.status === "Confirmed" && <button type="button" className="rounded-lg border border-emerald-700 px-3 py-1 text-emerald-900 hover:bg-emerald-100" onClick={() => openReschedule(request)}>Reprogramar</button>}{request.status === "Pending" && <><button type="button" className="rounded-lg border border-red-300 px-3 py-1 text-red-800 hover:bg-red-100" onClick={() => action(request.id, rejectVisitRequest)}>Rechazar</button><button type="button" className="rounded-lg bg-emerald-700 px-3 py-1 text-white" onClick={() => action(request.id, approveVisitRequest, request)}>Confirmar</button></>}</div></article>) : <p className="text-sm text-neutral-600">No hay solicitudes.</p>}</div></section>
    {rescheduling && <form onSubmit={saveReschedule} className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4"><h3 className="font-semibold">Reprogramar visita</h3><p className="mt-1 text-sm">Elegí un horario en saltos de 10 minutos. Se validan agenda, inmueble, buffer y traslado.</p><input required step="600" type="datetime-local" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="mt-3 rounded-lg border px-3 py-2" /><div className="mt-3 flex gap-2"><button className="rounded-lg bg-neutral-900 px-3 py-2 text-white">Guardar nuevo horario</button><button type="button" className="rounded-lg border px-3 py-2" onClick={() => setRescheduling(null)}>Cancelar</button></div></form>}
    {calendarVisit && <div className={`mt-5 rounded-xl border p-4 ${calendarVisit.googleCalendarEventId ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}><p className="font-medium text-slate-950">{calendarVisit.googleCalendarEventId ? "Visita confirmada. El evento se agregó al calendario central y se enviaron las invitaciones." : calendarVisit.calendarMessage ?? "Visita confirmada, pero no se pudo sincronizar con Google Calendar."}</p><button type="button" onClick={() => setCalendarVisit(null)} className="mt-3 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-900">Entendido</button></div>}
    {detailsVisit && <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-label="Detalle de visita"><div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-semibold">Detalle de visita</h3><p className="mt-1 text-sm text-neutral-600">Datos de contacto del interesado.</p></div><button type="button" onClick={() => setDetailsVisit(null)} className="rounded-lg px-2 py-1 text-xl leading-none hover:bg-neutral-100" aria-label="Cerrar detalle">×</button></div><dl className="mt-5 grid gap-4 text-sm"><div><dt className="font-medium text-neutral-500">Interesado</dt><dd className="mt-1 text-base font-semibold">{detailsVisit.visitorName}</dd></div><div><dt className="font-medium text-neutral-500">Correo electrónico</dt><dd className="mt-1 break-all"><a className="text-emerald-800 underline" href={`mailto:${detailsVisit.visitorEmail}`}>{detailsVisit.visitorEmail}</a></dd></div><div><dt className="font-medium text-neutral-500">Teléfono</dt><dd className="mt-1 text-base">{detailsVisit.visitorPhone ? <a className="text-emerald-800 underline" href={`tel:${detailsVisit.visitorPhone}`}>{formatAdvisorPhone(detailsVisit.visitorPhone)}</a> : "No informado"}</dd></div><div><dt className="font-medium text-neutral-500">Horario</dt><dd className="mt-1">{new Date(detailsVisit.startsAtUtc).toLocaleString()}</dd></div>{detailsVisit.note && <div><dt className="font-medium text-neutral-500">Nota</dt><dd className="mt-1 whitespace-pre-wrap">{detailsVisit.note}</dd></div>}</dl><button type="button" onClick={() => setDetailsVisit(null)} className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">Cerrar</button></div></div>}
  </div></div>, document.body);
}
