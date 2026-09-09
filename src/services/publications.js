import { resolveMediaSource } from "./mediaSource";
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
  return (Array.isArray(data) ? data : (data?.items ?? [])).map(normalizePublicationMedia);
}

export async function getPublicPublication(companySlug, publicationSlug, options = {}) {
  const { signal } = options;
  const { data } = await axiosClient.get(
    `/api/public/companies/${encodeURIComponent(companySlug)}/publications/${encodeURIComponent(publicationSlug)}`,
    { signal },
  );
  if (!data?.publication) return normalizePublicationMedia(data);
  return normalizePublicationMedia({
    ...data.publication,
    location: data.location ?? data.publication.location,
    property: { ...(data.publication.property ?? {}), ...(data.property ?? {}) },
    vehicle: { ...(data.publication.vehicle ?? {}), ...(data.vehicle ?? {}) },
    agents: data.agents ?? [],
    videoUrls: data.videoUrls ?? data.publication.videoUrls ?? [],
  });
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

export async function getPublicationDrafts() {
  const { data } = await axiosClient.get("/api/publications/drafts");
  return data;
}
export async function publishPublication(id) {
  const { data } = await axiosClient.post(`/api/publications/${id}/publish`);
  return data;
}

function normalizePublicationMedia(publication) {
  if (!publication) return publication;
  const source = (url) => resolveMediaSource(url, import.meta.env.VITE_API_BASE_URL, window.location.origin);
  const media = (items) => items?.map((item) => typeof item === "string" ? source(item) : { ...item, url: source(item.url) }).filter(Boolean);
  return {
    ...publication,
    imageUrls: media(publication.imageUrls),
    images: media(publication.images),
    media: media(publication.media),
    coverUrl: source(publication.coverUrl),
  };
}
