import { useCallback, useEffect, useMemo, useState } from "react";
import { createRealEstateAdvisor, getCoordinatorWeek, rescheduleVisit } from "../../services/visitAppointments";
import AgentScheduleDialog from "../../components/realestate/AgentScheduleDialog";

const HOUR_HEIGHT = 56;
const HOURS = Array.from({ length: 11 }, (_, index) => index + 8);
const DAY_LABEL = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short" });

function startOfWeek(value = new Date()) {
  const date = new Date(value);
  const offset = date.getDay() === 0 ? -6 : 1 - date.getDay();
  date.setDate(date.getDate() + offset);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isoDate(date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function minutesOf(value) {
  const date = new Date(value);
  return date.getHours() * 60 + date.getMinutes();
}

function sameDate(value, date) {
  return isoDate(new Date(value)) === isoDate(date);
}

function statusClass(status) {
  if (status === "Confirmed") return "border-blue-300 bg-blue-100 text-blue-950";
  if (status === "Pending") return "border-amber-300 bg-amber-100 text-amber-950";
  return "border-slate-300 bg-slate-100 text-slate-700";
}

export default function CoordinatorSchedulePage() {
  const [week, setWeek] = useState(() => startOfWeek());
  const [advisors, setAdvisors] = useState([]);
  const [selectedAdvisorId, setSelectedAdvisorId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [createAdvisorOpen, setCreateAdvisorOpen] = useState(false);
  const [myScheduleOpen, setMyScheduleOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getCoordinatorWeek(isoDate(week));
      setAdvisors(Array.isArray(response?.advisors) ? response.advisors : []);
    } catch (requestError) {
      setError(requestError?.response?.data?.error ?? "No se pudo cargar la agenda de asesores.");
      setAdvisors([]);
    } finally {
      setLoading(false);
    }
  }, [week]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!advisors.length) { setSelectedAdvisorId(""); return; }
    if (!advisors.some((advisor) => String(advisor.id) === selectedAdvisorId)) setSelectedAdvisorId(String(advisors[0].id));
  }, [advisors, selectedAdvisorId]);
  const days = useMemo(() => Array.from({ length: 5 }, (_, index) => addDays(week, index)), [week]);
  const selectedAdvisor = advisors.find((advisor) => String(advisor.id) === selectedAdvisorId) ?? advisors[0] ?? null;

  return (
    <section className="admin-premium tenant-coordination min-h-full">
      <div className="admin-shell space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="admin-title">Coordinación de visitas.</h1>
            <p className="admin-subtitle mt-3">Disponibilidad, visitas pendientes y confirmadas de cada asesor inmobiliario.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="admin-primary px-3 py-2" onClick={() => setCreateAdvisorOpen(true)}>+ Crear asesor</button>
            <button type="button" className="admin-secondary px-3 py-2" onClick={() => setMyScheduleOpen(true)}>Mi disponibilidad</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-emerald-400" />Disponible para visitas</span>
          <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-amber-300" />Pendiente de confirmación</span>
          <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-blue-400" />Visita confirmada</span>
          <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-slate-400" />Cancelada o rechazada</span>
        </div>

        {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800"><span>{error}</span><button type="button" className="admin-secondary px-3 py-1.5" onClick={load}>Reintentar</button></div>}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="admin-secondary px-3 py-2" onClick={() => setWeek((current) => addDays(current, -7))}>← Semana anterior</button>
          <button type="button" className="admin-secondary px-3 py-2" onClick={() => setWeek(startOfWeek())}>Hoy</button>
          <button type="button" className="admin-secondary px-3 py-2" onClick={() => setWeek((current) => addDays(current, 7))}>Semana siguiente →</button>
          {advisors.length > 0 && <label className="ml-0 flex max-w-full flex-wrap items-center gap-2 text-sm font-semibold text-slate-700 sm:ml-2"><span className="whitespace-nowrap">Ver agenda de</span><select value={selectedAdvisorId} onChange={(event) => setSelectedAdvisorId(event.target.value)} className="min-w-0 max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-900 shadow-sm">{advisors.map((advisor) => <option key={advisor.id} value={advisor.id}>{advisor.name} · {advisor.role === "RealEstateAgent" ? "Asesor" : "Coordinador"}</option>)}</select></label>}
        </div>
        {loading ? <ScheduleSkeleton /> : advisors.length === 0 ? <><div className="admin-glass rounded-2xl px-5 py-4 text-sm text-slate-600">Todavía no hay asesores creados. El calendario queda disponible para planificar la semana.</div><AdvisorWeek advisor={{ id: "empty-week", name: "Agenda sin asesores", email: "Creá un asesor o cargá tu disponibilidad como coordinador.", availability: [], visits: [] }} days={days} onSelectVisit={setSelectedVisit} /></> : selectedAdvisor && <AdvisorWeek advisor={selectedAdvisor} days={days} onSelectVisit={setSelectedVisit} />}
        {selectedVisit && <RescheduleDialog visit={selectedVisit} onClose={() => setSelectedVisit(null)} onSaved={async () => { setSelectedVisit(null); await load(); }} />}
        {createAdvisorOpen && <CreateAdvisorDialog onClose={() => setCreateAdvisorOpen(false)} onSaved={async () => { setCreateAdvisorOpen(false); await load(); }} />}
        {myScheduleOpen && <AgentScheduleDialog onClose={() => { setMyScheduleOpen(false); load(); }} />}
      </div>
    </section>
  );
}

