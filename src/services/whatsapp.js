export function normalizeWhatsAppNumber(value) {
  const number = String(value ?? "").trim().replace(/[\s().-]/g, "").replace(/^\+/, "");
  return /^[1-9][0-9]{7,14}$/.test(number) ? number : null;
}

export function propertyWhatsAppUrl(number, title, propertyUrl) {
  const phone = normalizeWhatsAppNumber(number);
  if (!phone) return null;
  const message = `Hola, me interesa el inmueble "${title}". Quisiera más información y coordinar una visita.\n${propertyUrl}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
