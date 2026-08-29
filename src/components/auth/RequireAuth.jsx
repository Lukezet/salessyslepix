// components/auth/RequireAuth.jsx
import { Navigate, useLocation, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../../store/auth";

export default function RequireAuth({ children }) {
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const initialized = useAuth((s) => s.initialized);
  const initFromStorage = useAuth((s) => s.initFromStorage);
  const empresaSlug = useAuth((s) => s.empresaSlug);
  const location = useLocation();
  const { clientSlug } = useParams();

  // hidrata por si refrescan la página
  useEffect(() => {
    if (!isAuthenticated) initFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!initialized) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location, reason: "auth" }} />;
  }

  // Un usuario de empresa sólo puede abrir rutas privadas de su propio portal.
  // PlatformAdmin mantiene el acceso transversal que valida el backend.
  const isPlatformAdmin = useAuth.getState().roles.includes("PlatformAdmin");
  if (clientSlug && !isPlatformAdmin && empresaSlug?.toLowerCase() !== clientSlug.toLowerCase()) {
    return <Navigate to={empresaSlug ? `/${empresaSlug}/home` : "/"} replace state={{ reason: "tenant" }} />;
  }

  return children;
}
