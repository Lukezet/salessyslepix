import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";

export default function AddToCartModal({ open, onClose, product, quantity }) {
  // Llamar SIEMPRE a los hooks (no retornes antes)
  useEffect(() => {
    if (!open) return; // no hacer nada si está cerrado

    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null; // recién acá retornamos

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 top-1/3 mx-auto w-[90%] max-w-sm bg-white rounded-2xl shadow p-5">
        <h2 className="text-lg font-semibold mb-2">¡Agregado!</h2>
        <p className="text-neutral-700 mb-4">
          Has agregado <span className="font-semibold">{quantity}</span> {product?.name} al carrito.
        </p>
        <div className="flex gap-2 justify-end">
          <button className="px-3 h-10 rounded-xl border active:scale-95" onClick={onClose}>
            Seguir comprando
          </button>
          <Link
            to="/cart"
            className="px-3 h-10 rounded-xl bg-zinc-900 text-yellow-400 grid place-items-center active:scale-95"
            onClick={onClose}
          >
            Ir al carrito
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}