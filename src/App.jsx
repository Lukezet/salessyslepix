import { Link, Outlet, useLocation, useParams } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import { useAuth } from "./store/auth";
import { useTenantConfig } from "./store/tenantConfig";
import TenantBranding from "./components/tenant/TenantBranding";
import PortalLoginPage from "./pages/PortalLoginPage";
import { isVisitorPreview } from "./utils/visitorPreview";

export default function App() {
  const location = useLocation();
  const { clientSlug = null } = useParams();
  const isPortalEntry = location.pathname === "/";
  const tenantConfig = useTenantConfig((state) => state.config);
  const tenantIsLoaded = useTenantConfig((state) => state.isLoaded);
  const tenantName = tenantConfig?.name ?? "";

  useEffect(() => {
    const previewMode = isVisitorPreview(window.location.search);
    if (!previewMode) useAuth.getState().initFromStorage();
    useTenantConfig.getState().load(clientSlug);
  }, [clientSlug]);

  if (isPortalEntry) return <><TenantBranding /><PortalLoginPage /></>;
  const isPublicTenantReady = !clientSlug || (
    tenantIsLoaded &&
    tenantConfig?.slug?.toLowerCase() === clientSlug.toLowerCase()
  );

  // Nunca mostramos la paleta por defecto de LePix mientras se resuelve la
  // empresa de la URL: una marca equivocada, aunque sea por un instante,
  // hace parecer que el portal pertenece a otro cliente.
  if (!isPublicTenantReady) {
    return <PublicPortalSkeleton />;
  }

  return (
    <div
      className="min-h-dvh w-full flex flex-col"
      style={{
        backgroundColor: "var(--tenant-color-surface)",
        color: "var(--tenant-color-text)",
      }}
    >
      <TenantBranding />
      <Navbar />
      <main className="flex-1 mx-4 mt-4">
        <Outlet />
      </main>
      <TenantFooter config={tenantConfig} tenantName={tenantName} clientSlug={clientSlug} />
    </div>
  );
}

function TenantFooter({ config, tenantName, clientSlug }) {
  const address = [config?.address, config?.city, config?.province].filter(Boolean).join(", ");
  const links = [
    ["Instagram", config?.socialLinks?.instagramUrl],
    ["Facebook", config?.socialLinks?.facebookUrl],
    ["LinkedIn", config?.socialLinks?.linkedInUrl],
    ["Otra red", config?.socialLinks?.otherSocialUrl],
  ].filter(([, url]) => typeof url === "string" && url);
  return <footer className="tenant-footer mt-10 rounded-t-3xl text-white"><div className="grid w-full gap-7 px-5 py-8 text-sm sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr] lg:px-8"><div className="flex flex-col items-start gap-2"><p className="font-semibold">{tenantName}</p>{clientSlug && <Link className="text-white/75 underline-offset-4 hover:text-white hover:underline" to={`/${clientSlug}/terms`}>Términos y servicios</Link>}</div>{links.length > 0 && <div className="lg:text-center"><p className="font-semibold">Seguinos</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 lg:justify-center">{links.map(([label, url]) => <a key={label} className="text-white/75 underline-offset-4 hover:text-white hover:underline" href={url} target="_blank" rel="noreferrer">{label}</a>)}</div></div>}<div className={`flex flex-col lg:items-end lg:text-right ${links.length ? "" : "lg:col-start-3"}`}>{address && <p className="text-white/75">{address}</p>}{config?.phoneNumber && <a className="mt-1 inline-block text-white/75 hover:text-white" href={`tel:${config.phoneNumber}`}>{config.phoneNumber}</a>}</div></div><p className="border-t border-white/15 px-5 py-3 text-center text-xs text-white/55">Plataforma desarrollada por <span className="font-semibold text-white/70">APIGRAFA</span> © {new Date().getFullYear()}</p></footer>;
}

function PublicPortalSkeleton() {
  return <main className="min-h-dvh bg-slate-950 p-4 text-slate-100 sm:p-7" aria-busy="true" aria-label="Cargando portal">
    <div className="mx-auto max-w-6xl animate-pulse space-y-7">
      <div className="flex h-14 items-center justify-between rounded-b-2xl border border-slate-700/70 bg-slate-900 px-5">
        <div className="h-6 w-32 rounded bg-slate-700" />
        <div className="h-8 w-24 rounded-full bg-slate-800" />
      </div>
      <section className="space-y-4 py-6"><div className="h-10 max-w-xl rounded-lg bg-slate-800" /><div className="h-5 max-w-2xl rounded bg-slate-800" /><div className="h-5 max-w-xl rounded bg-slate-800" /></section>
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"><div className="h-44 bg-slate-800" /><div className="space-y-3 p-5"><div className="h-5 w-3/4 rounded bg-slate-700" /><div className="h-4 w-full rounded bg-slate-800" /><div className="h-4 w-2/3 rounded bg-slate-800" /></div></div>)}</section>
    </div>
  </main>;
}
