import { axiosClient } from "../lib/axiosClient";

// Public tenant capabilities. The API remains the source of truth: these values
// only control what is offered by the UI, never authorization.
export async function getTenantConfig() {
  const { data } = await axiosClient.get("/api/tenant/config");
  return data;
}

export async function getPublicCompanyProfile(slug) {
  const { data } = await axiosClient.get(`/api/public/companies/${encodeURIComponent(slug)}/profile`);
  return data;
}

export async function updateTenantConfig(payload) {
  const { data } = await axiosClient.put("/api/tenant/config", payload);
  return data;
}

export async function uploadTenantLogo(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await axiosClient.post("/api/tenant/config/logo", formData);
  return data;
}
