import { useEffect, useMemo, useRef, useState } from "react";
import { listPlatformCompanies, updatePlatformCompany } from "../../services/companies";
import GuideButton from "../../components/guides/GuideButton";
import { getModuleDefaults, saveModuleDefaults } from "../../services/moduleDefaults";
import { MODULES, INDEPENDENT_BLOCKS, moduleAssigned, supportsCategory, changeModuleAssignment, resolveModuleComponents, generalModuleFeatures, editModuleOverride, resetModuleOverrides } from "../../services/componentModules";

function completeFeatures(company, features) {
  const f = features, t = company.branding?.theme ?? {};
  return { ...f, customBranding: Boolean(company.branding?.logoUrl),
    logoUrl: company.branding?.logoUrl ?? null, primaryColor: t.primary,
    secondaryColor: t.secondary, accentColor: t.accent, surfaceColor: t.surface, onPrimaryColor: t.onPrimary };
}

export default function ModulesPage() {
  const [companies, setCompanies] = useState([]);
  const [scope, setScope] = useState("general");
  const [defaults, setDefaults] = useState({});
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [draggingKey, setDraggingKey] = useState("");
  const [destination, setDestination] = useState("store");
  const [search, setSearch] = useState("");
  const savingRef = useRef(false);
  useEffect(() => {
    let active = true;
    Promise.all([getModuleDefaults(), listPlatformCompanies({ strict: true })]).then(([general, { companies: rows }]) => {
      if (active) { setDefaults(general); setCompanies(rows); setSelectedId(String(rows[0]?.id ?? "")); }
    }).catch((error) => { if (active) setLoadError(error.message || "No se pudo cargar la configuración."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const company = useMemo(() => companies.find((item) => String(item.id) === selectedId), [companies, selectedId]);
  const general = scope === "general";
  const features = general ? generalModuleFeatures(defaults) : {
    ...company?.features,
    components: resolveModuleComponents(defaults, company?.features?.components),
  };
  const hasOverrides = Object.keys(resetModuleOverrides(company?.features?.components)).length !== Object.keys(company?.features?.components ?? {}).length;
  const save = async (nextFeatures, notice) => {
    if ((!general && !company) || savingRef.current) return;
    savingRef.current = true;
    setSaving(true); setMessage("");
    try {
      if (general) {
        setDefaults(await saveModuleDefaults(nextFeatures.components));
      } else {
        const updated = await updatePlatformCompany(company.id, { isActive: company.isActive, features: completeFeatures(company, nextFeatures) });
        setCompanies((rows) => rows.map((item) => String(item.id) === String(updated.id) ? updated : item));
      }
      setMessage(notice);
    } catch (error) { setMessage(error.message || "No se pudo guardar el tablero."); }
    finally { savingRef.current = false; setSaving(false); }
  };
  const assign = (key, category, value) => {
    if ((!general && !company) || savingRef.current) return;
    setDraggingKey("");
    try {
      // Validate against the effective configuration, then persist only the edited override.
      changeModuleAssignment(features, key, category, value);
      const source = { ...(general ? defaults : company.features?.components) };
      if (general && ["videos", "dollarQuote"].includes(key) && !MODULES.some((module) => Object.hasOwn(source, `placement:${key}:${module.key}`))) {
        MODULES.forEach((module) => { source[`placement:${key}:${module.key}`] = moduleAssigned(features, key, module.key); });
      }
      const components = editModuleOverride(source, key, category, value);
      const nextFeatures = { ...(general ? features : company.features), components };
      const prerequisite = INDEPENDENT_BLOCKS.find((block) => block.key === key)?.prerequisite;
      if (!general && value && prerequisite) nextFeatures[prerequisite] = true;
      save(nextFeatures, general ? "Configuración general guardada. Las empresas sin una excepción heredan este cambio." : "Personalización guardada para esta empresa.");
    } catch (error) { setMessage(error.message); }
  };

  return <section className="admin-premium"><div className="admin-shell space-y-7">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="admin-title">Módulos por categoría.</h1><p className="admin-subtitle mt-3">Configurá una vez lo que incluye Tienda, Inmuebles y Vehículos.</p></div>
      <GuideButton tour="modules" className="admin-secondary" disabled={loading || saving || Boolean(loadError)} />
    </div>
    <div data-tour="module-scope" className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Alcance de la configuración">
        {[["general", "Configuración general"], ["company", "Personalizar una empresa"]].map(([key, label]) => <button key={key} type="button" aria-pressed={scope === key}
          disabled={saving || loading} className={`${scope === key ? "admin-primary" : "admin-secondary"} px-4 py-2.5`}
          onClick={() => { setScope(key); setMessage(""); setDraggingKey(""); }}>{label}</button>)}
      </div>
      <p className="text-sm text-slate-300">{general
        ? "Se aplica a las empresas actuales y futuras que tengan la categoría habilitada. Las excepciones de cada empresa se conservan."
        : "Los módulos siguen la configuración general hasta que los cambies para esta empresa."}</p>
      {!general && <div className="flex flex-wrap items-end gap-4">
        <label className="block w-full max-w-md"><span className="mb-2 block text-sm font-semibold text-slate-100">Empresa</span>
          <select disabled={saving || loading} className="inputRan w-full px-3 py-2.5" value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setMessage(""); setDraggingKey(""); }}>
            {companies.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
        </label>
        <button type="button" className="admin-secondary px-4 py-2.5" disabled={saving || loading || !company || !hasOverrides}
          onClick={() => save({ ...company.features, components: resetModuleOverrides(company.features?.components) }, "La empresa vuelve a seguir la configuración general.")}>Restablecer configuración general</button>
      </div>}
    </div>
    {loadError && <p role="alert" className="text-red-300">{loadError}</p>}
    {loading ? <p role="status">Cargando configuración…</p> : loadError ? null : !general && !company ? <p>No hay empresas disponibles. Podés configurar los módulos generales.</p> : <div className="grid items-start gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <section className="admin-glass rounded-2xl p-4" aria-label="Módulos independientes" data-tour="module-library">
        <h2 className="text-lg font-bold text-white">Módulos independientes</h2>
        <p className="mt-2 text-sm text-slate-300">Arrastrá a una categoría o elegí un destino para añadir.</p>
        <label className="mt-4 block max-w-sm text-sm text-slate-100">Añadir a
          <select className="inputRan mt-2 w-full px-3 py-2.5" value={destination} disabled={saving} onChange={(e) => setDestination(e.target.value)}>
            {MODULES.map((module) => <option key={module.key} value={module.key}>{module.label}{!features?.[module.key] ? " (desactivada)" : ""}</option>)}
          </select>
        </label>
        <label className="mt-4 block">
          <span className="sr-only">Buscar módulos</span>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar módulo…" className="inputRan w-full px-3 py-2" />
        </label>
        <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto pr-1 lg:max-h-[28rem]">{INDEPENDENT_BLOCKS.filter((block) => block.label.toLocaleLowerCase("es").includes(search.trim().toLocaleLowerCase("es"))).map((block) => {
          const alreadyAdded = moduleAssigned(features, block.key, destination);
          const compatible = supportsCategory(block, destination);
          const availability = block.categories ? MODULES.filter((module) => block.categories.includes(module.key)).map((module) => module.label).join(", ") : "Todas las categorías";
          return <li key={block.key} draggable={!saving}
            onDragStart={(e) => { e.dataTransfer.setData("text/plain", block.key); e.dataTransfer.effectAllowed = "copy"; setDraggingKey(block.key); }}
            onDragEnd={() => setDraggingKey("")}
            className="flex items-center justify-between gap-2 rounded-lg border border-slate-600/40 px-2 py-2 text-sm text-slate-100">
            <div className="min-w-0"><span className="font-semibold"><span aria-hidden="true">⠿ </span>{block.label}</span>
              <p className="mt-1 text-xs text-slate-400">{availability}</p></div>
            <button type="button" className="admin-secondary shrink-0 px-2 py-1 text-xs"
              disabled={saving || alreadyAdded || !compatible || !features?.[destination]}
              onClick={() => assign(block.key, destination, true)}
              aria-label={`Añadir ${block.label} a ${MODULES.find((module) => module.key === destination)?.label}`}>
              {alreadyAdded ? "Añadido" : compatible ? "Añadir" : "—"}
            </button>
          </li>;
        })}</ul>
        {!INDEPENDENT_BLOCKS.some((block) => block.label.toLocaleLowerCase("es").includes(search.trim().toLocaleLowerCase("es"))) && <p role="status" className="mt-3 text-sm text-slate-400">No hay módulos con ese nombre.</p>}
      </section>
      <div data-tour="module-categories" className="grid min-w-0 gap-4 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">{MODULES.map((module) => <article key={module.key}
        onDragOver={(e) => { if (!saving && features?.[module.key] && supportsCategory(INDEPENDENT_BLOCKS.find((block) => block.key === draggingKey), module.key)) e.preventDefault(); }}
        onDrop={(e) => { e.preventDefault(); if (!saving && features?.[module.key]) assign(draggingKey || e.dataTransfer.getData("text/plain"), module.key, true); }}
        className={`min-w-0 rounded-2xl border p-4 ${draggingKey && features?.[module.key] && supportsCategory(INDEPENDENT_BLOCKS.find((block) => block.key === draggingKey), module.key) ? "border-sky-300/60 bg-sky-300/5" : "admin-card"}`}>
        <h2 className="text-lg font-bold text-white">{module.label}</h2><p className="mt-1 text-sm text-slate-400">{module.detail}</p>
        {!features?.[module.key] && <p className="mt-3 text-sm text-slate-300">Categoría desactivada. Habilitala desde la administración de la empresa.</p>}
        <ul className="mt-5 space-y-2">
          {INDEPENDENT_BLOCKS.filter((block) => moduleAssigned(features, block.key, module.key)).map((block) => <li key={block.key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-600/70 p-3 text-sm text-slate-100">
            <span>{block.label}{!general && <small className="mt-1 block text-xs text-slate-400">{Object.hasOwn(company.features?.components ?? {}, block.key) || Object.hasOwn(company.features?.components ?? {}, `placement:${block.key}:${module.key}`) ? "Personalizado" : "General"}</small>}</span><button type="button" className="admin-secondary shrink-0 px-2 py-1" disabled={saving} onClick={() => assign(block.key, module.key, false)} aria-label={`Quitar ${block.label} de ${module.label}`}>Quitar</button>
          </li>)}
        </ul>
        {!INDEPENDENT_BLOCKS.some((block) => moduleAssigned(features, block.key, module.key)) && <p className="mt-4 text-sm text-slate-400">Todavía no hay módulos añadidos.</p>}
        <p className="mt-5 text-xs text-slate-400">Soltá aquí un módulo independiente para añadirlo.</p>
      </article>)}</div>
    </div>}
    {message && <p role="status" className="rounded-xl border border-sky-300/25 bg-sky-300/10 px-4 py-3 text-sm text-sky-100">{message}</p>}
  </div></section>;
}
