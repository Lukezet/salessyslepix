export const formatPrice = (n, currency = "ARS") =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(Number(n || 0));