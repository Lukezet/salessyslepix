import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";

export default function PortalLoginPage() {
  const navigate = useNavigate();
  const login = useAuth((state) => state.login);
  const initialized = useAuth((state) => state.initialized);
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const roles = useAuth((state) => state.roles);
  const empresaSlug = useAuth((state) => state.empresaSlug);
  const forceLogin = new URLSearchParams(window.location.search).get("login") === "1";
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const redirectFor = useCallback((result) => {
    if (result.roles?.includes("PlatformAdmin")) navigate("/admin?section=clients", { replace: true });
    else if (result.empresaSlug) navigate(`/${result.empresaSlug}/home`, { replace: true });
    else setError("La cuenta no tiene una empresa asociada.");
  }, [navigate]);
  useEffect(() => { if (initialized && isAuthenticated && !forceLogin) redirectFor({ roles, empresaSlug }); }, [initialized, isAuthenticated, roles, empresaSlug, redirectFor, forceLogin]);
  const submit = async (event) => { event.preventDefault(); setLoading(true); setError(""); try { redirectFor(await login(email, password)); } catch (reason) { setError(reason.message || "No se pudo iniciar sesión."); } finally { setLoading(false); } };
  return <main className="grid min-h-dvh place-items-center bg-neutral-100 p-5 text-neutral-900"><section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-xl"><p className="text-sm font-medium text-neutral-500">Portal de acceso</p><h1 className="mt-1 text-2xl font-bold">Iniciar sesión</h1><p className="mt-2 text-sm text-neutral-600">Ingresá con tus credenciales para dirigirte a tu espacio.</p><form className="mt-6 space-y-4" onSubmit={submit}><label className="grid gap-1 text-sm font-medium">Email<input required type="email" autoComplete="email" className="inputRan px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} /></label><label className="grid gap-1 text-sm font-medium">Contraseña<input required type="password" autoComplete="current-password" className="inputRan px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} /></label>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={loading} className="btn-custom w-full px-4 py-3 disabled:opacity-60" type="submit">{loading ? "Ingresando..." : "Ingresar"}</button></form></section></main>;
}
