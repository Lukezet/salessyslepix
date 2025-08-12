import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../store/cart";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const total = useCart((s) => s.totalItems());

  return (
    <header className="bg-yellow-400 sticky top-0 z-20 sm:rounded-br-full">
      <div className="h-14 flex items-center justify-between sm:mr-12">
        <Link to="/" className="font-bold text-xl select-none ml-4">Lepix</Link>

        {/* Botón hamburguesa animado */}
        <button
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="sm:hidden inline-flex items-center justify-center w-10 h-10 mr-4 rounded-md active:scale-95 transition"
          onClick={() => setOpen(o => !o)}
        >
          <span className="relative block w-6 h-4  cursor-pointer">
            {/* línea 1 */}
            <span
              className={
                "absolute left-0 top-0 h-[2px] w-6 bg-black transition-transform duration-300 " +
                (open ? "translate-y-[6px] rotate-45" : "")
              }
            />
            {/* línea 2 */}
            <span
              className={
                "absolute left-0 top-1/2 -translate-y-1/2 h-[2px] w-6 bg-black transition-all duration-300 " +
                (open ? "opacity-0" : "opacity-100")
              }
            />
            {/* línea 3 */}
            <span
              className={
                "absolute left-0 bottom-0 h-[2px] w-6 bg-black transition-transform duration-300 " +
                (open ? "-translate-y-[6px] -rotate-45" : "")
              }
            />
          </span>
        </button>

        {/* Nav desktop */}
        <nav className="hidden sm:flex gap-4 items-center">
          <NavLink to="/" className="hover:underline">Inicio</NavLink>
          <NavLink to="/cart" className="hover:underline">Carrito ({total})</NavLink>
          <NavLink to="/admin" className="hover:underline">Gestión</NavLink>
        </nav>
      </div>

      {/* Menú móvil con transición */}
      <div
        id="mobile-menu"
        className={
          "sm:hidden bg-white overflow-hidden transition-all duration-300 " +
          (open ? "max-h-60 opacity-100" : "max-h-0 opacity-0")
        }
      >
        <div className="bg-yellow-400 pl-2 flex flex-col cursor-pointer">
          {/* Bloque 1 y 2 “pegados” para el efecto de esquina compartida */}
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
            className="hover:bg-white rounded-l-full p-2 transition-colors duration-200 ease-in-out mb-2"
            onClick={() => setOpen(false)}
          >
            Gestión
          </NavLink>
        </div>
      </div>
    </header>
  );
}
