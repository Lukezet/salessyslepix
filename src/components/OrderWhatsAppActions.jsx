import { orderWhatsAppUrl } from "../services/whatsapp";
import { useTenantConfig } from "../store/tenantConfig";
import { CheckCheck, CookingPot, MessageCircle } from "lucide-react";

export default function OrderWhatsAppActions({ order }) {
  const companyName = useTenantConfig((s) => s.config?.name ?? "");
  const takenUrl = orderWhatsAppUrl(order, "taken", companyName);
  if (!takenUrl) return null;
  return <div className="order-whatsapp-actions flex flex-wrap gap-2">
    <a href={takenUrl} target="_blank" rel="noopener noreferrer" className="order-whatsapp-action" aria-label={`Avisar por WhatsApp que el pedido ${order.id} fue tomado`} title="Abrir WhatsApp con el mensaje de pedido tomado"><MessageCircle size={18} aria-hidden="true" /><span>Pedido tomado</span><CookingPot size={15} aria-hidden="true" /></a>
    <a href={orderWhatsAppUrl(order, "ready", companyName)} target="_blank" rel="noopener noreferrer" className="order-whatsapp-action" aria-label={`Avisar por WhatsApp que el pedido ${order.id} está listo para retirar`} title="Abrir WhatsApp con el mensaje de pedido listo para retirar"><MessageCircle size={18} aria-hidden="true" /><span>Listo para retirar</span><CheckCheck size={15} aria-hidden="true" /></a>
  </div>;
}
