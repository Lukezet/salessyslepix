import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BrandingEditor from "../../components/branding/BrandingEditor";
import { DEFAULT_BRANDING_THEME } from "../../components/branding/theme";
import { createPlatformCompany } from "../../services/companies";

const INITIAL = { name: "", description: "", industry: "", phoneNumber: "", address: "", city: "", province: "", adminName: "", adminEmail: "", adminPassword: "", store: false, realEstate: false, vehicles: false, interactiveMap: false, useCustomDomain: false, customDomain: "" };

export default function ClientCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [theme, setTheme] = useState(DEFAULT_BRANDING_THEME);
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      const { source } = await createPlatformCompany({
        name: form.name.trim(), description: form.description.trim(), industry: form.industry.trim(), phoneNumber: form.phoneNumber.trim(), address: form.address.trim(), city: form.city.trim(), province: form.province.trim(), customDomain: form.useCustomDomain ? form.customDomain.trim() : null,
        features: { store: form.store, realEstate: form.realEstate, vehicles: form.vehicles, interactiveMap: form.realEstate && form.interactiveMap, appointments: false, googleCalendar: false, publicExactAddress: false, customBranding: Boolean(logoFile), logoUrl: null, primaryColor: theme.primary, secondaryColor: theme.secondary, accentColor: theme.accent, surfaceColor: theme.surface, onPrimaryColor: theme.onPrimary },
        initialAdmin: { userName: form.adminName.trim(), email: form.adminEmail.trim(), password: form.adminPassword },
      }, logoFile);
      setMessage(source === "fallback" ? "Cliente creado localmente." : "Cliente creado correctamente.");
      setTimeout(() => navigate("/admin?section=clients"), 700);
    } catch (error) { setMessage(error.message || "No se pudo crear el cliente."); }
    finally { setSaving(false); }
  };
  return <section className="admin-premium"><div className="admin-shell space-y-7">
    <div className="flex items-center justify-between gap-4"><div><h1 className="admin-title">Diseñá su próximo portal.</h1><p className="admin-subtitle mt-3">Configurá la base operativa y la identidad que verá cada visitante.</p></div><Link className="admin-secondary shrink-0 px-4 py-2.5 text-sm" to="/admin?section=clients">← Volver</Link></div>
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_.92fr]">
      <div className="admin-glass space-y-5 rounded-2xl p-5 sm:p-7">
        <div><h2 className="text-lg font-semibold text-white">Fundamentos de la empresa</h2><p className="mt-1 text-sm text-slate-400">Primero los datos operativos; luego definimos la experiencia de marca.</p></div>
        <label className="grid gap-1 text-sm font-medium">Nombre comercial<input required className="inputRan px-3 py-2" value={form.name} onChange={(e) => set("name", e.target.value)} /></label>
        <label className="grid gap-1 text-sm font-medium">Descripcion<textarea required rows="3" className="inputRan px-3 py-2" value={form.description} onChange={(e) => set("description", e.target.value)} /></label>
        <label className="grid gap-1 text-sm font-medium">Rubro<input className="inputRan px-3 py-2" value={form.industry} onChange={(e) => set("industry", e.target.value)} /></label>
        <fieldset className="space-y-2 rounded-xl border border-slate-600/60 bg-slate-950/30 p-4"><legend className="px-1 font-medium text-white">Dirección pública</legend><label className="flex items-center gap-3 text-sm text-slate-200"><input type="checkbox" checked={form.useCustomDomain} onChange={(e) => set("useCustomDomain", e.target.checked)} />Usar un dominio propio</label>{form.useCustomDomain ? <label className="grid gap-1 text-sm font-medium">Dominio contratado<input required placeholder="marca.com" className="inputRan px-3 py-2" value={form.customDomain} onChange={(e) => set("customDomain", e.target.value)} /></label> : <p className="text-sm text-slate-300">Se usará la ruta: <strong>urlpagina/{form.name.trim() || "Marca"}/Home</strong></p>}<p className="text-xs text-slate-500">El dominio se registra aquí; para producción también deberá apuntarse en DNS al servidor.</p></fieldset>
        <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm font-medium">Telefono<input required className="inputRan px-3 py-2" value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} /></label><label className="grid gap-1 text-sm font-medium">Ciudad<input required className="inputRan px-3 py-2" value={form.city} onChange={(e) => set("city", e.target.value)} /></label><label className="grid gap-1 text-sm font-medium">Direccion<input required className="inputRan px-3 py-2" value={form.address} onChange={(e) => set("address", e.target.value)} /></label><label className="grid gap-1 text-sm font-medium">Provincia<input required className="inputRan px-3 py-2" value={form.province} onChange={(e) => set("province", e.target.value)} /></label></div>
        <fieldset className="space-y-2"><legend className="font-medium text-white">Módulos</legend><p className="mb-3 text-sm text-slate-400">Elegí las experiencias habilitadas para este cliente.</p><label className="flex gap-3 rounded-xl border border-slate-600/60 bg-slate-950/30 p-3 text-slate-200"><input type="checkbox" checked={form.store} onChange={(e) => set("store", e.target.checked)} /><span>Tienda <small className="block text-slate-500">Productos y categorías</small></span></label><label className="flex gap-3 rounded-xl border border-slate-600/60 bg-slate-950/30 p-3 text-slate-200"><input type="checkbox" checked={form.realEstate} onChange={(e) => set("realEstate", e.target.checked)} /><span>Inmobiliaria <small className="block text-slate-500">Publicaciones y consultas</small></span></label><label className="flex gap-3 rounded-xl border border-slate-600/60 bg-slate-950/30 p-3 text-slate-200"><input type="checkbox" checked={form.vehicles} onChange={(e) => set("vehicles", e.target.checked)} /><span>Vehículos <small className="block text-slate-500">Catálogo automotor</small></span></label>{form.realEstate && <label className="flex gap-3 rounded-xl border border-slate-600/60 bg-slate-950/30 p-3 text-slate-200"><input type="checkbox" checked={form.interactiveMap} onChange={(e) => set("interactiveMap", e.target.checked)} /><span>Mapa interactivo <small className="block text-slate-500">Ubicaciones públicas</small></span></label>}</fieldset>
        <fieldset className="space-y-2"><legend className="font-medium">Administrador inicial</legend><label className="grid gap-1 text-sm font-medium">Nombre<input required className="inputRan px-3 py-2" value={form.adminName} onChange={(e) => set("adminName", e.target.value)} /></label><label className="grid gap-1 text-sm font-medium">Email<input required type="email" className="inputRan px-3 py-2" value={form.adminEmail} onChange={(e) => set("adminEmail", e.target.value)} /></label><label className="grid gap-1 text-sm font-medium">Contrasena<input required minLength="12" type="password" className="inputRan px-3 py-2" value={form.adminPassword} onChange={(e) => set("adminPassword", e.target.value)} /></label></fieldset>
      </div>
      <div className="space-y-5"><div className="admin-glass rounded-2xl p-5 sm:p-6"><h2 className="text-lg font-semibold text-white">Identidad</h2><div className="mt-4"><BrandingEditor initialTheme={theme} onChange={setTheme} onLogoChange={setLogoFile} /></div></div><div className="admin-card rounded-2xl p-5"><div className="flex items-center justify-between"><h2 className="font-semibold text-white">Vista previa</h2><span className="admin-chip">En vivo</span></div><div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-white text-slate-900 shadow-xl"><div className="flex items-center justify-between p-3 font-semibold" style={{ backgroundColor: theme.primary, color: theme.onPrimary }}><span>{form.name || "Tu empresa"}</span><span>Inicio</span></div><div className="p-4 text-sm">{form.realEstate ? "Propiedades destacadas" : form.vehicles ? "Vehículos destacados" : form.store ? "Categorías de productos" : "Portal sin catálogo"}</div></div></div><button disabled={saving} className="admin-primary w-full px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60" type="submit">{saving ? "Creando…" : "Crear empresa →"}</button>{message && <p role="status" className="rounded-xl bg-white/10 px-4 py-3 text-sm text-slate-200">{message}</p>}</div>
    </form>
  </div></section>;
}
