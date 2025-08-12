import { useState } from "react";
import { useCart } from "../store/cart";

export default function Checkout() {
const items = useCart(s => s.items);
const clear = useCart(s => s.clear);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      // Simulación de envío. Acá luego harás fetch a tu API .NET
      await new Promise((r) => setTimeout(r, 800));
      console.log("Pedido enviado:", { ...form, items });
      clear();
      setOk(true);
    } finally {
      setLoading(false);
    }
  };

  if (ok) return <div className="space-y-2"><h1 className="text-2xl font-semibold">¡Gracias!</h1><p>Tu pedido fue enviado. Te contactaremos a la brevedad.</p></div>;

  return (
    <section className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Datos de contacto</h1>
      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm mb-1">Nombre</label>
          <input required className="w-full border rounded px-3 h-10" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input required type="email" className="w-full border rounded px-3 h-10" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} />
        </div>
        <div>
          <label className="block text-sm mb-1">Teléfono</label>
          <input className="w-full border rounded px-3 h-10" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} />
        </div>
        <button disabled={loading} className="px-4 py-2 rounded-xl border hover:shadow disabled:opacity-50 active:scale-95">
          {loading ? "Enviando..." : "Enviar pedido"}
        </button>
      </form>
    </section>
  );
}