import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../store/cart";
import { formatPrice } from "../utils/format";

export default function CartPage() {
  const navigate = useNavigate();
const items = useCart(s => s.items);
const remove = useCart(s => s.remove);
const setQty = useCart(s => s.setQty);
const totalAmount = useCart(s => s.totalAmount());


  if (items.length === 0) {
    return (
      <div>
        <p>Tu carrito está vacío.</p>
        <Link to="/" className="underline">Volver a comprar</Link>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Carrito</h1>
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i.product.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border rounded p-3">
            <div className="flex-1">
              <div className="font-medium">{i.product.name}</div>
              <div className="text-sm text-neutral-600">{formatPrice(i.product.price)} x {i.quantity} = {formatPrice(i.product.price * i.quantity)}</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 border rounded active:scale-95" onClick={() => setQty(i.product.id, i.quantity - 1)}>-</button>
              <input className="w-12 text-center border rounded" value={i.quantity} onChange={(e) => setQty(i.product.id, Number(e.target.value) || 1)} />
              <button className="w-8 h-8 border rounded active:scale-95" onClick={() => setQty(i.product.id, i.quantity + 1)}>+</button>
              <button className="text-sm underline" onClick={() => remove(i.product.id)}>Quitar</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="text-right text-xl">Total: {formatPrice(totalAmount)}</div>
      <button onClick={() => navigate("/checkout")} className="inline-block px-4 py-2 rounded-xl border hover:shadow active:scale-95">Enviar pedido</button>
    </section>
  );
}