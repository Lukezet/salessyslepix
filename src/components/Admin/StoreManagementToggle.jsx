export default function StoreManagementToggle({ checked, onChange }) {
  return <div className="rounded-xl border border-slate-600/60 bg-slate-950/30 p-4">
    <label className="flex cursor-pointer items-center justify-between gap-4 text-sm text-slate-200">
      <span>Gestión de tienda: <strong>{checked ? "interna" : "externa"}</strong></span>
      <span className="relative inline-flex shrink-0">
      <input type="checkbox" role="switch" aria-label="Gestión interna de tienda" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
      <span aria-hidden="true" className="h-6 w-11 rounded-full bg-slate-600 transition-colors peer-checked:bg-cyan-500 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-300 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-slate-900 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
      </span>
    </label>
    <p className="mt-2 text-sm text-slate-400">{checked ? "El catálogo sólo estará disponible al iniciar sesión en esta empresa." : "El catálogo será público, sin necesidad de iniciar sesión."}</p>
  </div>;
}
