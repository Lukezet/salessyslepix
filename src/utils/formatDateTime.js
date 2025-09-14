export const formatDateTime = (iso, opts = {}) => {
  if (!iso) return "";
  // Si no trae 'Z' ni offset, asumimos que es UTC y le agregamos 'Z'
  const hasTZ = /[zZ]|[+-]\d{2}:\d{2}$/.test(iso);
  const d = new Date(hasTZ ? iso : iso + "Z");

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/San_Juan",
    ...opts,
  }).format(d);
};