function AdvisorWeek({ advisor, days, onSelectVisit }) {
  const availability = Array.isArray(advisor.availability) ? advisor.availability : [];
  const visits = Array.isArray(advisor.visits) ? advisor.visits : [];
  return <article className="admin-glass overflow-hidden rounded-2xl">
    <header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
      <div><h2 className="font-bold text-slate-900">{advisor.name ?? advisor.userName ?? "Asesor inmobiliario"}</h2><p className="mt-0.5 text-xs text-slate-500">{advisor.role === "RealEstateAgent" ? "Asesor inmobiliario" : "Coordinador inmobiliario"} · {advisor.email ?? "Agenda semanal"}</p></div>
      <span className="admin-chip">{visits.filter((visit) => visit.status === "Pending").length} por confirmar</span>
    </header>
    <div className="space-y-3 p-3 min-[840px]:hidden">
      {days.map((day) => <MobileDay key={isoDate(day)} day={day} availability={availability} visits={visits} onSelectVisit={onSelectVisit} />)}
    </div>
    <div className="hidden overflow-x-auto min-[840px]:block">
      <div className="min-w-[840px]">
        <div className="grid grid-cols-[64px_repeat(5,minmax(150px,1fr))] border-b border-slate-200 bg-slate-50">
          <div />{days.map((day) => <div key={isoDate(day)} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">{DAY_LABEL.format(day)}</div>)}
        </div>
        <div className="grid grid-cols-[64px_repeat(5,minmax(150px,1fr))]" style={{ height: HOURS.length * HOUR_HEIGHT }}>
          <div className="relative border-r border-slate-200">{HOURS.map((hour, index) => <span key={hour} className="absolute right-2 text-[11px] text-slate-500" style={{ top: index * HOUR_HEIGHT - 7 }}>{String(hour).padStart(2, "0")}:00</span>)}</div>
          {days.map((day) => <DayColumn key={isoDate(day)} day={day} availability={availability} visits={visits} onSelectVisit={onSelectVisit} />)}
        </div>
      </div>
    </div>
  </article>;
}

function MobileDay({ day, availability, visits, onSelectVisit }) {
  const ranges = availability.filter((item) => Number(item.dayOfWeek) === day.getDay());
  const dayVisits = visits.filter((visit) => sameDate(visit.startsAtUtc, day));
  return <section className="rounded-xl border border-slate-200 bg-white p-3">
    <h3 className="font-semibold capitalize text-slate-900">{DAY_LABEL.format(day)}</h3>
    {ranges.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{ranges.map((range, index) => <span key={range.id ?? index} className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-900">Disponible {String(range.startsAt).slice(0, 5)}–{String(range.endsAt).slice(0, 5)}</span>)}</div>}
    {dayVisits.length > 0 ? <div className="mt-3 space-y-2">{dayVisits.map((visit) => <button type="button" key={visit.id} onClick={() => onSelectVisit(visit)} className={`w-full rounded-lg border p-3 text-left text-sm ${statusClass(visit.status)}`}><span className="font-semibold">{new Date(visit.startsAtUtc).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} · {visit.visitorName ?? "Visita"}</span><span className="mt-1 block text-xs opacity-80">{visit.status === "Confirmed" ? "Confirmada" : visit.status === "Pending" ? "Pendiente" : visit.status}</span></button>)}</div> : <p className="mt-2 text-sm text-slate-500">Sin visitas programadas.</p>}
  </section>;
}

function DayColumn({ day, availability, visits, onSelectVisit }) {
  const dayNumber = day.getDay();
  const ranges = availability.filter((item) => Number(item.dayOfWeek) === dayNumber);
  const dayVisits = visits.filter((visit) => sameDate(visit.startsAtUtc, day));
  return <div className="relative border-r border-slate-200 bg-white" style={{ backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR_HEIGHT - 1}px, rgba(15,23,42,.10) ${HOUR_HEIGHT - 1}px, rgba(15,23,42,.10) ${HOUR_HEIGHT}px)` }}>
    {ranges.map((range, index) => <RangeBlock key={range.id ?? index} startsAt={range.startsAt} endsAt={range.endsAt} />)}
    {dayVisits.map((visit) => <VisitBlock key={visit.id} visit={visit} onClick={() => onSelectVisit(visit)} />)}
  </div>;
}

function RangeBlock({ startsAt, endsAt }) {
  const start = Math.max(0, minutesOf(`2000-01-01T${String(startsAt).slice(0, 5)}:00`) - 8 * 60);
  const end = Math.min(HOURS.length * 60, minutesOf(`2000-01-01T${String(endsAt).slice(0, 5)}:00`) - 8 * 60);
  if (end <= start) return null;
  return <div aria-label="Horario disponible" className="absolute inset-x-2 rounded-md border border-emerald-300/35 bg-emerald-400/15" style={{ top: start / 60 * HOUR_HEIGHT, height: Math.max(16, (end - start) / 60 * HOUR_HEIGHT) }} />;
}

function VisitBlock({ visit, onClick }) {
  const start = Math.max(0, minutesOf(visit.startsAtUtc) - 8 * 60);
  const end = Math.min(HOURS.length * 60, minutesOf(visit.endsAtUtc) - 8 * 60);
  if (end <= start) return null;
  return <button type="button" onClick={onClick} className={`absolute inset-x-3 z-10 overflow-hidden rounded-md border px-2 py-1 text-left text-[11px] shadow-sm ${statusClass(visit.status)}`} style={{ top: start / 60 * HOUR_HEIGHT, height: Math.max(22, (end - start) / 60 * HOUR_HEIGHT) }} title={`${visit.visitorName ?? "Visita"} · ${visit.status === "Confirmed" ? "Confirmada" : "Pendiente"}`}><strong className="block truncate">{visit.visitorName ?? "Visita"}</strong><span className="block truncate opacity-80">{visit.status === "Confirmed" ? "Confirmada" : "Pendiente"}</span></button>;
}

function localDateTime(value) { const date = new Date(value); const pad = (number) => String(number).padStart(2, "0"); return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`; }
function RescheduleDialog({ visit, onClose, onSaved }) { const [startsAt, setStartsAt] = useState(localDateTime(visit.startsAtUtc)); const [error, setError] = useState(""); const [saving, setSaving] = useState(false); const save = async (event) => { event.preventDefault(); setSaving(true); setError(""); try { await rescheduleVisit(visit.id, new Date(startsAt).toISOString()); await onSaved(); } catch (cause) { setError(cause?.response?.data?.error ?? "No se pudo reprogramar la visita."); } finally { setSaving(false); } }; return <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-950/75 p-4"><form onSubmit={save} className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-6 text-slate-100 shadow-2xl"><h2 className="text-xl font-bold">Reprogramar visita</h2><p className="mt-1 text-sm text-slate-400">{visit.visitorName ?? "Interesado"}. Elegí una hora en intervalos de 10 minutos; se validan agenda, inmueble, buffer y traslado.</p><label className="mt-5 grid gap-2 text-sm font-medium">Nuevo inicio<input required step="600" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2" /></label>{error && <p className="mt-3 text-sm text-red-300">{error}</p>}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="admin-secondary px-3 py-2">Cancelar</button><button disabled={saving} className="admin-primary px-3 py-2 disabled:opacity-60">{saving ? "Guardando…" : "Reprogramar"}</button></div></form></div>; }

function CreateAdvisorDialog({ onClose, onSaved }) {
  const [email, setEmail] = useState(""); const [initialPassword, setInitialPassword] = useState(""); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  const save = async (event) => { event.preventDefault(); setSaving(true); setError(""); try { await createRealEstateAdvisor({ email, initialPassword }); await onSaved(); } catch (cause) { setError(cause?.response?.data?.error ?? "No se pudo crear el asesor."); } finally { setSaving(false); } };
  return <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-950/75 p-4"><form onSubmit={save} className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-6 text-slate-100 shadow-2xl"><h2 className="text-xl font-bold">Crear asesor inmobiliario</h2><p className="mt-1 text-sm text-slate-400">Definí su email y una contraseña inicial. Al iniciar sesión, deberá reemplazarla antes de continuar.</p><label className="mt-5 grid gap-2 text-sm font-medium">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2" /></label><label className="mt-4 grid gap-2 text-sm font-medium">Contraseña inicial<input required minLength="12" type="password" value={initialPassword} onChange={(event) => setInitialPassword(event.target.value)} className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2" /><span className="text-xs font-normal text-slate-400">Mínimo 12 caracteres.</span></label>{error && <p className="mt-3 text-sm text-red-300">{error}</p>}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="admin-secondary px-3 py-2">Cancelar</button><button disabled={saving} className="admin-primary px-3 py-2 disabled:opacity-60">{saving ? "Creando…" : "Crear asesor"}</button></div></form></div>;
}

function ScheduleSkeleton() {
  return <div className="admin-glass animate-pulse rounded-2xl p-5"><div className="h-5 w-44 rounded bg-slate-600" /><div className="mt-5 h-64 rounded bg-slate-800" /></div>;
}
