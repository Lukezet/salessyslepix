import { axiosClient } from "../lib/axiosClient";
export async function getInventory() { return (await axiosClient.get("/api/inventory")).data; }
export async function setStock(id, quantity, expectedQuantity) {
  await axiosClient.put(`/api/inventory/${id}/stock`, { quantity, expectedQuantity });
}
export async function createCombo(name, price, components) {
  return (await axiosClient.post("/api/inventory/combos", { name, price, components })).data;
}
export const inventoryError = (error) => error?.response?.data?.message ?? error?.response?.data?.Message ?? "No se pudo completar la operación. Intentá nuevamente.";
