const PREVIEW_SESSION_KEY = "lepix.visitor-preview";

// La vista previa vive en un iframe. Algunas navegaciones pueden perder el
// query string, por eso la sesión del iframe conserva el modo demo hasta que
// se cierre esa previsualización.
export function isVisitorPreview(search = window.location.search) {
  const previewFromUrl = new URLSearchParams(search).get("preview") === "1";
  try {
    if (previewFromUrl) window.sessionStorage.setItem(PREVIEW_SESSION_KEY, "1");
    return previewFromUrl || window.sessionStorage.getItem(PREVIEW_SESSION_KEY) === "1";
  } catch {
    return previewFromUrl;
  }
}
