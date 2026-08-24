import { create } from "zustand";
import { getPublicCompanyProfile, getTenantConfig, updateTenantConfig, uploadTenantLogo } from "../services/tenantConfig";
import { getFallbackCompanyBySlug } from "../services/companies";

export const DEFAULT_FEATURES = Object.freeze({
  store: false,
  realEstate: false,
  vehicles: false,
  interactiveMap: false,
  appointments: false,
  googleCalendar: false,
  publicExactAddress: false,
  components: {},
});

export const DEFAULT_BRANDING = Object.freeze({
  logoUrl: null,
  theme: Object.freeze({
    primary: "#facc15",
    primaryHover: "#eab308",
    onPrimary: "#171717",
    surface: "#ffffff",
    text: "#171717",
    footer: "#262626",
  }),
});

const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function safeHex(value, fallback) {
  return typeof value === "string" && HEX_COLOR_PATTERN.test(value.trim())
    ? value.trim()
    : fallback;
}

function safeLogoUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  const candidate = value.trim();

  // En el modo local la creación de empresas persiste la imagen como data URL.
  // Es un formato válido para <img> y para favicon, pero no pasa por new URL con
  // el filtro HTTP/HTTPS de abajo.
  if (/^data:image\/(?:avif|bmp|gif|jpe?g|png|svg\+xml|webp);base64,/i.test(candidate)) {
    return candidate;
  }

  try {
    // El almacenamiento local de la API responde rutas como /uploads/...;
    // deben resolverse contra la API, no contra el servidor de Vite.
    const assetBaseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    const url = new URL(candidate, assetBaseUrl);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function normalizeFeatures(config) {
  const source = config?.features ?? config?.featureFlags ?? config ?? {};

  return {
    ...DEFAULT_FEATURES,
    store: Boolean(source.store ?? source.Store ?? source.shop ?? false),
    realEstate: Boolean(source.realEstate ?? source.RealEstate ?? source.real_estate),
    vehicles: Boolean(source.vehicles ?? source.Vehicles),
    interactiveMap: Boolean(source.interactiveMap ?? source.InteractiveMap ?? source.map),
    appointments: Boolean(source.appointments ?? source.Appointments ?? source.visits),
    googleCalendar: Boolean(source.googleCalendar ?? source.GoogleCalendar ?? source.calendar),
    publicExactAddress: Boolean(source.publicExactAddress ?? source.PublicExactAddress),
    components: source.components ?? source.Components ?? {},
  };
}

function normalizeBranding(config) {
  const branding = config?.branding ?? config?.features ?? config ?? {};
  const theme = branding.theme ?? {};

  return {
    logoUrl: safeLogoUrl(branding.logoUrl ?? branding.logo),
    theme: {
      primary: safeHex(theme.primary ?? branding.primaryColor, DEFAULT_BRANDING.theme.primary),
      primaryHover: safeHex(theme.primaryHover ?? branding.accentColor, DEFAULT_BRANDING.theme.primaryHover),
      onPrimary: safeHex(theme.onPrimary ?? branding.onPrimaryColor, DEFAULT_BRANDING.theme.onPrimary),
      surface: safeHex(theme.surface ?? branding.surfaceColor, DEFAULT_BRANDING.theme.surface),
      text: safeHex(theme.text, "#171717"),
      footer: safeHex(theme.footer ?? branding.secondaryColor, DEFAULT_BRANDING.theme.footer),
    },
  };
}

function mergeLocalFallbackLogo(config, slug) {
  // La API es siempre prioritaria. Durante desarrollo, una empresa creada en
  // el modo de respaldo puede conservar su logo sólo en este navegador, aun
  // cuando la empresa homónima de la API todavía no tenga LogoUrl.
  if (!import.meta.env.DEV || normalizeBranding(config).logoUrl) return config;

  const localCompany = getFallbackCompanyBySlug(slug);
  const localLogoUrl = localCompany?.branding?.logoUrl;
  if (!localLogoUrl) return config;

  return {
    ...config,
    features: {
      ...(config?.features ?? {}),
      logoUrl: localLogoUrl,
    },
  };
}

export const useTenantConfig = create((set, get) => ({
  config: null,
  features: DEFAULT_FEATURES,
  branding: DEFAULT_BRANDING,
  isLoading: false,
  isLoaded: false,

  load: async (slug = null) => {
    if (get().isLoading || (get().isLoaded && get().config?.slug === slug)) return;

    set({ isLoading: true });
    try {
      const response = slug ? await getPublicCompanyProfile(slug) : await getTenantConfig();
      const config = slug ? mergeLocalFallbackLogo(response, slug) : response;
      set({
        config,
        features: normalizeFeatures(config),
        branding: normalizeBranding(config),
        isLoaded: true,
        isLoading: false,
      });
    } catch {
      // A failed config request must not enable an uncontracted module.
      set({
        config: null,
        features: DEFAULT_FEATURES,
        branding: DEFAULT_BRANDING,
        isLoaded: true,
        isLoading: false,
      });
    }
  },

  hasFeature: (feature) => Boolean(get().features[feature]),

  updateBranding: async (branding) => {
    const config = await updateTenantConfig({ branding });
    set({
      config,
      features: normalizeFeatures(config),
      branding: normalizeBranding(config),
      isLoaded: true,
    });
    return config;
  },

  uploadBrandingLogo: async (file) => {
    const result = await uploadTenantLogo(file);
    if (!result?.logoUrl) throw new Error("La carga no devolvió una URL de logo válida.");
    return result.logoUrl;
  },
}));

export function useFeature(feature) {
  return useTenantConfig((state) => Boolean(state.features[feature]));
}

export function useTenantBranding() {
  return useTenantConfig((state) => state.branding);
}
