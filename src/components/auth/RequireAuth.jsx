// components/auth/RequireAuth.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../../store/auth";

export default function RequireAuth({ children }) {
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const initialized = useAuth((s) => s.initialized);
  const initFromStorage = useAuth((s) => s.initFromStorage);
  const location = useLocation();

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

  return children;
}
