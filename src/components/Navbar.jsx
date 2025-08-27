import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../store/cart";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const total = useCart((s) => s.totalItems());
console.log('Navbar rendered');
  const onSearchSubmit = (e) => {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setOpen(false); // cierra el menú mobile
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
              <svg fill="#000000" width="20px" height="20px" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
                <path d="M790.588 1468.235c-373.722 0-677.647-303.924-677.647-677.647 0-373.722 303.925-677.647 677.647-677.647 373.723 0 677.647 303.925 677.647 677.647 0 373.723-303.924 677.647-677.647 677.647Zm596.781-160.715c120.396-138.692 193.807-319.285 193.807-516.932C1581.176 354.748 1226.428 0 790.588 0S0 354.748 0 790.588s354.748 790.588 790.588 790.588c197.647 0 378.24-73.411 516.932-193.807l516.028 516.142 79.963-79.963-516.142-516.028Z" fillRule="evenodd"></path>
            </svg>
            </button>
          </form>
        </div>
        <Link
          to="/"
          className="font-bold text-2xl select-none  ml-4 sm:ml-0 active:scale-95 transition duration-150 ease-out"
        >
          LePix
        </Link>


        {/* carrito de compras (mobile) */}
        <NavLink to="/cart" className="relative sm:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
          <span className="absolute top-4 -right-1 font-semibold text-xs rounded-full bg-green-900 text-white p-0.5 px-1">{total}</span>
        </NavLink>

        {/* Botón hamburguesa animado */}
        <button
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="sm:hidden inline-flex items-center justify-center w-10 h-10 mr-4 rounded-md active:scale-95 transition duration-150 ease-out"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="relative block w-6 h-4 cursor-pointer">
            <span className={"absolute left-0 top-0 h-[2px] w-6 bg-black transition-transform duration-300 " + (open ? "translate-y-[6px] rotate-45" : "")} />
            <span className={"absolute left-0 top-1/2 -translate-y-1/2 h-[2px] w-6 bg-black transition-all duration-300 " + (open ? "opacity-0" : "opacity-100")} />
            <span className={"absolute left-0 bottom-0 h-[2px] w-6 bg-black transition-transform duration-300 " + (open ? "-translate-y-[6px] -rotate-45" : "")} />
          </span>
        </button>

        {/* Nav desktop */}
        <nav className="hidden sm:flex gap-4 sm:gap-12 items-center font-semibold">
          <NavLink to="/" className="hover:scale-110 transition duration-150 ease-out active:scale-90">Inicio</NavLink>
          <NavLink to="/ordersDashboard" className="hover:scale-110 transition duration-150 ease-out active:scale-90">Ventas</NavLink>
          <NavLink to="/admin" className="hover:scale-110 transition duration-150 ease-out active:scale-90">Productos</NavLink>
          <NavLink to="/cart" className="relative hover:scale-110 transition duration-150 ease-out active:scale-90">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            <span className="absolute top-4 -right-1 font-semibold text-xs rounded-full bg-green-900 text-white p-0.5 px-1 ">{total}</span>
          </NavLink>
        </nav>
      </div>

      {/* Menú móvil con transición */}
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

          <NavLink
            to="/"
            className="hover:bg-white rounded-l-full p-2 transition-colors duration-200 ease-in-out"
            onClick={() => setOpen(false)}
          >
            Inicio
          </NavLink>
          <NavLink
            to="/cart"
            className="hover:bg-white rounded-l-full p-2 transition-colors duration-200 ease-in-out"
            onClick={() => setOpen(false)}
          >
            Carrito ({total})
          </NavLink>
          <NavLink
            to="/admin"
            className="hover:bg-white rounded-l-full p-2 transition-colors duration-200 ease-in-out"
            onClick={() => setOpen(false)}
          >
            Productos
          </NavLink>
          <NavLink
            to="/ordersDashboard"
            className="hover:bg-white rounded-l-full p-2 transition-colors duration-200 ease-in-out mb-2"
            onClick={() => setOpen(false)}
          >
            Ventas
          </NavLink>
        </div>
      </div>
    </header>
  );
}