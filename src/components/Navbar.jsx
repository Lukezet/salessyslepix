// Navbar.jsx
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../store/cart";
import { useAuth } from "../store/auth";
import { getDolarValue } from "../services/catalog";
import userIcon from "../assets/user.png"
import userOut from "../assets/logout.png"
import Login from "./auth/Login";


export default function Navbar() {
  const [usdRate, setUsdRate] = useState(null);

useEffect(() => {
  let alive = true;
  (async () => {
    try {
      const { rate } = await getDolarValue();
      if (alive) setUsdRate(rate);
    } catch {
      if (alive) setUsdRate(null);
    }
  })();

  // opcional: refrescar cada X min (comenta si no lo querés)
  // const id = setInterval(async () => {
  //   try {
  //     const { rate } = await getDolarValue();
  //     if (alive) setUsdRate(rate);
  //   } catch {}
  // }, 10 * 60 * 1000);

  return () => {
    alive = false;
    // clearInterval(id);
  };
}, []);
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const total = useCart((s) => s.totalItems());

  const isAuth = useAuth((s) => s.isAuthenticated);
  const roles  = useAuth((s) => s.roles);
  const canManage = isAuth && roles?.some(r => r === "Admin" || r === "Employee");
  const userName = useAuth((s) => s.userName);
  const logout = useAuth((s) => s.logout);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setOpen(false);
  };

  return (
    <header className="bg-yellow-400 sticky top-0 z-20 rounded-b-xl sm:rounded-br-full">
      <div className="h-14 flex items-center justify-between sm:mr-12">

        {/* Buscador (desktop) */}
        <div className="hidden sm:block w-3/12 px-4 ">
          <form onSubmit={onSearchSubmit} role="search" className="relative max-w-xl mx-auto">
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar artículos…"
              autoComplete="off"
              className="w-full rounded-full inputRan px-3 py-2 pr-16 text-sm focus:outline-none focus:ring"
            />
            <button
              type="submit"
              className="absolute right-6 top-1/2  -translate-y-1/2 px-3 py-1 text-xs rounded-full  hover:bg-gray-50 hover:border-2 hover:border-yellow-400"
            >
              <svg fill="#000000" width="20" height="20" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
                <path d="M790.588 1468.235c-373.722 0-677.647-303.924-677.647-677.647 0-373.722 303.925-677.647 677.647-677.647 373.723 0 677.647 303.925 677.647 677.647 0 373.723-303.924 677.647-677.647 677.647Zm596.781-160.715c120.396-138.692 193.807-319.285 193.807-516.932C1581.176 354.748 1226.428 0 790.588 0S0 354.748 0 790.588s354.748 790.588 790.588 790.588c197.647 0 378.24-73.411 516.932-193.807l516.028 516.142 79.963-79.963-516.142-516.028Z" />
              </svg>
            </button>
          </form>
        </div>

        <Link to="/" className="font-bold text-2xl select-none  ml-4 sm:ml-0 active:scale-95 transition">
          LePix
        </Link>

        {/* carrito mobile */}
        <NavLink to="/cart" className="relative sm:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
          <span className="absolute top-4 -right-1 font-semibold text-xs rounded-full bg-green-900 text-white p-0.5 px-1">{total}</span>
        </NavLink>
        {canManage && (
        <>
          <span className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-lg border text-green-400 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                  <span className="opacity-70">USD blue:</span>
                  <strong className="tabular-nums">
                    {usdRate != null
                      ? usdRate.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                      : "…"}
                  </strong>
                </span>
        </>)}
        
        <button
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="sm:hidden inline-flex items-center justify-center w-10 h-10 mr-4 rounded-md active:scale-95 transition"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="relative block w-6 h-4 cursor-pointer">
            <span className={"absolute left-0 top-0 h-[2px] w-6 bg-black transition-transform duration-300 " + (open ? "translate-y-[6px] rotate-45" : "")} />
            <span className={"absolute left-0 top-1/2 -translate-y-1/2 h-[2px] w-6 bg-black transition-all duration-300 " + (open ? "opacity-0" : "opacity-100")} />
            <span className={"absolute left-0 bottom-0 h-[2px] w-6 bg-black transition-transform duration-300 " + (open ? "-translate-y-[6px] -rotate-45" : "")} />
          </span>
        </button>

        {/* Nav desktop */}
        <nav className="hidden sm:flex gap-4 sm:gap-10 items-center font-semibold">
          <NavLink to="/" className="hover:scale-110 transition active:scale-90">Inicio</NavLink>
          {canManage && (
          <>
            <NavLink to="/ordersDashboard" className="hover:scale-110 transition active:scale-90">Ventas</NavLink>

                <NavLink to="/admin" className="hover:scale-110 transition active:scale-90">Productos</NavLink>

          </>
        )}

          
          <NavLink to="/cart" className="relative hover:scale-110 transition active:scale-90">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            <span className="absolute top-4 -right-1 font-semibold text-xs rounded-full bg-green-900 text-white p-0.5 px-1">{total}</span>
          </NavLink>

          {/* Login / Usuario */}
          {!isAuth ? (
            <button
              onClick={() => setLoginOpen(true)}
              className=" inputRan rounded-full border px-2 py-2 hover:opacity-90 active:scale-95 transition cursor-pointer"
            >
              <img src={userIcon} alt="" className="w-5 h-5 hover:scale-110 transition active:scale-90" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm">Hola, {userName}</span>
              <button
                onClick={logout}
                className="rounded-full border px-2 py-2 hover:opacity-90 active:scale-95 transition cursor-pointer"
              >
                <img src={userOut} alt="" className="w-5 h-5 hover:scale-110 transition active:scale-90" />
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
        <div className="bg-yellow-400 pl-2 flex flex-col">
          {/* Buscador (mobile) */}
          <form onSubmit={onSearchSubmit} role="search" className="p-2 pr-4 cursor-auto">
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar artículos…"
              autoComplete="off"
              className="w-full inputRan rounded-full shadow-xl px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-white"
            />
          </form>

          <NavLink to="/" className="hover:bg-white rounded-l-full p-2" onClick={() => setOpen(false)}>Inicio</NavLink>
          <NavLink to="/cart" className="hover:bg-white rounded-l-full p-2" onClick={() => setOpen(false)}>
            Carrito ({total})
          </NavLink>
                    {canManage && (
    <>
      <NavLink to="/admin" className="hover:bg-white rounded-l-full p-2" onClick={() => setOpen(false)}>Productos</NavLink>
          <NavLink to="/ordersDashboard" className="hover:bg-white rounded-l-full p-2 mb-2" onClick={() => setOpen(false)}>Ventas</NavLink>
    </>
  )}
         
          {!isAuth ? (
            <button
              onClick={() => { setLoginOpen(true); setOpen(false); }}
              className="text-left hover:bg-white rounded-l-full p-2 mb-2"
            >
              Login
            </button>
          ) : (
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="text-left flex items-center hover:bg-white rounded-l-full p-2 mb-2"
            >
              Salir ({userName})  <img src={userOut} alt="" className=" ml-2 w-5 h-5 hover:scale-110 transition active:scale-90" />
            </button>
          )}
        </div>
      </div>

      {/* Modal Login */}
      <Login open={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  );
}
