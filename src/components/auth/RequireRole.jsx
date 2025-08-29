// components/auth/RequireRole.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../store/auth";

export default function RequireRole({ allowed = [], children }) {
  const roles = useAuth((s) => s.roles);
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const location = useLocation();

  const hasAny = Array.isArray(roles) && roles.some((r) => allowed.includes(r));

  if (!isAuthenticated || !hasAny) {
    return <Navigate to="/" replace state={{ from: location, reason: "role" }} />;
  }

  return children;
}
