import { axiosClient } from "../lib/axiosClient";

export async function searchPropertyAddress(query, { signal } = {}) {
  const { data } = await axiosClient.get("/api/property-geocoding/search", { params: { query }, signal });
  return Array.isArray(data) ? data[0] ?? null : null;
}

export async function reversePropertyAddress(latitude, longitude, { signal } = {}) {
  const { data } = await axiosClient.get("/api/property-geocoding/reverse", { params: { latitude, longitude }, signal });
  return data;
}
