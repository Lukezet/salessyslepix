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
