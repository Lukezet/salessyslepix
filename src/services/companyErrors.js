export function companyCreationError(error) {
  const status = error.response?.status;
  if (status === 401) return "Tu sesión venció o no es válida. Volvé a iniciar sesión para crear la empresa.";
  if (status === 403) return "No tenés permisos para crear empresas. Ingresá con una cuenta administradora de la plataforma.";
  if (!error.response) return "No pudimos confirmar la creación. Revisá tu conexión y el listado de empresas antes de volver a intentar.";
  if (status >= 500) return "El servidor no pudo completar la solicitud. Revisá el listado de empresas antes de volver a intentar.";
  const data = error.response.data;
  if (status === 400 || status === 409 || status === 422) {
    const validation = Object.values(data?.errors ?? {}).flat().filter((value) => typeof value === "string");
    if (validation.length) return validation.join(" ");
    const message = data?.message ?? data?.Message ?? data?.error;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "No se pudo crear la empresa. Revisá los datos e intentá nuevamente.";
}
