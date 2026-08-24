import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BrandingEditor from "../../components/branding/BrandingEditor";
import { listPlatformCompanies, updatePlatformCompany } from "../../services/companies";

export default function ClientsPage() {
  const [companies, setCompanies] = useState([]);
  const [source, setSource] = useState("api");
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState("");
  const [preview, setPreview] = useState(null);
  const [managing, setManaging] = useState(null);

  useEffect(() => {
    let current = true;
    listPlatformCompanies().then((result) => {
      if (!current) return;
      setCompanies(result.companies);
      setSource(result.source);
      setLoading(false);
    });
    return () => { current = false; };
  }, []);

  const visible = companies.filter((company) => (
    `${company.name} ${company.description ?? ""} ${company.city ?? ""}`.toLowerCase().includes(term.toLowerCase())
  ));

  return (
    <section className="admin-premium">
      <div className="admin-shell space-y-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="admin-title">Tus clientes, con otra presencia.</h1>
          <p className="admin-subtitle mt-3">Administrá cada portal, revisá su identidad y abrí la experiencia pública desde un solo lugar.</p>
        </div>
        <Link to="/admin?section=clients-new" className="admin-primary px-5 py-3 text-center"><span aria-hidden="true">+</span> Crear empresa</Link>
      </div>

      <div className="admin-glass flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-sm font-semibold text-white">Directorio de clientes</p><p className="mt-1 text-sm text-slate-400">{loading ? "Cargando organizaciones…" : `${visible.length} de ${companies.length} organizaciones visibles`}</p></div>
        <label className="block w-full sm:w-80"><span className="sr-only">Buscar empresas</span><input className="inputRan w-full px-4 py-2.5 text-sm" value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Empresa, rubro o ciudad…" /></label>
      </div>

      {source === "fallback" && (
        <p className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
          Vista de prueba local: la API de empresas todavía no está disponible. Las altas se guardan sólo en este navegador.
        </p>
      )}

      {loading ? <div className="h-56 animate-pulse rounded-2xl bg-slate-800/70" /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((company) => {
            const theme = company.branding?.theme ?? {};
            return <article className="admin-card group overflow-hidden rounded-2xl transition duration-200 hover:-translate-y-1 hover:border-amber-300/40" key={company.id}>
              <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${theme.primary ?? "#FACC15"}, ${theme.secondary ?? "#38BDF8"})` }} />
              <div className="space-y-4 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold shadow-lg" style={{ backgroundColor: theme.primary ?? "#FACC15", color: theme.onPrimary ?? "#171717" }}>
                    {company.branding?.logoUrl ? <img src={company.branding.logoUrl} className="h-full w-full rounded-xl object-contain p-1" alt="" /> : company.name.slice(0, 1)}
                  </div>
                  <div><h2 className="font-semibold text-white">{company.name}</h2><p className="text-sm text-slate-400">{company.city || "Sin ciudad"}</p></div>
                </div>
                <p className="min-h-10 text-sm leading-6 text-slate-300">{company.description || "Sin descripción"}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {company.features?.realEstate && <span className="admin-chip">Inmobiliaria</span>}
                  {company.features?.vehicles && <span className="admin-chip">Vehículos</span>}
                  {company.features?.store && <span className="admin-chip">Tienda</span>}
                  {!company.features?.store && !company.features?.realEstate && !company.features?.vehicles && <span className="admin-chip">Sin módulos</span>}
                  <span className={`rounded-full px-2 py-1 font-semibold ${company.isActive ? "bg-emerald-400/15 text-emerald-200" : "bg-slate-500/20 text-slate-300"}`}>{company.isActive ? "● Activa" : "○ Inactiva"}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-3"><button type="button" className="admin-primary px-2 py-2.5 text-sm" onClick={() => setPreview(company)}>Previsualizar</button><a href={`/${company.slug}/home`} target="_blank" rel="noreferrer" className="admin-secondary px-2 py-2.5 text-center text-sm">Acceder ↗</a><button type="button" className="admin-secondary px-2 py-2.5 text-sm" onClick={() => setManaging(company)}>Administrar</button></div>
              </div>
            </article>;
          })}
        </div>
      )}

      {preview && <VisitorPreview company={preview} onClose={() => setPreview(null)} />}
      {managing && <ClientManager company={managing} onClose={() => setManaging(null)} onSaved={(updated) => { setCompanies((current) => current.map((company) => String(company.id) === String(updated.id) ? updated : company)); setManaging(null); }} />}
      </div>
    </section>
  );
}

function ClientManager({ company, onClose, onSaved }) {
  const [isActive, setIsActive] = useState(company.isActive);
  const [features, setFeatures] = useState(company.features ?? {});
  const [theme, setTheme] = useState(company.branding?.theme ?? {});
  const [logoFile, setLogoFile] = useState(null);
  const [section, setSection] = useState("settings");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const setFeature = (key, value) => setFeatures((current) => ({ ...current, [key]: value }));
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const updated = await updatePlatformCompany(company.id, {
        isActive,
        features: {
          ...features,
          interactiveMap: Boolean(features.realEstate && features.interactiveMap),
          customBranding: Boolean(logoFile || company.branding?.logoUrl),
          logoUrl: company.branding?.logoUrl ?? null,
          primaryColor: theme.primary,
          secondaryColor: theme.secondary,
          accentColor: theme.accent,
          surfaceColor: theme.surface,
          onPrimaryColor: theme.onPrimary,
        },
      }, logoFile);
      onSaved(updated);
    } catch (cause) { setError(cause.message || "No se pudo actualizar la empresa."); }
    finally { setSaving(false); }
  };
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Administrar ${company.name}`}><form onSubmit={save} className="admin-premium flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-900 shadow-2xl"><div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:px-7"><div className="min-w-0"><h2 className="break-words text-2xl font-bold text-white">Administrar {company.name}</h2><p className="mt-1 text-sm text-slate-400">Cambios de portal, identidad y módulos sin eliminar el cliente.</p></div><button type="button" className="admin-secondary shrink-0 px-3 py-2 text-sm" onClick={onClose}>Cerrar</button></div><div className="flex flex-wrap gap-2 border-b border-white/10 px-5 py-3 sm:px-7"><button type="button" onClick={() => setSection("settings")} className={`${section === "settings" ? "admin-primary" : "admin-secondary"} px-3 py-2 text-sm`}>Estado y módulos</button><button type="button" onClick={() => setSection("identity")} className={`${section === "identity" ? "admin-primary" : "admin-secondary"} px-3 py-2 text-sm`}>Identidad visual</button></div><div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">{section === "settings" ? <section className="space-y-5"><label className="flex items-center justify-between rounded-xl border border-slate-600 bg-slate-950/30 p-4"><span className="min-w-0"><strong className="block text-white">Portal activo</strong><small className="text-slate-400">Al desactivarlo, la página pública deja de estar disponible.</small></span><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} /></label><fieldset className="space-y-3"><legend className="font-semibold text-white">Módulos contratados</legend><p className="text-sm text-slate-400">Podés sumar Tienda a una inmobiliaria sin quitarle sus módulos actuales.</p><FeatureToggle label="Tienda" detail="Productos, categorías, carrito, ventas y dólar." checked={features.store} onChange={(value) => setFeature("store", value)} /><FeatureToggle label="Inmobiliaria" detail="Publicaciones y consultas." checked={features.realEstate} onChange={(value) => setFeature("realEstate", value)} /><FeatureToggle label="Vehículos" detail="Catálogo automotor." checked={features.vehicles} onChange={(value) => setFeature("vehicles", value)} />{features.realEstate && <FeatureToggle label="Mapa interactivo" detail="Ubicaciones públicas." checked={features.interactiveMap} onChange={(value) => setFeature("interactiveMap", value)} />}</fieldset></section> : <section className="min-w-0"><BrandingEditor key={company.id} initialTheme={theme} logoUrl={company.branding?.logoUrl ?? ""} onChange={setTheme} onLogoChange={setLogoFile} showPreview={false} /></section>}{error && <p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}</div><div className="flex flex-wrap justify-end gap-3 border-t border-white/10 bg-slate-900 p-5 sm:px-7"><button type="button" className="admin-secondary px-4 py-2.5" onClick={onClose}>Cancelar</button><button disabled={saving} className="admin-primary px-4 py-2.5 disabled:opacity-50">{saving ? "Guardando…" : "Guardar cambios"}</button></div></form></div>;
}

function FeatureToggle({ label, detail, checked, onChange }) {
  return <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-600/70 bg-slate-950/30 p-3 text-sm"><input className="mt-1" type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} /><span><strong className="block text-slate-100">{label}</strong><small className="text-slate-400">{detail}</small></span></label>;
}

function VisitorPreview({ company, onClose }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Previsualizacion de ${company.name}`}>
    <div className="flex h-[min(90dvh,900px)] w-full max-w-[1500px] flex-col overflow-hidden rounded-2xl border border-white/15 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b bg-slate-950 px-5 py-3 text-white"><div><p className="text-xs font-medium text-slate-400">Vista real de visitante</p><h2 className="font-semibold">{company.name}</h2></div><button type="button" className="admin-secondary px-3 py-1.5 text-sm" onClick={onClose}>Cerrar</button></div>
      <iframe title={`Portal publico de ${company.name}`} src={`/${company.slug}/home?preview=1`} className="min-h-0 w-full flex-1 border-0" />
    </div>
  </div>;
}

function VisitorPreviewLegacy({ company, onClose }) {
  const theme = company.branding?.theme ?? {};
  const isRealEstate = Boolean(company.features?.realEstate);
  const isVehicles = Boolean(company.features?.vehicles);

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-label={`Previsualizacion de ${company.name}`}>
    <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b px-5 py-3"><div><p className="text-xs font-medium text-neutral-500">Vista de visitante</p><h2 className="font-semibold">{company.name}</h2></div><button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={onClose}>Cerrar</button></div>
      <div className="min-h-[460px]" style={{ backgroundColor: theme.surface ?? "#FFFFFF" }}>
        <header className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: theme.primary ?? "#1F2937", color: theme.onPrimary ?? "#FFFFFF" }}>
          <div className="flex items-center gap-3 font-bold">{company.branding?.logoUrl ? <img src={company.branding.logoUrl} alt="" className="h-9 w-9 rounded object-contain" /> : <span className="flex h-9 w-9 items-center justify-center rounded bg-black/15">{company.name.slice(0, 1)}</span>}{company.name}</div>
          <nav className="flex gap-4 text-sm"><span>Inicio</span><span>{isRealEstate ? "Propiedades" : isVehicles ? "Vehiculos" : "Productos"}</span><span>Contacto</span></nav>
        </header>
        <main className="space-y-6 px-6 py-8 text-neutral-900">
          <section><p className="text-sm font-medium" style={{ color: theme.accent ?? "#F59E0B" }}>{company.industry || "Portal del cliente"}</p><h3 className="mt-1 text-3xl font-bold">{company.description || `Bienvenido a ${company.name}`}</h3><p className="mt-2 max-w-2xl text-neutral-600">Esta es la experiencia publica: no hay botones administrativos ni datos internos de la empresa.</p></section>
          {isRealEstate ? <section className="grid gap-4 md:grid-cols-[1.15fr_.85fr]"><div className="rounded-xl bg-neutral-100 p-5"><h4 className="font-semibold">Propiedades destacadas</h4><p className="mt-2 text-sm text-neutral-600">Ventas y alquileres publicados apareceran aqui.</p></div>{company.features?.interactiveMap && <div className="rounded-xl p-5" style={{ backgroundColor: theme.secondary ?? "#374151", color: theme.onPrimary ?? "#FFFFFF" }}><h4 className="font-semibold">Mapa de ubicaciones publicas</h4><p className="mt-2 text-sm opacity-85">Solo marcadores aproximados de propiedades publicadas.</p></div>}</section> : <section className="rounded-xl bg-neutral-100 p-5"><h4 className="font-semibold">{isVehicles ? "Vehiculos destacados" : "Categorias destacadas"}</h4><p className="mt-2 text-sm text-neutral-600">El catalogo publico se mostrara aqui.</p></section>}
        </main>
      </div>
    </div>
  </div>;
}
