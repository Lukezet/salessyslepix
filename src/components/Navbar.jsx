// Navbar.jsx
import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { useCart } from "../store/cart";
import { useAuth } from "../store/auth";
import { useUsdRate } from "../store/usdRate";
import { useTenantBranding, useTenantConfig } from "../store/tenantConfig";
import userIcon from "../assets/user.png";
import userOut from "../assets/logout.png";
import Login from "./auth/Login";
import DolarRefreshModal from "./DolarRefreshModal";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [term, setTerm] = useState("");
  const location = useLocation();
  const { clientSlug } = useParams();
  const isAuth = useAuth((s) => s.isAuthenticated);
  const roles = useAuth((s) => s.roles);
  const hasPlatformAdminRole = isAuth && roles?.includes("PlatformAdmin");
  const hasAdminRole =
    isAuth &&
    roles?.some((role) => role === "Admin" || role === "PlatformAdmin");
  const isPlatformAdmin =
    hasPlatformAdminRole && location.pathname.startsWith("/admin");
  const isCheckout = location.pathname.endsWith("/checkout");
  const isVisitorPreview =
    new URLSearchParams(location.search).get("preview") === "1";
  const isPublicClientPortal = Boolean(clientSlug);
  const homeHref = isPlatformAdmin
    ? "/admin?section=clients"
    : isPublicClientPortal
      ? `/${clientSlug}/home`
      : "/";
  const panelHref = hasPlatformAdminRole
    ? "/admin?section=clients"
    : clientSlug
      ? `/${clientSlug}/admin?section=products`
      : "/admin?section=products";
  const ordersHref = clientSlug
    ? `/${clientSlug}/ordersDashboard`
    : "/ordersDashboard";
  const { rate: usdRate, load, refresh } = useUsdRate(); // 👈 usa el store
  const [openRefresh, setOpenRefresh] = useState(false);
  useEffect(() => {
    if (isCheckout) return;
    load(); // GET /api/exchange-rate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);
  useEffect(() => {
    const onFocus = () => load();
    const onPageShow = (e) => {
      if (e.persisted) load();
    }; // back/forward cache
    const onVisibility = () => {
      if (document.visibilityState === "visible") load();
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    let alive = true;
    (async () => {
      await load(); // 👈 carga inicial global
    })();

    // refresco opcional cada 1h (si querés)
    const id = setInterval(
      () => {
        if (alive) load();
      },
      60 * 60 * 1000,
    );
    return () => {
      alive = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleOpenModal = () => setOpenRefresh(true);
  const handleCloseModal = () => setOpenRefresh(false);

  const handleConfirmRefresh = async (optionalRate) => {
    const res = await refresh(optionalRate ?? undefined);
    console.log("que carajo traigo", res); // 👈 refresco global
    return res; // el modal no necesita nada más, pero lo devolvemos igual
  };

  const navigate = useNavigate();
  const goHome = (event) => {
    event.preventDefault();
    navigate(homeHref);
    setOpen(false);
  };
  const total = useCart((s) => s.totalItems());

  // PlatformAdmin also has access to the legacy administrative modules.
  const canManage =
    isAuth &&
    !isPlatformAdmin &&
    roles?.some((r) => r === "Admin" || r === "Employee");
  const configuredTenant = useTenantConfig((s) => s.config);
  const tenantIsLoaded = useTenantConfig((s) => s.isLoaded);
  const featureStoreEnabled = useTenantConfig((s) => s.features.store);
  const storeEnabled =
    !isPublicClientPortal ||
    (tenantIsLoaded &&
      configuredTenant?.slug?.toLowerCase() === clientSlug?.toLowerCase() &&
      featureStoreEnabled);
  const showStoreNavigation = !isPlatformAdmin && storeEnabled;
  const userName = useAuth((s) => s.userName);
  const logout = useAuth((s) => s.logout);
  const { logoUrl } = useTenantBranding();
  const tenantName = useTenantConfig(
    (s) => s.config?.name ?? (clientSlug || "LePix"),
  );

  const onSearchSubmit = (e) => {
    e.preventDefault();
    if (isVisitorPreview) return;
    const q = term.trim();
    if (!q) return;
    navigate(
      `${clientSlug ? `/${clientSlug}` : ""}/search?q=${encodeURIComponent(q)}`,
    );
    setOpen(false);
  };

  return (
    <header
      className={`${isPlatformAdmin ? "admin-navbar" : "tenant-header"} sticky top-0 z-20 rounded-b-xl sm:rounded-br-full`}
    >
      <div
        className={`relative h-14 flex items-center ${isPlatformAdmin ? "w-full justify-end px-4 sm:px-12" : "justify-between sm:mr-12"}`}
      >
        {isPublicClientPortal && (
          <Link
            to={homeHref}
            onClick={goHome}
            aria-label={`Ir al inicio de ${tenantName}`}
            className="absolute left-1/2 -translate-x-1/2 active:scale-95 transition"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={tenantName}
                className="h-10 max-w-36 object-contain"
              />
            ) : (
              <span className="text-base font-bold uppercase tracking-[.08em]">
                {tenantName}
              </span>
            )}
          </Link>
        )}

        {/* Buscador (desktop) */}
        {!isPlatformAdmin && (
          <div className="hidden sm:block w-3/12 px-4 ">
            <form
              onSubmit={onSearchSubmit}
              role="search"
              className="relative max-w-xl mx-auto"
            >
              <input
                type="text"
                value={term}
                onChange={(e) => {
                  if (!isVisitorPreview) setTerm(e.target.value);
                }}
                disabled={isVisitorPreview}
                readOnly={isVisitorPreview}
                tabIndex={isVisitorPreview ? -1 : undefined}
                placeholder="Buscar artículos…"
                autoComplete="off"
                className="w-full rounded-full inputRan px-3 py-2 pr-24 text-sm focus:outline-none focus:ring"
              />
              {term && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  disabled={isVisitorPreview}
                  onClick={() => setTerm("")}
                  className="absolute right-12 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="m6 6 12 12M18 6 6 18" />
                  </svg>
                </button>
              )}
              <button
                type="submit"
                disabled={isVisitorPreview}
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full hover:bg-gray-50 hover:border-2 hover:border-yellow-400"
              >
                <svg
                  fill="#000000"
                  width="20"
                  height="20"
                  viewBox="0 0 1920 1920"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M790.588 1468.235c-373.722 0-677.647-303.924-677.647-677.647 0-373.722 303.925-677.647 677.647-677.647 373.723 0 677.647 303.925 677.647 677.647 0 373.723-303.924 677.647-677.647 677.647Zm596.781-160.715c120.396-138.692 193.807-319.285 193.807-516.932C1581.176 354.748 1226.428 0 790.588 0S0 354.748 0 790.588s354.748 790.588 790.588 790.588c197.647 0 378.24-73.411 516.932-193.807l516.028 516.142 79.963-79.963-516.142-516.028Z" />
                </svg>
              </button>
            </form>
          </div>
        )}

        {!isPlatformAdmin && !isPublicClientPortal && (
          <Link
            to={homeHref}
            onClick={goHome}
            className="font-bold text-2xl select-none ml-4 sm:ml-0 active:scale-95 transition"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={tenantName}
                className="h-10 max-w-32 object-contain"
              />
            ) : (
              tenantName
            )}
          </Link>
        )}

        {/* carrito mobile */}
        {showStoreNavigation && (
          <NavLink
            to={clientSlug ? `/${clientSlug}/cart` : "/cart"}
            aria-disabled={isVisitorPreview}
            onClick={(event) => isVisitorPreview && event.preventDefault()}
            className={`relative sm:hidden ${isVisitorPreview ? "pointer-events-none opacity-60" : ""}`}
          >
            <span className="relative flex h-8 w-8">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                />
              </svg>
              <span className="absolute bottom-0 right-0 grid h-5 min-w-5 translate-x-1/4 translate-y-1/2 place-items-center rounded-full bg-green-900 px-1 text-[11px] font-semibold leading-none text-white">
                {total}
              </span>
            </span>
          </NavLink>
        )}
        {canManage && storeEnabled && (
          <>
            <span className="inline-flex items-center gap-1 text-xs sm:text-sm pl-1 sm:px-2 sm:py-1 rounded-lg border text-green-400 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
              <span className="opacity-70">USD blue:</span>
              <strong className="tabular-nums mr-1">
                {usdRate != null
                  ? usdRate.toLocaleString("es-AR", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })
                  : "…"}
              </strong>
              <button
                onClick={handleOpenModal}
                className="border-1 rounded-md bg-neutral-700 hover:scale-110 cursor-pointer transition ease-out p-1"
                title="Modificar / Refrescar valor"
                aria-label="Modificar o refrescar dólar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
              </button>
            </span>
          </>
        )}
        {/* Modal */}
        <DolarRefreshModal
          open={openRefresh}
          onClose={handleCloseModal}
          onConfirm={handleConfirmRefresh}
        />
        <button
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="sm:hidden inline-flex items-center justify-center w-10 h-10 mr-4 rounded-md active:scale-95 transition"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="relative block w-6 h-4 cursor-pointer">
            <span
              className={
                "absolute left-0 top-0 h-[2px] w-6 bg-black transition-transform duration-300 " +
                (open ? "translate-y-[6px] rotate-45" : "")
              }
            />
            <span
              className={
                "absolute left-0 top-1/2 -translate-y-1/2 h-[2px] w-6 bg-black transition-all duration-300 " +
                (open ? "opacity-0" : "opacity-100")
              }
            />
            <span
              className={
                "absolute left-0 bottom-0 h-[2px] w-6 bg-black transition-transform duration-300 " +
                (open ? "-translate-y-[6px] -rotate-45" : "")
              }
            />
          </span>
        </button>

        {/* Nav desktop */}
        <nav
          className={`${isPlatformAdmin ? "admin-nav" : "tenant-nav"} hidden sm:flex items-center font-semibold`}
        >
          {hasAdminRole && !isPlatformAdmin && (
            <NavLink to={panelHref}>Panel</NavLink>
          )}
          {!isPlatformAdmin && (
            <NavLink
              to={homeHref}
              onClick={goHome}
              className="transition active:scale-95"
            >
              Inicio
            </NavLink>
          )}
          {isPlatformAdmin && (
            <NavLink
              to="/admin?section=clients"
              className="transition active:scale-95"
            >
              Clientes
            </NavLink>
          )}
          {canManage && storeEnabled && (
            <>
              <NavLink to={ordersHref} className="transition active:scale-95">
                Ventas
              </NavLink>

              <NavLink to={panelHref} className="transition active:scale-95">
                Productos
              </NavLink>
            </>
          )}

          {showStoreNavigation && (
            <NavLink
              to={clientSlug ? `/${clientSlug}/cart` : "/cart"}
              aria-disabled={isVisitorPreview}
              onClick={(event) => isVisitorPreview && event.preventDefault()}
              className={`relative transition active:scale-95 ${isVisitorPreview ? "pointer-events-none opacity-60" : ""}`}
            >
              <span className="relative flex h-8 w-8">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                  />
                </svg>
                <span className="absolute bottom-0 right-0 grid h-5 min-w-5 translate-x-1/4 translate-y-1/2 place-items-center rounded-full bg-green-900 px-1 text-[11px] font-semibold leading-none text-white">
                  {total}
                </span>
              </span>
            </NavLink>
          )}

          {/* Login / Usuario */}
          {!isAuth ? (
            <button
              onClick={() => !isVisitorPreview && setLoginOpen(true)}
              disabled={isVisitorPreview}
              aria-disabled={isVisitorPreview}
              className={`inputRan rounded-full border px-2 py-2 transition ${isVisitorPreview ? "cursor-not-allowed opacity-60" : "hover:opacity-90 active:scale-95 cursor-pointer"}`}
            >
              <img
                src={userIcon}
                alt=""
                className="w-5 h-5 hover:scale-110 transition active:scale-90"
              />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm">Hola, {userName}</span>
              <button
                onClick={logout}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                className={`${isPlatformAdmin ? "admin-navbar-action" : "border"} rounded-full px-2 py-2 hover:opacity-90 active:scale-95 transition cursor-pointer`}
              >
                <img
                  src={userOut}
                  alt=""
                  className={`w-5 h-5 hover:scale-110 transition active:scale-90 ${isPlatformAdmin ? "brightness-0 invert" : ""}`}
                />
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Menú móvil */}
      <div
        id="mobile-menu"
        className={
          "sm:hidden bg-white overflow-hidden transition-all duration-300 " +
          (open ? "max-h-72 opacity-100" : "max-h-0 opacity-0")
        }
      >
        <div
          className={`${isPlatformAdmin ? "admin-navbar" : "tenant-header"} pl-2 flex flex-col`}
        >
          {/* Buscador (mobile) */}
          {!isPlatformAdmin && (
            <form
              onSubmit={onSearchSubmit}
              role="search"
              className="p-2 pr-4 cursor-auto"
            >
              <input
                type="text"
                value={term}
                onChange={(e) => {
                  if (!isVisitorPreview) setTerm(e.target.value);
                }}
                disabled={isVisitorPreview}
                readOnly={isVisitorPreview}
                tabIndex={isVisitorPreview ? -1 : undefined}
                placeholder="Buscar artículos…"
                autoComplete="off"
                className="w-full inputRan rounded-full shadow-xl px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-white"
              />
            </form>
          )}

          {!isPlatformAdmin && (
            <NavLink
              to={homeHref}
              className="hover:bg-white rounded-l-full p-2"
              onClick={goHome}
            >
              Inicio
            </NavLink>
          )}
          {hasAdminRole && !isPlatformAdmin && (
            <NavLink
              to={panelHref}
              className="hover:bg-white rounded-l-full p-2"
              onClick={() => setOpen(false)}
            >
              Panel
            </NavLink>
          )}
          {showStoreNavigation && (
            <NavLink
              to={clientSlug ? `/${clientSlug}/cart` : "/cart"}
              aria-disabled={isVisitorPreview}
              className={`hover:bg-white rounded-l-full p-2 ${isVisitorPreview ? "pointer-events-none opacity-60" : ""}`}
              onClick={(event) => {
                if (isVisitorPreview) event.preventDefault();
                else setOpen(false);
              }}
            >
              Carrito ({total})
            </NavLink>
          )}
          {isPlatformAdmin && (
            <NavLink
              to="/admin?section=clients"
              className="hover:bg-white rounded-l-full p-2"
              onClick={() => setOpen(false)}
            >
              Clientes
            </NavLink>
          )}
          {canManage && storeEnabled && (
            <>
              <NavLink
                to={panelHref}
                className="hover:bg-white rounded-l-full p-2"
                onClick={() => setOpen(false)}
              >
                Productos
              </NavLink>
              <NavLink
                to={ordersHref}
                className="hover:bg-white rounded-l-full p-2 mb-2"
                onClick={() => setOpen(false)}
              >
                Ventas
              </NavLink>
            </>
          )}

          {!isAuth ? (
            <button
              onClick={() => {
                if (!isVisitorPreview) {
                  setLoginOpen(true);
                  setOpen(false);
                }
              }}
              disabled={isVisitorPreview}
              aria-disabled={isVisitorPreview}
              className={`text-left rounded-l-full p-2 mb-2 ${isVisitorPreview ? "cursor-not-allowed opacity-60" : "hover:bg-white"}`}
            >
              Login
            </button>
          ) : (
            <button
              onClick={() => {
                logout();
                setOpen(false);
              }}
              className="text-left flex items-center hover:bg-white rounded-l-full p-2 mb-2"
            >
              Salir ({userName}){" "}
              <img
                src={userOut}
                alt=""
                className=" ml-2 w-5 h-5 hover:scale-110 transition active:scale-90"
              />
            </button>
          )}
        </div>
      </div>

      {/* Modal Login */}
      <Login open={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  );
}
