import { orderWhatsAppUrl } from "../services/whatsapp";

export default function OrderWhatsAppActions({ order }) {
  const takenUrl = orderWhatsAppUrl(order, "taken");
  if (!takenUrl) return null;
  return <div className="flex flex-wrap gap-2">
    <a href={takenUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-current px-2.5 py-1.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2" aria-label={`Avisar por WhatsApp que el pedido ${order.id} fue tomado`} title="Abrir WhatsApp con el mensaje de pedido tomado">Avisar: pedido tomado</a>
    <a href={orderWhatsAppUrl(order, "ready")} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-current px-2.5 py-1.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2" aria-label={`Avisar por WhatsApp que el pedido ${order.id} está listo para retirar`} title="Abrir WhatsApp con el mensaje de pedido listo para retirar">Avisar: listo para retirar</a>
  </div>;
}
