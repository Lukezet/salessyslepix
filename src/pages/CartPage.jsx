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
    <section className="space-y-4 flex flex-col items-end  m-4 sm:mx-12 md:mx-24">
      {/* Botón volver atrás */}
      <button
        onClick={() => navigate(-1)}
        className="inline-block self-start px-4 py-2 btn-custom"
      >
        ← Volver
      </button>
      <h1 className="text-2xl font-semibold self-start">Carrito</h1>
      <ul className="space-y-2 w-full">
        {items.map((i) => (
          <li key={i.product.id} className="flex justify-between  border rounded p-3 hover:bg-neutral-300 hover:ring-2">
            <div className=" flex  flex-col sm:flex-row sm:items-between justify-between gap-3" >
            <div className="flex-1">
              <div className="font-medium">{i.product.name}</div>
              <div className="text-sm text-neutral-600">{formatPrice(i.product.price)} x {i.quantity} = {formatPrice(i.product.price * i.quantity)}</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 btn-custom" onClick={() => setQty(i.product.id, i.quantity - 1)}>-</button>
              <input className="w-12 text-center border-2 border-neutral-800 rounded" value={i.quantity} onChange={(e) => setQty(i.product.id, Number(e.target.value) || 1)} />
              <button className="w-8 h-8  btn-custom" onClick={() => setQty(i.product.id, i.quantity + 1)}>+</button>
              <button className="text-sm underline cursor-pointer" onClick={() => remove(i.product.id)}>Quitar</button>
            </div>
            </div>
            <div
              className="w-24 inset-0 bg-center bg-cover rounded-lg"
              style={{ backgroundImage: `url(${i.product.images[0]})` }}
            />
          </li>
        ))}
      </ul>
      <div className="text-right text-xl">Total: {formatPrice(totalAmount)}</div>
      <button onClick={() => navigate("/checkout")} className="inline-block px-4 py-2  btn-custom">Enviar pedido</button>
    </section>
  );
}