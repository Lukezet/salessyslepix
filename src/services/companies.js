import { axiosClient } from "../lib/axiosClient";

const FALLBACK_STORAGE_KEY = "platform-companies-fallback";

const DEFAULT_COMPANIES = [
  {
    id: "lepix",
    name: "LePix",
    slug: "lepix",
    description: "Catálogo y ventas de tecnología.",
    city: "Buenos Aires",
    isActive: true,
    features: { store: true, realEstate: false, vehicles: false, interactiveMap: false },
    branding: { logoUrl: null, theme: { primary: "#FACC15", secondary: "#EAB308", accent: "#171717", surface: "#FFFFFF", onPrimary: "#171717" } },
  },
];

function readFallback() {
  try {
    const saved = JSON.parse(localStorage.getItem(FALLBACK_STORAGE_KEY));
    return Array.isArray(saved) ? saved : DEFAULT_COMPANIES;
  } catch {
    return DEFAULT_COMPANIES;
  }
}

function saveFallback(companies) {
  localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(companies));
}

function resolveLogoUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const candidate = value.trim();
  if (candidate.startsWith("data:image/")) return candidate;

  try {
    return new URL(candidate, import.meta.env.VITE_API_BASE_URL || window.location.origin).href;
  } catch {
    return null;
  }
}

/**
 * Dev-only bridge for portals created while the platform API was unavailable.
 * The public portal still takes its configuration from the API; this only
 * supplies a locally persisted logo when the API record has no logo yet.
 */
export function getFallbackCompanyBySlug(slug) {
  const normalizedSlug = String(slug ?? "").trim().toLowerCase();
  if (!normalizedSlug) return null;

  return readFallback()
    .map(normalizeCompany)
    .find((company) => company.slug?.toLowerCase() === normalizedSlug) ?? null;
}

function normalizeCompany(company) {
  const features = company.features ?? {};
  const existingTheme = company.branding?.theme ?? {};
  return {
    ...company,
    features: { ...features, store: features.store ?? company.slug === "lepix", components: features.components ?? features.Components ?? {} },
    branding: {
      logoUrl: resolveLogoUrl(company.branding?.logoUrl ?? features.logoUrl),
      theme: {
        primary: existingTheme.primary ?? features.primaryColor ?? "#1F2937",
        secondary: existingTheme.secondary ?? features.secondaryColor ?? "#374151",
        accent: existingTheme.accent ?? features.accentColor ?? "#0EA5E9",
        surface: existingTheme.surface ?? features.surfaceColor ?? "#FFFFFF",
        onPrimary: existingTheme.onPrimary ?? features.onPrimaryColor ?? "#FFFFFF",
      },
    },
  };
}

function fileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el logo."));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

async function dataUrlToFile(dataUrl, name) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], name, { type: blob.type });
}

async function reconcileLocalLogo(company, localCompanies) {
  if (!import.meta.env.DEV || company.branding?.logoUrl) return company;

  const localCompany = localCompanies.find((item) => item.slug?.toLowerCase() === company.slug?.toLowerCase());
  const localLogoUrl = localCompany?.branding?.logoUrl;
  if (!localLogoUrl?.startsWith("data:image/")) return company;

  try {
    const extension = localLogoUrl.match(/^data:image\/(png|jpeg|webp|svg\+xml);/i)?.[1]
      ?.replace("jpeg", "jpg").replace("svg+xml", "svg") ?? "png";
    return await uploadPlatformCompanyLogo(company.id, await dataUrlToFile(localLogoUrl, `logo.${extension}`));
  } catch {
    // Preserve the image in the current view if the server is temporarily not
    // ready to receive it; a subsequent visit will retry the reconciliation.
    return normalizeCompany({ ...company, branding: { ...company.branding, logoUrl: localLogoUrl } });
  }
}

/**
 * GET /api/platform/clients -> PagedResult<PlatformClientDto>
 * POST /api/platform/clients -> PlatformClientDto
 */
function fromApi(company) {
  return normalizeCompany(company);
}

export async function listPlatformCompanies() {
  try {
    const { data } = await axiosClient.get("/api/platform/clients");
    const localCompanies = readFallback().map(normalizeCompany);
    const companies = await Promise.all((data.items ?? []).map((company) => reconcileLocalLogo(fromApi(company), localCompanies)));
    return { companies, source: "api" };
  } catch {
    return { companies: readFallback().map(normalizeCompany), source: "fallback" };
  }
}

export async function createPlatformCompany(payload, logoFile = null) {
  let data;
  try {
    ({ data } = await axiosClient.post("/api/platform/clients", payload));
  } catch {
    const logoUrl = logoFile ? await fileAsDataUrl(logoFile) : null;
    const company = {
      id: `local-${Date.now()}`,
      slug: payload.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      isActive: true,
      ...payload,
      branding: {
        logoUrl,
        theme: {
          primary: payload.features.primaryColor,
          secondary: payload.features.secondaryColor,
          accent: payload.features.accentColor,
          surface: payload.features.surfaceColor,
          onPrimary: payload.features.onPrimaryColor,
        },
      },
    };
    const companies = [...readFallback(), company];
    saveFallback(companies);
    return { company: normalizeCompany(company), source: "fallback" };
  }
  const company = fromApi(data);
  if (!logoFile) return { company, source: "api" };
  return { company: await uploadPlatformCompanyLogo(company.id, logoFile), source: "api" };
}

export async function uploadPlatformCompanyLogo(id, file) {
  const body = new FormData();
  body.append("file", file);
  const { data } = await axiosClient.post(`/api/platform/clients/${id}/logo`, body);
  return fromApi(data);
}

export async function updatePlatformCompany(id, payload, logoFile = null) {
  let data;
  try {
    ({ data } = await axiosClient.put(`/api/platform/clients/${id}`, payload));
  } catch (error) {
    const companies = readFallback();
    const index = companies.findIndex((company) => String(company.id) === String(id));
    if (index < 0) throw error;
    const logoUrl = logoFile ? await fileAsDataUrl(logoFile) : companies[index].branding?.logoUrl ?? null;
    companies[index] = normalizeCompany({
      ...companies[index],
      isActive: payload.isActive,
      features: payload.features,
      branding: {
        logoUrl,
        theme: {
          primary: payload.features.primaryColor,
          secondary: payload.features.secondaryColor,
          accent: payload.features.accentColor,
          surface: payload.features.surfaceColor,
          onPrimary: payload.features.onPrimaryColor,
        },
      },
    });
    saveFallback(companies);
    return companies[index];
  }
  const company = fromApi(data);
  if (!logoFile) return company;
  return await uploadPlatformCompanyLogo(id, logoFile);
}
