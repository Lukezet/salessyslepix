import { Outlet, useLocation, useParams } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import { useAuth } from "./store/auth";
import { useTenantConfig } from "./store/tenantConfig";
import TenantBranding from "./components/tenant/TenantBranding";
import PortalLoginPage from "./pages/PortalLoginPage";

export default function App() {
  const location = useLocation();
  const { clientSlug = null } = useParams();
  const isPortalEntry = location.pathname === "/";
  const tenantName = useTenantConfig((state) => state.config?.name ?? "Lepix");

  useEffect(() => {
    const isVisitorPreview =
      new URLSearchParams(window.location.search).get("preview") === "1";
    if (!isVisitorPreview) useAuth.getState().initFromStorage();
    useTenantConfig.getState().load(clientSlug);
  }, [clientSlug]);

  if (isPortalEntry) return <PortalLoginPage />;
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
      <footer className="tenant-footer rounded-t-3xl">
        <div className="container py-6 text-sm text-neutral-400 font-semibold pl-4">
          © {new Date().getFullYear()} {tenantName}
        </div>
      </footer>
    </div>
  );
}
