import { axiosClient } from "../lib/axiosClient";

export async function createPublication(payload) {
  const { data } = await axiosClient.post("/api/publications", payload);
  return data;
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
