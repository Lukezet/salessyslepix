export function normalizeWhatsAppNumber(value) {
  const number = String(value ?? "").trim().replace(/[\s().-]/g, "").replace(/^\+/, "");
  return /^[1-9][0-9]{7,14}$/.test(number) ? number : null;
}

export function articleWhatsAppUrl(number, title, articleUrl, kind = "artículo") {
  const phone = normalizeWhatsAppNumber(number);
  if (!phone) return null;
  const message = `Hola, quisiera consultar por el ${kind} "${title || "publicado"}". ¿Podrían darme más información?\n${articleUrl}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export const propertyWhatsAppUrl = (number, title, url) => articleWhatsAppUrl(number, title, url, "inmueble");

export function shouldUseWhatsAppWeb(userAgent = globalThis.navigator?.userAgent ?? "", maxTouchPoints = globalThis.navigator?.maxTouchPoints ?? 0) {
  const mobile = /Android|iPhone|iPad|iPod/i.test(userAgent)
    || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1);
  return !mobile;
}

export function orderWhatsAppUrl(order, notification, companyName = "", useWeb = shouldUseWhatsAppWeb()) {
  const phone = normalizeWhatsAppNumber(order?.customerPhone);
  if (!phone || order?.state === "Cancelled" || order?.state === "Delivered") return null;
  const messages = {
    taken: "✅ Tu pedido ha sido tomado y está en preparación. 👨‍🍳\n⏳ En breve te avisaremos cuando esté listo.",
    ready: "🛍️ Tu pedido ya está listo y te espera para retirar. ✅\n¡Gracias por elegirnos! 🙌",
  };
  if (!messages[notification]) return null;
  const greeting = order.customerName?.trim() ? `¡Hola ${order.customerName.trim()}! 👋` : "¡Hola! 👋";
  const company = companyName.trim() ? `\nSomos ${companyName.trim()}.` : "";
  const text = encodeURIComponent(`${greeting}${company}\n\n🧾 Pedido #${order.id}\n${messages[notification]}`);
  // On computers avoid the click-to-chat redirect/desktop-app handoff.
  // Keep one UTF-8 encoding of the complete message, including joined emoji.
  return useWeb
    ? `https://web.whatsapp.com/send?phone=${phone}&text=${text}`
    : `https://wa.me/${phone}?text=${text}`;
}
