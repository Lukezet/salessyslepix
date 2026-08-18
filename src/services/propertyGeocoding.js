import { axiosClient } from "../lib/axiosClient";

export async function searchPropertyAddress(query) {
  const { data } = await axiosClient.get("/api/property-geocoding/search", { params: { query } });
  return Array.isArray(data) ? data[0] ?? null : null;
}

export async function reversePropertyAddress(latitude, longitude) {
  const { data } = await axiosClient.get("/api/property-geocoding/reverse", { params: { latitude, longitude } });
  return data;
}
