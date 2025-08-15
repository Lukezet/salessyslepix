import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../store/cart";
import { formatPrice } from "../utils/format";

export default function CartPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // si venís con state, recordamos desde dónde
  const from = location.state?.from; // e.g. "/product/123" o "/category/2"
  // items: [{ lineId, product: { id, name, price, images[], sku?, variantId?, color?, size? }, quantity }]
  const items = useCart((s) => s.items);
  const remove = useCart((s) => s.remove);        // ahora recibe lineId
  const setQty = useCart((s) => s.setQty);        // ahora recibe lineId
  const totalAmount = useCart((s) => s.totalAmount());
  const handleBack = () => {
    const idx = window.history?.state?.idx ?? 0; // BrowserRouter guarda idx
    if (idx > 0) {
      navigate(-1);
    } else if (from) {
      navigate(from);
    } else {
      navigate("/"); // fallback final
    }
  };
  if (items.length === 0) {
    return (
      <div>
        <p>Tu carrito está vacío.</p>
        <Link to="/" className="underline">Volver a comprar</Link>
      </div>
    );
  }

  return (
    <section className="space-y-4 flex flex-col items-end m-4 sm:mx-12 md:mx-24">
      <button onClick={handleBack} className="inline-block self-start px-4 py-2 btn-custom">
        ← Volver
      </button>

      <h1 className="text-2xl font-semibold self-start">Carrito</h1>

      <ul className="space-y-2 w-full">
        {items.map((i) => {
          const p = i.product;
          const subtitleParts = [];
          if (p.sku) subtitleParts.push(`SKU: ${p.sku}`);
          if (p.color) subtitleParts.push(`Color: ${p.color}`);
          if (p.size) subtitleParts.push(`Tamaño: ${p.size}`);

          const thumb = p.images?.[0] || "";

          return (
            <li
              key={i.lineId}
              className="flex gap-3 justify-between border rounded p-3 hover:bg-neutral-300/40 hover:ring-2"
            >
              <div className="flex items-center gap-3 flex-1">
                {/* Imagen */}
                <div className="w-24 h-20 shrink-0 rounded-md overflow-hidden bg-neutral-100">
                  {thumb ? (
                    <img src={thumb} alt={p.name} className="w-full h-full object-cover" />
                  ) : null}
                </div>

                {/* Datos */}
                <div className="flex-1">
                  <div className="font-medium">{p.name}</div>
                  {subtitleParts.length > 0 && (
                    <div className="text-xs text-neutral-600">{subtitleParts.join(" · ")}</div>
                  )}
                  <div className="text-sm text-neutral-700">
                    {formatPrice(p.price)} x {i.quantity} ={" "}
                    <strong>{formatPrice(p.price * i.quantity)}</strong>
                  </div>
                </div>
              </div>

              {/* Controles */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  className="w-8 h-8 btn-custom"
                  onClick={() => setQty(i.lineId, i.quantity + 1)}
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
               
                <input
                  className="w-10 text-center border-2 border-neutral-800 rounded"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={i.quantity}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setQty(i.lineId, Number.isFinite(v) && v > 0 ? v : 1);
                  }}
                />
                 <button
                  className="w-8 h-8 btn-custom"
                  onClick={() => setQty(i.lineId, Math.max(1, i.quantity - 1))}
                  aria-label="Disminuir cantidad"
                >
                  -
                </button>
                <button
                  className="text-sm underline cursor-pointer"
                  onClick={() => remove(i.lineId)}
                >
                  Quitar
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="text-right text-xl">Total: {formatPrice(totalAmount)}</div>
      <button onClick={() => navigate("/checkout")} className="inline-block px-4 py-2 btn-custom">
        Enviar pedido
      </button>
    </section>
  );
}
