import { axiosClient } from "../lib/axiosClient";

export async function createPublication(payload) {
  const { data } = await axiosClient.post("/api/publications", payload);
  return data;
}

export async function updatePublication(id, payload) {
  const { data } = await axiosClient.put(`/api/publications/${id}`, payload);
  return data;
}

export async function closePublication(id) {
  await axiosClient.post(`/api/publications/${id}/close`);
}

export async function getPublicPublications(companySlug, params = {}) {
  const { signal, ...query } = params;
  const { data } = await axiosClient.get(
    `/api/public/companies/${encodeURIComponent(companySlug)}/publications`,
    { params: query, signal },
  );
  return Array.isArray(data) ? data : (data?.items ?? []);
}

export async function getPublicPublication(companySlug, publicationSlug, options = {}) {
  const { signal } = options;
  const { data } = await axiosClient.get(
    `/api/public/companies/${encodeURIComponent(companySlug)}/publications/${encodeURIComponent(publicationSlug)}`,
    { signal },
  );
  if (!data?.publication) return data;
  return {
    ...data.publication,
    location: data.location ?? data.publication.location,
    property: { ...(data.publication.property ?? {}), ...(data.property ?? {}) },
    vehicle: { ...(data.publication.vehicle ?? {}), ...(data.vehicle ?? {}) },
    agents: data.agents ?? [],
  };
}

export async function uploadPropertyImage(file) {
  const body = new FormData();
  body.append("file", file);
  const { data } = await axiosClient.post("/api/media/property-image", body);
  return data.url;
}

export async function uploadVehicleImage(file) {
  const body = new FormData();
  body.append("file", file);
  const { data } = await axiosClient.post("/api/media/vehicle-image", body);
  return data.url;
}
