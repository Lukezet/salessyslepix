// components/auth/RequireRole.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../store/auth";

export default function RequireRole({ allowed = [], children }) {
  const roles = useAuth((s) => s.roles);
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const location = useLocation();

  // PlatformAdmin is the cross-tenant operator role. The API remains the
  // authorization source; this only allows it to enter the platform shell.
  const hasAny = Array.isArray(roles) && (
    roles.some((r) => allowed.includes(r)) ||
    (roles.includes("PlatformAdmin") && allowed.includes("Admin"))
  );

  if (!isAuthenticated || !hasAny) {
    return <Navigate to="/" replace state={{ from: location, reason: "role" }} />;
  }

  return children;
}
