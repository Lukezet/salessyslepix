// src/components/AddButton.jsx
import { useState } from "react";
import { useCart } from "../store/cart";
import AddToCartModal from "./AddToCartModal";

export default function AddButton({ product, className = "" }) {
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(""); // vacío = agrega 1
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [lastQty, setLastQty] = useState(1);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;

    let n = parseInt(qty, 10);
    if (!Number.isFinite(n) || n <= 0) n = 1;

    setBusy(true);
    add(product, n);          // ← ahora add compone lineId con variantId
    setLastQty(n);
    setOpen(true);
    setTimeout(() => setBusy(false), 250);
  };

  const onInputClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") handleAdd(e);
  };

  return (
    <>
      <div className={`relative w-20 h-12 ${className}`}>
        <button
          className="z-20 top-0 right-0 absolute group cursor-pointer outline-none hover:rotate-90 duration-300"
          title="Agregar"
          onClick={handleAdd}
          disabled={busy}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="40px" height="40px" viewBox="0 0 24 24" className="stroke-yellow-500 fill-zinc-800 group-active:stroke-zinc-200 group-active:fill-zinc-600 group-active:duration-0 duration-300 ">
            <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" strokeWidth="1.5" />
            <path d="M8 12H16" strokeWidth="1.5" />
            <path d="M12 16V8" strokeWidth="1.5" />
          </svg>
        </button>
        <input
          className="absolute z-10 top-1.5 right-4 w-16 h-7 bg-white rounded-l-2xl pl-4 no-spinner"
          type="number"
          min={1}
          inputMode="numeric"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          onClick={onInputClick}
          onKeyDown={onKeyDown}
          placeholder="0"
          aria-label="Cantidad"
        />
      </div>

      <AddToCartModal
        open={open}
        onClose={() => setOpen(false)}
        product={product}
        quantity={lastQty}
      />
    </>
  );
}
