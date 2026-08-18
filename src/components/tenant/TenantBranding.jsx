import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTenantBranding, useTenantConfig } from "../../store/tenantConfig";

const CSS_VARIABLES = {
  primary: "--tenant-color-primary",
  primaryHover: "--tenant-color-primary-hover",
  onPrimary: "--tenant-color-on-primary",
  surface: "--tenant-color-surface",
  text: "--tenant-color-text",
  footer: "--tenant-color-footer",
};

function faviconHref(logoUrl, isPublicPortal) {
  if (!isPublicPortal || !logoUrl) return "/vite.svg";

  // No se puede añadir una query string a una data URL: pasa a formar parte de
  // la imagen y deja de ser válida. Las URLs remotas sí se cache-bustean al
  // cambiar de logo para que el navegador actualice la pestaña de inmediato.
  return logoUrl.startsWith("data:")
    ? logoUrl
    : `${logoUrl}${logoUrl.includes("?") ? "&" : "?"}favicon=1`;
}

function faviconMimeType(href) {
  if (href.startsWith("data:image/")) return href.slice(5, href.indexOf(";"));
  if (/\.svg(?:$|[?#])/i.test(href)) return "image/svg+xml";
  if (/\.png(?:$|[?#])/i.test(href)) return "image/png";
  if (/\.jpe?g(?:$|[?#])/i.test(href)) return "image/jpeg";
  if (/\.webp(?:$|[?#])/i.test(href)) return "image/webp";
  return null;
}

/** Applies validated tenant branding globally without trusting arbitrary CSS. */
export default function TenantBranding() {
  const { logoUrl, theme } = useTenantBranding();
  const tenantName = useTenantConfig((state) => state.config?.name ?? "Lepix");
  const location = useLocation();
  const isPublicPortal = Boolean(location.pathname.match(/^\/[^/]+(?:\/home)?$/));

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(CSS_VARIABLES).forEach(([key, variable]) => {
      root.style.setProperty(variable, theme[key]);
    });
    root.style.setProperty("--tenant-logo-url", logoUrl ? `url("${logoUrl}")` : "none");
    const href = faviconHref(logoUrl, isPublicPortal);
    const favicon = document.querySelector("#app-favicon") ?? document.querySelector("link[rel~='icon']");
    if (favicon) {
      favicon.href = href;
      favicon.setAttribute("sizes", "any");
      const type = faviconMimeType(href);
      if (type) favicon.type = type;
      else favicon.removeAttribute("type");
    }
    let shortcut = document.querySelector("link[rel='shortcut icon']");
    if (!shortcut) { shortcut = document.createElement("link"); shortcut.rel = "shortcut icon"; document.head.append(shortcut); }
    shortcut.href = href;
    document.title = isPublicPortal ? tenantName : "Lepix";
  }, [isPublicPortal, logoUrl, tenantName, theme]);

  return null;
}
