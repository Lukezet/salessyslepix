import { axiosClient } from "../lib/axiosClient";
export async function getInventory() { return (await axiosClient.get("/api/inventory")).data; }
export async function setStock(id, quantity, expectedQuantity) {
  await axiosClient.put(`/api/inventory/${id}/stock`, { quantity, expectedQuantity });
}
export async function createCombo(name, price, components, images) {
  return (await axiosClient.post("/api/inventory/combos", { name, price, components, images })).data;
}
export const inventoryError = (error) => error?.response?.data?.message ?? error?.response?.data?.Message ?? error?.response?.data?.error ?? "No se pudo completar la operación. Intentá nuevamente.";

export async function createSubproduct(input) {
  return (await axiosClient.post("/api/inventory/subproducts", input)).data;
}

export async function getMeasurementUnits() { return (await axiosClient.get("/api/inventory/units")).data; }
export async function createMeasurementUnit(name) { return (await axiosClient.post("/api/inventory/units", { name })).data; }
export async function getProductFormFields() { return (await axiosClient.get("/api/inventory/form-fields")).data; }
export async function getIngredientGroups() { return (await axiosClient.get("/api/inventory/ingredient-groups")).data; }
export async function createIngredientGroup(name) { return (await axiosClient.post("/api/inventory/ingredient-groups", { name })).data; }
export async function assignIngredientGroup(variantId, ingredientGroupId) { await axiosClient.put(`/api/inventory/subproducts/${variantId}/group`, { ingredientGroupId }); }
