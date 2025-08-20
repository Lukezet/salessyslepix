import { useState } from "react";
import { useCart } from "../store/cart";
import { createOrder, getEmpresaPhoneNumber  } from "../services/catalog";
import { formatPrice } from "../utils/format";

export default function Checkout() {
  const items = useCart((s) => s.items);
  const totalAmount = useCart((s) => s.totalAmount());
  const clear = useCart((s) => s.clear);

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: ""
  });

  const generarMensaje = () => {
    let msg = `¡Hola! Te paso el resumen de mi pedido:\n\n`;
    msg += `🧑 Nombre: ${form.name}\n📞 Teléfono: ${form.phone}\n📍 Dirección: ${form.address}\n📝 Observaciones: ${form.notes || "-"}\n\n`;
    msg += `🛍 Productos:\n`;

    for (const i of items) {
      msg += `• ${i.quantity} x ${i.product.name} (${formatPrice(i.product.price * i.quantity)})\n`;
      if (i.product.color) msg += `  - Color: ${i.product.color}\n`;
      if (i.product.size) msg += `  - Tamaño: ${i.product.size}\n`;
      if (i.note) msg += `  - Nota: ${i.note}\n`;
    }

    msg += `\n💰 Total: ${formatPrice(totalAmount)}\n\n`;
    msg += `Quedo atento a tu confirmación. ¡Gracias! 🙌`;

    return msg;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const payload = {
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        customerAddress: form.address,
        customerObservations: form.notes,
        paymentMethod: "Efectivo", // opcional
        paymentAmount: 0,
        discountPercent: 0,
        details: items.map((i) => ({
          productVariantId: i.product.variantId,
          quantity: i.quantity,
          note: i.note || ""
        }))
      };
      
      console.log("items del carrito:", items.map(i => ({
        name: i.product.name,
        variantId: i.product.variantId,
        fullProduct: i.product
      })));

      await createOrder(payload);
      const phone = await getEmpresaPhoneNumber();
      const mensaje = generarMensaje();
      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`;

      clear();
      setOk(true);
      window.open(waUrl, "_blank");
    } catch (err) {
      console.error("Error al crear la orden", err);
      alert("Ocurrió un error al crear la orden.");
    } finally {
      setLoading(false);
    }
  };

  if (ok) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">¡Gracias!</h1>
        <p>Tu pedido fue enviado. Te contactaremos a la brevedad.</p>
      </div>
    );
  }

  return (
    <section className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold mb-4">Datos de contacto</h1>
      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm mb-1">Nombre</label>
          <input
            required
            className="w-full border rounded px-3 h-10"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            required
            type="email"
            className="w-full border rounded px-3 h-10"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Teléfono</label>
          <input
            required
            className="w-full border rounded px-3 h-10"
            placeholder="Ej: 1123456789"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Dirección</label>
          <input
            className="w-full border rounded px-3 h-10"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Observaciones</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows="3"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-custom px-4 py-2 rounded-xl border hover:shadow disabled:opacity-50 active:scale-95"
        >
          {loading ? "Enviando..." : "Enviar pedido"}
        </button>
      </form>
    </section>
  );
}
